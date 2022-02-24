(function () {

  self.window = self;

  !function(t,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):(t="undefined"!=typeof globalThis?globalThis:t||self).$=e();}(window,(function(){let t;const e=(...e)=>t(...e);e.superMethod=e=>{t=e;};const n=Object,r=n.keys,s=n.is,c=n.assign,o=n.getOwnPropertyDescriptor,i=n.defineProperty,l=n.getOwnPropertyNames,a=t=>r(t).length;c(e,{assign:c,defineProperty:i,getOwnPropertyDescriptor:o,getOwnPropertyNames:l,is:s,keys:r,objectSize:a});const u=Array.from;c(e,{toArray:u});const p=Reflect.apply;c(e,{apply:p});const h=function(t){return void 0===t},f=t=>null===t,g=t=>!h(t)&&!f(t),y=t=>e=>!!g(e)&&e.constructor===t,m=/\.|\+/,d=Array.isArray,A=y(String),b=y(Number),w=t=>!!g(t)&&"Object("===t.constructor.toString().trim().slice(9,16),O=t=>!!g(t)&&t instanceof Function,j=t=>Boolean(t.length),v=t=>e=>!!g(e)&&t.test(e),S=v(/\.css$/),C=v(/\.json$/),M=v(/\.js$/),k=v(/\.html$/),R=v(/\./),F=/\.([0-9a-z]+)/,E=t=>t instanceof Promise,x=t=>"AsyncFunction"===t.constructor.name;c(e,{getFileExtension:t=>{const e=t.match(F);if(e)return e[1]},has:(t,...e)=>t.includes(...e),hasDot:R,hasLength:j,hasValue:g,isArray:d,isBoolean:t=>"Boolean"===t.constructor.name,isDate:t=>t instanceof Date,isDecimal:t=>m.test(t.toString()),isEmpty:t=>A(t)||d(t)?!j(t):w(t)?!a(t):!g(t),isFileCSS:S,isFileHTML:k,isFileJS:M,isFileJSON:C,isFunction:O,isNull:f,isNumber:b,isPlainObject:w,isRegExp:t=>t instanceof RegExp,isString:A,isUndefined:h,isAsync:x,isPromise:E,isKindAsync:t=>E(t)||x(t)});const I=(t,e)=>{const n=t.length;for(let r=0;r<n;r++)e(t[r],r,t,n);return t},N=(t,e)=>{const n=t.length;for(let r=n-1;r>=0;r--)e(t[r],r,t,n);return t},T=(t,e)=>{const n=t.length;for(let r=0;r<n;r++)if(!1===e(t[r],r,t,n))return !1;return !0},P=(t,e,n=[])=>(I(t,((t,r,s,c)=>{!0===e(t,r,n,s,c)&&n.push(t);})),n),U=($=I,(t,e,n=[])=>($(t,((t,r,s,c)=>{n[r]=e(t,r,n,s,c);})),n));var $;const L=(t,e,n=[])=>(I(t,((t,r,s,c)=>{const o=e(t,r,n,s,c);g(o)&&n.push(o);})),n);c(e,{compactMapArray:L,eachArray:I,eachArrayRight:N,filterArray:P,mapArray:U,mapArrayRight:(t,e,n=[])=>{let r=0;const s=t.length;for(let c=s-1;c>=0;c--)n[r]=e(t[c],c,t,s),r++;return n},mapWhile:(t,e,n=[])=>{const r=t.length;for(let s=0;s<r;s++){const c=e(t[s],s,n,t,r);if(!1===c)break;n[s]=c;}return n},whileArray:T,whileEachArray:(t,e)=>{let n=0;for(;n<t.length;)e(t[n],n,t,t.length),n++;return t},whileMapArray:(t,e,n=[])=>{let r=0;for(;r<t.length;)n.push(e(t[r],r,t,t.length)),r++;return t},whileCompactMap:(t,e,n=[])=>{let r=0;for(;r<t.length;){const s=n.push(e(t[r],r,t,t.length));r++,g(s)&&n.push(s);}return t}});I(["Arguments","Map","Set","WeakMap"],(t=>{var n;e[`is${t}`]=(n=`[object ${t}]`,t=>!!g(t)&&t.toString()===n);}));I(["ArrayBuffer","Float32Array","Float64Array","Int8Array","Int16Array","Int32Array","Uint8Array","Uint8ClampedArray","Uint16Array","Uint32Array"],(t=>{e[`is${t}`]=e=>!!g(e)&&e.constructor.name===t;}));c(e,{asyncEach:async(t,e)=>{const n=t.length;for(let r=0;r<n;r++){const s=t[r];await s(e,r,t,n);}return t}});const B=t=>d(t)?t:[t];c(e,{ensureArray:B});const D=t=>t.flat(1/0);c(e,{flatten:(t,e=1)=>{let n=t;for(let t=0;t<e;t++)n=n.reduce(((t,e)=>t.concat(B(e))),[]);return n},flattenDeep:D});c(e,{remove:(t,e)=>{let n=t.length;for(let r=0;r<n;r++){const s=t[r];e.includes(s)&&(t.splice(r,1),r--,n--);}return t},removeBy:(t,e)=>{let n=t.length;for(let r=0;r<n;r++){e(t[r],r)&&(t.splice(r,1),r--,n--);}return t}});c(e,{chunk:(t,e=1)=>{const n=[];let r=0;return t.forEach(((t,s)=>{s%e||(n.push([]),s&&r++),n[r].push(t);})),n}});c(e,{rest:t=>t.slice(1,t.length)});const z=t=>(t.length=0,t);c(e,{clear:z});c(e,{right:(t,e)=>t[t.length-1-e]});c(e,{cloneArray:t=>t.slice()});const K=Math,q=K.floor,W=K.random,J=(t,e=0)=>q(W()*(t-e))+e;c(e,{add:(t,e)=>t+e,deduct:t=>t-1,divide:(t,e)=>t/e,increment:t=>t+1,minus:(t,e)=>t-e,multiply:(t,e)=>t*e,randomArbitrary:(t,e=0)=>W()*(t-e)+e,randomInt:J,remainder:(t,e)=>t%e});const Z=(t,e=t.length)=>{if(t.length<=1)return u(t);const n=u(t);let r,s,c=0;for(;c<e;)r=J(n.length-1,0),s=n[c],n[c]=n[r],n[r]=s,c++;return n};c(e,{shuffle:Z});c(e,{sample:(t,e=1)=>{if(!t)return !1;const n=t.length;if(n===e||e>n)return Z(t);if(1===e)return [t[J(n-1,0)]];const r=[],s={};let c,o=0;for(;o<e;)c=J(t.length-1,0),s[c]||(r.push(t[c]),s[c]=!0,o++);return r}});c(e,{compact:t=>t.filter((t=>!(A(t)&&!t.length)&&t))});c(e,{initial:t=>t.slice(0,t.length-1)});const V=Math.min;c(e,{smallest:t=>V(...t)});c(e,{range:(t,e,n=1)=>t<e?((t,e,n)=>{const r=[];let s=t;for(;s<e;)r.push(s),s+=n;return r})(t,e,n):((t,e,n)=>{const r=n<0?-1*n:n,s=[];let c=t;for(;c>e;)s.push(c),c-=r;return s})(t,e,n)});c(e,{intersect:(t,...e)=>L(t,(t=>{if(T(e,(e=>e.includes(t))))return t}))});c(e,{difference:(t,...e)=>{const n=D(e);return L(t,(t=>{if(!n.includes(t))return t}))}});const _=(t,e,n=t.length)=>t.splice(e,n);c(e,{drop:_,dropRight:(t,e,n=t.length)=>_(t,0,n-e)});const H=(t,e)=>t.length===e.length&&T(t,((t,n)=>e[n]===t));c(e,{isMatchArray:H});c(e,{sortedIndex:(t,e)=>{let n=0;return T(t,((t,r)=>(n=r,e>t))),n}});const G=Math.max;c(e,{largest:t=>G(...t)});c(e,{sum:t=>t.reduce(((t,e)=>t+e),0)});const Q=async(t,e)=>{const n=t.length;for(let r=0;r<n;r++)await e(t[r],r,t,n);return t},X=async(t,e)=>{const n=t.length;for(let r=n-1;r>=0;r--)await e(t[r],r,t,n);return t};c(e,{eachAsync:Q,eachAsyncRight:X});c(e,{last:(t,e)=>{const n=t.length;return e?t.slice(n-e,n):t[n-1]}});c(e,{take:(t,e=1)=>t.slice(0,e),takeRight:(t,e=1)=>{const n=t.length;return t.slice(n-e,n)}});const Y=async(t,e)=>{const n=[];return await Q(t,(async(t,r,s)=>{n[r]=await e(t,r,s);})),n};c(e,{mapAsync:Y});const tt=(t,e,n)=>n.indexOf(t)===e,et=(t,e,n)=>t!==n[e-1],nt=(t,e)=>e?t.filter(et):t.filter(tt);c(e,{unique:nt});c(e,{union:(...t)=>nt(D(t))});c(e,{compactMapAsync:async(t,e)=>{const n=[];let r;return await Q(t,(async(t,s,c)=>{r=await e(t,s,n,c),g(r)&&n.push(r);})),n}});const rt=(t,e)=>t-e;c(e,{numSort:t=>t.sort(rt)});c(e,{arrayToObject:(t,e)=>{const n={};return I(t,((t,r)=>{n[e[r]]=t;})),n}});c(e,{without:(t,e)=>t.filter((t=>!e.includes(t)))});c(e,{partition:(t,e)=>{const n=[];return [L(t,(t=>{if(e(t))return t;n.push(t);})),n]}});c(e,{xor:(...t)=>{const e=[];return I(t,(t=>{I(nt(t),(t=>{e.includes(t)?e.splice(e.indexOf(t),1):e.push(t);}));})),e}});c(e,{unZip:t=>t[0].map(((e,n)=>t.map((t=>t[n])))),zip:(...t)=>t[0].map(((e,n)=>t.map((t=>t[n]))))});c(e,{first:(t,e)=>e?t.slice(0,e):t[0]});const st=(t,e)=>e-t;c(e,{rNumSort:t=>t.sort(st)});const ct=(t,e,n)=>{const r=n?t:0,s=n?e:t,c=n||e;for(let t=r;t<s;t++)c(t,r,s);};c(e,{times:ct,timesMap:(t,e,n,r=[])=>{const s=n?t:0,c=n?e:t,o=n||e;let i;return ct(s,c,(t=>{i=o(t,s,c,r),g(i)&&r.push(i);})),r}});const ot=(t,e,n=!0)=>(n?t:[...t]).sort(((t,n)=>n[e]?t[e]?t[e]<n[e]?1:t[e]>n[e]?-1:0:1:-1));c(e,{getNewest:(t,e)=>ot(t,e,!1)[0],sortNewest:ot});const it=(t,e="id",n=!0)=>(n?t:[...t]).sort(((t,n)=>n[e]?t[e]?t[e]<n[e]?-1:t[e]>n[e]?1:0:-1:1));c(e,{getOldest:(t,e="id")=>it(t,e)[0],sortOldest:it});c(e,{groupBy:(t,e)=>{const n={};return I(t,(t=>{const r=e(t);n[r]||(n[r]=[]),n[r].push(t);})),n}});c(e,{countBy:(t,e)=>{const n={};let r;return I(t,(t=>{r=e(t),n[r]||(n[r]=0),n[r]++;})),n},countKey:(t,e)=>{let n=0;return I(t,(t=>{t[e]&&n++;})),n},countWithoutKey:(t,e)=>{let n=0;return I(t,(t=>{t[e]||n++;})),n}});c(e,{indexBy:(t,e="id")=>{const n={};return I(t,(t=>{n[t[e]]=t;})),n}});c(e,{pluck:(t,e)=>U(t,(t=>t[e]))});const lt=(t,e)=>U(e,(e=>t[e]));c(e,{pluckObject:lt});c(e,{pluckValues:(t,e)=>U(t,(t=>lt(t,e)))});c(e,{invoke:(t,e,n)=>U(t,((t,r)=>t[e](n,r)))});c(e,{invokeAsync:(t,e,n)=>Y(t,(async(t,r)=>t[e](n,r)))});const at=(t,e,n,r,s)=>{if(t[s]===r)return !0};c(e,{findIndex:(t,e,n="id")=>{const r=t.findIndex(((t,r)=>at(t,0,0,e,n)));return -1!==r&&r},findItem:(t,e,n="id")=>{const r=t.find(((t,r)=>at(t,0,0,e,n)));return -1!==r&&r}});c(e,{sortAlphabetical:(t,e)=>t.sort(((t,n)=>{const r=t[e],s=n[e];return r<s?-1:r>s?1:0}))});c(e,{ary:(t,e)=>(...n)=>t(...n.splice(0,e))});c(e,{curry:(t,e=t.length)=>{const n=[],r=(...s)=>{if(n.push(...s),n.length===e){const e=t(...n);return z(n),e}return r};return r},curryRight:(t,e=t.length)=>{const n=[],r=(...s)=>{if(n.unshift(...s),n.length===e){const e=t(...n);return z(n),e}return r};return r}});c(e,{after:(t,e)=>{let n,r=t;return (...t)=>(null!==r&&r--,r<=0&&(n=e(...t),r=null),n)},before:(t,e)=>{let n,r=t;return (...t)=>(null!==r&&r--,r>=1?n=e(...t):r=null,n)},once:t=>{let e;return (...n)=>(g(e)||(e=t(...n)),e)}});c(e,{noop:()=>{},stubArray:()=>[],stubFalse:()=>!1,stubObject:()=>({}),stubString:()=>"",stubTrue:()=>!0});const ut=(t,e)=>{const n=r(t);I(n,((r,s,c,o)=>{e(t[r],r,t,o,n);}));},pt=(t,e)=>{const n=r(t);return T(n,((n,r,s,c)=>e(t[n],n,t,c,s)))},ht=(t,e,n={})=>(ut(t,((t,r,s,c,o)=>{!0===e(t,r,n,s,c,o)&&(n[r]=t);})),n),ft=(t,e,n={})=>(ut(t,((t,r,s,c,o)=>{n[r]=e(t,r,n,s,c,o);})),n),gt=(t,e,n={})=>(ut(t,((t,r,s,c,o)=>{const i=e(t,r,n,c,o);g(i)&&(n[r]=i);})),n);c(e,{compactMapObject:gt,eachObject:ut,filterObject:ht,mapObject:ft,whileObject:pt});const yt=(t,e)=>t.forEach(e),mt=(t,e)=>(n,r,s)=>{let c;if(g(n))return c=d(n)?t:w(n)||O(n)?e:n.forEach?yt:e,c(n,r,s)},dt=mt(T,pt),At=mt(I,ut),bt=mt(P,ht),wt=mt(U,ft),Ot=mt(L,gt);c(e,{compactMap:Ot,each:At,eachWhile:dt,filter:bt,map:wt});c(e,{bindAll:(t,e)=>wt(t,(t=>O(t)?t.bind(e):t))});c(e,{ifInvoke:(t,...e)=>{if(O(t))return t(...e)}});c(e,{negate:t=>(...e)=>!t(...e)});c(e,{every:dt});c(e,{over:t=>(...e)=>wt(t,(t=>t(...e))),overEvery:t=>(...e)=>dt(t,(t=>t(...e)))});const jt=(t,e)=>setTimeout(t,e),vt=(t,e)=>setInterval(t,e),St=(t,e)=>()=>{ct(0,t((()=>{}),0),(t=>{e(t);}));},Ct=St(jt,clearTimeout),Mt=St(vt,clearInterval);c(e,{clearIntervals:Mt,clearTimers:Ct,debounce:(t,e)=>{let n=!1;const r=(...r)=>{!1!==n&&clearTimeout(n),n=jt((()=>{t(...r),n=!1;}),e);};return r.clear=()=>{n&&(clearTimeout(n),n=!1);},r},interval:vt,throttle:(t,e)=>{let n,r=!1;const s=(...s)=>{r?n=!0:(t(...s),r=jt((()=>{n&&t(...s),r=!1;}),e));};return s.clear=()=>{clearTimeout(r),r=!1;},s},timer:jt});c(e,{chain:t=>{const e=t=>(e.value=t,e.methods);return c(e,{add:t=>((t,e)=>(At(e,((e,n)=>{t.methods[n]=(...n)=>(e(t.value,...n),t.methods);})),t))(e,t),done(){const t=e.value;return e.value=null,t},methods:{}}),e.add(t),e}});c(e,{inAsync:async(t,e)=>Q(t,(async t=>{await t(e);})),inSync:(t,e)=>At(t,(t=>{t(e);}))});c(e,{nthArg:(t=0)=>(...e)=>e[t]});c(e,{reArg:(t,e)=>(...n)=>t(...e.map((t=>n[t])))});c(e,{wrap:(t,e)=>(...n)=>e(t,...n)});c(e,{isNumberEqual:(t,e)=>t===e,isNumberInRange:(t,e,n)=>t>e&&t<n,isZero:t=>0===t});const kt=(t,e)=>{const n=r(t);return T(e,(t=>n.includes(t)))};c(e,{hasAnyKeys:(t,e)=>{const n=r(t);return Boolean(e.find((t=>n.includes(t))))},hasKeys:kt});c(e,{pick:(t,e,n={})=>(I(e,(e=>{n[e]=t[e];})),n)});c(e,{compactKeys:t=>{const e=[];return ut(t,((t,n)=>{t&&e.push(n);})),e}});c(e,{isMatchObject:(t,e)=>{const n=r(t);return !!H(n,r(e))&&T(n,(n=>t[n]===e[n]))}});c(e,{unZipObject:t=>{const e=[],n=[];return ut(t,((t,r)=>{e.push(r),n.push(t);})),[e,n]},zipObject:(t,e)=>{const n={};return I(t,((t,r)=>{n[t]=e[r];})),n}});c(e,{invert:(t,e={})=>(ut(t,((t,n)=>{e[t]=n;})),e)});c(e,{omit:(t,e)=>ht(t,((t,n)=>!e.includes(n)))});const Rt=async(t,e)=>{const n=r(t);return await Q(n,((r,s,c,o)=>e(t[r],r,t,o,n))),t};c(e,{eachObjectAsync:Rt});c(e,{compactMapObjectAsync:async(t,e,n={})=>(await Rt(t,(async(t,r,s,c,o)=>{const i=await e(t,r,n,c,o);g(i)&&(n[r]=i);})),n),mapObjectAsync:async(t,e,n={})=>(await Rt(t,(async(t,r,s,c,o)=>{n[r]=await e(t,r,n,s,c,o);})),n)});const Ft=/[-_]/g,Et=/ (.)/g;c(e,{camelCase:t=>t.toLowerCase().replace(Et,(t=>t.toUpperCase().replace(/ /g,""))),kebabCase:t=>t.replace(Ft," ").trim().toLowerCase().replace(Et,"-$1"),snakeCase:t=>t.replace(Ft," ").trim().toLowerCase().replace(Et,"_$1"),upperCase:t=>t.replace(Ft," ").trim().toUpperCase()});const xt=(t,e=1)=>t.substr(e);c(e,{chunkString:(t,e)=>t.match(new RegExp(`(.|[\r\n]){1,${e}}`,"g")),initialString:(t,e=1)=>t.slice(0,-1*e),insertInRange:(t,e,n)=>t.slice(0,e)+n+t.slice(e,t.length),restString:xt,rightString:(t,e=1)=>t[t.length-e]});c(e,{replaceList:(t,e,n)=>t.replace(new RegExp("\\b"+e.join("|")+"\\b","gi"),n)});const It=/%(?![\da-f]{2})/gi,Nt=/&/g,Tt=/</g,Pt=/>/g,Ut=/"/g,$t=t=>decodeURIComponent(t.replace(It,(()=>"%25"))),Lt=t=>t.replace(Nt,"&amp;").replace(Tt,"&lt;").replace(Pt,"&gt;").replace(Ut,"&quot;");c(e,{htmlEntities:Lt,rawURLDecode:$t,sanitize:t=>Lt($t(t))});const Bt=/\S+/g,Dt=/\w+/g;c(e,{tokenize:t=>t.match(Bt)||[],words:t=>t.match(Dt)||[]});c(e,{truncate:(t,e)=>{const n=t.length;return n>e?((t,e,n)=>{const r=t.split(""),s=r.length;let c,o=n-e;for(;o<s&&o>=0&&(c=r[o]," "!==c);o--);return t.slice(0,o).trim()})(t,e,n):t},truncateRight:(t,e)=>{const n=t.length;return n>e?((t,e,n)=>{const r=t.split(""),s=r.length;let c,o=e;for(;o<s&&o>0&&(c=r[o]," "!==c);o++);return t.substr(o,n).trim()})(t,e,n):t}});const zt=/ (.)/g,Kt=t=>t[0].toUpperCase(),qt=t=>Kt(t)+xt(t).toLowerCase();c(e,{upperFirst:t=>Kt(t)+xt(t),upperFirstAll:t=>t.replace(zt,(t=>t.toUpperCase())),upperFirstLetter:Kt,upperFirstOnly:qt,upperFirstOnlyAll:t=>qt(t.toLowerCase()).replace(zt,(t=>t.toUpperCase()))});const Wt=Object.create,Jt=(t,e,n=!1,s,c,o)=>{if(t){if(!d(t)&&!w(t))return e;if(o){const r=o.pop();if(r){const s=e[r];t[r]=Jt(t[r],s,n);}else if(!c)return t;if(c){let r=s||0;if(r++,r<c)return Jt(t,e,n,r,c,o)}return Jt(t,e,n,null,null,o)}if(c){if(s<c){let r=s||0;const i=e[r];if(i){const s=t[r];if(n?t.push(Jt(s,i,n)):t[r]=Jt(s,i,n),r++,r<c)return Jt(t,e,n,r,c,o)}}}else {if(d(e))return 0===c?t:Jt(t,e,n,0,e.length);if(w(e)){const s=r(e);return Jt(t,e,n,null,null,s)}}}else {if(w(e))return o?Jt({},e,n,null,null,o):Jt({},e,n);if(d(e))return s<c?Jt([],e,n,s,c,o):Jt([],e,n)}return t||e};let Zt;Zt=globalThis.structuredClone?t=>globalThis.structuredClone(t):t=>w(t)?Jt({},t):d(t)?Jt([],t):Wt(t),c(e,{assignDeep:Jt,clone:Zt});const Vt=Function.prototype;c(e,{cacheNativeMethod:function(t){return Vt.call.bind(t)}});c(e,{ifNotEqual:(t,e,n)=>(e&&!g(t[e])&&(t[e]=n),t)});const _t=(t,e)=>{if(t===e)return !0;if(t.toString()===e.toString())if(w(t)){const n=r(t);if(kt(e,n))return T(n,(n=>_t(t[n],e[n])))}else if(d(t)&&t.length===e.length)return T(t,((t,n)=>_t(t,e[n])));return !1};c(e,{isEqual:_t});c(e,{propertyMatch:(t,e,n=r(t))=>T(n,(n=>_t(t[n],e[n])))});const Ht=/\.|\[/,Gt=/]/g,Qt=t=>t.replace(Gt,"").split(Ht);c(e,{toPath:Qt});let Xt=0;const Yt=[],te={},ee=()=>{let t=Yt.shift(Yt);return g(t)||(t=Xt,te[t]=!0,Xt++),t};ee.free=t=>{te[t]=null,Yt.push(t);},c(e,{uid:ee});const ne=(t,n=e)=>{let r=n;return T(Qt(t),(t=>(r=r[t],g(r)))),r};c(e,{get:ne});const re=JSON,se=re.parse,ce=re.stringify;c(e,{jsonParse:se,stringify:ce});const oe=(t,e)=>(g(e)&&(oe[t]=e),ne(t,oe));e.superMethod(oe),c(e,{model:oe});c(e,{promise:t=>new Promise(t)});c(e,{toggle:(t,e=!0,n=!1)=>_t(e,t)?n:e});const ie=t=>(...e)=>n=>{let r=n;return t(e,(t=>{r=t(r);})),r},le=ie(I),ae=ie(N);c(e,{flow:le,flowRight:ae});const ue=t=>(...e)=>async n=>{let r=n;return await t(e,(async t=>{r=await t(r);})),r},pe=ue(Q),he=ue(X);return c(e,{flowAsync:pe,flowAsyncRight:he}),e}));

  /*!
   * Socket.IO v4.4.1
   * (c) 2014-2022 Guillermo Rauch
   * Released under the MIT License.
   */
  (function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.io = factory());
  })(window, (function () {
    function _typeof(obj) {
      "@babel/helpers - typeof";

      if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
        _typeof = function (obj) {
          return typeof obj;
        };
      } else {
        _typeof = function (obj) {
          return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
        };
      }

      return _typeof(obj);
    }

    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }

    function _defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    function _createClass(Constructor, protoProps, staticProps) {
      if (protoProps) _defineProperties(Constructor.prototype, protoProps);
      if (staticProps) _defineProperties(Constructor, staticProps);
      return Constructor;
    }

    function _extends() {
      _extends = Object.assign || function (target) {
        for (var i = 1; i < arguments.length; i++) {
          var source = arguments[i];

          for (var key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
              target[key] = source[key];
            }
          }
        }

        return target;
      };

      return _extends.apply(this, arguments);
    }

    function _inherits(subClass, superClass) {
      if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
      }

      subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
          value: subClass,
          writable: true,
          configurable: true
        }
      });
      if (superClass) _setPrototypeOf(subClass, superClass);
    }

    function _getPrototypeOf(o) {
      _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
        return o.__proto__ || Object.getPrototypeOf(o);
      };
      return _getPrototypeOf(o);
    }

    function _setPrototypeOf(o, p) {
      _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
      };

      return _setPrototypeOf(o, p);
    }

    function _isNativeReflectConstruct() {
      if (typeof Reflect === "undefined" || !Reflect.construct) return false;
      if (Reflect.construct.sham) return false;
      if (typeof Proxy === "function") return true;

      try {
        Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
        return true;
      } catch (e) {
        return false;
      }
    }

    function _assertThisInitialized(self) {
      if (self === void 0) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
      }

      return self;
    }

    function _possibleConstructorReturn(self, call) {
      if (call && (typeof call === "object" || typeof call === "function")) {
        return call;
      } else if (call !== void 0) {
        throw new TypeError("Derived constructors may only return object or undefined");
      }

      return _assertThisInitialized(self);
    }

    function _createSuper(Derived) {
      var hasNativeReflectConstruct = _isNativeReflectConstruct();

      return function _createSuperInternal() {
        var Super = _getPrototypeOf(Derived),
            result;

        if (hasNativeReflectConstruct) {
          var NewTarget = _getPrototypeOf(this).constructor;

          result = Reflect.construct(Super, arguments, NewTarget);
        } else {
          result = Super.apply(this, arguments);
        }

        return _possibleConstructorReturn(this, result);
      };
    }

    function _superPropBase(object, property) {
      while (!Object.prototype.hasOwnProperty.call(object, property)) {
        object = _getPrototypeOf(object);
        if (object === null) break;
      }

      return object;
    }

    function _get(target, property, receiver) {
      if (typeof Reflect !== "undefined" && Reflect.get) {
        _get = Reflect.get;
      } else {
        _get = function _get(target, property, receiver) {
          var base = _superPropBase(target, property);

          if (!base) return;
          var desc = Object.getOwnPropertyDescriptor(base, property);

          if (desc.get) {
            return desc.get.call(receiver);
          }

          return desc.value;
        };
      }

      return _get(target, property, receiver || target);
    }

    function _unsupportedIterableToArray(o, minLen) {
      if (!o) return;
      if (typeof o === "string") return _arrayLikeToArray(o, minLen);
      var n = Object.prototype.toString.call(o).slice(8, -1);
      if (n === "Object" && o.constructor) n = o.constructor.name;
      if (n === "Map" || n === "Set") return Array.from(o);
      if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
    }

    function _arrayLikeToArray(arr, len) {
      if (len == null || len > arr.length) len = arr.length;

      for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

      return arr2;
    }

    function _createForOfIteratorHelper(o, allowArrayLike) {
      var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];

      if (!it) {
        if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
          if (it) o = it;
          var i = 0;

          var F = function () {};

          return {
            s: F,
            n: function () {
              if (i >= o.length) return {
                done: true
              };
              return {
                done: false,
                value: o[i++]
              };
            },
            e: function (e) {
              throw e;
            },
            f: F
          };
        }

        throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
      }

      var normalCompletion = true,
          didErr = false,
          err;
      return {
        s: function () {
          it = it.call(o);
        },
        n: function () {
          var step = it.next();
          normalCompletion = step.done;
          return step;
        },
        e: function (e) {
          didErr = true;
          err = e;
        },
        f: function () {
          try {
            if (!normalCompletion && it.return != null) it.return();
          } finally {
            if (didErr) throw err;
          }
        }
      };
    }

    /**
     * Parses an URI
     *
     * @author Steven Levithan <stevenlevithan.com> (MIT license)
     * @api private
     */
    var re = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
    var parts = ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'];

    var parseuri = function parseuri(str) {
      var src = str,
          b = str.indexOf('['),
          e = str.indexOf(']');

      if (b != -1 && e != -1) {
        str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ';') + str.substring(e, str.length);
      }

      var m = re.exec(str || ''),
          uri = {},
          i = 14;

      while (i--) {
        uri[parts[i]] = m[i] || '';
      }

      if (b != -1 && e != -1) {
        uri.source = src;
        uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ':');
        uri.authority = uri.authority.replace('[', '').replace(']', '').replace(/;/g, ':');
        uri.ipv6uri = true;
      }

      uri.pathNames = pathNames(uri, uri['path']);
      uri.queryKey = queryKey(uri, uri['query']);
      return uri;
    };

    function pathNames(obj, path) {
      var regx = /\/{2,9}/g,
          names = path.replace(regx, "/").split("/");

      if (path.substr(0, 1) == '/' || path.length === 0) {
        names.splice(0, 1);
      }

      if (path.substr(path.length - 1, 1) == '/') {
        names.splice(names.length - 1, 1);
      }

      return names;
    }

    function queryKey(uri, query) {
      var data = {};
      query.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function ($0, $1, $2) {
        if ($1) {
          data[$1] = $2;
        }
      });
      return data;
    }

    /**
     * URL parser.
     *
     * @param uri - url
     * @param path - the request path of the connection
     * @param loc - An object meant to mimic window.location.
     *        Defaults to window.location.
     * @public
     */

    function url(uri) {
      var path = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
      var loc = arguments.length > 2 ? arguments[2] : undefined;
      var obj = uri; // default to window.location

      loc = loc || typeof location !== "undefined" && location;
      if (null == uri) uri = loc.protocol + "//" + loc.host; // relative path support

      if (typeof uri === "string") {
        if ("/" === uri.charAt(0)) {
          if ("/" === uri.charAt(1)) {
            uri = loc.protocol + uri;
          } else {
            uri = loc.host + uri;
          }
        }

        if (!/^(https?|wss?):\/\//.test(uri)) {
          if ("undefined" !== typeof loc) {
            uri = loc.protocol + "//" + uri;
          } else {
            uri = "https://" + uri;
          }
        } // parse


        obj = parseuri(uri);
      } // make sure we treat `localhost:80` and `localhost` equally


      if (!obj.port) {
        if (/^(http|ws)$/.test(obj.protocol)) {
          obj.port = "80";
        } else if (/^(http|ws)s$/.test(obj.protocol)) {
          obj.port = "443";
        }
      }

      obj.path = obj.path || "/";
      var ipv6 = obj.host.indexOf(":") !== -1;
      var host = ipv6 ? "[" + obj.host + "]" : obj.host; // define unique id

      obj.id = obj.protocol + "://" + host + ":" + obj.port + path; // define href

      obj.href = obj.protocol + "://" + host + (loc && loc.port === obj.port ? "" : ":" + obj.port);
      return obj;
    }

    var hasCors = {exports: {}};

    /**
     * Module exports.
     *
     * Logic borrowed from Modernizr:
     *
     *   - https://github.com/Modernizr/Modernizr/blob/master/feature-detects/cors.js
     */

    try {
      hasCors.exports = typeof XMLHttpRequest !== 'undefined' && 'withCredentials' in new XMLHttpRequest();
    } catch (err) {
      // if XMLHttp support is disabled in IE then it will throw
      // when trying to create
      hasCors.exports = false;
    }

    var hasCORS = hasCors.exports;

    var globalThis = (function () {
      if (typeof self !== "undefined") {
        return self;
      } else if (typeof window !== "undefined") {
        return window;
      } else {
        return Function("return this")();
      }
    })();

    // browser shim for xmlhttprequest module
    function XMLHttpRequest$1 (opts) {
      var xdomain = opts.xdomain; // XMLHttpRequest can be disabled on IE

      try {
        if ("undefined" !== typeof XMLHttpRequest && (!xdomain || hasCORS)) {
          return new XMLHttpRequest();
        }
      } catch (e) {}

      if (!xdomain) {
        try {
          return new globalThis[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
        } catch (e) {}
      }
    }

    function pick(obj) {
      for (var _len = arguments.length, attr = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        attr[_key - 1] = arguments[_key];
      }

      return attr.reduce(function (acc, k) {
        if (obj.hasOwnProperty(k)) {
          acc[k] = obj[k];
        }

        return acc;
      }, {});
    } // Keep a reference to the real timeout functions so they can be used when overridden

    var NATIVE_SET_TIMEOUT = setTimeout;
    var NATIVE_CLEAR_TIMEOUT = clearTimeout;
    function installTimerFunctions(obj, opts) {
      if (opts.useNativeTimers) {
        obj.setTimeoutFn = NATIVE_SET_TIMEOUT.bind(globalThis);
        obj.clearTimeoutFn = NATIVE_CLEAR_TIMEOUT.bind(globalThis);
      } else {
        obj.setTimeoutFn = setTimeout.bind(globalThis);
        obj.clearTimeoutFn = clearTimeout.bind(globalThis);
      }
    }

    /**
     * Expose `Emitter`.
     */

    var Emitter_1 = Emitter;
    /**
     * Initialize a new `Emitter`.
     *
     * @api public
     */

    function Emitter(obj) {
      if (obj) return mixin(obj);
    }
    /**
     * Mixin the emitter properties.
     *
     * @param {Object} obj
     * @return {Object}
     * @api private
     */


    function mixin(obj) {
      for (var key in Emitter.prototype) {
        obj[key] = Emitter.prototype[key];
      }

      return obj;
    }
    /**
     * Listen on the given `event` with `fn`.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */


    Emitter.prototype.on = Emitter.prototype.addEventListener = function (event, fn) {
      this._callbacks = this._callbacks || {};
      (this._callbacks['$' + event] = this._callbacks['$' + event] || []).push(fn);
      return this;
    };
    /**
     * Adds an `event` listener that will be invoked a single
     * time then automatically removed.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */


    Emitter.prototype.once = function (event, fn) {
      function on() {
        this.off(event, on);
        fn.apply(this, arguments);
      }

      on.fn = fn;
      this.on(event, on);
      return this;
    };
    /**
     * Remove the given callback for `event` or all
     * registered callbacks.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */


    Emitter.prototype.off = Emitter.prototype.removeListener = Emitter.prototype.removeAllListeners = Emitter.prototype.removeEventListener = function (event, fn) {
      this._callbacks = this._callbacks || {}; // all

      if (0 == arguments.length) {
        this._callbacks = {};
        return this;
      } // specific event


      var callbacks = this._callbacks['$' + event];
      if (!callbacks) return this; // remove all handlers

      if (1 == arguments.length) {
        delete this._callbacks['$' + event];
        return this;
      } // remove specific handler


      var cb;

      for (var i = 0; i < callbacks.length; i++) {
        cb = callbacks[i];

        if (cb === fn || cb.fn === fn) {
          callbacks.splice(i, 1);
          break;
        }
      } // Remove event specific arrays for event types that no
      // one is subscribed for to avoid memory leak.


      if (callbacks.length === 0) {
        delete this._callbacks['$' + event];
      }

      return this;
    };
    /**
     * Emit `event` with the given args.
     *
     * @param {String} event
     * @param {Mixed} ...
     * @return {Emitter}
     */


    Emitter.prototype.emit = function (event) {
      this._callbacks = this._callbacks || {};
      var args = new Array(arguments.length - 1),
          callbacks = this._callbacks['$' + event];

      for (var i = 1; i < arguments.length; i++) {
        args[i - 1] = arguments[i];
      }

      if (callbacks) {
        callbacks = callbacks.slice(0);

        for (var i = 0, len = callbacks.length; i < len; ++i) {
          callbacks[i].apply(this, args);
        }
      }

      return this;
    }; // alias used for reserved events (protected method)


    Emitter.prototype.emitReserved = Emitter.prototype.emit;
    /**
     * Return array of callbacks for `event`.
     *
     * @param {String} event
     * @return {Array}
     * @api public
     */

    Emitter.prototype.listeners = function (event) {
      this._callbacks = this._callbacks || {};
      return this._callbacks['$' + event] || [];
    };
    /**
     * Check if this emitter has `event` handlers.
     *
     * @param {String} event
     * @return {Boolean}
     * @api public
     */


    Emitter.prototype.hasListeners = function (event) {
      return !!this.listeners(event).length;
    };

    var PACKET_TYPES = Object.create(null); // no Map = no polyfill

    PACKET_TYPES["open"] = "0";
    PACKET_TYPES["close"] = "1";
    PACKET_TYPES["ping"] = "2";
    PACKET_TYPES["pong"] = "3";
    PACKET_TYPES["message"] = "4";
    PACKET_TYPES["upgrade"] = "5";
    PACKET_TYPES["noop"] = "6";
    var PACKET_TYPES_REVERSE = Object.create(null);
    Object.keys(PACKET_TYPES).forEach(function (key) {
      PACKET_TYPES_REVERSE[PACKET_TYPES[key]] = key;
    });
    var ERROR_PACKET = {
      type: "error",
      data: "parser error"
    };

    var withNativeBlob$1 = typeof Blob === "function" || typeof Blob !== "undefined" && Object.prototype.toString.call(Blob) === "[object BlobConstructor]";
    var withNativeArrayBuffer$2 = typeof ArrayBuffer === "function"; // ArrayBuffer.isView method is not defined in IE10

    var isView$1 = function isView(obj) {
      return typeof ArrayBuffer.isView === "function" ? ArrayBuffer.isView(obj) : obj && obj.buffer instanceof ArrayBuffer;
    };

    var encodePacket = function encodePacket(_ref, supportsBinary, callback) {
      var type = _ref.type,
          data = _ref.data;

      if (withNativeBlob$1 && data instanceof Blob) {
        if (supportsBinary) {
          return callback(data);
        } else {
          return encodeBlobAsBase64(data, callback);
        }
      } else if (withNativeArrayBuffer$2 && (data instanceof ArrayBuffer || isView$1(data))) {
        if (supportsBinary) {
          return callback(data);
        } else {
          return encodeBlobAsBase64(new Blob([data]), callback);
        }
      } // plain string


      return callback(PACKET_TYPES[type] + (data || ""));
    };

    var encodeBlobAsBase64 = function encodeBlobAsBase64(data, callback) {
      var fileReader = new FileReader();

      fileReader.onload = function () {
        var content = fileReader.result.split(",")[1];
        callback("b" + content);
      };

      return fileReader.readAsDataURL(data);
    };

    /*
     * base64-arraybuffer 1.0.1 <https://github.com/niklasvh/base64-arraybuffer>
     * Copyright (c) 2021 Niklas von Hertzen <https://hertzen.com>
     * Released under MIT License
     */
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'; // Use a lookup table to find the index.

    var lookup$1 = typeof Uint8Array === 'undefined' ? [] : new Uint8Array(256);

    for (var i$1 = 0; i$1 < chars.length; i$1++) {
      lookup$1[chars.charCodeAt(i$1)] = i$1;
    }

    var decode$1 = function decode(base64) {
      var bufferLength = base64.length * 0.75,
          len = base64.length,
          i,
          p = 0,
          encoded1,
          encoded2,
          encoded3,
          encoded4;

      if (base64[base64.length - 1] === '=') {
        bufferLength--;

        if (base64[base64.length - 2] === '=') {
          bufferLength--;
        }
      }

      var arraybuffer = new ArrayBuffer(bufferLength),
          bytes = new Uint8Array(arraybuffer);

      for (i = 0; i < len; i += 4) {
        encoded1 = lookup$1[base64.charCodeAt(i)];
        encoded2 = lookup$1[base64.charCodeAt(i + 1)];
        encoded3 = lookup$1[base64.charCodeAt(i + 2)];
        encoded4 = lookup$1[base64.charCodeAt(i + 3)];
        bytes[p++] = encoded1 << 2 | encoded2 >> 4;
        bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
        bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
      }

      return arraybuffer;
    };

    var withNativeArrayBuffer$1 = typeof ArrayBuffer === "function";

    var decodePacket = function decodePacket(encodedPacket, binaryType) {
      if (typeof encodedPacket !== "string") {
        return {
          type: "message",
          data: mapBinary(encodedPacket, binaryType)
        };
      }

      var type = encodedPacket.charAt(0);

      if (type === "b") {
        return {
          type: "message",
          data: decodeBase64Packet(encodedPacket.substring(1), binaryType)
        };
      }

      var packetType = PACKET_TYPES_REVERSE[type];

      if (!packetType) {
        return ERROR_PACKET;
      }

      return encodedPacket.length > 1 ? {
        type: PACKET_TYPES_REVERSE[type],
        data: encodedPacket.substring(1)
      } : {
        type: PACKET_TYPES_REVERSE[type]
      };
    };

    var decodeBase64Packet = function decodeBase64Packet(data, binaryType) {
      if (withNativeArrayBuffer$1) {
        var decoded = decode$1(data);
        return mapBinary(decoded, binaryType);
      } else {
        return {
          base64: true,
          data: data
        }; // fallback for old browsers
      }
    };

    var mapBinary = function mapBinary(data, binaryType) {
      switch (binaryType) {
        case "blob":
          return data instanceof ArrayBuffer ? new Blob([data]) : data;

        case "arraybuffer":
        default:
          return data;
        // assuming the data is already an ArrayBuffer
      }
    };

    var SEPARATOR = String.fromCharCode(30); // see https://en.wikipedia.org/wiki/Delimiter#ASCII_delimited_text

    var encodePayload = function encodePayload(packets, callback) {
      // some packets may be added to the array while encoding, so the initial length must be saved
      var length = packets.length;
      var encodedPackets = new Array(length);
      var count = 0;
      packets.forEach(function (packet, i) {
        // force base64 encoding for binary packets
        encodePacket(packet, false, function (encodedPacket) {
          encodedPackets[i] = encodedPacket;

          if (++count === length) {
            callback(encodedPackets.join(SEPARATOR));
          }
        });
      });
    };

    var decodePayload = function decodePayload(encodedPayload, binaryType) {
      var encodedPackets = encodedPayload.split(SEPARATOR);
      var packets = [];

      for (var i = 0; i < encodedPackets.length; i++) {
        var decodedPacket = decodePacket(encodedPackets[i], binaryType);
        packets.push(decodedPacket);

        if (decodedPacket.type === "error") {
          break;
        }
      }

      return packets;
    };

    var protocol$1 = 4;

    var Transport = /*#__PURE__*/function (_Emitter) {
      _inherits(Transport, _Emitter);

      var _super = _createSuper(Transport);

      /**
       * Transport abstract constructor.
       *
       * @param {Object} options.
       * @api private
       */
      function Transport(opts) {
        var _this;

        _classCallCheck(this, Transport);

        _this = _super.call(this);
        _this.writable = false;
        installTimerFunctions(_assertThisInitialized(_this), opts);
        _this.opts = opts;
        _this.query = opts.query;
        _this.readyState = "";
        _this.socket = opts.socket;
        return _this;
      }
      /**
       * Emits an error.
       *
       * @param {String} str
       * @return {Transport} for chaining
       * @api protected
       */


      _createClass(Transport, [{
        key: "onError",
        value: function onError(msg, desc) {
          var err = new Error(msg); // @ts-ignore

          err.type = "TransportError"; // @ts-ignore

          err.description = desc;

          _get(_getPrototypeOf(Transport.prototype), "emit", this).call(this, "error", err);

          return this;
        }
        /**
         * Opens the transport.
         *
         * @api public
         */

      }, {
        key: "open",
        value: function open() {
          if ("closed" === this.readyState || "" === this.readyState) {
            this.readyState = "opening";
            this.doOpen();
          }

          return this;
        }
        /**
         * Closes the transport.
         *
         * @api public
         */

      }, {
        key: "close",
        value: function close() {
          if ("opening" === this.readyState || "open" === this.readyState) {
            this.doClose();
            this.onClose();
          }

          return this;
        }
        /**
         * Sends multiple packets.
         *
         * @param {Array} packets
         * @api public
         */

      }, {
        key: "send",
        value: function send(packets) {
          if ("open" === this.readyState) {
            this.write(packets);
          }
        }
        /**
         * Called upon open
         *
         * @api protected
         */

      }, {
        key: "onOpen",
        value: function onOpen() {
          this.readyState = "open";
          this.writable = true;

          _get(_getPrototypeOf(Transport.prototype), "emit", this).call(this, "open");
        }
        /**
         * Called with data.
         *
         * @param {String} data
         * @api protected
         */

      }, {
        key: "onData",
        value: function onData(data) {
          var packet = decodePacket(data, this.socket.binaryType);
          this.onPacket(packet);
        }
        /**
         * Called with a decoded packet.
         *
         * @api protected
         */

      }, {
        key: "onPacket",
        value: function onPacket(packet) {
          _get(_getPrototypeOf(Transport.prototype), "emit", this).call(this, "packet", packet);
        }
        /**
         * Called upon close.
         *
         * @api protected
         */

      }, {
        key: "onClose",
        value: function onClose() {
          this.readyState = "closed";

          _get(_getPrototypeOf(Transport.prototype), "emit", this).call(this, "close");
        }
      }]);

      return Transport;
    }(Emitter_1);

    var alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'.split(''),
        length = 64,
        map = {},
        seed = 0,
        i = 0,
        prev;
    /**
     * Return a string representing the specified number.
     *
     * @param {Number} num The number to convert.
     * @returns {String} The string representation of the number.
     * @api public
     */

    function encode(num) {
      var encoded = '';

      do {
        encoded = alphabet[num % length] + encoded;
        num = Math.floor(num / length);
      } while (num > 0);

      return encoded;
    }
    /**
     * Return the integer value specified by the given string.
     *
     * @param {String} str The string to convert.
     * @returns {Number} The integer value represented by the string.
     * @api public
     */


    function decode(str) {
      var decoded = 0;

      for (i = 0; i < str.length; i++) {
        decoded = decoded * length + map[str.charAt(i)];
      }

      return decoded;
    }
    /**
     * Yeast: A tiny growing id generator.
     *
     * @returns {String} A unique id.
     * @api public
     */


    function yeast() {
      var now = encode(+new Date());
      if (now !== prev) return seed = 0, prev = now;
      return now + '.' + encode(seed++);
    } //
    // Map each character to its index.
    //


    for (; i < length; i++) {
      map[alphabet[i]] = i;
    } //
    // Expose the `yeast`, `encode` and `decode` functions.
    //


    yeast.encode = encode;
    yeast.decode = decode;
    var yeast_1 = yeast;

    var parseqs = {};

    /**
     * Compiles a querystring
     * Returns string representation of the object
     *
     * @param {Object}
     * @api private
     */

    parseqs.encode = function (obj) {
      var str = '';

      for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
          if (str.length) str += '&';
          str += encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]);
        }
      }

      return str;
    };
    /**
     * Parses a simple querystring into an object
     *
     * @param {String} qs
     * @api private
     */


    parseqs.decode = function (qs) {
      var qry = {};
      var pairs = qs.split('&');

      for (var i = 0, l = pairs.length; i < l; i++) {
        var pair = pairs[i].split('=');
        qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
      }

      return qry;
    };

    var Polling = /*#__PURE__*/function (_Transport) {
      _inherits(Polling, _Transport);

      var _super = _createSuper(Polling);

      function Polling() {
        var _this;

        _classCallCheck(this, Polling);

        _this = _super.apply(this, arguments);
        _this.polling = false;
        return _this;
      }
      /**
       * Transport name.
       */


      _createClass(Polling, [{
        key: "name",
        get: function get() {
          return "polling";
        }
        /**
         * Opens the socket (triggers polling). We write a PING message to determine
         * when the transport is open.
         *
         * @api private
         */

      }, {
        key: "doOpen",
        value: function doOpen() {
          this.poll();
        }
        /**
         * Pauses polling.
         *
         * @param {Function} callback upon buffers are flushed and transport is paused
         * @api private
         */

      }, {
        key: "pause",
        value: function pause(onPause) {
          var _this2 = this;

          this.readyState = "pausing";

          var pause = function pause() {
            _this2.readyState = "paused";
            onPause();
          };

          if (this.polling || !this.writable) {
            var total = 0;

            if (this.polling) {
              total++;
              this.once("pollComplete", function () {
                --total || pause();
              });
            }

            if (!this.writable) {
              total++;
              this.once("drain", function () {
                --total || pause();
              });
            }
          } else {
            pause();
          }
        }
        /**
         * Starts polling cycle.
         *
         * @api public
         */

      }, {
        key: "poll",
        value: function poll() {
          this.polling = true;
          this.doPoll();
          this.emit("poll");
        }
        /**
         * Overloads onData to detect payloads.
         *
         * @api private
         */

      }, {
        key: "onData",
        value: function onData(data) {
          var _this3 = this;

          var callback = function callback(packet) {
            // if its the first message we consider the transport open
            if ("opening" === _this3.readyState && packet.type === "open") {
              _this3.onOpen();
            } // if its a close packet, we close the ongoing requests


            if ("close" === packet.type) {
              _this3.onClose();

              return false;
            } // otherwise bypass onData and handle the message


            _this3.onPacket(packet);
          }; // decode payload


          decodePayload(data, this.socket.binaryType).forEach(callback); // if an event did not trigger closing

          if ("closed" !== this.readyState) {
            // if we got data we're not polling
            this.polling = false;
            this.emit("pollComplete");

            if ("open" === this.readyState) {
              this.poll();
            }
          }
        }
        /**
         * For polling, send a close packet.
         *
         * @api private
         */

      }, {
        key: "doClose",
        value: function doClose() {
          var _this4 = this;

          var close = function close() {
            _this4.write([{
              type: "close"
            }]);
          };

          if ("open" === this.readyState) {
            close();
          } else {
            // in case we're trying to close while
            // handshaking is in progress (GH-164)
            this.once("open", close);
          }
        }
        /**
         * Writes a packets payload.
         *
         * @param {Array} data packets
         * @param {Function} drain callback
         * @api private
         */

      }, {
        key: "write",
        value: function write(packets) {
          var _this5 = this;

          this.writable = false;
          encodePayload(packets, function (data) {
            _this5.doWrite(data, function () {
              _this5.writable = true;

              _this5.emit("drain");
            });
          });
        }
        /**
         * Generates uri for connection.
         *
         * @api private
         */

      }, {
        key: "uri",
        value: function uri() {
          var query = this.query || {};
          var schema = this.opts.secure ? "https" : "http";
          var port = ""; // cache busting is forced

          if (false !== this.opts.timestampRequests) {
            query[this.opts.timestampParam] = yeast_1();
          }

          if (!this.supportsBinary && !query.sid) {
            query.b64 = 1;
          } // avoid port if default for schema


          if (this.opts.port && ("https" === schema && Number(this.opts.port) !== 443 || "http" === schema && Number(this.opts.port) !== 80)) {
            port = ":" + this.opts.port;
          }

          var encodedQuery = parseqs.encode(query);
          var ipv6 = this.opts.hostname.indexOf(":") !== -1;
          return schema + "://" + (ipv6 ? "[" + this.opts.hostname + "]" : this.opts.hostname) + port + this.opts.path + (encodedQuery.length ? "?" + encodedQuery : "");
        }
      }]);

      return Polling;
    }(Transport);

    /**
     * Empty function
     */

    function empty() {}

    var hasXHR2 = function () {
      var xhr = new XMLHttpRequest$1({
        xdomain: false
      });
      return null != xhr.responseType;
    }();

    var XHR = /*#__PURE__*/function (_Polling) {
      _inherits(XHR, _Polling);

      var _super = _createSuper(XHR);

      /**
       * XHR Polling constructor.
       *
       * @param {Object} opts
       * @api public
       */
      function XHR(opts) {
        var _this;

        _classCallCheck(this, XHR);

        _this = _super.call(this, opts);

        if (typeof location !== "undefined") {
          var isSSL = "https:" === location.protocol;
          var port = location.port; // some user agents have empty `location.port`

          if (!port) {
            port = isSSL ? "443" : "80";
          }

          _this.xd = typeof location !== "undefined" && opts.hostname !== location.hostname || port !== opts.port;
          _this.xs = opts.secure !== isSSL;
        }
        /**
         * XHR supports binary
         */


        var forceBase64 = opts && opts.forceBase64;
        _this.supportsBinary = hasXHR2 && !forceBase64;
        return _this;
      }
      /**
       * Creates a request.
       *
       * @param {String} method
       * @api private
       */


      _createClass(XHR, [{
        key: "request",
        value: function request() {
          var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

          _extends(opts, {
            xd: this.xd,
            xs: this.xs
          }, this.opts);

          return new Request(this.uri(), opts);
        }
        /**
         * Sends data.
         *
         * @param {String} data to send.
         * @param {Function} called upon flush.
         * @api private
         */

      }, {
        key: "doWrite",
        value: function doWrite(data, fn) {
          var _this2 = this;

          var req = this.request({
            method: "POST",
            data: data
          });
          req.on("success", fn);
          req.on("error", function (err) {
            _this2.onError("xhr post error", err);
          });
        }
        /**
         * Starts a poll cycle.
         *
         * @api private
         */

      }, {
        key: "doPoll",
        value: function doPoll() {
          var _this3 = this;

          var req = this.request();
          req.on("data", this.onData.bind(this));
          req.on("error", function (err) {
            _this3.onError("xhr poll error", err);
          });
          this.pollXhr = req;
        }
      }]);

      return XHR;
    }(Polling);
    var Request = /*#__PURE__*/function (_Emitter) {
      _inherits(Request, _Emitter);

      var _super2 = _createSuper(Request);

      /**
       * Request constructor
       *
       * @param {Object} options
       * @api public
       */
      function Request(uri, opts) {
        var _this4;

        _classCallCheck(this, Request);

        _this4 = _super2.call(this);
        installTimerFunctions(_assertThisInitialized(_this4), opts);
        _this4.opts = opts;
        _this4.method = opts.method || "GET";
        _this4.uri = uri;
        _this4.async = false !== opts.async;
        _this4.data = undefined !== opts.data ? opts.data : null;

        _this4.create();

        return _this4;
      }
      /**
       * Creates the XHR object and sends the request.
       *
       * @api private
       */


      _createClass(Request, [{
        key: "create",
        value: function create() {
          var _this5 = this;

          var opts = pick(this.opts, "agent", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "autoUnref");
          opts.xdomain = !!this.opts.xd;
          opts.xscheme = !!this.opts.xs;
          var xhr = this.xhr = new XMLHttpRequest$1(opts);

          try {
            xhr.open(this.method, this.uri, this.async);

            try {
              if (this.opts.extraHeaders) {
                xhr.setDisableHeaderCheck && xhr.setDisableHeaderCheck(true);

                for (var i in this.opts.extraHeaders) {
                  if (this.opts.extraHeaders.hasOwnProperty(i)) {
                    xhr.setRequestHeader(i, this.opts.extraHeaders[i]);
                  }
                }
              }
            } catch (e) {}

            if ("POST" === this.method) {
              try {
                xhr.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
              } catch (e) {}
            }

            try {
              xhr.setRequestHeader("Accept", "*/*");
            } catch (e) {} // ie6 check


            if ("withCredentials" in xhr) {
              xhr.withCredentials = this.opts.withCredentials;
            }

            if (this.opts.requestTimeout) {
              xhr.timeout = this.opts.requestTimeout;
            }

            xhr.onreadystatechange = function () {
              if (4 !== xhr.readyState) return;

              if (200 === xhr.status || 1223 === xhr.status) {
                _this5.onLoad();
              } else {
                // make sure the `error` event handler that's user-set
                // does not throw in the same tick and gets caught here
                _this5.setTimeoutFn(function () {
                  _this5.onError(typeof xhr.status === "number" ? xhr.status : 0);
                }, 0);
              }
            };

            xhr.send(this.data);
          } catch (e) {
            // Need to defer since .create() is called directly from the constructor
            // and thus the 'error' event can only be only bound *after* this exception
            // occurs.  Therefore, also, we cannot throw here at all.
            this.setTimeoutFn(function () {
              _this5.onError(e);
            }, 0);
            return;
          }

          if (typeof document !== "undefined") {
            this.index = Request.requestsCount++;
            Request.requests[this.index] = this;
          }
        }
        /**
         * Called upon successful response.
         *
         * @api private
         */

      }, {
        key: "onSuccess",
        value: function onSuccess() {
          this.emit("success");
          this.cleanup();
        }
        /**
         * Called if we have data.
         *
         * @api private
         */

      }, {
        key: "onData",
        value: function onData(data) {
          this.emit("data", data);
          this.onSuccess();
        }
        /**
         * Called upon error.
         *
         * @api private
         */

      }, {
        key: "onError",
        value: function onError(err) {
          this.emit("error", err);
          this.cleanup(true);
        }
        /**
         * Cleans up house.
         *
         * @api private
         */

      }, {
        key: "cleanup",
        value: function cleanup(fromError) {
          if ("undefined" === typeof this.xhr || null === this.xhr) {
            return;
          }

          this.xhr.onreadystatechange = empty;

          if (fromError) {
            try {
              this.xhr.abort();
            } catch (e) {}
          }

          if (typeof document !== "undefined") {
            delete Request.requests[this.index];
          }

          this.xhr = null;
        }
        /**
         * Called upon load.
         *
         * @api private
         */

      }, {
        key: "onLoad",
        value: function onLoad() {
          var data = this.xhr.responseText;

          if (data !== null) {
            this.onData(data);
          }
        }
        /**
         * Aborts the request.
         *
         * @api public
         */

      }, {
        key: "abort",
        value: function abort() {
          this.cleanup();
        }
      }]);

      return Request;
    }(Emitter_1);
    Request.requestsCount = 0;
    Request.requests = {};
    /**
     * Aborts pending requests when unloading the window. This is needed to prevent
     * memory leaks (e.g. when using IE) and to ensure that no spurious error is
     * emitted.
     */

    if (typeof document !== "undefined") {
      // @ts-ignore
      if (typeof attachEvent === "function") {
        // @ts-ignore
        attachEvent("onunload", unloadHandler);
      } else if (typeof addEventListener === "function") {
        var terminationEvent = "onpagehide" in globalThis ? "pagehide" : "unload";
        addEventListener(terminationEvent, unloadHandler, false);
      }
    }

    function unloadHandler() {
      for (var i in Request.requests) {
        if (Request.requests.hasOwnProperty(i)) {
          Request.requests[i].abort();
        }
      }
    }

    var nextTick = function () {
      var isPromiseAvailable = typeof Promise === "function" && typeof Promise.resolve === "function";

      if (isPromiseAvailable) {
        return function (cb) {
          return Promise.resolve().then(cb);
        };
      } else {
        return function (cb, setTimeoutFn) {
          return setTimeoutFn(cb, 0);
        };
      }
    }();
    var WebSocket = globalThis.WebSocket || globalThis.MozWebSocket;
    var usingBrowserWebSocket = true;
    var defaultBinaryType = "arraybuffer";

    var isReactNative = typeof navigator !== "undefined" && typeof navigator.product === "string" && navigator.product.toLowerCase() === "reactnative";
    var WS = /*#__PURE__*/function (_Transport) {
      _inherits(WS, _Transport);

      var _super = _createSuper(WS);

      /**
       * WebSocket transport constructor.
       *
       * @api {Object} connection options
       * @api public
       */
      function WS(opts) {
        var _this;

        _classCallCheck(this, WS);

        _this = _super.call(this, opts);
        _this.supportsBinary = !opts.forceBase64;
        return _this;
      }
      /**
       * Transport name.
       *
       * @api public
       */


      _createClass(WS, [{
        key: "name",
        get: function get() {
          return "websocket";
        }
        /**
         * Opens socket.
         *
         * @api private
         */

      }, {
        key: "doOpen",
        value: function doOpen() {
          if (!this.check()) {
            // let probe timeout
            return;
          }

          var uri = this.uri();
          var protocols = this.opts.protocols; // React Native only supports the 'headers' option, and will print a warning if anything else is passed

          var opts = isReactNative ? {} : pick(this.opts, "agent", "perMessageDeflate", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "localAddress", "protocolVersion", "origin", "maxPayload", "family", "checkServerIdentity");

          if (this.opts.extraHeaders) {
            opts.headers = this.opts.extraHeaders;
          }

          try {
            this.ws = usingBrowserWebSocket && !isReactNative ? protocols ? new WebSocket(uri, protocols) : new WebSocket(uri) : new WebSocket(uri, protocols, opts);
          } catch (err) {
            return this.emit("error", err);
          }

          this.ws.binaryType = this.socket.binaryType || defaultBinaryType;
          this.addEventListeners();
        }
        /**
         * Adds event listeners to the socket
         *
         * @api private
         */

      }, {
        key: "addEventListeners",
        value: function addEventListeners() {
          var _this2 = this;

          this.ws.onopen = function () {
            if (_this2.opts.autoUnref) {
              _this2.ws._socket.unref();
            }

            _this2.onOpen();
          };

          this.ws.onclose = this.onClose.bind(this);

          this.ws.onmessage = function (ev) {
            return _this2.onData(ev.data);
          };

          this.ws.onerror = function (e) {
            return _this2.onError("websocket error", e);
          };
        }
        /**
         * Writes data to socket.
         *
         * @param {Array} array of packets.
         * @api private
         */

      }, {
        key: "write",
        value: function write(packets) {
          var _this3 = this;

          this.writable = false; // encodePacket efficient as it uses WS framing
          // no need for encodePayload

          var _loop = function _loop(i) {
            var packet = packets[i];
            var lastPacket = i === packets.length - 1;
            encodePacket(packet, _this3.supportsBinary, function (data) {
              // have a chance of informing us about it yet, in that case send will
              // throw an error


              try {
                if (usingBrowserWebSocket) {
                  // TypeError is thrown when passing the second argument on Safari
                  _this3.ws.send(data);
                }
              } catch (e) {}

              if (lastPacket) {
                // fake drain
                // defer to next tick to allow Socket to clear writeBuffer
                nextTick(function () {
                  _this3.writable = true;

                  _this3.emit("drain");
                }, _this3.setTimeoutFn);
              }
            });
          };

          for (var i = 0; i < packets.length; i++) {
            _loop(i);
          }
        }
        /**
         * Closes socket.
         *
         * @api private
         */

      }, {
        key: "doClose",
        value: function doClose() {
          if (typeof this.ws !== "undefined") {
            this.ws.close();
            this.ws = null;
          }
        }
        /**
         * Generates uri for connection.
         *
         * @api private
         */

      }, {
        key: "uri",
        value: function uri() {
          var query = this.query || {};
          var schema = this.opts.secure ? "wss" : "ws";
          var port = ""; // avoid port if default for schema

          if (this.opts.port && ("wss" === schema && Number(this.opts.port) !== 443 || "ws" === schema && Number(this.opts.port) !== 80)) {
            port = ":" + this.opts.port;
          } // append timestamp to URI


          if (this.opts.timestampRequests) {
            query[this.opts.timestampParam] = yeast_1();
          } // communicate binary support capabilities


          if (!this.supportsBinary) {
            query.b64 = 1;
          }

          var encodedQuery = parseqs.encode(query);
          var ipv6 = this.opts.hostname.indexOf(":") !== -1;
          return schema + "://" + (ipv6 ? "[" + this.opts.hostname + "]" : this.opts.hostname) + port + this.opts.path + (encodedQuery.length ? "?" + encodedQuery : "");
        }
        /**
         * Feature detection for WebSocket.
         *
         * @return {Boolean} whether this transport is available.
         * @api public
         */

      }, {
        key: "check",
        value: function check() {
          return !!WebSocket && !("__initialize" in WebSocket && this.name === WS.prototype.name);
        }
      }]);

      return WS;
    }(Transport);

    var transports = {
      websocket: WS,
      polling: XHR
    };

    var Socket$1 = /*#__PURE__*/function (_Emitter) {
      _inherits(Socket, _Emitter);

      var _super = _createSuper(Socket);

      /**
       * Socket constructor.
       *
       * @param {String|Object} uri or options
       * @param {Object} opts - options
       * @api public
       */
      function Socket(uri) {
        var _this;

        var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        _classCallCheck(this, Socket);

        _this = _super.call(this);

        if (uri && "object" === _typeof(uri)) {
          opts = uri;
          uri = null;
        }

        if (uri) {
          uri = parseuri(uri);
          opts.hostname = uri.host;
          opts.secure = uri.protocol === "https" || uri.protocol === "wss";
          opts.port = uri.port;
          if (uri.query) opts.query = uri.query;
        } else if (opts.host) {
          opts.hostname = parseuri(opts.host).host;
        }

        installTimerFunctions(_assertThisInitialized(_this), opts);
        _this.secure = null != opts.secure ? opts.secure : typeof location !== "undefined" && "https:" === location.protocol;

        if (opts.hostname && !opts.port) {
          // if no port is specified manually, use the protocol default
          opts.port = _this.secure ? "443" : "80";
        }

        _this.hostname = opts.hostname || (typeof location !== "undefined" ? location.hostname : "localhost");
        _this.port = opts.port || (typeof location !== "undefined" && location.port ? location.port : _this.secure ? "443" : "80");
        _this.transports = opts.transports || ["polling", "websocket"];
        _this.readyState = "";
        _this.writeBuffer = [];
        _this.prevBufferLen = 0;
        _this.opts = _extends({
          path: "/engine.io",
          agent: false,
          withCredentials: false,
          upgrade: true,
          timestampParam: "t",
          rememberUpgrade: false,
          rejectUnauthorized: true,
          perMessageDeflate: {
            threshold: 1024
          },
          transportOptions: {},
          closeOnBeforeunload: true
        }, opts);
        _this.opts.path = _this.opts.path.replace(/\/$/, "") + "/";

        if (typeof _this.opts.query === "string") {
          _this.opts.query = parseqs.decode(_this.opts.query);
        } // set on handshake


        _this.id = null;
        _this.upgrades = null;
        _this.pingInterval = null;
        _this.pingTimeout = null; // set on heartbeat

        _this.pingTimeoutTimer = null;

        if (typeof addEventListener === "function") {
          if (_this.opts.closeOnBeforeunload) {
            // Firefox closes the connection when the "beforeunload" event is emitted but not Chrome. This event listener
            // ensures every browser behaves the same (no "disconnect" event at the Socket.IO level when the page is
            // closed/reloaded)
            addEventListener("beforeunload", function () {
              if (_this.transport) {
                // silently close the transport
                _this.transport.removeAllListeners();

                _this.transport.close();
              }
            }, false);
          }

          if (_this.hostname !== "localhost") {
            _this.offlineEventListener = function () {
              _this.onClose("transport close");
            };

            addEventListener("offline", _this.offlineEventListener, false);
          }
        }

        _this.open();

        return _this;
      }
      /**
       * Creates transport of the given type.
       *
       * @param {String} transport name
       * @return {Transport}
       * @api private
       */


      _createClass(Socket, [{
        key: "createTransport",
        value: function createTransport(name) {
          var query = clone(this.opts.query); // append engine.io protocol identifier

          query.EIO = protocol$1; // transport name

          query.transport = name; // session id if we already have one

          if (this.id) query.sid = this.id;

          var opts = _extends({}, this.opts.transportOptions[name], this.opts, {
            query: query,
            socket: this,
            hostname: this.hostname,
            secure: this.secure,
            port: this.port
          });

          return new transports[name](opts);
        }
        /**
         * Initializes transport to use and starts probe.
         *
         * @api private
         */

      }, {
        key: "open",
        value: function open() {
          var _this2 = this;

          var transport;

          if (this.opts.rememberUpgrade && Socket.priorWebsocketSuccess && this.transports.indexOf("websocket") !== -1) {
            transport = "websocket";
          } else if (0 === this.transports.length) {
            // Emit error on next tick so it can be listened to
            this.setTimeoutFn(function () {
              _this2.emitReserved("error", "No transports available");
            }, 0);
            return;
          } else {
            transport = this.transports[0];
          }

          this.readyState = "opening"; // Retry with the next transport if the transport is disabled (jsonp: false)

          try {
            transport = this.createTransport(transport);
          } catch (e) {
            this.transports.shift();
            this.open();
            return;
          }

          transport.open();
          this.setTransport(transport);
        }
        /**
         * Sets the current transport. Disables the existing one (if any).
         *
         * @api private
         */

      }, {
        key: "setTransport",
        value: function setTransport(transport) {
          var _this3 = this;

          if (this.transport) {
            this.transport.removeAllListeners();
          } // set up transport


          this.transport = transport; // set up transport listeners

          transport.on("drain", this.onDrain.bind(this)).on("packet", this.onPacket.bind(this)).on("error", this.onError.bind(this)).on("close", function () {
            _this3.onClose("transport close");
          });
        }
        /**
         * Probes a transport.
         *
         * @param {String} transport name
         * @api private
         */

      }, {
        key: "probe",
        value: function probe(name) {
          var _this4 = this;

          var transport = this.createTransport(name);
          var failed = false;
          Socket.priorWebsocketSuccess = false;

          var onTransportOpen = function onTransportOpen() {
            if (failed) return;
            transport.send([{
              type: "ping",
              data: "probe"
            }]);
            transport.once("packet", function (msg) {
              if (failed) return;

              if ("pong" === msg.type && "probe" === msg.data) {
                _this4.upgrading = true;

                _this4.emitReserved("upgrading", transport);

                if (!transport) return;
                Socket.priorWebsocketSuccess = "websocket" === transport.name;

                _this4.transport.pause(function () {
                  if (failed) return;
                  if ("closed" === _this4.readyState) return;
                  cleanup();

                  _this4.setTransport(transport);

                  transport.send([{
                    type: "upgrade"
                  }]);

                  _this4.emitReserved("upgrade", transport);

                  transport = null;
                  _this4.upgrading = false;

                  _this4.flush();
                });
              } else {
                var err = new Error("probe error"); // @ts-ignore

                err.transport = transport.name;

                _this4.emitReserved("upgradeError", err);
              }
            });
          };

          function freezeTransport() {
            if (failed) return; // Any callback called by transport should be ignored since now

            failed = true;
            cleanup();
            transport.close();
            transport = null;
          } // Handle any error that happens while probing


          var onerror = function onerror(err) {
            var error = new Error("probe error: " + err); // @ts-ignore

            error.transport = transport.name;
            freezeTransport();

            _this4.emitReserved("upgradeError", error);
          };

          function onTransportClose() {
            onerror("transport closed");
          } // When the socket is closed while we're probing


          function onclose() {
            onerror("socket closed");
          } // When the socket is upgraded while we're probing


          function onupgrade(to) {
            if (transport && to.name !== transport.name) {
              freezeTransport();
            }
          } // Remove all listeners on the transport and on self


          var cleanup = function cleanup() {
            transport.removeListener("open", onTransportOpen);
            transport.removeListener("error", onerror);
            transport.removeListener("close", onTransportClose);

            _this4.off("close", onclose);

            _this4.off("upgrading", onupgrade);
          };

          transport.once("open", onTransportOpen);
          transport.once("error", onerror);
          transport.once("close", onTransportClose);
          this.once("close", onclose);
          this.once("upgrading", onupgrade);
          transport.open();
        }
        /**
         * Called when connection is deemed open.
         *
         * @api private
         */

      }, {
        key: "onOpen",
        value: function onOpen() {
          this.readyState = "open";
          Socket.priorWebsocketSuccess = "websocket" === this.transport.name;
          this.emitReserved("open");
          this.flush(); // we check for `readyState` in case an `open`
          // listener already closed the socket

          if ("open" === this.readyState && this.opts.upgrade && this.transport.pause) {
            var i = 0;
            var l = this.upgrades.length;

            for (; i < l; i++) {
              this.probe(this.upgrades[i]);
            }
          }
        }
        /**
         * Handles a packet.
         *
         * @api private
         */

      }, {
        key: "onPacket",
        value: function onPacket(packet) {
          if ("opening" === this.readyState || "open" === this.readyState || "closing" === this.readyState) {
            this.emitReserved("packet", packet); // Socket is live - any packet counts

            this.emitReserved("heartbeat");

            switch (packet.type) {
              case "open":
                this.onHandshake(JSON.parse(packet.data));
                break;

              case "ping":
                this.resetPingTimeout();
                this.sendPacket("pong");
                this.emitReserved("ping");
                this.emitReserved("pong");
                break;

              case "error":
                var err = new Error("server error"); // @ts-ignore

                err.code = packet.data;
                this.onError(err);
                break;

              case "message":
                this.emitReserved("data", packet.data);
                this.emitReserved("message", packet.data);
                break;
            }
          }
        }
        /**
         * Called upon handshake completion.
         *
         * @param {Object} data - handshake obj
         * @api private
         */

      }, {
        key: "onHandshake",
        value: function onHandshake(data) {
          this.emitReserved("handshake", data);
          this.id = data.sid;
          this.transport.query.sid = data.sid;
          this.upgrades = this.filterUpgrades(data.upgrades);
          this.pingInterval = data.pingInterval;
          this.pingTimeout = data.pingTimeout;
          this.onOpen(); // In case open handler closes socket

          if ("closed" === this.readyState) return;
          this.resetPingTimeout();
        }
        /**
         * Sets and resets ping timeout timer based on server pings.
         *
         * @api private
         */

      }, {
        key: "resetPingTimeout",
        value: function resetPingTimeout() {
          var _this5 = this;

          this.clearTimeoutFn(this.pingTimeoutTimer);
          this.pingTimeoutTimer = this.setTimeoutFn(function () {
            _this5.onClose("ping timeout");
          }, this.pingInterval + this.pingTimeout);

          if (this.opts.autoUnref) {
            this.pingTimeoutTimer.unref();
          }
        }
        /**
         * Called on `drain` event
         *
         * @api private
         */

      }, {
        key: "onDrain",
        value: function onDrain() {
          this.writeBuffer.splice(0, this.prevBufferLen); // setting prevBufferLen = 0 is very important
          // for example, when upgrading, upgrade packet is sent over,
          // and a nonzero prevBufferLen could cause problems on `drain`

          this.prevBufferLen = 0;

          if (0 === this.writeBuffer.length) {
            this.emitReserved("drain");
          } else {
            this.flush();
          }
        }
        /**
         * Flush write buffers.
         *
         * @api private
         */

      }, {
        key: "flush",
        value: function flush() {
          if ("closed" !== this.readyState && this.transport.writable && !this.upgrading && this.writeBuffer.length) {
            this.transport.send(this.writeBuffer); // keep track of current length of writeBuffer
            // splice writeBuffer and callbackBuffer on `drain`

            this.prevBufferLen = this.writeBuffer.length;
            this.emitReserved("flush");
          }
        }
        /**
         * Sends a message.
         *
         * @param {String} message.
         * @param {Function} callback function.
         * @param {Object} options.
         * @return {Socket} for chaining.
         * @api public
         */

      }, {
        key: "write",
        value: function write(msg, options, fn) {
          this.sendPacket("message", msg, options, fn);
          return this;
        }
      }, {
        key: "send",
        value: function send(msg, options, fn) {
          this.sendPacket("message", msg, options, fn);
          return this;
        }
        /**
         * Sends a packet.
         *
         * @param {String} packet type.
         * @param {String} data.
         * @param {Object} options.
         * @param {Function} callback function.
         * @api private
         */

      }, {
        key: "sendPacket",
        value: function sendPacket(type, data, options, fn) {
          if ("function" === typeof data) {
            fn = data;
            data = undefined;
          }

          if ("function" === typeof options) {
            fn = options;
            options = null;
          }

          if ("closing" === this.readyState || "closed" === this.readyState) {
            return;
          }

          options = options || {};
          options.compress = false !== options.compress;
          var packet = {
            type: type,
            data: data,
            options: options
          };
          this.emitReserved("packetCreate", packet);
          this.writeBuffer.push(packet);
          if (fn) this.once("flush", fn);
          this.flush();
        }
        /**
         * Closes the connection.
         *
         * @api public
         */

      }, {
        key: "close",
        value: function close() {
          var _this6 = this;

          var close = function close() {
            _this6.onClose("forced close");

            _this6.transport.close();
          };

          var cleanupAndClose = function cleanupAndClose() {
            _this6.off("upgrade", cleanupAndClose);

            _this6.off("upgradeError", cleanupAndClose);

            close();
          };

          var waitForUpgrade = function waitForUpgrade() {
            // wait for upgrade to finish since we can't send packets while pausing a transport
            _this6.once("upgrade", cleanupAndClose);

            _this6.once("upgradeError", cleanupAndClose);
          };

          if ("opening" === this.readyState || "open" === this.readyState) {
            this.readyState = "closing";

            if (this.writeBuffer.length) {
              this.once("drain", function () {
                if (_this6.upgrading) {
                  waitForUpgrade();
                } else {
                  close();
                }
              });
            } else if (this.upgrading) {
              waitForUpgrade();
            } else {
              close();
            }
          }

          return this;
        }
        /**
         * Called upon transport error
         *
         * @api private
         */

      }, {
        key: "onError",
        value: function onError(err) {
          Socket.priorWebsocketSuccess = false;
          this.emitReserved("error", err);
          this.onClose("transport error", err);
        }
        /**
         * Called upon transport close.
         *
         * @api private
         */

      }, {
        key: "onClose",
        value: function onClose(reason, desc) {
          if ("opening" === this.readyState || "open" === this.readyState || "closing" === this.readyState) {
            // clear timers
            this.clearTimeoutFn(this.pingTimeoutTimer); // stop event from firing again for transport

            this.transport.removeAllListeners("close"); // ensure transport won't stay open

            this.transport.close(); // ignore further transport communication

            this.transport.removeAllListeners();

            if (typeof removeEventListener === "function") {
              removeEventListener("offline", this.offlineEventListener, false);
            } // set ready state


            this.readyState = "closed"; // clear session id

            this.id = null; // emit close event

            this.emitReserved("close", reason, desc); // clean buffers after, so users can still
            // grab the buffers on `close` event

            this.writeBuffer = [];
            this.prevBufferLen = 0;
          }
        }
        /**
         * Filters upgrades, returning only those matching client transports.
         *
         * @param {Array} server upgrades
         * @api private
         *
         */

      }, {
        key: "filterUpgrades",
        value: function filterUpgrades(upgrades) {
          var filteredUpgrades = [];
          var i = 0;
          var j = upgrades.length;

          for (; i < j; i++) {
            if (~this.transports.indexOf(upgrades[i])) filteredUpgrades.push(upgrades[i]);
          }

          return filteredUpgrades;
        }
      }]);

      return Socket;
    }(Emitter_1);
    Socket$1.protocol = protocol$1;

    function clone(obj) {
      var o = {};

      for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
          o[i] = obj[i];
        }
      }

      return o;
    }

    var withNativeArrayBuffer = typeof ArrayBuffer === "function";

    var isView = function isView(obj) {
      return typeof ArrayBuffer.isView === "function" ? ArrayBuffer.isView(obj) : obj.buffer instanceof ArrayBuffer;
    };

    var toString = Object.prototype.toString;
    var withNativeBlob = typeof Blob === "function" || typeof Blob !== "undefined" && toString.call(Blob) === "[object BlobConstructor]";
    var withNativeFile = typeof File === "function" || typeof File !== "undefined" && toString.call(File) === "[object FileConstructor]";
    /**
     * Returns true if obj is a Buffer, an ArrayBuffer, a Blob or a File.
     *
     * @private
     */

    function isBinary(obj) {
      return withNativeArrayBuffer && (obj instanceof ArrayBuffer || isView(obj)) || withNativeBlob && obj instanceof Blob || withNativeFile && obj instanceof File;
    }
    function hasBinary(obj, toJSON) {
      if (!obj || _typeof(obj) !== "object") {
        return false;
      }

      if (Array.isArray(obj)) {
        for (var i = 0, l = obj.length; i < l; i++) {
          if (hasBinary(obj[i])) {
            return true;
          }
        }

        return false;
      }

      if (isBinary(obj)) {
        return true;
      }

      if (obj.toJSON && typeof obj.toJSON === "function" && arguments.length === 1) {
        return hasBinary(obj.toJSON(), true);
      }

      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key) && hasBinary(obj[key])) {
          return true;
        }
      }

      return false;
    }

    /**
     * Replaces every Buffer | ArrayBuffer | Blob | File in packet with a numbered placeholder.
     *
     * @param {Object} packet - socket.io event packet
     * @return {Object} with deconstructed packet and list of buffers
     * @public
     */

    function deconstructPacket(packet) {
      var buffers = [];
      var packetData = packet.data;
      var pack = packet;
      pack.data = _deconstructPacket(packetData, buffers);
      pack.attachments = buffers.length; // number of binary 'attachments'

      return {
        packet: pack,
        buffers: buffers
      };
    }

    function _deconstructPacket(data, buffers) {
      if (!data) return data;

      if (isBinary(data)) {
        var placeholder = {
          _placeholder: true,
          num: buffers.length
        };
        buffers.push(data);
        return placeholder;
      } else if (Array.isArray(data)) {
        var newData = new Array(data.length);

        for (var i = 0; i < data.length; i++) {
          newData[i] = _deconstructPacket(data[i], buffers);
        }

        return newData;
      } else if (_typeof(data) === "object" && !(data instanceof Date)) {
        var _newData = {};

        for (var key in data) {
          if (data.hasOwnProperty(key)) {
            _newData[key] = _deconstructPacket(data[key], buffers);
          }
        }

        return _newData;
      }

      return data;
    }
    /**
     * Reconstructs a binary packet from its placeholder packet and buffers
     *
     * @param {Object} packet - event packet with placeholders
     * @param {Array} buffers - binary buffers to put in placeholder positions
     * @return {Object} reconstructed packet
     * @public
     */


    function reconstructPacket(packet, buffers) {
      packet.data = _reconstructPacket(packet.data, buffers);
      packet.attachments = undefined; // no longer useful

      return packet;
    }

    function _reconstructPacket(data, buffers) {
      if (!data) return data;

      if (data && data._placeholder) {
        return buffers[data.num]; // appropriate buffer (should be natural order anyway)
      } else if (Array.isArray(data)) {
        for (var i = 0; i < data.length; i++) {
          data[i] = _reconstructPacket(data[i], buffers);
        }
      } else if (_typeof(data) === "object") {
        for (var key in data) {
          if (data.hasOwnProperty(key)) {
            data[key] = _reconstructPacket(data[key], buffers);
          }
        }
      }

      return data;
    }

    /**
     * Protocol version.
     *
     * @public
     */

    var protocol = 5;
    var PacketType;

    (function (PacketType) {
      PacketType[PacketType["CONNECT"] = 0] = "CONNECT";
      PacketType[PacketType["DISCONNECT"] = 1] = "DISCONNECT";
      PacketType[PacketType["EVENT"] = 2] = "EVENT";
      PacketType[PacketType["ACK"] = 3] = "ACK";
      PacketType[PacketType["CONNECT_ERROR"] = 4] = "CONNECT_ERROR";
      PacketType[PacketType["BINARY_EVENT"] = 5] = "BINARY_EVENT";
      PacketType[PacketType["BINARY_ACK"] = 6] = "BINARY_ACK";
    })(PacketType || (PacketType = {}));
    /**
     * A socket.io Encoder instance
     */


    var Encoder = /*#__PURE__*/function () {
      function Encoder() {
        _classCallCheck(this, Encoder);
      }

      _createClass(Encoder, [{
        key: "encode",
        value:
        /**
         * Encode a packet as a single string if non-binary, or as a
         * buffer sequence, depending on packet type.
         *
         * @param {Object} obj - packet object
         */
        function encode(obj) {
          if (obj.type === PacketType.EVENT || obj.type === PacketType.ACK) {
            if (hasBinary(obj)) {
              obj.type = obj.type === PacketType.EVENT ? PacketType.BINARY_EVENT : PacketType.BINARY_ACK;
              return this.encodeAsBinary(obj);
            }
          }

          return [this.encodeAsString(obj)];
        }
        /**
         * Encode packet as string.
         */

      }, {
        key: "encodeAsString",
        value: function encodeAsString(obj) {
          // first is type
          var str = "" + obj.type; // attachments if we have them

          if (obj.type === PacketType.BINARY_EVENT || obj.type === PacketType.BINARY_ACK) {
            str += obj.attachments + "-";
          } // if we have a namespace other than `/`
          // we append it followed by a comma `,`


          if (obj.nsp && "/" !== obj.nsp) {
            str += obj.nsp + ",";
          } // immediately followed by the id


          if (null != obj.id) {
            str += obj.id;
          } // json data


          if (null != obj.data) {
            str += JSON.stringify(obj.data);
          }

          return str;
        }
        /**
         * Encode packet as 'buffer sequence' by removing blobs, and
         * deconstructing packet into object with placeholders and
         * a list of buffers.
         */

      }, {
        key: "encodeAsBinary",
        value: function encodeAsBinary(obj) {
          var deconstruction = deconstructPacket(obj);
          var pack = this.encodeAsString(deconstruction.packet);
          var buffers = deconstruction.buffers;
          buffers.unshift(pack); // add packet info to beginning of data list

          return buffers; // write all the buffers
        }
      }]);

      return Encoder;
    }();
    /**
     * A socket.io Decoder instance
     *
     * @return {Object} decoder
     */

    var Decoder = /*#__PURE__*/function (_Emitter) {
      _inherits(Decoder, _Emitter);

      var _super = _createSuper(Decoder);

      function Decoder() {
        _classCallCheck(this, Decoder);

        return _super.call(this);
      }
      /**
       * Decodes an encoded packet string into packet JSON.
       *
       * @param {String} obj - encoded packet
       */


      _createClass(Decoder, [{
        key: "add",
        value: function add(obj) {
          var packet;

          if (typeof obj === "string") {
            packet = this.decodeString(obj);

            if (packet.type === PacketType.BINARY_EVENT || packet.type === PacketType.BINARY_ACK) {
              // binary packet's json
              this.reconstructor = new BinaryReconstructor(packet); // no attachments, labeled binary but no binary data to follow

              if (packet.attachments === 0) {
                _get(_getPrototypeOf(Decoder.prototype), "emitReserved", this).call(this, "decoded", packet);
              }
            } else {
              // non-binary full packet
              _get(_getPrototypeOf(Decoder.prototype), "emitReserved", this).call(this, "decoded", packet);
            }
          } else if (isBinary(obj) || obj.base64) {
            // raw binary data
            if (!this.reconstructor) {
              throw new Error("got binary data when not reconstructing a packet");
            } else {
              packet = this.reconstructor.takeBinaryData(obj);

              if (packet) {
                // received final buffer
                this.reconstructor = null;

                _get(_getPrototypeOf(Decoder.prototype), "emitReserved", this).call(this, "decoded", packet);
              }
            }
          } else {
            throw new Error("Unknown type: " + obj);
          }
        }
        /**
         * Decode a packet String (JSON data)
         *
         * @param {String} str
         * @return {Object} packet
         */

      }, {
        key: "decodeString",
        value: function decodeString(str) {
          var i = 0; // look up type

          var p = {
            type: Number(str.charAt(0))
          };

          if (PacketType[p.type] === undefined) {
            throw new Error("unknown packet type " + p.type);
          } // look up attachments if type binary


          if (p.type === PacketType.BINARY_EVENT || p.type === PacketType.BINARY_ACK) {
            var start = i + 1;

            while (str.charAt(++i) !== "-" && i != str.length) {}

            var buf = str.substring(start, i);

            if (buf != Number(buf) || str.charAt(i) !== "-") {
              throw new Error("Illegal attachments");
            }

            p.attachments = Number(buf);
          } // look up namespace (if any)


          if ("/" === str.charAt(i + 1)) {
            var _start = i + 1;

            while (++i) {
              var c = str.charAt(i);
              if ("," === c) break;
              if (i === str.length) break;
            }

            p.nsp = str.substring(_start, i);
          } else {
            p.nsp = "/";
          } // look up id


          var next = str.charAt(i + 1);

          if ("" !== next && Number(next) == next) {
            var _start2 = i + 1;

            while (++i) {
              var _c = str.charAt(i);

              if (null == _c || Number(_c) != _c) {
                --i;
                break;
              }

              if (i === str.length) break;
            }

            p.id = Number(str.substring(_start2, i + 1));
          } // look up json data


          if (str.charAt(++i)) {
            var payload = tryParse(str.substr(i));

            if (Decoder.isPayloadValid(p.type, payload)) {
              p.data = payload;
            } else {
              throw new Error("invalid payload");
            }
          }

          return p;
        }
      }, {
        key: "destroy",
        value:
        /**
         * Deallocates a parser's resources
         */
        function destroy() {
          if (this.reconstructor) {
            this.reconstructor.finishedReconstruction();
          }
        }
      }], [{
        key: "isPayloadValid",
        value: function isPayloadValid(type, payload) {
          switch (type) {
            case PacketType.CONNECT:
              return _typeof(payload) === "object";

            case PacketType.DISCONNECT:
              return payload === undefined;

            case PacketType.CONNECT_ERROR:
              return typeof payload === "string" || _typeof(payload) === "object";

            case PacketType.EVENT:
            case PacketType.BINARY_EVENT:
              return Array.isArray(payload) && payload.length > 0;

            case PacketType.ACK:
            case PacketType.BINARY_ACK:
              return Array.isArray(payload);
          }
        }
      }]);

      return Decoder;
    }(Emitter_1);

    function tryParse(str) {
      try {
        return JSON.parse(str);
      } catch (e) {
        return false;
      }
    }
    /**
     * A manager of a binary event's 'buffer sequence'. Should
     * be constructed whenever a packet of type BINARY_EVENT is
     * decoded.
     *
     * @param {Object} packet
     * @return {BinaryReconstructor} initialized reconstructor
     */


    var BinaryReconstructor = /*#__PURE__*/function () {
      function BinaryReconstructor(packet) {
        _classCallCheck(this, BinaryReconstructor);

        this.packet = packet;
        this.buffers = [];
        this.reconPack = packet;
      }
      /**
       * Method to be called when binary data received from connection
       * after a BINARY_EVENT packet.
       *
       * @param {Buffer | ArrayBuffer} binData - the raw binary data received
       * @return {null | Object} returns null if more binary data is expected or
       *   a reconstructed packet object if all buffers have been received.
       */


      _createClass(BinaryReconstructor, [{
        key: "takeBinaryData",
        value: function takeBinaryData(binData) {
          this.buffers.push(binData);

          if (this.buffers.length === this.reconPack.attachments) {
            // done with buffer list
            var packet = reconstructPacket(this.reconPack, this.buffers);
            this.finishedReconstruction();
            return packet;
          }

          return null;
        }
        /**
         * Cleans up binary packet reconstruction variables.
         */

      }, {
        key: "finishedReconstruction",
        value: function finishedReconstruction() {
          this.reconPack = null;
          this.buffers = [];
        }
      }]);

      return BinaryReconstructor;
    }();

    var parser = /*#__PURE__*/Object.freeze({
      __proto__: null,
      protocol: protocol,
      get PacketType () { return PacketType; },
      Encoder: Encoder,
      Decoder: Decoder
    });

    function on(obj, ev, fn) {
      obj.on(ev, fn);
      return function subDestroy() {
        obj.off(ev, fn);
      };
    }

    /**
     * Internal events.
     * These events can't be emitted by the user.
     */

    var RESERVED_EVENTS = Object.freeze({
      connect: 1,
      connect_error: 1,
      disconnect: 1,
      disconnecting: 1,
      // EventEmitter reserved events: https://nodejs.org/api/events.html#events_event_newlistener
      newListener: 1,
      removeListener: 1
    });
    var Socket = /*#__PURE__*/function (_Emitter) {
      _inherits(Socket, _Emitter);

      var _super = _createSuper(Socket);

      /**
       * `Socket` constructor.
       *
       * @public
       */
      function Socket(io, nsp, opts) {
        var _this;

        _classCallCheck(this, Socket);

        _this = _super.call(this);
        _this.connected = false;
        _this.disconnected = true;
        _this.receiveBuffer = [];
        _this.sendBuffer = [];
        _this.ids = 0;
        _this.acks = {};
        _this.flags = {};
        _this.io = io;
        _this.nsp = nsp;

        if (opts && opts.auth) {
          _this.auth = opts.auth;
        }

        if (_this.io._autoConnect) _this.open();
        return _this;
      }
      /**
       * Subscribe to open, close and packet events
       *
       * @private
       */


      _createClass(Socket, [{
        key: "subEvents",
        value: function subEvents() {
          if (this.subs) return;
          var io = this.io;
          this.subs = [on(io, "open", this.onopen.bind(this)), on(io, "packet", this.onpacket.bind(this)), on(io, "error", this.onerror.bind(this)), on(io, "close", this.onclose.bind(this))];
        }
        /**
         * Whether the Socket will try to reconnect when its Manager connects or reconnects
         */

      }, {
        key: "active",
        get: function get() {
          return !!this.subs;
        }
        /**
         * "Opens" the socket.
         *
         * @public
         */

      }, {
        key: "connect",
        value: function connect() {
          if (this.connected) return this;
          this.subEvents();
          if (!this.io["_reconnecting"]) this.io.open(); // ensure open

          if ("open" === this.io._readyState) this.onopen();
          return this;
        }
        /**
         * Alias for connect()
         */

      }, {
        key: "open",
        value: function open() {
          return this.connect();
        }
        /**
         * Sends a `message` event.
         *
         * @return self
         * @public
         */

      }, {
        key: "send",
        value: function send() {
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }

          args.unshift("message");
          this.emit.apply(this, args);
          return this;
        }
        /**
         * Override `emit`.
         * If the event is in `events`, it's emitted normally.
         *
         * @return self
         * @public
         */

      }, {
        key: "emit",
        value: function emit(ev) {
          if (RESERVED_EVENTS.hasOwnProperty(ev)) {
            throw new Error('"' + ev + '" is a reserved event name');
          }

          for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
            args[_key2 - 1] = arguments[_key2];
          }

          args.unshift(ev);
          var packet = {
            type: PacketType.EVENT,
            data: args
          };
          packet.options = {};
          packet.options.compress = this.flags.compress !== false; // event ack callback

          if ("function" === typeof args[args.length - 1]) {
            var id = this.ids++;
            var ack = args.pop();

            this._registerAckCallback(id, ack);

            packet.id = id;
          }

          var isTransportWritable = this.io.engine && this.io.engine.transport && this.io.engine.transport.writable;
          var discardPacket = this.flags["volatile"] && (!isTransportWritable || !this.connected);

          if (discardPacket) ; else if (this.connected) {
            this.packet(packet);
          } else {
            this.sendBuffer.push(packet);
          }

          this.flags = {};
          return this;
        }
        /**
         * @private
         */

      }, {
        key: "_registerAckCallback",
        value: function _registerAckCallback(id, ack) {
          var _this2 = this;

          var timeout = this.flags.timeout;

          if (timeout === undefined) {
            this.acks[id] = ack;
            return;
          } // @ts-ignore


          var timer = this.io.setTimeoutFn(function () {
            delete _this2.acks[id];

            for (var i = 0; i < _this2.sendBuffer.length; i++) {
              if (_this2.sendBuffer[i].id === id) {
                _this2.sendBuffer.splice(i, 1);
              }
            }

            ack.call(_this2, new Error("operation has timed out"));
          }, timeout);

          this.acks[id] = function () {
            // @ts-ignore
            _this2.io.clearTimeoutFn(timer);

            for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
              args[_key3] = arguments[_key3];
            }

            ack.apply(_this2, [null].concat(args));
          };
        }
        /**
         * Sends a packet.
         *
         * @param packet
         * @private
         */

      }, {
        key: "packet",
        value: function packet(_packet) {
          _packet.nsp = this.nsp;

          this.io._packet(_packet);
        }
        /**
         * Called upon engine `open`.
         *
         * @private
         */

      }, {
        key: "onopen",
        value: function onopen() {
          var _this3 = this;

          if (typeof this.auth == "function") {
            this.auth(function (data) {
              _this3.packet({
                type: PacketType.CONNECT,
                data: data
              });
            });
          } else {
            this.packet({
              type: PacketType.CONNECT,
              data: this.auth
            });
          }
        }
        /**
         * Called upon engine or manager `error`.
         *
         * @param err
         * @private
         */

      }, {
        key: "onerror",
        value: function onerror(err) {
          if (!this.connected) {
            this.emitReserved("connect_error", err);
          }
        }
        /**
         * Called upon engine `close`.
         *
         * @param reason
         * @private
         */

      }, {
        key: "onclose",
        value: function onclose(reason) {
          this.connected = false;
          this.disconnected = true;
          delete this.id;
          this.emitReserved("disconnect", reason);
        }
        /**
         * Called with socket packet.
         *
         * @param packet
         * @private
         */

      }, {
        key: "onpacket",
        value: function onpacket(packet) {
          var sameNamespace = packet.nsp === this.nsp;
          if (!sameNamespace) return;

          switch (packet.type) {
            case PacketType.CONNECT:
              if (packet.data && packet.data.sid) {
                var id = packet.data.sid;
                this.onconnect(id);
              } else {
                this.emitReserved("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
              }

              break;

            case PacketType.EVENT:
              this.onevent(packet);
              break;

            case PacketType.BINARY_EVENT:
              this.onevent(packet);
              break;

            case PacketType.ACK:
              this.onack(packet);
              break;

            case PacketType.BINARY_ACK:
              this.onack(packet);
              break;

            case PacketType.DISCONNECT:
              this.ondisconnect();
              break;

            case PacketType.CONNECT_ERROR:
              this.destroy();
              var err = new Error(packet.data.message); // @ts-ignore

              err.data = packet.data.data;
              this.emitReserved("connect_error", err);
              break;
          }
        }
        /**
         * Called upon a server event.
         *
         * @param packet
         * @private
         */

      }, {
        key: "onevent",
        value: function onevent(packet) {
          var args = packet.data || [];

          if (null != packet.id) {
            args.push(this.ack(packet.id));
          }

          if (this.connected) {
            this.emitEvent(args);
          } else {
            this.receiveBuffer.push(Object.freeze(args));
          }
        }
      }, {
        key: "emitEvent",
        value: function emitEvent(args) {
          if (this._anyListeners && this._anyListeners.length) {
            var listeners = this._anyListeners.slice();

            var _iterator = _createForOfIteratorHelper(listeners),
                _step;

            try {
              for (_iterator.s(); !(_step = _iterator.n()).done;) {
                var listener = _step.value;
                listener.apply(this, args);
              }
            } catch (err) {
              _iterator.e(err);
            } finally {
              _iterator.f();
            }
          }

          _get(_getPrototypeOf(Socket.prototype), "emit", this).apply(this, args);
        }
        /**
         * Produces an ack callback to emit with an event.
         *
         * @private
         */

      }, {
        key: "ack",
        value: function ack(id) {
          var self = this;
          var sent = false;
          return function () {
            // prevent double callbacks
            if (sent) return;
            sent = true;

            for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
              args[_key4] = arguments[_key4];
            }

            self.packet({
              type: PacketType.ACK,
              id: id,
              data: args
            });
          };
        }
        /**
         * Called upon a server acknowlegement.
         *
         * @param packet
         * @private
         */

      }, {
        key: "onack",
        value: function onack(packet) {
          var ack = this.acks[packet.id];

          if ("function" === typeof ack) {
            ack.apply(this, packet.data);
            delete this.acks[packet.id];
          }
        }
        /**
         * Called upon server connect.
         *
         * @private
         */

      }, {
        key: "onconnect",
        value: function onconnect(id) {
          this.id = id;
          this.connected = true;
          this.disconnected = false;
          this.emitBuffered();
          this.emitReserved("connect");
        }
        /**
         * Emit buffered events (received and emitted).
         *
         * @private
         */

      }, {
        key: "emitBuffered",
        value: function emitBuffered() {
          var _this4 = this;

          this.receiveBuffer.forEach(function (args) {
            return _this4.emitEvent(args);
          });
          this.receiveBuffer = [];
          this.sendBuffer.forEach(function (packet) {
            return _this4.packet(packet);
          });
          this.sendBuffer = [];
        }
        /**
         * Called upon server disconnect.
         *
         * @private
         */

      }, {
        key: "ondisconnect",
        value: function ondisconnect() {
          this.destroy();
          this.onclose("io server disconnect");
        }
        /**
         * Called upon forced client/server side disconnections,
         * this method ensures the manager stops tracking us and
         * that reconnections don't get triggered for this.
         *
         * @private
         */

      }, {
        key: "destroy",
        value: function destroy() {
          if (this.subs) {
            // clean subscriptions to avoid reconnections
            this.subs.forEach(function (subDestroy) {
              return subDestroy();
            });
            this.subs = undefined;
          }

          this.io["_destroy"](this);
        }
        /**
         * Disconnects the socket manually.
         *
         * @return self
         * @public
         */

      }, {
        key: "disconnect",
        value: function disconnect() {
          if (this.connected) {
            this.packet({
              type: PacketType.DISCONNECT
            });
          } // remove socket from pool


          this.destroy();

          if (this.connected) {
            // fire events
            this.onclose("io client disconnect");
          }

          return this;
        }
        /**
         * Alias for disconnect()
         *
         * @return self
         * @public
         */

      }, {
        key: "close",
        value: function close() {
          return this.disconnect();
        }
        /**
         * Sets the compress flag.
         *
         * @param compress - if `true`, compresses the sending data
         * @return self
         * @public
         */

      }, {
        key: "compress",
        value: function compress(_compress) {
          this.flags.compress = _compress;
          return this;
        }
        /**
         * Sets a modifier for a subsequent event emission that the event message will be dropped when this socket is not
         * ready to send messages.
         *
         * @returns self
         * @public
         */

      }, {
        key: "volatile",
        get: function get() {
          this.flags["volatile"] = true;
          return this;
        }
        /**
         * Sets a modifier for a subsequent event emission that the callback will be called with an error when the
         * given number of milliseconds have elapsed without an acknowledgement from the server:
         *
         * ```
         * socket.timeout(5000).emit("my-event", (err) => {
         *   if (err) {
         *     // the server did not acknowledge the event in the given delay
         *   }
         * });
         * ```
         *
         * @returns self
         * @public
         */

      }, {
        key: "timeout",
        value: function timeout(_timeout) {
          this.flags.timeout = _timeout;
          return this;
        }
        /**
         * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
         * callback.
         *
         * @param listener
         * @public
         */

      }, {
        key: "onAny",
        value: function onAny(listener) {
          this._anyListeners = this._anyListeners || [];

          this._anyListeners.push(listener);

          return this;
        }
        /**
         * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
         * callback. The listener is added to the beginning of the listeners array.
         *
         * @param listener
         * @public
         */

      }, {
        key: "prependAny",
        value: function prependAny(listener) {
          this._anyListeners = this._anyListeners || [];

          this._anyListeners.unshift(listener);

          return this;
        }
        /**
         * Removes the listener that will be fired when any event is emitted.
         *
         * @param listener
         * @public
         */

      }, {
        key: "offAny",
        value: function offAny(listener) {
          if (!this._anyListeners) {
            return this;
          }

          if (listener) {
            var listeners = this._anyListeners;

            for (var i = 0; i < listeners.length; i++) {
              if (listener === listeners[i]) {
                listeners.splice(i, 1);
                return this;
              }
            }
          } else {
            this._anyListeners = [];
          }

          return this;
        }
        /**
         * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
         * e.g. to remove listeners.
         *
         * @public
         */

      }, {
        key: "listenersAny",
        value: function listenersAny() {
          return this._anyListeners || [];
        }
      }]);

      return Socket;
    }(Emitter_1);

    /**
     * Expose `Backoff`.
     */

    var backo2 = Backoff;
    /**
     * Initialize backoff timer with `opts`.
     *
     * - `min` initial timeout in milliseconds [100]
     * - `max` max timeout [10000]
     * - `jitter` [0]
     * - `factor` [2]
     *
     * @param {Object} opts
     * @api public
     */

    function Backoff(opts) {
      opts = opts || {};
      this.ms = opts.min || 100;
      this.max = opts.max || 10000;
      this.factor = opts.factor || 2;
      this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
      this.attempts = 0;
    }
    /**
     * Return the backoff duration.
     *
     * @return {Number}
     * @api public
     */


    Backoff.prototype.duration = function () {
      var ms = this.ms * Math.pow(this.factor, this.attempts++);

      if (this.jitter) {
        var rand = Math.random();
        var deviation = Math.floor(rand * this.jitter * ms);
        ms = (Math.floor(rand * 10) & 1) == 0 ? ms - deviation : ms + deviation;
      }

      return Math.min(ms, this.max) | 0;
    };
    /**
     * Reset the number of attempts.
     *
     * @api public
     */


    Backoff.prototype.reset = function () {
      this.attempts = 0;
    };
    /**
     * Set the minimum duration
     *
     * @api public
     */


    Backoff.prototype.setMin = function (min) {
      this.ms = min;
    };
    /**
     * Set the maximum duration
     *
     * @api public
     */


    Backoff.prototype.setMax = function (max) {
      this.max = max;
    };
    /**
     * Set the jitter
     *
     * @api public
     */


    Backoff.prototype.setJitter = function (jitter) {
      this.jitter = jitter;
    };

    var Manager = /*#__PURE__*/function (_Emitter) {
      _inherits(Manager, _Emitter);

      var _super = _createSuper(Manager);

      function Manager(uri, opts) {
        var _this;

        _classCallCheck(this, Manager);

        var _a;

        _this = _super.call(this);
        _this.nsps = {};
        _this.subs = [];

        if (uri && "object" === _typeof(uri)) {
          opts = uri;
          uri = undefined;
        }

        opts = opts || {};
        opts.path = opts.path || "/socket.io";
        _this.opts = opts;
        installTimerFunctions(_assertThisInitialized(_this), opts);

        _this.reconnection(opts.reconnection !== false);

        _this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);

        _this.reconnectionDelay(opts.reconnectionDelay || 1000);

        _this.reconnectionDelayMax(opts.reconnectionDelayMax || 5000);

        _this.randomizationFactor((_a = opts.randomizationFactor) !== null && _a !== void 0 ? _a : 0.5);

        _this.backoff = new backo2({
          min: _this.reconnectionDelay(),
          max: _this.reconnectionDelayMax(),
          jitter: _this.randomizationFactor()
        });

        _this.timeout(null == opts.timeout ? 20000 : opts.timeout);

        _this._readyState = "closed";
        _this.uri = uri;

        var _parser = opts.parser || parser;

        _this.encoder = new _parser.Encoder();
        _this.decoder = new _parser.Decoder();
        _this._autoConnect = opts.autoConnect !== false;
        if (_this._autoConnect) _this.open();
        return _this;
      }

      _createClass(Manager, [{
        key: "reconnection",
        value: function reconnection(v) {
          if (!arguments.length) return this._reconnection;
          this._reconnection = !!v;
          return this;
        }
      }, {
        key: "reconnectionAttempts",
        value: function reconnectionAttempts(v) {
          if (v === undefined) return this._reconnectionAttempts;
          this._reconnectionAttempts = v;
          return this;
        }
      }, {
        key: "reconnectionDelay",
        value: function reconnectionDelay(v) {
          var _a;

          if (v === undefined) return this._reconnectionDelay;
          this._reconnectionDelay = v;
          (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMin(v);
          return this;
        }
      }, {
        key: "randomizationFactor",
        value: function randomizationFactor(v) {
          var _a;

          if (v === undefined) return this._randomizationFactor;
          this._randomizationFactor = v;
          (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setJitter(v);
          return this;
        }
      }, {
        key: "reconnectionDelayMax",
        value: function reconnectionDelayMax(v) {
          var _a;

          if (v === undefined) return this._reconnectionDelayMax;
          this._reconnectionDelayMax = v;
          (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMax(v);
          return this;
        }
      }, {
        key: "timeout",
        value: function timeout(v) {
          if (!arguments.length) return this._timeout;
          this._timeout = v;
          return this;
        }
        /**
         * Starts trying to reconnect if reconnection is enabled and we have not
         * started reconnecting yet
         *
         * @private
         */

      }, {
        key: "maybeReconnectOnOpen",
        value: function maybeReconnectOnOpen() {
          // Only try to reconnect if it's the first time we're connecting
          if (!this._reconnecting && this._reconnection && this.backoff.attempts === 0) {
            // keeps reconnection from firing twice for the same reconnection loop
            this.reconnect();
          }
        }
        /**
         * Sets the current transport `socket`.
         *
         * @param {Function} fn - optional, callback
         * @return self
         * @public
         */

      }, {
        key: "open",
        value: function open(fn) {
          var _this2 = this;

          if (~this._readyState.indexOf("open")) return this;
          this.engine = new Socket$1(this.uri, this.opts);
          var socket = this.engine;
          var self = this;
          this._readyState = "opening";
          this.skipReconnect = false; // emit `open`

          var openSubDestroy = on(socket, "open", function () {
            self.onopen();
            fn && fn();
          }); // emit `error`

          var errorSub = on(socket, "error", function (err) {
            self.cleanup();
            self._readyState = "closed";

            _this2.emitReserved("error", err);

            if (fn) {
              fn(err);
            } else {
              // Only do this if there is no fn to handle the error
              self.maybeReconnectOnOpen();
            }
          });

          if (false !== this._timeout) {
            var timeout = this._timeout;

            if (timeout === 0) {
              openSubDestroy(); // prevents a race condition with the 'open' event
            } // set timer


            var timer = this.setTimeoutFn(function () {
              openSubDestroy();
              socket.close(); // @ts-ignore

              socket.emit("error", new Error("timeout"));
            }, timeout);

            if (this.opts.autoUnref) {
              timer.unref();
            }

            this.subs.push(function subDestroy() {
              clearTimeout(timer);
            });
          }

          this.subs.push(openSubDestroy);
          this.subs.push(errorSub);
          return this;
        }
        /**
         * Alias for open()
         *
         * @return self
         * @public
         */

      }, {
        key: "connect",
        value: function connect(fn) {
          return this.open(fn);
        }
        /**
         * Called upon transport open.
         *
         * @private
         */

      }, {
        key: "onopen",
        value: function onopen() {
          // clear old subs
          this.cleanup(); // mark as open

          this._readyState = "open";
          this.emitReserved("open"); // add new subs

          var socket = this.engine;
          this.subs.push(on(socket, "ping", this.onping.bind(this)), on(socket, "data", this.ondata.bind(this)), on(socket, "error", this.onerror.bind(this)), on(socket, "close", this.onclose.bind(this)), on(this.decoder, "decoded", this.ondecoded.bind(this)));
        }
        /**
         * Called upon a ping.
         *
         * @private
         */

      }, {
        key: "onping",
        value: function onping() {
          this.emitReserved("ping");
        }
        /**
         * Called with data.
         *
         * @private
         */

      }, {
        key: "ondata",
        value: function ondata(data) {
          this.decoder.add(data);
        }
        /**
         * Called when parser fully decodes a packet.
         *
         * @private
         */

      }, {
        key: "ondecoded",
        value: function ondecoded(packet) {
          this.emitReserved("packet", packet);
        }
        /**
         * Called upon socket error.
         *
         * @private
         */

      }, {
        key: "onerror",
        value: function onerror(err) {
          this.emitReserved("error", err);
        }
        /**
         * Creates a new socket for the given `nsp`.
         *
         * @return {Socket}
         * @public
         */

      }, {
        key: "socket",
        value: function socket(nsp, opts) {
          var socket = this.nsps[nsp];

          if (!socket) {
            socket = new Socket(this, nsp, opts);
            this.nsps[nsp] = socket;
          }

          return socket;
        }
        /**
         * Called upon a socket close.
         *
         * @param socket
         * @private
         */

      }, {
        key: "_destroy",
        value: function _destroy(socket) {
          var nsps = Object.keys(this.nsps);

          for (var _i = 0, _nsps = nsps; _i < _nsps.length; _i++) {
            var nsp = _nsps[_i];
            var _socket = this.nsps[nsp];

            if (_socket.active) {
              return;
            }
          }

          this._close();
        }
        /**
         * Writes a packet.
         *
         * @param packet
         * @private
         */

      }, {
        key: "_packet",
        value: function _packet(packet) {
          var encodedPackets = this.encoder.encode(packet);

          for (var i = 0; i < encodedPackets.length; i++) {
            this.engine.write(encodedPackets[i], packet.options);
          }
        }
        /**
         * Clean up transport subscriptions and packet buffer.
         *
         * @private
         */

      }, {
        key: "cleanup",
        value: function cleanup() {
          this.subs.forEach(function (subDestroy) {
            return subDestroy();
          });
          this.subs.length = 0;
          this.decoder.destroy();
        }
        /**
         * Close the current socket.
         *
         * @private
         */

      }, {
        key: "_close",
        value: function _close() {
          this.skipReconnect = true;
          this._reconnecting = false;
          this.onclose("forced close");
          if (this.engine) this.engine.close();
        }
        /**
         * Alias for close()
         *
         * @private
         */

      }, {
        key: "disconnect",
        value: function disconnect() {
          return this._close();
        }
        /**
         * Called upon engine close.
         *
         * @private
         */

      }, {
        key: "onclose",
        value: function onclose(reason) {
          this.cleanup();
          this.backoff.reset();
          this._readyState = "closed";
          this.emitReserved("close", reason);

          if (this._reconnection && !this.skipReconnect) {
            this.reconnect();
          }
        }
        /**
         * Attempt a reconnection.
         *
         * @private
         */

      }, {
        key: "reconnect",
        value: function reconnect() {
          var _this3 = this;

          if (this._reconnecting || this.skipReconnect) return this;
          var self = this;

          if (this.backoff.attempts >= this._reconnectionAttempts) {
            this.backoff.reset();
            this.emitReserved("reconnect_failed");
            this._reconnecting = false;
          } else {
            var delay = this.backoff.duration();
            this._reconnecting = true;
            var timer = this.setTimeoutFn(function () {
              if (self.skipReconnect) return;

              _this3.emitReserved("reconnect_attempt", self.backoff.attempts); // check again for the case socket closed in above events


              if (self.skipReconnect) return;
              self.open(function (err) {
                if (err) {
                  self._reconnecting = false;
                  self.reconnect();

                  _this3.emitReserved("reconnect_error", err);
                } else {
                  self.onreconnect();
                }
              });
            }, delay);

            if (this.opts.autoUnref) {
              timer.unref();
            }

            this.subs.push(function subDestroy() {
              clearTimeout(timer);
            });
          }
        }
        /**
         * Called upon successful reconnect.
         *
         * @private
         */

      }, {
        key: "onreconnect",
        value: function onreconnect() {
          var attempt = this.backoff.attempts;
          this._reconnecting = false;
          this.backoff.reset();
          this.emitReserved("reconnect", attempt);
        }
      }]);

      return Manager;
    }(Emitter_1);

    /**
     * Managers cache.
     */

    var cache = {};

    function lookup(uri, opts) {
      if (_typeof(uri) === "object") {
        opts = uri;
        uri = undefined;
      }

      opts = opts || {};
      var parsed = url(uri, opts.path || "/socket.io");
      var source = parsed.source;
      var id = parsed.id;
      var path = parsed.path;
      var sameNamespace = cache[id] && path in cache[id]["nsps"];
      var newConnection = opts.forceNew || opts["force new connection"] || false === opts.multiplex || sameNamespace;
      var io;

      if (newConnection) {
        io = new Manager(source, opts);
      } else {
        if (!cache[id]) {
          cache[id] = new Manager(source, opts);
        }

        io = cache[id];
      }

      if (parsed.query && !opts.query) {
        opts.query = parsed.queryKey;
      }

      return io.socket(parsed.path, opts);
    } // so that "lookup" can be used both as a function (e.g. `io(...)`) and as a
    // namespace (e.g. `io.connect(...)`), for backward compatibility


    _extends(lookup, {
      Manager: Manager,
      Socket: Socket,
      io: lookup,
      connect: lookup
    });

    return lookup;

  }));

  (function() {
  	const { assign: assign$2 } = self.$;
  	const app = {
  		config: {},
  		utility: self.$,
  		events: {
  			appStatus: {
  				state: 0
  			},
  			credit(data) {
  				if (data.credit) {
  					app.creditSave = $.assign({}, data.credit);
  					console.log('Credits Saved in worker');
  				}
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
  	const { utility: { assign: assign$1 } } = app;
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
  			assign, uid, isFileJS, isFileJSON, isFileCSS, initial, map
  		}
  	} = app;
  	let socket;
  	let alreadySetup;
  	const routerData = self.location;
  	const shouldNotUpgrade = /(^js\/lib\/)|(\.min\.js)/;
  	const importRegexGlobal = /\bimport\b([^:;=]*?){([^;]*?)}(\s\bfrom\b).*(('|"|`).*('|"|`));$/gm;
  	const importSingleRegexGlobal = /\bimport\b([^:;={}]*?)([^;{}]*?)(\s\bfrom\b).*(('|"|`).*('|"|`));$/gm;
  	const importEntire = /\bimport\b\s(('|"|`).*('|"|`));$/gm;
  	const importDynamic = /{([^;]*?)}\s=\simport\((('|"|`).*('|"|`))\);$/gm;
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
  			data.id = null;
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
  		if (alreadySetup) {
  			if (app.creditSave) {
  				console.log('Re-authenticating');
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
  						data: {
  							credit: $.assign({}, app.creditSave)
  						},
  						request: 'open.loginCredit'
  					}
  				});
  			}
  		} else {
  			post$1('setupCompleted', {
  				language: data.language
  			});
  			alreadySetup = 1;
  			console.log('connected');
  		}
  	};
  	const replaceImports = function(file) {
  		let compiled = file;
  		compiled = compiled.replace(importRegexGlobal, 'const {$2} = await appGlobal.demandJs($4);');
  		compiled = compiled.replace(importSingleRegexGlobal, 'const $2 = await appGlobal.demandJs($4);');
  		compiled = compiled.replace(importEntire, 'await appGlobal.demandJs($1);');
  		compiled = compiled.replace(importDynamic, '{$1} = await appGlobal.demandJs($2);');
  		return compiled;
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
  		const isLib = shouldNotUpgrade.test(filename);
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
  			if (completedFile !== true && isJs && !isLib && completedFile !== false) {
  				completedFile = replaceImports(completedFile);
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
  		let serverLocation = `${routerData.protocol}//${app.config.socketHostname || routerData.hostname}`;
  		if (app.config.port) {
  			serverLocation = `${serverLocation}:${app.config.port}`;
  		}
  		socket = self.io.connect(serverLocation, {
  			transports: ['websocket'],
  			secure: true
  		});
  		// this listens for client API calls
  		socket.on('api', apiClient);
  		socket.on('ready', socketIsReady);
  		socket.on('connect', () => {
  			socket.emit('configure', app.config);
  		});
  		socket.on('disconnect', (reason) => {
  			console.log('disconnected');
  			if (reason === 'io server disconnect') {
  				// the disconnection was initiated by the server, you need to reconnect manually
  				socket.connect();
  			}
  			postMessage({
  				data: {
  					type: 'disconnected'
  				},
  				id: '_'
  			});
  		});
  	};
  	app.events.configure = (data) => {
  		assign(config, data);
  		console.log('STARTING');
  		socketInitialize();
  	};
  	const {
  		utility: { get },
  		events,
  		events: { post }
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
  		} else {
  			console.log(`FAILED Worker api.${requestName}`);
  		}
  	};
  })();

})();
