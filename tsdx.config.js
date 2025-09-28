const postcss = require('rollup-plugin-postcss');

module.exports = {
  rollup(config, options) {
    config.plugins.push(postcss({
      extract: true, // Выделяем CSS в отдельный файл
      minimize: true, // Минифицируем CSS в production mode
    }));
    return config;
  },
};