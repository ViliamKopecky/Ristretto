;(function() {
	var url = location.protocol+'\/\/'+location.hostname+":{$port}";
	window._start_ristretto = function(Faye){
		if(!Faye) {
			console.warn('You shall turn Ristretto on.');
		} else {
			var reload_stylesheets = function(first_time) {
				var links = document.getElementsByTagName("link");
				var link, char;
				for(var i = 0; i < links.length; i++) {
					link = links[i];
					char = '?';
					if(link.rel === "stylesheet") {
						char = (link.href.indexOf('?')>-1) ? '&' : '?';
						link.href += (first_time === true) ? (char+(new Date()).getTime()) : char;
					}
				}
			};
			var connect_ristretto = function() {
				var client = new Faye.Client(url+'\/faye', {
					retry: 1,
					timeout: 3
				});
				client.disable('autodisconnect');
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