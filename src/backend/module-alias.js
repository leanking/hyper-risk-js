const moduleAlias = require('module-alias');
const path = require('path');

// Register module aliases
moduleAlias.addAliases({
  '@backend': path.resolve(__dirname),
  '@frontend': path.resolve(__dirname, '../frontend'),
  '@shared': path.resolve(__dirname, '../shared')
}); 