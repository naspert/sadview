const fs = require('fs');
// Load the core build.

const { ArgumentParser } = require('argparse');
const fsGraph = require('./fsGraph');
const s3Graph = require('./s3Graph');

/* main */
const parser = new ArgumentParser({
    description: 'Compute layouts'
});

parser.add_argument('-s', '--s3-config', { help: 'S3 config file'});
parser.add_argument('-i', '--input-dir', { help: 'Input directory', nargs: 1 });
parser.add_argument('-o', '--output-dir', { help: 'Output directory', nargs: 1 });
parser.add_argument('-m', '--method', { help: 'Layout method [FA2|CP] (default=Force Atlas 2) ', default: 'FA2' });
parser.add_argument('-n', '--num-iter', { help: 'Number of iterations (default=200)', type: 'int', default:200});
opt = parser.parse_args();
console.dir(opt);

if (typeof(opt.s3_config) !== 'undefined') {
    const s3Config = JSON.parse(fs.readFileSync(opt.s3_config));
    if (!s3Config.access_key)
        s3Config.access_key = process.env.S3_ACCESS_KEY;
    if (!s3Config.secret_key)
        s3Config.secret_key = process.env.S3_SECRET_KEY;
    s3Graph.processS3Directories(s3Config, opt.input_dir[0], {outDir: opt.output_dir[0], method: opt.method, numIter: opt.num_iter});
}
else {
    fsGraph.processDirectories(opt.input_dir[0], {outDir: opt.output_dir[0], method: opt.method, numIter: opt.num_iter});
}
