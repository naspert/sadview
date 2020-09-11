import graph from 'graphology';
import WebGLRenderer from 'sigma/renderers/webgl';
import ky from 'ky';
import pako from 'pako';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.min';
import 'select2/dist/js/select2.min';
import 'select2/dist/css/select2.min.css';
import '@ttskch/select2-bootstrap4-theme/dist/select2-bootstrap4.min.css';
import $ from 'jquery';

function formatAttributes(attr_data, attr_func) {
    const user_details = attr_func(attr_data['user_details']);
    const name = attr_func(attr_data['name']);
    return `<h2>${name}</h2><p>${user_details}</p>`;
}

function formatCommunityInfo(commInfo,commId) {
    const density = (commInfo.density*100).toFixed(1);
    return `<h2>Community ${commId}</h2><p>Size: ${commInfo.size}  Weighted size: ${commInfo.weightedSize}</p><p>Density: ${density} %</p>`;
}

function highlightNode(node, graph, renderer) {
    console.log('Node selected: ' + node);
    highlightedNodes = new Set(graph.neighbors(node));
    highlightedNodes.add(node);
    highlightedEdges = new Set(graph.edges(node));

    renderer.refresh();
}

function highlightNodes(graph, hashtag, renderer) {
    hightlightedHashtagNode.clear(); // flush on new hashtag select
    graph.forEachNode(n => {
        const nodeHashtags = graph.getNodeAttribute(n, 'all_hashtags');
        if (nodeHashtags.includes(hashtag))
            hightlightedHashtagNode.add(n);
    });
    renderer.refresh();
}


function displayUserInfo(node, attr, clusterInfo, escapeAttr) {
    if (node === "")
        return;
    const infoDisp = $('#info-disp');
    infoDisp[0].innerHTML = formatAttributes(attr,
        escapeAttr ? x => JSON.parse(x): x => x);
}

function displayUserHashtags(node, attr, clusterInfo, escapeAttr) {
    if (node === "")
        return;
    import(/* webpackChunkName: "plot_hashtags" */ './plot_hashtags').then(module => {
        const plotHashtags = module.plotHashtags;
        const hashTags = attr['all_hashtags'] || '[]';
        $('#info-disp').empty();
        if (hashTags.length > 0)
            plotHashtags(attr['all_hashtags'] || '[]'); // can be missing so avoid exceptions
    });
}

function displayCommunityInfo(node, attr, clusterInfo, escapeAttr) {
    if (node === "")
        return;
    const infoDisp = $('#info-disp');
    const community = clusterInfo[attr.community];
    infoDisp[0].innerHTML = formatCommunityInfo(community, attr.community);
}

function displayCommunityVoc(node, attr, clusterInfo, escapeAttr) {
    if (node === "")
        return;
    const community = clusterInfo[attr.community];
    import(/* webpackChunkName: "plot_community" */'./plot_community').then(module => {
        const plotCommunityWordcloud = module.plotCommunityWordcloud;
        $('#info-disp').empty();
        plotCommunityWordcloud(community);
    });
}

function computeNodesSize(graph, attrName) {
    const MIN_NODE_SIZE = 3;
    const MAX_NODE_SIZE = 30;
    const maxDegree = graph.getAttribute('maxDegree');
    graph.forEachNode((node) => {
        const degree = graph.getNodeAttribute(node, attrName);
        const size = MIN_NODE_SIZE + (MAX_NODE_SIZE - MIN_NODE_SIZE)*degree/maxDegree;
        graph.setNodeAttribute(node, 'size', size);
    });
}

function circlePackLayout(graphObj) {
    import(/* webpackChunkName: "circlepack" */ './circlepack').then(module => {
        const layoutCirclepack = module.layout_circlepack;
        layoutCirclepack(graphObj);
    });
}

