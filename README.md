Ristretto
=========

Frontend development with [**LESS**](https://npmjs.org/package/less), [**Bower**](https://npmjs.org/package/bower) and [**Latte**](https://github.com/nette/Latte). This utility is based on the idea of [**Mixture**](http://mixture.io).

- Running server on `http://localhost:3332`. *Access `/foobar` will respond with compiled `example/foobar.latte`.*
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

`$ npm install -g bower`

`$ npm install -g less`

**If you want to test client-side javascript, install [**Test'em**](https://npmjs.org/package/testem)**

`$ npm install -g testem`

**Update Bower components**

`./example $ bower update`

**Update [Node.js](http://nodejs.org/) packages and [Composer](http://getcomposer.org/) packages**

`./runner $ npm update`

`./runner $ php composer.phar update`

Configuration
=============

In file `ristretto.json`.

```
{
	"host": "0.0.0.0",

	"port": 3332,
	"socketio_port": 3331,

	"www_dir": "example",

	"latte_dir": "example",
	"model_dir": "example/model",

	"compilers": [{
			"on_change": ["example/less/**.less"],
			"exec": "lessc example/less/screen.less > example/css/screen.css"
		}]
}
```

*(compilers configuration is not ready yet)*

Run, Forrest, run!
==================

`$ node runner`

Enjoy `http://localhost:3332`

Client-side javascript testing with Test'em
===========================================

See file `testem.json` with configuration. And run tests by:

`./example $ testem`


FAQ
===

There is problem on Mac with watching a lot of files. Try something like this…

`$ ulimit -n 2048`

or

`$ launchctl limit maxfile 2048 4096`

Near future
===========

Realtime compilation of [**CoffeeScript**](https://npmjs.org/package/coffee-script), [**TypeScript**](https://npmjs.org/package/typescript).

Minification of assets.

Export/publish to pure HTML+CSS+JS for easy sharing.

Better template helpers and macros configuration.