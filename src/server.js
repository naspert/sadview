/*const computeLayout = require('./layoutCore').computeLayout;
const graph = require('graphology');
const DirectedGraph = require('graphology').UndirectedGraph
const gexf = require('graphology-gexf');
const pako = require('pako');*/
const MongoClient = require('mongodb').MongoClient;
const express = require('express');
const app = express();
const log = require('simple-node-logger').createSimpleLogger();
const fs = require('fs');
const axios = require('axios');
const _ = require("lodash");
let db;
const mongodbUrl = JSON.parse(fs.readFileSync(process.argv[2])).mongodbUrl;
const dataUrl = "https://imi-dev.clockworkpanda.xyz/viewer/hashtags-timeline";

const getLayoutData = async function(uuid) {
    const result = await db.collection("taskmeta_collection").findOne({_id: uuid});
    let graphLayout = result.result.graphLayout || null;
    if(graphLayout)
        return graphLayout;
    else {
        let child = result.children[0][0][0]||null;
        if (child)
            return await getLayoutData(child);
        else
            return null;
    }
}

function getDataHashtags(data, activThr = 3, minActiv=1) {
    let filtData = {};

    Object.keys(data.hashtags).forEach(k => {
        //console.log(k);
        if (_.size(data.hashtags[k]) > activThr) {// keep only hashtags active on more than x timecodes
            filtData[k] = {};
            Object.keys(data.hashtags[k]).forEach(p => {
                filtData[k][p] = _.sum(Object.values(data.hashtags[k][p]));;
            });
            if (_.max(Object.values(filtData[k])) < minActiv) // remove low activity hashtags
                delete filtData[k];
        }
    });

    let timelineData = [];
    Object.keys(filtData).forEach(k => {
        Object.keys(filtData[k]).forEach(p => timelineData.push([data.time[p].created_date_rs, filtData[k][p], k]));
    })
    const legend = Object.keys(filtData);
    const detailData =  _.pick(data.hashtags, legend);
    let detailTimeline = {};
    Object.keys(detailData).forEach(k => {
       // iterate times
       Object.keys(detailData[k]).forEach(p => {
           let t = data.time[p].created_date_rs;
           if (!detailTimeline.hasOwnProperty(t))
               detailTimeline[t] = {};
           detailTimeline[t][k] = detailData[k][p]
       });
    });
    return {data: timelineData, legend: Object.keys(filtData), details: detailData, detailTimeline: detailTimeline};
}

// Initialize connection once
MongoClient.connect(mongodbUrl, function(err, client) {
    if(err) throw err;

    db = client.db();

    // Start the worker after the database connection is ready
    log.info("Starting app");
    app.listen(8081);
});
app.use(express.static('static'));
app.use(express.static('public'));

app.get("/viewer/graph-layout-data/:collect_run_uuid", async function(req, res) {
    const collect_run_uuid = req.params.collect_run_uuid;
    log.info("Getting data for run ", collect_run_uuid);
    const result = await getLayoutData(collect_run_uuid);
    res.send(result);
});

app.get("/hashtags-data/:collect_run_uuid/:num_days/:sample_hours/:activ_thr/:min_activ", async function(req, res) {
    const collect_run_uuid = req.params.collect_run_uuid;
    const num_days = req.params.num_days;
    const sample_hours = req.params.sample_hours;
    const activ_thr = req.params.activ_thr;
    const min_activ = req.params.min_activ;
    log.info("Getting data for run ", collect_run_uuid);
    const reqUrl = `${dataUrl}/${collect_run_uuid}/${num_days}/${sample_hours}`;
    log.info("Fetching data at ", reqUrl)
    try {
        const hashtagsData = await axios.get(reqUrl,
            {headers: {"Authorization": "Token c81ffb903cbdcc9e0fc0d1a99656be8dc6a12d57"}});
        res.send(getDataHashtags(hashtagsData.data, activ_thr, min_activ));
    } catch (e) {
        log.error(e);
    }
});

