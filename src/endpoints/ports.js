const fs = require('fs');
const promisify = require('util').promisify;
const readFile = promisify(fs.readFile);

/**
 * Respond to requests for port types
 */
exports.get = async function (req, res) {
  res.send(JSON.parse(await readFile('configs/ports.json')));
};
