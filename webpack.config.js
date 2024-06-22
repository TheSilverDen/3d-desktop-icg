const path = require('path');
const fs = require('fs');
const WatchExternalFilesPlugin = require('webpack-watch-external-files-plugin');
const DoneWebpackPlugin = require('done-webpack-plugin');
const { generateIndexHtml, filter } = require('./generate-index-html');

let entries = {
    index: './src/index.ts',
    //uiutils: './src/ui-utilities.ts'
}

fs.readdirSync(path.resolve(__dirname, 'src')).forEach(file => {
    if (file.endsWith('-boilerplate.ts')) {
        let exercise = file.replace('-boilerplate.ts', '');
        entries[exercise] = `./src/${file}`;
    }
});


module.exports = {
    mode: 'development',
    devtool: 'inline-source-map',
    entry: entries,
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    devServer: {
        static: path.join(__dirname, 'dist')
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.s[ac]ss$/i,
                use: ['style-loader', 'css-loader', 'sass-loader']
            }, 
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                // test: /\.glsl$/i,
                test: /\.(glsl|vs|fs|vert|frag)$/i,
                use: 'raw-loader'
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    plugins: [
        //Watch for changes in the dist directory and trigger a recompile.
        new WatchExternalFilesPlugin({
            files: ['./dist/**/*','!./dist/index.html'],
           
        }),
        //Generate the index.html file when the build is done.
        new DoneWebpackPlugin((stats) => {
//            console.info('stats', stats);
            generateIndexHtml();
        }, (error) => { console.error(error)})

    ],
};
