import ArgumentParser
import Foundation

struct IMSLPCommand: AsyncParsableCommand {
    static let configuration = CommandConfiguration(
        commandName: "imslp",
        abstract: "Fetch opera metadata from IMSLP"
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

        let outputFile = "imslp_works.json"

        if !force && cache.isFresh(outputFile) {
            print("[imslp] Using cached data")
            return
        }

        print("[imslp] Fetching opera category members...")

        var allPages: [[String: Any]] = []
        var cmcontinue: String? = nil

        repeat {
            var urlString = "https://imslp.org/api.php?action=query&list=categorymembers&cmtitle=Category:Operas&format=json&cmlimit=500"
            if let cont = cmcontinue {
                urlString += "&cmcontinue=\(cont)"
            }

            guard let url = URL(string: urlString) else { break }

            let data = try await client.get(
                url,
                headers: ["Accept": "application/json"],
                domain: "imslp.org"
            )

            guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let query = json["query"] as? [String: Any],
                  let members = query["categorymembers"] as? [[String: Any]] else {
                break
            }

            allPages.append(contentsOf: members)
            print("[imslp] Fetched \(allPages.count) pages...")

            if let cont = json["continue"] as? [String: Any] {
                cmcontinue = cont["cmcontinue"] as? String
            } else {
                cmcontinue = nil
            }

        } while cmcontinue != nil && allPages.count < 5000

        let result: [String: Any] = [
            "pages": allPages,
            "count": allPages.count,
        ]

        let resultData = try JSONSerialization.data(withJSONObject: result, options: [.prettyPrinted, .sortedKeys])
        try cache.write(resultData, to: outputFile)
        print("[imslp] Saved \(allPages.count) pages to \(outputFile)")
    }
}
