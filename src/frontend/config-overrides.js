const { override } = require('customize-cra');

module.exports = override(
  // Customize webpack config
  (config) => {
    // Find the source-map-loader rule
    const sourceMapLoaderRule = config.module.rules.find(
      (rule) => rule.enforce === 'pre' && rule.use && rule.use.some(
        (loader) => loader.loader && loader.loader.includes('source-map-loader')
      )
    );

    // If the rule exists, modify it to exclude node_modules
    if (sourceMapLoaderRule) {
      sourceMapLoaderRule.exclude = /node_modules/;
    }

    // Add ignoreWarnings configuration
    if (!config.ignoreWarnings) {
      config.ignoreWarnings = [];
    }
    
    config.ignoreWarnings.push({
      module: /node_modules/,
      message: /Failed to parse source map/,
    });

    return config;
  }
); 