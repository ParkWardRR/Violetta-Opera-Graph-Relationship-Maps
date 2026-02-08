import Foundation

struct OpenOpusWorkDump: Codable, Sendable {
    let works: [OpenOpusWork]?

    init(from decoder: Decoder) throws {
        // Open Opus dump is a flat array or an object with status
        if let array = try? [OpenOpusWork](from: decoder) {
            works = array
        } else {
            let container = try decoder.singleValueContainer()
            works = try container.decode([OpenOpusWork].self)
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(works)
    }
}

struct OpenOpusWork: Codable, Sendable {
    let id: String?
    let title: String?
    let subtitle: String?
    let genre: String?
    let composer: OpenOpusComposer?

    enum CodingKeys: String, CodingKey {
        case id, title, subtitle, genre, composer
    }
}

struct OpenOpusComposer: Codable, Sendable {
    let id: String?
    let name: String?
    let completeName: String?
    let birth: String?
    let death: String?
    let epoch: String?
    let portrait: String?

    enum CodingKeys: String, CodingKey {
        case id, name
        case completeName = "complete_name"
        case birth, death, epoch, portrait
    }
}
