const path = require('path')

module.exports = {
  entry: './src/p5.bezier.js',
  output: {
    path: path.resolve(__dirname, 'libs'),
    filename: 'p5.bezier.min.js',
    library: 'p5bezier',
  },
}
