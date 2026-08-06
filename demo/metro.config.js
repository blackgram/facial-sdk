const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const sdkRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch the SDK source in addition to the example app
config.watchFolders = [sdkRoot];

// Make sure Metro can resolve modules from both the example and SDK node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(sdkRoot, 'node_modules'),
];

// Prevent duplicate React/RN instances — resolve these only from the example app
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
