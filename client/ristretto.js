;(function() {

	var url = location.protocol+'\/\/'+location.hostname+":{$port}/rstrt";

	// clone link tag, and destroys origin when clone is loaded.
	var swap_links = function(link, first_time) {
		var char = (link.href.indexOf('?')>-1) ? '&' : '?';
		var new_link = link.cloneNode();
		new_link.href += (first_time === true) ? (char+(new Date()).getTime()) : char;
		var parent = link.parentNode;
		new_link.onload = function(){
			parent.removeChild(link);
		};
		parent.appendChild(new_link);
	};

	// finds all link elements, and reloads them.
	var reload_stylesheets = function(first_time) {
		var links = document.getElementsByTagName("link");
		var link;
		var replacing = [];
		for(var i = 0; i < links.length; i++) {
			link = links[i];
			char = '?';
			if(link.rel === "stylesheet") {
				replacing.push(link);
			}
		}
		for(i=0; i < replacing.length; i++) {
			swap_links(replacing[i], first_time);
		}
	};

	var tryout_delay = function(tryouts, fn) {
		var to = setTimeout(function() {
			clearTimeout(to);
			fn();
		}, 20 + Math.pow(2, tryouts)*20);
		return to;
	};

	var tryouts = 0;
	var startup = function(){
		tryouts++;
		if(!SockJS) {
			if(typeof console !== 'undefined') {
				console.warn('You shall turn Ristretto on.');
				tryout_delay(tryouts, startup);
			}
		} else {
			var sockjs = rstrt_sockjs = new SockJS(url, { debug: true });
			sockjs.onclose = function() {
				tryout_delay(tryouts, startup);
			};
			sockjs.onmessage = function(e) {
				switch(e.data) {
					case 'reload-stylesheets':
						reload_stylesheets();
						break;
					case 'reload-page':
						window.location.reload();
						break;
				}
			};
		}
	};

	// Run, Ristretto, run!
	startup();
})();
