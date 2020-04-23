import graph from 'graphology';
import degree from 'graphology-metrics/degree';
import randomLayout from 'graphology-layout/random';
import FA2Layout from 'graphology-layout-forceatlas2';
import WebGLRenderer from 'sigma/renderers/webgl';
import palette from 'google-palette'
import random from 'random';
import seedrandom from 'seedrandom';
import ky from 'ky';
import pako from 'pako';




function layout_graph(graph_data) {
    //console.log("data:" + graph_data);

    /**/
    console.time('Graph creation');
    const graphObj = graph.from(graph_data);
    console.timeEnd('Graph creation');

    console.time('Counting communities');
    const numCommunities = graphObj.nodes()
        .reduce((acc, curr) => Math.max(acc, graphObj.getNodeAttribute(curr, 'community')), 0) + 1;
    const PALETTE = palette('mpn65', Math.max(8, numCommunities)).map(function (colorStr) {
        return '#' + colorStr;
    });
    console.timeEnd('Counting communities');
    console.log("found " + numCommunities + " communities");
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
        graphObj.mergeEdgeAttributes(edge, {
            'color': '#ccc',
            zIndex: 0
        });
    });
    console.timeEnd('Edge Attributes');

    return graphObj;
}

let base_url = "";
let highlighedNodes = new Set();
let highlighedEdges = new Set();
const nodeReducer = (node, data) => {
    if (highlighedNodes.has(node))
        return {...data, color: '#f00', zIndex: 1};

    return data;
};

const edgeReducer = (edge, data) => {
    if (highlighedEdges.has(edge))
        return {...data, color: '#ff0000', zIndex: 1};

    return data;
};
if (process.env.NODE_ENV !== 'production') {
      console.log('Looks like we are in development mode!');
 } else {
    base_url = process.env.BASE_URL;
}
ky.get(base_url + '/graph_reddit_t2_md2.json.gz')
    .then(res => res.arrayBuffer())
    .then(ab => pako.inflate(ab, {to:'string'}))
    .then(r => JSON.parse(r))
    //.then(res => res.text())
    .then(graph_data => {
        const g = layout_graph(graph_data);
        const container = document.getElementById('container');
        const renderer = new WebGLRenderer(g, container, {
            nodeReducer,
            edgeReducer,
            zIndex: true
        });

        renderer.on('enterNode', ({node}) => {
            console.log('Entering: ', node);
            highlighedNodes = new Set(g.neighbors(node));
            highlighedNodes.add(node);

            highlighedEdges = new Set(g.edges(node));

            renderer.refresh();
        });

        renderer.on('leaveNode', ({node}) => {
            console.log('Leaving:', node);

            highlighedNodes.clear();
            highlighedEdges.clear();

            renderer.refresh();
        });

        console.time('Layout');
        FA2Layout.assign(g, 100, {});
        console.timeEnd('Layout');

        window.graph = g;
        window.renderer = renderer;
        window.camera = renderer.camera;

    });