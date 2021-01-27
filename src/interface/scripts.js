/* global $ */
/* global Gauge */
/* global ipStart */
/* global ipEnd */

let portList = {};
let allIps = {};
let config = {};
let hosts = {};
const charts = {};
let upsStatus = {};

// get values and attach button listeners
$(document).ready(function () {
  getPorts();
  getConfig();
  toggleUPSPanel(false);
  $('#updateBtn').click(function () {
    updateConfig();
    writeUpdate();
  });
  $('#changePortBtn').click(function () {
    updatePorts();
  });
  $('#redirectHostBtn').click(function () {
    redirectHost();
  });
  $('#enableMonitoring').change(function () {
    config.monitoring = ($('#enableMonitoring').val() === 'True');
    if ($('#enableMonitoring').val() === 'True') {
      $('#monitors').slideDown(1000);
    } else {
      $('#monitors').slideUp(1000);
    }
    writeUpdate(true);
  });
  $('#setSpeed').click(function () {
    config.updateSpeed = $('#updateSpeed').val();
    writeUpdate(true);
    location.reload();
  });
  $('#omitHostBtn').click(function () {
    updateOmissions();
  });
  $('#thumbnailBtn').change(function () {
    if ($('#thumbnailBtn').val().includes('.png')) $('#thumbnailForm').submit();
    setTimeout(function () { writeThumbnails(); }, 50);
  });
  $('#thumbnailRemove').click(function () {
    removeThumbnails();
  });
  $('.hideModal').click(function () {
    clearModals();
  });
  $('#upsConfig').click(function () {
    toggleUPSPanel($('#panel-down').css('display') === 'none');
  });
  $('#addUPSConfig').click(function () {
    addUPS();
  });
  $('#saveUPSConfig').click(function () {
    saveUPS();
  });
  $('#applyUPSConfig').click(function () {
    writeUpdate(true);
    drawGraphs();
  });
  $('#enableUPSMonitoring').change(function () {
    config.upsMonitoring = ($('#enableUPSMonitoring').val() === 'True');
    if ($('#enableUPSMonitoring').val() === 'True') {
      $('#upsCharts').slideDown(1000);
    } else {
      $('#upsCharts').slideUp(1000);
    }
    writeUpdate(true);
  });
});

// Fetch the list of valid hosts based on config settings
function getList () {
  $.get('/hosts', function (hostList) {
    hosts = hostList;
    $('#pages').empty();
    for (const key in hostList) {
      let ports = hostList[key].port;
      if (typeof hostList[key].port === 'string') ports = hostList[key].port.split(', ');
      for (const port in ports) {
        const div = $('<div id=' + hostList[key].ip + '-' + ports[port] + ' class="host"><p>' + hostList[key].reverse + '</p></div>');
        if (hostList[key].thumbnails) addThumbnail(div, ports[port], hostList[key].thumbnails, key);
        $(div).click(redirect);
        $('#pages').append($(div));
      }
    }
  })
    .done(function () {
      writeConfig();
    });
}

// Add thumbnails to elements if they exist
function addThumbnail (element, port, thumbnails, host) {
  for (const key in thumbnails) {
    if (thumbnails[key].split('.')[0] === portList[port]) {
      $(element).html(host + '</p><p>' + thumbnails[key].split('.')[0]);
      $(element).css('background-image', 'url(images/' + thumbnails[key] + ')');
    }
  }

  for (const key in thumbnails) {
    let toSplit = thumbnails[key];
    if (toSplit.includes('-')) toSplit = toSplit.split('-');
    if (toSplit[1].split('.')[0] === host) {
      $(element).html(host + '</p><p>' + toSplit[0]);
      $(element).css('background-image', 'url(images/' + thumbnails[key] + ')');
    }
  }

  if (!$(element).css('background-image')) {
    $(element).html(host + '</p><p>' + 'default');
    $(element).css('background-image', 'url(images/default.png)');
  }
}

