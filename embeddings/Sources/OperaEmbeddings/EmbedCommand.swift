import ArgumentParser
import Embeddings
import Foundation
import CoreML

@main
struct OperaEmbed: AsyncParsableCommand {
    static let configuration = CommandConfiguration(
        commandName: "opera-embed",
        abstract: "Generate sentence embeddings for opera graph nodes using Core ML"
    )

    @Option(help: "Input graph.json path")
    var input: String

    @Option(help: "Output embeddings.json path")
    var output: String

    @Option(help: "Directory for cached model files")
    var modelsDir: String = "\(FileManager.default.homeDirectoryForCurrentUser.path)/Violetta-Opera-Graph-Relationship-Maps/static/models"

    @Option(help: "Cosine similarity threshold for adding similar_to edges")
    var threshold: Double = 0.7

    @Option(help: "Batch size for embedding")
    var batchSize: Int = 32

    func run() async throws {
        let inputURL = URL(fileURLWithPath: input)
        let outputURL = URL(fileURLWithPath: output)

        print("Loading graph from \(input)...")
        let graphData = try Data(contentsOf: inputURL)
        let graph = try JSONDecoder().decode(GraphDocument.self, from: graphData)

        print("Loading sentence embedding model (all-MiniLM-L6-v2)...")
        let modelBundle = try await Bert.loadModelBundle(
            from: "sentence-transformers/all-MiniLM-L6-v2"
        )

        // Build text representations for each node
        let operaNodes = graph.nodes.filter { $0.attributes.type == "opera" }
        let texts = operaNodes.map { node -> String in
            var parts = [node.attributes.label]
            if let composer = node.attributes.composerName { parts.append("by \(composer)") }
            if let year = node.attributes.premiereYear { parts.append("\(year)") }
            if let genre = node.attributes.genre { parts.append(genre) }
            if let language = node.attributes.language { parts.append(language) }
            if let era = node.attributes.eraBucket { parts.append(era) }
            return parts.joined(separator: ", ")
        }

        print("Embedding \(texts.count) opera nodes in batches of \(batchSize)...")

        var allEmbeddings: [String: [Float]] = [:]

        for batchStart in stride(from: 0, to: texts.count, by: batchSize) {
            let batchEnd = min(batchStart + batchSize, texts.count)
            let batchTexts = Array(texts[batchStart..<batchEnd])
            let batchNodes = Array(operaNodes[batchStart..<batchEnd])

            let encoded = try modelBundle.batchEncode(batchTexts)

            // encoded is an MLTensor of shape [batchSize, embeddingDim]
            for (i, node) in batchNodes.enumerated() {
                let embedding = encoded[i]
                let floats = await embedding.shapedArray(of: Float.self).scalars
                allEmbeddings[node.key] = Array(floats)
            }

            let progress = Int(Double(batchEnd) / Double(texts.count) * 100)
            print("  \(batchEnd)/\(texts.count) (\(progress)%)")
        }

        // Compute cosine similarity edges
        print("Computing cosine similarity edges (threshold: \(threshold))...")
        var similarityEdges: [[String: Any]] = []

        let keys = Array(allEmbeddings.keys)
        for i in 0..<keys.count {
            for j in (i + 1)..<keys.count {
                guard let a = allEmbeddings[keys[i]],
                      let b = allEmbeddings[keys[j]] else { continue }

                let sim = cosineSimilarity(a, b)
                if sim >= Float(threshold) {
                    similarityEdges.append([
                        "source": keys[i],
                        "target": keys[j],
                        "weight": Double(sim),
                    ])
                }
            }
        }

        print("Found \(similarityEdges.count) similar pairs above threshold")

        // Write embeddings.json
        let dimension = allEmbeddings.values.first?.count ?? 384
        let result: [String: Any] = [
            "model": "sentence-transformers/all-MiniLM-L6-v2",
            "dimension": dimension,
            "embeddings": allEmbeddings.mapValues { $0.map { Double($0) } },
            "similarityEdges": similarityEdges,
        ]

        let resultData = try JSONSerialization.data(withJSONObject: result, options: [.prettyPrinted, .sortedKeys])
        try resultData.write(to: outputURL)
        print("Embeddings written to \(output)")
    }

    private func cosineSimilarity(_ a: [Float], _ b: [Float]) -> Float {
        guard a.count == b.count, !a.isEmpty else { return 0 }
        var dot: Float = 0
        var normA: Float = 0
        var normB: Float = 0
        for i in 0..<a.count {
            dot += a[i] * b[i]
            normA += a[i] * a[i]
            normB += b[i] * b[i]
        }
        let denom = sqrt(normA) * sqrt(normB)
        return denom > 0 ? dot / denom : 0
    }
}

// Re-use the GraphDocument types from data_fetch
struct GraphDocument: Codable, Sendable {
    var attributes: GraphAttributes
    var options: GraphOptions
    var nodes: [GraphNode]
    var edges: [GraphEdge]
}

struct GraphAttributes: Codable, Sendable {
    var name: String
    var version: String
    var generatedAt: String
}

struct GraphOptions: Codable, Sendable {
    var type: String
    var multi: Bool
    var allowSelfLoops: Bool
}

struct GraphNode: Codable, Sendable {
    var key: String
    var attributes: NodeAttributes
}

struct NodeAttributes: Codable, Sendable {
    var label: String
    var type: String
    var composerId: String?
    var composerName: String?
    var premiereYear: Int?
    var premiereLocation: String?
    var language: String?
    var genre: String?
    var eraBucket: String?
    var decade: String?
    var birthYear: Int?
    var deathYear: Int?
    var nationality: String?
    var x: Double
    var y: Double
    var size: Double
    var color: String
    var projX: Double?
    var projY: Double?
}

struct GraphEdge: Codable, Sendable {
    var key: String
    var source: String
    var target: String
    var attributes: EdgeAttributes
}

struct EdgeAttributes: Codable, Sendable {
    var type: String
    var weight: Double
}
