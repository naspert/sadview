import graph from 'graphology';
import WebGLRenderer from 'sigma/renderers/webgl';
import ky from 'ky';
import pako from 'pako';
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

function highlightNode(e, graph, renderer) {
    const data = e.params.data;
    const node = data.id;
    console.log('Node selected: ' + node);
    highlighedNodes = new Set(graph.neighbors(node));
    highlighedNodes.add(node);
    highlighedEdges = new Set(graph.edges(node));

    renderer.refresh();
}


function renderGraph(filename, escapeAttr) {

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
            const infodisp = $('#info-disp');
            const g = graph.from(graph_data);
            const renderer = new WebGLRenderer(g, container[0], {
                nodeReducer,
                edgeReducer,
                labelRenderer: drawCustomLabel,
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
                infodisp[0].innerHTML = formatAttributes(attr,
                    escapeAttr ? x => JSON.parse(x): x => x);
            });



            const select_data = $.map(g.nodes(), function (n) {
                return {
                    id: n,
                    text: n,
                    selected: false
                }
            });
            console.log('select2 creation');
            const nodeSelect2 = $('.node-selector');
            nodeSelect2.empty();
            nodeSelect2.select2({
                placeholder: 'Search node',
                theme: 'bootstrap4',
                data: select_data
            });

            nodeSelect2.off('select2:select');
            nodeSelect2.on('select2:select', e => highlightNode(e, g, renderer));
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
    renderGraph(item.data('graph'), item.data('escape'));
});



// load default graph
$('#reddit').addClass('active');
renderGraph(dataFiles[0]['file'], dataFiles[0]['escape']);


