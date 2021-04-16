import './publicPath';
import $ from 'jquery';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.min';
import 'select2/dist/js/select2.min';
import 'select2/dist/css/select2.min.css';
import '@ttskch/select2-bootstrap4-theme/dist/select2-bootstrap4.min.css';
import 'bootstrap-slider';
import 'bootstrap-slider/dist/css/bootstrap-slider.min.css';
import graph from 'graphology';
import WebGLRenderer from 'sigma/renderers/webgl';
import pako from 'pako';
import Color from 'color';
import moment from 'moment';
import numeral from 'numeral';

/* global vars */
let highlightedNodes = new Set();
let highlightedNeighbors = new Set();
let highlightedEdges = new Set();
let highlightedHashtagNode = new Set();
let savedCoords = {};
let displayNodeInfo = displayUserInfo;
let selectedNode = "";
let maxHop = 5;
let currMaxHop = 5;
let slider;
let maxWeight = 1;
let devEnv = false;
let uuidGraph = "";
if (process.env.NODE_ENV !== 'production') {
    console.log('Looks like we are in development mode!');
    devEnv = true;
}
// API endpoint used to fetch JSON data
let baseUrl = window.location.origin + '/viewer/graph-layout-data/';
if (devEnv) {
    baseUrl = "http://localhost:8000/viewer/graph-layout-data/";
}
const uuidRegex = /([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\/?/g

function formatAttributesCompat(attr_data) {
    const user_details = attr_data['user_details'];
    const name = attr_data['name'];
    const screen_name = attr_data['label'];
    return `<div class="card">
                <div class="card-body">
                    <h5 class="card-title"><a href="https://twitter.com/${screen_name}" target="_blank">${name}</a></h5>
                    <p class="card-text">${user_details}</p>
                </div>
            </div>`;
}

function formatAttributes(attr_data) {
    const user_details = attr_data['user_details'];
    const name = attr_data['name'];
    const screen_name = attr_data['label'];

    if ('account_verified' in attr_data) { // extended user info available -> display
        const verified = attr_data['account_verified'] ? '<i class="far fa-check-circle"></i>':'';
        const creation_date = moment(attr_data['account_creation']).format('MMM YYYY');
        const following = numeral(attr_data['account_following']).format('0a');
        const followers = numeral(attr_data['account_followers']).format('0a');
        const favs = numeral(attr_data['account_favourites']).format('0a');
        const tweets = numeral(attr_data['account_statuses']).format('0a');
        return `<div class="card">
                <div class="card-body">
                    <h5 class="card-title"><a href="https://twitter.com/${screen_name}" target="_blank">${name}</a> ${verified}</h5>
                    <p class="card-text">${user_details}</p>
                    <div class="card-footer twitter-account-info">
                    ${creation_date} - following ${following} - ${followers} followers<br />
                    ${tweets} tweets - ${favs} favs
                    </div>
                </div>
            </div>`;
    } else { // compatibility mode
        return formatAttributesCompat(attr_data);
    }
}

function formatCommunityInfo(commInfo,commId) {
    const density = (commInfo.density*100).toFixed(1);
    return `<h2>Community ${commId}</h2><p>Size: ${commInfo.size}  Weighted size: ${commInfo.weightedSize}</p><p>Density: ${density} %</p>`;
}

function highlightNode(node, graph, renderer) {
    console.log('Node selected: ' + node);
    highlightedNeighbors = new Set(graph.neighbors(node));
    highlightedNodes.add(node);
    highlightedEdges = new Set(graph.edges(node));

    renderer.refresh();
}

function highlightNodes(graph, hashtag, renderer) {
    highlightedHashtagNode.clear(); // flush on new hashtag select
    graph.forEachNode(n => {
        const nodeHashtags = graph.getNodeAttribute(n, 'all_hashtags');
        if (nodeHashtags.includes(hashtag))
            highlightedHashtagNode.add(n);
    });
    renderer.refresh();
}


function displayUserInfo(node, attr, clusterInfo) {
    if (node === "")
        return;
    const infoDisp = $('#userinfo-disp');
    infoDisp[0].innerHTML = formatAttributes(attr);
    displayUserHashtags(node, attr, clusterInfo);
    displayCommunityInfo(node, attr, clusterInfo);
    displayCommunityVoc(node, attr, clusterInfo);
}

function displayUserHashtags(node, attr, clusterInfo) {
    if (node === "")
        return;
    import(/* webpackChunkName: "plotHashtags" */ './plotHashtags').then(module => {
        const plotHashtags = module.plotHashtags;
        const hashTags = attr['all_hashtags'] || '[]';
        $('#userhashtags-disp').empty();
        if (hashTags.length > 0)
            plotHashtags(attr['all_hashtags'] || '[]'); // can be missing so avoid exceptions
    });
}

function displayCommunityInfo(node, attr, clusterInfo) {
    if (node === "")
        return;
    const infoDisp = $('#comminfo-disp');
    const community = clusterInfo[attr.community];
    infoDisp[0].innerHTML = formatCommunityInfo(community, attr.community);
}

function displayCommunityVoc(node, attr, clusterInfo) {
    if (node === "")
        return;
    const community = clusterInfo[attr.community];
    import(/* webpackChunkName: "plotCommunity" */'./plotCommunity').then(module => {
        const plotCommunityWordcloud = module.plotCommunityWordcloud;
        $('#wordcloud-disp').empty();
        plotCommunityWordcloud(community, false);
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

const nodeReducer = (node, data) => {
    if (highlightedNodes.has(node))
        return {...data, color: '#f00', zIndex: 1};
    else if (highlightedNeighbors.has(node))
        return {...data, color: '#700', zIndex: 1};
    else if (highlightedHashtagNode.has(node))
        return {...data, color: '#0f0', zIndex: 1};
    else if (data.spikyball_hop > currMaxHop) {
        const delta = data.spikyball_hop - currMaxHop;
        const alpha = Math.max(0.05, 0.3 - 0.1*(delta)); // do not use if spiky_hop == currMaxHop
        const newColor = Color(data.color).darken(1.5*delta/maxHop).desaturate(1.5*delta/maxHop).alpha(alpha);

        return {...data, color: newColor.rgb().string(), zIndex: 0};
    }
    return data;
};

const edgeReducer = (edge, data) => {
    if (highlightedEdges.has(edge))
        return {...data, color: '#500', zIndex: 1};
    const weight = data.weight;
    const color = Color('#111').alpha(0.1 + 0.7*weight*(currMaxHop+1)/(maxWeight*(maxHop+1)));
    return {...data, color: color.rgb().string()};
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

function renderGraph(graphUUID) {
    const spinDisp = $('#spinner-disp');
    const layoutControls = $('#layout-controls');
    let clusterInfo;// = graphLayoutData.clusterInfo;


    $('#userhashtags-disp').empty();
    $('#userinfo-disp').empty();
    $('#wordcloud-disp').empty();
    $('#comminfo-disp').empty();
    selectedNode = ""
    console.log('Rendering...');
    if (window.graph)
        window.graph.clear();
    // show spinner
    layoutControls.hide();
    spinDisp.show();

    fetch(baseUrl + graphUUID)
        .then(response => response.json())
        //.then(j => JSON.parse(j))
        .then((d) => {
            clusterInfo = d.clusterInfo;
            return new Uint8Array(window.atob(d.compressedGraph).split('').map(c => c.charCodeAt(0)))
        })
        //.then(res => res.arrayBuffer())
        .then(ab => pako.inflate(ab, {to:'string'}))
        .then(r => {
            return JSON.parse(r);
        })
        .then(graph_data => {
            const container = $('#sigma-container');
            const g = graph.from(graph_data);
            maxWeight = g.getAttribute('max weight');
            const renderer = new WebGLRenderer(g, container[0], {
                nodeReducer,
                edgeReducer,
                labelRenderer: drawCustomLabel,
                zIndex: true
            });

            renderer.on('enterNode', ({node}) => {
                highlightedNodes = new Set(g.neighbors(node));
                highlightedNodes.add(node);
                highlightedEdges = new Set(g.edges(node));

                renderer.refresh();
            });

            renderer.on('leaveNode', ({node}) => {
                highlightedNodes.clear();
                highlightedEdges.clear();

                renderer.refresh();
            });

            renderer.on('clickNode', ({node}) => {
                const attr = g.getNodeAttributes(node);
                selectedNode = node;
                displayNodeInfo(node, attr, clusterInfo);
            });


            // cache fa2 coords, as recomputing/reloading is expensive
            savedCoords = {};
            g.forEachNode(function (key, attr) {
                savedCoords[key] = {x: attr.x, y: attr.y};
            });

            const nodeSelectData = [{id: '', text: ''}].concat($.map(g.nodes(), function (n) {
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
                displayNodeInfo(node, g.getNodeAttributes(node), clusterInfo);
            });

            const hashtagList = g.getAttribute('hashtags');
            const hashtagSelectData = [{id: '', text: ''}].concat($.map(hashtagList, function (h) {
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

            maxHop = g.getAttribute('max hop');
            currMaxHop = maxHop;

            if (slider)
                slider.slider('destroy');

            slider = $('#hopSlider').slider({min: 0, max: maxHop, value: maxHop});
            $('#hopSlider').on('slide', function (slideEvt) {
                currMaxHop = slideEvt.value;
                renderer.refresh();
            });


            renderer.refresh();
            window.graph = g;
            window.renderer = renderer;
            window.camera = renderer.camera;
            spinDisp.hide();
            layoutControls.show();
            console.log('Rendering done');
        });
}


// Maybe use a hidden element in the template and retrieve the uuid using it
// instead of parsing url ?
if (devEnv)
    uuidGraph = "70892cdb-0cd9-4f99-b455-c6022372666f";
else
    uuidGraph = window.location.toString().match(uuidRegex)[0]
renderGraph(uuidGraph);
window.onload = function() {
    console.log('onload start...');
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
    console.log('onload complete');
}
