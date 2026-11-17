const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('node:path');
const projectRoot = path.resolve(process.env.WORKSPHERE_JS_ROOT || __dirname);

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  projectRoot,
  maxWorkers: 2,
  // Native builds may use a short Windows drive alias while Node resolves packages on the original drive.
  watchFolders: [
    __dirname,
    path.dirname(path.dirname(require.resolve('react-native/package.json'))),
  ],
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
