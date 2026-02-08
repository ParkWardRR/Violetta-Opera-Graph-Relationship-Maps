import Foundation

struct CacheManager: Sendable {
    let rawDir: URL
    let ttlHours: Int

    init(dataDir: URL, ttlHours: Int = 168) {
        self.rawDir = dataDir.appendingPathComponent("data/raw")
        self.ttlHours = ttlHours
    }

    func cachedPath(for filename: String) -> URL {
        rawDir.appendingPathComponent(filename)
    }

    func isFresh(_ filename: String) -> Bool {
        let path = cachedPath(for: filename)
        guard let attrs = try? FileManager.default.attributesOfItem(atPath: path.path),
              let modDate = attrs[.modificationDate] as? Date else {
            return false
        }
        let age = Date().timeIntervalSince(modDate)
        return age < Double(ttlHours) * 3600
    }

    func read(_ filename: String) -> Data? {
        let path = cachedPath(for: filename)
        return try? Data(contentsOf: path)
    }

    func write(_ data: Data, to filename: String) throws {
        let path = cachedPath(for: filename)
        let dir = path.deletingLastPathComponent()
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        try data.write(to: path)
    }
}
