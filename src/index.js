import graph from 'graphology';
import WebGLRenderer from 'sigma/renderers/webgl';
import circlepack from "graphology-layout/circlepack";
import ky from 'ky';
import pako from 'pako';
import plotly from 'plotly.js-basic-dist-min';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import 'select2';
import 'select2/dist/css/select2.min.css';
import '@ttskch/select2-bootstrap4-theme/dist/select2-bootstrap4.min.css';
import $ from 'jquery';

function formatAttributes(attr_data, attr_func) {
    const user_details = attr_func(attr_data['user_details']);
    const name = attr_func(attr_data['name']);
    return `<h2>${name}</h2><p>${user_details}</p>`;
}

function plotHashtags(htListJson) {
    // get sorted hashtags list with most used first
    const hashtags = JSON.parse(htListJson).map((p) => {
        return {name:p[0], num:p[1]};
    }).sort(function(a,b) {return b.num - a.num});
    const x = hashtags.map(t => t.name);
    const y = hashtags.map(t => t.num);
    const data = [
        {
            x: x,
            y: y,
            type: 'bar',
        }
    ];

    const layout = {
        autosize: false,
        height: 200,
        margin: {
            l: 50,
            r: 5,
            b: 100,
            t: 10,
            pad: 4
        }
    };
    plotly.newPlot('hashtag-disp', data, layout);
}

function highlightNode(node, graph, renderer) {
    console.log('Node selected: ' + node);
    highlightedNodes = new Set(graph.neighbors(node));
    highlightedNodes.add(node);
    highlightedEdges = new Set(graph.edges(node));

    renderer.refresh();
}

function highlightNodes(graph, hashtag, rendered) {
    hightlightedHashtagNode.clear(); // flush on new hashtag select
    graph.forEachNode(n => {
        const nodeHashtags = graph.getNodeAttribute(n, 'all_hashtags');
        if (nodeHashtags.includes(hashtag))
            hightlightedHashtagNode.add(n);
    });
    renderer.refresh();
}

function displayNodeInfo(node, attr, escapeAttr, infodisp) {
    infodisp[0].innerHTML = formatAttributes(attr,
        escapeAttr ? x => JSON.parse(x): x => x);
    plotHashtags(attr['all_hashtags'] || '[]'); // can be missing so avoid exceptions
}

function renderGraph(filename, escapeAttr) {
    const infodisp = $('#info-disp');
    infodisp.empty();
    $('#hashtag-disp').empty();
    console.log('Rendering ' + filename);
    if (window.graph)
        window.graph.clear();
    ky.get(base_url + '/' + filename)
        .then(res => res.arrayBuffer())
        .then(ab => pako.inflate(ab, {to:'string'}))
        .then(r => {
            console.assert(filename.endsWith('json.gz'));
            return JSON.parse(r);
        })
        .then(graph_data => {
            const container = $('#sigma-container');

            const g = graph.from(graph_data);
            const renderer = new WebGLRenderer(g, container[0], {
                nodeReducer,
                edgeReducer,
                labelRenderer: drawCustomLabel,
                zIndex: true
            });

            renderer.on('enterNode', ({node}) => {
                console.log('Entering: ', node);
                highlightedNodes = new Set(g.neighbors(node));
                highlightedNodes.add(node);
                highlightedEdges = new Set(g.edges(node));

                renderer.refresh();
            });

            renderer.on('leaveNode', ({node}) => {
                console.log('Leaving:', node);

                highlightedNodes.clear();
                highlightedEdges.clear();

                renderer.refresh();
            });

            renderer.on('clickNode', ({node}) => {
                console.log('Clicking:', node);
                const attr = g.getNodeAttributes(node);
                displayNodeInfo(node, attr, escapeAttr, infodisp);

            });
            // cache fa2 coords, as recomputing/reloading is expensive
            savedCoords = {};
            g.forEachNode(function (key, attr) {
               savedCoords[key] = {x: attr.x, y: attr.y};
            });

            const nodeSelectData = [{id:'', text:''}].concat($.map(g.nodes(), function (n) {
                return {
                    id: n,
                    text: n,
                    selected: false
                }
            }));
            console.log('select2 creation');
            const nodeSelect2 = $('.node-selector');
            nodeSelect2.empty();
            nodeSelect2.select2({
                placeholder: 'Search node',
                theme: 'bootstrap4',
                data: nodeSelectData
            });

            nodeSelect2.off('select2:select');
            nodeSelect2.on('select2:select', e => {
                const node = e.params.data.id;
                highlightNode(node, g, renderer);
                displayNodeInfo(node, g.getNodeAttributes(node), escapeAttr, infodisp);
            });

            const hashtagList = g.getAttribute('hashtags');
            const hashtagSelectData = [{id:'', text:''}].concat($.map(hashtagList, function (h) {
                return {
                    id: h,
                    text: h,
                    selected: false
                }
            }));
            const hashtagSelect = $('.hashtag-selector');
            hashtagSelect.empty();
            hashtagSelect.select2({
                placeholder: 'Search hashtag',
                theme: 'bootstrap4',
                data: hashtagSelectData
            });
            hashtagSelect.off('select2:select');
            hashtagSelect.on('select2:select', e => {
                const htag = e.params.data.id;
                highlightNodes(g, htag, renderer);
            });
            window.graph = g;
            window.renderer = renderer;
            window.camera = renderer.camera;

    });
}

