const fs = require('fs');

const promisify = require('util').promisify;
const readFile = promisify(fs.readFile);

/**
 *
 */
exports.get = async function (req, res) {
  return await res.send(JSON.parse(await readFile('config.json')));
};
