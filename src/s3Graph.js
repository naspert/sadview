const graph = require('graphology');
const DirectedGraph = require('graphology').DirectedGraph;
const gexf = require('graphology-gexf');
const AWS = require('aws-sdk');
const computeLayout = require('./layoutCore').computeLayout;
const path = require('path');

async function loadS3GraphFile(s3, s3Config, key) {
    const params = {
        Bucket: s3Config.bucket,
        Key: key
    };
    try {
        const data = await s3.getObject(params).promise();
        const gexf_data = data.Body.toString('utf-8');
        return new DirectedGraph.from(gexf.parse(graph, gexf_data));
    } catch (e) {
        throw new Error(`Could not retrieve file from S3: ${e.message}`)
    }
}

async function readLexFileS3(s3, s3Config, clusterLexFile) {
    const params = { Bucket: s3Config.bucket, Key: clusterLexFile}
    try {
        const data = await s3.getObject(params).promise();
        // fix Python code in lexisad !;
        const txt = data.Body.toString('utf-8').replace(/:\s* Infinity/g, ': 0.0');
        return JSON.parse(txt);
    } catch (e) {
        throw new Error(`Could not retrieve file from S3: ${e.message}`)
    }
}

async function saveClusterInfoS3(s3, s3Config, info, outputFile) {
    const params = { Bucket: s3Config.bucket, Key: outputFile, Body: JSON.stringify(info) }
    return s3.putObject(params).promise();
}

async function saveCompressedOutputS3(s3, s3Config, compressedGraph, outputGraphFile) {
    const params = { Bucket: s3Config.bucket, Key: outputGraphFile, Body: Buffer.from(compressedGraph)}
    return s3.putObject(params).promise();
}

async function markFolderProcessed(s3, s3Config, folder) {
    const params = { Bucket: s3Config.bucket, Key: folder + '.processed', Body: ''}
    return s3.putObject(params).promise();
}

async function loadIndex(s3, s3Config, dir) {
    const params = { Bucket: s3Config.bucket, Key: dir + 'index.json'};
    const indexExists = await s3.headObject(params).promise()
        .then(() => true,
        err => {
            if (err.code === 'NotFound') {
                return false;
            }
            throw err;
        });
    if (!indexExists)
        return [];
    const index = await s3.getObject(params).promise();
    return JSON.parse(index);
}

function processS3DataDir(s3, s3Config, dir, options, index) {
    const params = {
        Bucket : s3Config.bucket,
        Delimiter: '/',
        Prefix: dir.endsWith('/') ? dir : dir + '/'
    }

    s3.listObjectsV2(params, (err, data) => {
        if (err) {
            console.log("Error", err);
        } else {
            const files = data.Contents.map(v => v.Key.replace(data.Prefix, ''));
            if (files.includes('.processed')) {// nothing to do
                console.log('Directory ', dir, ' already processed. Skipping.')
                return; // should be present in index
            }
            files.forEach(f => {
                if (f.endsWith('.gexf')) {
                    const fout = f.replace('.gexf', '.json.gz')
                    Promise.all([
                        loadS3GraphFile(s3, s3Config, data.Prefix + f),
                        readLexFileS3(s3, s3Config, data.Prefix + 'clusters.json')
                    ]).then(res => {
                            console.log('Processing ', f, ' --> ', fout);
                            return computeLayout(res[0], options.method, options.numIter, res[1]);
                    }).then(res => {
                            return Promise.all([
                                saveClusterInfoS3(s3, s3Config, res.clusterInfo, data.Prefix + 'cluster_info.json'),
                                saveCompressedOutputS3(s3, s3Config, res.compressedGraph, data.Prefix + fout),
                                markFolderProcessed(s3, s3Config, data.Prefix)
                            ])
                    }).then(res => {
                        console.log('Processing ', f, ' done !');
                        const base = path.basename(dir);
                        index.push({label: base, graph: path.join(base, fout),
                            clusterInfo: path.join(base, 'cluster_info.json'), escape: false});
                    }).catch((error) => {
                        console.error(error);
                    });
                }
            });
        }
    });
}

async function processS3Directories(s3Config, startDir, options) {
    const s3  = new AWS.S3({
        accessKeyId: s3Config.access_key ,
        secretAccessKey: s3Config.secret_key ,
        endpoint: s3Config.endpoint_url,
        s3ForcePathStyle: true, // needed ?
        signatureVersion: 'v4'
    });
    const dir = startDir.endsWith('/') ? startDir : startDir + '/';
    const bucketParams = {
        Bucket : s3Config.bucket,
        Delimiter: '/',
        Prefix: dir
    };
    const index = await loadIndex(s3, s3Config, dir);
    s3.listObjectsV2(bucketParams, function(err, data) {
        if (err) {
            console.log("Error", err);
        } else {
            data.CommonPrefixes.forEach(cp => {
                processS3DataDir(s3, s3Config, cp.Prefix, options, index);
            });
        }
    });
}

exports.processS3Directories = processS3Directories
