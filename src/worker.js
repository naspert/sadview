const computeLayout = require('./layoutCore').computeLayout;
const graph = require('graphology');
const DirectedGraph = require('graphology').DirectedGraph;
const gexf = require('graphology-gexf');
const pako = require('pako');
const celery = require('celery-node');
const celeryWorker = celery.createWorker(process.env.CELERY_BROKER, process.env.CELERY_BACKEND);
const MongoClient = require('mongodb').MongoClient;
const mongodbUrl = process.env.MONGODB_URL;

let db;

celeryWorker.register("graph_layout",  async (collect_run_uuid) => {
    console.log(`Performing layout for run ${collect_run_uuid}`);
    const result = await db.collection("taskmeta_collection").findOne({_id: collect_run_uuid})
        .then((b) => {
            const graph_str = pako.inflate(b.result.graph.buffer, {to: 'string'});
            const g = new DirectedGraph.from(gexf.parse(graph, graph_str));
            console.log("Body contains a graph having %d nodes and %d edges", g.order, g.size)
            return computeLayout(g, "FA2", 200, {});
        });
    return await db.collection("taskmeta_collection")
        .updateOne({_id: collect_run_uuid},
            {
                $set: {
                    "result.graph_layout": result
                }
            });
});

// Initialize connection once
MongoClient.connect(mongodbUrl, function(err, client) {
    if(err) throw err;

    db = client.db();

    // Start the worker after the database connection is ready
    console.log("Starting celery worker");
    celeryWorker.start();
});





