module.exports = {
  name: "POS Dryclean",
  slug: "pos-dryclean",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.expo-iggy.pos-dryclean",
    // This config will completely exclude Square SDK from simulator builds
    excludedArchitectures: {
      simulator: [
        "i386",
        "x86_64"
      ]
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    package: "com.expo_iggy.pos_dryclean"
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  plugins: [
    // This is a more direct way to exclude specific native modules in simulator
    ["./plugins/exclude-square-sdk.js"]
  ]
};
