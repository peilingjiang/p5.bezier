const path = require('path')

module.exports = {
  entry: './src/p5.bezier.min.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'p5.bezier.min.js',
    library: 'p5bezier',
  },
}
