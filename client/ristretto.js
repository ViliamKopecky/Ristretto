;(function() {
	if(!window.io) {
		console.warn('You shall turn Ristretto on.');
	} else {
		var socket = io.connect("http://<%= host %>/");
		socket.on("error", function(e){
			alert('error '+e);
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