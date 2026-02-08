import Foundation

struct GraphDocument: Codable, Sendable {
    var attributes: GraphAttributes
    var options: GraphOptions
    var nodes: [GraphNode]
    var edges: [GraphEdge]
}

struct GraphAttributes: Codable, Sendable {
    var name: String
    var version: String
    var generatedAt: String
}

struct GraphOptions: Codable, Sendable {
    var type: String = "mixed"
    var multi: Bool = false
    var allowSelfLoops: Bool = false
}

struct GraphNode: Codable, Sendable {
    var key: String
    var attributes: NodeAttributes
}

struct NodeAttributes: Codable, Sendable {
    var label: String
    var type: String  // "opera", "composer", "venue", "librettist"
    var composerId: String?
    var composerName: String?
    var premiereYear: Int?
    var premiereLocation: String?
    var language: String?
    var genre: String?
    var eraBucket: String?
    var decade: String?
    var birthYear: Int?
    var deathYear: Int?
    var nationality: String?
    var x: Double
    var y: Double
    var size: Double
    var color: String
    var projX: Double?
    var projY: Double?
}

struct GraphEdge: Codable, Sendable {
    var key: String
    var source: String
    var target: String
    var attributes: EdgeAttributes
}

struct EdgeAttributes: Codable, Sendable {
    var type: String  // "composed_by", "libretto_by", "premiered_at", "similar_to", "based_on"
    var weight: Double
}
