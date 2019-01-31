import { RouteConfig, RouterOptions, Route, NavigationGuard } from 'vue-router';
import { AsyncComponent, ComponentOptions } from 'vue/types/options';
import Vue from 'vue';
import {
	Dictionary,
	RedirectOption,
	RoutePropsFunction,
	PathToRegexpOptions,
	RawLocation
} from 'vue-router/types/router';

export type NextGuardFunction<V extends Vue = Vue> = (to?: RawLocation | false | ((vm: V) => any) | void) => void;
export type ScopedRoute = (r?: Router) => {};
type ViewHandler = (component: string) => {};
export type GuardContext = {
	to?: Route,
	from?: Route,
	next: NextGuardFunction
};
export type Guard = (ctx:  GuardContext) => void;
export type Component = ComponentOptions<Vue> | typeof Vue | AsyncComponent;

export class Router {
	private routes: RouteConfig[] = [];
	private groupGuards: Guard[][] = [];
	private currentRoute?: RouteConfig;
	private currentGuards: Guard[] = [];
	private parent?: RouteConfig;
	private isGrouped: boolean = false;
	private groupPath: string = '';
	private options?: RouterOptions;
	private viewHandler?: ViewHandler;
	
	constructor();
	constructor(options?: RouterOptions);
	constructor(viewHandler?: ViewHandler);
	constructor(options?: RouterOptions | ViewHandler, viewHandler?: ViewHandler) {
		if (options == undefined && viewHandler == undefined)
			return;
		if (viewHandler !== undefined)
			this.viewHandler = viewHandler;
		if (typeof options === 'function')
			this.viewHandler = options;
		else
			this.options = options;
	}

	public build() : RouterOptions {
		if (!this.options)
			return { routes: this.routes };

		if (this.options.routes)
			this.options.routes.concat(this.routes);
		else
			this.options.routes = this.routes;
		return this.options;
	}

	public add(path: string, component?: Component | string, name?: string) : Router {
		let route: RouteConfig = { path: this.formatPath(path) };

		this.currentGuards = [];
		if (this.groupGuards.length > 0) {
			for (let guards of this.groupGuards)
				this.currentGuards.concat(guards);
		}
		route.beforeEnter = Router.parseGuards(this.currentGuards);

		if (name)
			route.name = name;

		if (component !== undefined)
			route.component =  this.ensureComponent(component);

		this.currentRoute = route;
		
		if (this.parent && this.parent.children)
			this.parent.children.push(route);
		else
			this.routes.push(route);


		return this;
	}

	public components(components: Dictionary<Component> | string[]) : Router {
		if (!this.currentRoute)
			throw new Error('Router.components: You must add a route before defining its components.');
		
		if (!(components instanceof Array)) {
			this.currentRoute.components = { ...this.currentRoute.components, ...components };
			return this;
		}

		this.currentRoute.components = { ...this.currentRoute.components };
		for (let component of components) {
			this.currentRoute.components[component] = this.ensureComponent(component);
		}

		return this;
	}

	public redirect(path: string, redirect: RedirectOption) : Router {
		let route: RouteConfig = {
			path: this.formatPath(path),
			redirect
		};
		
		if (this.parent && this.parent.children)
			this.parent.children.push(route);
		else
			this.routes.push(route);

		return this;
	}

	public alias(alias: string | string[]) : Router {
		if (!this.currentRoute)
			throw new Error('Router.components: You must add a route before defining its alias.');

		if (alias instanceof Array) {
			if (this.currentRoute.alias instanceof Array)
				this.currentRoute.alias.concat(alias);
			else
				this.currentRoute.alias = alias;
		} else {
			if (this.currentRoute.alias instanceof Array)
				this.currentRoute.alias.push(alias);
			else
				this.currentRoute.alias = alias;
		}

		return this;
	}

	public children(subRoutesScope: ScopedRoute) : Router {
		let current = this.currentRoute;
		let parent = this.parent;
		this.parent = this.currentRoute;

		if (!this.parent)
			throw new Error('Router.children: You must add a route before using the children method.');

		if (!this.parent.children)
			this.parent.children = [];
		
		subRoutesScope(this);

		this.currentRoute = current;
		this.parent = parent;
		return this;
	}

