import ArgumentParser
import CodableCSV
import Foundation

struct ProcessCommand: AsyncParsableCommand {
    static let configuration = CommandConfiguration(
        commandName: "process",
        abstract: "Merge raw data into graph.json"
    )

    @Option(help: "Data directory")
    var dataDir: String = "\(FileManager.default.homeDirectoryForCurrentUser.path)/Violetta-Opera-Graph-Relationship-Maps"

    func run() async throws {
        let dataDirURL = URL(fileURLWithPath: dataDir)
        let rawDir = dataDirURL.appendingPathComponent("data/raw")
        let processedDir = dataDirURL.appendingPathComponent("data/processed")

        try FileManager.default.createDirectory(at: processedDir, withIntermediateDirectories: true)

        print("=== Building graph from raw data ===")

        var composerNodes: [String: GraphNode] = [:]
        var operaNodes: [String: GraphNode] = [:]
        var edges: [GraphEdge] = []

        // 1. Parse Wikidata CSV
        try parseWikidataOperas(rawDir: rawDir, operas: &operaNodes, composers: &composerNodes, edges: &edges)
        try parseWikidataComposers(rawDir: rawDir, composers: &composerNodes)

        // 2. Enrich from Open Opus
        try enrichFromOpenOpus(rawDir: rawDir, operas: &operaNodes, composers: &composerNodes)

        // 3. Compute era buckets and colors
        for key in operaNodes.keys {
            if let year = operaNodes[key]?.attributes.premiereYear {
                operaNodes[key]?.attributes.eraBucket = eraBucket(for: year)
                operaNodes[key]?.attributes.decade = "\(year / 10 * 10)s"
                operaNodes[key]?.attributes.color = eraColor(for: eraBucket(for: year))
            }
        }

        // 4. Compute node sizes based on edge count
        var degree: [String: Int] = [:]
        for edge in edges {
            degree[edge.source, default: 0] += 1
            degree[edge.target, default: 0] += 1
        }

        for key in operaNodes.keys {
            let d = Double(degree[key, default: 1])
            operaNodes[key]?.attributes.size = min(15, max(3, d * 2))
        }
        for key in composerNodes.keys {
            let d = Double(degree[key, default: 1])
            composerNodes[key]?.attributes.size = min(25, max(8, d * 1.5))
        }

        // 5. Assign random initial positions
        var allNodes = Array(composerNodes.values) + Array(operaNodes.values)
        for i in 0..<allNodes.count {
            allNodes[i].attributes.x = Double.random(in: -100...100)
            allNodes[i].attributes.y = Double.random(in: -100...100)
        }

        let graph = GraphDocument(
            attributes: GraphAttributes(
                name: "Violetta Opera Graph",
                version: "1.0.0",
                generatedAt: ISO8601DateFormatter().string(from: Date())
            ),
            options: GraphOptions(),
            nodes: allNodes,
            edges: edges
        )

        let outputPath = processedDir.appendingPathComponent("graph.json")
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        let data = try encoder.encode(graph)
        try data.write(to: outputPath)

        print("Graph written to \(outputPath.path)")
        print("  Nodes: \(allNodes.count) (\(composerNodes.count) composers, \(operaNodes.count) operas)")
        print("  Edges: \(edges.count)")
    }

    // MARK: - Wikidata CSV Parsing

    private func parseWikidataOperas(
        rawDir: URL,
        operas: inout [String: GraphNode],
        composers: inout [String: GraphNode],
        edges: inout [GraphEdge]
    ) throws {
        let path = rawDir.appendingPathComponent("operas.csv")
        guard FileManager.default.fileExists(atPath: path.path) else {
            print("[process] No operas.csv found, skipping Wikidata operas")
            return
        }

        let csvString = try String(contentsOf: path, encoding: .utf8)
        let reader = try CSVReader(input: csvString) {
            $0.headerStrategy = .firstLine
            $0.delimiters.field = ","
        }

        var count = 0
        while let row = try reader.readRow() {
            guard row.count >= 4 else { continue }

            let header = reader.headers
            let values = Dictionary(uniqueKeysWithValues: zip(header, row))

            guard let operaURI = values["opera"],
                  let operaLabel = values["operaLabel"] else { continue }

            let operaKey = wikidataID(from: operaURI)
            let composerURI = values["composer"]
            let composerKey = composerURI.map { wikidataID(from: $0) }

            if operas[operaKey] == nil {
                let yearStr = values["premiereDate"] ?? ""
                let year = parseYear(from: yearStr)

                operas[operaKey] = GraphNode(
                    key: operaKey,
                    attributes: NodeAttributes(
                        label: operaLabel,
                        type: "opera",
                        composerId: composerKey,
                        composerName: values["composerLabel"],
                        premiereYear: year,
                        premiereLocation: values["premierePlaceLabel"],
                        language: values["languageLabel"],
                        genre: values["genreLabel"],
                        x: 0, y: 0, size: 5, color: "#999"
                    )
                )
                count += 1
            }

            if let ck = composerKey {
                if composers[ck] == nil {
                    composers[ck] = GraphNode(
                        key: ck,
                        attributes: NodeAttributes(
                            label: values["composerLabel"] ?? ck,
                            type: "composer",
                            x: 0, y: 0, size: 10, color: "#6c757d"
                        )
                    )
                }

                let edgeKey = "e_\(operaKey)_\(ck)_composed_by"
                if !edges.contains(where: { $0.key == edgeKey }) {
                    edges.append(GraphEdge(
                        key: edgeKey,
                        source: operaKey,
                        target: ck,
                        attributes: EdgeAttributes(type: "composed_by", weight: 1.0)
                    ))
                }
            }
        }

        print("[process] Parsed \(count) operas from Wikidata CSV")
    }

