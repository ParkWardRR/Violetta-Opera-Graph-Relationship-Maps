import Foundation

actor HTTPClient {
    private let session: URLSession
    private let rateLimiter: RateLimiter

    init(userAgent: String = "ViolettaOperaGraph/1.0", rateLimiter: RateLimiter? = nil) {
        let config = URLSessionConfiguration.default
        config.httpAdditionalHeaders = ["User-Agent": userAgent]
        config.timeoutIntervalForRequest = 30
        config.waitsForConnectivity = true
        self.session = URLSession(configuration: config)
        self.rateLimiter = rateLimiter ?? RateLimiter()
    }

    func get(_ url: URL, headers: [String: String] = [:], domain: String? = nil) async throws -> Data {
        let domainKey = domain ?? url.host ?? "unknown"
        try await rateLimiter.waitIfNeeded(for: domainKey)

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        for (key, value) in headers {
            request.setValue(value, forHTTPHeaderField: key)
        }

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw HTTPClientError.invalidResponse
        }

        if httpResponse.statusCode == 429 {
            if let retryAfter = httpResponse.value(forHTTPHeaderField: "Retry-After"),
               let seconds = Double(retryAfter) {
                print("  Rate limited. Waiting \(seconds)s...")
                try await Task.sleep(nanoseconds: UInt64(seconds * 1_000_000_000))
                return try await get(url, headers: headers, domain: domain)
            }
            throw HTTPClientError.rateLimited
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw HTTPClientError.statusCode(httpResponse.statusCode)
        }

        return data
    }

    func getSPARQL(query: String, format: String = "text/csv") async throws -> Data {
        var components = URLComponents(string: "https://query.wikidata.org/sparql")!
        components.queryItems = [URLQueryItem(name: "query", value: query)]

        guard let url = components.url else {
            throw HTTPClientError.invalidURL
        }

        return try await get(
            url,
            headers: ["Accept": format],
            domain: "wikidata.org"
        )
    }
}

enum HTTPClientError: Error, CustomStringConvertible {
    case invalidResponse
    case invalidURL
    case rateLimited
    case statusCode(Int)

    var description: String {
        switch self {
        case .invalidResponse: return "Invalid HTTP response"
        case .invalidURL: return "Invalid URL"
        case .rateLimited: return "Rate limited (429)"
        case .statusCode(let code): return "HTTP \(code)"
        }
    }
}
