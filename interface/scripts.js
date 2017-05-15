var portList = {};
var allIps = {};
var config = {};
var hosts = {};

//get values and attach button listeners
$(document).ready(function(){
	getPorts();
	writeConfig();
	getList();
	$('#updateBtn').click(function(){
		updateConfig();
		$.post('/update', config)
			.done(function() {
                $.get('/update')
                    .done(function(){
                        getPorts();
                        getList();
                    });
			});
	});
    $('#changePortBtn').click(function(){
		updatePorts();
    });
    $('#redirectHostBtn').click(function(){
    	redirectHost();
	});
	$('#loginButton').click(function(){

	});
});

//Fetch the list of valid hosts based on config settings
function getList(){
	$.get('/hosts', function(hostList){
		hosts = hostList;
		$('#pages').empty();
        for(var key in hostList){
        	var ports = [hostList[key]['port']];
        	if(typeof hostList[key]['port'] === 'string') ports = hostList[key]['port'].split(', ');
        	for(var port in ports) {
                var div = $('<div id=' + key + '-' + ports[port] + ' class="host"><p>' + hostList[key]['reverse'] + '</p></div>');
                if (hostList[key]['thumbnails']) addThumbnail(div, ports[port], hostList[key]['thumbnails']);
                $(div).click(redirect);
                $('#pages').append($(div));
            }
        }
	})
		.done(function(){
			writeConfig();
		});
}

//Add thumbnails to elements if they exist
function addThumbnail(element, port, thumbnails){
	if(typeof port == 'string') if(port.includes('/')) port = port.split('/')[0];
	for(var key in thumbnails){
		if(portList[thumbnails[key].split('.')[0]] == port){
			$(element).html($(element).html()+'</p><p>'+thumbnails[key].split('.')[0]);
			$(element).css('background-image', 'url(images/'+thumbnails[key]+')')
        }
	}
}

//Write a list of ips to the specified field
function writeIps(id){
	$('#'+id).empty();
	for(var ip in allIps){
		var omitted = '';
		var forced  = '';
		if(allIps[ip]['omit']) omitted = ' - Ignored';
		if(allIps[ip]['forced']) forced = ' - Forced';
		if(!allIps[ip]['reverse'] && !allIps[ip]['forced']) omitted = ' - Ignored';
		$('#'+id).append('<option>'+allIps[ip]['reverse']+' - '+allIps[ip]['ip']+omitted+forced+'</option>');
	}
}

//Write config settings to settings page
function writeConfig(){
	getIps();
	$.get('/config', function(data){
		config = data;
	})
		.done(function(){
			$('#ipStart').val(config['ipScanStart']);
			$('#ipEnd').val(config['ipScanEnd']);
			var ports = config['ports'];
			$('#ports').empty();
			for(var port in ports){
				var service = '';
				for(var serviceName in portList) if(portList[serviceName] == ports[port]) service = " - "+serviceName;
				$('#ports').append('<option>'+ports[port]+service+'</option>');
			}
			$('#domain').val(config['domain']);
			var state = "False";
			if(config['ignoreHost']) state = "True";
			$('#ignoreHost').val(state);
			$('#redirects').empty();
			var redirects = config['redirect'];
			for(var key in redirects){
				$('#redirects').append('<option>'+key+':'+redirects[key][0]+' => '+key+':'+redirects[key][0]+redirects[key][1]+'</option>');
			}
		})
}

//parse settings page and update config accordingly
function updateConfig(){
    config['ipScanStart'] = $('#ipStart').val();
    config['ipScanEnd'] = $('#ipEnd').val();
    config['domain'] = $('#domain').val();

    var ignoreHost = false;
    if($('#ignoreHost').val() == "True") ignoreHost = true;
    config['ignoreHost'] = ignoreHost;

    var omissions = $('#ipOmit').val();
    for(var omission in omissions){
    	var host = {};
    	for(var ip in allIps){
    		if(allIps[ip]['ip'] == omissions[omission].split(' - ')[1]) host = allIps[ip];
		}
		if(host['forced']) config['ipForce'].splice(config['ipForce'].indexOf(host['ip']), 1);
		else if(!host['forced'] && !host['reverse']) config['ipForce'].push(host['ip']);
		else if(host['omit']) config['ipOmit'].splice(config['ipOmit'].indexOf(host['ip']), 1);
		else config['ipOmit'].push(host['ip']);
	}

	if(config['ipOmit'] == [] || !config['ipOmit']) config['ipOmit'] = [''];
    if(config['ipForce'] == [] || !config['ipForce']) config['ipForce'] = [''];

    console.log(config);
}

//Add/remove ports specified by user
function updatePorts(){
	if($('#changePort').val() != null){
		var removed = false;
		var ports = config['ports'];
        var portVal = $('#changePort').val();
        var hostName;
        if ($('#changePort').val().includes(' - ')){
        	portVal = $('#changePort').val().split(' - ')[0];
        	hostName = $('#changePort').val().split(' - ')[1];
            if(/^\d+$/.test(portVal) && !config['ports'].includes(portVal)) config['ports'].push(portVal);
            for(var host in portList) if(portList[host] == portVal && hostName) delete portList[host];
            if(/^\d+$/.test(portVal) && hostName) portList[hostName] = parseInt(portVal);
        }
        else {
            for (var port in ports) {
                if (ports[port] == portVal) {
                    config['ports'].splice(config['ports'].indexOf(portVal), 1);
                    removed = true;
                }
            }
        }
	}
}

//Specify host redirects
function redirectHost(){
    var host = '';
    var port = '';
    var redirect = '';

    if($('#redirectHost').val().split(':')[0]) host = $('#redirectHost').val().split(':')[0];
    if($('#redirectHost').val().split(':')[1].split('/')[0]) port = $('#redirectHost').val().split(':')[1].split('/')[0];
    if(!/^\d+$/.test(port)) port = '';
    if($('#redirectHost').val().split(':')[1].split('/')[1]) redirect = $('#redirectHost').val().split(':')[1].split('/')[1];

    if(host && port && redirect && hosts[host]) {
        if (!config['redirect'][host]) config['redirect'][host] = [];
        config['redirect'][host][0] = port;
        config['redirect'][host][1] = redirect;
    }
}

//Send client to webpage
function redirect(){
	window.location = 'http://'+$(this).attr('id').split('-')[0]+':'+$(this).attr('id').split('-')[1];
}

//Fetch a list of port definitions (services)
function getPorts(){
    $.get('/ports', function(data){
        portList = data;
    })
}

//Fetch a list of all IPs that were scanned
function getIps(){
    $.get('/ips', function(data){
        allIps = data;
        writeIps('ipOmit');
    })
}