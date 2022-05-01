module.exports = {
  extends: ['@up-line/eslint-config'],
  settings: {
    'import/resolver': {
      alias: {
        map: [['~', './##SOURCE_PATH##/']],
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
};
