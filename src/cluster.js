const fs = require('fs');
const graph = require('graphology');
const density = require('graphology-metrics/density.js');
const weightedSize = require('graphology-metrics/weighted-size');
const graphop = require('graphology-operators');
const _ = require('lodash');

function buildClusterInfo(graphObj, clusterLex, iramuteqLex=true) {
    let info = {};
    // build communities stats
    const communities = _.groupBy(graphObj.nodes(), node => {
        return graphObj.getNodeAttribute(node, 'community');
    });

    Object.keys(communities).forEach(k => {
        // sort by decreasing in-degree
        communities[k] = communities[k].sort(function(a,b) {
            return graphObj.getNodeAttribute(b, 'inDegree') - graphObj.getNodeAttribute(a, 'inDegree');
        });
        // compute community density
        const subg = graphop.subgraph(graphObj, communities[k]);
        const d = density.directedDensity(subg);
        const ws = weightedSize(subg);
        let vocKey = k;
        if (iramuteqLex) {
            vocKey = 'X.cluster_' + k;
        }
        info[k] = { size: communities[k].length, density: d, weightedSize: ws,
        members: communities[k], lexical: clusterLex[vocKey]};
    });
    return info;
}

exports.buildClusterInfo = buildClusterInfo

