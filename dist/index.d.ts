import { RouteConfig, RouterOptions, Route } from 'vue-router';
import { AsyncComponent, ComponentOptions } from 'vue/types/options';
import Vue from 'vue';
import { Dictionary, RedirectOption, RoutePropsFunction, PathToRegexpOptions, RawLocation } from 'vue-router/types/router';
export declare type NextGuardFunction<V extends Vue = Vue> = (to?: RawLocation | false | ((vm: V) => any) | void) => void;
export declare type ScopedRoute = (r?: Router) => {};
declare type ViewHandler = (component: string) => {};
export declare type GuardContext = {
    to?: Route;
    from?: Route;
    next: NextGuardFunction;
};
export declare type Guard = (ctx: GuardContext) => void;
export declare type Component = ComponentOptions<Vue> | typeof Vue | AsyncComponent;
export declare class Router {
    private routes;
    private groupGuards;
    private currentRoute?;
    private currentGuards;
    private parent?;
    private isGrouped;
    private groupPath;
    private options?;
    private viewHandler?;
    constructor();
    constructor(options?: RouterOptions);
    constructor(viewHandler?: ViewHandler);
    build(): RouterOptions;
    add(path: string, component?: Component | string, name?: string): Router;
    components(components: Dictionary<Component> | string[]): Router;
    redirect(path: string, redirect: RedirectOption): Router;
    alias(alias: string | string[]): Router;
    children(subRoutesScope: ScopedRoute): Router;
    meta(meta: any): Router;
    guard(guard: Guard): Router;
    guard(guards: Guard[]): Router;
    props(props: boolean | Object | RoutePropsFunction): Router;
    caseSensitive(val: boolean): Router;
    pathToRegexpOptions(path: PathToRegexpOptions): Router;
    group(path: string, subRoutesScope: ScopedRoute): Router;
    group(path: string, guards: Guard[], subRoutesScope: ScopedRoute): Router;
    config(options: RouteConfig): Router;
    private static evaluateGuards;
    private static parseGuards;
    private formatPath;
    private ensureComponent;
}
export {};
