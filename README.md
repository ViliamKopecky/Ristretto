Mixturette
==========

Frontend development with [**LESS**](https://npmjs.org/package/less), [**Bower**](https://npmjs.org/package/bower) and [**Latte**](https://github.com/nette/Latte). This utility is based on the idea of [**Mixture**](http://mixture.io).

- Running server on `http://localhost:3332`. *Access `/foobar` will respond with compiled `www/foobar.latte`.*
- [**Latte**](http://doc.nette.org/en/default-macros) - the killer templating from [**Nette Framework**](https://nette.org).
- **Static model** passed directly into templates parsed from [**NE-ON**](http://ne-on.org) and **JSON** files. *`www/model/foobar.json` is in template accessible as `{$model->foobar}`.*
- **Realtime compilation** of **LESS** files.
- [**Bower**](https://npmjs.org/package/bower) - package manager for web (JS, CSS, LESS, etc.) dependencies.
- [**Test'em**](https://npmjs.org/package/testem) - easy testing engine for client-side JS. *Using [**Jasmine**](https://npmjs.org/package/jasmine) by default.*
- **and… wait for it… LIVE RELOAD on file change.**

![Mixturette screenshot](https://dl.dropbox.com/u/105619924/mixturette/screenshot.mixturette.png)

Before first run
================

*You need executable [**PHP**](http://php.net) and [**Node.js** + **NPM**](http://nodejs.org/).*

**Install globally [Bower](https://npmjs.org/package/bower) and [LESS](https://npmjs.org/package/less) compiler**

`$ npm install -g bower`

`$ npm install -g less`

**If you want to test client-side javascript, install [**Test'em**](https://npmjs.org/package/testem)**

`$ npm install -g testem`

**Update Bower components**

`./www $ bower update`

**Update [Node.js](http://nodejs.org/) packages and [Composer](http://getcomposer.org/) packages**

`./runner $ npm update`

`./runner $ php composer.phar update`

Configuration
=============

In file `mixturette.json`.

```
{
	"host": "0.0.0.0",

	"port": 3332,
	"socketio_port": 3331,

	"www_dir": "www",

	"latte_dir": "www",
	"model_dir": "www/model",

	"compilers": [{
			"on_change": ["www/less/**.less"],
			"exec": "lessc www/less/screen.less > www/css/screen.css"
		}]
}
```

*(* compilers configuration is not ready yet)*

Run, Forrest, run!
==================

`$ node runner`

Enjoy `http://localhost:3332`

Client-side javascript testing with Test'em
===========================================

See file `testem.json` with configuration. And run tests by:

`./www $ testem`

Near future
===========

Realtime compilation of [**CoffeeScript**](https://npmjs.org/package/coffee-script), [**TypeScript**](https://npmjs.org/package/typescript).

Minification of assets.

Export/publish to pure HTML+CSS+JS for easy sharing.

Better template helpers and macros configuration.