const path = require('path')

const webpack = require('webpack')
const TerserPlugin = require('terser-webpack-plugin')

const packageJSON = require('./package.json')

module.exports = {
  mode: 'production',
  entry: './src/p5.bezier.js',
  output: {
    path: path.resolve(__dirname, 'lib'),
    filename: 'p5.bezier.min.js',
    library: 'p5bezier',
    libraryTarget: 'umd',
    sourceMapFilename: 'p5.bezier.min.js.map',
  },
  devtool: 'source-map',
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
          },
        },
      }),
      new webpack.BannerPlugin(`
      @license
      ${packageJSON.name} Version ${packageJSON.version}
      https://github.com/peilingjiang/p5.bezier
      
      Copyright 2018-${new Date().getFullYear()} Peiling Jiang
      Available under MIT license
      `),
    ],
  },
}
