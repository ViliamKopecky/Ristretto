;(function() {
	if(!window.io) {
		console.warn('You shall turn Ristretto on.');
	} else {
		var url = location.protocol+'//'+location.hostname+":<%= port %>/";
		var socket = io.connect(url);
		socket.on("error", function(e){
			console.warn('error ', arguments);
		})
		socket.on("connect", function() {
			console.log('Ristretto on.');
			socket.on("reload stylesheets", function() {
				var links = document.getElementsByTagName("link");
				for(var i = 0; i < links.length; i++) {
					var link = links[i];
					if(link.rel === "stylesheet") {
						link.href += "?";
					}
				}
			});
			socket.on("reload", function() {
				window.location.reload();
			});
		});
	}
})();