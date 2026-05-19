// Learn more https://docs.expo.dev/guides/customizing-metro
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo so Metro reloads when shared packages change.
config.watchFolders = [workspaceRoot];

// Tell Metro where to find packages — pnpm's symlinks need both layers.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Follow pnpm symlinks rather than treating them as opaque files.
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
