import './publicPath';
import $ from 'jquery';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.min';
import 'select2/dist/js/select2.min';
import 'select2/dist/css/select2.min.css';
import '@ttskch/select2-bootstrap4-theme/dist/select2-bootstrap4.min.css';
import 'bootstrap-slider';
import 'bootstrap-slider/dist/css/bootstrap-slider.min.css';
import '@fortawesome/fontawesome-free/js/fontawesome';
import '@fortawesome/fontawesome-free/js/solid';
import '@fortawesome/fontawesome-free/js/brands';
import graph from 'graphology';
import {parse as gexfParse} from 'graphology-gexf/node';
import Sigma from 'sigma/sigma';
import pako from 'pako';
import Color from 'color';
import moment from 'moment';
import numeral from 'numeral';
import {plotHashtagsData} from "./hashtagsTimeline";

/* global vars */
let highlightedNodes = new Set();
let highlightedNeighbors = new Set();
let highlightedEdges = new Set();

let savedCoords = {};
let displayNodeInfo = displayUserInfo;
let selectedNodes = new Set();
let maxHop = 5;
let currMaxHop = 5;
let slider;
let maxWeight = 1;
let devEnv = false;
let uuidGraph;

let displayHashtagSubgraph = false;
let selectedHashtags;
let selectedHashtagNodes = new Set();
let selectedHashtagEdges = new Set();
let hashtagChart;

let displayCommunitiesSubgraph = false;
let selectedCommunities = new Set();
let selectedCommunitiesNodes = new Set();
let selectedCommunitiesEdges = new Set();

if (process.env.NODE_ENV !== 'production') {
    console.log('Looks like we are in development mode!');
    devEnv = true;
}
// API endpoint used to fetch JSON data
let baseUrl = window.location.origin + '/viewer/graph-layout-data/';
let hashtagsUrl = window.location.origin + '/viewer/hashtags-timeline/';

if (devEnv) {
    baseUrl = "http://localhost:8000/viewer/graph-layout-data/";
    hashtagsUrl = "http://localhost:8000/viewer/hashtags-timeline/";
}

function hashtagNodeSelector(node, attributes, selectedHashtags) {
    let intersection = selectedHashtags.filter(x => attributes.hashtags.includes(x));
    return intersection.length > 0;
}

function communityNodeSelector(node, attributes, selectedCommunities) {
    return selectedCommunities.includes(attributes.community.toString());
}

function extractSubgraph(graphObj, nodeSelectorFunction, subgraphInfo, data) {
    subgraphInfo.nodeSet = new Set();
    subgraphInfo.edgeSet = new Set();
    // build nodes list using selector function
    for (const [node, attributes] of graphObj.nodeEntries()) {
        if (nodeSelectorFunction(node, attributes, data))
            subgraphInfo.nodeSet.add(node);
    }

    // build edges list for the considered nodes
    for (const [edge, attributes, source, target, sourceAttributes, targetAttributes] of graphObj.edgeEntries()) {
        if (subgraphInfo.nodeSet.has(source) && subgraphInfo.nodeSet.has(target))
            subgraphInfo.edgeSet.add(edge);
    }
    console.log(`Subgraph has ${subgraphInfo.nodeSet.size} nodes and ${subgraphInfo.edgeSet.size} edges`);
}

function rebuildHashtagsSubgraph(graphObj, renderer) {
    let subgraphInfo = {nodeSet: null, edgeSet: null};
    selectedHashtags = $('#hashtag-selector').select2('data').map(c => c.id);
    extractSubgraph(graphObj, hashtagNodeSelector, subgraphInfo, selectedHashtags);
    selectedHashtagNodes = subgraphInfo.nodeSet;
    selectedHashtagEdges = subgraphInfo.edgeSet;
    console.log(`Subgraph has ${selectedHashtagNodes.size} nodes.`);
    renderer.refresh();
}

