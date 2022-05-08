const path = require('path');

// Dummy config for IDE
module.exports = {
  resolve: {
    extensions: ['.js', '.json', '.vue'],
    alias: {
      '~': path.resolve(__dirname, './##SOURCE_PATH##'),
    },
  },
};
