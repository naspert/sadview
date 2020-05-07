const path = require('path');
const Dotenv = require('dotenv-webpack');
const webpack = require('webpack')

module.exports = {
        entry: './src/index.js',
        output: {
            filename: 'main.js',
            path: path.resolve(__dirname, 'public'),
        },
        devtool: 'inline-source-map',
        devServer: {
            contentBase: path.join(__dirname, 'public'),
            compress: true,
            port: 9000
        },
        plugins: [
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
