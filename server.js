//Network scanner
//Aidan Crowther - 11/5/2017

//import utilities
var fs = require('fs');
var express = require('express');
var app = express();
var evilscan = require('evilscan');
var ip = require('ip');

//program constants
const ROOT = './interface';
const PORT = 8080;
//const IP = ip.address();
const IP = "127.0.0.1";

//static file server
app.use(express.static('interface'));

//respond to request for index.html
app.get('/', function(req, res){
    res.sendfile( ROOT + '/index.html');
});

//update hosts upon receiving get request for /update
app.get('/update', function(req, res){
    var config = JSON.parse(fs.readFileSync('config.json'));
    var portList = JSON.parse(fs.readFileSync('ports.json'));
    var options = {};
    var ipRange = config['ipScanStart']+'-'+config['ipScanEnd'];
    var ports = '';
    var domain = config['domain'];
    var ipOmit = config['ipOmit'];
    var ipForce = config['ipForce'];
    var ignoreHost = config['ignoreHost'];
    var thumbnails = {};

    //scan for thumbnails
    var images = fs.readdirSync('./interface/images');
    for(var image in images){
        var current = images[image].split('.')[0];
        if(thumbnails[current]) thumbnails[current].append(images[image]);
        else thumbnails[current] = [images[image]];
    }

    //set the scanners options
    options['target'] = ipRange;
    for(var port in config['ports']){
        if(port != config['ports'].length-1) ports += config['ports'][port]+', ';
        else ports += config['ports'][port];
    }
    options['port'] = ports;
    options['reverse'] = true;
    options['json'] = true;

    var results = [];
    var scanner = new evilscan(options);

    scanner.on('result', function(data){
        //ignoreHost if set true
        if(ignoreHost && data['ip'] === IP);
        //ignore devices without a hostname, unless they have been whitelisted
        else if(data.hasOwnProperty('reverse') || ipForce.indexOf(data['ip']) >= 0) if(ipOmit.indexOf(data['ip']) < 0){
            //set the name field of whitelisted servers to their IP
            if(ipForce.indexOf(data['ip']) >= 0) data['reverse'] = data['ip'];
            //strip host domain from names
            if(data['reverse'].includes('.'+domain)) data['reverse'] = data['reverse'].split('.')[0];
            results.push(data);
        }
    });
    scanner.on('error', function(err){ console.log(err); });
    scanner.on('done', function(){
        var devices = {};
        for(var device in results){
            var current = results[device];
            //write hosts to json object, removing duplicates
            if(!devices[current['reverse']]){
                devices[current['reverse']] = current;
            }
            else devices[current['reverse']]['port'] += ', '+current['port'];
            for(var port in portList){
                if(current['port'] === portList[port]){
                    if(thumbnails.hasOwnProperty(port)) devices[current['reverse']]['thumbnails'] = thumbnails[port];
                }
            }
        }
        //write hosts to hosts.json
        fs.writeFile('hosts.json', JSON.stringify(devices), function(err){
            if(err) console.log(err);
            //send completion notice to browser
            else res.sendStatus(200);
        });
    });
    scanner.run();
});

//respond to request for host list
app.get('/hosts', function(req, res){
    res.send(JSON.parse(fs.readFileSync('hosts.json')));
});

//respond to requests for port types
app.get('/ports', function(req, res){
    res.send(JSON.parse(fs.readFileSync('ports.json')));
});

//listen for requests on port 8080
app.listen(PORT, function(err){if(err) console.log(err)});