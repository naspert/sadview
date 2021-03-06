const path = require('path');
const computeLayout = require('./layoutCore').computeLayout;
const graph = require('graphology');
const DirectedGraph = require('graphology').DirectedGraph;
const gexf = require('graphology-gexf');
const pako = require('pako');
const celery = require('celery-node');
const axios = require('axios');
const combineURLs = require('axios/lib/helpers/combineURLs');
const celeryWorker = celery.createWorker(process.env.CELERY_BROKER, process.env.CELERY_BACKEND, process.env.CELERY_QUEUE_NAME);
const MongoClient = require('mongodb').MongoClient;
const mongodbUrl = process.env.MONGODB_URL;
const log = require('simple-node-logger').createSimpleFileLogger(path.join(process.env.LOG_DIR, 'sadview-worker.log'));
let db;

celeryWorker.register(process.env.CELERY_LAYOUT_TASK_NAME,  async (collectResult) => {
    let collectRunUUID = collectResult._id;
    log.info("Performing layout for run ", collectRunUUID);
    const graphStr = pako.inflate(Buffer.from(collectResult.graph, 'base64'), {to: 'string'});
    const g = new DirectedGraph.from(gexf.parse(graph, graphStr));
    log.info("Graph from ", collectRunUUID, " has ", g.order, " nodes, and ", g.size," edges.")
    const layoutResult =  computeLayout(g, "FA2", collectResult.fa2NumIter, collectResult.clusterLex, false, log);
    let result = {graph: layoutResult.graph, clusterInfo:layoutResult.clusterInfo}
    result.compressedGraph = Buffer.from(layoutResult.compressedGraph).toString("base64");
    collectResult.graphLayout = result;
    log.info("Layout for ", collectRunUUID, " completed.");

    const updateRes =  await db.collection("taskmeta_collection")
        .updateOne({_id: collectRunUUID},
            {
                $set: {
                    "result.graphLayout": result
                }
            });
    const absCompletionUrl = combineURLs(process.env.INSTANCE_URL, collectResult.completion_url);
    log.info("Calling completion callback at ", absCompletionUrl, " with token ", collectResult.token);
    const res = await axios.post(absCompletionUrl, {token: collectResult.token.toString()})
    log.info("Completion callback status code: ", res.status, " message: ", res.statusText);

    return { _id: collectRunUUID, updateRes: updateRes , callbackResult: {status: res.status, statusText: res.statusText}}
});


// Initialize connection once
MongoClient.connect(mongodbUrl, function(err, client) {
    if(err) throw err;

    db = client.db();

    // Start the worker after the database connection is ready
    log.info("Starting celery worker");
    celeryWorker.start();
});





