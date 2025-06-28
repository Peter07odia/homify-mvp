// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Basic transformer configuration
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
};

// Basic resolver configuration
config.resolver = {
  ...config.resolver,
  sourceExts: ['jsx', 'js', 'ts', 'tsx', 'cjs', 'json'],
  assetExts: [
    ...config.resolver.assetExts,
    'db', 'mp3', 'ttf', 'obj', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'
  ],
};

module.exports = config; 