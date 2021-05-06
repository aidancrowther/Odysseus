const exec = require('child_process').exec;
const fs = require('fs');
const promisify = require('util').promisify;
const readFile = promisify(fs.readFile);

/**
 * Return ups monitoring results
 */
exports.get = async function (req, res) {
  const config = JSON.parse(await readFile('configs/config.json'));
  const results = [];

  for (const ups of config.UPSlist) {
    const dataDict = {};

    let status = await exec(`upsc ${ups.address}`);
    status = status.toString('utf8');
    for (const entry of status.split('\n')) {
      if (entry !== '') { dataDict[entry.split(':')[0]] = entry.split(':')[1].trim(); }
    }

    results.push(dataDict);
  }
  res.send(results);
};
