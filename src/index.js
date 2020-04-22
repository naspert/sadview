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
    const PALETTE = palette('mpn65', 40).map(function (colorStr) {
        return '#' + colorStr;
    });
    console.time('Creation');

    const graphObj = graph.from(graph_data);
    console.timeEnd('Creation');

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
            size: Math.max(4, 2.5 * Math.log(attr.degree + 1))
        });
    });
    console.timeEnd('Node Attributes');

    console.time('Edge Attributes');
    graphObj.edges().forEach(edge => {
        graphObj.setEdgeAttribute(edge, 'color', '#ccc');
    });
    console.timeEnd('Edge Attributes');

    return graphObj;
}
let base_url = '/';
if (process.env.NODE_ENV !== 'production') {
      console.log('Looks like we are in development mode!');
 } else {
    base_url = '/sadview/';
}
ky.get(base_url + 'graph_reddit_t2_md2.json.gz')
    .then(res => res.arrayBuffer())
    .then(ab => pako.inflate(ab, {to:'string'}))
    .then(r => JSON.parse(r))
    //.then(res => res.text())
    .then(graph_data => {
        const g = layout_graph(graph_data);
        const container = document.getElementById('container');
        const renderer = new WebGLRenderer(g, container);

        console.time('Layout');
        FA2Layout.assign(g, 100, {});
        console.timeEnd('Layout');

        window.graph = g;
        window.renderer = renderer;
        window.camera = renderer.camera;

    });