const exec = require('child_process').exec;

/**
 * Return server monitoring results
 */
exports.get = async function (req, res) {
  exec('ruptime', function (error, stdout, stderr) {
    const result = stdout.split(/[ ,\n/\\]+/);
    const hosts = [];
    const final = {};
    let down = false;

    for (const element in result) {
      if (result[element]) { hosts.push(result[element]); }
      if (down) { for (let i = 0; i < 6; i++) { hosts.push('----------'); } }
      down = (result[element] === 'down');
    }

    for (let j = 0; j < (hosts.length / 9); j++) {
      const element = j * 9;
      final[hosts[element]] = {};
      final[hosts[element]].status = hosts[element + 1];
      final[hosts[element]].uptime = hosts[element + 2];
      final[hosts[element]].users = hosts[element + 3];
      final[hosts[element]]['1min'] = hosts[element + 6];
      final[hosts[element]]['5min'] = hosts[element + 7];
      final[hosts[element]]['15min'] = hosts[element + 8];
    }
    if (error != null) { final.error = error; }
    res.send(final);
  });
};
