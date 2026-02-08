// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "OperaEmbeddings",
    platforms: [.macOS(.v15)],
    dependencies: [
        .package(url: "https://github.com/apple/swift-argument-parser", from: "1.5.0"),
        .package(url: "https://github.com/jkrukowski/swift-embeddings", from: "0.0.26"),
    ],
    targets: [
        .executableTarget(
            name: "opera-embed",
            dependencies: [
                .product(name: "ArgumentParser", package: "swift-argument-parser"),
                .product(name: "Embeddings", package: "swift-embeddings"),
            ],
            path: "Sources/OperaEmbeddings"
        ),
    ]
)
