const path = require('path');

module.exports = {
  // This is a custom webpack config to fix source map warnings
  // It will be merged with the default create-react-app webpack config
  
  // Disable source map warnings for node_modules
  module: {
    rules: [
      {
        test: /\.(js|mjs|jsx|ts|tsx)$/,
        enforce: 'pre',
        use: ['source-map-loader'],
        exclude: [
          // Exclude all node_modules from source-map-loader
          /node_modules/
        ],
      },
    ],
  },
  ignoreWarnings: [
    // Ignore warnings raised by source-map-loader
    {
      module: /node_modules/,
      message: /Failed to parse source map/,
    },
  ],
}; 