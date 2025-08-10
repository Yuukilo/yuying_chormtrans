const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  const baseConfig = {
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'js/[name].js',
      clean: false
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader'
          ]
        }
      ]
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'manifest.json',
            to: 'manifest.json'
          },
          {
            from: 'popup.html',
            to: 'popup.html'
          },
          {
            from: 'css',
            to: 'css'
          },
          {
            from: 'icons',
            to: 'icons'
          },
          {
            from: 'js/api-adapters.js',
            to: 'js/api-adapters.js'
          },
          {
            from: 'js/prompt-manager.js',
            to: 'js/prompt-manager.js'
          },
          {
            from: 'js/cache-manager.js',
            to: 'js/cache-manager.js'
          },
          {
            from: 'js/translation-service.js',
            to: 'js/translation-service.js'
          },
          {
            from: 'js/ocr-translator.js',
            to: 'js/ocr-translator.js'
          }
        ]
      }),
      ...(isProduction ? [
        new MiniCssExtractPlugin({
          filename: 'css/[name].css'
        })
      ] : [])
    ],
    resolve: {
      extensions: ['.js', '.json']
    },
    devtool: isProduction ? false : 'source-map',
    optimization: {
      minimize: isProduction
    },
    mode: isProduction ? 'production' : 'development'
  };

  // 为不同的入口点创建不同的配置
  return [
    // Background script 配置 - 使用适合 Chrome Extension Service Worker 的配置
    {
      ...baseConfig,
      entry: {
        background: './js/background.js'
      },
      output: {
        ...baseConfig.output,
        clean: false
      },
      target: ['web', 'es2020'],
      resolve: {
        ...baseConfig.resolve,
        fallback: {
          "fs": false,
          "path": false,
          "crypto": false
        }
      },
      name: 'background'
    },
    // Content script 和 popup 配置 - 使用 web target
    {
      ...baseConfig,
      entry: {
        content: './js/content.js',
        popup: './js/popup.js'
      },
      target: 'web',
      name: 'web-scripts'
    }
  ];
};