function renderGraph(filename, clusterFile, escapeAttr) {
    const infoDisp = $('#info-disp');
    const spinDisp = $('#spinner-disp');
    const layoutControls = $('#layout-controls');
    let clusterInfo;
    $.getJSON(base_url+'/' + clusterFile, function (data) {
       clusterInfo = data;
    });

    infoDisp.empty();
    selectedNode = ""
    console.log('Rendering ' + filename);
    if (window.graph)
        window.graph.clear();
    // show spinner
    layoutControls.hide();
    spinDisp.show();


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
                selectedNode = node;
                displayNodeInfo(node, attr, clusterInfo, escapeAttr);
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
                selectedNode = node;
                displayNodeInfo(node, g.getNodeAttributes(node), clusterInfo, escapeAttr);
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

            // info button group
            $('#userinfo').off();
            $('#userinfo').change((event) => {
                console.log('Displaying user info');
                displayNodeInfo = displayUserInfo;
                if (selectedNode)
                    displayNodeInfo(selectedNode, g.getNodeAttributes(selectedNode), clusterInfo, escapeAttr);
            });

            $('#userhashtags').off();
            $('#userhashtags').change((event) => {
                console.log('Displaying user hashtags');
                displayNodeInfo = displayUserHashtags;
                if (selectedNode)
                    displayNodeInfo(selectedNode, g.getNodeAttributes(selectedNode), clusterInfo, escapeAttr);
            });

            $('#communityinfo').off();
            $('#communityinfo').change((event) => {
                console.log('Displaying community info');
                displayNodeInfo = displayCommunityInfo;
                if (selectedNode)
                    displayNodeInfo(selectedNode, g.getNodeAttributes(selectedNode), clusterInfo, escapeAttr);
            });

            $('#communitylex').off();
            $('#communitylex').change((event) => {
                console.log('Displaying community lexical analysis');
                displayNodeInfo = displayCommunityVoc;
                if (selectedNode)
                    displayNodeInfo(selectedNode, g.getNodeAttributes(selectedNode), clusterInfo, escapeAttr);
            });


            window.graph = g;
            window.renderer = renderer;
            window.camera = renderer.camera;
            spinDisp.hide();
            layoutControls.show();
    });
}

let base_url = "";
let highlightedNodes = new Set();
let highlightedEdges = new Set();
let hightlightedHashtagNode = new Set();
let loadedFile;
let escapeNeeded;
let clusterFile;
let savedCoords = {};
let displayNodeInfo = displayUserInfo;
let selectedNode = "";


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
const dataDirs = [
    {label: '2020-09-08', file: '2020-09-08/graph_2020-09-08.json.gz',
        clusterInfo: '2020-09-08/cluster_info.json', escape: false},
    {label: '2020-09-09', file: '2020-09-09/graph_2020-09-09.json.gz',
        clusterInfo: '2020-09-09/cluster_info.json', escape: false},
    {label: '2020-09-10', file: '2020-09-10/graph_2020-09-10.json.gz',
        clusterInfo: '2020-09-10/cluster_info.json', escape: false},
    {label: '2020-09-11', file: '2020-09-11/graph_2020-09-11.json.gz',
        clusterInfo: '2020-09-11/cluster_info.json', escape: false}
    ];

// setup data path
if (process.env.NODE_ENV !== 'production') {
    console.log('Looks like we are in development mode!');
 } else {
    base_url = process.env.BASE_URL;
}



// populate dropdown
const dropdown = $('#graph-selector');
dropdown.empty();
$.each(dataDirs, function(key, value) {
    dropdown.append($('<a class="dropdown-item"></a>')
        .attr('data-graph', value.file)
        .attr('id', value.label)
        .attr('data-label', value.label)
        .attr('data-escape', value.escape)
        .attr('data-cluster', value.clusterInfo)
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
    clusterFile = item.data('cluster');
    escapeNeeded = item.data('escape');
    renderGraph(loadedFile, clusterFile, escapeNeeded);
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
    circlePackLayout(window.graph);
});

// degree display button group

$('#degree').change((event) => {
    console.log('size <=> degree');
    computeNodesSize(window.graph, 'degree');
    if ($('#circlepack').parent().hasClass('active')) {
        circlePackLayout(window.graph);
    }
});

$('#indegree').change((event) => {
    console.log('size <=> in-degree');
    computeNodesSize(window.graph, 'inDegree');
    if ($('#circlepack').parent().hasClass('active')) {
        circlePackLayout(window.graph);
    }
});

$('#outdegree').change((event) => {
    console.log('size <=> out-degree');
    computeNodesSize(window.graph, 'outDegree');
    if ($('#circlepack').parent().hasClass('active')) {
        circlePackLayout(window.graph);
    }
});


// load default graph
$('#2020-09-08').addClass('active');
loadedFile = dataDirs[0].file;
clusterFile = dataDirs[0].clusterInfo;
escapeNeeded = dataDirs[0].escape
renderGraph(loadedFile, clusterFile, escapeNeeded);


