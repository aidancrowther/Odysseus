//Network scanner
//Aidan Crowther - 11/5/2017

//import utilities
var fs = require('fs');
var express = require('express');
var app = express();
var evilscan = require('evilscan');
var ip = require('ip');
var bodyParser = require('body-parser');
var multer = require('multer');
var exec = require('child_process').exec;

var Storage = multer.diskStorage({
    destination: function(req, file, callback){
        callback(null, './interface/images/');
    },
    filename: function(req, file, callback){
        callback(null, file.originalname);
    }
});

var upload = multer({
    storage: Storage
}).array("image", 1);

if(!fs.existsSync('config.json')) fs.writeFileSync('config.json', JSON.stringify(
	{"omitHosts": [''],
	"ports": ["80"],
	"ignoreHost": true,
	"monitoring": false,
	"ipScanStart": "192.168.0.1",
	"ipScanEnd": "192.168.0.254",
	"domain": "local",
	"redirect": {"Host":{"ports":["port"],"redirects":["/redirect"]}}
	}), (err) => {console.log(err)});
if(!fs.existsSync('hosts.json')) fs.writeFileSync('hosts.json', JSON.stringify({}), (err) => {console.log(err)});
if(!fs.existsSync('ports.json')) fs.writeFileSync('ports.json', JSON.stringify({80: 'web'}), (err) => {console.log(err)});
if(!fs.existsSync('ips.json')) fs.writeFileSync('ips.json', JSON.stringify({}), (err) => {console.log(err)});
if(!fs.existsSync('hosts.json')) fs.writeFileSync('hosts.json', JSON.stringify({}), (err) => {console.log(err)});

//program constants
const ROOT = './interface';
const PORT = 4000;
const IP = ip.address();

//global variables
var allIps = {};

//static file server
var urlEncodedParser = bodyParser.urlencoded({ extended: true });
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
    var redirects = config['redirect'];
    var omitHosts = config['omitHosts'];

    allIps = {};

    //scan for thumbnails
    thumbnails = getThumbnails();

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

    //Run the scanner and parse results
    scanner.on('result', function(data){
        allIps[data['ip']] = data;
        allIps[data['ip']]['omit'] = false;
        allIps[data['ip']]['forced'] = false;
        if(data['reverse']) if(data['reverse'].includes('.'+domain)) allIps[data['ip']]['reverse'] = allIps[data['ip']]['reverse'].split('.')[0];
        if(ipOmit.includes(data['ip']) || omitHosts.includes(data['reverse'])) allIps[data['ip']]['omit'] = true;
        if(ipForce.includes(data['ip'])) allIps[data['ip']]['forced'] = true;
        //ignoreHost if set true
        if((ignoreHost == 'true') && data['ip'] === IP);
        //ignore devices without a hostname, unless they have been whitelisted
        else if(data.hasOwnProperty('reverse') || ipForce.indexOf(data['ip']) >= 0) if(omitHosts.indexOf(data['reverse']) < 0 && ipOmit.indexOf(data['ip']) < 0){
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
        for(var device in results) {
            var current = results[device];
            //write hosts to json object, removing duplicates
            if (!devices[current['reverse']]) {
                devices[current['reverse']] = current;
                devices[current['reverse']]['port'] = ''+current['port'];
                devices[current['reverse']]['thumbnails'] = [];
            }
            else devices[current['reverse']]['port'] += ', ' + current['port'];
            for(var port in portList) {
                if (current['port'] == port) {
                    if (thumbnails.hasOwnProperty(portList[port])) if(!devices[current['reverse']]['thumbnails'].includes(thumbnails[portList[port]][0])) devices[current['reverse']]['thumbnails'].push(thumbnails[portList[port]][0]);
                    if(redirects.hasOwnProperty(current['reverse'])){
                        if(redirects[current['reverse']]['ports'].indexOf(port) >= 0){
                            var toRedirect = String(devices[current['reverse']]['port']);
                            devices[current['reverse']]['port'] = toRedirect.replace(port, port+redirects[current['reverse']]['redirects'][redirects[current['reverse']]['ports'].indexOf(port)]);
                        }
                    }
                }
            }
            if(thumbnails.hasOwnProperty(current['reverse'])){
                devices[current['reverse']]['thumbnails'].push(thumbnails[current['reverse']][0]);
            }
        }
        //write hosts to hosts.json
        fs.writeFile('hosts.json', JSON.stringify(devices), function(err){
            if(err) res.sendStatus(500);
        });
        //write ips to ips.json
        fs.writeFile('ips.json', JSON.stringify(allIps), function(err){
            if(err) res.sendStatus(500);
        });
        res.sendStatus(200);
    });
    scanner.run();
});

//update config settings
app.post('/update', urlEncodedParser, function(req, res){
    fs.writeFile('config.json', JSON.stringify(req.body['config']), function(err){
        if(err) res.sendStatus(500);
        fs.writeFile('ports.json', JSON.stringify(req.body['portList']), function(err){
            if(err) res.sendStatus(500);
            res.sendStatus(200);
        });
    });
});

//respond to request for host list
app.get('/hosts', function(req, res){
    res.send(JSON.parse(fs.readFileSync('hosts.json')));
});

//respond to requests for port types
app.get('/ports', function(req, res){
    res.send(JSON.parse(fs.readFileSync('ports.json')));
});

//return a list of all ips within the range, regardless of config
app.get('/ips', function(req, res){
   res.send(JSON.parse(fs.readFileSync('ips.json')));
});

//return config settings
app.get('/config', function(req, res){
    res.send(JSON.parse(fs.readFileSync('config.json')));
});

//return server monitoring results
app.get('/monitoring', function(req, res){
    var checkStatus = exec('ruptime', function(error, stdout, stderr){
        var result = stdout.split(/[ ,\n/\\]+/);
        var hosts = [];
        var final = {};
	var down = false;

        for(var element in result){
            if(result[element]) hosts.push(result[element]);
	    if(down) for(var i=0; i<6; i++) hosts.push('----------');
            down = (result[element] == 'down');
        }

        for(var j=0; j<(hosts.length/9); j++){
            var element = j*9;
            final[hosts[element]] = {};
            final[hosts[element]]['status'] = hosts[element+1];
            final[hosts[element]]['uptime'] = hosts[element + 2];
            final[hosts[element]]['users'] = hosts[element + 3];
            final[hosts[element]]['1min'] = hosts[element + 6];
            final[hosts[element]]['5min'] = hosts[element + 7];
            final[hosts[element]]['15min'] = hosts[element + 8];
        }
        if(error != null) final['error'] = error;
        res.send(final);
    });
});

app.get('/thumbnails', function(req, res){
    res.send(getThumbnails());
});

app.post('/thumbnails', function(req, res){
    upload(req, res, function(err){
        if(err) return res.sendStatus(500);
        return res.sendStatus(204);
    });
});

app.post('/removeThumbnails', urlEncodedParser, function(req, res){
    var toRemove = req.body.toRemove;
    for(var image in toRemove) fs.unlink('./interface/images/'+toRemove[image]);
    res.send("Files removed successfully");
});

//listen for requests on port 8080
app.listen(PORT, function(err){if(err) console.log(err)});

function getThumbnails(){
    var thumbnails = {};
    var images = fs.readdirSync('./interface/images');
    for(var image in images){
        var toSplit = images[image];
        if(images[image].includes('-')) toSplit = toSplit.split('-')[1];
        var current = toSplit.split('.')[0];
        if(thumbnails[current]) thumbnails[current].push(images[image]);
        else thumbnails[current] = [images[image]];
    }
    return thumbnails;
}