    private func parseWikidataComposers(
        rawDir: URL,
        composers: inout [String: GraphNode]
    ) throws {
        let path = rawDir.appendingPathComponent("composers.csv")
        guard FileManager.default.fileExists(atPath: path.path) else {
            print("[process] No composers.csv found, skipping")
            return
        }

        let csvString = try String(contentsOf: path, encoding: .utf8)
        let reader = try CSVReader(input: csvString) {
            $0.headerStrategy = .firstLine
            $0.delimiters.field = ","
        }

        while let row = try reader.readRow() {
            let header = reader.headers
            let values = Dictionary(uniqueKeysWithValues: zip(header, row))

            guard let composerURI = values["composer"] else { continue }
            let key = wikidataID(from: composerURI)

            if var node = composers[key] {
                if let bd = values["birthDate"] { node.attributes.birthYear = parseYear(from: bd) }
                if let dd = values["deathDate"] { node.attributes.deathYear = parseYear(from: dd) }
                node.attributes.nationality = values["nationalityLabel"]
                composers[key] = node
            }
        }
    }

    // MARK: - Open Opus Enrichment

    private func enrichFromOpenOpus(
        rawDir: URL,
        operas: inout [String: GraphNode],
        composers: inout [String: GraphNode]
    ) throws {
        let path = rawDir.appendingPathComponent("openopus_work_dump.json")
        guard FileManager.default.fileExists(atPath: path.path) else {
            print("[process] No openopus_work_dump.json found, skipping enrichment")
            return
        }

        let data = try Data(contentsOf: path)

        // Open Opus dump format varies - try parsing as generic JSON
        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            print("[process] Could not parse Open Opus dump")
            return
        }

        // The dump is keyed by composer, with works nested
        var enriched = 0
        if let composerGroups = json["composers"] as? [[String: Any]] {
            for group in composerGroups {
                if let works = group["works"] as? [[String: Any]] {
                    for work in works {
                        guard let genre = work["genre"] as? String,
                              genre.lowercased().contains("opera") || genre.lowercased().contains("stage") else {
                            continue
                        }
                        // Try to match by title against existing opera nodes
                        if let title = work["title"] as? String {
                            for key in operas.keys {
                                if operas[key]?.attributes.label.lowercased() == title.lowercased() {
                                    if operas[key]?.attributes.genre == nil {
                                        operas[key]?.attributes.genre = genre
                                    }
                                    enriched += 1
                                }
                            }
                        }
                    }
                }
            }
        }

        print("[process] Enriched \(enriched) operas from Open Opus")
    }

    // MARK: - Helpers

    private func wikidataID(from uri: String) -> String {
        if uri.hasPrefix("http") {
            return uri.components(separatedBy: "/").last ?? uri
        }
        return uri
    }

    private func parseYear(from dateStr: String) -> Int? {
        // Handle formats: "1853", "1853-03-06", "1853-03-06T00:00:00Z"
        let trimmed = dateStr.trimmingCharacters(in: .whitespaces)
        if trimmed.isEmpty { return nil }
        if let year = Int(trimmed) { return year }
        if trimmed.count >= 4, let year = Int(trimmed.prefix(4)) { return year }
        return nil
    }

    private func eraBucket(for year: Int) -> String {
        switch year {
        case ..<1750: return "Baroque"
        case 1750..<1820: return "Classical"
        case 1820..<1850: return "Early Romantic"
        case 1850..<1910: return "Late Romantic"
        case 1910..<1975: return "20th Century"
        default: return "Contemporary"
        }
    }

    private func eraColor(for era: String) -> String {
        switch era {
        case "Baroque": return "#2ecc71"
        case "Classical": return "#3498db"
        case "Early Romantic": return "#9b59b6"
        case "Late Romantic": return "#e74c3c"
        case "20th Century": return "#f39c12"
        case "Contemporary": return "#1abc9c"
        default: return "#999999"
        }
    }
}
