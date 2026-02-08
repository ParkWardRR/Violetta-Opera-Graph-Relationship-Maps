// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "OperaDataFetcher",
    platforms: [.macOS(.v15)],
    dependencies: [
        .package(url: "https://github.com/apple/swift-argument-parser", from: "1.5.0"),
        .package(url: "https://github.com/dehesa/CodableCSV.git", from: "0.6.7"),
        .package(url: "https://github.com/jpsim/Yams.git", from: "5.1.0"),
    ],
    targets: [
        .executableTarget(
            name: "opera-fetch",
            dependencies: [
                .product(name: "ArgumentParser", package: "swift-argument-parser"),
                .product(name: "CodableCSV", package: "CodableCSV"),
                .product(name: "Yams", package: "Yams"),
            ],
            path: "Sources/OperaDataFetcher"
        ),
    ]
)
