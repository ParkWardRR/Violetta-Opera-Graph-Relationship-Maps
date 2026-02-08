import ArgumentParser
import Foundation

struct RISMCommand: AsyncParsableCommand {
    static let configuration = CommandConfiguration(
        commandName: "rism",
        abstract: "Fetch opera source data from RISM Online"
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

        let outputFile = "rism_sources.json"

        if !force && cache.isFresh(outputFile) {
            print("[rism] Using cached data")
            return
        }

        print("[rism] Fetching from rism.online...")

        guard let url = URL(string: "https://rism.online/search?q=opera&mode=sources&format=json&rows=500") else {
            throw HTTPClientError.invalidURL
        }

        do {
            let data = try await client.get(
                url,
                headers: ["Accept": "application/json"],
                domain: "rism.online"
            )
            try cache.write(data, to: outputFile)
            print("[rism] Saved \(data.count) bytes to \(outputFile)")
        } catch {
            print("[rism] Warning: \(error). RISM data is supplementary, continuing.")
        }
    }
}
