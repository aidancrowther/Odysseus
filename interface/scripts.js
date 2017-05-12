var portList = {};

$(document).ready(function(){
	getPorts();
	getList();
	$('#updateBtn').click(function(){
		$.get('/update')
		.done(function(){
			getPorts();
			getList();
		});
	});
	$('#loginButton').click(function(){

	});
});

function getList(){
	$.get('/hosts', function(hostList){
		$('#pages').empty();
		console.log(hostList);
        for(var key in hostList){
        	var ports = [hostList[key]['port']];
        	if(typeof hostList[key]['port'] === 'string') ports = hostList[key]['port'].split(', ');
        	for(var port in ports) {
                var div = $('<div id=' + key + '-' + ports[port] + ' class="host">' + hostList[key]['reverse'] + '</div>');
                if (hostList[key]['thumbnails']) addThumbnail(div, ports[port], hostList[key]['thumbnails']);
                $(div).click(redirect);
                $('#pages').append($(div));
            }
        }
	})
}

function addThumbnail(element, port, thumbnails){
	for(var key in thumbnails){
		if(portList[thumbnails[key].split('.')[0]] == port){
			$(element).text($(element).text()+" - "+thumbnails[key].split('.')[0]);
			$(element).css('background-image', 'url(images/'+thumbnails[key]+')')
        }
	}
}

function redirect(){
	
}

function getPorts(){
    $.get('/ports', function(data){
        portList = data;
    })
}