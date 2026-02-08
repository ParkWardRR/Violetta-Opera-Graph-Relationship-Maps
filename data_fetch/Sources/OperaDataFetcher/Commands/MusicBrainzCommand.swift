import ArgumentParser
import Foundation

struct MusicBrainzCommand: AsyncParsableCommand {
    static let configuration = CommandConfiguration(
        commandName: "musicbrainz",
        abstract: "Fetch opera work data from MusicBrainz"
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
            rateLimiter: RateLimiter(requestsPerSecond: 1)
        )

        let outputFile = "musicbrainz_works.json"

        if !force && cache.isFresh(outputFile) {
            print("[musicbrainz] Using cached data")
            return
        }

        print("[musicbrainz] Fetching opera works (1 req/sec)...")

        var allWorks: [[String: Any]] = []
        var offset = 0
        let limit = 100

        while true {
            guard let url = URL(string: "https://musicbrainz.org/ws/2/work?query=type:opera&fmt=json&limit=\(limit)&offset=\(offset)") else {
                break
            }

            let data = try await client.get(
                url,
                headers: ["Accept": "application/json"],
                domain: "musicbrainz.org"
            )

            guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let works = json["works"] as? [[String: Any]] else {
                break
            }

            if works.isEmpty { break }

            allWorks.append(contentsOf: works)
            print("[musicbrainz] Fetched \(allWorks.count) works...")

            let count = (json["count"] as? Int) ?? 0
            offset += limit
            if offset >= count || offset >= 2000 { break }  // Cap at 2000 for now
        }

        let result: [String: Any] = [
            "works": allWorks,
            "count": allWorks.count,
        ]

        let resultData = try JSONSerialization.data(withJSONObject: result, options: [.prettyPrinted, .sortedKeys])
        try cache.write(resultData, to: outputFile)
        print("[musicbrainz] Saved \(allWorks.count) works to \(outputFile)")
    }
}
