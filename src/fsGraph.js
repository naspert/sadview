const computeLayout = require('./layoutCore').computeLayout;
const graph = require('graphology');
const DirectedGraph = require('graphology').DirectedGraph;
const gexf = require('graphology-gexf');
const fs = require('fs');
const pako = require('pako');
const path = require('path');

function loadGraphFile(filename) {
    let str = '';
    if (filename.endsWith('gexf.gz')) {
        const data = fs.readFileSync(filename);
        str = pako.inflate(data, {to:'string'});
    } else if (filename.endsWith('.gexf')) {
        str = fs.readFileSync(filename, 'utf-8');
    } else {
        console.log('Unknown file type for ',filename, ' -> skipping');
        return;
    }

    return new DirectedGraph.from(gexf.parse(graph, str));
}

function saveCompressedOutput(compressedGraph, outputGraphFile) {
    fs.writeFileSync(outputGraphFile, Buffer.from(compressedGraph));
    console.log('Saved ', outputGraphFile);
}

function readLexFile(clusterLexFile) {
    return JSON.parse(fs.readFileSync(clusterLexFile, 'utf-8'));
}

function saveClusterInfo(info, outputFile) {
    fs.writeFileSync(outputFile, JSON.stringify(info));
}

function processDataDir(startDir, dataDir, options) {
    const curDir = path.join(startDir, dataDir)
    const outDir = path.join(options.outDir, dataDir)
    fs.mkdirSync(outDir, {recursive: true})
    const files = fs.readdirSync(curDir)
    if (files.includes('.processed')) {// nothing to do
        console.log('Directory ', dataDir, ' already processed. Skipping.')
        return
    }
    files.forEach(f => {
        if (f.endsWith('.gexf')) {
            const fout = f.replace('.gexf', '.json.gz')
            console.log('Processing ', f, ' --> ', fout)
            const inputGraphFile = path.join(curDir, f);
            const graphObj = loadGraphFile(inputGraphFile);
            if (!graphObj)
                return;
            console.log('Loaded ', inputGraphFile);
            const clusterLex = readLexFile(path.join(curDir, 'clusters.json'));
            const g = computeLayout(graphObj, options.method, options.numIter, clusterLex);
            saveCompressedOutput(g.compressedGraph, path.join(outDir, fout));
            saveClusterInfo(g.clusterInfo, path.join(outDir, 'cluster_info.json'));
        } else if (f.endsWith('.json')) {
            fs.copyFileSync(path.join(curDir, f), path.join(outDir, f));
        }
    });
    fs.closeSync(fs.openSync(path.join(curDir, '.processed'), 'w'))
}

function processDirectories(startDir, options) {
    const dirents = fs.readdirSync(startDir, {withFileTypes:true}); // list files in input dir
    dirents.forEach(d => {
        if (!d.isDirectory() || !d.name.match('\\d{4}-\\d{2}-\\d{2}'))
            return
        processDataDir(startDir, d.name, options)
    });
}

exports.processDirectories = processDirectories