let base_url = "";
let highlightedNodes = new Set();
let highlightedEdges = new Set();
let hightlightedHashtagNode = new Set();
let loadedFile;
let escapeNeeded;
let savedCoords = {};

const nodeReducer = (node, data) => {
    if (highlightedNodes.has(node))
        return {...data, color: '#f00', zIndex: 1};
    if (hightlightedHashtagNode.has(node))
        return {...data, color: '#0f0', zIndex: 1};
    return data;
};

const edgeReducer = (edge, data) => {
    if (highlightedEdges.has(edge))
        return {...data, color: '#ff0000', zIndex: 1};

    return data;
};

const drawCustomLabel = (context, data, settings) => {
    const size = settings.labelSize,
        font = settings.labelFont,
        weight = settings.labelWeight;

    context.fillStyle = '#333';
    context.font = `${weight} ${size}px ${font}`;

    context.fillText(
        data.label,
        data.x + data.size + 3,
        data.y + size / 3
    );
};

// data file
const dataFiles = [{'label':'reddit', 'file':'graph_reddit_t2_md2_graph.json.gz', 'escape': true},
    {'label':'voat', 'file':'voat_t2_md2_graph.json.gz', 'escape': false},
    {'label':'gbr', 'file':'zgbr_t2_md6_graph.json.gz', 'escape':false},
    {'label': 'nas', 'file': 'nas_graph.json.gz', 'escape':false},
    {'label':'miz', 'file':'miz_t2_md2.json.gz', 'escape':false}];

// setup data path
if (process.env.NODE_ENV !== 'production') {
    console.log('Looks like we are in development mode!');
 } else {
    base_url = process.env.BASE_URL;
}



// populate dropdown
const dropdown = $('#graph-selector');
dropdown.empty();
$.each(dataFiles, function(key, value) {
    dropdown.append($('<a class="dropdown-item"></a>')
        .attr('data-graph', value.file)
        .attr('id', value.label)
        .attr('data-label', value.label)
        .attr('data-escape', value.escape)
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
    const item = $('#' + menu_clicked.data('label'));
    item.addClass('active');
    loadedFile = item.data('graph');
    escapeNeeded = item.data('escape');
    renderGraph(loadedFile, escapeNeeded);
    $('#fa2').parent().addClass('active');
    $('#circlepack').parent().removeClass('active');
});

$('#fa2').change((event) => {
   console.log('FA2 layout -> reload coords');
   window.graph.forEachNode(function(key, attr) {
       window.graph.setNodeAttribute(key, 'x', savedCoords[key].x);
       window.graph.setNodeAttribute(key, 'y', savedCoords[key].y);
   });
});

$('#circlepack').change((event) => {
    console.log('Circlepack layout');
    circlepack.assign(window.graph, {hierarchyAttributes: ['community', 'degree']});
});



// load default graph
$('#reddit').addClass('active');
loadedFile = dataFiles[0]['file'];
escapeNeeded = dataFiles[0]['escape']
renderGraph(loadedFile, escapeNeeded);