// Write a list of ips to the specified field
function writeIps (id) {
  $('#' + id).empty();
  for (const ip in allIps) {
    let omitted = '';
    let forced = '';
    if (allIps[ip].omit) omitted = ' - Ignored';
    if (allIps[ip].forced) forced = ' - Forced';
    if (!allIps[ip].reverse && !allIps[ip].forced) omitted = ' - Ignored';
    $('#' + id).append('<option>' + allIps[ip].reverse + ' - ' + allIps[ip].ip + omitted + forced + '</option>');
  }
}

// Write config settings to settings page
function writeConfig () {
  getIps();
  $('#ipStart').val(config.ipScanStart);
  $('#ipEnd').val(config.ipScanEnd);
  const ports = config.ports;
  $('#ports').empty();
  for (const port in ports) {
    const service = ' - ' + portList[ports[port]];
    $('#ports').append('<option>' + ports[port] + service + '</option>');
  }
  $('#domain').val(config.domain);
  let state = 'False';
  if (config.ignoreHost === 'true') state = 'True';
  $('#ignoreHost').val(state);
  $('#redirects').empty();
  const redirects = config.redirect;
  for (const key in redirects) {
    if (hosts[key] && key) {
      for (const redirectPort in redirects[key].ports) {
        if (redirects[key].ports[redirectPort]) $('#redirects').append('<option>' + key + ':' + redirects[key].ports[redirectPort] + ' => ' + key + ':' + redirects[key].ports[redirectPort] + redirects[key].redirects[redirectPort] + '</option>');
      }
    }
  }

  if (config.monitoring === 'true' && $('#enableMonitoring').val() !== undefined) {
    $('#enableMonitoring').val('True');
    if (config.updateSpeed) $('#updateSpeed').val(config.updateSpeed);
    populateMonitors();
    setTimeout(() => { $('#monitors').slideDown(1000); }, 100);
    setInterval(populateMonitors, $('#updateSpeed').val() * 1000);
  } else {
    $('#monitors').slideUp(1000);
  }

  if (config.upsMonitoring === 'true' && $('#enableUPSMonitoring').val() !== undefined) {
    $('#enableUPSMonitoring').val('True');
    setInterval(updateGraphs, 5000);
    getUPSStatus(true);
  } else {
    getUPSStatus(false);
  }

  loadUPSList();
  writeThumbnails();
}

function checkConfig () {
  let configOkay = true;

  if (config.ipScanStart) {
    if (config.ipScanStart.includes('.')) {
      if (/^[0-9.]+$/.test(config.ipScanStart)) {
        const ipStart = config.ipScanStart.split('.');
        if (ipStart.length === 4 && parseInt(ipStart[3]) < 255 && parseInt(ipStart[3]) >= 0) configOkay = configOkay && true;
        else configOkay = false;
      } else configOkay = false;
    } else configOkay = false;
  } else configOkay = false;

  if (config.ipScanEnd) {
    if (config.ipScanEnd.includes('.')) {
      if (/^[0-9.]+$/.test(config.ipScanStart)) {
        const ipEnd = config.ipScanEnd.split('.');
        if (ipEnd.length === 4 && parseInt(ipEnd[3]) < 255 && parseInt(ipEnd[3]) >= 0) configOkay = configOkay && true;
        else configOkay = false;
      } else configOkay = false;
    } else configOkay = false;
  } else configOkay = false;

  if (ipStart && ipEnd) {
    if (parseInt(ipEnd[3]) >= parseInt(ipStart[3]) && (ipStart.slice(0, 3).join('.')) === (ipEnd.slice(0, 3).join('.'))) configOkay = configOkay && true;
    else configOkay = false;
  } else configOkay = false;

  if (/^[a-zA-Z]+$/.test(config.domain)) configOkay = configOkay && true;
  else configOkay = false;

  if (config.ipOmit === [] || !config.ipOmit) config.ipOmit = [''];
  if (config.ipForce === [] || !config.ipForce) config.ipForce = [''];
  if (!config.redirect.Host) config.redirect.Host = ['port', '/redirect'];

  return configOkay;
}

