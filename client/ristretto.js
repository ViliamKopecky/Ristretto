;(function() {
	if(!window.io) {
		console.warn('You shall turn Ristretto on.');
	} else {
		var connect_ristretto = function() {
			var url = location.protocol+'//'+location.hostname+":<%= port %>/";
			var reload_stylesheets = function(first_time) {
				var links = document.getElementsByTagName("link");
				for(var i = 0; i < links.length; i++) {
					var link = links[i];
					if(link.rel === "stylesheet") {
						link.href += (first_time === true) ? ("?"+(new Date()).getTime()) : "?";
					}
				}
			};
			var socket = io.connect(url);
			socket.on("error", function(){
				console.warn('error', arguments);
			});
			socket.on("connect", function() {
				console.log('Ristretto on.');
				socket.on("reload stylesheets", reload_stylesheets);
				socket.on("reload", function() {
					window.location.reload();
				});
			});
			reload_stylesheets(true);
		};
		connect_ristretto();
	}
})();