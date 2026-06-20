const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: path.resolve(__dirname, 'src/index.js'),
    output: {
      path: path.resolve(__dirname, 'dist'),
      // emitted JS bundle is unused (CSS is extracted); kept out of the way
      filename: '.tasmeem.bundle.js',
      clean: false,
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader'],
        },
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: isProduction ? 'tasmeem.min.css' : 'tasmeem.css',
      }),
    ],
    optimization: {
      minimize: isProduction,
      minimizer: [new CssMinimizerPlugin()],
    },
    devServer: {
      static: [
        { directory: path.resolve(__dirname, 'demo') },
        { directory: path.resolve(__dirname, 'dist'), publicPath: '/dist' },
      ],
      port: 8080,
    },
  };
};