function rebuildCommunitySubgraph(graphObj, renderer) {
    let subgraphInfo = {nodeSet: null, edgeSet: null};
    selectedCommunities = $('#community-selector').select2('data').map(c => c.id);
    extractSubgraph(graphObj, communityNodeSelector, subgraphInfo, selectedCommunities);
    selectedCommunitiesNodes = subgraphInfo.nodeSet;
    selectedCommunitiesEdges = subgraphInfo.edgeSet;
    console.log(`Subgraph has ${selectedCommunitiesNodes.size} nodes.`);
    renderer.refresh();
}

function buildCommunitySearchUrl(graphObj, communityId) {
    let nodeList = [];
    let queryBaseUrl = "https://twitter.com/search?q=";
    let queryFrom = [];
    let queryTo = [];
    let queryStr = "(";
    graphObj.forEachNode((node, attributes) => {
        if (attributes.community == communityId) {
            nodeList.push({name: node, degree:attributes["degree"]});

        }
    });
    nodeList.sort(function(a, b) {return b.degree - a.degree}); // sort by highest degree
    for (const n of nodeList.slice(0,5)) { // make the query short (must fit in 512 chars)
        queryFrom.push(`from:${n.name}`);
        queryTo.push(`to:${n.name}`);
    }
    queryStr += queryFrom.join(" OR ") + ") (";
    queryStr += queryTo.join(" OR ") + ")";
    console.log("Twitter search query length is ", queryStr.length)
    return queryBaseUrl + encodeURIComponent(queryStr) + "&f=live";
}

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
    return `<h6 class="card-title">Community ${commId}</h6>
            <p class="card-text">Size: ${commInfo.size}  Weighted size: ${commInfo.weightedSize}</p>
            <p class="card-text">Density: ${density} %</p>`;
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

function displayUserHashtags(node, attr, _) {
    if (node === "")
        return;
    import(/* webpackChunkName: "plotHashtags" */ './plotHashtags').then(module => {
        const plotHashtags = module.plotHashtags;
        plotHashtags(attr.hashtagsHisto); // can be missing so avoid exceptions
    });
}

