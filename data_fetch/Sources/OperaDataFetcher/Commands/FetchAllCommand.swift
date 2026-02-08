import ArgumentParser
import Foundation

struct FetchAllCommand: AsyncParsableCommand {
    static let configuration = CommandConfiguration(
        commandName: "all",
        abstract: "Fetch from all data sources"
    )

    @Option(help: "Data directory for output")
    var dataDir: String = "\(FileManager.default.homeDirectoryForCurrentUser.path)/Violetta-Opera-Graph-Relationship-Maps"

    @Flag(help: "Force re-fetch, ignore cache")
    var force: Bool = false

    func run() async throws {
        print("=== Fetching from all sources ===\n")

        var wikidataCmd = WikidataCommand()
        wikidataCmd.dataDir = dataDir
        wikidataCmd.force = force
        try await wikidataCmd.run()
        print()

        var openOpusCmd = OpenOpusCommand()
        openOpusCmd.dataDir = dataDir
        openOpusCmd.force = force
        try await openOpusCmd.run()
        print()

        var rismCmd = RISMCommand()
        rismCmd.dataDir = dataDir
        rismCmd.force = force
        try await rismCmd.run()
        print()

        var musicBrainzCmd = MusicBrainzCommand()
        musicBrainzCmd.dataDir = dataDir
        musicBrainzCmd.force = force
        try await musicBrainzCmd.run()
        print()

        var imslpCmd = IMSLPCommand()
        imslpCmd.dataDir = dataDir
        imslpCmd.force = force
        try await imslpCmd.run()

        print("\n=== All sources fetched ===")
    }
}
