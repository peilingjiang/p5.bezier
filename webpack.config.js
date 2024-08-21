const path = require('node:path')

const webpack = require('webpack')
const TerserPlugin = require('terser-webpack-plugin')

const packageJSON = require('./package.json')

const config = {
  mode: 'production',
  entry: './src/p5.bezier.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.json$/,
        type: 'json',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.json'],
  },
  output: {
    path: path.resolve(__dirname, 'lib'),
    filename: 'p5.bezier.min.js',
    library: {
      name: 'initBezier',
      type: 'umd',
      export: 'default',
    },
    globalObject: 'this',
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

module.exports = (env) => {
  if (env.development) {
    return Object.assign({}, config, {
      mode: 'development',
      optimization: {
        minimize: false,
      },
      watch: true,
    })
  }

  return config
}
