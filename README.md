# Vue Fancy Router
Vue Router Encapsulation for faster development. Based on Laravel's Router.

## Instalation
```sh
npm install vue-fancy-router --save
yarn add vue-fancy-router
bower install vue-fancy-router --save
```

## Usage

File `router.js`
```javascript
var Router = require('vue-fancy-router');

var viewsPath = './views'; // Optional, allows you to use components without importing them
var options = { mode: 'history' }; // Optional

var Route = new Router(options, viewsPath);

Route.add('/', 'WrapperComponent').children(() => {
	Route.add('', 'HomeComponent', 'home');
	Route.group('/post', [ AuthGuard ], () => {
		Route.add('', 'PostListComponent');
		Route.add(':id', 'PostComponent');
		Route.add('create', 'NewPostComponent');
	});
});

exports.router = Route.boot();
```

File `main.js`
```javascript
var Vue = require('vue');
var VueRouter = require('vue-router');

var router = require('./router');

Vue.use(VueRouter);

var app = new Vue({
	router: router
});
```

## Documentation
** WIP **

## Test
```sh
npm run test
```