// parse settings page and update config accordingly
function updateConfig () {
  if ($('#ipStart').val()) config.ipScanStart = $('#ipStart').val();
  if ($('#ipEnd').val()) config.ipScanEnd = $('#ipEnd').val();
  if ($('#domain').val()) config.domain = $('#domain').val();
  if ($('#ignoreHost').val() === 'True') config.ignoreHost = 'true';
  else config.ignoreHost = 'false';
}

// Update list of omitted addresses
function updateOmissions () {
  if ($('#omitHost').val()) {
    const host = $('#omitHost').val();
    const omissions = config.omitHosts;
    if (omissions.includes(host)) {
      config.omitHosts.splice(omissions.indexOf(host), 1);
      let locatedHost;
      for (const ip in allIps) if (allIps[ip].reverse === host) locatedHost = allIps[ip];
      locatedHost.omit = false;
    } else {
      for (const ip in allIps) {
        if (allIps[ip].reverse === host) {
          config.omitHosts.push(host);
          allIps[ip].omit = true;
        }
      }
    }
  } else {
    const omissions = $('#ipOmit').val();
    for (const omission in omissions) {
      let host = {};
      for (const ip in allIps) {
        if (allIps[ip].ip === omissions[omission].split(' - ')[1]) host = allIps[ip];
      }
      if (!config.omitHosts.includes(host.reverse)) {
        if (host.forced) {
          config.ipForce.splice(config.ipForce.indexOf(host.ip), 1);
          allIps[host.ip].forced = false;
          delete allIps[host.ip].reverse;
          delete hosts[host.reverse];
        } else if (!host.forced && !host.reverse && !config.ipForce.includes(host.ip)) {
          config.ipForce.push(host.ip);
          allIps[host.ip].forced = true;
          allIps[host.ip].reverse = allIps[host.ip].ip;
        } else if (host.omit) {
          config.ipOmit.splice(config.ipOmit.indexOf(host.ip), 1);
          allIps[host.ip].omit = false;
        } else {
          config.ipOmit.push(host.ip);
          allIps[host.ip].omit = true;
        }
      }
    }
  }
  writeIps('ipOmit');
}

// Add/remove ports specified by user
function updatePorts () {
  if ($('#ports').val()) {
    const selected = $('#ports').val();
    for (const selection in selected) {
      const toRemove = selected[selection].split(' - ')[0];
      config.ports.splice(config.ports.indexOf(toRemove), 1);

      // Do not allow the user to remove all ports
      if (config.ports.length < 1) {
        $('#warningModal').modal('show');
        $('#portWarningMessage').css('display', '');
        setTimeout(function () {
          $('#warningModalFooter .hideModal').css('display', '');
        }, 2000);
        return;
      }

      delete portList[toRemove];
    }
  } else {
    if ($('#changePort').val() != null) {
      let portVal = $('#changePort').val();
      let hostName;

      if ($('#changePort').val().includes(' - ')) {
        portVal = $('#changePort').val().split(' - ')[0];
        hostName = $('#changePort').val().split(' - ')[1];
        if (/^\d+$/.test(portVal) && !config.ports.includes(portVal)) config.ports.push(portVal);
        for (const host in portList) if (portList[host] === portVal && hostName) delete portList[host];
        if (/^\d+$/.test(portVal) && hostName) portList[parseInt(portVal)] = hostName;
      }
    }
  }
  writeConfig();
}

