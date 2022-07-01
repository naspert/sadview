const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const webpack = require('webpack')

module.exports = {
        entry: {
            index: './src/index.js',
            viewer: './src/viewer.js',
            hashtags: './src/hashtags.js'
        },
        output: {
            filename: '[name].js',
            path: path.resolve(__dirname, 'public'),
        },
        devtool: 'inline-source-map',
        devServer: {
            contentBase: path.join(__dirname, 'public'),
            compress: true,
            port: 9000
        },
        plugins: [
            new CopyWebpackPlugin({ patterns: [
               {from: 'static'}
            ]}),
            new Dotenv(),
            new webpack.ProvidePlugin({
                $: 'jquery',
                jQuery: 'jquery'
            })
        ],
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    }
};
