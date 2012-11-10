Mixturette
==========

Frontend development with [**LESS**](https://npmjs.org/package/less), [**Bower**](https://npmjs.org/package/bower) and [**Latte**](https://github.com/nette/Latte). This utility is based on the idea of [**Mixture**](http://mixture.io).

- Running server on `http://localhost:3332`. *Access `/foobar` will respond with compiled `./foobar.latte`.*
- [**Latte**](http://doc.nette.org/en/default-macros) - the killer templating from [**Nette Framework**](https://nette.org).
- **Static model** passed directly into templates parsed from [**NE-ON**](http://ne-on.org) and **JSON** files. *`./model/foobar.json` is in template accessible as `{$model->foobar}`.*
- **Realtime compilation** of **LESS** files.
- [**Bower**](https://npmjs.org/package/bower) - package manager for web (JS, CSS, LESS, etc.) dependencies.
- [**Test'em**](https://npmjs.org/package/testem) - easy testing engine for client-side JS. *Using [**Jasmine**](https://npmjs.org/package/jasmine) by default.*
- **and… wait for it… LIVE RELOAD on file change.** (seems to work only on Windows)

![Mixturette screenshot](https://dl.dropbox.com/u/105619924/mixturette/screenshot.mixturette.png)

Before first run
================

*You need executable **PHP** and [**Node.js** + **NPM**](http://nodejs.org/).*

**Install globally [Bower](https://npmjs.org/package/bower) and [LESS](https://npmjs.org/package/less) compiler**

`$ npm install -g bower`

`$ npm install -g less`

**If you want to test client-side javascript, install [**Test'em**](https://npmjs.org/package/testem)**

`$ npm install -g testem`

**Update Bower components**

`$ bower update`

**Update [Node.js](http://nodejs.org/) packages and [Composer](http://getcomposer.org/) packages**

`$ cd ./runner`

`./runner $ npm update`

`./runner $ php composer.phar update`

Run on windows
==============

`$ run.bat`

Run in shell
============

`$ node ./runner/index.js`

Enjoy `http://localhost:3332`

Client-side javascript testing with Test'em
===========================================

See file `testem.json` with configuration. And run tests by:

`$ testem`


Near future
===========

Realtime compilation of [**CoffeeScript**](https://npmjs.org/package/coffee-script), [**TypeScript**](https://npmjs.org/package/typescript).

Minification of assets.

Export/publish to pure HTML+CSS+JS for easy sharing.

Better template helpers and macros configuration.