// Specify host redirects
function redirectHost () {
  let host = '';
  let port = '';
  let redirectURI = '';

  if ($('#redirects').val()) {
    const selected = $('#redirects').val();
    for (const selection in selected) {
      const toRemove = selected[selection].split(' => ')[0];
      host = toRemove.split(':')[0];
      port = toRemove.split(':')[1];
      config.redirect[host].redirects.splice(config.redirect[host].ports.indexOf(port), 1);
      config.redirect[host].ports.splice(config.redirect[host].ports.indexOf(port), 1);
    }
  } else {
    if ($('#redirectHost').val().includes(':') && $('#redirectHost').val().includes('/')) {
      host = $('#redirectHost').val().split(':')[0];
      port = $('#redirectHost').val().split(':')[1].split('/')[0];
      if (!/^\d+$/.test(port)) port = '';
      redirectURI = $('#redirectHost').val().split(':')[1].split('/')[1];
    }

    if (hosts[host] && port && host && redirectURI) {
      if (!config.redirect[host]) config.redirect[host] = { ports: [''], redirects: [''] };
      if (config.redirect[host].ports.includes(port)) {
        config.redirect[host].redirects.splice(config.redirect[host].ports.indexOf(port), 1);
        config.redirect[host].ports.splice(config.redirect[host].ports.indexOf(port), 1);
      } else if (config.redirect[host].redirects.includes(redirectURI)) {
        config.redirect[host].ports.splice(config.redirect[host].redirects.indexOf(redirectURI), 1);
        config.redirect[host].redirects.splice(config.redirect[host].redirects.indexOf(redirectURI), 1);
      }
      config.redirect[host].ports.push(port);
      config.redirect[host].redirects.push('/' + redirectURI);
    }
  }

  writeConfig();
}

// Write config to server
function writeUpdate (dontScan) {
  if (checkConfig()) {
    if (!dontScan) {
      $('#updateModal').modal('show');
      $('#updateLoader').css('display', '');
    }
    $.post('/update', { config: config, portList: portList })
      .done(function () {
        if (!dontScan) {
          $.ajax({ url: '/update', timeout: 90000 })
            .done(function () {
              getPorts();
              getList();
              getConfig();
              $('#updateLoader').css('display', 'none');
              $('#updateComplete').css('display', '');
              setTimeout(function () {
                $('#updateComplete').css('display', 'none');
                $('#updateModal').modal('hide');
              }, 2000);
            }).fail(function (_error) {
              $('#updateLoader').css('display', 'none');
              $('#updateFailed').css('display', '');
              setTimeout(function () {
                $('#updateModalFooter .hideModal').css('display', '');
              }, 2000);
            });
        }
      });
  } else {
    $('#warningModal').modal('show');
    $('#configWarningMessage').css('display', '');
    setTimeout(function () {
      $('#warningModalFooter .hideModal').css('display', '');
    }, 2000);
  }
}

// Populate monitors panel with running server details
function populateMonitors () {
  $.get('/monitoring', function (data) {
    if (data.error) {
      $('#enableMonitoring').val('False');
      $('#monitors').css('display', 'none');
      $('#monitoringWarning').css('display', '');
      config.monitoring = false;
      writeUpdate(true);
    } else {
      $('#hostMonitors').empty();
      for (const key in data) {
        $('#hostMonitors').append('<tr><td>' + key + '</td><td>' + data[key].status + '</td><td>' + data[key].uptime + '</td><td>' + data[key].users + '</td><td>' + data[key]['1min'] + ', ' + data[key]['5min'] + ', ' + data[key]['15min'] + '</td></tr>');
      }
    }
  });
}

function writeThumbnails () {
  $.get('/thumbnails', function (data) {
    $('#thumbnails').empty();
    for (const thumbnail in data) {
      if (data[thumbnail][0].includes('.png')) $('#thumbnails').append("<option id='" + thumbnail + "'>" + thumbnail + ' : ' + data[thumbnail][0] + '</option>');
    }
  });
}

function removeThumbnails () {
  const selected = $('#thumbnails').val();
  const toRemove = { toRemove: [] };

  for (const selection in selected) toRemove.toRemove.push(selected[selection].split(' : ')[1]);

  $.delete('/thumbnails', toRemove, function (data, status) {});

  writeThumbnails();
}

// Send client to webpage
function redirect () {
  window.location = 'http://' + $(this).attr('id').split('-')[0] + ':' + $(this).attr('id').split('-')[1];
}

// Fetch a list of port definitions (services)
function getPorts () {
  $.get('/ports', function (data) {
    portList = data;
  });
}

// Fetch a list of all IPs that were scanned
function getIps () {
  $.get('/ips', function (data) {
    allIps = data;
    writeIps('ipOmit');
  });
}