	public meta(meta: any) : Router {
		if (!this.currentRoute)
			throw new Error('Router.components: You must add a route before defining its metadata.');

		this.meta = meta;
		return this;
	}

	public guard(guard: Guard) : Router;
	public guard(guards: Guard[]) : Router;
	public guard(guards: Guard[] | Guard) : Router {
		if (!this.currentRoute)
			throw new Error('Router.guard: You must add a route before using this method.');
		
		if (guards instanceof Array)
			this.currentGuards.concat(guards);
		else
			this.currentGuards.push(guards);

		this.currentRoute.beforeEnter = Router.parseGuards(this.currentGuards);

		return this;
	}

	public props(props: boolean | Object | RoutePropsFunction) : Router {
		if (!this.currentRoute)
			throw new Error('Router.guard: You must add a route before using this method.');

		this.currentRoute.props = props;
		return this;
	}

	public caseSensitive(val: boolean) : Router {
		if (!this.currentRoute)
			throw new Error('Router.guard: You must add a route before using this method.');
		
		this.currentRoute.caseSensitive = val;
		return this;
	}

	public pathToRegexpOptions(path: PathToRegexpOptions) : Router {
		if (!this.currentRoute)
			throw new Error('Router.guard: You must add a route before using this method.');
		
		this.currentRoute.pathToRegexpOptions = path;
		return this;
	}

	public group(path: string, subRoutesScope: ScopedRoute) : Router;
	public group(path: string, guards: Guard[], subRoutesScope: ScopedRoute) : Router;
	public group(path: string, guardsOrSubRoutesScope: Guard[] | ScopedRoute, subRoutesScope?: ScopedRoute) : Router {
		this.groupPath = this.formatPath(path);
		this.isGrouped = true;

		if (subRoutesScope === undefined) {
			(<ScopedRoute>guardsOrSubRoutesScope)(this);
		} else if (guardsOrSubRoutesScope instanceof Array) {
			if  (guardsOrSubRoutesScope.length < 1) {
				subRoutesScope(this);
			} else {
				this.groupGuards.push(guardsOrSubRoutesScope.slice(0));
				subRoutesScope(this);
				this.groupGuards.pop();
			}
		} else {
			throw new Error('Router.group: Invalid data type for 2nd parameter.');
		}

		this.isGrouped = false;
		return this;
	}

	public config(options: RouteConfig) : Router {
		if (!this.currentRoute)
			throw new Error('Router.config: You must add a route before passing its config.');
		
		if (this.currentRoute.name)
			options.name = this.currentRoute.name;
		
		if (this.currentRoute.children && options.children && options.children.length > 0)
			options.children.concat(this.currentRoute.children);
		
		options.path = this.currentRoute.path;
		options.component = this.currentRoute.component;

		this.currentRoute = { ...this.currentRoute, ...options };

		return this;
	}

	private static evaluateGuards(guards: Guard[], ctx: GuardContext) : void {
		const guardsLeft: Guard[] = guards.slice(0)
		const nextGuard: Guard | undefined = guardsLeft.shift();

		if (nextGuard == undefined)
			return ctx.next();
		
		nextGuard({
			...ctx,
			next: (nextArg) => {
				if (nextArg == undefined)
					return Router.evaluateGuards(guardsLeft, ctx);
				ctx.next(nextArg);
			}
		});
	}

	private static parseGuards(guards: Guard[] | Guard) : NavigationGuard {
		return (to: Route, from: Route, next: NextGuardFunction) =>
			guards instanceof Array ?
				Router.evaluateGuards(guards, { to, from, next }) :
				guards({ to, from, next });
	}

	private formatPath(path: string, addGroupPrefix: boolean = true) : string {
		if (!this.parent)
			path = path.indexOf('/') === 0 ? path : `/${path}`;

		if (addGroupPrefix && this.isGrouped && this.groupPath != '')
			return `${this.groupPath}/${path.replace(/\/$/, '')}`;

		return path.replace(/\/$/, '');
	}

	private ensureComponent(component: Component | string) : Component {
		if (typeof component === 'string') {
			if (this.viewHandler === undefined)
				throw new Error('Router: You must specify a view handler that returns a component if you want to pass components as strings.');
			return this.viewHandler(component);
		}
		return component;
	}
}
