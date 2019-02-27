"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var Router = /** @class */ (function () {
    function Router(options, viewHandler) {
        this.routes = [];
        this.groupGuards = [];
        this.currentGuards = [];
        this.isGrouped = false;
        this.groupPath = '';
        if (options == undefined && viewHandler == undefined)
            return;
        if (viewHandler !== undefined)
            this.viewHandler = viewHandler;
        if (typeof options === 'function')
            this.viewHandler = options;
        else
            this.options = options;
    }
    Router.prototype.build = function () {
        if (!this.options)
            return { routes: this.routes };
        if (this.options.routes)
            this.options.routes.concat(this.routes);
        else
            this.options.routes = this.routes;
        return this.options;
    };
    Router.prototype.add = function (path, component, name) {
        var route = { path: this.formatPath(path) };
        this.currentGuards = [];
        if (this.groupGuards.length > 0) {
            for (var _i = 0, _a = this.groupGuards; _i < _a.length; _i++) {
                var guards = _a[_i];
                this.currentGuards = this.currentGuards.concat(guards);
            }
        }
        route.beforeEnter = Router.parseGuards(this.currentGuards);
        if (name)
            route.name = name;
        if (component !== undefined)
            route.component = this.ensureComponent(component);
        this.currentRoute = route;
        if (this.parent && this.parent.children)
            this.parent.children.push(route);
        else
            this.routes.push(route);
        return this;
    };
    Router.prototype.components = function (components) {
        if (!this.currentRoute)
            throw new Error('Router.components: You must add a route before defining its components.');
        if (!(components instanceof Array)) {
            this.currentRoute.components = __assign({}, this.currentRoute.components, components);
            return this;
        }
        this.currentRoute.components = __assign({}, this.currentRoute.components);
        for (var _i = 0, components_1 = components; _i < components_1.length; _i++) {
            var component = components_1[_i];
            this.currentRoute.components[component] = this.ensureComponent(component);
        }
        return this;
    };
    Router.prototype.redirect = function (path, redirect) {
        var route = {
            path: this.formatPath(path),
            redirect: redirect
        };
        if (this.parent && this.parent.children)
            this.parent.children.push(route);
        else
            this.routes.push(route);
        return this;
    };
    Router.prototype.alias = function (alias) {
        if (!this.currentRoute)
            throw new Error('Router.components: You must add a route before defining its alias.');
        if (alias instanceof Array) {
            if (this.currentRoute.alias instanceof Array)
                this.currentRoute.alias.concat(alias);
            else
                this.currentRoute.alias = alias;
        }
        else {
            if (this.currentRoute.alias instanceof Array)
                this.currentRoute.alias.push(alias);
            else
                this.currentRoute.alias = alias;
        }
        return this;
    };
    Router.prototype.children = function (subRoutesScope) {
        var current = this.currentRoute;
        var parent = this.parent;
        this.parent = this.currentRoute;
        if (!this.parent)
            throw new Error('Router.children: You must add a route before using the children method.');
        if (!this.parent.children)
            this.parent.children = [];
        subRoutesScope(this);
        this.currentRoute = current;
        this.parent = parent;
        return this;
    };
    Router.prototype.meta = function (meta) {
        if (!this.currentRoute)
            throw new Error('Router.components: You must add a route before defining its metadata.');
        this.meta = meta;
        return this;
    };
    Router.prototype.guard = function (guards) {
        if (!this.currentRoute)
            throw new Error('Router.guard: You must add a route before using this method.');
        if (guards instanceof Array)
            this.currentGuards.concat(guards);
        else
            this.currentGuards.push(guards);
        this.currentRoute.beforeEnter = Router.parseGuards(this.currentGuards);
        return this;
    };
    Router.prototype.props = function (props) {
        if (!this.currentRoute)
            throw new Error('Router.guard: You must add a route before using this method.');
        this.currentRoute.props = props;
        return this;
    };
    Router.prototype.caseSensitive = function (val) {
        if (!this.currentRoute)
            throw new Error('Router.guard: You must add a route before using this method.');
        this.currentRoute.caseSensitive = val;
        return this;
    };
    Router.prototype.pathToRegexpOptions = function (path) {
        if (!this.currentRoute)
            throw new Error('Router.guard: You must add a route before using this method.');
        this.currentRoute.pathToRegexpOptions = path;
        return this;
    };
    Router.prototype.group = function (path, guardsOrSubRoutesScope, subRoutesScope) {
        this.groupPath = this.formatPath(path);
        this.isGrouped = true;
        if (subRoutesScope === undefined) {
            guardsOrSubRoutesScope(this);
        }
        else if (guardsOrSubRoutesScope instanceof Array) {
            if (guardsOrSubRoutesScope.length < 1) {
                subRoutesScope(this);
            }
            else {
                this.groupGuards.push(guardsOrSubRoutesScope.slice(0));
                subRoutesScope(this);
                this.groupGuards.pop();
            }
        }
        else {
            throw new Error('Router.group: Invalid data type for 2nd parameter.');
        }
        this.isGrouped = false;
        return this;
    };
    Router.prototype.config = function (options) {
        if (!this.currentRoute)
            throw new Error('Router.config: You must add a route before passing its config.');
        if (this.currentRoute.name)
            options.name = this.currentRoute.name;
        if (this.currentRoute.children && options.children && options.children.length > 0)
            options.children.concat(this.currentRoute.children);
        options.path = this.currentRoute.path;
        options.component = this.currentRoute.component;
        this.currentRoute = __assign({}, this.currentRoute, options);
        return this;
    };
    Router.evaluateGuards = function (guards, ctx) {
        var guardsLeft = guards.slice(0);
        var nextGuard = guardsLeft.shift();
        if (nextGuard == undefined)
            return ctx.next();
        nextGuard(__assign({}, ctx, { next: function (nextArg) {
                if (nextArg == undefined)
                    return Router.evaluateGuards(guardsLeft, ctx);
                ctx.next(nextArg);
            } }));
    };
    Router.parseGuards = function (guards) {
        return function (to, from, next) {
            return guards instanceof Array ?
                Router.evaluateGuards(guards, { to: to, from: from, next: next }) :
                guards({ to: to, from: from, next: next });
        };
    };
    Router.prototype.formatPath = function (path, addGroupPrefix) {
        if (addGroupPrefix === void 0) { addGroupPrefix = true; }
        if (!this.parent)
            path = path.indexOf('/') === 0 ? path : "/" + path;
        if (addGroupPrefix && this.isGrouped && this.groupPath != '')
            return this.groupPath + "/" + path.replace(/\/$/, '');
        return path.replace(/\/$/, '');
    };
    Router.prototype.ensureComponent = function (component) {
        if (typeof component === 'string') {
            if (this.viewHandler === undefined)
                throw new Error('Router: You must specify a view handler that returns a component if you want to pass components as strings.');
            return this.viewHandler(component);
        }
        return component;
    };
    return Router;
}());
exports.Router = Router;
//# sourceMappingURL=index.js.map