// Fetch the server config
function getConfig () {
  $.get('/config', function (data) {
    config = data;
  }).done(function () { getList(); });
}

// Clear all modals/modal elements on screen
function clearModals () {
  $('#updateFailed').css('display', 'none');
  $('#updateComplete').css('display', 'none');
  $('#portWarningMessage').css('display', 'none');
  $('#configWarningMessage').css('display', 'none');
  $('#updateModalFooter [data-dismiss="modal"]').css('display', 'none');
  $('#warningModalFooter [data-dismiss="modal"]').css('display', 'none');
  $('#updateModalFooter .hideModal').css('display', 'none');
  $('#warningModalFooter .hideModal').css('display', 'none');
  $('#updateModal').modal('hide');
  $('#warningModal').modal('hide');
}

function toggleUPSPanel (visible) {
  const toggleVal = visible ? '' : 'none';
  const inverse = visible ? 'none' : '';
  $('#panel-left').css('display', inverse);
  $('#panel-down').css('display', toggleVal);
  $('#upsConfigPanel').css('display', toggleVal);
}

function addUPS () {
  $('#newUPSPanel').append(`
    <div class="form-group">
      <label for="address">NUT Address: </label>
      <input class="form-control" id="address" placeholder="ups@localhost">
      <label for="extras">Additional Monitored Stats (Seperate with semicolon): </label>
      <input class="form-control" id="extras" placeholder="e.g battery.runtime; ups.power">
      <label for="power">UPS Nominal Power Override (Watts)</label>
      <input class="form-control" id="power" placeholder="e.g 900">
    </div>
  `);
  $('#addUPSConfig').prop('disabled', true);
  $('#saveUPSConfig').prop('disabled', false);
}

function saveUPS () {
  const ups = {
    address: '',
    extras: [],
    power: ''
  };
  if ($('#address').val() !== '') ups.address = $('#address').val();
  ups.power = $('#power').val();

  for (const extra of $('#extras').val().split(';')) {
    ups.extras.push(extra.trim());
  }

  if (!config.UPSlist) config.UPSlist = [];
  config.UPSlist.push(ups);

  $('#newUPSPanel').empty();
  $('#addUPSConfig').prop('disabled', false);
  $('#saveUPSConfig').prop('disabled', true);

  loadUPSList();
}

function loadUPSList () {
  $('#UPSlist').empty();

  for (const ups in config.UPSlist) {
    $('#UPSlist').append(`
    <div id="UPS-${ups}" class="form-group">
      <label for="address">NUT Address: </label>
      <input class="form-control address" disabled>
      <label for="extras">Additional Monitored Stats: </label>
      <input class="form-control extras" disabled>
      <label for="power">UPS Nominal Power Override (Watts)</label>
      <input class="form-control power" disabled>
      <br><button id="removeUPSConfig" onclick="removeUPS(' + ups + ')" class="btn btn-danger">Remove <span class="glyphicon glyphicon-remove"></span></button> 
    </div>
    `);

    $('#UPS-' + ups + ' .address').val(config.UPSlist[ups].address);
    $('#UPS-' + ups + ' .extras').val(config.UPSlist[ups].extras.join('; '));
    $('#UPS-' + ups + ' .power').val(config.UPSlist[ups].power);
  }
}

// eslint-disable-next-line no-unused-vars
function removeUPS (id) {
  config.UPSlist.splice(id, 1);
  loadUPSList();
}

function getUPSStatus (drawCharts) {
  $.get('/ups-status', function (res) {
    upsStatus = res;
  }).done(function () {
    if (drawCharts) drawGraphs();
  });
}

