import Foundation

struct SPARQLResponse: Codable, Sendable {
    let head: SPARQLHead
    let results: SPARQLResults
}

struct SPARQLHead: Codable, Sendable {
    let vars: [String]
}

struct SPARQLResults: Codable, Sendable {
    let bindings: [[String: SPARQLBinding]]
}

struct SPARQLBinding: Codable, Sendable {
    let type: String
    let value: String
    let datatype: String?

    enum CodingKeys: String, CodingKey {
        case type, value, datatype
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        type = try container.decode(String.self, forKey: .type)
        value = try container.decode(String.self, forKey: .value)
        datatype = try container.decodeIfPresent(String.self, forKey: .datatype)
    }
}
