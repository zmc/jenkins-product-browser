module.exports = function override(config, env) {
  if (!config.optimization.splitChunks.cacheGroups) {
    config.optimization.splitChunks.cacheGroups = {};
  }
  config.optimization.splitChunks.cacheGroups.vendor = {
    test: /[\\/]node_modules[\\/](@material-ui\/styles)[\\/]/,
    name: 'vendor',
    chunks: 'all',
  }
  /*
  if (!config.entry) config.entry = {};
  if (!config.entry.vendor) config.entry.vendor = [];
  config.entry.vendor = ["@material-ui/styles"];

  if (!config.plugins) config.plugins = [];

  config.plugins.push(
    (process.env.NODE_ENV === 'production') ?
    new CopyWebpackPlugin([{from: 'src/lib/legacyLib.js'}]) :
    new CopyWebpackPlugin([{from: 'src/lib/legacyLib.js', to: 'dist'}])
  );
  */

  return config;
}
