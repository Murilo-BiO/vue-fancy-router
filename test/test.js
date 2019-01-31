'use strict';

var expect = require('chai').expect;
var index = require('../dist/index');

var Vue = require('vue');
var VueRouter = require('vue-router');

var TestComponent = Vue.component('button-counter', {
	data: function () {
		return {
			count: 0
		}
	},
	template: '<button @click="count++">You clicked me {{ count }} times.</button>'
});

describe('Router Test', () => {
	it('should return button', () => {
		var router = new index.Router;
		router.add('/button', TestComponent, 'button');
		expect(router.currentRoute.name).to.equal('button');
	});
	it('should be instance of VueRouter', () => {
		var router = new index.Router;
		router.add('/', TestComponent);
		expect((router.boot()) instanceof VueRouter).to.equal(true);
	});
});
