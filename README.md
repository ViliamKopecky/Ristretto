Ristretto
=========

Frontend development with [**LESS**](https://npmjs.org/package/less), [**Bower**](https://npmjs.org/package/bower) and [**Latte**](https://github.com/nette/Latte). This utility is based on the idea of [**Mixture**](http://mixture.io).

- Running server on `http://localhost:2012`. *Access `/foobar` will respond with compiled `example/foobar.latte`.*
- [**Latte**](http://doc.nette.org/en/default-macros) - the killer templating from [**Nette Framework**](https://nette.org).
- **Static model** passed directly into templates parsed from [**NE-ON**](http://ne-on.org) and **JSON** files. *`example/model/foobar.json` is in template accessible as `{$model->foobar}`.*
- **Realtime compilation** of **LESS** files.
- [**Bower**](https://npmjs.org/package/bower) - package manager for web (JS, CSS, LESS, etc.) dependencies.
- [**Test'em**](https://npmjs.org/package/testem) - easy testing engine for client-side JS. *Using [**Jasmine**](https://npmjs.org/package/jasmine) by default.*
- **and… wait for it… LIVE RELOAD on file change.**

![Ristretto screenshot](https://dl.dropbox.com/u/105619924/ristretto/screenshot.ristretto.png)





Before first run
================

*You need executable [**PHP**](http://php.net) and [**Node.js** + **NPM**](http://nodejs.org/).*

**Install globally [Bower](https://npmjs.org/package/bower) and [LESS](https://npmjs.org/package/less) compiler**

`$ npm install -g bower less`

*You might want to install coffee-script as well*

**If you want to test client-side javascript, install [**Test'em**](https://npmjs.org/package/testem)**

`$ npm install -g testem`

**Update Bower components**

`./example $ bower update`

**Update [Node.js](http://nodejs.org/) packages and [Composer](http://getcomposer.org/) packages**

`./runner $ npm update`

`./runner $ php composer.phar update`






Fancy something simpler?
========================

**Updating NPM, Composer and Bower at once**

`$ ristretto update`






Configuration
=============

In file `ristretto.json`. It might be simple:


```
{
	"port": 2012,
	"www_dir": "example",
}
```

Or it may be sophisticated:


```
{
	"host": "0.0.0.0",

	"port": 2012,

	"www_dir": "example",

	"latte_dir": "example",
	"model_dir": "example/model",

	"run": [
		{"coffee": ["-o", "example/js", "-w", "example/coffee"]}
	],

	"build": [
		{
			"watch": ["example/less/**.less"],
			"exec": [{"lessc": ["-x", "example/less/screen.less", ">", "example/css/screen.css"]}]
		}
	]
}
```






Run, Forrest, run!
==================

`$ ristretto`

Enjoy `http://localhost:2012`






Client-side javascript testing with Test'em
===========================================

See file `./example/testem.json` with configuration. And run tests with command:

`./example $ testem`





FAQ
===

There is problem on Mac with watching a lot of files. Try something like this…

`$ ulimit -n 2048`

or

`$ launchctl limit maxfile 2048 4096`





Mobile devices and virtual machines
===================================

Well well, someone here takes front-end development seriously.

The key to painless cross-device development is getting the right IP address - how each device can reach your development machine (as a server). On your local network, you open `cmd` od `terminal`, try one of theese bad boys `ifconfig` or `ipconfig` (on Windows) and look for some `IPv4` address that belongs to the network that connects you with your devices (mine is `192.168.100.15`, yours may differ). VirtualBox (and others) creates virtual network, and you'll find different IP under its ethernet adapter (mine is `192.168.56.1`).

When you know your IPs, fun may begin. In each devices web browser open address `<your_ip>:<port>` (mine looks like `192.168.100.15:2012`) and you should be there. You might like using [**xip.io**](http://xip.io) - then you use it `<your_ip>.xip.io:<port>` (mine `192.168.100.15.xip.io:2012`). Enjoy!






Near future
===========

Realtime compilation of [**CoffeeScript**](https://npmjs.org/package/coffee-script), [**TypeScript**](https://npmjs.org/package/typescript).

Minification of assets.

Export/publish to pure HTML+CSS+JS for easy sharing.

Better template helpers and macros configuration.