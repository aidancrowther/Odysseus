var portList = {};
var allIps = {};
var config = {};
var hosts = {};

//get values and attach button listeners
$(document).ready(function(){
	getPorts();
	getConfig();
	$('#updateBtn').click(function(){
		updateConfig();
		writeUpdate();
	});
    $('#changePortBtn').click(function(){
		updatePorts();
    });
    $('#redirectHostBtn').click(function(){
    	redirectHost();
	});
    $('#enableMonitoring').change(function(){
        config['monitoring'] = ($('#enableMonitoring').val() == "True");
        if($('#enableMonitoring').val() == "True"){
            $('#monitors').slideDown(1000);
            populateMonitors();
        }
        else{
            $('#monitors').slideUp(1000);
        }
        writeUpdate(true);
	});
    $('#omitHostBtn').click(function(){
        updateOmissions();
    });
    $('.hideModal').click(function(){
        clearModals();
    });
});

//Fetch the list of valid hosts based on config settings
function getList(){
	$.get('/hosts', function(hostList){
		hosts = hostList;
		$('#pages').empty();
        for(var key in hostList){
        	var ports = hostList[key]['port'];
        	if(typeof hostList[key]['port'] === 'string') ports = hostList[key]['port'].split(', ');
        	for(var port in ports) {
                var div = $('<div id=' + hostList[key]['ip'] + '-' + ports[port] + ' class="host"><p>' + hostList[key]['reverse'] + '</p></div>');
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
		if(thumbnails[key].split('.')[0] == portList[port]){
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
	$('#ipStart').val(config['ipScanStart']);
	$('#ipEnd').val(config['ipScanEnd']);
	var ports = config['ports'];
	$('#ports').empty();
	for(var port in ports){
		var service = ' - '+portList[ports[port]];
		$('#ports').append('<option>'+ports[port]+service+'</option>');
	}
	$('#domain').val(config['domain']);
	var state = "False";
	console.log(config['ignoreHost']);
	if(config['ignoreHost'] == 'true') state = "True";
	$('#ignoreHost').val(state);
	$('#redirects').empty();
	var redirects = config['redirect'];
	for(var key in redirects) if(hosts[key] && key){
        for(var redirectPort in redirects[key]['ports']) {
            $('#redirects').append('<option>' + key + ':' + redirects[key]['ports'][redirectPort] + ' => ' + key + ':' + redirects[key]['ports'][redirectPort] + redirects[key]['redirects'][redirectPort] + '</option>');
        }
    }

	if(config['monitoring'] == "true"){
        $('#enableMonitoring').val("True");
        $('#monitors').slideDown(1000);
        populateMonitors();
	}
	else{
        $('#monitors').slideUp(1000);
	}
}

function checkConfig(){

    var configOkay = true;

    if(config['ipScanStart']) {
        if(config['ipScanStart'].includes('.')) {
            if(/^[0-9.]+$/.test(config['ipScanStart'])) {
                var ipStart = config['ipScanStart'].split('.');
                if (ipStart.length == 4 && parseInt(ipStart[3]) < 255 && parseInt(ipStart[3]) >= 0) configOkay = configOkay && true;
                else configOkay = false;
            }
            else configOkay = false;
        }
        else configOkay = false;
    }
    else configOkay = false;

    if(config['ipScanEnd']) {
        if(config['ipScanEnd'].includes('.')) {
            if (/^[0-9.]+$/.test(config['ipScanStart'])) {
                var ipEnd = config['ipScanEnd'].split('.');
                if (ipEnd.length == 4 && parseInt(ipEnd[3]) < 255 && parseInt(ipEnd[3]) >= 0) configOkay = configOkay && true;
                else configOkay = false;
            }
            else configOkay = false;
        }
        else configOkay = false;
    }
    else configOkay = false;

    if(ipStart && ipEnd){
        if(parseInt(ipEnd[3]) >= parseInt(ipStart[3]) && (ipStart.slice(0,3).join('.')) == (ipEnd.slice(0,3).join('.'))) configOkay = configOkay && true;
        else configOkay = false;
    }
    else configOkay = false;

    if(/^[a-zA-Z]+$/.test(config['domain'])) configOkay = configOkay && true;
    else configOkay = false;

    if (config['ipOmit'] == [] || !config['ipOmit']) config['ipOmit'] = [''];
    if (config['ipForce'] == [] || !config['ipForce']) config['ipForce'] = [''];
    if(!config['redirect']['Host']) config['redirect']['Host'] = ["port", "/redirect"];

    return configOkay;
}

//parse settings page and update config accordingly
function updateConfig(){
    if($('#ipStart').val()) config['ipScanStart'] = $('#ipStart').val();
    if($('#ipEnd').val()) config['ipScanEnd'] = $('#ipEnd').val();
    if($('#domain').val()) config['domain'] = $('#domain').val();
    if($('#ignoreHost').val() == "True") config['ignoreHost'] = 'true';
    else config['ignoreHost'] = 'false';
}

//Update list of omitted addresses
function updateOmissions(){
    if($('#omitHost').val()){
        var host = $('#omitHost').val();
        var omissions = config['omitHosts'];
        if(omissions.includes(host)){
            config['omitHosts'].splice(omissions.indexOf(host), 1);
            var locatedHost;
            for(var ip in allIps) if(allIps[ip]['reverse'] == host) locatedHost = allIps[ip];
            locatedHost['omit'] = false;
            hosts[locatedHost['reverse']] = locatedHost;
        }
        else if(hosts[host]){
            config['omitHosts'].push(host);
            allIps[hosts[host]['ip']]['omit'] = true;
            delete hosts[host];
        }
    }
    else{
        var omissions = $('#ipOmit').val();
        for (var omission in omissions) {
            var host = {};
            for (var ip in allIps) {
                if (allIps[ip]['ip'] == omissions[omission].split(' - ')[1]) host = allIps[ip];
            }
            if(!config['omitHosts'].includes(host['reverse'])) {
                if (host['forced']) {
                    config['ipForce'].splice(config['ipForce'].indexOf(host['ip']), 1);
                    allIps[host['ip']]['forced'] = false;
                    delete allIps[host['ip']]['reverse'];
                    delete hosts[host['reverse']];
                }
                else if (!host['forced'] && !host['reverse'] && !config['ipForce'].includes(host['ip'])) {
                    config['ipForce'].push(host['ip']);
                    allIps[host['ip']]['forced'] = true;
                    allIps[host['ip']]['reverse'] = allIps[host['ip']]['ip'];
                }
                else if (host['omit']) {
                    config['ipOmit'].splice(config['ipOmit'].indexOf(host['ip']), 1);
                    allIps[host['ip']]['omit'] = false;
                }
                else {
                    config['ipOmit'].push(host['ip']);
                    allIps[host['ip']]['omit'] = true;
                }
            }
        }
    }
    writeIps('ipOmit');
}

//Add/remove ports specified by user
function updatePorts(){
    if($('#ports').val()){
        var selected = $('#ports').val();
        var ports = config['ports'];
        for(var selection in selected){
            var toRemove = selected[selection].split(' - ')[0];
            console.log(toRemove);
            config['ports'].splice(config['ports'].indexOf(toRemove), 1);

            //Do not allow the user to remove all ports
            if (config['ports'].length < 1) {
                $('#warningModal').modal('show');
                $('#portWarningMessage').css('display', '');
                setTimeout(function () {
                    $('#warningModalFooter .hideModal').css('display', '');
                }, 2000);
                return;
            }

            delete portList[toRemove];
        }
    }
    else {
        if ($('#changePort').val() != null) {
            var ports = config['ports'];
            var portVal = $('#changePort').val();
            var hostName;

            if ($('#changePort').val().includes(' - ')) {
                portVal = $('#changePort').val().split(' - ')[0];
                hostName = $('#changePort').val().split(' - ')[1];
                if (/^\d+$/.test(portVal) && !config['ports'].includes(portVal)) config['ports'].push(portVal);
                for (var host in portList) if (portList[host] == portVal && hostName) delete portList[host];
                if (/^\d+$/.test(portVal) && hostName) portList[parseInt(portVal)] = hostName;
            }
        }
    }
    writeConfig();
}

//Specify host redirects
function redirectHost(){
    var host = '';
    var port = '';
    var redirect = '';

    if($('#redirects').val()){
        var selected = $('#redirects').val();
        for(var selection in selected){
            var toRemove = selected[selection].split(' => ')[0];
            host = toRemove.split(':')[0];
            port = toRemove.split(':')[1];
            config['redirect'][host]['redirects'].splice(config['redirect'][host]['ports'].indexOf(port), 1);
            config['redirect'][host]['ports'].splice(config['redirect'][host]['ports'].indexOf(port), 1);
        }
    }
    else {
        if ($('#redirectHost').val().includes(':') && $('#redirectHost').val().includes('/')) {
            host = $('#redirectHost').val().split(':')[0];
            port = $('#redirectHost').val().split(':')[1].split('/')[0];
            if (!/^\d+$/.test(port)) port = '';
            redirect = $('#redirectHost').val().split(':')[1].split('/')[1];
        }

        if (hosts[host] && port && host && redirect) {
            if (!config['redirect'][host]) config['redirect'][host] = [];
            if (config['redirect'][host]['ports'].includes(port)) {
                config['redirect'][host]['redirects'].splice(config['redirect'][host]['ports'].indexOf(port), 1);
                config['redirect'][host]['ports'].splice(config['redirect'][host]['ports'].indexOf(port), 1);
            }
            else if (config['redirect'][host]['redirects'].includes(redirect)) {
                config['redirect'][host]['ports'].splice(config['redirect'][host]['redirects'].indexOf(redirect), 1);
                config['redirect'][host]['redirects'].splice(config['redirect'][host]['redirects'].indexOf(redirect), 1);
            }
            config['redirect'][host]['ports'].push(port);
            config['redirect'][host]['redirects'].push('/' + redirect);
        }
    }

    writeConfig();
}

//Write config to server
function writeUpdate(dontScan){
    if(checkConfig()) {
        if (!dontScan) {
            $('#updateModal').modal('show');
            $('#updateLoader').css('display', '');
        }
        $.post('/update', {"config": config, "portList": portList})
            .done(function () {
                if (!dontScan) {
                    $.ajax({url: '/update', timeout: 90000})
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
                        })
                        .fail(function (error) {
                            $('#updateLoader').css('display', 'none');
                            $('#updateFailed').css('display', '');
                            setTimeout(function () {
                                $('#updateModalFooter .hideModal').css('display', '');
                            }, 2000);
                        })
                }
            });
    }
    else{
        $('#warningModal').modal('show');
        $('#configWarningMessage').css('display', '');
        setTimeout(function () {
            $('#warningModalFooter .hideModal').css('display', '');
        }, 2000);
    }
}

//Populate monitors panel with running server details
function populateMonitors(){
    $.get('/monitoring', function(data){
        if(data['error']){
        	$('#enableMonitoring').val("False");
            $('#monitors').css('display', 'none');
        	$('#monitoringWarning').css("display", "");
        	config['monitoring'] = false;
        	writeUpdate(true);
        }
        else{
            $('#hostMonitors').empty();
            for(var key in data){
                $('#hostMonitors').append('<tr><td>'+key+'</td><td>'+data[key]['status']+'</td><td>'+data[key]['uptime']+'</td><td>'+data[key]['users']+'</td><td>'+data[key]['1min']+', '+data[key]['5min']+', '+data[key]['15min']+'</td></tr>');
            }
        }
    });
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

//Fetch the server config
function getConfig(){
    $.get('/config', function(data){
        config = data;
    }).done(function(){getList();});
}

//Clear all modals/modal elements on screen
function clearModals(){
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
