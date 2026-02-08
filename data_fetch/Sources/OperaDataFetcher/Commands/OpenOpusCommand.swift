import ArgumentParser
import Foundation

struct OpenOpusCommand: AsyncParsableCommand {
    static let configuration = CommandConfiguration(
        commandName: "openopus",
        abstract: "Fetch opera data from Open Opus API"
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
            rateLimiter: RateLimiter(requestsPerSecond: 5)
        )

        let outputFile = "openopus_work_dump.json"

        if !force && cache.isFresh(outputFile) {
            print("[openopus] Using cached data")
            return
        }

        print("[openopus] Downloading work dump from api.openopus.org...")

        guard let url = URL(string: "https://api.openopus.org/work/dump.json") else {
            throw HTTPClientError.invalidURL
        }

        let data = try await client.get(url, domain: "openopus.org")
        try cache.write(data, to: outputFile)
        print("[openopus] Saved \(data.count) bytes to \(outputFile)")
    }
}
