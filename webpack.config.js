const path = require('node:path')
const { BannerPlugin } = require('webpack')
const TerserPlugin = require('terser-webpack-plugin')
const { name, version } = require('./package.json')

const config = outputDir => ({
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
    path: path.resolve(__dirname, outputDir),
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
      new BannerPlugin(`
      @license
      ${name} Version ${version}
      https://github.com/peilingjiang/p5.bezier
      
      Copyright 2018-${new Date().getFullYear()} Peiling Jiang
      Available under MIT license
      `),
    ],
  },
})

module.exports = env => {
  if (env.development) {
    return Object.assign({}, config('examples/lib'), {
      mode: 'development',
      optimization: {
        minimize: false,
      },
      watch: true,
    })
  }

  return config('lib')
}
