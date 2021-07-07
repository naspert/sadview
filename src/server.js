const computeLayout = require('./layoutCore').computeLayout;
const graph = require('graphology');
const DirectedGraph = require('graphology').UndirectedGraph
const gexf = require('graphology-gexf');
const pako = require('pako');
const MongoClient = require('mongodb').MongoClient;
const express = require('express');
const app = express();
const log = require('simple-node-logger').createSimpleLogger();
const axios = require('axios');
const fs = require('fs');
let db;
const mongodbUrl = JSON.parse(fs.readFileSync(process.argv[2])).mongodbUrl;

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

