const fs = require('fs');

/**
 * Generates the configuration json file as well as the persistant
 * storage defaults. This method is written syncronous since
 * it only needs to be called on the server start
 */
exports.setupConfig = function () {
  if (!fs.existsSync('configs/config.json')) {
    fs.writeFileSync('configs/config.json', JSON.stringify(
      {
        omitHosts: [''],
        ports: ['80'],
        ignoreHost: true,
        monitoring: false,
        ipScanStart: '192.168.0.1',
        ipScanEnd: '192.168.0.254',
        domain: 'local',
        redirect: { Host: { ports: ['port'], redirects: ['/redirect'] } },
        updateSpeed: '0',
        UPSlist: []
      }), (err) => { console.log(err); });
  }
  if (!fs.existsSync('configs/hosts.json')) fs.writeFileSync('configs/hosts.json', JSON.stringify({}), (err) => { console.log(err); });
  if (!fs.existsSync('configs/ports.json')) fs.writeFileSync('configs/ports.json', JSON.stringify({ 80: 'web' }), (err) => { console.log(err); });
  if (!fs.existsSync('configs/ips.json')) fs.writeFileSync('configs/ips.json', JSON.stringify({}), (err) => { console.log(err); });
  if (!fs.existsSync('configs/hosts.json')) fs.writeFileSync('configs/hosts.json', JSON.stringify({}), (err) => { console.log(err); });
};
