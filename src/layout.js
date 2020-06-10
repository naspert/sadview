const fs = require('fs');
const graph = require('graphology');
const DirectedGraph = require('graphology').DirectedGraph;
const gexf = require('graphology-gexf');
const degree = require('graphology-metrics/degree');
const randomLayout = require('graphology-layout/random');
const circlePackLayout = require('graphology-layout/circlepack');
const forceAtlas2 = require('graphology-layout-forceatlas2');
const palette = require('google-palette');
const seedrandom = require('seedrandom');
const pako = require('pako');
const path = require('path');

const MIN_PALETTE_SIZE = 8;
const MAX_PALETTE_SIZE = 65;
const MIN_NODE_SIZE = 5;
const MAX_NODE_SIZE = 30;


function rng() {
    return seedrandom('lts2kings');
}

function buildHashTagList(graphObj) {
    let htags = new Set();
    graphObj.forEachNode(node => {
        const attr = graphObj.getNodeAttributes(node);

        const nodeHashTags = JSON.parse(attr['all_hashtags'] || '[]').map(p => p[0]);
        for (var t in nodeHashTags)
            htags.add(nodeHashTags[t]);

    });
    graphObj.setAttribute('hashtags', Array.from(htags));
}

function loadGraphFile(filename) {
    if (!filename.endsWith('gexf.gz')) {
        console.log('Unknown file type for ',filename, ' -> skipping');
        return;
    }
    const data = fs.readFileSync(filename);
    const str = pako.inflate(data, {to:'string'});

    return new DirectedGraph.from(gexf.parse(graph, str));
}


function computeCirclePackLayout(graphObj, hierarchyAttributes) {
    circlePackLayout.assign(graphObj, { hierarchyAttributes: hierarchyAttributes});
}

function computeFa2Layout(graphObj, numIter) {

    forceAtlas2.assign(graphObj, {
        iterations: numIter,
        settings: {
            edgeWeightInfluence: 0.2,
            barnesHutOptimize: true,
            linLogMode: true,
        }
    });

}

function computeLayout(inputGraphFile, outputGraphFile, methodName, numIter) {
    const graphObj = loadGraphFile(inputGraphFile);
    if (!graphObj)
        return;
    console.log('Loaded ', inputGraphFile);
    console.time('Counting communities / max weight');
    const numCommunities = graphObj.nodes()
        .reduce((acc, curr) => Math.max(acc, graphObj.getNodeAttribute(curr, 'community')), 0) + 1;
    const maxWeight = graphObj.edges()
        .reduce((acc, curr) => Math.max(acc, graphObj.getEdgeAttribute(curr, 'weight')), 0);
    const PALETTE = palette('mpn65', Math.min(Math.max(MIN_PALETTE_SIZE, numCommunities), MAX_PALETTE_SIZE))
                            .map(function (colorStr) { return '#' + colorStr; });
    graphObj.setAttribute('num communities', numCommunities);
    graphObj.setAttribute('max weight', maxWeight);
    console.timeEnd('Counting communities / max weight');

    console.log('found ' + numCommunities + ' communities');
    console.log('Max weight = ' + maxWeight );
    console.time('Degree computation');

    degree.allDegree(graphObj, {types: ['inDegree', 'outDegree']}, true);
    graphObj.forEachNode(node => {
        const attr = graphObj.getNodeAttributes(node);
        graphObj.mergeNodeAttributes(node, {
           degree: attr.inDegree + attr.outDegree
        });
    });
    const maxDegree = graphObj.nodes()
        .reduce((acc, curr) => Math.max(acc, graphObj.getNodeAttribute(curr, 'degree')), 0);
    graphObj.setAttribute('maxDegree', maxDegree);
    console.timeEnd('Degree computation');

    console.time('Hashtag list');
    buildHashTagList(graphObj);
    console.timeEnd('Hashtag list');

    randomLayout.assign(graphObj, {
        scale: 400, center: 0, rng: rng()
    });
    console.time('Node Attributes');
    graphObj.forEachNode(node => {
        const attr = graphObj.getNodeAttributes(node);

        graphObj.mergeNodeAttributes(node, {
            color: PALETTE[attr.community % MAX_PALETTE_SIZE],
            //size: Math.max(4, 2.0 * Math.log(attr.degree + 1)),
            size: MIN_NODE_SIZE + (attr.degree*(MAX_NODE_SIZE - MIN_NODE_SIZE))/maxDegree,
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
    switch(methodName) {
        case 'FA2':
            computeFa2Layout(graphObj, numIter);
            break;
        case 'CP':
            // TODO pass hierarchy from command line (?)
            computeCirclePackLayout(graphObj, ['community', 'degree']);
            break;
        default:
            throw new Error("Unrecognized layout method");
    }
    console.timeEnd('Layout');
    console.time('Output');
    const graphStr = JSON.stringify(graphObj.export());
    const compressedGraph = pako.gzip(graphStr);
    fs.writeFileSync(outputGraphFile, Buffer.from(compressedGraph));
    console.timeEnd('Output');
    console.log('Saved ', outputGraphFile);
}

if (!process.argv[2] || !process.argv[3] || !process.argv[4]) {
    console.log('Usage: layout input_dir output_dir method (FA2|CP) [num_iter]');
} else {
    const numIter = process.argv[5] ? parseInt(process.argv[5]):200;
    const files = fs.readdirSync(process.argv[2]); // list files in input dir
    files.forEach(f => {
        const fout = f.replace('gexf.gz', 'json.gz');
        computeLayout(path.join(process.argv[2], f), path.join(process.argv[3], fout), process.argv[4], numIter);
    });
}
