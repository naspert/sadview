const fs = require('fs');
const graph = require('graphology');
const gexf = require('graphology-gexf');
const degree = require('graphology-metrics/degree');
const randomLayout = require('graphology-layout/random');
const FA2Layout = require('graphology-layout-forceatlas2');
const palette = require('google-palette');
const random = require('random');
const seedrandom = require('seedrandom');
const pako = require('pako');
const path = require('path');



function loadGraphFile(filename) {
    if (!filename.endsWith('gexf.gz')) {
        console.log('Unknown file type for ',filename, ' -> skipping');
        return;
    }
    const data = fs.readFileSync(filename);
    const str = pako.inflate(data, {to:'string'});
    return graph.from(gexf.parse(graph, str));
}

function checkLayout(g) {
    g.forEachNode((node, attributes) => {
        if (isNaN(attributes.x) || isNaN(attributes.y))
            console.log(node, attributes);
    });
}

function computeFa2Layout(inputGraphFile, outputGraphFile, num_iter) {
    const graphObj = loadGraphFile(inputGraphFile);
    if (!graphObj)
        return;
    console.log('Loaded ', inputGraphFile);
    console.time('Counting communities / max weight');
    const numCommunities = graphObj.nodes()
        .reduce((acc, curr) => Math.max(acc, graphObj.getNodeAttribute(curr, 'community')), 0) + 1;
    const maxWeight = graphObj.edges()
        .reduce((acc, curr) => Math.max(acc, graphObj.getEdgeAttribute(curr, 'weight')), 0);
    const PALETTE = palette('mpn65', Math.max(8, numCommunities)).map(function (colorStr) {
        return '#' + colorStr;
    });
    graphObj.setAttribute('num communities', numCommunities);
    graphObj.setAttribute('max weight', maxWeight);
    console.timeEnd('Counting communities / max weight');

    console.log('found ' + numCommunities + ' communities');
    console.log('Max weight = ' + maxWeight );
    console.time('Degree computation');
    degree.assign(graphObj);
    console.timeEnd('Degree computation');
    random.use(seedrandom('lts2kings'));
    randomLayout.assign(graphObj, {
        scale: 400, center: 0, rng: () => {
            return random.float();
        }
    });
    console.time('Node Attributes');
    graphObj.nodes().forEach(node => {
        const attr = graphObj.getNodeAttributes(node);

        graphObj.mergeNodeAttributes(node, {
            color: PALETTE[attr.community],
            //size: Math.max(4, attr.degree*0.5)
            size: Math.max(4, 2.5 * Math.log(attr.degree + 1)),
            zIndex: 0
        });
    });
    console.timeEnd('Node Attributes');

    console.time('Edge Attributes');
    graphObj.edges().forEach(edge => {
        const attr = graphObj.getEdgeAttributes(edge);
        const edgeAlpha = Number((20 + 235*attr['weight']/maxWeight).toFixed(0)).toString(16);
        graphObj.mergeEdgeAttributes(edge, {
            color: `#cccccc${edgeAlpha}`,
            size: (attr['weight']*10/maxWeight + 1).toFixed(0),
            zIndex: 0
        });
    });
    console.timeEnd('Edge Attributes');

    console.time('Layout');
    FA2Layout.assign(graphObj, num_iter, {});
    checkLayout(graphObj);
    console.timeEnd('Layout');
    console.time('Output');
    const graphStr = JSON.stringify(graphObj.export());
    const compressedGraph = pako.gzip(graphStr);
    fs.writeFileSync(outputGraphFile, Buffer.from(compressedGraph));
    console.timeEnd('Output');
    console.log('Saved ', outputGraphFile);
}

if (!process.argv[2] || !process.argv[3]) {
    console.log('Usage: layout input_dir output_dir num_iter');
} else {
    const numIter = process.argv[4] ? parseInt(process.argv[4]):200;
    const files = fs.readdirSync(process.argv[2]); // list files in input dir
    files.forEach(f => {
        const fout = f.replace('gexf.gz', 'json.gz');
        computeFa2Layout(path.join(process.argv[2], f), path.join(process.argv[3], fout), numIter)
    });
}
