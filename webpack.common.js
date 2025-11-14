const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = process.env.BUILD_ENV === 'production';
  const ASSET_PATH = isProduction ? '/multicluster-search/' : '/';

  return {
  entry: './src/index.tsx',
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: ASSET_PATH,
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@app': path.resolve(__dirname, 'src/app'),
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      base: ASSET_PATH,
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'public', to: '.', noErrorOnMissing: true }
      ],
    }),
  ],
};
};

