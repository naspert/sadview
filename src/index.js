import {UndirectedGraph} from 'graphology';
import degree from 'graphology-metrics/degree';
import randomLayout from 'graphology-layout/random';
import gexf from 'graphology-gexf/browser';
import FA2Layout from 'graphology-layout-forceatlas2';
import WebGLRenderer from 'sigma/renderers/webgl';
import palette from 'google-palette'
import random from 'random';
import seedrandom from 'seedrandom';
import reddit from './graph_reddit_t2_md2_graph.gexf';


const PALETTE = palette('mpn65', 40).map(function (colorStr) {
    return '#' + colorStr;
});
const container = document.getElementById('container');

console.time('Creation');
const graph = gexf.parse(UndirectedGraph, reddit);
console.timeEnd('Creation');

console.time('Degree computation');
degree.assign(graph);
console.timeEnd('Degree computation');
random.use(seedrandom('lts2kings'));
randomLayout.assign(graph, {scale: 400, center: 0, rng: () => {
        return random.float();
    }});

console.time('Node Attributes');
graph.nodes().forEach(node => {
    const attr = graph.getNodeAttributes(node);

    graph.mergeNodeAttributes(node, {
        color: PALETTE[attr.community],
        //size: Math.max(4, attr.degree*0.5)
        size: Math.max(4, 2.5*Math.log(attr.degree+1))
    });
});
console.timeEnd('Node Attributes');

console.time('Edge Attributes');
graph.edges().forEach(edge => {
    graph.setEdgeAttribute(edge, 'color', '#ccc');
});
console.timeEnd('Edge Attributes');

const renderer = new WebGLRenderer(graph, container);
console.time('Layout');
FA2Layout.assign(graph, 100, {});
console.timeEnd('Layout');

window.graph = graph;
window.renderer = renderer;
window.camera = renderer.camera;

