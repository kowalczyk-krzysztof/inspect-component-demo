const path = require('node:path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')

const repoRoot = path.resolve(__dirname, '..')

module.exports = (_env, argv) => {
  const isProduction = argv.mode === 'production'

  return {
    entry: path.resolve(repoRoot, 'src/main.tsx'),
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].[contenthash].js',
      clean: true,
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          options: {
            // ts-loader would otherwise search upward from each source file and pick the wrong tsconfig.
            configFile: path.resolve(__dirname, 'tsconfig.json'),
            compilerOptions: {
              // tsconfig.json sets noEmit for editor type-checking; ts-loader needs real output.
              noEmit: false,
              // Required so ts-loader's per-module source maps have accurate original positions.
              sourceMap: true,
              // Dev builds use React's jsxDEV runtime so the inspector can read `_debugStack`.
              jsx: isProduction ? 'react-jsx' : 'react-jsxdev',
            },
          },
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({ template: path.resolve(__dirname, 'public/index.html') }),
      new webpack.DefinePlugin({
        // Absolute path to the repo root, used by the inspector to build editor deep links.
        __PROJECT_ROOT__: JSON.stringify(repoRoot),
      }),
    ],
    devServer: {
      port: 5273,
      open: false,
    },
    // A real, fetchable .map file (rather than 'eval'-based devtools) lets the inspector resolve
    // accurate original positions at runtime - see src/inspector/lib/source.ts.
    devtool: 'source-map',
  }
}
