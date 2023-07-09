(()=>{"use strict";var e={913:()=>{try{self["workbox:core:7.0.0"]&&_()}catch(e){}},977:()=>{try{self["workbox:precaching:7.0.0"]&&_()}catch(e){}},80:()=>{try{self["workbox:routing:7.0.0"]&&_()}catch(e){}},873:()=>{try{self["workbox:strategies:7.0.0"]&&_()}catch(e){}}},t={};function s(a){var n=t[a];if(void 0!==n)return n.exports;var r=t[a]={exports:{}};return e[a](r,r.exports,s),r.exports}(()=>{s(913);const e=(e,...t)=>{let s=e;return t.length>0&&(s+=` :: ${JSON.stringify(t)}`),s};class t extends Error{constructor(t,s){super(e(t,s)),this.name=t,this.details=s}}const a={googleAnalytics:"googleAnalytics",precache:"precache-v2",prefix:"workbox",runtime:"runtime",suffix:"undefined"!=typeof registration?registration.scope:""},n=e=>[a.prefix,e,a.suffix].filter((e=>e&&e.length>0)).join("-"),r=e=>e||n(a.precache),i=e=>e||n(a.runtime);function c(e,t){const s=t();return e.waitUntil(s),s}s(977);function o(e){if(!e)throw new t("add-to-cache-list-unexpected-type",{entry:e});if("string"==typeof e){const t=new URL(e,location.href);return{cacheKey:t.href,url:t.href}}const{revision:s,url:a}=e;if(!a)throw new t("add-to-cache-list-unexpected-type",{entry:e});if(!s){const e=new URL(a,location.href);return{cacheKey:e.href,url:e.href}}const n=new URL(a,location.href),r=new URL(a,location.href);return n.searchParams.set("__WB_REVISION__",s),{cacheKey:n.href,url:r.href}}class h{constructor(){this.updatedURLs=[],this.notUpdatedURLs=[],this.handlerWillStart=async({request:e,state:t})=>{t&&(t.originalRequest=e)},this.cachedResponseWillBeUsed=async({event:e,state:t,cachedResponse:s})=>{if("install"===e.type&&t&&t.originalRequest&&t.originalRequest instanceof Request){const e=t.originalRequest.url;s?this.notUpdatedURLs.push(e):this.updatedURLs.push(e)}return s}}}class l{constructor({precacheController:e}){this.cacheKeyWillBeUsed=async({request:e,params:t})=>{const s=(null==t?void 0:t.cacheKey)||this._precacheController.getCacheKeyForURL(e.url);return s?new Request(s,{headers:e.headers}):e},this._precacheController=e}}let u;async function f(e,s){let a=null;if(e.url){a=new URL(e.url).origin}if(a!==self.location.origin)throw new t("cross-origin-copy-response",{origin:a});const n=e.clone(),r={headers:new Headers(n.headers),status:n.status,statusText:n.statusText},i=s?s(r):r,c=function(){if(void 0===u){const e=new Response("");if("body"in e)try{new Response(e.body),u=!0}catch(e){u=!1}u=!1}return u}()?n.body:await n.blob();return new Response(c,i)}const d=e=>new URL(String(e),location.href).href.replace(new RegExp(`^${location.origin}`),"");function p(e,t){const s=new URL(e);for(const e of t)s.searchParams.delete(e);return s.href}class g{constructor(){this.promise=new Promise(((e,t)=>{this.resolve=e,this.reject=t}))}}const y=new Set;s(873);function w(e){return"string"==typeof e?new Request(e):e}class m{constructor(e,t){this._cacheKeys={},Object.assign(this,t),this.event=t.event,this._strategy=e,this._handlerDeferred=new g,this._extendLifetimePromises=[],this._plugins=[...e.plugins],this._pluginStateMap=new Map;for(const e of this._plugins)this._pluginStateMap.set(e,{});this.event.waitUntil(this._handlerDeferred.promise)}async fetch(e){const{event:s}=this;let a=w(e);if("navigate"===a.mode&&s instanceof FetchEvent&&s.preloadResponse){const e=await s.preloadResponse;if(e)return e}const n=this.hasCallback("fetchDidFail")?a.clone():null;try{for(const e of this.iterateCallbacks("requestWillFetch"))a=await e({request:a.clone(),event:s})}catch(e){if(e instanceof Error)throw new t("plugin-error-request-will-fetch",{thrownErrorMessage:e.message})}const r=a.clone();try{let e;e=await fetch(a,"navigate"===a.mode?void 0:this._strategy.fetchOptions);for(const t of this.iterateCallbacks("fetchDidSucceed"))e=await t({event:s,request:r,response:e});return e}catch(e){throw n&&await this.runCallbacks("fetchDidFail",{error:e,event:s,originalRequest:n.clone(),request:r.clone()}),e}}async fetchAndCachePut(e){const t=await this.fetch(e),s=t.clone();return this.waitUntil(this.cachePut(e,s)),t}async cacheMatch(e){const t=w(e);let s;const{cacheName:a,matchOptions:n}=this._strategy,r=await this.getCacheKey(t,"read"),i=Object.assign(Object.assign({},n),{cacheName:a});s=await caches.match(r,i);for(const e of this.iterateCallbacks("cachedResponseWillBeUsed"))s=await e({cacheName:a,matchOptions:n,cachedResponse:s,request:r,event:this.event})||void 0;return s}async cachePut(e,s){const a=w(e);var n;await(n=0,new Promise((e=>setTimeout(e,n))));const r=await this.getCacheKey(a,"write");if(!s)throw new t("cache-put-with-no-response",{url:d(r.url)});const i=await this._ensureResponseSafeToCache(s);if(!i)return!1;const{cacheName:c,matchOptions:o}=this._strategy,h=await self.caches.open(c),l=this.hasCallback("cacheDidUpdate"),u=l?await async function(e,t,s,a){const n=p(t.url,s);if(t.url===n)return e.match(t,a);const r=Object.assign(Object.assign({},a),{ignoreSearch:!0}),i=await e.keys(t,r);for(const t of i)if(n===p(t.url,s))return e.match(t,a)}(h,r.clone(),["__WB_REVISION__"],o):null;try{await h.put(r,l?i.clone():i)}catch(e){if(e instanceof Error)throw"QuotaExceededError"===e.name&&await async function(){for(const e of y)await e()}(),e}for(const e of this.iterateCallbacks("cacheDidUpdate"))await e({cacheName:c,oldResponse:u,newResponse:i.clone(),request:r,event:this.event});return!0}async getCacheKey(e,t){const s=`${e.url} | ${t}`;if(!this._cacheKeys[s]){let a=e;for(const e of this.iterateCallbacks("cacheKeyWillBeUsed"))a=w(await e({mode:t,request:a,event:this.event,params:this.params}));this._cacheKeys[s]=a}return this._cacheKeys[s]}hasCallback(e){for(const t of this._strategy.plugins)if(e in t)return!0;return!1}async runCallbacks(e,t){for(const s of this.iterateCallbacks(e))await s(t)}*iterateCallbacks(e){for(const t of this._strategy.plugins)if("function"==typeof t[e]){const s=this._pluginStateMap.get(t),a=a=>{const n=Object.assign(Object.assign({},a),{state:s});return t[e](n)};yield a}}waitUntil(e){return this._extendLifetimePromises.push(e),e}async doneWaiting(){let e;for(;e=this._extendLifetimePromises.shift();)await e}destroy(){this._handlerDeferred.resolve(null)}async _ensureResponseSafeToCache(e){let t=e,s=!1;for(const e of this.iterateCallbacks("cacheWillUpdate"))if(t=await e({request:this.request,response:t,event:this.event})||void 0,s=!0,!t)break;return s||t&&200!==t.status&&(t=void 0),t}}class _{constructor(e={}){this.cacheName=i(e.cacheName),this.plugins=e.plugins||[],this.fetchOptions=e.fetchOptions,this.matchOptions=e.matchOptions}handle(e){const[t]=this.handleAll(e);return t}handleAll(e){e instanceof FetchEvent&&(e={event:e,request:e.request});const t=e.event,s="string"==typeof e.request?new Request(e.request):e.request,a="params"in e?e.params:void 0,n=new m(this,{event:t,request:s,params:a}),r=this._getResponse(n,s,t);return[r,this._awaitComplete(r,n,s,t)]}async _getResponse(e,s,a){let n;await e.runCallbacks("handlerWillStart",{event:a,request:s});try{if(n=await this._handle(s,e),!n||"error"===n.type)throw new t("no-response",{url:s.url})}catch(t){if(t instanceof Error)for(const r of e.iterateCallbacks("handlerDidError"))if(n=await r({error:t,event:a,request:s}),n)break;if(!n)throw t}for(const t of e.iterateCallbacks("handlerWillRespond"))n=await t({event:a,request:s,response:n});return n}async _awaitComplete(e,t,s,a){let n,r;try{n=await e}catch(r){}try{await t.runCallbacks("handlerDidRespond",{event:a,request:s,response:n}),await t.doneWaiting()}catch(e){e instanceof Error&&(r=e)}if(await t.runCallbacks("handlerDidComplete",{event:a,request:s,response:n,error:r}),t.destroy(),r)throw r}}class R extends _{constructor(e={}){e.cacheName=r(e.cacheName),super(e),this._fallbackToNetwork=!1!==e.fallbackToNetwork,this.plugins.push(R.copyRedirectedCacheableResponsesPlugin)}async _handle(e,t){const s=await t.cacheMatch(e);return s||(t.event&&"install"===t.event.type?await this._handleInstall(e,t):await this._handleFetch(e,t))}async _handleFetch(e,s){let a;const n=s.params||{};if(!this._fallbackToNetwork)throw new t("missing-precache-entry",{cacheName:this.cacheName,url:e.url});{0;const t=n.integrity,r=e.integrity,i=!r||r===t;if(a=await s.fetch(new Request(e,{integrity:"no-cors"!==e.mode?r||t:void 0})),t&&i&&"no-cors"!==e.mode){this._useDefaultCacheabilityPluginIfNeeded();await s.cachePut(e,a.clone());0}}return a}async _handleInstall(e,s){this._useDefaultCacheabilityPluginIfNeeded();const a=await s.fetch(e);if(!await s.cachePut(e,a.clone()))throw new t("bad-precaching-response",{url:e.url,status:a.status});return a}_useDefaultCacheabilityPluginIfNeeded(){let e=null,t=0;for(const[s,a]of this.plugins.entries())a!==R.copyRedirectedCacheableResponsesPlugin&&(a===R.defaultPrecacheCacheabilityPlugin&&(e=s),a.cacheWillUpdate&&t++);0===t?this.plugins.push(R.defaultPrecacheCacheabilityPlugin):t>1&&null!==e&&this.plugins.splice(e,1)}}R.defaultPrecacheCacheabilityPlugin={cacheWillUpdate:async({response:e})=>!e||e.status>=400?null:e},R.copyRedirectedCacheableResponsesPlugin={cacheWillUpdate:async({response:e})=>e.redirected?await f(e):e};class v{constructor({cacheName:e,plugins:t=[],fallbackToNetwork:s=!0}={}){this._urlsToCacheKeys=new Map,this._urlsToCacheModes=new Map,this._cacheKeysToIntegrities=new Map,this._strategy=new R({cacheName:r(e),plugins:[...t,new l({precacheController:this})],fallbackToNetwork:s}),this.install=this.install.bind(this),this.activate=this.activate.bind(this)}get strategy(){return this._strategy}precache(e){this.addToCacheList(e),this._installAndActiveListenersAdded||(self.addEventListener("install",this.install),self.addEventListener("activate",this.activate),this._installAndActiveListenersAdded=!0)}addToCacheList(e){const s=[];for(const a of e){"string"==typeof a?s.push(a):a&&void 0===a.revision&&s.push(a.url);const{cacheKey:e,url:n}=o(a),r="string"!=typeof a&&a.revision?"reload":"default";if(this._urlsToCacheKeys.has(n)&&this._urlsToCacheKeys.get(n)!==e)throw new t("add-to-cache-list-conflicting-entries",{firstEntry:this._urlsToCacheKeys.get(n),secondEntry:e});if("string"!=typeof a&&a.integrity){if(this._cacheKeysToIntegrities.has(e)&&this._cacheKeysToIntegrities.get(e)!==a.integrity)throw new t("add-to-cache-list-conflicting-integrities",{url:n});this._cacheKeysToIntegrities.set(e,a.integrity)}if(this._urlsToCacheKeys.set(n,e),this._urlsToCacheModes.set(n,r),s.length>0){const e=`Workbox is precaching URLs without revision info: ${s.join(", ")}\nThis is generally NOT safe. Learn more at https://bit.ly/wb-precache`;console.warn(e)}}}install(e){return c(e,(async()=>{const t=new h;this.strategy.plugins.push(t);for(const[t,s]of this._urlsToCacheKeys){const a=this._cacheKeysToIntegrities.get(s),n=this._urlsToCacheModes.get(t),r=new Request(t,{integrity:a,cache:n,credentials:"same-origin"});await Promise.all(this.strategy.handleAll({params:{cacheKey:s},request:r,event:e}))}const{updatedURLs:s,notUpdatedURLs:a}=t;return{updatedURLs:s,notUpdatedURLs:a}}))}activate(e){return c(e,(async()=>{const e=await self.caches.open(this.strategy.cacheName),t=await e.keys(),s=new Set(this._urlsToCacheKeys.values()),a=[];for(const n of t)s.has(n.url)||(await e.delete(n),a.push(n.url));return{deletedURLs:a}}))}getURLsToCacheKeys(){return this._urlsToCacheKeys}getCachedURLs(){return[...this._urlsToCacheKeys.keys()]}getCacheKeyForURL(e){const t=new URL(e,location.href);return this._urlsToCacheKeys.get(t.href)}getIntegrityForCacheKey(e){return this._cacheKeysToIntegrities.get(e)}async matchPrecache(e){const t=e instanceof Request?e.url:e,s=this.getCacheKeyForURL(t);if(s){return(await self.caches.open(this.strategy.cacheName)).match(s)}}createHandlerBoundToURL(e){const s=this.getCacheKeyForURL(e);if(!s)throw new t("non-precached-url",{url:e});return t=>(t.request=new Request(e),t.params=Object.assign({cacheKey:s},t.params),this.strategy.handle(t))}}let C;const b=()=>(C||(C=new v),C);s(80);const q=e=>e&&"object"==typeof e?e:{handle:e};class U{constructor(e,t,s="GET"){this.handler=q(t),this.match=e,this.method=s}setCatchHandler(e){this.catchHandler=q(e)}}class L extends U{constructor(e,t,s){super((({url:t})=>{const s=e.exec(t.href);if(s&&(t.origin===location.origin||0===s.index))return s.slice(1)}),t,s)}}class k{constructor(){this._routes=new Map,this._defaultHandlerMap=new Map}get routes(){return this._routes}addFetchListener(){self.addEventListener("fetch",(e=>{const{request:t}=e,s=this.handleRequest({request:t,event:e});s&&e.respondWith(s)}))}addCacheListener(){self.addEventListener("message",(e=>{if(e.data&&"CACHE_URLS"===e.data.type){const{payload:t}=e.data;0;const s=Promise.all(t.urlsToCache.map((t=>{"string"==typeof t&&(t=[t]);const s=new Request(...t);return this.handleRequest({request:s,event:e})})));e.waitUntil(s),e.ports&&e.ports[0]&&s.then((()=>e.ports[0].postMessage(!0)))}}))}handleRequest({request:e,event:t}){const s=new URL(e.url,location.href);if(!s.protocol.startsWith("http"))return void 0;const a=s.origin===location.origin,{params:n,route:r}=this.findMatchingRoute({event:t,request:e,sameOrigin:a,url:s});let i=r&&r.handler;const c=e.method;if(!i&&this._defaultHandlerMap.has(c)&&(i=this._defaultHandlerMap.get(c)),!i)return void 0;let o;try{o=i.handle({url:s,request:e,event:t,params:n})}catch(e){o=Promise.reject(e)}const h=r&&r.catchHandler;return o instanceof Promise&&(this._catchHandler||h)&&(o=o.catch((async a=>{if(h){0;try{return await h.handle({url:s,request:e,event:t,params:n})}catch(e){e instanceof Error&&(a=e)}}if(this._catchHandler)return this._catchHandler.handle({url:s,request:e,event:t});throw a}))),o}findMatchingRoute({url:e,sameOrigin:t,request:s,event:a}){const n=this._routes.get(s.method)||[];for(const r of n){let n;const i=r.match({url:e,sameOrigin:t,request:s,event:a});if(i)return n=i,(Array.isArray(n)&&0===n.length||i.constructor===Object&&0===Object.keys(i).length||"boolean"==typeof i)&&(n=void 0),{route:r,params:n}}return{}}setDefaultHandler(e,t="GET"){this._defaultHandlerMap.set(t,q(e))}setCatchHandler(e){this._catchHandler=q(e)}registerRoute(e){this._routes.has(e.method)||this._routes.set(e.method,[]),this._routes.get(e.method).push(e)}unregisterRoute(e){if(!this._routes.has(e.method))throw new t("unregister-route-but-not-found-with-method",{method:e.method});const s=this._routes.get(e.method).indexOf(e);if(!(s>-1))throw new t("unregister-route-route-not-registered");this._routes.get(e.method).splice(s,1)}}let K;const T=()=>(K||(K=new k,K.addFetchListener(),K.addCacheListener()),K);function x(e,s,a){let n;if("string"==typeof e){const t=new URL(e,location.href);0;n=new U((({url:e})=>e.href===t.href),s,a)}else if(e instanceof RegExp)n=new L(e,s,a);else if("function"==typeof e)n=new U(e,s,a);else{if(!(e instanceof U))throw new t("unsupported-route-type",{moduleName:"workbox-routing",funcName:"registerRoute",paramName:"capture"});n=e}return T().registerRoute(n),n}class P extends U{constructor(e,t){super((({request:s})=>{const a=e.getURLsToCacheKeys();for(const n of function*(e,{ignoreURLParametersMatching:t=[/^utm_/,/^fbclid$/],directoryIndex:s="index.html",cleanURLs:a=!0,urlManipulation:n}={}){const r=new URL(e,location.href);r.hash="",yield r.href;const i=function(e,t=[]){for(const s of[...e.searchParams.keys()])t.some((e=>e.test(s)))&&e.searchParams.delete(s);return e}(r,t);if(yield i.href,s&&i.pathname.endsWith("/")){const e=new URL(i.href);e.pathname+=s,yield e.href}if(a){const e=new URL(i.href);e.pathname+=".html",yield e.href}if(n){const e=n({url:r});for(const t of e)yield t.href}}(s.url,t)){const t=a.get(n);if(t){return{cacheKey:t,integrity:e.getIntegrityForCacheKey(t)}}}}),e.strategy)}}var N;(function(e){b().precache(e)})([{'revision':'992251c8eaa956cf415a8abf701bd7ef','url':'audio/bgm/bgm.mp3'},{'revision':'26df6994c628dd87b23e6057267a21f1','url':'audio/bgm/music-0.mp3'},{'revision':'f2135e652589d00e0b9d4a2033366b92','url':'audio/bgm/music-1.mp3'},{'revision':'b18a97ecb3cdbe282209b701bd5f1ce4','url':'audio/hero/attack/0.mp3'},{'revision':'1583700460800b07533e44069b45dc17','url':'audio/hero/attack/1.mp3'},{'revision':'cdf3b31bb0b7dced99faf63b5cbd15c4','url':'audio/hero/attack/2.mp3'},{'revision':'559dc42a3eb1fe8691fc950c44d59b71','url':'audio/hero/attack/3.mp3'},{'revision':'b649aa34085bf18e6b4b1f876e4a5ce5','url':'audio/hero/attack/4.mp3'},{'revision':'5042908adb619bb6e760a9db199360ff','url':'audio/hero/damage/0.mp3'},{'revision':'5c270de90672ff675afa3925a952c647','url':'audio/hero/damage/1.mp3'},{'revision':'5d15afde8cb63903df2096d5d02fe937','url':'audio/hero/damage/2.mp3'},{'revision':'b8d8398ee0aeac114184e3724c19c884','url':'audio/hero/damage/3.mp3'},{'revision':'d8afe997ed279823b42774523137bda2','url':'audio/hero/damage/4.mp3'},{'revision':'58ceaa6bdf0d4fe554985f3ef1d64bec','url':'audio/me/gameover.mp3'},{'revision':'e1fede31870b504f262aab4009c6404f','url':'audio/misc/drinking.mp3'},{'revision':'4ae1b6717bb15aea1c7149082fecf0f8','url':'audio/monster/homanoid-0.mp3'},{'revision':'a06935c5a164ab4765aa8e40c38eff9d','url':'audio/monster/homanoid-1.mp3'},{'revision':'ef06e4526358791fcaa855a55b863122','url':'audio/monster/homanoid-2.mp3'},{'revision':'0edf65dc18c2fa910bbb665668273110','url':'audio/monster/homanoid-3.mp3'},{'revision':'b5c2535657e19a3b8c90f47a67f51877','url':'audio/monster/homanoid-4.mp3'},{'revision':'0c7e98ae41dd7b4b6c286901fdf02ef5','url':'audio/monster/homanoid-5.mp3'},{'revision':'f8341a2933745b6fe0676c99881b76e0','url':'audio/monster/homanoid-6.mp3'},{'revision':'15478ae893cf56b3974ab1484d1497ed','url':'audio/monster/homanoid-7.mp3'},{'revision':'81f2f1ede58631d1a23861663de0811e','url':'audio/monster/homanoid-8.mp3'},{'revision':'370fbcae18c3d1a354537e49f6f51674','url':'audio/weapons/slash-0.mp3'},{'revision':'fcf0d8ffe729ff3b9716fb1f9bc34aca','url':'audio/weapons/slash-1.mp3'},{'revision':'5181b635cca33e6d35928d22b52ae5ae','url':'audio/weapons/slash-2.mp3'},{'revision':'e6e23e9cf359a5520dfeefbf828539d6','url':'audio/weapons/slash-3.mp3'},{'revision':'4c26b171ace162fd25d42efaee66afc8','url':'favicon.ico'},{'revision':'b17209a6a03b1d499e744c2b4e2fe013','url':'font.woff'},{'revision':'ec2abe10214b90e5c71d4c34edf17821','url':'img/a.svg'},{'revision':'16289ba1388ec291b90c27930c2501e6','url':'img/b.svg'},{'revision':'7789f768e9ba241cab3e75e3cd3c2a8b','url':'img/controller.svg'},{'revision':'4d1f881ea5de7b632487296dd523804d','url':'img/hero.png'},{'revision':'aaa8322a9bd9609cce87d9ee52de1dea','url':'img/icons/alpha.webp'},{'revision':'90da603f2f64c9011e20b46e87d70366','url':'img/icons/android-chrome-192x192.png'},{'revision':'4f3a38090377eb105a70d388a6fc5607','url':'img/icons/android-chrome-512x512.png'},{'revision':'fa8fab38098f4703a7f9b6d85ec6198a','url':'img/keyboard.svg'},{'revision':'b3bacde534c7e78b94302dc4ef5a0fba','url':'img/x.svg'},{'revision':'f4dd126e890fbf7366dfea98e0ccbb58','url':'img/y.svg'},{'revision':'1c0f10aacbf57ebdd4750745ea80e47c','url':'index.html'},{'revision':null,'url':'main.526cf0bb22a27330a8be.js'},{'revision':null,'url':'main.c06780e206208d0f6457.css'},{'revision':'db809276683844bb6fb98179a92b844f','url':'models/equips/rapier.glb'},{'revision':'42d2da984777d9295780e197cf716795','url':'models/equips/shield.glb'},{'revision':'94eef5c5d898de6e640b0683f620b274','url':'models/equips/sword.glb'},{'revision':'aaf84b92223fcd291d64b38a490fc316','url':'models/hero/backflip.fbx'},{'revision':'9f4994818e7502e57b1eb3c814ff3450','url':'models/hero/crouching.fbx'},{'revision':'8fd51cad5cd0fb0f29d6f74da6915f53','url':'models/hero/dieing.fbx'},{'revision':'ec34e85905e2c257780d31cd3e7c0745','url':'models/hero/drinking.fbx'},{'revision':'fcd27a63664718006ba29916ad6a94d2','url':'models/hero/hero.glb'},{'revision':'230eac06ec0829ebea885211b21105f0','url':'models/hero/idle.fbx'},{'revision':'a8f9799dc678db3e984795bf448f1eab','url':'models/hero/inwardSlash.fbx'},{'revision':'fcc9a01359dde83f730f7f8525ca8a41','url':'models/hero/jumping.fbx'},{'revision':'a1c6da7815b500ef583221288f207c98','url':'models/hero/jumpingRunning.fbx'},{'revision':'20bf6e553d4555432bb972d2054c63a1','url':'models/hero/kick.fbx'},{'revision':'748993d2ac09d52e22ca2d756635fed0','url':'models/hero/moon.glb'},{'revision':'f7e0bf89ec89add562b12b01f34312a0','url':'models/hero/outwardSlash.fbx'},{'revision':'9862e9e3650ca9f4c52454c3e90b0938','url':'models/hero/outwardSlashFast.fbx'},{'revision':'b10a638813822894ea87df334666711d','url':'models/hero/punchingLeft.fbx'},{'revision':'48b2e61ff29d8d5876979b45bd1c9261','url':'models/hero/punchingRight.fbx'},{'revision':'df78e5984ef2f42ea8f8cf996dbe9127','url':'models/hero/rolling.fbx'},{'revision':'11f4b95c0637d5029f0a9a6d697611dd','url':'models/hero/running.fbx'},{'revision':'87d54436f53a1cd288ebed3ed03bd328','url':'models/hero/sheathSword.fbx'},{'revision':'06ceece3a809893f112e3737cbe57e66','url':'models/hero/stomachHit.fbx'},{'revision':'bd62651c59c4417637e4363e9cc9d94a','url':'models/hero/t_pose.fbx'},{'revision':'21fd04fa4785211056c1c7641db4ce5a','url':'models/hero/turningLeft.fbx'},{'revision':'e36f5a7930f5fe3e8d522b16bbaffd2e','url':'models/hero/turningRight.fbx'},{'revision':'22a2b5071a95692958146fcf3bdca237','url':'models/hero/walking.fbx'},{'revision':'54c75cf99aff8c7d7d2e2eb369278433','url':'models/hero/walkingBack.fbx'},{'revision':'796acd1ea840caf88b5071eb38c8bdf8','url':'models/hero/withdrawSword.fbx'},{'revision':'db7e8a596fe86f5389a70274f0632cb6','url':'models/humanoid/attack.fbx'},{'revision':'4454fea378a2c333ac2be8ec1cb0641b','url':'models/humanoid/bite.fbx'},{'revision':'7463380a7b7572803119997e7be79bc6','url':'models/humanoid/die.fbx'},{'revision':'011c343a33282d69b078f8da74d48ee7','url':'models/humanoid/hit.fbx'},{'revision':'0b1b24a530138e4ec9065f97c51a8d67','url':'models/humanoid/humanoid.glb'},{'revision':'5bfbb14690bed2cbe406b509e9701382','url':'models/humanoid/idle.fbx'},{'revision':'b346ee9c0f6631183ac5df1c5a3800d8','url':'models/humanoid/walk.fbx'},{'revision':'42f911c9f7646f82608e6380c0ceae24','url':'textures/GroundForestRoots001_AO_1K.webp'},{'revision':'b9c0b695834f263646ea1fca4a0509b6','url':'textures/GroundForestRoots001_COL_1K.webp'},{'revision':'dc38de830e91a2518e766c71882490a2','url':'textures/GroundForestRoots001_DISP_1K.webp'},{'revision':'ff354972ce6de4479263bb4b75b89318','url':'textures/GroundForestRoots001_GLOSS_1K.webp'},{'revision':'6d9d6b01056df4cf0df4293b2085a241','url':'textures/GroundForestRoots001_NRM_1K.webp'},{'revision':'2982ea4fdc671a85a1b14244fce928e0','url':'textures/GroundForestRoots001_REFL_1K.webp'},{'revision':'f2fc2ddb66a092525b9eee5d1d2a0a9f','url':'textures/decal-diffuse.png'},{'revision':'be840b75f8b1451d6b3367b2f9e9982e','url':'textures/decal-normal.jpg'},{'revision':'513fca7a066667847e5c12c6a3c3c1d8','url':'textures/moon.webp'}]),function(e){const t=b();x(new P(t,e))}(N),x(new RegExp(/.*\.(otf|ttf|woff|woff2|jpg|png|webp|gif|glb|fbx)$/,"gi"),new class extends _{async _handle(e,s){let a,n=await s.cacheMatch(e);if(n)0;else{0;try{n=await s.fetchAndCachePut(e)}catch(e){e instanceof Error&&(a=e)}0}if(!n)throw new t("no-response",{url:e.url,error:a});return n}}),self.skipWaiting()})()})();