function displayCommunityInfo(node, attr, clusterInfo) {
    if (node === "")
        return;
    const infoDisp = $('#comminfo-disp');
    const community = clusterInfo[attr.community];
    infoDisp[0].innerHTML = formatCommunityInfo(community, attr.community);
    $('#twitter-search-link').attr('href', buildCommunitySearchUrl(window.graph, attr.community));
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
    const MAX_NODE_SIZE = 15;
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

function plotHashtagsTimeline() {
    import(/*webpackChunkName: "hashtagsTimeline" */'./hashtagsTimeline').then(async module => {
        const plotHashtagsData = module.plotHashtagsData;
        await plotHashtagsData(hashtagsUrl, "#nav-hashtags-tab",
            20, 24, 3, 3);
    });
}

const nodeReducer = (node, data) => {
    let alpha = 0.1;
    let color = data.color;
    let filterActive = displayHashtagSubgraph || displayCommunitiesSubgraph;
    let filterMatch = false;
    if (displayHashtagSubgraph && !displayCommunitiesSubgraph && selectedHashtagNodes.has(node)) {
        alpha = 1;
        filterMatch = true;
    }
    if (displayCommunitiesSubgraph && !displayHashtagSubgraph && selectedCommunitiesNodes.has(node))
    {
        alpha = 1;
        filterMatch = true;
    }
    if (displayCommunitiesSubgraph && displayHashtagSubgraph) {
        const commMatch = selectedCommunitiesNodes.has(node);
        const hashtagMatch = selectedHashtagNodes.has(node);
        if ((commMatch && !hashtagMatch) || (!commMatch && hashtagMatch)) { // match half of active filters
            alpha = 0.5;
            filterMatch = true;
        }
        else if (hashtagMatch && commMatch) { // full match
            alpha = 1;
            filterMatch = true;
        }
    }
    if (filterActive) {
        // if the node is selected, display it even if it is filtered out by hashtags/community
        if (selectedNodes.has(node)) {
            color = '#0f0';
            if (!filterMatch)
                alpha = 0.5;
            else
                alpha = 1;
        }
        const newColor = Color(color).alpha(alpha);
        return {...data, color: newColor.rgb().string(), zIndex: 0};
    }
    if (selectedNodes.has(node))
        return {...data, color: '#0f0', zIndex: 1};
    if (highlightedNodes.has(node))
        return {...data, color: '#f00', zIndex: 1};
    if (highlightedNeighbors.has(node))
        return {...data, color: '#700', zIndex: 1};
    if (data.spikyball_hop > currMaxHop) {
        const delta = data.spikyball_hop - currMaxHop;
        const alpha = Math.max(0.05, 0.3 - 0.1 * (delta)); // do not use if spiky_hop == currMaxHop
        const newColor = Color(data.color).darken(1.5 * delta / maxHop).desaturate(1.5 * delta / maxHop).alpha(alpha);

        return {...data, color: newColor.rgb().string(), zIndex: 0};
    }
    return data;
};

const edgeReducer = (edge, data) => {
    if ((displayHashtagSubgraph && !selectedHashtagEdges.has(edge)) ||
        (displayCommunitiesSubgraph && !selectedCommunitiesEdges.has(edge))) {
        const alpha = 0.1;
        const newColor = Color('#111').alpha(alpha);
        return {...data, color: newColor.rgb().string()};
    }
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
    let clusterInfo;
    let isGexf = false;
    let maxDegree = 0;
    let hashtagList = [];

    $('#userhashtags-disp').empty();
    $('#userinfo-disp').empty();
    $('#wordcloud-disp').empty();
    $('#comminfo-disp').empty();
    selectedNodes = new Set();
    console.log('Rendering...');
    if (window.graph)
        window.graph.clear();
    // show spinner
    layoutControls.hide();
    spinDisp.show();

    fetch(baseUrl + graphUUID)
        .then(response => response.json())
        .then((d) => {
            isGexf = d.isGexf || false;
            if (isGexf) {
                maxWeight = d.attributes.maxWeight;
                maxHop = d.attributes.maxHop;
                maxDegree = d.attributes.maxDegree;
                hashtagList = d.attributes.hashtags;
            }
            clusterInfo = d.clusterInfo;
            return new Uint8Array(window.atob(d.compressedGraph).split('').map(c => c.charCodeAt(0)))
        })
        //.then(res => res.arrayBuffer())
        .then(ab => pako.inflate(ab, {to:'string'}))
        .then(r => {
            if (isGexf)
                return gexfParse(graph, r);
            return graph.from(JSON.parse(r));
        })
        .then(g => {
            const container = $('#sigma-container');
            if (isGexf) {
                g.setAttribute('maxDegree', maxDegree);
            } else {
                maxWeight = g.getAttribute('max weight');
                maxHop = g.getAttribute('max hop');
                hashtagList = g.getAttribute('hashtags');
            }

            // parse hashtags
            g.forEachNode((key, attrs) => {
                const jsonHashtags = attrs.all_hashtags || '[]';
                const hashtagsHisto = Object.entries(JSON.parse(jsonHashtags.replace(/'/g, '"'))).map((p) => {
                    return {name:p[0], num:p[1]};
                }).sort(function(a,b) {return b.num - a.num});
                g.setNodeAttribute(key, 'hashtagsHisto', hashtagsHisto);
                g.setNodeAttribute(key, 'hashtags', hashtagsHisto.map(h => h.name));
            });

            const renderer = new Sigma(g, container[0], {
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

            renderer.on('leaveNode', ({_}) => {
                highlightedNodes.clear();
                highlightedEdges.clear();
                renderer.refresh();
            });

            renderer.on('clickNode', ({node}) => {
                const attr = g.getNodeAttributes(node);
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
            const nodeSelect2 = $('#node-selector');
            nodeSelect2.empty();
            nodeSelect2.select2({
                placeholder: 'Search node',
                theme: 'bootstrap4',
                data: nodeSelectData,
                multiple: true
            });

            nodeSelect2.off('select2:select select2:unselect');
            nodeSelect2.on('select2:select', e => {
                const node = e.params.data.id;
                selectedNodes.add(node);
                displayNodeInfo(node, g.getNodeAttributes(node), clusterInfo);
                renderer.refresh();
            });
            nodeSelect2.on('select2:unselect', e => {
                const node = e.params.data.id;
                selectedNodes.delete(node);
                renderer.refresh();
            });

            const hashtagSelectData = [{id: '', text: ''}].concat($.map(hashtagList, function (h) {
                return {
                    id: h,
                    text: h,
                    selected: false
                }
            }));
            const hashtagSelect = $('#hashtag-selector');
            hashtagSelect.empty();
            hashtagSelect.select2({
                placeholder: 'Search hashtag',
                theme: 'bootstrap4',
                multiple: true,
                data: hashtagSelectData
            });
            hashtagSelect.off('select2:select select2:unselect');
            hashtagSelect.on('select2:select select2:unselect', e => {
                if (displayHashtagSubgraph)
                    rebuildHashtagsSubgraph(g, renderer);
            });

            const communitySelectData =  [{id: '', text: ''}].concat($.map(Object.keys(clusterInfo), function (h) {
                return {
                    id: h,
                    text: `Community ${h}`,
                    selected: false
                }
            }));
            const communitySelect = $('#community-selector');
            communitySelect.empty();
            communitySelect.select2({
                theme: 'bootstrap4',
                multiple: true,
                data: communitySelectData
            });
            communitySelect.off('select2:select select2:unselect');
            communitySelect.on('select2:select select2:unselect', e => {
                if (displayCommunitiesSubgraph)
                    rebuildCommunitySubgraph(g, renderer);
            });

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
if (devEnv) {
    uuidGraph = "70892cdb-0cd9-4f99-b455-c6022372666f";
}
else {
    const uuidRegex = /([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\/?/g
    uuidGraph = window.location.toString().match(uuidRegex)[0];
}
renderGraph(uuidGraph);
window.onload = function() {
    console.log('onload start...');
    $('#fa2').change(() => {
        console.log('FA2 layout -> reload coords');
        window.graph.forEachNode(function(key, _) {
            window.graph.setNodeAttribute(key, 'x', savedCoords[key].x);
            window.graph.setNodeAttribute(key, 'y', savedCoords[key].y);
        });
    });

    $('#circlepack').change((_) => {
        console.log('Circlepack layout');
        circlePackLayout(window.graph);
    });

// degree display button group

    $('#degree').change((_) => {
        console.log('size <=> degree');
        computeNodesSize(window.graph, 'degree');
        if ($('#circlepack').parent().hasClass('active')) {
            circlePackLayout(window.graph);
        }
    });

    $('#indegree').change((_) => {
        console.log('size <=> in-degree');
        computeNodesSize(window.graph, 'inDegree');
        if ($('#circlepack').parent().hasClass('active')) {
            circlePackLayout(window.graph);
        }
    });

    $('#outdegree').change((_) => {
        console.log('size <=> out-degree');
        computeNodesSize(window.graph, 'outDegree');
        if ($('#circlepack').parent().hasClass('active')) {
            circlePackLayout(window.graph);
        }
    });

    $('#hashtag-filter').click(() => {
        if($('#hashtag-filter').hasClass('active')) {
            console.log('de-activate hashtag filter');
            displayHashtagSubgraph = false;
            selectedHashtags = null;
            window.renderer.refresh();
        } else {
            console.log('activate hashtag filter');
            displayHashtagSubgraph = true;
            rebuildHashtagsSubgraph(window.graph, window.renderer);
        }
    });

    $('#community-filter').click(() => {
        if ($('#community-filter').hasClass('active')) {
            console.log('de-activate community filter');
            displayCommunitiesSubgraph = false;
            selectedCommunities = null;
            window.renderer.refresh();
        } else {
            console.log('activate community filter');
            displayCommunitiesSubgraph = true;
            rebuildCommunitySubgraph(window.graph, window.renderer);
        }
    });

    $('#nav-hashtags-tab').on('shown.bs.tab', e => {

    });

    console.log('onload complete');
}
