import graph from 'graphology';
import gexf from 'graphology-gexf';
import degree from 'graphology-metrics/degree';
import randomLayout from 'graphology-layout/random';
import FA2Layout from 'graphology-layout-forceatlas2';
import WebGLRenderer from 'sigma/renderers/webgl';
import palette from 'google-palette'
import random from 'random';
import seedrandom from 'seedrandom';
import ky from 'ky';
import pako from 'pako';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import $ from 'jquery';

function format_attributes(attr_data) {
    const user_details = JSON.parse(attr_data['user_details']);
    const name = JSON.parse(attr_data['name']);
    return `<h2>${name}</h2><p>${user_details}</p>`;
}

function format_attributes_gexf(attr_data) {
    const user_details = attr_data['user_details'];
    const name = attr_data['name'];
    return `<h2>${name}</h2><p>${user_details}</p>`;
}


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
function render_graph(filename) {
    let gtype = 'json';
    console.log('Rendering ' + filename);
    if (window.graph)
        window.graph.clear();
    ky.get(base_url + '/' + filename)
        .then(res => res.arrayBuffer())
        .then(ab => pako.inflate(ab, {to:'string'}))
        .then(r => {
            if (filename.endsWith('json.gz'))
                return JSON.parse(r);
            else if (filename.endsWith('gexf.gz')) {
                gtype = 'gexf'
                return gexf.parse(graph, r);
            }
        })
        .then(graph_data => {

            const g = layout_graph(graph_data);
            const container = $('#sigma-container');
            const infodisp = $('#info-disp');
            const renderer = new WebGLRenderer(g, container[0], {
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

            renderer.on('clickNode', ({node}) => {
                console.log('Clicking:', node);
                const attr = g.getNodeAttributes(node);
                if (gtype == 'json')
                    infodisp[0].innerHTML = format_attributes(attr);
                else
                    infodisp[0].innerHTML = format_attributes_gexf(attr);
            });

            console.time('Layout');
            FA2Layout.assign(g, 100, {});
            console.timeEnd('Layout');

            window.graph = g;
            window.renderer = renderer;
            window.camera = renderer.camera;

    });
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

// setup data path
if (process.env.NODE_ENV !== 'production') {
      console.log('Looks like we are in development mode!');
 } else {
    base_url = process.env.BASE_URL;
}

// data file
const data_files = [{'label':'reddit', 'file':'graph_reddit_t2_md2.json.gz'},
    {'label':'voat', 'file':'graph_t2_md2_graph.gexf.gz'}];


// populate dropdown
const dropdown = $('#graph-selector');
dropdown.empty();
$.each(data_files, function(key, value) {
    dropdown.append($('<a class="dropdown-item"></a>')
        .attr('data-graph', value.file)
        .attr('id', value.label)
        .attr('data-label', value.label)
        .text(value.label));
});

// register click handler
$('.dropdown-menu').click((event) => {
    const menu_clicked = $(event.target);
    console.log('Clicked menu: ' + menu_clicked.data('label'));
    if (menu_clicked.hasClass('active')) // nothing to do
        return;

    dropdown.children().each(function() {
        $(this).removeClass('active');
    });
    $('#' + menu_clicked.data('label')).addClass('active');
    render_graph($('#' + menu_clicked.data('label')).data('graph'));
});

// load default graph
$('#reddit').addClass('active');
render_graph(data_files[0]['file']);