function drawGraphs () {
  const status = upsStatus;

  $('#upsCharts').empty();
  let idx = 0;

  for (const ups of status) {
    $('#upsCharts').append(`
        <h2>${ups['device.model']}</h2>
        <table>
          <tr>
            <td><div style="display: flex;justify-content: center;"><h3>UPS Load</h3></div></td>
            <td><div style="display: flex;justify-content: center;"><h3>Battery Capacity</h3></td>
            <td><div style="display: flex;justify-content: center;"><h3>Power Draw</h3></td>
            <td><div style="display: flex;justify-content: center;"><h3>Estimated Runtime</h3></td>
          </tr>
          <tr>
            <td><canvas id="loadChart${idx}" width="340vw" height="240vh"></canvas></td>
            <td><canvas id="capacityChart${idx}" width="340vw" height="240vh"></canvas></td>
            <td><canvas id="powerChart${idx}" width="340vw" height="240vh"></canvas></td>
            <td><canvas id="runtime${idx}" width="340vw" height="240vh"></canvas></td>
          </tr>
          <td><div style="display: flex;justify-content: center;"><h3 id="loadValue${idx}"></h3><h3>%</h3></div></td>
          <td><div style="display: flex;justify-content: center;"><h3 id="capacityValue${idx}"></h3><h3>%</h3></div></td>
          <td><div style="display: flex;justify-content: center;"><h3 id="powerValue${idx}"></h3><h3>Watts</h3></div></td>
        </table>
    `);

    charts[idx] = {
      load: null,
      capacity: null,
      power: null,
      runtime: null
    };

    createLoadGauge(idx);
    createCapacityGauge(idx);
    createPowerGauge(idx);
    createRuntimeCanvas(idx);
    idx++;
  }

  updateGraphs();
}

function createLoadGauge (upsId) {
  const opts = {
    angle: 0.15, // The span of the gauge arc
    lineWidth: 0.3, // The line thickness
    radiusScale: 0.8, // Relative radius
    pointer: {
      length: 0.42, // // Relative to gauge radius
      strokeWidth: 0.05, // The thickness
      color: '#000000' // Fill color
    },
    staticLabels: {
      font: '10px sans-serif', // Specifies font
      labels: [0, 30, 70, 100], // Print labels at these values
      color: '#000000', // Optional: Label text color
      fractionDigits: 0 // Optional: Numerical precision. 0=round off.
    },
    staticZones: [
      { strokeStyle: '#F03E3E', min: 70, max: 100 }, // Red from 100 to 130
      { strokeStyle: '#FFDD00', min: 30, max: 70 }, // Yellow
      { strokeStyle: '#30B32D', min: 0, max: 30 } // Green
    ],
    limitMax: true, // If false, max value increases automatically if value > maxValue
    limitMin: true, // If true, the min value of the gauge will be fixed
    colorStart: '#6FADCF', // Colors
    colorStop: '#8FC0DA', // just experiment with them
    strokeColor: '#E0E0E0', // to see which ones work best for you
    generateGradient: true,
    highDpiSupport: true // High resolution support

  };
  const target = document.getElementById('loadChart' + upsId); // your canvas element
  const gauge = new Gauge(target).setOptions(opts); // create sexy gauge!
  gauge.maxValue = 100; // set max gauge value
  gauge.setMinValue(0); // Prefer setter over gauge.minValue = 0
  gauge.animationSpeed = 32; // set animation speed (32 is default value)
  gauge.setTextField(document.getElementById('loadValue' + upsId));
  gauge.set(0); // set actual value

  charts[upsId].load = gauge;
}

