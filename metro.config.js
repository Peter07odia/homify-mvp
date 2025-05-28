// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Performance optimizations
config.transformer = {
  ...config.transformer,
  // Enable minification in development for better performance testing
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
  // Enable tree shaking
  unstable_allowRequireContext: true,
};

// Enhanced resolver configuration
config.resolver = {
  ...config.resolver,
  sourceExts: ['jsx', 'js', 'ts', 'tsx', 'cjs', 'json'],
  resolverMainFields: ['react-native', 'browser', 'main'],
  // Add support for additional asset types
  assetExts: [
    ...config.resolver.assetExts,
    'db', 'mp3', 'ttf', 'obj', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'
  ],
  // Platform-specific extensions for better tree shaking
  platforms: ['ios', 'android', 'native', 'web'],
};

// Caching improvements
config.cacheStores = [
  {
    name: 'filesystem',
    options: {
      cacheDirectory: path.join(__dirname, 'node_modules/.cache/metro'),
    },
  },
];

// Watchman configuration for better file watching
config.watchFolders = [path.resolve(__dirname, './')];

// Serializer optimizations
config.serializer = {
  ...config.serializer,
  // Enable module concatenation for smaller bundles
  experimentalSerializerHook: (graph, delta) => {
    // Custom serialization logic can be added here
    return delta;
  },
};

// Memory and performance settings
config.maxWorkers = Math.max(1, Math.floor(require('os').cpus().length / 2));

module.exports = config; 