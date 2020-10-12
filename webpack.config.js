const path = require('path')

module.exports = {
  entry: './src/p5.bezier.js',
  output: {
    path: path.resolve(__dirname, 'lib'),
    filename: 'p5.bezier.min.js',
    library: 'p5bezier',
    libraryTarget: 'umd',
  },
}
