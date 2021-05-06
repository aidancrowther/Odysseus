const fs = require('fs');
const Evilscan = require('evilscan');
const promisify = require('util').promisify;
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const getThumbnails = require('../thumbnails').getThumbnails;

/**
 * Update hosts upon receiving get request for /update
 */
exports.get = async function (req, res) {
  const config = JSON.parse(await readFile('configs/config.json'));
  const portList = JSON.parse(await readFile('configs/ports.json'));
  const options = {};
  const ipRange = config.ipScanStart + '-' + config.ipScanEnd;
  let ports = '';
  const domain = config.domain;
  const ipOmit = config.ipOmit;
  const ipForce = config.ipForce;
  const ignoreHost = config.ignoreHost;
  let thumbnails = {};
  const redirects = config.redirect;
  const omitHosts = config.omitHosts;

  global.allIps = {};

  // scan for thumbnails
  thumbnails = await getThumbnails();

  // set the scanners options
  options.target = ipRange;
  for (const port in config.ports) {
    if (port !== config.ports.length - 1) ports += config.ports[port] + ', ';
    else ports += config.ports[port];
  }

  options.port = ports;
  options.reverse = true;
  options.json = true;

  const results = [];
  const scanner = new Evilscan(options);

  // Run the scanner and parse results
  scanner.on('result', function (data) {
    global.allIps[data.ip] = data;
    global.allIps[data.ip].omit = false;
    global.allIps[data.ip].forced = false;
    if (data.reverse) if (data.reverse.includes('.' + domain)) global.allIps[data.ip].reverse = global.allIps[data.ip].reverse.split('.')[0];
    if (ipOmit.includes(data.ip) || omitHosts.includes(data.reverse)) global.allIps[data.ip].omit = true;
    if (ipForce.includes(data.ip)) global.allIps[data.ip].forced = true;
    // ignoreHost if set true
    if ((ignoreHost === 'true') && data.ip === global.IP);
    // ignore devices without a hostname, unless they have been whitelisted
    else if (data.hasOwnProperty('reverse') || ipForce.indexOf(data.ip) >= 0) {
      if (omitHosts.indexOf(data.reverse) < 0 && ipOmit.indexOf(data.ip) < 0) {
      // set the name field of whitelisted servers to their IP
        if (ipForce.indexOf(data.ip) >= 0) data.reverse = data.ip;
        // strip host domain from names
        if (data.reverse.includes('.' + domain)) data.reverse = data.reverse.split('.')[0];
        results.push(data);
      }
    }
  });
  scanner.on('error', function (err) { console.log(err); });
  scanner.on('done', async function () {
    const devices = {};
    for (const device in results) {
      const current = results[device];
      // write hosts to json object, removing duplicates
      if (!devices[current.reverse]) {
        devices[current.reverse] = current;
        devices[current.reverse].port = '' + current.port;
        devices[current.reverse].thumbnails = [];
      } else devices[current.reverse].port += ', ' + current.port;
      for (const port in portList) {
        if (current.port === port) {
          if (thumbnails.hasOwnProperty(portList[port])) if (!devices[current.reverse].thumbnails.includes(thumbnails[portList[port]][0])) devices[current.reverse].thumbnails.push(thumbnails[portList[port]][0]);
          if (redirects.hasOwnProperty(current.reverse)) {
            if (redirects[current.reverse].ports.indexOf(port) >= 0) {
              const toRedirect = String(devices[current.reverse].port);
              devices[current.reverse].port = toRedirect.replace(port, port + redirects[current.reverse].redirects[redirects[current.reverse].ports.indexOf(port)]);
            }
          }
        }
      }
      if (thumbnails.hasOwnProperty(current.reverse)) {
        devices[current.reverse].thumbnails.push(thumbnails[current.reverse][0]);
      }
    }
    // write hosts to hosts.json
    try {
      await writeFile('configs/hosts.json', JSON.stringify(devices));
      await writeFile('configs/ips.json', JSON.stringify(global.allIps));
    } catch (error) {
      return await res.sendStatus(500);
    }
    return await res.sendStatus(200);
  });
  scanner.run();
};

/**
 * Update config settings
 */
exports.post = async function (req, res) {
  try {
    await writeFile('configs/config.json', JSON.stringify(req.body.config));
    await writeFile('configs/ports.json', JSON.stringify(req.body.portList));
  } catch (error) {
    return res.status(500);
  }
  return res.status(200);
};
