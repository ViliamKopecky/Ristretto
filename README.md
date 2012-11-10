Mixturette
==========

Frontend development with **LESS**, **Bower** and **Latte**.

Before first run
================

You need executable **PHP** + [**Composer**](http://getcomposer.org/), [**Node.js** + **NPM**](http://nodejs.org/).

**Install globally Bower and LESS compiler**

`$ npm install -g bower`

`$ npm install -g less`

**Update Bower components**

`$ bower update`

Update Node.js packages and Composer packages

`$ cd runner`

`$ npm update`

`$ composer update` *(depends on how is your Composer set)*

Run on windows
==============

`$ run.bat`

Run in shell
============

`$ node runner/index.js`

Enjoy `http://localhost:3332`


Near future
===========

Realtime compilation of [**CoffeeScript**](https://npmjs.org/package/coffee-script), [**TypeScript**](https://npmjs.org/package/typescript) and testing client-side javascript with [**Testem**](https://npmjs.org/package/testem).