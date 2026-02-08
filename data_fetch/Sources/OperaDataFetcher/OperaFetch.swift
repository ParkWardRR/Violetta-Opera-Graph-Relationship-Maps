import ArgumentParser
import Foundation

@main
struct OperaFetch: AsyncParsableCommand {
    static let configuration = CommandConfiguration(
        commandName: "opera-fetch",
        abstract: "Fetch opera data from various sources and build the relationship graph",
        subcommands: [
            WikidataCommand.self,
            OpenOpusCommand.self,
            RISMCommand.self,
            MusicBrainzCommand.self,
            IMSLPCommand.self,
            FetchAllCommand.self,
            ProcessCommand.self,
        ],
        defaultSubcommand: FetchAllCommand.self
    )
}
