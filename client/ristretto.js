;(function() {
	var url = location.protocol+'\/\/'+location.hostname+":{$port}";
	window._start_ristretto = function(Faye){
		if(!Faye) {
			console.warn('You shall turn Ristretto on.');
		} else {
			var reload_stylesheets = function(first_time) {
				var links = document.getElementsByTagName("link");
				for(var i = 0; i < links.length; i++) {
					var link = links[i];
					if(link.rel === "stylesheet") {
						link.href += (first_time === true) ? ("?"+(new Date()).getTime()) : "?";
					}
				}
			};
			var connect_ristretto = function() {
				var client = new Faye.Client(url+'\/faye');
				client.subscribe('\/reload', function(message) {
					switch(message.type) {
						case 'stylesheets':
							reload_stylesheets();
							break;
						case 'page':
							window.location.reload();
							break;
					}
				});
				reload_stylesheets(true);
			};
			connect_ristretto();
		}
	};
	(function(){var s=document.createElement("script");s.setAttribute("src", "http://"+location.hostname+":{$port}/faye.js");s.onload=function(){window._start_ristretto(Faye)};document.getElementsByTagName("body")[0].appendChild(s);void(s);})();
})();