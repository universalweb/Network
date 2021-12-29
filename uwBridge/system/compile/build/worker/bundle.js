(function () {

	self.window = self;

	!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):(t="undefined"!=typeof globalThis?globalThis:t||self).$=e();}(window,(function(){let t;const e=(...e)=>t(...e);e.superMethod=e=>{t=e;};const n=Object,r=n.keys,s=n.is,c=n.assign,o=n.getOwnPropertyDescriptor,a=n.defineProperty,i=n.getOwnPropertyNames,l=t=>r(t).length;c(e,{assign:c,defineProperty:a,getOwnPropertyDescriptor:o,getOwnPropertyNames:i,is:s,keys:r,objectSize:l});const u=Array.from;c(e,{toArray:u});const p=Reflect.apply;c(e,{apply:p});const h=function(t){return void 0===t},g=t=>null===t,f=t=>!h(t)&&!g(t),y=t=>e=>!!f(e)&&e.constructor===t,m=/\.|\+/,d=Array.isArray,A=y(String),b=y(Number),w=t=>!!f(t)&&"Object("===t.constructor.toString().trim().slice(9,16),O=t=>!!f(t)&&t instanceof Function,j=t=>Boolean(t.length),v=t=>e=>!!f(e)&&t.test(e),S=v(/\.css$/),k=v(/\.json$/),M=v(/\.js$/),R=v(/\.html$/),C=v(/\./),F=/\.([0-9a-z]+)/;c(e,{getFileExtension:t=>{const e=t.match(F);if(e)return e[1]},has:(t,...e)=>t.includes(...e),hasDot:C,hasLength:j,hasValue:f,isArray:d,isBoolean:t=>"Boolean"===t.constructor.name,isDate:t=>t instanceof Date,isDecimal:t=>m.test(t.toString()),isEmpty:t=>A(t)||d(t)?!j(t):w(t)?!l(t):!f(t),isFileCSS:S,isFileHTML:R,isFileJS:M,isFileJSON:k,isFunction:O,isNull:g,isNumber:b,isPlainObject:w,isRegExp:t=>t instanceof RegExp,isString:A,isUndefined:h});const x=(t,e)=>{const n=t.length;for(let r=0;r<n;r++)e(t[r],r,t,n);return t},E=(t,e)=>{const n=t.length;for(let r=n-1;r>=0;r--)e(t[r],r,t,n);return t},I=(t,e)=>{const n=t.length;for(let r=0;r<n;r++)if(!1===e(t[r],r,t,n))return !1;return !0},N=(t,e,n=[])=>(x(t,((t,r,s,c)=>{!0===e(t,r,n,s,c)&&n.push(t);})),n),U=(T=x,(t,e,n=[])=>(T(t,((t,r,s,c)=>{n[r]=e(t,r,n,s,c);})),n));var T;const $=(t,e,n=[])=>(x(t,((t,r,s,c)=>{const o=e(t,r,n,s,c);f(o)&&n.push(o);})),n);c(e,{compactMapArray:$,eachArray:x,eachArrayRight:E,filterArray:N,mapArray:U,mapArrayRight:(t,e,n=[])=>{let r=0;const s=t.length;for(let c=s-1;c>=0;c--)n[r]=e(t[c],c,t,s),r++;return n},mapWhile:(t,e,n=[])=>{const r=t.length;for(let s=0;s<r;s++){const c=e(t[s],s,n,t,r);if(!1===c)break;n[s]=c;}return n},whileArray:I});x(["Arguments","Map","Set","WeakMap"],(t=>{var n;e[`is${t}`]=(n=`[object ${t}]`,t=>!!f(t)&&t.toString()===n);}));x(["ArrayBuffer","Float32Array","Float64Array","Int8Array","Int16Array","Int32Array","Uint8Array","Uint8ClampedArray","Uint16Array","Uint32Array"],(t=>{e[`is${t}`]=e=>!!f(e)&&e.constructor.name===t;}));c(e,{asyncEach:async(t,e)=>{const n=t.length;for(let r=0;r<n;r++){const s=t[r];await s(e,r,t,n);}return t}});const L=t=>d(t)?t:[t];c(e,{ensureArray:L});const P=t=>t.flat(1/0);c(e,{flatten:(t,e=1)=>{let n=t;for(let t=0;t<e;t++)n=n.reduce(((t,e)=>t.concat(L(e))),[]);return n},flattenDeep:P});c(e,{remove:(t,e)=>{let n=t.length;for(let r=0;r<n;r++){const s=t[r];e.includes(s)&&(t.splice(r,1),r--,n--);}return t},removeBy:(t,e)=>{let n=t.length;for(let r=0;r<n;r++){e(t[r],r)&&(t.splice(r,1),r--,n--);}return t}});c(e,{chunk:(t,e=1)=>{const n=[];let r=0;return t.forEach(((t,s)=>{s%e||(n.push([]),s&&r++),n[r].push(t);})),n}});c(e,{rest:t=>t.slice(1,t.length)});const B=t=>(t.length=0,t);c(e,{clear:B});c(e,{right:(t,e)=>t[t.length-1-e]});c(e,{cloneArray:t=>t.slice()});const D=Math,z=D.floor,q=D.random,K=(t,e=0)=>z(q()*(t-e))+e;c(e,{add:(t,e)=>t+e,deduct:t=>t-1,divide:(t,e)=>t/e,increment:t=>t+1,minus:(t,e)=>t-e,multiply:(t,e)=>t*e,randomArbitrary:(t,e=0)=>q()*(t-e)+e,randomInt:K,remainder:(t,e)=>t%e});const W=(t,e=t.length)=>{if(t.length<=1)return u(t);const n=u(t);let r,s,c=0;for(;c<e;)r=K(n.length-1,0),s=n[c],n[c]=n[r],n[r]=s,c++;return n};c(e,{shuffle:W});c(e,{sample:(t,e=1)=>{if(!t)return !1;const n=t.length;if(n===e||e>n)return W(t);if(1===e)return [t[K(n-1,0)]];const r=[],s={};let c,o=0;for(;o<e;)c=K(t.length-1,0),s[c]||(r.push(t[c]),s[c]=!0,o++);return r}});c(e,{compact:t=>t.filter((t=>!(A(t)&&!t.length)&&t))});c(e,{initial:t=>t.slice(0,t.length-1)});const J=Math.min;c(e,{smallest:t=>J(...t)});c(e,{range:(t,e,n=1)=>t<e?((t,e,n)=>{const r=[];let s=t;for(;s<e;)r.push(s),s+=n;return r})(t,e,n):((t,e,n)=>{const r=n<0?-1*n:n,s=[];let c=t;for(;c>e;)s.push(c),c-=r;return s})(t,e,n)});c(e,{intersect:(t,...e)=>$(t,(t=>{if(I(e,(e=>e.includes(t))))return t}))});c(e,{difference:(t,...e)=>{const n=P(e);return $(t,(t=>{if(!n.includes(t))return t}))}});const Z=(t,e,n=t.length)=>t.splice(e,n);c(e,{drop:Z,dropRight:(t,e,n=t.length)=>Z(t,0,n-e)});const V=(t,e)=>t.length===e.length&&I(t,((t,n)=>e[n]===t));c(e,{isMatchArray:V});c(e,{sortedIndex:(t,e)=>{let n=0;return I(t,((t,r)=>(n=r,e>t))),n}});const _=Math.max;c(e,{largest:t=>_(...t)});c(e,{sum:t=>t.reduce(((t,e)=>t+e),0)});const H=async(t,e)=>{const n=t.length;for(let r=0;r<n;r++)await e(t[r],r,t,n);return t},G=async(t,e)=>{const n=t.length;for(let r=n-1;r>=0;r--)await e(t[r],r,t,n);return t};c(e,{eachAsync:H,eachAsyncRight:G});c(e,{last:(t,e)=>{const n=t.length;return e?t.slice(n-e,n):t[n-1]}});c(e,{take:(t,e=1)=>t.slice(0,e),takeRight:(t,e=1)=>{const n=t.length;return t.slice(n-e,n)}});const Q=async(t,e)=>{const n=[];return await H(t,(async(t,r,s)=>{n[r]=await e(t,r,s);})),n};c(e,{mapAsync:Q});const X=(t,e,n)=>n.indexOf(t)===e,Y=(t,e,n)=>t!==n[e-1],tt=(t,e)=>e?t.filter(Y):t.filter(X);c(e,{unique:tt});c(e,{union:(...t)=>tt(P(t))});c(e,{compactMapAsync:async(t,e)=>{const n=[];let r;return await H(t,(async(t,s,c)=>{r=await e(t,s,n,c),f(r)&&n.push(r);})),n}});const et=(t,e)=>t-e;c(e,{numSort:t=>t.sort(et)});c(e,{arrayToObject:(t,e)=>{const n={};return x(t,((t,r)=>{n[e[r]]=t;})),n}});c(e,{without:(t,e)=>t.filter((t=>!e.includes(t)))});c(e,{partition:(t,e)=>{const n=[];return [$(t,(t=>{if(e(t))return t;n.push(t);})),n]}});c(e,{xor:(...t)=>{const e=[];return x(t,(t=>{x(tt(t),(t=>{e.includes(t)?e.splice(e.indexOf(t),1):e.push(t);}));})),e}});c(e,{unZip:t=>t[0].map(((e,n)=>t.map((t=>t[n])))),zip:(...t)=>t[0].map(((e,n)=>t.map((t=>t[n]))))});c(e,{first:(t,e)=>e?t.slice(0,e):t[0]});const nt=(t,e)=>e-t;c(e,{rNumSort:t=>t.sort(nt)});const rt=(t,e,n)=>{const r=n?t:0,s=n?e:t,c=n||e;for(let t=r;t<s;t++)c(t,r,s);};c(e,{times:rt,timesMap:(t,e,n,r=[])=>{const s=n?t:0,c=n?e:t,o=n||e;let a;return rt(s,c,(t=>{a=o(t,s,c,r),f(a)&&r.push(a);})),r}});const st=(t,e,n=!0)=>(n?t:[...t]).sort(((t,n)=>n[e]?t[e]?t[e]<n[e]?1:t[e]>n[e]?-1:0:1:-1));c(e,{getNewest:(t,e)=>st(t,e,!1)[0],sortNewest:st});const ct=(t,e="id",n=!0)=>(n?t:[...t]).sort(((t,n)=>n[e]?t[e]?t[e]<n[e]?-1:t[e]>n[e]?1:0:-1:1));c(e,{getOldest:(t,e="id")=>ct(t,e)[0],sortOldest:ct});c(e,{groupBy:(t,e)=>{const n={};return x(t,(t=>{const r=e(t);n[r]||(n[r]=[]),n[r].push(t);})),n}});c(e,{countBy:(t,e)=>{const n={};let r;return x(t,(t=>{r=e(t),n[r]||(n[r]=0),n[r]++;})),n},countKey:(t,e)=>{let n=0;return x(t,(t=>{t[e]&&n++;})),n},countWithoutKey:(t,e)=>{let n=0;return x(t,(t=>{t[e]||n++;})),n}});c(e,{indexBy:(t,e="id")=>{const n={};return x(t,(t=>{n[t[e]]=t;})),n}});c(e,{pluck:(t,e)=>U(t,(t=>t[e]))});const ot=(t,e)=>U(e,(e=>t[e]));c(e,{pluckObject:ot});c(e,{pluckValues:(t,e)=>U(t,(t=>ot(t,e)))});c(e,{invoke:(t,e,n)=>U(t,((t,r)=>t[e](n,r)))});c(e,{invokeAsync:(t,e,n)=>Q(t,(async(t,r)=>t[e](n,r)))});const at=(t,e,n,r,s)=>{if(t[s]===r)return !0};c(e,{findIndex:(t,e,n="id")=>{const r=t.findIndex(((t,r)=>at(t,0,0,e,n)));return -1!==r&&r},findItem:(t,e,n="id")=>{const r=t.find(((t,r)=>at(t,0,0,e,n)));return -1!==r&&r}});c(e,{sortAlphabetical:(t,e)=>t.sort(((t,n)=>{const r=t[e],s=n[e];return r<s?-1:r>s?1:0}))});c(e,{ary:(t,e)=>(...n)=>t(...n.splice(0,e))});c(e,{curry:(t,e=t.length)=>{const n=[],r=(...s)=>{if(n.push(...s),n.length===e){const e=t(...n);return B(n),e}return r};return r},curryRight:(t,e=t.length)=>{const n=[],r=(...s)=>{if(n.unshift(...s),n.length===e){const e=t(...n);return B(n),e}return r};return r}});c(e,{after:(t,e)=>{let n,r=t;return (...t)=>(null!==r&&r--,r<=0&&(n=e(...t),r=null),n)},before:(t,e)=>{let n,r=t;return (...t)=>(null!==r&&r--,r>=1?n=e(...t):r=null,n)},once:t=>{let e;return (...n)=>(f(e)||(e=t(...n)),e)}});c(e,{noop:()=>{},stubArray:()=>[],stubFalse:()=>!1,stubObject:()=>({}),stubString:()=>"",stubTrue:()=>!0});const it=(t,e)=>{const n=r(t);x(n,((r,s,c,o)=>{e(t[r],r,t,o,n);}));},lt=(t,e)=>{const n=r(t);return I(n,((n,r,s,c)=>e(t[n],n,t,c,s)))},ut=(t,e,n={})=>(it(t,((t,r,s,c,o)=>{!0===e(t,r,n,s,c,o)&&(n[r]=t);})),n),pt=(t,e,n={})=>(it(t,((t,r,s,c,o)=>{n[r]=e(t,r,n,s,c,o);})),n),ht=(t,e,n={})=>(it(t,((t,r,s,c,o)=>{const a=e(t,r,n,c,o);f(a)&&(n[r]=a);})),n);c(e,{compactMapObject:ht,eachObject:it,filterObject:ut,mapObject:pt,whileObject:lt});const gt=(t,e)=>t.forEach(e),ft=(t,e)=>(n,r,s)=>{let c;if(f(n))return c=d(n)?t:w(n)||O(n)?e:n.forEach?gt:e,c(n,r,s)},yt=ft(I,lt),mt=ft(x,it),dt=ft(N,ut),At=ft(U,pt),bt=ft($,ht);c(e,{compactMap:bt,each:mt,eachWhile:yt,filter:dt,map:At});c(e,{bindAll:(t,e)=>At(t,(t=>O(t)?t.bind(e):t))});c(e,{ifInvoke:(t,...e)=>{if(O(t))return t(...e)}});c(e,{negate:t=>(...e)=>!t(...e)});c(e,{every:yt});c(e,{over:t=>(...e)=>At(t,(t=>t(...e))),overEvery:t=>(...e)=>yt(t,(t=>t(...e)))});const wt=(t,e)=>setTimeout(t,e),Ot=(t,e)=>setInterval(t,e),jt=(t,e)=>()=>{rt(0,t((()=>{}),0),(t=>{e(t);}));},vt=jt(wt,clearTimeout),St=jt(Ot,clearInterval);c(e,{clearIntervals:St,clearTimers:vt,debounce:(t,e)=>{let n=!1;const r=(...r)=>{!1!==n&&clearTimeout(n),n=wt((()=>{t(...r),n=!1;}),e);};return r.clear=()=>{n&&(clearTimeout(n),n=!1);},r},interval:Ot,throttle:(t,e)=>{let n,r=!1;const s=(...s)=>{r?n=!0:(t(...s),r=wt((()=>{n&&t(...s),r=!1;}),e));};return s.clear=()=>{clearTimeout(r),r=!1;},s},timer:wt});c(e,{chain:t=>{const e=t=>(e.value=t,e.methods);return c(e,{add:t=>((t,e)=>(mt(e,((e,n)=>{t.methods[n]=(...n)=>(e(t.value,...n),t.methods);})),t))(e,t),done(){const t=e.value;return e.value=null,t},methods:{}}),e.add(t),e}});c(e,{inAsync:async(t,e)=>H(t,(async t=>{await t(e);})),inSync:(t,e)=>mt(t,(t=>{t(e);}))});c(e,{nthArg:(t=0)=>(...e)=>e[t]});c(e,{reArg:(t,e)=>(...n)=>t(...e.map((t=>n[t])))});c(e,{wrap:(t,e)=>(...n)=>e(t,...n)});c(e,{isNumberEqual:(t,e)=>t===e,isNumberInRange:(t,e,n)=>t>e&&t<n,isZero:t=>0===t});const kt=(t,e)=>{const n=r(t);return I(e,(t=>n.includes(t)))};c(e,{hasAnyKeys:(t,e)=>{const n=r(t);return Boolean(e.find((t=>n.includes(t))))},hasKeys:kt});c(e,{pick:(t,e,n={})=>(x(e,(e=>{n[e]=t[e];})),n)});c(e,{compactKeys:t=>{const e=[];return it(t,((t,n)=>{t&&e.push(n);})),e}});c(e,{isMatchObject:(t,e)=>{const n=r(t);return !!V(n,r(e))&&I(n,(n=>t[n]===e[n]))}});c(e,{unZipObject:t=>{const e=[],n=[];return it(t,((t,r)=>{e.push(r),n.push(t);})),[e,n]},zipObject:(t,e)=>{const n={};return x(t,((t,r)=>{n[t]=e[r];})),n}});c(e,{invert:(t,e={})=>(it(t,((t,n)=>{e[t]=n;})),e)});c(e,{omit:(t,e)=>ut(t,((t,n)=>!e.includes(n)))});const Mt=async(t,e)=>{const n=r(t);return await H(n,((r,s,c,o)=>e(t[r],r,t,o,n))),t};c(e,{eachObjectAsync:Mt});c(e,{compactMapObjectAsync:async(t,e,n={})=>(await Mt(t,(async(t,r,s,c,o)=>{const a=await e(t,r,n,c,o);f(a)&&(n[r]=a);})),n),mapObjectAsync:async(t,e,n={})=>(await Mt(t,(async(t,r,s,c,o)=>{n[r]=await e(t,r,n,s,c,o);})),n)});const Rt=/[-_]/g,Ct=/ (.)/g;c(e,{camelCase:t=>t.toLowerCase().replace(Ct,(t=>t.toUpperCase().replace(/ /g,""))),kebabCase:t=>t.replace(Rt," ").trim().toLowerCase().replace(Ct,"-$1"),snakeCase:t=>t.replace(Rt," ").trim().toLowerCase().replace(Ct,"_$1"),upperCase:t=>t.replace(Rt," ").trim().toUpperCase()});const Ft=(t,e=1)=>t.substr(e);c(e,{chunkString:(t,e)=>t.match(new RegExp(`(.|[\r\n]){1,${e}}`,"g")),initialString:(t,e=1)=>t.slice(0,-1*e),insertInRange:(t,e,n)=>t.slice(0,e)+n+t.slice(e,t.length),restString:Ft,rightString:(t,e=1)=>t[t.length-e]});c(e,{replaceList:(t,e,n)=>t.replace(new RegExp("\\b"+e.join("|")+"\\b","gi"),n)});const xt=/%(?![\da-f]{2})/gi,Et=/&/g,It=/</g,Nt=/>/g,Ut=/"/g,Tt=t=>decodeURIComponent(t.replace(xt,(()=>"%25"))),$t=t=>t.replace(Et,"&amp;").replace(It,"&lt;").replace(Nt,"&gt;").replace(Ut,"&quot;");c(e,{htmlEntities:$t,rawURLDecode:Tt,sanitize:t=>$t(Tt(t))});const Lt=/\S+/g,Pt=/\w+/g;c(e,{tokenize:t=>t.match(Lt)||[],words:t=>t.match(Pt)||[]});c(e,{truncate:(t,e)=>{const n=t.length;return n>e?((t,e,n)=>{const r=t.split(""),s=r.length;let c,o=n-e;for(;o<s&&o>=0&&(c=r[o]," "!==c);o--);return t.slice(0,o).trim()})(t,e,n):t},truncateRight:(t,e)=>{const n=t.length;return n>e?((t,e,n)=>{const r=t.split(""),s=r.length;let c,o=e;for(;o<s&&o>0&&(c=r[o]," "!==c);o++);return t.substr(o,n).trim()})(t,e,n):t}});const Bt=/ (.)/g,Dt=t=>t[0].toUpperCase(),zt=t=>Dt(t)+Ft(t).toLowerCase();c(e,{upperFirst:t=>Dt(t)+Ft(t),upperFirstAll:t=>t.replace(Bt,(t=>t.toUpperCase())),upperFirstLetter:Dt,upperFirstOnly:zt,upperFirstOnlyAll:t=>zt(t.toLowerCase()).replace(Bt,(t=>t.toUpperCase()))});const qt=(t,e,n=!0)=>(mt(e,((e,r)=>{w(e)&&w(t[r])?qt(t[r],e,n):n&&d(e)&&d(t[r])?t[r].push(...e):t[r]=e;})),t);c(e,{assignDeep:qt});const Kt=Function.prototype;c(e,{cacheNativeMethod:function(t){return Kt.call.bind(t)}});c(e,{ifNotEqual:(t,e,n)=>(e&&!f(t[e])&&(t[e]=n),t)});const Wt=(t,e)=>{if(t===e)return !0;if(t.toString()===e.toString())if(w(t)){const n=r(t);if(kt(e,n))return I(n,(n=>Wt(t[n],e[n])))}else if(d(t)&&t.length===e.length)return I(t,((t,n)=>Wt(t,e[n])));return !1};c(e,{isEqual:Wt});c(e,{propertyMatch:(t,e,n=r(t))=>I(n,(n=>Wt(t[n],e[n])))});const Jt=/\.|\[/,Zt=/]/g,Vt=t=>t.replace(Zt,"").split(Jt);c(e,{toPath:Vt});let _t=0;const Ht=[],Gt={},Qt=()=>{let t=Ht.shift(Ht);return f(t)||(t=_t,Gt[t]=!0,_t++),t};Qt.free=t=>{Gt[t]=null,Ht.push(t);},c(e,{uid:Qt});const Xt=(t,n=e)=>{let r=n;return I(Vt(t),(t=>(r=r[t],f(r)))),r};c(e,{get:Xt});const Yt=JSON,te=Yt.parse,ee=Yt.stringify;c(e,{jsonParse:te,stringify:ee});const ne=(t,e)=>(f(e)&&(ne[t]=e),Xt(t,ne));e.superMethod(ne),c(e,{model:ne});c(e,{promise:t=>new Promise(t)});c(e,{toggle:(t,e,n)=>Wt(e,t)?n:e});const re=t=>(...e)=>n=>{let r=n;return t(e,(t=>{r=t(r);})),r},se=re(x),ce=re(E);c(e,{flow:se,flowRight:ce});const oe=t=>(...e)=>async n=>{let r=n;return await t(e,(async t=>{r=await t(r);})),r},ae=oe(H),ie=oe(G);return c(e,{flowAsync:ae,flowAsyncRight:ie}),e}));

	/*!
	 * Socket.IO v4.4.0
	 * (c) 2014-2021 Guillermo Rauch
	 * Released under the MIT License.
	 */
	!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):(t="undefined"!=typeof globalThis?globalThis:t||self).io=e();}(window,(function(){function t(e){return t="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},t(e)}function e(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function n(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r);}}function r(t,e,r){return e&&n(t.prototype,e),r&&n(t,r),t}function o(){return o=Object.assign||function(t){for(var e=1;e<arguments.length;e++){var n=arguments[e];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(t[r]=n[r]);}return t},o.apply(this,arguments)}function i(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function");t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,writable:!0,configurable:!0}}),e&&a(t,e);}function s(t){return s=Object.setPrototypeOf?Object.getPrototypeOf:function(t){return t.__proto__||Object.getPrototypeOf(t)},s(t)}function a(t,e){return a=Object.setPrototypeOf||function(t,e){return t.__proto__=e,t},a(t,e)}function c(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}function u(t,e){if(e&&("object"==typeof e||"function"==typeof e))return e;if(void 0!==e)throw new TypeError("Derived constructors may only return object or undefined");return c(t)}function h(t){var e=function(){if("undefined"==typeof Reflect||!Reflect.construct)return !1;if(Reflect.construct.sham)return !1;if("function"==typeof Proxy)return !0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(t){return !1}}();return function(){var n,r=s(t);if(e){var o=s(this).constructor;n=Reflect.construct(r,arguments,o);}else n=r.apply(this,arguments);return u(this,n)}}function f(t,e,n){return f="undefined"!=typeof Reflect&&Reflect.get?Reflect.get:function(t,e,n){var r=function(t,e){for(;!Object.prototype.hasOwnProperty.call(t,e)&&null!==(t=s(t)););return t}(t,e);if(r){var o=Object.getOwnPropertyDescriptor(r,e);return o.get?o.get.call(n):o.value}},f(t,e,n||t)}function l(t,e){(null==e||e>t.length)&&(e=t.length);for(var n=0,r=new Array(e);n<e;n++)r[n]=t[n];return r}function p(t,e){var n="undefined"!=typeof Symbol&&t[Symbol.iterator]||t["@@iterator"];if(!n){if(Array.isArray(t)||(n=function(t,e){if(t){if("string"==typeof t)return l(t,e);var n=Object.prototype.toString.call(t).slice(8,-1);return "Object"===n&&t.constructor&&(n=t.constructor.name),"Map"===n||"Set"===n?Array.from(t):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?l(t,e):void 0}}(t))||e&&t&&"number"==typeof t.length){n&&(t=n);var r=0,o=function(){};return {s:o,n:function(){return r>=t.length?{done:!0}:{done:!1,value:t[r++]}},e:function(t){throw t},f:o}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var i,s=!0,a=!1;return {s:function(){n=n.call(t);},n:function(){var t=n.next();return s=t.done,t},e:function(t){a=!0,i=t;},f:function(){try{s||null==n.return||n.return();}finally{if(a)throw i}}}}var d=/^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/,y=["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],v=function(t){var e=t,n=t.indexOf("["),r=t.indexOf("]");-1!=n&&-1!=r&&(t=t.substring(0,n)+t.substring(n,r).replace(/:/g,";")+t.substring(r,t.length));for(var o,i,s=d.exec(t||""),a={},c=14;c--;)a[y[c]]=s[c]||"";return -1!=n&&-1!=r&&(a.source=e,a.host=a.host.substring(1,a.host.length-1).replace(/;/g,":"),a.authority=a.authority.replace("[","").replace("]","").replace(/;/g,":"),a.ipv6uri=!0),a.pathNames=function(t,e){var n=/\/{2,9}/g,r=e.replace(n,"/").split("/");"/"!=e.substr(0,1)&&0!==e.length||r.splice(0,1);"/"==e.substr(e.length-1,1)&&r.splice(r.length-1,1);return r}(0,a.path),a.queryKey=(o=a.query,i={},o.replace(/(?:^|&)([^&=]*)=?([^&]*)/g,(function(t,e,n){e&&(i[e]=n);})),i),a};var m={exports:{}};try{m.exports="undefined"!=typeof XMLHttpRequest&&"withCredentials"in new XMLHttpRequest;}catch(t){m.exports=!1;}var g=m.exports,k="undefined"!=typeof self?self:"undefined"!=typeof window?window:Function("return this")();function b(t){var e=t.xdomain;try{if("undefined"!=typeof XMLHttpRequest&&(!e||g))return new XMLHttpRequest}catch(t){}if(!e)try{return new(k[["Active"].concat("Object").join("X")])("Microsoft.XMLHTTP")}catch(t){}}function w(t){for(var e=arguments.length,n=new Array(e>1?e-1:0),r=1;r<e;r++)n[r-1]=arguments[r];return n.reduce((function(e,n){return t.hasOwnProperty(n)&&(e[n]=t[n]),e}),{})}var _=setTimeout,E=clearTimeout;function A(t,e){e.useNativeTimers?(t.setTimeoutFn=_.bind(k),t.clearTimeoutFn=E.bind(k)):(t.setTimeoutFn=setTimeout.bind(k),t.clearTimeoutFn=clearTimeout.bind(k));}var R=T;function T(t){if(t)return function(t){for(var e in T.prototype)t[e]=T.prototype[e];return t}(t)}T.prototype.on=T.prototype.addEventListener=function(t,e){return this._callbacks=this._callbacks||{},(this._callbacks["$"+t]=this._callbacks["$"+t]||[]).push(e),this},T.prototype.once=function(t,e){function n(){this.off(t,n),e.apply(this,arguments);}return n.fn=e,this.on(t,n),this},T.prototype.off=T.prototype.removeListener=T.prototype.removeAllListeners=T.prototype.removeEventListener=function(t,e){if(this._callbacks=this._callbacks||{},0==arguments.length)return this._callbacks={},this;var n,r=this._callbacks["$"+t];if(!r)return this;if(1==arguments.length)return delete this._callbacks["$"+t],this;for(var o=0;o<r.length;o++)if((n=r[o])===e||n.fn===e){r.splice(o,1);break}return 0===r.length&&delete this._callbacks["$"+t],this},T.prototype.emit=function(t){this._callbacks=this._callbacks||{};for(var e=new Array(arguments.length-1),n=this._callbacks["$"+t],r=1;r<arguments.length;r++)e[r-1]=arguments[r];if(n){r=0;for(var o=(n=n.slice(0)).length;r<o;++r)n[r].apply(this,e);}return this},T.prototype.emitReserved=T.prototype.emit,T.prototype.listeners=function(t){return this._callbacks=this._callbacks||{},this._callbacks["$"+t]||[]},T.prototype.hasListeners=function(t){return !!this.listeners(t).length};var C=Object.create(null);C.open="0",C.close="1",C.ping="2",C.pong="3",C.message="4",C.upgrade="5",C.noop="6";var O=Object.create(null);Object.keys(C).forEach((function(t){O[C[t]]=t;}));for(var S={type:"error",data:"parser error"},B="function"==typeof Blob||"undefined"!=typeof Blob&&"[object BlobConstructor]"===Object.prototype.toString.call(Blob),N="function"==typeof ArrayBuffer,x=function(t,e,n){var r,o=t.type,i=t.data;return B&&i instanceof Blob?e?n(i):L(i,n):N&&(i instanceof ArrayBuffer||(r=i,"function"==typeof ArrayBuffer.isView?ArrayBuffer.isView(r):r&&r.buffer instanceof ArrayBuffer))?e?n(i):L(new Blob([i]),n):n(C[o]+(i||""))},L=function(t,e){var n=new FileReader;return n.onload=function(){var t=n.result.split(",")[1];e("b"+t);},n.readAsDataURL(t)},j="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",P="undefined"==typeof Uint8Array?[]:new Uint8Array(256),q=0;q<j.length;q++)P[j.charCodeAt(q)]=q;var D,I="function"==typeof ArrayBuffer,F=function(t,e){if("string"!=typeof t)return {type:"message",data:U(t,e)};var n=t.charAt(0);return "b"===n?{type:"message",data:M(t.substring(1),e)}:O[n]?t.length>1?{type:O[n],data:t.substring(1)}:{type:O[n]}:S},M=function(t,e){if(I){var n=function(t){var e,n,r,o,i,s=.75*t.length,a=t.length,c=0;"="===t[t.length-1]&&(s--,"="===t[t.length-2]&&s--);var u=new ArrayBuffer(s),h=new Uint8Array(u);for(e=0;e<a;e+=4)n=P[t.charCodeAt(e)],r=P[t.charCodeAt(e+1)],o=P[t.charCodeAt(e+2)],i=P[t.charCodeAt(e+3)],h[c++]=n<<2|r>>4,h[c++]=(15&r)<<4|o>>2,h[c++]=(3&o)<<6|63&i;return u}(t);return U(n,e)}return {base64:!0,data:t}},U=function(t,e){return "blob"===e&&t instanceof ArrayBuffer?new Blob([t]):t},V=String.fromCharCode(30),H=function(t){i(o,t);var n=h(o);function o(t){var r;return e(this,o),(r=n.call(this)).writable=!1,A(c(r),t),r.opts=t,r.query=t.query,r.readyState="",r.socket=t.socket,r}return r(o,[{key:"onError",value:function(t,e){var n=new Error(t);return n.type="TransportError",n.description=e,f(s(o.prototype),"emit",this).call(this,"error",n),this}},{key:"open",value:function(){return "closed"!==this.readyState&&""!==this.readyState||(this.readyState="opening",this.doOpen()),this}},{key:"close",value:function(){return "opening"!==this.readyState&&"open"!==this.readyState||(this.doClose(),this.onClose()),this}},{key:"send",value:function(t){"open"===this.readyState&&this.write(t);}},{key:"onOpen",value:function(){this.readyState="open",this.writable=!0,f(s(o.prototype),"emit",this).call(this,"open");}},{key:"onData",value:function(t){var e=F(t,this.socket.binaryType);this.onPacket(e);}},{key:"onPacket",value:function(t){f(s(o.prototype),"emit",this).call(this,"packet",t);}},{key:"onClose",value:function(){this.readyState="closed",f(s(o.prototype),"emit",this).call(this,"close");}}]),o}(R),K="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_".split(""),Y={},z=0,$=0;function W(t){var e="";do{e=K[t%64]+e,t=Math.floor(t/64);}while(t>0);return e}function J(){var t=W(+new Date);return t!==D?(z=0,D=t):t+"."+W(z++)}for(;$<64;$++)Y[K[$]]=$;J.encode=W,J.decode=function(t){var e=0;for($=0;$<t.length;$++)e=64*e+Y[t.charAt($)];return e};var X=J,G={encode:function(t){var e="";for(var n in t)t.hasOwnProperty(n)&&(e.length&&(e+="&"),e+=encodeURIComponent(n)+"="+encodeURIComponent(t[n]));return e},decode:function(t){for(var e={},n=t.split("&"),r=0,o=n.length;r<o;r++){var i=n[r].split("=");e[decodeURIComponent(i[0])]=decodeURIComponent(i[1]);}return e}},Q=function(t){i(o,t);var n=h(o);function o(){var t;return e(this,o),(t=n.apply(this,arguments)).polling=!1,t}return r(o,[{key:"name",get:function(){return "polling"}},{key:"doOpen",value:function(){this.poll();}},{key:"pause",value:function(t){var e=this;this.readyState="pausing";var n=function(){e.readyState="paused",t();};if(this.polling||!this.writable){var r=0;this.polling&&(r++,this.once("pollComplete",(function(){--r||n();}))),this.writable||(r++,this.once("drain",(function(){--r||n();})));}else n();}},{key:"poll",value:function(){this.polling=!0,this.doPoll(),this.emit("poll");}},{key:"onData",value:function(t){var e=this;((function(t,e){for(var n=t.split(V),r=[],o=0;o<n.length;o++){var i=F(n[o],e);if(r.push(i),"error"===i.type)break}return r}))(t,this.socket.binaryType).forEach((function(t){if("opening"===e.readyState&&"open"===t.type&&e.onOpen(),"close"===t.type)return e.onClose(),!1;e.onPacket(t);})),"closed"!==this.readyState&&(this.polling=!1,this.emit("pollComplete"),"open"===this.readyState&&this.poll());}},{key:"doClose",value:function(){var t=this,e=function(){t.write([{type:"close"}]);};"open"===this.readyState?e():this.once("open",e);}},{key:"write",value:function(t){var e=this;this.writable=!1,function(t,e){var n=t.length,r=new Array(n),o=0;t.forEach((function(t,i){x(t,!1,(function(t){r[i]=t,++o===n&&e(r.join(V));}));}));}(t,(function(t){e.doWrite(t,(function(){e.writable=!0,e.emit("drain");}));}));}},{key:"uri",value:function(){var t=this.query||{},e=this.opts.secure?"https":"http",n="";!1!==this.opts.timestampRequests&&(t[this.opts.timestampParam]=X()),this.supportsBinary||t.sid||(t.b64=1),this.opts.port&&("https"===e&&443!==Number(this.opts.port)||"http"===e&&80!==Number(this.opts.port))&&(n=":"+this.opts.port);var r=G.encode(t);return e+"://"+(-1!==this.opts.hostname.indexOf(":")?"["+this.opts.hostname+"]":this.opts.hostname)+n+this.opts.path+(r.length?"?"+r:"")}}]),o}(H);function Z(){}var tt=null!=new b({xdomain:!1}).responseType,et=function(t){i(s,t);var n=h(s);function s(t){var r;if(e(this,s),r=n.call(this,t),"undefined"!=typeof location){var o="https:"===location.protocol,i=location.port;i||(i=o?"443":"80"),r.xd="undefined"!=typeof location&&t.hostname!==location.hostname||i!==t.port,r.xs=t.secure!==o;}var a=t&&t.forceBase64;return r.supportsBinary=tt&&!a,r}return r(s,[{key:"request",value:function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};return o(t,{xd:this.xd,xs:this.xs},this.opts),new nt(this.uri(),t)}},{key:"doWrite",value:function(t,e){var n=this,r=this.request({method:"POST",data:t});r.on("success",e),r.on("error",(function(t){n.onError("xhr post error",t);}));}},{key:"doPoll",value:function(){var t=this,e=this.request();e.on("data",this.onData.bind(this)),e.on("error",(function(e){t.onError("xhr poll error",e);})),this.pollXhr=e;}}]),s}(Q),nt=function(t){i(o,t);var n=h(o);function o(t,r){var i;return e(this,o),A(c(i=n.call(this)),r),i.opts=r,i.method=r.method||"GET",i.uri=t,i.async=!1!==r.async,i.data=void 0!==r.data?r.data:null,i.create(),i}return r(o,[{key:"create",value:function(){var t=this,e=w(this.opts,"agent","pfx","key","passphrase","cert","ca","ciphers","rejectUnauthorized","autoUnref");e.xdomain=!!this.opts.xd,e.xscheme=!!this.opts.xs;var n=this.xhr=new b(e);try{n.open(this.method,this.uri,this.async);try{if(this.opts.extraHeaders)for(var r in n.setDisableHeaderCheck&&n.setDisableHeaderCheck(!0),this.opts.extraHeaders)this.opts.extraHeaders.hasOwnProperty(r)&&n.setRequestHeader(r,this.opts.extraHeaders[r]);}catch(t){}if("POST"===this.method)try{n.setRequestHeader("Content-type","text/plain;charset=UTF-8");}catch(t){}try{n.setRequestHeader("Accept","*/*");}catch(t){}"withCredentials"in n&&(n.withCredentials=this.opts.withCredentials),this.opts.requestTimeout&&(n.timeout=this.opts.requestTimeout),n.onreadystatechange=function(){4===n.readyState&&(200===n.status||1223===n.status?t.onLoad():t.setTimeoutFn((function(){t.onError("number"==typeof n.status?n.status:0);}),0));},n.send(this.data);}catch(e){return void this.setTimeoutFn((function(){t.onError(e);}),0)}"undefined"!=typeof document&&(this.index=o.requestsCount++,o.requests[this.index]=this);}},{key:"onSuccess",value:function(){this.emit("success"),this.cleanup();}},{key:"onData",value:function(t){this.emit("data",t),this.onSuccess();}},{key:"onError",value:function(t){this.emit("error",t),this.cleanup(!0);}},{key:"cleanup",value:function(t){if(void 0!==this.xhr&&null!==this.xhr){if(this.xhr.onreadystatechange=Z,t)try{this.xhr.abort();}catch(t){}"undefined"!=typeof document&&delete o.requests[this.index],this.xhr=null;}}},{key:"onLoad",value:function(){var t=this.xhr.responseText;null!==t&&this.onData(t);}},{key:"abort",value:function(){this.cleanup();}}]),o}(R);if(nt.requestsCount=0,nt.requests={},"undefined"!=typeof document)if("function"==typeof attachEvent)attachEvent("onunload",rt);else if("function"==typeof addEventListener){addEventListener("onpagehide"in k?"pagehide":"unload",rt,!1);}function rt(){for(var t in nt.requests)nt.requests.hasOwnProperty(t)&&nt.requests[t].abort();}var ot="function"==typeof Promise&&"function"==typeof Promise.resolve?function(t){return Promise.resolve().then(t)}:function(t,e){return e(t,0)},it=k.WebSocket||k.MozWebSocket,st="undefined"!=typeof navigator&&"string"==typeof navigator.product&&"reactnative"===navigator.product.toLowerCase(),at=function(t){i(o,t);var n=h(o);function o(t){var r;return e(this,o),(r=n.call(this,t)).supportsBinary=!t.forceBase64,r}return r(o,[{key:"name",get:function(){return "websocket"}},{key:"doOpen",value:function(){if(this.check()){var t=this.uri(),e=this.opts.protocols,n=st?{}:w(this.opts,"agent","perMessageDeflate","pfx","key","passphrase","cert","ca","ciphers","rejectUnauthorized","localAddress","protocolVersion","origin","maxPayload","family","checkServerIdentity");this.opts.extraHeaders&&(n.headers=this.opts.extraHeaders);try{this.ws=st?new it(t,e,n):e?new it(t,e):new it(t);}catch(t){return this.emit("error",t)}this.ws.binaryType=this.socket.binaryType||"arraybuffer",this.addEventListeners();}}},{key:"addEventListeners",value:function(){var t=this;this.ws.onopen=function(){t.opts.autoUnref&&t.ws._socket.unref(),t.onOpen();},this.ws.onclose=this.onClose.bind(this),this.ws.onmessage=function(e){return t.onData(e.data)},this.ws.onerror=function(e){return t.onError("websocket error",e)};}},{key:"write",value:function(t){var e=this;this.writable=!1;for(var n=function(n){var r=t[n],o=n===t.length-1;x(r,e.supportsBinary,(function(t){try{e.ws.send(t);}catch(t){}o&&ot((function(){e.writable=!0,e.emit("drain");}),e.setTimeoutFn);}));},r=0;r<t.length;r++)n(r);}},{key:"doClose",value:function(){void 0!==this.ws&&(this.ws.close(),this.ws=null);}},{key:"uri",value:function(){var t=this.query||{},e=this.opts.secure?"wss":"ws",n="";this.opts.port&&("wss"===e&&443!==Number(this.opts.port)||"ws"===e&&80!==Number(this.opts.port))&&(n=":"+this.opts.port),this.opts.timestampRequests&&(t[this.opts.timestampParam]=X()),this.supportsBinary||(t.b64=1);var r=G.encode(t);return e+"://"+(-1!==this.opts.hostname.indexOf(":")?"["+this.opts.hostname+"]":this.opts.hostname)+n+this.opts.path+(r.length?"?"+r:"")}},{key:"check",value:function(){return !(!it||"__initialize"in it&&this.name===o.prototype.name)}}]),o}(H),ct={websocket:at,polling:et},ut=function(n){i(a,n);var s=h(a);function a(n){var r,i=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};return e(this,a),r=s.call(this),n&&"object"===t(n)&&(i=n,n=null),n?(n=v(n),i.hostname=n.host,i.secure="https"===n.protocol||"wss"===n.protocol,i.port=n.port,n.query&&(i.query=n.query)):i.host&&(i.hostname=v(i.host).host),A(c(r),i),r.secure=null!=i.secure?i.secure:"undefined"!=typeof location&&"https:"===location.protocol,i.hostname&&!i.port&&(i.port=r.secure?"443":"80"),r.hostname=i.hostname||("undefined"!=typeof location?location.hostname:"localhost"),r.port=i.port||("undefined"!=typeof location&&location.port?location.port:r.secure?"443":"80"),r.transports=i.transports||["polling","websocket"],r.readyState="",r.writeBuffer=[],r.prevBufferLen=0,r.opts=o({path:"/engine.io",agent:!1,withCredentials:!1,upgrade:!0,timestampParam:"t",rememberUpgrade:!1,rejectUnauthorized:!0,perMessageDeflate:{threshold:1024},transportOptions:{},closeOnBeforeunload:!0},i),r.opts.path=r.opts.path.replace(/\/$/,"")+"/","string"==typeof r.opts.query&&(r.opts.query=G.decode(r.opts.query)),r.id=null,r.upgrades=null,r.pingInterval=null,r.pingTimeout=null,r.pingTimeoutTimer=null,"function"==typeof addEventListener&&(r.opts.closeOnBeforeunload&&addEventListener("beforeunload",(function(){r.transport&&(r.transport.removeAllListeners(),r.transport.close());}),!1),"localhost"!==r.hostname&&(r.offlineEventListener=function(){r.onClose("transport close");},addEventListener("offline",r.offlineEventListener,!1))),r.open(),r}return r(a,[{key:"createTransport",value:function(t){var e=function(t){var e={};for(var n in t)t.hasOwnProperty(n)&&(e[n]=t[n]);return e}(this.opts.query);e.EIO=4,e.transport=t,this.id&&(e.sid=this.id);var n=o({},this.opts.transportOptions[t],this.opts,{query:e,socket:this,hostname:this.hostname,secure:this.secure,port:this.port});return new ct[t](n)}},{key:"open",value:function(){var t,e=this;if(this.opts.rememberUpgrade&&a.priorWebsocketSuccess&&-1!==this.transports.indexOf("websocket"))t="websocket";else {if(0===this.transports.length)return void this.setTimeoutFn((function(){e.emitReserved("error","No transports available");}),0);t=this.transports[0];}this.readyState="opening";try{t=this.createTransport(t);}catch(t){return this.transports.shift(),void this.open()}t.open(),this.setTransport(t);}},{key:"setTransport",value:function(t){var e=this;this.transport&&this.transport.removeAllListeners(),this.transport=t,t.on("drain",this.onDrain.bind(this)).on("packet",this.onPacket.bind(this)).on("error",this.onError.bind(this)).on("close",(function(){e.onClose("transport close");}));}},{key:"probe",value:function(t){var e=this,n=this.createTransport(t),r=!1;a.priorWebsocketSuccess=!1;var o=function(){r||(n.send([{type:"ping",data:"probe"}]),n.once("packet",(function(t){if(!r)if("pong"===t.type&&"probe"===t.data){if(e.upgrading=!0,e.emitReserved("upgrading",n),!n)return;a.priorWebsocketSuccess="websocket"===n.name,e.transport.pause((function(){r||"closed"!==e.readyState&&(f(),e.setTransport(n),n.send([{type:"upgrade"}]),e.emitReserved("upgrade",n),n=null,e.upgrading=!1,e.flush());}));}else {var o=new Error("probe error");o.transport=n.name,e.emitReserved("upgradeError",o);}})));};function i(){r||(r=!0,f(),n.close(),n=null);}var s=function(t){var r=new Error("probe error: "+t);r.transport=n.name,i(),e.emitReserved("upgradeError",r);};function c(){s("transport closed");}function u(){s("socket closed");}function h(t){n&&t.name!==n.name&&i();}var f=function(){n.removeListener("open",o),n.removeListener("error",s),n.removeListener("close",c),e.off("close",u),e.off("upgrading",h);};n.once("open",o),n.once("error",s),n.once("close",c),this.once("close",u),this.once("upgrading",h),n.open();}},{key:"onOpen",value:function(){if(this.readyState="open",a.priorWebsocketSuccess="websocket"===this.transport.name,this.emitReserved("open"),this.flush(),"open"===this.readyState&&this.opts.upgrade&&this.transport.pause)for(var t=0,e=this.upgrades.length;t<e;t++)this.probe(this.upgrades[t]);}},{key:"onPacket",value:function(t){if("opening"===this.readyState||"open"===this.readyState||"closing"===this.readyState)switch(this.emitReserved("packet",t),this.emitReserved("heartbeat"),t.type){case"open":this.onHandshake(JSON.parse(t.data));break;case"ping":this.resetPingTimeout(),this.sendPacket("pong"),this.emitReserved("ping"),this.emitReserved("pong");break;case"error":var e=new Error("server error");e.code=t.data,this.onError(e);break;case"message":this.emitReserved("data",t.data),this.emitReserved("message",t.data);}}},{key:"onHandshake",value:function(t){this.emitReserved("handshake",t),this.id=t.sid,this.transport.query.sid=t.sid,this.upgrades=this.filterUpgrades(t.upgrades),this.pingInterval=t.pingInterval,this.pingTimeout=t.pingTimeout,this.onOpen(),"closed"!==this.readyState&&this.resetPingTimeout();}},{key:"resetPingTimeout",value:function(){var t=this;this.clearTimeoutFn(this.pingTimeoutTimer),this.pingTimeoutTimer=this.setTimeoutFn((function(){t.onClose("ping timeout");}),this.pingInterval+this.pingTimeout),this.opts.autoUnref&&this.pingTimeoutTimer.unref();}},{key:"onDrain",value:function(){this.writeBuffer.splice(0,this.prevBufferLen),this.prevBufferLen=0,0===this.writeBuffer.length?this.emitReserved("drain"):this.flush();}},{key:"flush",value:function(){"closed"!==this.readyState&&this.transport.writable&&!this.upgrading&&this.writeBuffer.length&&(this.transport.send(this.writeBuffer),this.prevBufferLen=this.writeBuffer.length,this.emitReserved("flush"));}},{key:"write",value:function(t,e,n){return this.sendPacket("message",t,e,n),this}},{key:"send",value:function(t,e,n){return this.sendPacket("message",t,e,n),this}},{key:"sendPacket",value:function(t,e,n,r){if("function"==typeof e&&(r=e,e=void 0),"function"==typeof n&&(r=n,n=null),"closing"!==this.readyState&&"closed"!==this.readyState){(n=n||{}).compress=!1!==n.compress;var o={type:t,data:e,options:n};this.emitReserved("packetCreate",o),this.writeBuffer.push(o),r&&this.once("flush",r),this.flush();}}},{key:"close",value:function(){var t=this,e=function(){t.onClose("forced close"),t.transport.close();},n=function n(){t.off("upgrade",n),t.off("upgradeError",n),e();},r=function(){t.once("upgrade",n),t.once("upgradeError",n);};return "opening"!==this.readyState&&"open"!==this.readyState||(this.readyState="closing",this.writeBuffer.length?this.once("drain",(function(){t.upgrading?r():e();})):this.upgrading?r():e()),this}},{key:"onError",value:function(t){a.priorWebsocketSuccess=!1,this.emitReserved("error",t),this.onClose("transport error",t);}},{key:"onClose",value:function(t,e){"opening"!==this.readyState&&"open"!==this.readyState&&"closing"!==this.readyState||(this.clearTimeoutFn(this.pingTimeoutTimer),this.transport.removeAllListeners("close"),this.transport.close(),this.transport.removeAllListeners(),"function"==typeof removeEventListener&&removeEventListener("offline",this.offlineEventListener,!1),this.readyState="closed",this.id=null,this.emitReserved("close",t,e),this.writeBuffer=[],this.prevBufferLen=0);}},{key:"filterUpgrades",value:function(t){for(var e=[],n=0,r=t.length;n<r;n++)~this.transports.indexOf(t[n])&&e.push(t[n]);return e}}]),a}(R);ut.protocol=4;var ht="function"==typeof ArrayBuffer,ft=Object.prototype.toString,lt="function"==typeof Blob||"undefined"!=typeof Blob&&"[object BlobConstructor]"===ft.call(Blob),pt="function"==typeof File||"undefined"!=typeof File&&"[object FileConstructor]"===ft.call(File);function dt(t){return ht&&(t instanceof ArrayBuffer||function(t){return "function"==typeof ArrayBuffer.isView?ArrayBuffer.isView(t):t.buffer instanceof ArrayBuffer}(t))||lt&&t instanceof Blob||pt&&t instanceof File}function yt(e,n){if(!e||"object"!==t(e))return !1;if(Array.isArray(e)){for(var r=0,o=e.length;r<o;r++)if(yt(e[r]))return !0;return !1}if(dt(e))return !0;if(e.toJSON&&"function"==typeof e.toJSON&&1===arguments.length)return yt(e.toJSON(),!0);for(var i in e)if(Object.prototype.hasOwnProperty.call(e,i)&&yt(e[i]))return !0;return !1}function vt(t){var e=[],n=t.data,r=t;return r.data=mt(n,e),r.attachments=e.length,{packet:r,buffers:e}}function mt(e,n){if(!e)return e;if(dt(e)){var r={_placeholder:!0,num:n.length};return n.push(e),r}if(Array.isArray(e)){for(var o=new Array(e.length),i=0;i<e.length;i++)o[i]=mt(e[i],n);return o}if("object"===t(e)&&!(e instanceof Date)){var s={};for(var a in e)e.hasOwnProperty(a)&&(s[a]=mt(e[a],n));return s}return e}function gt(t,e){return t.data=kt(t.data,e),t.attachments=void 0,t}function kt(e,n){if(!e)return e;if(e&&e._placeholder)return n[e.num];if(Array.isArray(e))for(var r=0;r<e.length;r++)e[r]=kt(e[r],n);else if("object"===t(e))for(var o in e)e.hasOwnProperty(o)&&(e[o]=kt(e[o],n));return e}var bt;!function(t){t[t.CONNECT=0]="CONNECT",t[t.DISCONNECT=1]="DISCONNECT",t[t.EVENT=2]="EVENT",t[t.ACK=3]="ACK",t[t.CONNECT_ERROR=4]="CONNECT_ERROR",t[t.BINARY_EVENT=5]="BINARY_EVENT",t[t.BINARY_ACK=6]="BINARY_ACK";}(bt||(bt={}));var wt=function(){function t(){e(this,t);}return r(t,[{key:"encode",value:function(t){return t.type!==bt.EVENT&&t.type!==bt.ACK||!yt(t)?[this.encodeAsString(t)]:(t.type=t.type===bt.EVENT?bt.BINARY_EVENT:bt.BINARY_ACK,this.encodeAsBinary(t))}},{key:"encodeAsString",value:function(t){var e=""+t.type;return t.type!==bt.BINARY_EVENT&&t.type!==bt.BINARY_ACK||(e+=t.attachments+"-"),t.nsp&&"/"!==t.nsp&&(e+=t.nsp+","),null!=t.id&&(e+=t.id),null!=t.data&&(e+=JSON.stringify(t.data)),e}},{key:"encodeAsBinary",value:function(t){var e=vt(t),n=this.encodeAsString(e.packet),r=e.buffers;return r.unshift(n),r}}]),t}(),_t=function(n){i(a,n);var o=h(a);function a(){return e(this,a),o.call(this)}return r(a,[{key:"add",value:function(t){var e;if("string"==typeof t)(e=this.decodeString(t)).type===bt.BINARY_EVENT||e.type===bt.BINARY_ACK?(this.reconstructor=new Et(e),0===e.attachments&&f(s(a.prototype),"emitReserved",this).call(this,"decoded",e)):f(s(a.prototype),"emitReserved",this).call(this,"decoded",e);else {if(!dt(t)&&!t.base64)throw new Error("Unknown type: "+t);if(!this.reconstructor)throw new Error("got binary data when not reconstructing a packet");(e=this.reconstructor.takeBinaryData(t))&&(this.reconstructor=null,f(s(a.prototype),"emitReserved",this).call(this,"decoded",e));}}},{key:"decodeString",value:function(t){var e=0,n={type:Number(t.charAt(0))};if(void 0===bt[n.type])throw new Error("unknown packet type "+n.type);if(n.type===bt.BINARY_EVENT||n.type===bt.BINARY_ACK){for(var r=e+1;"-"!==t.charAt(++e)&&e!=t.length;);var o=t.substring(r,e);if(o!=Number(o)||"-"!==t.charAt(e))throw new Error("Illegal attachments");n.attachments=Number(o);}if("/"===t.charAt(e+1)){for(var i=e+1;++e;){if(","===t.charAt(e))break;if(e===t.length)break}n.nsp=t.substring(i,e);}else n.nsp="/";var s=t.charAt(e+1);if(""!==s&&Number(s)==s){for(var c=e+1;++e;){var u=t.charAt(e);if(null==u||Number(u)!=u){--e;break}if(e===t.length)break}n.id=Number(t.substring(c,e+1));}if(t.charAt(++e)){var h=function(t){try{return JSON.parse(t)}catch(t){return !1}}(t.substr(e));if(!a.isPayloadValid(n.type,h))throw new Error("invalid payload");n.data=h;}return n}},{key:"destroy",value:function(){this.reconstructor&&this.reconstructor.finishedReconstruction();}}],[{key:"isPayloadValid",value:function(e,n){switch(e){case bt.CONNECT:return "object"===t(n);case bt.DISCONNECT:return void 0===n;case bt.CONNECT_ERROR:return "string"==typeof n||"object"===t(n);case bt.EVENT:case bt.BINARY_EVENT:return Array.isArray(n)&&n.length>0;case bt.ACK:case bt.BINARY_ACK:return Array.isArray(n)}}}]),a}(R);var Et=function(){function t(n){e(this,t),this.packet=n,this.buffers=[],this.reconPack=n;}return r(t,[{key:"takeBinaryData",value:function(t){if(this.buffers.push(t),this.buffers.length===this.reconPack.attachments){var e=gt(this.reconPack,this.buffers);return this.finishedReconstruction(),e}return null}},{key:"finishedReconstruction",value:function(){this.reconPack=null,this.buffers=[];}}]),t}(),At=Object.freeze({__proto__:null,protocol:5,get PacketType(){return bt},Encoder:wt,Decoder:_t});function Rt(t,e,n){return t.on(e,n),function(){t.off(e,n);}}var Tt=Object.freeze({connect:1,connect_error:1,disconnect:1,disconnecting:1,newListener:1,removeListener:1}),Ct=function(t){i(o,t);var n=h(o);function o(t,r,i){var s;return e(this,o),(s=n.call(this)).connected=!1,s.disconnected=!0,s.receiveBuffer=[],s.sendBuffer=[],s.ids=0,s.acks={},s.flags={},s.io=t,s.nsp=r,i&&i.auth&&(s.auth=i.auth),s.io._autoConnect&&s.open(),s}return r(o,[{key:"subEvents",value:function(){if(!this.subs){var t=this.io;this.subs=[Rt(t,"open",this.onopen.bind(this)),Rt(t,"packet",this.onpacket.bind(this)),Rt(t,"error",this.onerror.bind(this)),Rt(t,"close",this.onclose.bind(this))];}}},{key:"active",get:function(){return !!this.subs}},{key:"connect",value:function(){return this.connected||(this.subEvents(),this.io._reconnecting||this.io.open(),"open"===this.io._readyState&&this.onopen()),this}},{key:"open",value:function(){return this.connect()}},{key:"send",value:function(){for(var t=arguments.length,e=new Array(t),n=0;n<t;n++)e[n]=arguments[n];return e.unshift("message"),this.emit.apply(this,e),this}},{key:"emit",value:function(t){if(Tt.hasOwnProperty(t))throw new Error('"'+t+'" is a reserved event name');for(var e=arguments.length,n=new Array(e>1?e-1:0),r=1;r<e;r++)n[r-1]=arguments[r];n.unshift(t);var o={type:bt.EVENT,data:n,options:{}};if(o.options.compress=!1!==this.flags.compress,"function"==typeof n[n.length-1]){var i=this.ids++,s=n.pop();this._registerAckCallback(i,s),o.id=i;}var a=this.io.engine&&this.io.engine.transport&&this.io.engine.transport.writable,c=this.flags.volatile&&(!a||!this.connected);return c||(this.connected?this.packet(o):this.sendBuffer.push(o)),this.flags={},this}},{key:"_registerAckCallback",value:function(t,e){var n=this,r=this.flags.timeout;if(void 0!==r){var o=this.io.setTimeoutFn((function(){delete n.acks[t];for(var r=0;r<n.sendBuffer.length;r++)n.sendBuffer[r].id===t&&n.sendBuffer.splice(r,1);e.call(n,new Error("operation has timed out"));}),r);this.acks[t]=function(){n.io.clearTimeoutFn(o);for(var t=arguments.length,r=new Array(t),i=0;i<t;i++)r[i]=arguments[i];e.apply(n,[null].concat(r));};}else this.acks[t]=e;}},{key:"packet",value:function(t){t.nsp=this.nsp,this.io._packet(t);}},{key:"onopen",value:function(){var t=this;"function"==typeof this.auth?this.auth((function(e){t.packet({type:bt.CONNECT,data:e});})):this.packet({type:bt.CONNECT,data:this.auth});}},{key:"onerror",value:function(t){this.connected||this.emitReserved("connect_error",t);}},{key:"onclose",value:function(t){this.connected=!1,this.disconnected=!0,delete this.id,this.emitReserved("disconnect",t);}},{key:"onpacket",value:function(t){if(t.nsp===this.nsp)switch(t.type){case bt.CONNECT:if(t.data&&t.data.sid){var e=t.data.sid;this.onconnect(e);}else this.emitReserved("connect_error",new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));break;case bt.EVENT:case bt.BINARY_EVENT:this.onevent(t);break;case bt.ACK:case bt.BINARY_ACK:this.onack(t);break;case bt.DISCONNECT:this.ondisconnect();break;case bt.CONNECT_ERROR:this.destroy();var n=new Error(t.data.message);n.data=t.data.data,this.emitReserved("connect_error",n);}}},{key:"onevent",value:function(t){var e=t.data||[];null!=t.id&&e.push(this.ack(t.id)),this.connected?this.emitEvent(e):this.receiveBuffer.push(Object.freeze(e));}},{key:"emitEvent",value:function(t){if(this._anyListeners&&this._anyListeners.length){var e,n=p(this._anyListeners.slice());try{for(n.s();!(e=n.n()).done;){e.value.apply(this,t);}}catch(t){n.e(t);}finally{n.f();}}f(s(o.prototype),"emit",this).apply(this,t);}},{key:"ack",value:function(t){var e=this,n=!1;return function(){if(!n){n=!0;for(var r=arguments.length,o=new Array(r),i=0;i<r;i++)o[i]=arguments[i];e.packet({type:bt.ACK,id:t,data:o});}}}},{key:"onack",value:function(t){var e=this.acks[t.id];"function"==typeof e&&(e.apply(this,t.data),delete this.acks[t.id]);}},{key:"onconnect",value:function(t){this.id=t,this.connected=!0,this.disconnected=!1,this.emitBuffered(),this.emitReserved("connect");}},{key:"emitBuffered",value:function(){var t=this;this.receiveBuffer.forEach((function(e){return t.emitEvent(e)})),this.receiveBuffer=[],this.sendBuffer.forEach((function(e){return t.packet(e)})),this.sendBuffer=[];}},{key:"ondisconnect",value:function(){this.destroy(),this.onclose("io server disconnect");}},{key:"destroy",value:function(){this.subs&&(this.subs.forEach((function(t){return t()})),this.subs=void 0),this.io._destroy(this);}},{key:"disconnect",value:function(){return this.connected&&this.packet({type:bt.DISCONNECT}),this.destroy(),this.connected&&this.onclose("io client disconnect"),this}},{key:"close",value:function(){return this.disconnect()}},{key:"compress",value:function(t){return this.flags.compress=t,this}},{key:"volatile",get:function(){return this.flags.volatile=!0,this}},{key:"timeout",value:function(t){return this.flags.timeout=t,this}},{key:"onAny",value:function(t){return this._anyListeners=this._anyListeners||[],this._anyListeners.push(t),this}},{key:"prependAny",value:function(t){return this._anyListeners=this._anyListeners||[],this._anyListeners.unshift(t),this}},{key:"offAny",value:function(t){if(!this._anyListeners)return this;if(t){for(var e=this._anyListeners,n=0;n<e.length;n++)if(t===e[n])return e.splice(n,1),this}else this._anyListeners=[];return this}},{key:"listenersAny",value:function(){return this._anyListeners||[]}}]),o}(R),Ot=St;function St(t){t=t||{},this.ms=t.min||100,this.max=t.max||1e4,this.factor=t.factor||2,this.jitter=t.jitter>0&&t.jitter<=1?t.jitter:0,this.attempts=0;}St.prototype.duration=function(){var t=this.ms*Math.pow(this.factor,this.attempts++);if(this.jitter){var e=Math.random(),n=Math.floor(e*this.jitter*t);t=0==(1&Math.floor(10*e))?t-n:t+n;}return 0|Math.min(t,this.max)},St.prototype.reset=function(){this.attempts=0;},St.prototype.setMin=function(t){this.ms=t;},St.prototype.setMax=function(t){this.max=t;},St.prototype.setJitter=function(t){this.jitter=t;};var Bt=function(n){i(s,n);var o=h(s);function s(n,r){var i,a;e(this,s),(i=o.call(this)).nsps={},i.subs=[],n&&"object"===t(n)&&(r=n,n=void 0),(r=r||{}).path=r.path||"/socket.io",i.opts=r,A(c(i),r),i.reconnection(!1!==r.reconnection),i.reconnectionAttempts(r.reconnectionAttempts||1/0),i.reconnectionDelay(r.reconnectionDelay||1e3),i.reconnectionDelayMax(r.reconnectionDelayMax||5e3),i.randomizationFactor(null!==(a=r.randomizationFactor)&&void 0!==a?a:.5),i.backoff=new Ot({min:i.reconnectionDelay(),max:i.reconnectionDelayMax(),jitter:i.randomizationFactor()}),i.timeout(null==r.timeout?2e4:r.timeout),i._readyState="closed",i.uri=n;var u=r.parser||At;return i.encoder=new u.Encoder,i.decoder=new u.Decoder,i._autoConnect=!1!==r.autoConnect,i._autoConnect&&i.open(),i}return r(s,[{key:"reconnection",value:function(t){return arguments.length?(this._reconnection=!!t,this):this._reconnection}},{key:"reconnectionAttempts",value:function(t){return void 0===t?this._reconnectionAttempts:(this._reconnectionAttempts=t,this)}},{key:"reconnectionDelay",value:function(t){var e;return void 0===t?this._reconnectionDelay:(this._reconnectionDelay=t,null===(e=this.backoff)||void 0===e||e.setMin(t),this)}},{key:"randomizationFactor",value:function(t){var e;return void 0===t?this._randomizationFactor:(this._randomizationFactor=t,null===(e=this.backoff)||void 0===e||e.setJitter(t),this)}},{key:"reconnectionDelayMax",value:function(t){var e;return void 0===t?this._reconnectionDelayMax:(this._reconnectionDelayMax=t,null===(e=this.backoff)||void 0===e||e.setMax(t),this)}},{key:"timeout",value:function(t){return arguments.length?(this._timeout=t,this):this._timeout}},{key:"maybeReconnectOnOpen",value:function(){!this._reconnecting&&this._reconnection&&0===this.backoff.attempts&&this.reconnect();}},{key:"open",value:function(t){var e=this;if(~this._readyState.indexOf("open"))return this;this.engine=new ut(this.uri,this.opts);var n=this.engine,r=this;this._readyState="opening",this.skipReconnect=!1;var o=Rt(n,"open",(function(){r.onopen(),t&&t();})),i=Rt(n,"error",(function(n){r.cleanup(),r._readyState="closed",e.emitReserved("error",n),t?t(n):r.maybeReconnectOnOpen();}));if(!1!==this._timeout){var s=this._timeout;0===s&&o();var a=this.setTimeoutFn((function(){o(),n.close(),n.emit("error",new Error("timeout"));}),s);this.opts.autoUnref&&a.unref(),this.subs.push((function(){clearTimeout(a);}));}return this.subs.push(o),this.subs.push(i),this}},{key:"connect",value:function(t){return this.open(t)}},{key:"onopen",value:function(){this.cleanup(),this._readyState="open",this.emitReserved("open");var t=this.engine;this.subs.push(Rt(t,"ping",this.onping.bind(this)),Rt(t,"data",this.ondata.bind(this)),Rt(t,"error",this.onerror.bind(this)),Rt(t,"close",this.onclose.bind(this)),Rt(this.decoder,"decoded",this.ondecoded.bind(this)));}},{key:"onping",value:function(){this.emitReserved("ping");}},{key:"ondata",value:function(t){this.decoder.add(t);}},{key:"ondecoded",value:function(t){this.emitReserved("packet",t);}},{key:"onerror",value:function(t){this.emitReserved("error",t);}},{key:"socket",value:function(t,e){var n=this.nsps[t];return n||(n=new Ct(this,t,e),this.nsps[t]=n),n}},{key:"_destroy",value:function(t){for(var e=0,n=Object.keys(this.nsps);e<n.length;e++){var r=n[e];if(this.nsps[r].active)return}this._close();}},{key:"_packet",value:function(t){for(var e=this.encoder.encode(t),n=0;n<e.length;n++)this.engine.write(e[n],t.options);}},{key:"cleanup",value:function(){this.subs.forEach((function(t){return t()})),this.subs.length=0,this.decoder.destroy();}},{key:"_close",value:function(){this.skipReconnect=!0,this._reconnecting=!1,this.onclose("forced close"),this.engine&&this.engine.close();}},{key:"disconnect",value:function(){return this._close()}},{key:"onclose",value:function(t){this.cleanup(),this.backoff.reset(),this._readyState="closed",this.emitReserved("close",t),this._reconnection&&!this.skipReconnect&&this.reconnect();}},{key:"reconnect",value:function(){var t=this;if(this._reconnecting||this.skipReconnect)return this;var e=this;if(this.backoff.attempts>=this._reconnectionAttempts)this.backoff.reset(),this.emitReserved("reconnect_failed"),this._reconnecting=!1;else {var n=this.backoff.duration();this._reconnecting=!0;var r=this.setTimeoutFn((function(){e.skipReconnect||(t.emitReserved("reconnect_attempt",e.backoff.attempts),e.skipReconnect||e.open((function(n){n?(e._reconnecting=!1,e.reconnect(),t.emitReserved("reconnect_error",n)):e.onreconnect();})));}),n);this.opts.autoUnref&&r.unref(),this.subs.push((function(){clearTimeout(r);}));}}},{key:"onreconnect",value:function(){var t=this.backoff.attempts;this._reconnecting=!1,this.backoff.reset(),this.emitReserved("reconnect",t);}}]),s}(R),Nt={};function xt(e,n){"object"===t(e)&&(n=e,e=void 0);var r,o=function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"",n=arguments.length>2?arguments[2]:void 0,r=t;n=n||"undefined"!=typeof location&&location,null==t&&(t=n.protocol+"//"+n.host),"string"==typeof t&&("/"===t.charAt(0)&&(t="/"===t.charAt(1)?n.protocol+t:n.host+t),/^(https?|wss?):\/\//.test(t)||(t=void 0!==n?n.protocol+"//"+t:"https://"+t),r=v(t)),r.port||(/^(http|ws)$/.test(r.protocol)?r.port="80":/^(http|ws)s$/.test(r.protocol)&&(r.port="443")),r.path=r.path||"/";var o=-1!==r.host.indexOf(":")?"["+r.host+"]":r.host;return r.id=r.protocol+"://"+o+":"+r.port+e,r.href=r.protocol+"://"+o+(n&&n.port===r.port?"":":"+r.port),r}(e,(n=n||{}).path||"/socket.io"),i=o.source,s=o.id,a=o.path,c=Nt[s]&&a in Nt[s].nsps;return n.forceNew||n["force new connection"]||!1===n.multiplex||c?r=new Bt(i,n):(Nt[s]||(Nt[s]=new Bt(i,n)),r=Nt[s]),o.query&&!n.query&&(n.query=o.queryKey),r.socket(o.path,n)}return o(xt,{Manager:Bt,Socket:Ct,io:xt,connect:xt}),xt}));

	(function() {
		const {
			assign: assign$2
		} = self.$;
		const app = {
			config: {},
			utility: self.$,
			events: {
				appStatus: {
					state: 0
				},
				credit(data) {
					app.creditSave = data;
					console.log('Credits Saved in worker');
				},
				post(id, data, options) {
					const responseData = {
						data,
						id
					};
					assign$2(responseData, options);
					postMessage(responseData);
				},
				socket: {}
			}
		};
		const {
			utility: {
				assign: assign$1
			}
		} = app;
		const post$1 = (id, data, options) => {
			const responseData = {
				data,
				id
			};
			assign$1(responseData, options);
			postMessage(responseData);
		};
		const {
			config,
			utility: {
				assign, uid, stringify, mapArray, last, isFileJS, isFileJSON, isFileCSS, initial, map, eachArray, zipObject
			}
		} = app;
		let socket;
		let alreadySetup;
		const routerData = self.location;
		const tickMark = '`';
		const isLib = /^js\/lib\//;
		const commaString = ',';
		const convertToTemplateString = /:"([^,]*?)"/gm;
		const convertToTemplateStringReplace = ':`$1`';
		const importRegexGlobal = /\b\w*import\b([^:;=]*?)?(["']*([\w'/$,{}_]+)["'][^\w])/gm;
		const importLocationsRegex = /[`'"](.*?)[`'"]/;
		const importVarsRegex = /[^$]{([^;]*?)}/;
		// const exportRegex = /\b\w*export\b([^:;=]*?)/;
		// const exportVars = /{([^;]*?)}/;
		// const exportDeafultRegex = /default ([^;]*?)/;
		const slashString = '/';
		const update = function(json) {
			post$1('_', json);
		};
		const callbacks = {
			update
		};
		const apiClient = function(data) {
			if (!data.id) {
				return update(data);
			}
			const callback = callbacks[data.id];
			if (callback) {
				return callback(data);
			}
		};
		const mainCallback = function(data, uniq, callable, options) {
			const callbackData = {};
			let cleanup = true;
			callbackData.data = data.data;
			const returned = callable(callbackData);
			if (options.async) {
				if (returned === true) {
					cleanup = false;
				}
			}
			if (cleanup) {
				callbacks[uniq] = null;
				uid.free(uniq);
			}
		};
		// emit function with synthetic callback system
		const request = (configObj, workerData) => {
			const data = configObj.data;
			const callback = (json) => {
				let result;
				const workerCallback = configObj.callback;
				if (workerCallback) {
					result = workerCallback(json.data);
				} else if (workerData) {
					result = post$1(workerData.id, json.data);
				}
				return result;
			};
			const options = {
				async: configObj.async
			};
			if (data.id) {
				data.id = undefined;
			} else {
				const uniq = uid().toString();
				data.id = uniq;
				callbacks[uniq] = function(callbackData) {
					mainCallback(callbackData, uniq, callback, options);
				};
			}
			socket.emit('api', data);
		};
		const socketIsReady = (data) => {
			console.log('Socket Is Ready');
			if (!alreadySetup) {
				post$1('setupCompleted', {
					language: data.language
				});
			}
			alreadySetup = 1;
		};
		const upgradeImport = (fileArg, item) => {
			let locations = item.match(importLocationsRegex);
			let replaceString = '';
			let appendCSS = '';
			let file = fileArg;
			let objectString;
			if (!locations || !fileArg) {
				return;
			}
			locations = locations[1];
			let imports = item.match(importVarsRegex);
			if (imports) {
				imports = mapArray(imports[1].split(commaString), (ImportItemArg) => {
					const ImportItem = ImportItemArg.trim();
					if (ImportItem.includes(' as ')) {
						return last(ImportItem.split(' '));
					}
					return ImportItem;
				});
				const fileLocations = locations.split(commaString);
				if (fileLocations.length < 2) {
					objectString = `${tickMark}${locations}${tickMark}`;
				} else {
					objectString = stringify(zipObject(imports, fileLocations)).replace(convertToTemplateString, convertToTemplateStringReplace);
				}
				replaceString = `const{${imports}}= `;
			} else {
				appendCSS = ',{appendCSS:true}';
				objectString = `${tickMark}${locations}${tickMark}`;
			}
			replaceString = `${replaceString} await _imprt(${objectString}${appendCSS});`;
			if (!file) {
				return fileArg;
			}
			file = fileArg.replace(item, replaceString);
			return file;
		};
		const replaceImports = function(fileArg) {
			const matches = fileArg.match(importRegexGlobal);
			let file = fileArg;
			if (matches) {
				eachArray(matches, (item) => {
					if (item) {
						file = upgradeImport(file, item);
					}
				});
			}
			return file;
		};
		const getCallback = function(jsonData, configObj, workerInfo) {
			const item = jsonData.file;
			const checksum = jsonData.cs;
			const cacheCheck = jsonData.cache;
			const key = jsonData.key;
			const fileList = configObj.fileList;
			const filename = fileList.files[key];
			const completedFiles = configObj.completedFiles;
			const checksums = configObj.checksum;
			const islib = isLib.test(filename);
			const isJs = isFileJS(filename);
			const isJson = isFileJSON(filename);
			const isCss = isFileCSS(filename);
			const dirname = initial(filename.split(slashString)).join(slashString);
			let sendNow;
			let requestStatus = true;
			/*
		    During an active stream data is compiled.
		    Based on Key coming in.
		    */
			if (item) {
				completedFiles[key] += item;
			} else if (item === false) {
				checksums[key] = false;
				completedFiles[key] = false;
				configObj.filesLoaded += 1;
				sendNow = true;
			} else if (cacheCheck) {
				completedFiles[key] = true;
				configObj.filesLoaded += 1;
				sendNow = true;
			} else {
				configObj.filesLoaded += 1;
				checksums[key] = checksum;
				sendNow = true;
			}
			if (sendNow) {
				let completedFile = completedFiles[key];
				if (completedFile !== true && isJs && !islib && completedFile !== false) {
					completedFile = `((exports) => { const _imprt = app.demand; return ${replaceImports(completedFile)}});`;
				}
				post$1(
					workerInfo.id,
					{
						cs: checksums[key],
						dirname,
						file: completedFile,
						isCss,
						isJs,
						isJson,
						isLib,
						key
					},
					{
						keep: true
					}
				);
			}
			if (configObj.filesLoaded === configObj.fileListLength) {
				const returned = {};
				if (configObj.callback) {
					configObj.callback(returned);
				} else {
					post$1(workerInfo.id, returned);
				}
				requestStatus = false;
			}
			return requestStatus;
		};
		/*
		This async streams required filesLoadedfrom socket
		or from cache.
		*/
		assign(app.events.socket, {
			get(options, workerInfo) {
				/*
		    Config for stream callback function
		    */
				const dataProp = options.data;
				const fileList = dataProp.files;
				const configObj = {
					callback: options.callback,
					checksum: [],
					completedFiles: map(fileList, () => {
						return '';
					}),
					fileList: dataProp,
					fileListLength: fileList.length,
					filesLoaded: 0,
					progress: options.progress
				};
				const body = {
					async: true,
					callback(json) {
						return getCallback(json, configObj, workerInfo);
					},
					data: {
						request: 'file.get'
					}
				};
				body.data.data = dataProp;
				request(body);
			},
			request
		});
		const socketInitialize = () => {
			console.log('Worker Socket Module', 'notify');
			const serverLocation = `${routerData.protocol}//${app.config.socketHostname || routerData.hostname}:${app.config.port}`;
			socket = self.io.connect(serverLocation, {
				transports: ['websocket']
			});
			socket.on('reconnect', () => {
				console.log('connected', app.creditSave);
				if (app.creditSave) {
					request({
						callback() {
							console.log('Re-authenticated');
							postMessage({
								data: {
									type: 'reconnected'
								},
								id: '_'
							});
						},
						data: {
							data: app.creditSave,
							request: 'user.verify'
						}
					});
				}
			});
			// this listens for client API calls
			socket.on('api', apiClient);
			socket.on('ready', socketIsReady);
			socket.on('configure', () => {
				socket.emit('configure', {
					language: navigator.language
				});
			});
			socket.on('disconnected', () => {
				postMessage({
					data: {
						type: 'disconnected'
					},
					id: '_'
				});
			});
		};
		app.events.configure = (data) => {
			console.log('configure', data);
			assign(config, data);
			socketInitialize();
		};
		const {
			utility: {
				get
			},
			events,
			events: {
				post
			}
		} = app;
		self.onmessage = (evnt) => {
			const data = evnt.data;
			const requestName = data.request;
			const id = data.id;
			const body = data.data;
			const eventCallback = get(requestName, events);
			if (eventCallback) {
				const returned = eventCallback(body, {
					id
				});
				if (returned) {
					post(returned, id);
				}
				console.log(`Worker api.${requestName}`);
			} else {
				console.log(`FAILED Worker api.${requestName}`);
			}
		};
	})();

})();