function createCapacityGauge (upsId) {
  const opts = {
    angle: 0.15, // The span of the gauge arc
    lineWidth: 0.3, // The line thickness
    radiusScale: 0.8, // Relative radius
    pointer: {
      length: 0.42, // // Relative to gauge radius
      strokeWidth: 0.05, // The thickness
      color: '#000000' // Fill color
    },
    staticLabels: {
      font: '10px sans-serif', // Specifies font
      labels: [0, 30, 70, 100], // Print labels at these values
      color: '#000000', // Optional: Label text color
      fractionDigits: 0 // Optional: Numerical precision. 0=round off.
    },
    staticZones: [
      { strokeStyle: '#F03E3E', min: 0, max: 30 }, // Red from 100 to 130
      { strokeStyle: '#FFDD00', min: 30, max: 70 }, // Yellow
      { strokeStyle: '#30B32D', min: 70, max: 100 } // Green
    ],
    limitMax: true, // If false, max value increases automatically if value > maxValue
    limitMin: true, // If true, the min value of the gauge will be fixed
    colorStart: '#6FADCF', // Colors
    colorStop: '#8FC0DA', // just experiment with them
    strokeColor: '#E0E0E0', // to see which ones work best for you
    generateGradient: true,
    highDpiSupport: true // High resolution support

  };
  const target = document.getElementById('capacityChart' + upsId); // your canvas element
  const gauge = new Gauge(target).setOptions(opts); // create sexy gauge!
  gauge.maxValue = 100; // set max gauge value
  gauge.setMinValue(0); // Prefer setter over gauge.minValue = 0
  gauge.animationSpeed = 32; // set animation speed (32 is default value)
  gauge.setTextField(document.getElementById('capacityValue' + upsId));
  gauge.set(50); // set actual value

  charts[upsId].capacity = gauge;
}

function createPowerGauge (upsId) {
  const nominalPower = config.UPSlist[upsId].power;

  const opts = {
    angle: 0.15, // The span of the gauge arc
    lineWidth: 0.3, // The line thickness
    radiusScale: 0.8, // Relative radius
    pointer: {
      length: 0.42, // // Relative to gauge radius
      strokeWidth: 0.05, // The thickness
      color: '#000000' // Fill color
    },
    staticLabels: {
      font: '10px sans-serif', // Specifies font
      labels: [0, (nominalPower * 0.3), (nominalPower * 0.7), (nominalPower * 1)], // Print labels at these values
      color: '#000000', // Optional: Label text color
      fractionDigits: 0 // Optional: Numerical precision. 0=round off.
    },
    staticZones: [
      { strokeStyle: '#F03E3E', min: (nominalPower * 0.7), max: (nominalPower * 1) }, // Red from 100 to 130
      { strokeStyle: '#FFDD00', min: (nominalPower * 0.3), max: (nominalPower * 0.7) }, // Yellow
      { strokeStyle: '#30B32D', min: 0, max: (nominalPower * 0.3) } // Green
    ],
    limitMax: true, // If false, max value increases automatically if value > maxValue
    limitMin: true, // If true, the min value of the gauge will be fixed
    colorStart: '#6FADCF', // Colors
    colorStop: '#8FC0DA', // just experiment with them
    strokeColor: '#E0E0E0', // to see which ones work best for you
    generateGradient: true,
    highDpiSupport: true // High resolution support

  };
  const target = document.getElementById('powerChart' + upsId); // your canvas element
  const gauge = new Gauge(target).setOptions(opts); // create sexy gauge!
  gauge.maxValue = nominalPower; // set max gauge value
  gauge.setMinValue(0); // Prefer setter over gauge.minValue = 0
  gauge.animationSpeed = 32; // set animation speed (32 is default value)
  gauge.setTextField(document.getElementById('powerValue' + upsId));
  gauge.set(nominalPower); // set actual value

  charts[upsId].power = gauge;
}

function createRuntimeCanvas (upsId) {
  const canvas = document.getElementById('runtime' + upsId);
  const ctx = canvas.getContext('2d');
  ctx.font = '30px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('0 minutes', canvas.width / 2, canvas.height / 2);
  charts[upsId].runtime = [canvas, ctx];
}

function updateGraphs () {
  getUPSStatus(false);

  for (const chart in charts) {
    charts[chart].load.set(upsStatus[chart]['ups.load']);
    charts[chart].capacity.set(upsStatus[chart]['battery.charge']);
    charts[chart].power.set((upsStatus[chart]['ups.load'] / 100) * config.UPSlist[chart].power);
    charts[chart].runtime[1].clearRect(0, 0, charts[chart].runtime[0].width, charts[chart].runtime[0].height);
    charts[chart].runtime[1].fillText((upsStatus[chart]['battery.runtime'] / 60).toFixed(2) + ' minutes', charts[chart].runtime[0].width / 2, charts[chart].runtime[0].height / 2);
  }
}
