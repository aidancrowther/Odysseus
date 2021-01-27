/**
 * Network scanner
 * Aidan Crowther - 11/5/2017
 */

// import utilities
const express = require('express');
const app = express();
const ip = require('ip');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const setupConfig = require('./setup-config').setupConfig;

// API endpoints
const update = require('./endpoints/update');
const monitoring = require('./endpoints/monitoring');
const thumbnails = require('./endpoints/thumbnails');
const hosts = require('./endpoints/hosts');
const upsStatus = require('./endpoints/ups-status');
const ports = require('./endpoints/ports');
const ips = require('./endpoints/ips');
const config = require('./endpoints/config');

// program constants
const ROOT = './interface';
const PORT = 80;

// global variables
global.IP = ip.address();
global.allIps = {};

// Sets up the configuration files
setupConfig();

// static file server
app.use(express.static('interface'));
// respond to request for index.html
app.get('/', (req, res) => res.sendFile(ROOT + '/index.html'));
// General use middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Registers endpoints
app.get('/update', update.get);
app.post('/update', update.post);
app.get('/hosts', hosts.get);
app.get('/ports', ports.get);
app.get('/ips', ips.get);
app.get('/config', config.get);
app.get('/monitoring', monitoring.get);
app.get('/thumbnails', thumbnails.get);
app.delete('/thumbnails', thumbnails.del);
app.post('/thumbnails', thumbnails.post);
app.get('/ups-status', upsStatus.get);

// Handles uncaught express errors by logging them
app.use((err, req, res, next) => { console.error(err); });

// listen for requests on port 8080
app.listen(PORT, (err) => { if (err) console.log(err); });
