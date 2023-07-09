const HtmlWebpackInjector = require('html-webpack-injector')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const TerserPlugin = require("terser-webpack-plugin")
const CopyPlugin = require("copy-webpack-plugin")
const path = require('path')

module.exports = {
	entry: './src/main.js',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: '[name].[contenthash].js',
		clean: true
	},
	plugins: [
		new CopyPlugin({
			patterns: [{
				from: '**/*',
				to: '[path][name][ext]',
				context: 'public/',
				globOptions: {
					ignore: [
						'**/index.html'
					]
				}
			}],
		}),
		new HtmlWebpackPlugin({
			template: './public/index.html',
			filename: 'index.html',
			chunks: ['main'],
			scriptLoading: 'module',
			chunksConfig: {
				defer: ['main']
			},
			minify: {
				collapseWhitespace: true,
				keepClosingSlash: true,
				removeComments: true,
				removeRedundantAttributes: true,
				removeScriptTypeAttributes: true,
				removeStyleLinkTypeAttributes: true,
				useShortDoctype: true,
				minifyCSS: true
			}
		}),
		new HtmlWebpackInjector()
	],
	optimization: {
		minimizer: [
			new TerserPlugin({
				parallel: true,
				extractComments: false,
				terserOptions: {
					format: {
						comments: false
					}
				}
			})
		]
	},
	devServer: {
		port: 9090,
		static: {
			directory: path.resolve(__dirname, 'public')
		}
	},
	performance: {
		hints: false
	}
}