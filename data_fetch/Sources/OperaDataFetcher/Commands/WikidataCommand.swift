import ArgumentParser
import Foundation

struct WikidataCommand: AsyncParsableCommand {
    static let configuration = CommandConfiguration(
        commandName: "wikidata",
        abstract: "Fetch opera data from Wikidata SPARQL endpoint"
    )

    @Option(help: "Data directory for output")
    var dataDir: String = "\(FileManager.default.homeDirectoryForCurrentUser.path)/Violetta-Opera-Graph-Relationship-Maps"

    @Flag(help: "Force re-fetch, ignore cache")
    var force: Bool = false

    func run() async throws {
        let dataDirURL = URL(fileURLWithPath: dataDir)
        let cache = CacheManager(dataDir: dataDirURL)
        let client = HTTPClient(
            userAgent: "ViolettaOperaGraph/1.0",
            rateLimiter: RateLimiter(requestsPerSecond: 2)
        )

        let queries: [(name: String, file: String)] = [
            ("operas", "operas.sparql"),
            ("composers", "composers.sparql"),
            ("relationships", "relationships.sparql"),
        ]

        for (name, file) in queries {
            let outputFile = "\(name).csv"

            if !force && cache.isFresh(outputFile) {
                print("[\(name)] Using cached data")
                continue
            }

            print("[\(name)] Fetching from Wikidata...")

            let queryPath = findQueryFile(named: file)
            guard let queryPath, let queryString = try? String(contentsOfFile: queryPath, encoding: .utf8) else {
                print("[\(name)] Warning: Query file \(file) not found, skipping")
                continue
            }

            do {
                let data = try await client.getSPARQL(query: queryString)
                try cache.write(data, to: outputFile)
                print("[\(name)] Saved \(data.count) bytes to \(outputFile)")
            } catch {
                print("[\(name)] Error: \(error)")
            }
        }
    }

    private func findQueryFile(named filename: String) -> String? {
        // Look relative to the executable, then in known locations
        let candidates = [
            URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent().appendingPathComponent("queries/\(filename)").path,
            FileManager.default.currentDirectoryPath + "/queries/\(filename)",
            FileManager.default.currentDirectoryPath + "/data_fetch/queries/\(filename)",
        ]
        return candidates.first { FileManager.default.fileExists(atPath: $0) }
    }
}
