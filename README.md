Mixturette
==========

Frontend development with **LESS**, **Bower** and **Latte**. This utility is based on the idea of [**Mixture**](http://mixture.io).

Before first run
================

You need executable **PHP** and [**Node.js** + **NPM**](http://nodejs.org/).

**Install globally [Bower](https://npmjs.org/package/bower) and [LESS](https://npmjs.org/package/less) compiler**

`$ npm install -g bower`

`$ npm install -g less`

**If you want to test client-side javascript, install [**Test'em**](https://npmjs.org/package/testem)**

`$ npm install -g testem`

**Update Bower components**

`$ bower update`

Update Node.js packages and Composer packages

`$ cd runner`

`$ npm update`

`$ php composer.phar update`

Run on windows
==============

`$ run.bat`

Run in shell
============

`$ node runner/index.js`

Enjoy `http://localhost:3332`

Client-side javascript testing with Test'em
===========================================

See file `testem.json` with configuration. And run tests by:

`$ testem`


Near future
===========

Realtime compilation of [**CoffeeScript**](https://npmjs.org/package/coffee-script), [**TypeScript**](https://npmjs.org/package/typescript).

Live reload on file change.