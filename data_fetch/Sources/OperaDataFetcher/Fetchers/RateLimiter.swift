import Foundation

actor RateLimiter {
    private var lastRequestTime: [String: Date] = [:]
    private let defaultInterval: TimeInterval

    init(requestsPerSecond: Double = 2.0) {
        self.defaultInterval = 1.0 / requestsPerSecond
    }

    func waitIfNeeded(for domain: String) async throws {
        if let lastTime = lastRequestTime[domain] {
            let elapsed = Date().timeIntervalSince(lastTime)
            if elapsed < defaultInterval {
                let delay = defaultInterval - elapsed
                try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
            }
        }
        lastRequestTime[domain] = Date()
    }
}
