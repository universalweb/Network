(function () {

	!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):function(){var n=t.Ractive,i=e();t.Ractive=i,i.noConflict=function(){return t.Ractive=n,i};}();}(window,function(){function t(t,e){return Object.prototype.hasOwnProperty.call(t,e)}function e(e){for(var n=[],i=arguments.length-1;i-->0;)n[i]=arguments[i+1];for(var r=0;r<n.length;r++){var s=n[r];for(var a in s)a in e||!t(s,a)||(e[a]=s[a]);}return e}function n(e){void 0===e&&(e={});var n=[];for(var i in e)t(e,i)&&n.push([i,e[i]]);return n}function i(t,e){return null===t&&null===e?!0:o(t)||o(e)?!1:t===e}function r(t){return !isNaN(parseFloat(t))&&isFinite(t)}function s(t){return t&&"[object Object]"===Da.call(t)}function a(t){return !(!t||!o(t)&&!u(t))}function o(t){return "object"==typeof t}function u(t){return "function"==typeof t}function h(t){return "string"==typeof t}function l(t){return "number"==typeof t}function c(t){return void 0===t}function f(){}function d(t,e){return t.replace(/%s/g,function(){return e.shift()})}function p(t){for(var e=[],n=arguments.length-1;n-->0;)e[n]=arguments[n+1];throw t=d(t,e),new Error(t)}function m(){Ma.DEBUG&&ro.apply(null,arguments);}function v(t){for(var e=[],n=arguments.length-1;n-->0;)e[n]=arguments[n+1];t=d(t,e),so(t,e);}function g(t){for(var e=[],n=arguments.length-1;n-->0;)e[n]=arguments[n+1];t=d(t,e),ho[t]||(ho[t]=!0,so(t,e));}function y(){Ma.DEBUG&&v.apply(null,arguments);}function b(){Ma.DEBUG&&g.apply(null,arguments);}function w(t,e,n){var i=x(t,e,n);return i?i[t][n]:null}function x(t,e,n){for(;e;){if(n in e[t])return e;if(e.isolated)return null;e=e.parent;}}function k(t,e,n,i){if(t===e)return null;if(i){var r=w("interpolators",n,i);if(r)return r(t,e)||null;p(mo(i,"interpolator"));}return vo.number(t,e)||vo.array(t,e)||vo.object(t,e)||null}function _(t){return h(t)?t.replace(bo,"\\$&"):t}function E(t){return t?t.replace(go,".$1"):""}function A(t){var e,n=[];for(t=E(t);e=yo.exec(t);){var i=e.index+e[1].length;n.push(t.substr(0,i)),t=t.substr(i+1);}return n.push(t),n}function C(t){return h(t)?t.replace(wo,"$1$2"):t}function S(t,e){var n=t.indexOf(e);-1===n&&t.push(e);}function O(t,e){for(var n=0,i=t.length;i>n;n++)if(t[n]==e)return !0;return !1}function j(t,e){var n;if(!Fa(t)||!Fa(e))return !1;if(t.length!==e.length)return !1;for(n=t.length;n--;)if(t[n]!==e[n])return !1;return !0}function N(t){return h(t)?[t]:c(t)?[]:t}function T(t){return t[t.length-1]}function V(t,e){if(t){var n=t.indexOf(e);-1!==n&&t.splice(n,1);}}function M(){for(var t=[],e=arguments.length;e--;)t[e]=arguments[e];for(var n=t.concat.apply([],t),i=n.length;i--;){var r=n.indexOf(n[i]);~r&&i>r&&n.splice(i,1);}return n}function P(t){for(var e=[],n=t.length;n--;)e[n]=t[n];return e}function I(t,e){for(var n=t.length,i=0;n>i;i++){var r=e(t[i]);if(r)return r}}function R(t,e,n){var i=t,r=e;n&&(i=i.map(n),r=r.map(n));var s=i.length,a={},o=0,u=i.map(function(t){var e,n=o;do{if(e=r.indexOf(t,n),-1===e)return -1;n=e+1;}while(a[e]===!0&&s>n);return e===o&&(o+=1),a[e]=!0,e}),h=u.oldLen=i.length;if(u.newLen=r.length,h===u.newLen){var l=0;for(l;h>l&&u[l]===l;l++);l===h&&(u.same=!0);}return u}function B(t,e){if(!/this/.test(t.toString()))return t;var n=xo.call(t,e);for(var i in t)n[i]=t[i];return n}function K(t,e,n){return n&&u(e)&&t.parent&&t.parent.isRoot?(t.boundValue||(t.boundValue=B(e._r_unbound||e,t.parent.ractive)),t.boundValue):e}function L(t){t.updateFromBindings(!0);}function D(t){for(var e=t.length;e--;)if(t[e].bound){var n=t[e].owner;if(n){var i="checked"===n.name?n.node.checked:n.node.value;return {value:i}}}}function F(t){if(t){var e=ko[t];ko[t]=[];for(var n=e.length;n--;)e[n]();var i=_o[t];for(_o[t]=[],n=i.length;n--;)i[n].model.register(i[n].item);}else F("early"),F("mark");}function z(t,e,n,i){t.shuffling=!0;for(var r=e.length;r--;){var s=e[r];r!==s&&r in t.childByKey&&t.childByKey[r].rebind(~s?t.joinKey(s):void 0,t.childByKey[r],!i);}var a=t.source().length!==t.source().value.length;for(t.links.forEach(function(t){return t.shuffle(e)}),n||F("early"),r=t.deps.length;r--;)t.deps[r].shuffle&&t.deps[r].shuffle(e);t[n?"marked":"mark"](),n||F("mark"),a&&t.notifyUpstream(),t.shuffling=!1;}function U(t,e){e!==t.dataModel&&(e&&e.viewmodel&&e.viewmodel.isRoot&&t.childByKey.data?(t.childByKey.data.link(e.viewmodel,"data"),t.dataModel=e):t.dataModel&&(t.childByKey.data.unlink(),t.dataModel=!0));}function $(){Oo.push(So=[]);}function q(){var t=Oo.pop();return So=Oo[Oo.length-1],t}function H(t){So&&S(So,t);}function Z(t){t.bind();}function W(t){t.cancel();}function G(t){t.destroyed();}function Q(t){t.handleChange();}function Y(t){t.mark();}function J(t){t.mark(!0);}function X(t){t.marked();}function tt(t){t.markedAll();}function et(t){t.render();}function nt(t){t.shuffled();}function it(t){t.teardown();}function rt(t){t.unbind();}function st(t){t.unrender();}function at(t){t.update();}function ot(t){return t.toString()}function ut(t){return t.toString(!0)}function ht(t,e,n,i){var r=t.r||t;if(!r||!h(r))return e;if("."===r||"@"===r[0]||(e||n).isKey||(e||n).isKeypath)return e;var s=r.split("/"),a=A(s[s.length-1]),o=a[a.length-1],u=e||n;u&&1===a.length&&o!==u.key&&i&&(a=lt(o,i)||a);for(var l=a.length,c=!0,f=!1;u&&l--;)u.shuffling&&(f=!0),a[l]!=u.key&&(c=!1),u=u.parent;return !e&&c&&f?n:e&&!c&&f?n:e}function lt(t,e){for(;e;){var n=e.aliases;if(n&&n[t]){for(var i=(e.owner.iterations?e.owner:e).owner.template.z,r=0;r<i.length;r++)if(i[r].n===t){var s=i[r].x;if(!s.r)return !1;var a=s.r.split("/");return A(a[a.length-1])}return}e=e.componentParent||e.parent;}}function ct(t,e){void 0===e&&(e=0);for(var n=new Array(e);e--;)n[e]="_"+e;return new Function([],"return function ("+n.join(",")+"){return("+t+");};")()}function ft(t,e){return To[t]?To[t]:To[t]=Be(t,e)}function dt(t){if(t){var e=t.e;e&&La(e).forEach(function(t){To[t]||(To[t]=e[t]);});}}function pt(t){if(!t.matchString("="))return null;var e=t.pos;t.sp();var n=t.matchPattern(Vu);if(!n)return t.pos=e,null;if(!t.matchPattern(Mu))return null;var i=t.matchPattern(Vu);return i?(t.sp(),t.matchString("=")?[n,i]:(t.pos=e,null)):(t.pos=e,null)}function mt(t){var e;return (e=t.matchPattern(Pu))?{t:ou,v:e}:null}function vt(t){return t.replace(Iu,"\\$&")}function gt(t,e){return t.search(Ru[e.join()]||(Ru[e.join()]=new RegExp(e.map(vt).join("|"))))}function yt(t){return t.replace(Fu,function(t,e){var n;return n="#"!==e[0]?Lu[e]:"x"===e[1]?parseInt(e.substring(2),16):parseInt(e.substring(1),10),n?Uu(wt(n)):t})}function bt(t){return t.replace(Hu,"&amp;").replace($u,"&lt;").replace(qu,"&gt;")}function wt(t){return t?10===t?32:128>t?t:159>=t?Du[t-128]:55296>t?t:57343>=t?Zu:65535>=t?t:zu?t>=65536&&131071>=t?t:t>=131072&&196607>=t?t:Zu:Zu:Zu}function xt(t){var e;return (e=t.matchPattern(Qu))?{t:nu,v:e}:null}function kt(t){var e=t.remaining();return "true"===e.substr(0,4)?(t.pos+=4,{t:au,v:"true"}):"false"===e.substr(0,5)?(t.pos+=5,{t:au,v:"false"}):null}function _t(t){return function(e){for(var n,i='"',r=!1;!r;)n=e.matchPattern(Yu)||e.matchPattern(Ju)||e.matchString(t),n?i+='"'===n?'\\"':"\\'"===n?"'":n:(n=e.matchPattern(Xu),n?i+="\\u"+("000"+n.charCodeAt(1).toString(16)).slice(-4):r=!0);return i+='"',JSON.parse(i)}}function Et(t){var e=t.pos,n=t.matchString("'")||t.matchString('"');if(n){var i=("'"===n?th:eh)(t);return t.matchString(n)?{t:iu,v:i}:(t.pos=e,null)}return null}function At(t){return JSON.parse('"'+t.replace(ih,Ct)+'"')}function Ct(t){switch(t){case"\n":return "\\n";case"\r":return "\\r";case"	":return "\\t";case"\b":return "\\b";case"\f":return "\\f"}}function St(t){if(!t.matchString("`"))return null;for(var e,n="",i=!1,r=[];!i;)if(e=t.matchPattern(nh)||t.matchPattern(Ju)||t.matchString("$")||t.matchString('"'))if('"'===e)n+='\\"';else if("\\`"===e)n+="`";else if("$"===e)if(t.matchString("{")){r.push({t:iu,v:At(n)}),n="",t.sp();var s=Dt(t);s||t.error("Expected valid expression"),r.push({t:pu,x:s}),t.sp(),t.matchString("}")||t.error("Expected closing '}' after interpolated expression");}else n+="$";else n+=e;else e=t.matchPattern(Xu),e?n+="\\u"+("000"+e.charCodeAt(1).toString(16)).slice(-4):i=!0;if(n.length&&r.push({t:iu,v:At(n)}),t.matchString("`")||t.error("Expected closing '`'"),r.length){if(1===r.length)return r[0];for(var a,o=r.pop();a=r.pop();)o={t:vu,s:"+",o:[a,o]};return {t:pu,x:o}}return {t:iu,v:""}}function Ot(t){var e;return (e=Et(t))?uh.test(e.v)?e.v:'"'+e.v.replace(/"/g,'\\"')+'"':(e=xt(t))?e.v:(e=t.matchPattern(rh))?e:null}function jt(t){var e,n=t.pos;t.sp();var i="'"!==t.nextChar()&&'"'!==t.nextChar();i&&(e=t.matchPattern(sh));var r=e?Dt(t):Ot(t);if(null===r)return t.pos=n,null;if(t.sp(),i&&(","===t.nextChar()||"}"===t.nextChar())){e||rh.test(r)||t.error("Expected a valid reference, but found '"+r+"' instead.");var s={t:hu,k:r,v:{t:lu,n:r}};return e&&(s.p=!0),s}if(!t.matchString(":"))return t.pos=n,null;t.sp();var a=Dt(t);return null===a?(t.pos=n,null):{t:hu,k:r,v:a}}function Nt(t){var e=t.pos,n=jt(t);if(null===n)return null;var i=[n];if(t.matchString(",")){var r=Nt(t);return r?i.concat(r):(t.pos=e,null)}return i}function Tt(t){var e=t.pos;if(t.sp(),!t.matchString("{"))return t.pos=e,null;var n=Nt(t);return t.sp(),t.matchString("}")?{t:su,m:n}:(t.pos=e,null)}function Vt(t){var e=t.pos;if(t.sp(),!t.matchString("["))return t.pos=e,null;var n=Ft(t,!0);return t.matchString("]")?{t:ru,m:n}:(t.pos=e,null)}function Mt(t){return xt(t)||kt(t)||Et(t)||St(t)||Tt(t)||Vt(t)||mt(t)}function Pt(t){var e,n,i,r,s,a=t.pos;e=t.matchPattern(ch)||"",n=!e&&t.relaxedNames&&t.matchPattern(oh)||t.matchPattern(ah);var o=e.length+(n&&n.length||0);if("@."===e&&(e="@",n=n?"this."+n:"this"),!n&&e&&(n=e,e=""),!n)return null;if("@"===e)if(fh.test(n))if(n.indexOf("event")&&n.indexOf("node")||t.inEvent){if(!n.indexOf("context"))return t.pos=t.pos-(n.length-7),{t:pu,x:{t:lu,n:"@context"}}}else t.error("@event and @node are only valid references within an event directive");else t.error("Unrecognized special reference @"+n);if(!e&&!t.relaxedNames&&lh.test(n))return t.pos=a,null;if(!e&&hh.test(n))return i=hh.exec(n)[0],t.pos=a+i.length,{t:uu,v:i};if(r=(e||"")+E(n),t.matchString("("))if(s=r.lastIndexOf("."),-1!==s&&"]"!==n[n.length-1])if(0===s)r=".",t.pos=a;else {var u=r.length;r=r.substr(0,s),t.pos=a+(o-(u-s));}else t.pos-=1;return {t:lu,n:r.replace(/^this\./,"./").replace(/^this$/,".")}}function It(t){if(!t.matchString("("))return null;t.sp();var e=Dt(t);return e||t.error(Wu),t.sp(),t.matchString(")")||t.error(Gu),{t:pu,x:e}}function Rt(t){return Mt(t)||Pt(t)||It(t)}function Bt(t){if(t.strictRefinement||t.sp(),t.matchString(".")){t.sp();var e=t.matchPattern(rh);if(e)return {t:cu,n:e};t.error("Expected a property name");}if(t.matchString("[")){t.sp();var n=Dt(t);return n||t.error(Wu),t.sp(),t.matchString("]")||t.error("Expected ']'"),{t:cu,x:n}}return null}function Kt(t){var e=Rt(t);if(!e)return null;for(;e;){var n=Bt(t);if(n)e={t:fu,x:e,r:n};else {if(!t.matchString("("))break;t.sp();var i=Ft(t,!0);t.sp(),t.matchString(")")||t.error(Gu),e={t:gu,x:e},i&&(e.o=i);}}return e}function Lt(t){var e=gh(t);if(!e)return null;var n=t.pos;if(t.sp(),!t.matchString("?"))return t.pos=n,e;t.sp();var i=Dt(t);i||t.error(Wu),t.sp(),t.matchString(":")||t.error('Expected ":"'),t.sp();var r=Dt(t);return r||t.error(Wu),{t:mu,o:[e,i,r]}}function Dt(t){if(t.allowExpressions===!1){var e=Pt(t);return t.sp(),e}return Lt(t)}function Ft(t,e){var n,i=[],r=t.pos;do{t.sp(),e&&(n=t.matchPattern(sh));var s=Dt(t);if(null===s&&i.length)t.error(Wu);else if(null===s)return t.pos=r,null;n&&(s.p=!0),i.push(s),t.sp();}while(t.matchString(","));return i}function zt(t,e){var n=t.pos,i=Dt(t);if(!i){var r=t.matchPattern(/^(\w+)/);return r?{t:lu,n:r}:null}for(var s=0;s<e.length;s+=1)if(t.remaining().substr(0,e[s].length)===e[s])return i;return t.pos=n,Pt(t)}function Ut(t){function e(t){for(var e=[],n=a-1;n>=0;n--)e.push("x$"+n);return e.length?"(function(){var "+e.join(",")+";return("+t+");})()":t}function n(t){if(h(t))return t;switch(t.t){case au:case uu:case nu:case ou:return t.v;case iu:return JSON.stringify(String(t.v));case ru:return t.m&&$t(t.m)?"[].concat("+r(t.m,"[","]",n)+")":"["+(t.m?t.m.map(n).join(","):"")+"]";case su:return t.m&&$t(t.m)?"Object.assign({},"+r(t.m,"{","}",i)+")":"{"+(t.m?t.m.map(function(t){return t.k+":"+n(t.v)}).join(","):"")+"}";case du:return ("typeof"===t.s?"typeof ":t.s)+n(t.o);case vu:return n(t.o[0])+("in"===t.s.substr(0,2)?" "+t.s+" ":t.s)+n(t.o[1]);case gu:if(t.o&&$t(t.o)){var e=a++;return "(x$"+e+"="+n(t.x)+").apply(x$"+e+","+n({t:ru,m:t.o})+")"}return n(t.x)+"("+(t.o?t.o.map(n).join(","):"")+")";case pu:return "("+n(t.x)+")";case fu:return n(t.x)+n(t.r);case cu:return t.n?"."+t.n:"["+n(t.x)+"]";case mu:return n(t.o[0])+"?"+n(t.o[1])+":"+n(t.o[2]);case lu:return "_"+s.indexOf(t.n);default:throw new Error("Expected legal JavaScript")}}function i(t){return t.p?n(t.k):t.k+":"+n(t.v)}function r(t,e,n,i){var r=t.reduce(function(t,r){return r.p?t.str+=""+(t.open?n+",":t.str.length?",":"")+i(r):t.str+=""+(t.str.length?t.open?",":","+e:e)+i(r),t.open=!r.p,t},{open:!1,str:""});return r.open&&(r.str+=n),r.str}var s,a=0;qt(t,s=[]);var o=n(t);return {r:s,s:e(o)}}function $t(t){for(var e=0;e<t.length;e++)if(t[e].p)return !0;return !1}function qt(t,e){t.t===lu&&h(t.n)&&(~e.indexOf(t.n)||e.unshift(t.n));var n=t.o||t.m;if(n)if(s(n))qt(n,e);else for(var i=n.length;i--;)qt(n[i],e);t.k&&t.t===hu&&!h(t.k)&&qt(t.k,e),t.x&&qt(t.x,e),t.r&&qt(t.r,e),t.v&&qt(t.v,e);}function Ht(t,e){var n;if(t){for(;t.t===pu&&t.x;)t=t.x;if(t.t===lu){var i=t.n;~i.indexOf("@context")?e.x=Ut(t):e.r=t.n;}else (n=Zt(t))?e.rx=n:e.x=Ut(t);return e}}function Zt(t){for(var e,n=[];t.t===fu&&t.r.t===cu;)e=t.r,e.x?e.x.t===lu?n.unshift(e.x):n.unshift(Ut(e.x)):n.unshift(e.n),t=t.x;return t.t!==lu?null:{r:t.n,m:n}}function Wt(t){for(var e=[],n=0,i=0;i<t.length;i++)"-"===t[i]&&"\\"!==t[i-1]&&(e.push(t.substring(n,i).replace(jh,"")),n=i+1);return e.push(t.substring(n).replace(jh,"")),e}function Gt(t){var e,n,i,r;if(t.sp(),e=t.matchPattern(yh),!e)return null;for(i=e.length,n=0;n<t.tags.length;n++)~(r=e.indexOf(t.tags[n].open))&&i>r&&(i=r);return i<e.length&&(t.pos-=e.length-i,e=e.substr(0,i),!e)?null:{n:e}}function Qt(t){var e=t.pos;if(/[=\/>\s]/.test(t.nextChar())||t.error("Expected `=`, `/`, `>` or whitespace"),t.sp(),!t.matchString("="))return t.pos=e,null;t.sp();var n=t.pos,i=t.sectionDepth,r=Xt(t,"'")||Xt(t,'"')||Jt(t);return null===r&&t.error("Expected valid attribute value"),t.sectionDepth!==i&&(t.pos=n,t.error("An attribute value must contain as many opening section tags as closing section tags")),r.length?1===r.length&&h(r[0])?yt(r[0]):r:""}function Yt(t){var e,n,i=t.pos;if(e=t.matchPattern(Ch),!e)return null;var r=e,s=t.tags.map(function(t){return t.open});return -1!==(n=gt(r,s))&&(e=e.substr(0,n),t.pos=i+e.length),e}function Jt(t){t.inAttribute=!0;for(var e=[],n=re(t)||Yt(t);n;)e.push(n),n=re(t)||Yt(t);return e.length?(t.inAttribute=!1,e):null}function Xt(t,e){var n=t.pos;if(!t.matchString(e))return null;t.inAttribute=e;for(var i=[],r=re(t)||te(t,e);null!==r;)i.push(r),r=re(t)||te(t,e);return t.matchString(e)?(t.inAttribute=!1,i):(t.pos=n,null)}function te(t,e){var n=t.remaining(),i=t.tags.map(function(t){return t.open});i.push(e);var r=gt(n,i);return -1===r&&t.error("Quoted attribute value must have a closing quote"),r?(t.pos+=r,n.substr(0,r)):null}function ee(t){var e,n,i=Gt(t);if(!i)return null;if(n=Ah[i.n])i.t=n.t,n.v&&(i.v=n.v),delete i.n,t.sp(),"="===t.nextChar()&&(i.f=Qt(t));else if(e=kh.exec(i.n))i.n=e[1],i.t=Ou,ie(t,i);else if(e=_h.exec(i.n))i.n=e[1],i.t=ju,ie(t,i),i.v="in-out"===e[2]?"t0":"in"===e[2]?"t1":"t2";else if(e=wh.exec(i.n))i.n=Wt(e[1]),i.t=Su,t.matchString("(")&&(i.a=Ut({t:ru,m:Ft(t)}),t.matchString(")")||t.error("Expected closing ')'")),t.inEvent=!0,ne(t,i)?xh.test(i.f)&&(t.pos-=i.f.length,t.error("Cannot use reserved event names (change, reset, teardown, update, construct, config, init, render, unrender, complete, detach, insert, destruct, attachchild, detachchild)")):ie(t,i,!0),t.inEvent=!1;else if(e=Eh.exec(i.n)){var r="bind"===e[2];i.n=r?e[3]:e[1],i.t=Wo,ie(t,i,!1,!0),!i.f&&r&&(i.f=[{t:Ko,r:e[3]}]);}else {t.sp();var s="="===t.nextChar()?Qt(t):null;if(i.f=null!=s?s:i.f,t.sanitizeEventAttributes&&bh.test(i.n))return {exclude:!0};i.f=i.f||(""===i.f?"":0),i.t=Wo;}return i}function ne(t,e){var n=t.pos;t.matchString("=")||t.error("Missing required directive arguments");var i=t.matchString("'")||t.matchString('"');t.sp();var r=t.matchPattern(Sh);if(void 0!==r)if(i){if(t.sp(),t.matchString(i))return (e.f=r)||!0;t.pos=n;}else {if(t.matchPattern(Oh))return (e.f=r)||!0;t.pos=n;}else t.pos=n;}function ie(t,e,n,i){if(void 0===n&&(n=!1),void 0===i&&(i=!1),t.sp(),!t.matchString("="))return void(n&&t.error("Missing required directive arguments"));t.sp();var r=t.matchString('"')||t.matchString("'"),s=t.spreadArgs;t.spreadArgs=!0,t.inUnquotedAttribute=!r;var a=i?zt(t,[r||" ","/",">"]):{m:Ft(t),t:ru};if(t.inUnquotedAttribute=!1,t.spreadArgs=s,r&&(t.sp(),t.matchString(r)!==r&&t.error("Expected matching quote '"+r+"'")),i){var o={t:Ko};Ht(a,o),e.f=[o];}else e.f=Ut(a);}function re(t){var e,n;if(t.interpolate[t.inside]===!1)return null;for(n=0;n<t.tags.length;n+=1)if(e=se(t,t.tags[n]))return e;return t.inTag&&!t.inAttribute&&(e=ee(t))?(t.sp(),e):void 0}function se(t,e){var n,i,r,s=t.pos;if(t.matchString("\\"+e.open)){if(0===s||"\\"!==t.str[s-1])return e.open}else if(!t.matchString(e.open))return null;if(n=pt(t))return t.matchString(e.close)?(e.open=n[0],e.close=n[1],t.sortMustacheTags(),Nh):null;if(t.sp(),t.matchString("/")){t.pos-=1;var a=t.pos;if(mt(t))t.pos=a;else {if(t.pos=a-e.close.length,t.inAttribute)return t.pos=s,null;t.error("Attempted to close a section that wasn't open");}}for(r=0;r<e.readers.length;r+=1)if(i=e.readers[r],n=i(t,e))return e.isStatic&&(n.s=1),t.includeLinePositions&&(n.q=t.getLinePos(s)),n;return t.pos=s,null}function ae(t,e){var n=Dt(t);if(!n)return null;t.matchString(e.close)||t.error("Expected closing delimiter '"+e.close+"'");var i={t:Lo};return Ht(n,i),i}function oe(t,e){if(!t.matchString("&"))return null;t.sp();var n=Dt(t);if(!n)return null;t.matchString(e.close)||t.error("Expected closing delimiter '"+e.close+"'");var i={t:Lo};return Ht(n,i),i}function ue(t){var e,n=[],i=t.pos;if(t.sp(),e=he(t)){for(e.x=Ht(e.x,{}),n.push(e),t.sp();t.matchString(",");)e=he(t),e||t.error("Expected another alias."),e.x=Ht(e.x,{}),n.push(e),t.sp();return n}return t.pos=i,null}function he(t){var e=t.pos;t.sp();var n=Dt(t);if(!n)return t.pos=e,null;t.sp(),t.matchPattern(Vh),t.sp();var i=t.matchPattern(Th);return i?{n:i,x:n}:(t.pos=e,null)}function le(t,e){var n,i=t.matchString(">")||t.matchString("yield"),r={t:">"===i?$o:Yo};if(!i)return null;if(t.sp(),">"===i||!(n=t.matchString("with"))){t.relaxedNames=t.strictRefinement=!0;var s=Dt(t);if(t.relaxedNames=t.strictRefinement=!1,!s&&">"===i)return null;s&&(Ht(s,r),t.sp(),">"!==i&&(n=t.matchString("with")));}if(t.sp(),n||">"===i){if(n=ue(t),n&&n.length)r.z=n;else {var a=Dt(t);a&&(r.c={},Ht(a,r.c)),t.matchString(",")&&(n=ue(t),n&&n.length&&(r.z=n));}">"===i||r.c||r.z||t.error("Expected a context or one or more aliases");}return t.sp(),t.matchString(e.close)||t.error("Expected closing delimiter '"+e.close+"'"),r}function ce(t,e){if(!t.matchString("!"))return null;var n=t.remaining().indexOf(e.close);return -1!==n?(t.pos+=n+e.close.length,{t:qo}):void 0}function fe(t,e){var n,i,r=t.pos;try{n=zt(t,[e.close]);}catch(s){i=s;}if(!n){if("!"===t.str.charAt(r))return t.pos=r,null;if(i)throw i}if(!t.matchString(e.close)&&(t.error("Expected closing delimiter '"+e.close+"' after reference"),!n)){if("!"===t.nextChar())return null;t.error("Expected expression or legal reference");}var a={t:Ko};return Ht(n,a),a}function de(t,e){var n=t.pos;if(!t.matchString(e.open))return null;if(t.sp(),!t.matchString("/"))return t.pos=n,null;t.sp();var i=t.remaining(),r=i.indexOf(e.close);if(-1!==r){var s={t:zo,r:i.substr(0,r).split(" ")[0]};return t.pos+=r,t.matchString(e.close)||t.error("Expected closing delimiter '"+e.close+"'"),s}return t.pos=n,null}function pe(t,e,n){var i=t.pos;if(!t.matchString(e.open))return null;if(!t.matchPattern(Mh[n]))return t.pos=i,null;var r={t:Ph[n]};if("elseif"===n)r.x=Dt(t);else if("catch"===n||"then"===n){var s=t.matchPattern(rh);s&&(r.n=s);}return t.matchString(e.close)||t.error("Expected closing delimiter '"+e.close+"'"),r}function me(t,e){var n,i,r,s,a,o,u,h,l,c,f,d,p,m=!1,v=t.pos;if(t.matchString("^")){if(t.matchString("^/"))return t.pos=v,null;i={t:Do,f:[],n:bu};}else {if(!t.matchString("#"))return null;i={t:Do,f:[]},t.matchString("partial")&&(t.pos=v-t.standardDelimiters[0].length,t.error("Partial definitions can only be at the top level of the template, or immediately inside components")),(o=t.matchString("await"))?(c=o,i.t=eu):(o=t.matchPattern(Kh))&&(c=o,i.n=Ih[o]);}if(t.sp(),"with"===o){var g=ue(t);g&&(m=!0,i.z=g,i.t=tu);}else if("each"===o){var y=he(t);y&&(i.z=[{n:y.n,x:{r:"."}}],n=y.x);}if(!m){if(n||(n=Dt(t)),n||t.error("Expected expression"),"each"===o&&t.matchString(",")){var b=ue(t);b&&(i.z&&b.unshift(i.z[0]),i.z=b);}if("each"!==o&&o||!(l=t.matchPattern(Rh)))"await"===o&&t.matchString("then")&&(t.sp(),f=!0,p=t.matchPattern(rh),p||(p=!0));else {var w;(w=t.matchPattern(Bh))?i.i=l+","+w:i.i=l;}!o&&n.n&&(c=n.n);}t.sp(),t.matchString(e.close)||t.error("Expected closing delimiter '"+e.close+"'"),t.sectionDepth+=1,s=i.f;var x;do if(x=t.pos,r=de(t,e))c&&r.r!==c&&(o?(t.pos=x,t.error("Expected "+e.open+"/"+c+e.close)):r.r&&t.warn("Expected "+e.open+"/"+c+e.close+" but found "+e.open+"/"+r.r+e.close)),t.sectionDepth-=1,h=!0;else if(!m&&((r=pe(t,e,"elseif"))||(r=pe(t,e,"else"))||"await"===o&&((r=pe(t,e,"then"))||(r=pe(t,e,"catch"))))){if(i.n===bu&&t.error("{{else}} not allowed in {{#unless}}"),a&&(r.t===_u?t.error("there can only be one {{else}} block, at the end of a section"):r.t===Eu&&t.error("illegal {{elseif...}} after {{else}}")),!u&&(p||!f)&&!d)if("await"===o){var k={f:s};i.f=[k],p?(k.t=Au,p!==!0&&(k.n=p)):k.t=Do;}else u=[];var _={t:Do,f:s=[]};r.t===_u?("await"===o?(i.f.push(_),_.t=_u):(_.n=bu,u.push(_)),a=!0):r.t===Eu?(_.n=yu,Ht(r.x,_),u.push(_)):r.t===Au?(a&&t.error("{{then}} block must appear before any {{else}} block"),d&&t.error("{{then}} block must appear before any {{catch}} block"),f&&t.error("there can only be one {{then}} block per {{#await}}"),_.t=Au,f=!0,r.n&&(_.n=r.n),i.f.push(_)):r.t===Cu&&(a&&t.error("{{catch}} block must appear before any {{else}} block"),d&&t.error("there can only be one {{catch}} block per {{#await}}"),_.t=Cu,d=!0,_.n=r.n,i.f.push(_));}else {if(r=t.read(al),!r)break;s.push(r);}while(!h);if(u&&(i.l=u),m||Ht(n,i),"await"===o&&(p||!f)&&!d&&!a){var E={f:i.f};i.f=[E],p?(E.t=Au,p!==!0&&(E.n=p)):E.t=Do;}return i.f.length||delete i.f,i}function ve(t){var e=t.pos;if(t.textOnlyMode||!t.matchString(Lh))return null;var n=t.remaining(),i=n.indexOf(Dh);-1===i&&t.error("Illegal HTML - expected closing comment sequence ('-->')");var r=n.substr(0,i);t.pos+=i+3;var s={t:qo,c:r};return t.includeLinePositions&&(s.q=t.getLinePos(e)),s}function ge(t){var e,n,i,r,s;for(e=1;e<t.length;e+=1)n=t[e],i=t[e-1],r=t[e-2],h(n)&&ye(i)&&h(r)&&zh.test(r)&&Fh.test(n)&&(t[e-2]=r.replace(zh,"\n"),t[e]=n.replace(Fh,"")),be(n)&&h(i)&&zh.test(i)&&h(n.f[0])&&Fh.test(n.f[0])&&(t[e-1]=i.replace(zh,"\n"),n.f[0]=n.f[0].replace(Fh,"")),h(n)&&be(i)&&(s=T(i.f),h(s)&&zh.test(s)&&Fh.test(n)&&(i.f[i.f.length-1]=s.replace(zh,"\n"),t[e]=n.replace(Fh,"")));return t}function ye(t){return t.t===qo||t.t===Ho}function be(t){return (t.t===Do||t.t===Fo)&&t.f}function we(t,e,n){var i;e&&(i=t[0],h(i)&&(i=i.replace(e,""),i?t[0]=i:t.shift())),n&&(i=T(t),h(i)&&(i=i.replace(n,""),i?t[t.length-1]=i:t.pop()));}function xe(t,e,n,i,r,s){if(!h(t)){var a,o,u,l,c,f,d;for(ge(t),a=t.length;a--;)o=t[a],o.exclude?t.splice(a,1):e&&o.t===qo&&t.splice(a,1);for(we(t,i?$h:null,r?qh:null),a=t.length;a--;){if(o=t[a],f=d=!1,o.f){var p=o.t===Uo&&(s[o.e.toLowerCase()]||s[o.e]);c=n||p,!n&&p&&we(o.f,Hh,Zh),c||(u=t[a-1],l=t[a+1],(!u||h(u)&&qh.test(u))&&(f=!0),(!l||h(l)&&$h.test(l))&&(d=!0)),xe(o.f,e,c,f,d,s);}o.l&&(xe(o.l,e,n,f,d,s),o.l.forEach(function(t){return t.l=1}),o.l.unshift(a+1,0),t.splice.apply(t,o.l),delete o.l),o.m&&(xe(o.m,e,n,f,d,s),o.m.length<1&&delete o.m);}for(a=t.length;a--;)h(t[a])&&(h(t[a+1])&&(t[a]=t[a]+t[a+1],t.splice(a+1,1)),n||(t[a]=t[a].replace(Uh," ")),""===t[a]&&t.splice(a,1));}}function ke(t){var e,n=t.pos;return t.matchString("</")?(e=t.matchPattern(Wh))?t.inside&&e!==t.inside?(t.pos=n,null):{t:Go,e:e}:(t.pos-=2,void t.error("Illegal closing tag")):null}function _e(t){return t.replace(/([A-Z])/g,function(t,e){return "-"+e.toLowerCase()})}function Ee(t){var e,n,i,r,s,a,o,u,l,c,f,d=t.pos;if(t.inside||t.inAttribute||t.textOnlyMode)return null;if(!t.matchString("<"))return null;if("/"===t.nextChar())return null;var p={};if(t.includeLinePositions&&(p.q=t.getLinePos(d)),t.matchString("!"))return p.t=Xo,t.matchPattern(/^doctype/i)||t.error("Expected DOCTYPE declaration"),p.a=t.matchPattern(/^(.+?)>/),p;if(f=t.matchString("#"))t.sp(),p.t=Zo,p.n=t.matchPattern(Qh);else if(p.t=Uo,p.e=t.matchPattern(Gh),!p.e)return null;for(Yh.test(t.nextChar())||t.error("Illegal tag name"),t.sp(),t.inTag=!0;e=re(t);)e!==!1&&(p.m||(p.m=[]),p.m.push(e)),t.sp();if(t.inTag=!1,t.sp(),t.matchString("/")&&(n=!0),!t.matchString(">"))return null;var m=(p.e||p.n).toLowerCase(),v=t.preserveWhitespace;if(!n&&(f||!Ku[p.e.toLowerCase()])){f||(t.elementStack.push(m),m in t.interpolate&&(t.inside=m)),i=[],r=Ra(null);do{if(u=t.pos,l=t.remaining(),!l){if("script"===t.inside){o=!0;break}t.error("Missing end "+(t.elementStack.length>1?"tags":"tag")+" ("+t.elementStack.reverse().map(function(t){return "</"+t+">"}).join("")+")");}if(f||Ae(m,l))if(!f&&(c=ke(t))){o=!0;var g=c.e.toLowerCase();if(g!==m&&(t.pos=u,!~t.elementStack.indexOf(g))){var y="Unexpected closing tag";Ku[g.toLowerCase()]&&(y+=" (<"+g+"> is a void element - it cannot contain children)"),t.error(y);}}else if(f&&Ce(t,p.n))o=!0;else {var b={open:t.standardDelimiters[0],close:t.standardDelimiters[1]};de(t,b)||Se(t,b)?(o=!0,t.pos=u):(a=t.read(ol))?(r[a.n]&&(t.pos=u,t.error("Duplicate partial definition")),xe(a.f,t.stripComments,v,!v,!v,t.whiteSpaceElements),r[a.n]=a.f,s=!0):(a=t.read(al))?i.push(a):o=!0;}else o=!0;}while(!o);i.length&&(p.f=i),s&&(p.p=r),t.elementStack.pop();}if(t.inside=null,t.sanitizeElements&&-1!==t.sanitizeElements.indexOf(m))return Xh;if(p.m&&"input"!==m&&"select"!==m&&"textarea"!==m&&"option"!==m){for(var w,x,k,_,E,A=p.m,C=0;C<A.length;)E=A[C],E.t===Wo?0!==E.n.indexOf("class-")||E.f?0===E.n.indexOf("style-")&&h(E.f)?((x||(x=[])).push(_e(E.n.slice(6))+": "+E.f+";"),A.splice(C,1)):"class"===E.n&&h(E.f)?((w||(w=[])).push(E.f),A.splice(C,1)):"style"===E.n&&h(E.f)?((x||(x=[])).push(E.f+(Jh.test(E.f)?"":";")),A.splice(C,1)):"class"===E.n?(k=E,C++):"style"===E.n?(_=E,C++):!~E.n.indexOf(":")&&"value"!==E.n&&"contenteditable"!==E.n&&h(E.f)?(E.g=1,C++):C++:((w||(w=[])).push(E.n.slice(6)),A.splice(C,1)):C++;w?k&&h(k.f)?k.f+=" "+w.join(" "):A.unshift({t:Wo,n:"class",f:w.join(" "),g:1}):k&&h(k.f)&&(k.g=1),x?_&&h(_.f)?_.f+="; "+x.join(" "):A.unshift({t:Wo,n:"style",f:x.join(" "),g:1}):_&&h(_.f)&&(_.g=1);}return p}function Ae(t,e){var n=/^<([a-zA-Z][a-zA-Z0-9]*)/.exec(e),i=tl[t];return n&&i?!~i.indexOf(n[1].toLowerCase()):!0}function Ce(t,e){var n=t.pos;return t.matchString("</")?(t.matchString("#"),t.sp(),t.matchString(e)?(t.sp(),t.matchString(">")?!0:(t.pos=n,null)):(t.pos=n,null)):null}function Se(t,e){var n=t.pos;if(t.matchString(e.open))return t.matchPattern(el)?!0:void(t.pos=n)}function Oe(t){var e,n,i,r=t.remaining();return t.textOnlyMode?(n=t.tags.map(function(t){return t.open}),n=n.concat(t.tags.map(function(t){return "\\"+t.open})),e=gt(r,n)):(i=t.inside?"</"+t.inside:"<",t.inside&&!t.interpolate[t.inside]?e=r.indexOf(i):(n=t.tags.map(function(t){return t.open}),n=n.concat(t.tags.map(function(t){return "\\"+t.open})),t.inAttribute===!0?n.push('"',"'","=","<",">","`"):t.inAttribute?n.push(t.inAttribute):n.push(i),e=gt(r,n))),e?(-1===e&&(e=r.length),t.pos+=e,t.inside&&"textarea"!==t.inside||t.textOnlyMode?r.substr(0,e):yt(r.substr(0,e))):null}function je(t){var e,n,i=t.pos,r=t.standardDelimiters;if(!t.matchString(r[0]))return null;if(!t.matchPattern(nl))return t.pos=i,null;var s=t.matchPattern(/^[a-zA-Z_$][a-zA-Z_$0-9\-\/]*/);s||t.error("expected legal partial name"),t.sp(),t.matchString(r[1])||t.error("Expected closing delimiter '"+r[1]+"'");var a=[],o=r[0],u=r[1];do(e=de(t,{open:o,close:u}))?("partial"!==e.r&&t.error("Expected "+o+"/partial"+u),n=!0):(e=t.read(al),e||t.error("Expected "+o+"/partial"+u),a.push(e));while(!n);return {t:Jo,n:s,f:a}}function Ne(t){for(var e=[],n=Ra(null),i=!1,r=t.preserveWhitespace;t.pos<t.str.length;){var s=t.pos,a=void 0,o=void 0;(o=t.read(ol))?(n[o.n]&&(t.pos=s,t.error("Duplicated partial definition")),xe(o.f,t.stripComments,r,!r,!r,t.whiteSpaceElements),n[o.n]=o.f,i=!0):(a=t.read(al))?e.push(a):t.error("Unexpected template content");}var u={v:Vo,t:e};return i&&(u.p=n),u}function Te(t,e){La(t).forEach(function(n){if(Ve(n,t))return Me(t,e);var i=t[n];Pe(i)&&Te(i,e);});}function Ve(t,e){return "s"===t&&Fa(e.r)}function Me(t,e){var n=t.s,i=t.r;e[n]||(e[n]=ct(n,i.length));}function Pe(t){return Fa(t)||s(t)}function Ie(t,e){return new ll(t,e||{}).result}function Re(t,e,n){t||p("Missing Ractive.parse - cannot parse "+e+". "+n);}function Be(t,e){return Re(ct,"new expression function",fl),ct(t,e)}function Ke(t,e){Re(Ie,'compution string "${str}"',dl);var n=Ie(t,{expression:!0});return function(){return n.e.apply(e,n.r.map(function(t){return e.get(t)}))}}function Le(t,e,n){var i,r,s,a,l;return u(n)&&(i=B(n,t),s=n.toString(),a=!0),h(n)&&(i=Ke(n,t),s=n),o(n)&&(h(n.get)?(i=Ke(n.get,t),s=n.get):u(n.get)?(i=B(n.get,t),s=n.get.toString(),a=!0):p("`%s` computation must have a `get()` method",e),u(n.set)&&(r=B(n.set,t),l=n.set.toString())),{getter:i,setter:r,getterString:s,setterString:l,getterUseStack:a}}function De(t){!t.started||t.outros.length||t.outroChildren||(t.outrosComplete||(t.outrosComplete=!0,t.parent&&t.parent.decrementOutros(t),Fe(t)&&t.detachNodes()),t.intros.length||t.totalChildren||(u(t.callback)&&t.callback(),t.parent&&!t.notifiedTotal&&(t.notifiedTotal=!0,t.parent.decrementTotal())));}function Fe(t){return !t||t.outrosComplete&&Fe(t.parent)}function ze(t){var e=t.detachQueue,n=Ue(t);if(n.length){var i,r,s=e.length,a=0,o=t.detachQueue=[];t:for(;s--;){for(i=e[s].node,a=n.length;a--;)if(r=n[a].element.node,r===i||r.contains(i)||i.contains(r)){o.push(e[s]);continue t}e[s].detach();}}else t.detachNodes();}function Ue(t,e){var n=e;if(n){for(var i=t.children.length;i--;)n=Ue(t.children[i],n);return t.outros.length&&(n=n.concat(t.outros)),n}n=[];for(var r=t;r.parent;)r=r.parent;return Ue(r,n)}function $e(t){t.dispatch();}function qe(){var t=yl.immediateObservers;yl.immediateObservers=[],t.forEach($e);var e,n=yl.fragments.length;for(t=yl.fragments,yl.fragments=[];n--;)e=t[n],e.update();yl.transitionManager.ready(),t=yl.deferredObservers,yl.deferredObservers=[],t.forEach($e);var i=yl.tasks;for(yl.tasks=[],n=0;n<i.length;n+=1)i[n]();return yl.fragments.length||yl.immediateObservers.length||yl.deferredObservers.length||yl.tasks.length?qe():void 0}function He(){bl.start();var t,e,n=performance.now();for(t=0;t<wl.length;t+=1)e=wl[t],e.tick(n)||wl.splice(t--,1);bl.end(),wl.length?requestAnimationFrame(He):xl=!1;}function Ze(e,n){var i={};if(!n)return e;n+=".";for(var r in e)t(e,r)&&(i[n+r]=e[r]);return i}function We(t){var e;return El[t]||(e=t?t+".":"",El[t]=function(n,i){var r;return h(n)?(r={},r[e+n]=i,r):o(n)?e?Ze(n,t):n:void 0}),El[t]}function Ge(t){for(var e=[],n=0;n<t.length;n++)e[n]=(t.childByKey[n]||{}).value;return e}function Qe(t){for(var e=t;e&&!e.context&&!e.aliases;)e=e.parent;return e}function Ye(e,n){var i=e;if("."===n)return e.findContext();if("~"===n[0])return e.ractive.viewmodel.joinAll(A(n.slice(2)));if("."===n[0]||"^"===n[0]){for(var r=e,s=n.split("/"),a="^^"===s[0];r&&!r.context;)r=Je(r);for(var o=r&&r.context;r&&"^^"===s[0];){for(s.shift(),r=r.isIteration?r.parent.parent:Je(r);r&&!r.context;)r=Je(r);o=r&&r.context;
	}if(!o&&a)throw new Error("Invalid context parent reference ('"+n+"'). There is not context at that level.");for(;"."===s[0]||".."===s[0];){var h=s.shift();".."===h&&(o=o.parent);}return n=s.join("/"),"."===n[0]&&(n=n.slice(1)),o.joinAll(A(n))}var l=A(n);if(l.length){var c=l.shift();if("@"===c[0]){if("@this"===c||"@"===c)return e.ractive.viewmodel.getRactiveModel().joinAll(l);if("@index"===c||"@key"===c){l.length&&en(c);var f=Xe(e);return f&&f["get"+("i"===c[1]?"Index":"Key")]()}if("@last"===c){var d=Xe(e);return d&&d.parent.getLast()}if("@global"===c)return Nl.joinAll(l);if("@shared"===c)return jl.joinAll(l);if("@keypath"===c||"@rootpath"===c){for(var p="r"===n[1]?e.ractive.root:null,m=e;m&&(!m.context||m.isRoot&&m.ractive.component&&(p||!m.ractive.isolated));)m=m.isRoot?m.componentParent:m.parent;return m.getKeypath(p)}if("@context"===c)return new Ol(e.getContext(),"context").joinAll(l);if("@local"===c)return e.getContext()._data.joinAll(l);if("@style"===c)return e.ractive.constructor._cssModel.joinAll(l);if("@helpers"===c)return e.ractive.viewmodel.getHelpers().joinAll(l);if("@macro"===c){var v=tn(e);return v?new Ol(v,"macro").joinAll(l):void 0}throw new Error("Invalid special reference '"+c+"'")}if(c&&!l.length){var g=e.ractive.viewmodel.getHelpers();if(g.has(c))return g.joinKey(c)}var b=Qe(e);b=b&&b.context?b.context:e.findContext();for(var w,x=!1,k=e.ractive.warnAboutAmbiguity,_=0;e;){if(e.isIteration&&(c===e.parent.keyRef?w=e.getKey():c===e.parent.indexRef&&(w=e.getIndex()),w&&l.length&&en(c)),!w&&e.aliases&&t(e.aliases,c)&&(w=e.aliases[c]),!w&&e.context&&e.context.has(c)&&(w=e.context.joinKey(c),x?k&&y("'"+n+"' resolved but is ambiguous and will create a mapping to a parent component."):k&&_&&y("'"+n+"' resolved but is ambiguous.")),w)return x&&(w=i.ractive.viewmodel.createLink(c,w,c,{implicit:!0})),l.length>0&&u(w.joinAll)&&(w=w.joinAll(l)),w;e.context&&!e.aliases&&(_=1),(e.componentParent||!e.parent&&e.ractive.component)&&!e.ractive.isolated?(e=e.componentParent||e.ractive.component.up,x=!0):e=e.parent;}var E=i.ractive;return E.resolveInstanceMembers&&"data"!==c&&c in E?E.viewmodel.getRactiveModel().joinKey(c).joinAll(l):(k&&y("'"+n+"' is ambiguous and did not resolve."),b.joinKey(c).joinAll(l))}}function Je(t){return t&&(!t.ractive.isolated&&t.componentParent||t.parent)}function Xe(t){for(var e,n=t;!n.isIteration&&(e=Je(n));)n=e;return n.isIteration&&n}function tn(t){for(var e=t;e;){if(e.owner.handle)return e.owner.handle;e=Je(e);}}function en(t){throw new Error("An index or key reference ("+t+") cannot have child properties")}function nn(t){for(var e=[],n=arguments.length-1;n-->0;)e[n]=arguments[n+1];var i=t.fragment||t._fakeFragment||(t._fakeFragment=new Vl(t));return i.getContext.apply(i,e)}function rn(){for(var t=[],e=arguments.length;e--;)t[e]=arguments[e];return this.ctx||(this.ctx=new Tl.Context(this)),t.unshift(Ra(this.ctx)),Ia.apply(null,t)}function sn(t){for(var e=t;e&&!e.context;)e=e.parent;return e?e:t&&t.ractive.fragment}function an(t,e){var n=Pl,i=e&&e.deep,r=e&&e.shuffle,s=bl.start();e&&"keep"in e&&(Pl=e.keep);for(var a=t.length;a--;){var o=t[a][0],u=t[a][1],h=t[a][2];if(!o)throw bl.end(),new Error("Failed to set invalid keypath '"+h+"'");if(i)hn(o,u);else if(r){var l=u,f=o.get();if(l||(l=f),c(f))o.set(l);else {if(!Fa(f)||!Fa(l))throw bl.end(),new Error("You cannot merge an array with a non-array");var d=ln(r);o.merge(l,d);}}else o.set(u);}return bl.end(),Pl=n,s}function on(t,e,n,i){if(!n&&("."===e[0]||"^"===e[1]))return y("Attempted to set a relative keypath from a non-relative context. You can use a context object to set relative keypaths."),[];var r=A(e),s=n||t.viewmodel;return Il.test(e)?s.findMatches(r):s===t.viewmodel?!t.component||t.isolated||s.has(r[0])||"@"===e[0]||!e[0]||i?[s.joinAll(r)]:[Ye(t.fragment||new Vl(t),e)]:[s.joinAll(r)]}function un(e,n,i,r){var a=[];if(s(n)){var o=function(i){t(n,i)&&a.push.apply(a,on(e,i,null,r).map(function(t){return [t,n[i],i]}));};for(var u in n)o(u);}else a.push.apply(a,on(e,n,null,r).map(function(t){return [t,i,n]}));return a}function hn(e,n){var i=e.get(!1,Rl);if(null==i||!o(n))return e.set(n);if(!o(i))return e.set(n);for(var r in n)t(n,r)&&hn(e.joinKey(r),n[r]);}function ln(t){if(t===!0)return null;if(u(t))return t;if(h(t))return Bl[t]||(Bl[t]=function(e){return e[t]});throw new Error("If supplied, options.compare must be a string, function, or true")}function cn(t,e,n,i){if(!h(e)||!r(n))throw new Error("Bad arguments");var s=un(t,e,n,i&&i.isolated);return an(s.map(function(t){var e=t[0],n=t[1],i=e.get();if(!r(n)||!r(i))throw new Error(Kl);return [e,i+n]}))}function fn(t,e,n){var i=l(e)?e:1,r=o(e)?e:n;return cn(this,t,i,r)}function dn(t){var e=Promise.resolve(t);return Ba(e,"stop",{value:f}),e}function pn(t,e){t=t||{};var n;return t.easing&&(n=u(t.easing)?t.easing:e.easing[t.easing]),{easing:n||Ll,duration:"duration"in t?t.duration:400,complete:t.complete||f,step:t.step||f,interpolator:t.interpolator}}function mn(t,e,n,r){r=pn(r,t);var s=e.get();if(i(s,n))return r.complete(r.to),dn(n);var a=k(s,n,t,r.interpolator);return a?e.animate(s,n,r,a):(bl.start(),e.set(n),bl.end(),dn(n))}function vn(t,e,n){if(o(t)){var i=La(t);throw new Error("ractive.animate(...) no longer supports objects. Instead of ractive.animate({\n  "+i.map(function(e){return "'"+e+"': "+t[e]}).join("\n  ")+"\n}, {...}), do\n\n"+i.map(function(e){return "ractive.animate('"+e+"', "+t[e]+", {...});"}).join("\n")+"\n")}return mn(this,this.viewmodel.joinAll(A(t)),e,n)}function gn(t,e){t.event&&t._eventQueue.push(t.event),t.event=e;}function yn(t){t._eventQueue.length?t.event=t._eventQueue.pop():t.event=null;}function bn(t,e){var n=e?Dl:Fl;if(n[t])return n[t];var i=t.split("."),r=[],s=!1;e&&(i.unshift("this"),s=!0);for(var a=Math.pow(2,i.length)-(e?1:0),o=0;a>o;o++){for(var u=[],h=0;h<i.length;h++)u.push(1&o>>h?"*":i[h]);r.unshift(u.join("."));}return s&&(i.length>2?r.push.apply(r,bn(t,!1)):(r.push("*"),r.push(t))),n[t]=r,r}function wn(t,e,n,i){if(void 0===i&&(i=[]),e){n.name=e,i.unshift(n);var r=t._nsSubs?bn(e,!0):["*",e];return xn(t,r,n,i,!0)}}function xn(t,e,n,i,r){void 0===r&&(r=!1);var s=!0;if(r||t._nsSubs){gn(t,n);for(var a=e.length;a--;)e[a]in t._subs&&(s=kn(t,t._subs[e[a]],n,i)&&s);yn(t);}if(t.parent&&s){if(r&&t.component){var o=t.component.name+"."+e[e.length-1];e=bn(o,!1),n&&!n.component&&(n.component=t);}s=xn(t.parent,e,n,i);}return s}function kn(t,e,n,i){var r=null,s=!1;e=e.slice();for(var a=0,o=e.length;o>a;a+=1)e[a].off||e[a].handler.apply(t,i)!==!1||(s=!0);return n&&s&&(r=n.event)&&(r.preventDefault&&r.preventDefault(),r.stopPropagation&&r.stopPropagation()),!s}function _n(t,e){return t[e._guid]||(t[e._guid]=[])}function En(t,e){var n=_n(t.queue,e);for(t.hook.fire(e);n.length;)En(t,n.shift());delete t.queue[e._guid];}function An(t,e){void 0===e&&(e=null);var n=[];return Cn(t,e,n),n}function Cn(t,e,n){t.isAnchor?e&&t.name!==e||n.push(t):t.items?t.items.forEach(function(t){return Cn(t,e,n)}):t.iterations?t.iterations.forEach(function(t){return Cn(t,e,n)}):t.fragment&&!t.component&&Cn(t.fragment,e,n);}function Sn(t,e){void 0===e&&(e=null);var n=An(t.fragment,e),i={},r=t._children.byName;n.forEach(function(t){var e=t.name;e in i||(i[e]=0);var n=i[e],s=(r[e]||[])[n];s&&s.lastBound!==t&&(s.lastBound&&s.lastBound.removeChild(s),t.addChild(s)),i[e]++;});}function On(t){t.instance.fragment.rendered&&(t.shouldDestroy=!0,t.instance.unrender()),t.instance.el=null;}function jn(t,e){void 0===e&&(e={});var n,i=this._children;if(t.parent&&t.parent!==this)throw new Error("Instance "+t._guid+" is already attached to a different instance "+t.parent._guid+". Please detach it from the other instance using detachChild first.");if(t.parent)throw new Error("Instance "+t._guid+" is already attached to this instance.");var r={instance:t,ractive:this,name:e.name||t.constructor.name||"Ractive",target:e.target||!1,bubble:Nn,findNextNode:Tn};if(r.nameOption=e.name,r.target){var s;(s=i.byName[r.target])||(s=[],this.set("@this.children.byName."+r.target,s)),n=e.prepend?0:void 0!==e.insertAt?e.insertAt:s.length;}else r.up=this.fragment,r.external=!0;t.parent=this,t.root=this.root,t.component=r,i.push(r);var a=bl.start(),o=t.viewmodel.getRactiveModel();return o.joinKey("parent",{lastLink:!1}).link(this.viewmodel.getRactiveModel()),o.joinKey("root",{lastLink:!1}).link(this.root.viewmodel.getRactiveModel()),ql.attachchild.fire(t),r.target?(On(r),this.splice("@this.children.byName."+r.target,n,0,r),Sn(this,r.target)):t.isolated||t.viewmodel.attached(this.fragment),bl.end(),a.ractive=t,a.then(function(){return t})}function Nn(){bl.addFragment(this.instance.fragment);}function Tn(){return this.anchor?this.anchor.findNextNode():void 0}function Vn(t,e){this.computed[t]=e,(h(e)||u(e))&&(e=this.computed[t]={get:e});var n=A(t);if(!~t.indexOf("*")){var i=n.pop();return this.viewmodel.joinAll(n).compute(i,e)}e.pattern=new RegExp("^"+n.map(function(t){return t.replace(/\*\*/g,"(.+)").replace(/\*/g,"((?:\\\\.|[^\\.])+)")}).join("\\.")+"$");}function Mn(t,e){var n=bl.start(),i=Vn.call(this,t,e);if(i){var r=A(t);1!==r.length||i.isReadonly||i.set(this.viewmodel.value[r[0]]);var s=r.reduce(function(t,e){return t&&t.childByKey[e]},this.viewmodel);s&&(s.rebind(i,s,!1),s.parent&&delete s.parent.childByKey[s.key],F());}return bl.end(),n}function Pn(){return this.isDetached?this.el:(this.el&&V(this.el.__ractive_instances__,this),this.el=this.fragment.detach(),this.isDetached=!0,ql.detach.fire(this),this.el)}function In(t){for(var e,n,i=this._children,r=i.length;r--;)if(i[r].instance===t){n=r,e=i[r];break}if(!e||t.parent!==this)throw new Error("Instance "+t._guid+" is not attached to this instance.");var s=bl.start();e.anchor&&e.anchor.removeChild(e),t.isolated||t.viewmodel.detached(),i.splice(n,1),e.target&&(this.splice("@this.children.byName."+e.target,i.byName[e.target].indexOf(e),1),Sn(this,e.target));var a=t.viewmodel.getRactiveModel();return a.joinKey("parent",{lastLink:!1}).unlink(),a.joinKey("root",{lastLink:!1}).link(a),t.root=t,t.parent=null,t.component=null,ql.detachchild.fire(t),bl.end(),s.ractive=t,s.then(function(){return t})}function Rn(t,e){var n=this;if(void 0===e&&(e={}),!this.rendered)throw new Error("Cannot call ractive.find('"+t+"') unless instance is rendered to the DOM");var i=this.fragment.find(t,e);if(i)return i;if(e.remote)for(var r=0;r<this._children.length;r++)if(n._children[r].instance.fragment.rendered&&(i=n._children[r].instance.find(t,e)))return i}function Bn(t,e){if(void 0===e&&(e={}),!this.rendered)throw new Error("Cannot call ractive.findAll('"+t+"', ...) unless instance is rendered to the DOM");return Fa(e.result)||(e.result=[]),this.fragment.findAll(t,e),e.remote&&this._children.forEach(function(n){!n.target&&n.instance.fragment&&n.instance.fragment.rendered&&n.instance.findAll(t,e);}),e.result}function Kn(t,e){return !e&&o(t)&&(e=t,t=""),e=e||{},Fa(e.result)||(e.result=[]),this.fragment.findAllComponents(t,e),e.remote&&this._children.forEach(function(n){!n.target&&n.instance.fragment&&n.instance.fragment.rendered&&(t&&n.name!==t||e.result.push(n.instance),n.instance.findAllComponents(t,e));}),e.result}function Ln(t,e){var n=this;void 0===e&&(e={}),o(t)&&(e=t,t="");var i=this.fragment.findComponent(t,e);if(i)return i;if(e.remote){if(!t&&this._children.length)return this._children[0].instance;for(var r=0;r<this._children.length;r++)if(!n._children[r].target){if(n._children[r].name===t)return n._children[r].instance;if(i=n._children[r].instance.findComponent(t,e))return i}}}function Dn(t){return this.container?this.container.component&&this.container.component.name===t?this.container:this.container.findContainer(t):null}function Fn(t){return this.parent?this.parent.component&&this.parent.component.name===t?this.parent:this.parent.findParent(t):null}function zn(t,e,n){for(void 0===e&&(e=!0);t&&(t.type!==Uo||n&&t.name!==n)&&(!e||t.type!==Qo&&t.type!==Zo);)t=t.owner?t.owner:t.component||t["yield"]?t.containerFragment||t.component.up:t.parent?t.parent:t.up?t.up:void 0;return t}function Un(t,e,n){var i=[],r=$n(t,e,n);if(!r)return null;var s=r.length-2-r[1],a=Math.min(t,r[0]),o=a+r[1];i.startIndex=a;var u;for(u=0;a>u;u+=1)i.push(u);for(;o>u;u+=1)i.push(-1);for(;t>u;u+=1)i.push(u+s);return 0!==s?i.touchedFrom=r[0]:i.touchedFrom=t,i}function $n(t,e,n){switch(e){case"splice":for(void 0!==n[0]&&n[0]<0&&(n[0]=t+Math.max(n[0],-t)),c(n[0])&&(n[0]=0);n.length<2;)n.push(t-n[0]);return l(n[1])||(n[1]=t-n[0]),n[1]=Math.min(n[1],t-n[0]),n;case"sort":case"reverse":return null;case"pop":return t?[t-1,1]:[0,0];case"push":return [t,0].concat(n);case"shift":return [0,t?1:0];case"unshift":return [0,0].concat(n)}}function qn(t){function e(t){for(var e=[],i=arguments.length-1;i-->0;)e[i]=arguments[i+1];return n(this.viewmodel.joinAll(A(t)),e)}function n(e,n){var i=e.get();if(!Fa(i)){if(c(i)){i=[];var r=Hl[t].apply(i,n),s=bl.start().then(function(){return r});return e.set(i),bl.end(),s}throw new Error("shuffle array method "+t+" called on non-array at "+e.getKeypath())}var a=Un(i.length,t,n),o=Hl[t].apply(i,n),u=bl.start().then(function(){return o});return u.result=o,a?e.shuffle?e.shuffle(a):e.mark():e.set(o),bl.end(),u}return {path:e,model:n}}function Hn(t,e,n){e.parent&&e.parent.wrapper&&e.parent.adapt();var i=bl.start();return e.mark(n&&n.force),e.notifyUpstream(),bl.end(),ql.update.fire(t,e),i}function Zn(t,e){var n,i;return h(t)?(i=A(t),n=e):n=t,Hn(this,i?this.viewmodel.joinAll(i):this.viewmodel,n)}function Wn(e,n,i){var r=[];if(s(n))for(var a in n)t(n,a)&&r.push([Gn(e,a).model,n[a]]);else r.push([Gn(e,n).model,i]);return r}function Gn(t,e){var n=t.fragment;return h(e)?{model:Ye(n,e),instance:n.ractive}:{model:n.findContext(),instance:e}}function Qn(t,e){return t.events&&t.events.find&&t.events.find(function(t){return ~t.template.n.indexOf(e)})}function Yn(t){for(var e=[],n=arguments.length-1;n-->0;)e[n]=arguments[n+1];var i;if(e[0]instanceof ec){var r=e.shift();i=Ra(r),Ia(i,r);}else i=!o(e[0])||null!==e[0]&&e[0].constructor!==Object?ec.forRactive(this):ec.forRactive(this,e.shift());return wn(this,t,i,e)}function Jn(t,e){if(!h(t))return this.viewmodel.get(!0,t);var n,i=A(t),r=i[0];return this.viewmodel.has(r)||this.component&&!this.isolated&&(n=Ye(this.fragment||new Vl(this),r)),n=this.viewmodel.joinAll(i),n.get(!0,e)}function Xn(t){h(t)&&dc&&(t=dc.call(document,t));var e;if(t){if(t._ractive)return t._ractive.proxy.getContext();if(!(e=t.__ractive_instances__))return Xn(t.parentNode);if(1===e.length)return nn(e[0])}}function ti(t,e){return t?(h(t)&&(t=this.find(t,e)),Xn(t)):nn(this)}function ei(){return $a.createDocumentFragment()}function ni(t){var e;if(t&&"boolean"!=typeof t){if(!Ua||!$a||!t)return null;if(t.nodeType)return t;if(h(t)){if(e=$a.getElementById(t),!e&&$a.querySelector)try{e=$a.querySelector(t);}catch(n){}if(e&&e.nodeType)return e}return t[0]&&t[0].nodeType?t[0]:null}}function ii(t){return t&&"unknown"!=typeof t.parentNode&&t.parentNode&&t.parentNode.removeChild(t),t}function ri(t){return null==t||l(t)&&isNaN(t)||!t.toString?"":""+t}function si(t){return ri(t).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function ai(t,e){if(!this.fragment.rendered)throw new Error("The API has changed - you must call `ractive.render(target[, anchor])` to render your Ractive instance. Once rendered you can use `ractive.insert()`.");if(t=ni(t),e=ni(e)||null,!t)throw new Error("You must specify a valid target to insert into");t.insertBefore(this.detach(),e),this.el=t,(t.__ractive_instances__||(t.__ractive_instances__=[])).push(this),this.isDetached=!1,oi(this);}function oi(t){ql.insert.fire(t),t.findAllComponents("*").forEach(function(t){oi(t.instance);});}function ui(t,e,n){var i,r=n&&(n.ractive||n.instance)||this,s=A(t);!r.viewmodel.has(s[0])&&r.component&&(i=Ye(r.component.up,s[0]),i=i.joinAll(s.slice(1)));var a=i||r.viewmodel.joinAll(s),o=this.viewmodel.joinAll(A(e),{lastLink:!1});if(hi(a,o)||hi(o,a))throw new Error("A keypath cannot be linked to itself.");var u=bl.start();return o.link(a,n&&n.keypath||t),bl.end(),u}function hi(t,e){for(var n=e;n;){if(n===t||n.owner===t)return !0;n=n.target||n.parent;}}function li(t,e){var n=e&&t.model?t.model.get():t.newValue;try{t.oldValue=t.oldFn?t.oldFn.call(t.oldContext,void 0,n,t.keypath):n;}catch(i){y("Failed to execute observer oldValue callback for '"+this.keypath+"': "+(i.message||i)),t.oldValue=n;}}function ci(){for(var t=[],e=arguments.length;e--;)t[e]=arguments[e];return t.map(_).join(".")}function fi(t){return A(t).map(C)}function di(t,e,n){var i=t.oldValues;t.oldFn?(n||(t.oldValues={}),La(e).forEach(function(n){var r=[i[n],e[n],n],s=t.pattern.exec(n);s&&r.push.apply(r,s.slice(1)),t.oldValues[n]=t.oldFn.apply(t.oldContext,r);})):n?La(e).forEach(function(t){return i[t]=e[t]}):t.oldValues=e;}function pi(){return -1}function mi(t,e,n){var i,r,a=this,o=[];s(t)?(i=t,r=e||{}):u(t)?(i={"":t},r=e||{}):(i={},i[t]=e,r=n||{});var h=!1;return La(i).forEach(function(t){var e=i[t],n=function(){for(var t=[],n=arguments.length;n--;)t[n]=arguments[n];return h?void 0:e.apply(this,t)},s=t.split(" ");s.length>1&&(s=s.filter(function(t){return t})),s.forEach(function(t){r.keypath=t;var e=vi(a,t,n,r);e&&o.push(e);});}),this._observers.push.apply(this._observers,o),{cancel:function(){return o.forEach(function(t){return t.cancel()})},isSilenced:function(){return h},silence:function(){return h=!0},resume:function(){return h=!1}}}function vi(t,e,n,i){var r=A(e),s=r.indexOf("*");~s||(s=r.indexOf("**")),i.fragment=i.fragment||t.fragment;var a;if(i.fragment?~r[0].indexOf(".*")?(a=i.fragment.findContext(),s=0,r[0]=r[0].slice(1)):a=0===s?i.fragment.findContext():Ye(i.fragment,r[0]):a=t.viewmodel.joinKey(r[0]),a||(a=t.viewmodel.joinKey(r[0])),~s){var o=r.indexOf("**");return ~o&&(o+1!==r.length||~r.indexOf("*"))?void b("Recursive observers may only specify a single '**' at the end of the path."):(a=a.joinAll(r.slice(1,s)),new Ec(t,a,r.slice(s),n,i))}return a=a.joinAll(r.slice(1)),i.array?new Cc(t,a,n,i):new xc(t,a,n,i)}function gi(t,e,n){return s(t)||u(t)?(n=Ia(e||{},Oc),this.observe(t,n)):(n=Ia(n||{},Oc),this.observe(t,e,n))}function yi(t,e){var n=this;if(t){var i=t.split(" ").map(jc).filter(Nc);i.forEach(function(t){var i=n._subs[t];if(i&&e){var r=i.find(function(t){return t.callback===e});r&&(V(i,r),r.off=!0,t.indexOf(".")&&n._nsSubs--);}else i&&(t.indexOf(".")&&(n._nsSubs-=i.length),i.length=0);});}else this._subs={};return this}function bi(e,n){var i=this,r=o(e)?e:{};h(e)&&(r[e]=n);var s=!1,a=[],u=function(e){var n=r[e],o=function(){for(var t=[],e=arguments.length;e--;)t[e]=arguments[e];return s?void 0:n.apply(this,t)},u={callback:n,handler:o};if(t(r,e)){var h=e.split(" ").map(jc).filter(Nc);h.forEach(function(t){(i._subs[t]||(i._subs[t]=[])).push(u),t.indexOf(".")&&i._nsSubs++,a.push([t,u]);});}};for(var l in r)u(l);return {cancel:function(){return a.forEach(function(t){return i.off(t[0],t[1].callback)})},isSilenced:function(){return s},silence:function(){return s=!0},resume:function(){return s=!1}}}function wi(t,e){var n=this.on(t,function(){e.apply(this,arguments),n.cancel();});return n}function xi(t,e){void 0===e&&(e={});var n=A(t);if(this.viewmodel.has(n[0])){var i=this.viewmodel.joinAll(n);if(!i.isLink)return;for(;(i=i.target)&&e.canonical!==!1&&i.isLink;);if(i)return {ractive:i.root.ractive,keypath:i.getKeypath()}}}function ki(t){Pc.push(t),Ic=!0;}function _i(t){var e=Ai();e&&(t||Ic)&&(Bc?e.styleSheet.cssText=Ei(null):e.innerHTML=Ei(null),Ic=!1);}function Ei(t){t&&!Fa(t)&&(t=[t]);var e=t?Pc.filter(function(e){return ~t.indexOf(e.id)}):Pc;return e.forEach(function(t){return t.applied=!0}),e.reduce(function(t,e){return ""+(t?t+"\n\n/* {"+e.id+"} */\n"+e.styles:"")},Mc)}function Ai(){return $a&&!Rc&&(Rc=$a.createElement("style"),Rc.type="text/css",Rc.setAttribute("data-ractive-css",""),$a.getElementsByTagName("head")[0].appendChild(Rc),Bc=!!Rc.styleSheet),Rc}function Ci(t,e,n){void 0===n&&(n=[]);var i=[],r=function(t){return t.replace(Fc,function(t,e){return i[e]})};return t=t.replace(Dc,function(t){return "\x00"+(i.push(t)-1)}).replace(Lc,""),n.forEach(function(e){t=t.replace(e,function(t){return "\x00"+(i.push(t)-1)});}),e(t,r)}function Si(t){return t.trim()}function Oi(t){return t.str}function ji(t,e){for(var n,i=[];n=Hc.exec(t);)i.push({str:n[0],base:n[1],modifiers:n[2]});for(var r=i.map(Oi),s=[],a=i.length;a--;){var o=r.slice(),u=i[a];o[a]=u.base+e+u.modifiers||"";var h=r.slice();h[a]=e+" "+h[a],s.push(o.join(" "),h.join(" "));}return s.join(", ")}function Ni(t,e){var i='[data-ractive-css~="{'+e+'}"]';return Wc.test(t)?t.replace(Wc,i):Ci(t,function(t,e){return t=t.replace(Uc,"$&").replace(zc,function(t,e){if(Zc.test(e))return t;var n=e.split(",").map(Si),r=n.map(function(t){return ji(t,i)}).join(", ")+" ";return t.replace(e,r)}).replace($c,""),e(t)},[qc])}function Ti(){return Math.floor(65536*(1+Math.random())).toString(16).substring(1)}function Vi(){return Ti()+Ti()+"-"+Ti()+"-"+Ti()+"-"+Ti()+"-"+Ti()+Ti()+Ti()}function Mi(t,e,n){var i=o(t)?e:n,r=this._cssModel;r.locked=!0;var s=an(un({viewmodel:r},t,e,!0),i);r.locked=!1;var a=bl.start();return this.extensions.forEach(function(t){var e=t._cssModel;e.mark(),e.downstreamChanged("",1);}),bl.end(),Pi(this,!i||i.apply!==!1),s.then(function(){return a})}function Pi(t,e){var n=Ii(t),i=t.extensions.map(function(t){return Pi(t,!1)}).reduce(function(t,e){return e||t},!1);if(e&&(n||i)){var r=t._cssDef;(!r||r&&r.applied)&&_i(!0);}return n||i}function Ii(t){var e=t.css;if(u(e)){var n=t._cssDef,i=Bi(t,e),r=n.transform?Ni(i,n.id):i;if(n.styles!==r)return n.styles=r,!0}}function Ri(t){for(var e=t,n=[];e;)e.prototype.cssId&&n.push(e.prototype.cssId),e=e.Parent;return n}function Bi(t,e){if(h(e))return e;var n=t.cssData,i=t._cssModel,r=function(t){return i.joinAll(A(t)).get()};r.__proto__=n;var s=e.call(t,r);return h(s)?s:""}function Ki(t,e,n){var i=t.css===!0?"":h(t.css)&&!Qc.test(t.css)?ni(t.css)||t.css:t.css,r=i,s=t.cssId||Vi();o(i)?(i="textContent"in i?i.textContent:i.innerHTML,r=i):u(i)&&(r=i,i=Bi(e,i));var a={transform:"noCSSTransform"in t?!t.noCSSTransform:!t.noCssTransform};Ba(e,"_cssDef",{configurable:!0,value:a}),Ba(e,"css",{get:function(){return r},set:function(t){r=t;var n=Bi(e,r),i=a.styles;a.styles=a.transform?Ni(n,s):n,a.applied&&i!==a.styles&&_i(!0);}}),a.styles=a.transform?Ni(i,s):i,a.id=n.cssId=s,e._cssIds.push(s),ki(e._cssDef);}function Li(t){t&&t.constructor!==Object&&(u(t)||(o(t)?y("If supplied, options.data should be a plain JavaScript object - using a non-POJO as the root object may work, but is discouraged"):p("data option must be an object or a function, `"+t+"` is not valid")));}function Di(){return {}}function Fi(t,e){Li(e);var n=u(t);e||n||(e=Di);var i=u(e);return n||i?function(){var r=i?zi(e,this):e,s=n?zi(t,this):t;return Ui(r,s)}:Ui(e,t)}function zi(t,e){var n=t.call(e);if(n)return o(n)||p("Data function must return an object"),n.constructor!==Object&&b("Data function returned something other than a plain JavaScript object. This might work, but is strongly discouraged"),n}function Ui(t,e){if(t&&e){for(var n in e)n in t||(t[n]=e[n]);return t}return t||e}function $i(t){var e=t._config.template;if(e&&e.fn){var n=qi(t,e.fn);return n!==e.result?(e.result=n,n):void 0}}function qi(t,e){return e.call(t,{fromId:pl.fromId,isParsed:pl.isParsed,parse:function(e,n){return void 0===n&&(n=pl.getParseOptions(t)),pl.parse(e,n)}})}function Hi(t,e){return h(t)?t=Zi(t,e):(Wi(t),dt(t)),t}function Zi(t,e){return "#"===t[0]&&(t=pl.fromId(t)),pl.parseFor(t,e)}function Wi(t){if(void 0==t)throw new Error("The template cannot be "+t+".");if(!l(t.v))throw new Error("The template parser was passed a non-string template, but the template doesn't have a version.  Make sure you're passing in the template you think you are.");if(t.v!==Vo)throw new Error("Mismatched template version (expected "+Vo+", got "+t.v+") Please ensure you are using the latest version of Ractive.js in your build process as well as in your app")}function Gi(e,n,i){if(n)for(var r in n)(i||!t(e,r))&&(e[r]=n[r]);}function Qi(t,e,n){function i(){var t=Yi(i._parent,e),r="_super"in this,s=this._super;this._super=t;var a=n.apply(this,arguments);return r?this._super=s:delete this._super,a}return /_super/.test(n)?(i._parent=t,i._method=n,i):n}function Yi(t,e){if(e in t){var n=t[e];return u(n)?n:function(){return n}}return f}function Ji(t,e,n){return "options."+t+" has been deprecated in favour of options."+e+"."+(n?" You cannot specify both options, please use options."+e+".":"")}function Xi(t,e,n){if(e in t){if(n in t)throw new Error(Ji(e,n,!0));y(Ji(e,n)),t[n]=t[e];}}function tr(t){Xi(t,"beforeInit","onconstruct"),Xi(t,"init","onrender"),Xi(t,"complete","oncomplete"),Xi(t,"eventDefinitions","events"),Fa(t.adaptors)&&Xi(t,"adaptors","adapt");}function er(e,n,i,r,s){tr(r);for(var a in r)if(t(hf,a)){var o=r[a];"el"!==a&&u(o)?y(a+" is a Ractive option that does not expect a function and will be ignored","init"===e?i:null):i[a]=o;}if(i.append&&i.enhance)throw new Error("Cannot use append and enhance at the same time");sf.forEach(function(t){t[e](n,i,r,s);}),Kc[e](n,i,r,s),Xc[e](n,i,r,s),Yc[e](n,i,r,s),nr(n.prototype,i,r);}function nr(e,n,i){for(var r in i)if(!lf[r]&&t(i,r)){var s=i[r];u(s)&&((r in Fp||"on"===r.slice(0,2)&&r.slice(2)in ql&&r in n)&&!ff.test(s.toString())&&y("Overriding Ractive prototype function '"+r+"' without calling the '"+ff+"' method can be very dangerous."),s=Qi(e,r,s)),n[r]=s;}}function ir(t){var e={};return t.forEach(function(t){return e[t]=!0}),e}function rr(t){return h(t)?Ci(t,function(t,e){return t.split(";").filter(function(t){return !!t.trim()}).map(e).reduce(function(t,e){var n=e.indexOf(":"),i=e.substr(0,n).trim();return t[i]=e.substr(n+1).trim(),t},{})}):{}}function sr(t){for(var e=t.split(vf),n=e.length;n--;)e[n]||e.splice(n,1);return e}function ar(t){var e=t.element,n=t.name;if("value"===n){if(t.interpolator&&(t.interpolator.bound=!0),"select"===e.name&&"value"===n)return e.getAttribute("multiple")?or:ur;if("textarea"===e.name)return fr;if(null!=e.getAttribute("contenteditable"))return hr;if("input"===e.name){var i=e.getAttribute("type");if("file"===i)return f;if("radio"===i&&e.binding&&"name"===e.binding.attribute.name)return lr;if(~gf.indexOf(i))return fr}return cr}var r=e.node;if(t.isTwoway&&"name"===n){if("radio"===r.type)return dr;if("checkbox"===r.type)return pr}if("style"===n)return mr;if(0===n.indexOf("style-"))return vr;if("class"===n&&(!r.namespaceURI||r.namespaceURI===pc))return gr;if(0===n.indexOf("class-"))return yr;if(t.isBoolean){var s=e.getAttribute("type");return !t.interpolator||"checked"!==n||"checkbox"!==s&&"radio"!==s||(t.interpolator.bound=!0),br}return t.namespace&&t.namespace!==t.node.namespaceURI?xr:wr}function or(t){var e=this.getValue();Fa(e)||(e=[e]);var n=this.node.options,i=n.length;if(t)for(;i--;)n[i].selected=!1;else for(;i--;){var r=n[i],s=r._ractive?r._ractive.value:r.value;r.selected=O(e,s);}}function ur(t){var e=this.getValue();if(!this.locked){this.node._ractive.value=e;var n=this.node.options,i=n.length,r=!1;if(t)for(;i--;)n[i].selected=!1;else for(;i--;){var s=n[i],a=s._ractive?s._ractive.value:s.value;if(s.disabled&&s.selected&&(r=!0),a==e)return void(s.selected=!0)}r||(this.node.selectedIndex=-1);}}function hr(t){var e=this.getValue();this.locked||(t?this.node.innerHTML="":this.node.innerHTML=c(e)?"":e);}function lr(t){var e=this.node,n=e.checked,i=this.getValue();return t?e.checked=!1:(e.value=this.node._ractive.value=i,e.checked=this.element.compare(i,this.element.getAttribute("name")),void(n&&!e.checked&&this.element.binding&&this.element.binding.rendered&&this.element.binding.group.model.set(this.element.binding.group.getValue())))}function cr(t){if(!this.locked)if(t)this.node.removeAttribute("value"),this.node.value=this.node._ractive.value=null;else {var e=this.getValue();this.node.value=this.node._ractive.value=e,this.node.setAttribute("value",ri(e));}}function fr(t){if(!this.locked)if(t)this.node._ractive.value="",this.node.removeAttribute("value");else {var e=this.getValue();this.node._ractive.value=e;var n=ri(e);this.node.value!==n&&(this.node.value=n),this.node.setAttribute("value",n);}}function dr(t){t?this.node.checked=!1:this.node.checked=this.element.compare(this.getValue(),this.element.binding.getValue());}function pr(t){var e=this,n=e.element,i=e.node,r=n.binding,s=this.getValue(),a=n.getAttribute("value");if(Fa(s)){for(var o=s.length;o--;)if(n.compare(a,s[o]))return void(r.isChecked=i.checked=!0);r.isChecked=i.checked=!1;}else r.isChecked=i.checked=n.compare(s,a);}function mr(t){for(var e=t?{}:rr(this.getValue()||""),n=this.node.style,i=La(e),r=this.previous||[],s=0;s<i.length;){if(i[s]in n){var a=e[i[s]].replace("!important","");n.setProperty(i[s],a,a.length!==e[i[s]].length?"important":"");}s++;}for(s=r.length;s--;)!~i.indexOf(r[s])&&r[s]in n&&n.setProperty(r[s],"","");this.previous=i;}function vr(t){if(this.style||(this.style=_e(this.name.substr(6))),!t||this.node.style.getPropertyValue(this.style)===this.last){var e=t?"":ri(this.getValue()),n=e.replace("!important","");this.node.style.setProperty(this.style,n,n.length!==e.length?"important":""),this.last=this.node.style.getPropertyValue(this.style);}}function gr(t){var e=t?[]:sr(ri(this.getValue())),n=this.node.className;n=void 0!==n.baseVal?n.baseVal:n;var i=sr(n),r=this.previous||[],s=e.concat(i.filter(function(t){return !~r.indexOf(t)})).join(" ");s!==n&&(h(this.node.className)?this.node.className=s:this.node.className.baseVal=s),this.previous=e;}function yr(t){var e=this.name.substr(6),n=this.node.className;n=void 0!==n.baseVal?n.baseVal:n;var i=sr(n),r=t?!1:this.getValue();this.inlineClass||(this.inlineClass=e),r&&!~i.indexOf(e)?i.push(e):!r&&~i.indexOf(e)&&i.splice(i.indexOf(e),1),h(this.node.className)?this.node.className=i.join(" "):this.node.className.baseVal=i.join(" ");}function br(t){if(!this.locked)if(t)this.useProperty&&(this.node[this.propertyName]=!1),this.node.removeAttribute(this.propertyName);else if(this.useProperty)this.node[this.propertyName]=this.getValue();else {var e=this.getValue();e?this.node.setAttribute(this.propertyName,h(e)?e:""):this.node.removeAttribute(this.propertyName);}}function wr(t){t?this.node.getAttribute(this.name)===this.value&&this.node.removeAttribute(this.name):(this.value=ri(this.getString()),this.node.setAttribute(this.name,this.value));}function xr(t){t?this.value===this.node.getAttributeNS(this.namespace,this.name.slice(this.name.indexOf(":")+1))&&this.node.removeAttributeNS(this.namespace,this.name.slice(this.name.indexOf(":")+1)):(this.value=ri(this.getString()),this.node.setAttributeNS(this.namespace,this.name.slice(this.name.indexOf(":")+1),this.value));}function kr(){return wf}function _r(t,e){if(kf.test(t))return [];var n=e?"svg":"div";return t?(bf.innerHTML="<"+n+" "+t+"></"+n+">")&&P(bf.childNodes[0].attributes):[]}function Er(t,e){for(var n=t.length;n--;)if(t[n].name===e.name)return !1;return !0}function Ar(t,e){for(var n="xmlns:"+e;t;){if(t.hasAttribute&&t.hasAttribute(n))return t.getAttribute(n);t=t.parentNode;}return wc[e]}function Cr(){return _f}function Sr(t,e,n){0===e?t.value=!0:"true"===e?t.value=!0:"false"===e||"0"===e?t.value=!1:t.value=e;var i=t.element[t.flag];return t.element[t.flag]=t.value,n&&!t.element.attributes.binding&&i!==t.value&&t.element.recreateTwowayBinding(),t.value}function Or(t){df.call(this,t);}function jr(){var t=this;return this.torndown?(y("ractive.teardown() was called on a Ractive instance that was already torn down"),Promise.resolve()):(this.shouldDestroy=!0,Nr(this,function(){return t.fragment.rendered?t.unrender():Promise.resolve()}))}function Nr(t,e){t.torndown=!0,t.fragment.unbind(),t._observers.slice().forEach(W),t.el&&t.el.__ractive_instances__&&V(t.el.__ractive_instances__,t);var n=e();return ql.teardown.fire(t),n.then(function(){ql.destruct.fire(t),t.viewmodel.teardown();}),n}function Tr(t,e){if(t.applyValue=function(t){this.parent.value[e]=t,t&&t.viewmodel?(this.link(t.viewmodel.getRactiveModel(),e),this._link.markedAll()):(this.link(Ra(jo),e),this._link.markedAll());},"root"===e){var n=t.mark;t.mark=function(t){
	this._marking||(this._marking=!0,n.apply(this,t),this._marking=!1);};}return t.applyValue(t.parent.ractive[e],e),t._link.set=function(e){return t.applyValue(e)},t._link.applyValue=function(e){return t.applyValue(e)},t._link}function Vr(t,e){t._link&&t._link.implicit&&t._link.isDetached()&&t.attach(e);for(var n in t.childByKey)if(t.value)if(n in t.value)Vr(t.childByKey[n],e);else if(!t.childByKey[n]._link||t.childByKey[n]._link.isDetached()){var i=Ye(e,n);i&&t.childByKey[n].link(i,n,{implicit:!0});}}function Mr(t){t._link&&t._link.implicit&&t.unlink();for(var e in t.childByKey)Mr(t.childByKey[e]);}function Pr(t,e,i){var r=(t.constructor["_"+i]||[]).concat(n(e[i]||[])),s="on"===i?"once":i+"Once";r.forEach(function(e){var n=e[0],r=e[1];u(r)?t[i](n,r):o(r)&&u(r.handler)&&t[r.once?s:i](n,r.handler,Ra(r));});}function Ir(e,n){Ma.DEBUG&&ao(),Br(e),Kr(e),Pr(e,n,"on"),!t(n,"delegate")&&e.parent&&e.parent.delegate!==e.delegate&&(e.delegate=!1),Fa(n.use)&&e.use.apply(e,n.use.filter(function(t){return t.construct})),ql.construct.fire(e,n),n.onconstruct&&n.onconstruct.call(e,nn(e),n);for(var i=Nf.length;i--;){var r=Nf[i];e[r]=Ia(Ra(e.constructor[r]||null),n[r]);}for(i=Tf.length;i--;){var s=Tf[i];e[s]=Ia(Ra(e.constructor.prototype[s]),n[s]);}e._attributePartial&&(e.partials["extra-attributes"]=e._attributePartial,delete e._attributePartial);var a=new jf({adapt:Rr(e,e.adapt,n),data:Jc.init(e.constructor,e,n),ractive:e});e.adapt=a.adaptors,e.viewmodel=a;for(var o in e.computed)Vn.call(e,o,e.computed[o]);}function Rr(t,e,n){function i(e){return h(e)&&(e=w("adaptors",t,e),e||p(mo(e,"adaptor"))),e}e=e.map(i);var r=N(n.adapt).map(i),s=[e,r];return t.parent&&!t.isolated&&s.push(t.parent.viewmodel.adaptors),M.apply(null,s)}function Br(t){t._guid="r-"+Vf++,t._subs=Ra(null),t._nsSubs=0,t._config={},t.event=null,t._eventQueue=[],t._observers=[],t._children=[],t._children.byName={},t.children=t._children,t.component||(t.root=t,t.parent=t.container=null);}function Kr(t){var e=t.component,n=t.constructor.attributes;if(n&&e){var i=e.template,r=i.m?i.m.slice():[],s=r.filter(function(t){return t.t===Wo}).map(function(t){return t.n});n.required.forEach(function(t){~s.indexOf(t)||y("Component '"+e.name+"' requires attribute '"+t+"' to be provided");});for(var a=n.optional.concat(n.required),o=[],u=r.length;u--;){var h=r[u];h.t!==Wo||~a.indexOf(h.n)?n.mapAll||h.t!==Ou&&h.t!==ju&&h.t!==Nu||o.unshift(r.splice(u,1)[0]):n.mapAll?o.unshift({t:Wo,n:h.n,f:[{t:Ko,r:"~/"+h.n}]}):o.unshift(r.splice(u,1)[0]);}o.length&&(e.template={t:i.t,e:i.e,f:i.f,m:r,p:i.p}),t._attributePartial=o;}}function Lr(t){this.item&&this.removeChild(this.item);var e=t.instance;t.anchor=this,t.up=this.up,t.name=t.nameOption||this.name,this.name=t.name,e.isolated||e.viewmodel.attached(this.up),this.rendered&&Fr(this,t);}function Dr(t){this.item===t&&(zr(this,t),this.name=this.template.n);}function Fr(t,e){if(t.rendered){e.shouldDestroy=!1,e.up=t.up,t.item=e,t.instance=e.instance;var n=t.up.findNextNode(t);e.instance.fragment.rendered&&e.instance.unrender(),e.partials=e.instance.partials,e.instance.partials=Ia(Ra(e.partials),e.partials,t._partials),e.instance.fragment.unbind(!0),e.instance.fragment.componentParent=t.up,e.instance.fragment.bind(e.instance.viewmodel),t.attributes.forEach(Z),t.eventHandlers.forEach(Z),t.attributes.forEach(et),t.eventHandlers.forEach(et);var i=t.up.findParentNode();ia(e.instance,i,i.contains(n)?n:null,t.occupants),e.lastBound!==t&&(e.lastBound=t);}}function zr(t,e){t.rendered&&(e.shouldDestroy=!0,e.instance.unrender(),t.eventHandlers.forEach(st),t.attributes.forEach(st),t.eventHandlers.forEach(rt),t.attributes.forEach(rt),e.instance.el=e.instance.anchor=null,e.instance.fragment.componentParent=null,e.up=null,e.anchor=null,t.item=null,t.instance=null);}function Ur(){var t=Pf;Pf=[],t.forEach(Sn);}function $r(t){t.deps.length||t.refs||t.links.length||t.teardown();}function qr(t,e,n,i){void 0===i&&(i={}),e&&e.f&&e.f.s&&(i.register?(t.model=new Lf(n,e.f),t.model.register(t)):t.fn=ft(e.f.s,e.f.r.length));}function Hr(t,e,n,i){return void 0===i&&(i={}),e.f.r.map(function(t,e){var r;return i.specialRef&&(r=i.specialRef(t,e))?r:r=Ye(n,t)})}function Zr(t){t.model&&t.model.unregister(t);}function Wr(){this._ractive.binding.handleChange();}function Gr(t,e,n){var i=t+"-bindingGroup";return e[i]||(e[i]=new Qf(i,e,n))}function Qr(){var t=this,e=this.bindings.filter(function(t){return t.node&&t.node.checked}).map(function(t){return t.element.getAttribute("value")}),n=[];return e.forEach(function(e){t.bindings[0].arrayContains(n,e)||n.push(e);}),n}function Yr(){Wr.call(this);var t=this._ractive.binding.model.get();this.value=void 0==t?"":t;}function Jr(t){var e;return function(){var n=this;e&&clearTimeout(e),e=setTimeout(function(){var t=n._ractive.binding;t.rendered&&Wr.call(n),e=null;},t);}}function Xr(t){return t.selectedOptions?P(t.selectedOptions):t.options?P(t.options).filter(function(t){return t.selected}):[]}function ts(t){return sd[t]||(sd[t]=[])}function es(){var t=this.bindings.filter(function(t){return t.node.checked});return t.length>0?t[0].element.getAttribute("value"):void 0}function ns(t){return t&&t.template.f&&1===t.template.f.length&&!t.template.f[0].s?t.template.f[0].t===Ko?!0:(t.template.f[0].t===Lo&&y("It is not possible create a binding using a triple mustache."),!1):!1}function is(t){var e=t.name,n=t.attributeByName;if("input"===e||"textarea"===e||"select"===e||n.contenteditable){var i=ns(n.value),r=ns(n.contenteditable),s=t.getAttribute("contenteditable");if((s||r)&&i)return td;if("input"===e){var a=t.getAttribute("type");if("radio"===a){var o=ns(n.name),u=ns(n.checked);return o&&u?(y("A radio input can have two-way binding on its name attribute, or its checked attribute - not both",{ractive:t.root}),od):o?od:u?ad:null}if("checkbox"===a){var h=ns(n.name),l=ns(n.checked);return h&&l?Gf:h?Xf:l?Gf:null}return "file"===a&&i?nd:"number"===a&&i?rd:"range"===a&&i?rd:i?ed:null}return "select"===e&&i?t.getAttribute("multiple")?id:ud:"textarea"===e&&i?ed:null}}function rs(t){var e=t.attributeByName.name;return "radio"===t.getAttribute("type")&&(e||{}).interpolator&&t.getAttribute("value")===e.interpolator.model.get()}function ss(t){var e=t.toString();return e?" "+e:""}function as(t){var e=t.getAttribute("xmlns");if(e)return e;if("svg"===t.name)return vc;var n=t.parent;return n?"foreignobject"===n.name?pc:n.node.namespaceURI:t.ractive.el.namespaceURI}function os(t){for(var e,n=t.type,i=t.currentTarget,r=i._ractive&&i._ractive.proxy,s=t.target,a=!0;a&&s&&s!==i;){var o=s._ractive&&s._ractive.proxy;if(o&&o.up.delegate===r&&us(t,s,i)&&(e=o.listeners&&o.listeners[n]))for(var u=e.length,h=0;u>h;h++)a=e[h].call(s,t)!==!1&&a;s=s.parentNode||s.correspondingUseElement;}return a}function us(t,e,n){if(cd&&t instanceof cd)for(var i=e;i&&i!==n;){if(i.disabled)return !1;i=i.parentNode||i.correspondingUseElement;}return !0}function hs(t){var e,n=this,i=this._ractive.proxy;if(i.listeners&&(e=i.listeners[t.type]))for(var r=e.length,s=0;r>s;s++)e[s].call(n,t);}function ls(){var t=this._ractive.proxy;bl.start(),t.formBindings.forEach(cs),bl.end();}function cs(t){t.model.set(t.resetValue);}function fs(t,e,n,i){if(n){var r=n[0];if(r&&3===r.nodeType){var s=r.nodeValue.indexOf(i);n.shift(),0===s?r.nodeValue.length!==i.length&&n.unshift(r.splitText(i.length)):r.nodeValue=i;}else r=t.node=$a.createTextNode(i),n[0]?e.insertBefore(r,n[0]):e.appendChild(r);t.node=r;}else t.node||(t.node=$a.createTextNode(i)),e.appendChild(t.node);}function ds(t){t.base&&t.base.unregister(t.proxy),t.models&&t.models.forEach(function(e){e.unregister&&e.unregister(t);});}function ps(t){var e,n,i=t.deps.length;for(e=0;i>e;e++)n=t.deps[e],n.pathChanged&&n.pathChanged(),n.fragment&&n.fragment.pathModel&&n.fragment.pathModel.applyValue(t.getKeypath());for(i=t.children.length,e=0;i>e;e++)ps(t.children[e]);}function ms(t,e){return e.r?Ye(t,e.r):e.x?new Lf(t,e.x):e.rx?new Ed(t,e.rx):void 0}function vs(t){Sd.call(this,t);}function gs(t){t.sp();var e=Ot(t);if(!e)return null;var n={key:e};if(t.sp(),!t.matchString(":"))return null;t.sp();var i=t.read();return i?(n.value=i.v,n):null}function ys(t,e){var n=new Bd(t,{values:e});return n.result}function bs(t){var e=t.template.f,n=t.element.instance.viewmodel,i=n.value;if(1===e.length&&e[0].t===Ko){var r=ms(t.up,e[0]),s=r.get(!1);e[0].s?!o(s)||e[0].x?n.joinKey(A(t.name)).set(s):y("Cannot copy non-computed object value from static mapping '"+t.name+"'"):(t.model=r,t.link=n.createLink(t.name,r,e[0].r,{mapping:!0}),c(s)&&!r.isReadonly&&t.name in i&&r.set(i[t.name])),r!==t.model&&r.unregister();}else t.boundFragment=new Mp({owner:t,template:e}).bind(),t.model=n.joinKey(A(t.name)),t.model.set(t.boundFragment.valueOf()),t.boundFragment.bubble=function(){Mp.prototype.bubble.call(t.boundFragment),bl.scheduleTask(function(){t.boundFragment.update(),t.model.set(t.boundFragment.valueOf());});};}function ws(t,n,i){var r=xs(t,n,i||{});if(r)return r;if(r=pl.fromId(n,{noThrow:!0})){var s=pl.parseFor(r,t);return s.p&&e(t.partials,s.p),t.partials[n]=s.t}}function xs(e,n,i){var r=Es(n,i.owner);if(r)return r;var s=x("partials",e,n);if(s){r=s.partials[n];var a;if(u(r)){if(a=r,a.styleSet)return a;a=r.bind(s),a.isOwner=t(s.partials,n),r=a.call(e,pl);}if(!r&&""!==r)return void y(po,n,"partial","partial",{ractive:e});if(!pl.isParsed(r)){var o=pl.parseFor(r,s);o.p&&y("Partials ({{>%s}}) cannot contain nested inline partials",n,{ractive:e});var h=a?s:ks(s,n);h.partials[n]=r=o.t;}return a&&(r._fn=a),r.v?(dt(r),s.partials[n]=r.t):r}}function ks(e,n){return t(e.partials,n)?e:_s(e.constructor,n)}function _s(e,n){return e?t(e.partials,n)?e:_s(e.Parent,n):void 0}function Es(e,n){if(n){if(n.template&&n.template.p&&!Fa(n.template.p)&&t(n.template.p,e))return n.template.p[e];if(n.up&&n.up.owner)return Es(e,n.up.owner)}}function As(t){vs.call(this,t);var e=t.template;e.t===Yo?this.yielder=1:e.t===Uo&&(this.type=$o,this.macro=t.macro);}function Cs(t,e){t.partial=t.last=e,Ss(t);var n={owner:t,template:t.partial};t.yielder&&(n.ractive=t.container.parent),t.fn&&(n.cssIds=t.fn._cssIds),t.fragment=new Mp(n);}function Ss(t){t.template.c&&(t.partial=[{t:Do,n:xu,f:t.partial}],Ia(t.partial[0],t.template.c),t.yielder?t.partial[0].y=t:t.partial[0].z=t.template.z);}function Os(t,e,n){var i=e;return Fa(i)?t.partial=i:i&&o(i)?Fa(i.t)?t.partial=i.t:h(i.template)&&(t.partial=Vs(i.template,i.template,t.ractive).t):u(i)&&i.styleSet?(t.fn=i,t.fragment&&(t.fragment.cssIds=i._cssIds)):null!=i&&(i=ws(t.ractive,""+i,t.containerFragment||t.up),i?(t.name=e,i.styleSet?(t.fn=i,t.fragment&&(t.fragment.cssIds=i._cssIds)):t.partial=i):n?t.partial=Vs(""+e,""+e,t.ractive).t:t.name=e),t.partial}function js(t){if(Os(this,t,!0),!this.initing){if(this.dirtyTemplate=!0,this.fnTemplate=this.partial,!this.updating){var e=bl.start();return this.bubble(),bl.end(),e}this.bubble(),bl.promise();}}function Ns(t,e){var n=this.fragment.aliases||(this.fragment.aliases={});e?n[e]=this._data.joinAll(A(t)):n[t]=this._data;}function Ts(e){var n=e.fn,i=e.fragment,r=e.template=Ia({},e.template),s=e.handle=i.getContext({proxy:e,aliasLocal:Ns,name:e.template.e||e.name,attributes:{},setTemplate:js.bind(e),template:r,macro:n});if(r.p||(r.p={}),r.p=s.partials=Ia({},r.p),t(r.p,"content")||(r.p.content=r.f||[]),Fa(n.attributes)){e._attrs={};var a=function(){this.dirty=!0,e.dirtyAttrs=!0,e.bubble();};if(Fa(r.m)){var o=r.m;r.p[Fd]=r.m=o.filter(function(t){return !~n.attributes.indexOf(t.n)}),o.filter(function(t){return ~n.attributes.indexOf(t.n)}).forEach(function(t){var n=new Mp({template:t.f,owner:e});n.bubble=a,n.findFirstNode=f,e._attrs[t.n]=n;});}else r.p[Fd]=[];}else r.p[Fd]=r.m;e._attrs&&(La(e._attrs).forEach(function(t){e._attrs[t].bind();}),e.refreshAttrs()),e.initing=1,e.proxy=n.call(e.ractive,s,s.attributes)||{},e.partial||(e.partial=[]),e.fnTemplate=e.partial,e.initing=0,Ss(e),i.resetTemplate(e.partial);}function Vs(t,e,n){var i;try{i=pl.parse(e,pl.getParseOptions(n));}catch(r){y("Could not parse partial from expression '"+t+"'\n"+r.message);}return i||{t:[]}}function Ms(t){var e,n,i=t;t:for(;i;){for(n=0;!n&&i;){if(i.owner.type===Uo&&(n=i.owner),i.owner.ractive&&i.owner.ractive.delegate===!1)break t;i=i.parent||i.componentParent;}if(n.delegate===!1)break t;for(e=n.delegate||n;i&&!i.iterations;){if(i.owner.ractive&&i.owner.ractive.delegate===!1)break t;i=i.parent||i.componentParent;}}return e}function Ps(t,e,n,i){var r=t.context?Rs(t,e,n):void 0;e.key=n,e.index=i,e.context=r,t.source&&(e.lastValue=r&&r.get()),e.idxModel&&e.idxModel.applyValue(i),e.keyModel&&e.keyModel.applyValue(n),e.pathModel&&(e.pathModel.context=r,e.pathModel.applyValue(r.getKeypath())),e.rootModel&&(e.rootModel.context=r,e.rootModel.applyValue(r.getKeypath(e.ractive.root)));var s=e.aliases;t.aliases&&t.aliases.forEach(function(t){"."===t.x.r?s[t.n]=r:"@index"===t.x.r?s[t.n]=e.getIndex():"@key"===t.x.r?s[t.n]=e.getKey():"@keypath"===t.x.r?s[t.n]=e.getKeypath():"@rootpath"===t.x.r&&(s[t.n]=e.getKeypath(!0));});}function Is(t,e){var n=t.context.get()||[];return e===!0?n.slice():n.map(function(t){return e.reduce(function(t,e){return t&&t[e]},t)})}function Rs(t,e,n){if(t.source){var i,r=t.source.model.get();if(r.indexOf&&~(i=r.indexOf(t.context.joinKey(n).get())))return t.source.model.joinKey(i)}return t.context.joinKey(n)}function Bs(t){return !t||Fa(t)&&0===t.length||s(t)&&0===La(t).length}function Ks(t,e){return e||Fa(t)?wu:a(t)?ku:c(t)?null:yu}function Ls(t,e){var n=(t.containerFragment||t.up).findNextNode(t);if(n){var i=ei();e.render(i),n.parentNode.insertBefore(i,n);}else e.render(t.up.findParentNode());}function Ds(){Jd=!$a[Xd];}function Fs(){Jd=!1;}function zs(){Jd=!0;}function Us(t){return t?(up.test(t)&&(t="-"+t),t.replace(/[A-Z]/g,function(t){return "-"+t.toLowerCase()})):""}function $s(e,n,i){for(var r=n;r;){if(t(r,e)&&(c(i)||i?r.rendering:r.unrendering))return r[e];r=r.component&&r.component.ractive;}return n[e]}function qs(t,e){var n=[];if(null==t||""===t)return n;var i,r,s;Cp&&(r=Sp[e.tagName])?(i=Hs("DIV"),i.innerHTML=r[0]+t+r[1],i=i.querySelector(".x"),"SELECT"===i.tagName&&(s=i.options[i.selectedIndex])):e.namespaceURI===vc?(i=Hs("DIV"),i.innerHTML='<svg class="x">'+t+"</svg>",i=i.querySelector(".x")):"TEXTAREA"===e.tagName?(i=rc("div"),"undefined"!=typeof i.textContent?i.textContent=t:i.innerHTML=t):(i=Hs(e.tagName),i.innerHTML=t,"SELECT"===i.tagName&&(s=i.options[i.selectedIndex]));for(var a;a=i.firstChild;)n.push(a),i.removeChild(a);var o;if("SELECT"===e.tagName)for(o=n.length;o--;)n[o]!==s&&(n[o].selected=!1);return n}function Hs(t){return Op[t]||(Op[t]=rc(t))}function Zs(e,n){var i,r=x("components",e,n);if(r&&(i=r.components[n],i&&!i.isInstance))if(i["default"]&&i["default"].isInstance)i=i["default"];else if(!i.then&&u(i)){var s=i.bind(r);if(s.isOwner=t(r.components,n),i=s(),!i)return void y(po,n,"component","component",{ractive:e});h(i)&&(i=Zs(e,i)),i._fn=s,r.components[n]=i;}return i}function Ws(t,e){var n=e.template.p||{},i=e.template.e,r=Ia({},e,{template:{t:Uo,e:i},macro:function(r){r.setTemplate(n["async-loading"]||[]),t.then(function(t){e.up.ractive.components[i]=t,n["async-loaded"]?(r.partials.component=[e.template],r.setTemplate(n["async-loaded"])):r.setTemplate([e.template]);},function(t){n["async-failed"]?(r.aliasLocal("error","error"),r.set("@local.error",t),r.setTemplate(n["async-failed"])):r.setTemplate([]);});}});return new As(r)}function Gs(t,e,n){var i=t.f.find(function(t){return t.t===e});return i?i.n?[{t:19,n:54,f:i.f||[],z:[{n:i.n,x:{r:"__await."+n}}]}]:i.f||[]:[]}function Qs(t){var e=t.template,n=Gs(e,Au,"value"),i=Gs(e,Cu,"error"),r=Gs(e,Do),s=Gs(e,_u),a=Ia({},t,{template:{t:Uo,m:[{t:Wo,n:"for",f:[{t:Ko,r:e.r,rx:e.rx,x:e.x}]}]},macro:function(t,e){function a(e){e["for"]&&u(e["for"].then)?(t.setTemplate(r),e["for"].then(function(e){t.set("@local.value",e),t.setTemplate(n);},function(e){t.set("@local.error",e),t.setTemplate(i);})):c(e["for"])?t.setTemplate(s):(t.set("@local.value",e["for"]),t.setTemplate(n));}return t.aliasLocal("__await"),a(e),{update:a}}});return a.macro.attributes=["for"],new As(a)}function Ys(t){if(h(t.template))return new Qd(t);var e,n,i=t.template.t;if(i===Uo){if(n=t.template.e,e=x("partials",t.up.ractive,n),e&&(e=e.partials[n],e.styleSet))return t.macro=e,new As(t);if(e=Zs(t.up.ractive,n)){if(u(e.then))return Ws(e,t);if(u(e))return new Mf(t,e)}return new(e=Vp[n.toLowerCase()]||ld)(t)}var r;if(i===Wo){var s=t.owner;(!s||s.type!==Zo&&s.type!==Qo&&s.type!==Uo)&&(s=zn(t.up)),t.element=s,r=s.type===Qo||s.type===Zo?Kd:Ef;}else r=Tp[i];if(!r)throw new Error("Unrecognised item type "+i);return new r(t)}function Js(t,e,n,i){return void 0===i&&(i=0),t.map(function(t){if(t.type===Bo)return t.template;if(t.fragment)return t.fragment.iterations?t.fragment.iterations.map(function(t){return Js(t.items,e,n,i)}).join(""):Js(t.fragment.items,e,n,i);var r=n+"-"+i++,s=t.model||t.newModel;return e[r]=s?s.wrapper?s.wrapperValue:s.get():void 0,"${"+r+"}"}).join("")}function Xs(t,e,n){void 0===n&&(n={});for(var i=0;i<t.length;i++)if(!n[t[i].n]){var r=ms(e,t[i].x);n[t[i].n]=r,r.reference();}return n}function ta(t){var e,n=sn(this);if(t){if(this.rootModel)return this.rootModel;this.rootModel=new zd(this.context.getKeypath(this.ractive.root),this.context,this.ractive.root),e=this.rootModel;}else {if(this.pathModel)return this.pathModel;this.pathModel=new zd(this.context.getKeypath(),this.context),e=this.pathModel;}return n&&n.context&&n.getKeypath(t).registerChild(e),e}function ea(t,e,n){var i=t.viewmodel.computed;if(i)for(var r in i)r in t.viewmodel.value&&i[r]&&!i[r].isReadonly&&i[r].set(t.viewmodel.value[r]);af.init(t.constructor,t,e),Fa(e.use)&&t.use.apply(t,e.use.filter(function(t){return !t.construct})),ql.config.fire(t),ql.init.begin(t);var s=t.fragment=na(t,n);if(s&&s.bind(t.viewmodel),ql.init.end(t),Pr(t,e,"observe"),s){var a=t.el=t.target=ni(t.el||t.target);if(a&&!t.component){var o=t.render(a,t.append);Ma.DEBUG_PROMISES&&o["catch"](function(e){throw b("Promise debugging is enabled, to help solve errors that happen asynchronously. Some browsers will log unhandled promise rejections, in which case you can safely disable promise debugging:\n  Ractive.DEBUG_PROMISES = false;"),y("An error happened during rendering",{ractive:t}),m(e),e});}}}function na(t,e){if(void 0===e&&(e={}),t.template){var n=[].concat(t.constructor._cssIds||[],e.cssIds||[]);return new Mp({owner:t,template:t.template,cssIds:n})}}function ia(t,e,n,i){t.rendering=!0;var r=bl.start();if(bl.scheduleTask(function(){return ql.render.fire(t)},!0),t.fragment.rendered)throw new Error("You cannot call ractive.render() on an already rendered instance! Call ractive.unrender() first");if(t.destroyed&&(t.destroyed=!1,t.fragment=na(t).bind(t.viewmodel)),n=ni(n)||t.anchor,t.el=t.target=e,t.anchor=n,t.cssId&&_i(),e)if((e.__ractive_instances__||(e.__ractive_instances__=[])).push(t),n){var s=$a.createDocumentFragment();t.fragment.render(s),e.insertBefore(s,n);}else t.fragment.render(e,i);return bl.end(),t.rendering=!1,r.then(function(){t.torndown||ql.complete.fire(t);})}function ra(t,e){if(this.torndown)return y("ractive.render() was called on a Ractive instance that was already torn down"),Promise.resolve();if(t=ni(t)||this.el,!this.append&&t){var n=t.__ractive_instances__;n&&n.forEach(it),this.enhance||(t.innerHTML="");}var i=this.enhance?P(t.childNodes):null,r=ia(this,t,e,i);if(i)for(;i.length;)t.removeChild(i.pop());return r}function sa(t){if(t=t||{},!o(t))throw new Error("The reset method takes either no arguments, or an object containing new data");t=Jc.init(this.constructor,this,{data:t});var e=bl.start(),n=this.viewmodel.wrapper;n&&n.reset?n.reset(t)===!1&&this.viewmodel.set(t):this.viewmodel.set(t);for(var i,r=af.reset(this),s=r.length;s--;)if(Ip.indexOf(r[s])>-1){i=!0;break}return i&&(ql.unrender.fire(this),this.fragment.resetTemplate(this.template),ql.render.fire(this),ql.complete.fire(this)),bl.end(),ql.reset.fire(this,t),e}function aa(t,e,n,i){t.forEach(function(t){if(t.type===$o&&(t.refName===e||t.name===e))return t.inAttribute=n,void i.push(t);if(t.fragment)aa(t.fragment.iterations||t.fragment.items,e,n,i);else if(Fa(t.items))aa(t.items,e,n,i);else if(t.type===Qo&&t.instance){if(t.instance.partials[e])return;aa(t.instance.fragment.items,e,n,i);}t.type===Uo&&Fa(t.attributes)&&aa(t.attributes,e,!0,i);});}function oa(t,e){var n=[];aa(this.fragment.items,t,!1,n);var i=bl.start();return this.partials[t]=e,n.forEach(Q),bl.end(),i}function ua(t){Xc.init(null,this,{template:t});var e=this.transitionsEnabled;this.transitionsEnabled=!1;var n=this.component;n&&(n.shouldDestroy=!0),this.unrender(),n&&(n.shouldDestroy=!1);var i=bl.start();this.fragment.unbind().unrender(!0),this.fragment=new Mp({template:this.template,root:this,owner:this});var r=ei();return this.fragment.bind(this.viewmodel).render(r),n&&!n.external?this.fragment.findParentNode().insertBefore(r,n.findNextNode()):this.el.insertBefore(r,this.anchor),bl.end(),this.transitionsEnabled=e,i}function ha(t,e,n){var i=this,r=o(t)?e:n;return an(un(i,t,e,r&&r.isolated),r)}function la(t,e,n){var i=l(e)?-e:-1,r=o(e)?e:n;return cn(this,t,i,r)}function ca(t,e){if(!h(t))throw new TypeError(fo);return an(on(this,t,null,e&&e.isolated).map(function(t){return [t,!t.get()]}),e)}function fa(){var t=[this.cssId].concat(this.findAllComponents().map(function(t){return t.cssId})),e=La(t.reduce(function(t,e){return t[e]=!0,t},{}));return Ei(e)}function da(){return this.fragment.toString(!0)}function pa(){return this.fragment.toString(!1)}function ma(t,e,n){e instanceof HTMLElement||s(e)&&(n=e),e=e||this.event.node,e&&e._ractive||p("No node was supplied for transition "+t),n=n||{};var i=e._ractive.proxy,r=new _p({owner:i,up:i.up,name:t,params:n});r.bind();var a=bl.start();return bl.registerTransition(r),bl.end(),a.then(function(){return r.unbind()}),a}function va(t){var e=bl.start();return this.viewmodel.joinAll(A(t),{lastLink:!1}).unlink(),bl.end(),e}function ga(){if(!this.fragment.rendered)return y("ractive.unrender() was called on a Ractive instance that was not rendered"),Promise.resolve();this.unrendering=!0;var t=bl.start();ql.unrendering.fire(this);var e=!this.component||(this.component.anchor||{}).shouldDestroy||this.component.shouldDestroy||this.shouldDestroy;return this.fragment.unrender(e),e&&(this.destroyed=!0),V(this.el.__ractive_instances__,this),ql.unrender.fire(this),bl.end(),this.unrendering=!1,t}function ya(t,e){var n=bl.start();return t?this.viewmodel.joinAll(A(t)).updateFromBindings(e!==!1):this.viewmodel.updateFromBindings(!0),bl.end(),n}function ba(){for(var t=this,e=[],n=arguments.length;n--;)e[n]=arguments[n];return e.forEach(function(e){e({proto:t,Ractive:t.constructor.Ractive,instance:t});}),this}function wa(t){return t&&t instanceof this}function xa(t,e){return this._cssModel.joinAll(A(t)).get(!0,e)}function ka(t,e){if(zp.find(function(e){return e.id===t}))throw new Error("Extra styles with the id '"+t+"' have already been added.");zp.push({id:t,css:e}),this.css||Object.defineProperty(this,"css",{configurable:!1,writable:!1,value:_a}),this._cssDef||(Object.defineProperty(this,"_cssDef",{configurable:!0,writable:!1,value:{transform:!1,id:"Ractive.addStyle"}}),ki(this._cssDef)),Ii(this),_i(!0);}function _a(t){return zp.map(function(e){return "\n/* ---- extra style "+e.id+" */\n"+(u(e.css)?e.css(t):e.css)}).join("")}function Ea(t){return !!zp.find(function(e){return e.id===t})}function Aa(t,e,n){var i=o(t)?e:n,r=jl;return an(un({viewmodel:r},t,e,!0),i)}function Ca(t,e){return jl.joinAll(A(t)).get(!0,e)}function Sa(){for(var t=this,e=[],n=arguments.length;n--;)e[n]=arguments[n];return e.forEach(function(e){u(e)&&e({proto:t.prototype,Ractive:t.Ractive,instance:t});}),this}function Oa(){for(var t=[],e=arguments.length;e--;)t[e]=arguments[e];return t.length?t.reduce(Na,this):Na(this)}function ja(t,e){return void 0===e&&(e={}),Na(this,e,t)}function Na(t,e,i){void 0===e&&(e={});var r,s=u(i)&&i;if(e.prototype instanceof Ma)throw new Error("Ractive no longer supports multiple inheritance.");if(s){if(!(s.prototype instanceof t))throw new Error("Only classes that inherit the appropriate prototype may be used with extend");if(!Up.test(s.toString()))throw new Error("Only classes that call super in their constructor may be used with extend");r=s.prototype;}else s=function(t){return this instanceof s?(Ir(this,t||{}),void ea(this,t||{},{})):new s(t)},r=Ra(t.prototype),r.constructor=s,s.prototype=r;if(Ka(s,{defaults:{value:r},extend:{value:Oa,writable:!0,configurable:!0},extendWith:{value:ja,writable:!0,configurable:!0},extensions:{value:[]},use:{value:Sa},isInstance:{value:wa},Parent:{value:t},Ractive:{value:Ma},styleGet:{value:xa.bind(s),configurable:!0},styleSet:{value:Mi.bind(s),configurable:!0}}),af.extend(t,r,e,s),s._on=(t._on||[]).concat(n(e.on)),s._observe=(t._observe||[]).concat(n(e.observe)),t.extensions.push(s),e.attributes){var a;a=Fa(e.attributes)?{optional:e.attributes,required:[]}:e.attributes,Fa(a.required)||(a.required=[]),Fa(a.optional)||(a.optional=[]),s.attributes=a;}return Jc.extend(t,r,e,s),Ba(s,"helpers",{writable:!0,value:r.helpers}),Fa(e.use)&&s.use.apply(s,e.use),s}function Ta(t,e){if(!u(t))throw new Error("The macro must be a function");return Ia(t,e),Ka(t,{extensions:{value:[]},_cssIds:{value:[]},cssData:{value:Ia(Ra(this.cssData),t.cssData||{})},styleGet:{value:xa.bind(t)},styleSet:{value:Mi.bind(t)}}),Ba(t,"_cssModel",{value:new Gc(t)}),t.css&&Ki(t,t,t),this.extensions.push(t),t}function Va(t,e,n){return w(e,n,t)}function Ma(t){return this instanceof Ma?(Ir(this,t||{}),void ea(this,t||{},{})):new Ma(t)}Object.assign||(Object.assign=function(t){for(var e=[],n=arguments.length-1;n-->0;)e[n]=arguments[n+1];if(null==t)throw new TypeError("Cannot convert undefined or null to object");for(var i=Object(t),r=e.length,s=0;r>s;s++){var a=e[s];for(var o in a)Object.prototype.hasOwnProperty.call(a,o)&&(i[o]=a[o]);}return i});var Pa=Object,Ia=Pa.assign,Ra=Pa.create,Ba=Pa.defineProperty,Ka=Pa.defineProperties,La=Pa.keys,Da=Object.prototype.toString,Fa=Array.isArray;if(Array.prototype.find||Ba(Array.prototype,"find",{value:function(e,n){if(null===this||c(this))throw new TypeError("Array.prototype.find called on null or undefined");if(!u(e))throw new TypeError(e+" is not a function");for(var i=Object(this),r=i.length>>>0,s=0;r>s;s++)if(t(i,s)&&e.call(n,i[s],s,i))return i[s];return void 0},configurable:!0,writable:!0}),"undefined"!=typeof window&&window.Node&&window.Node.prototype&&!window.Node.prototype.contains&&(Node.prototype.contains=function(t){var e=this;if(!t)throw new TypeError("node required");do if(e===t)return !0;while(t=t&&t.parentNode);return !1}),"undefined"!=typeof window&&window.performance&&!window.performance.now){window.performance=window.performance||{};var za=Date.now();window.performance.now=function(){return Date.now()-za};}var Ua="undefined"!=typeof window?window:null,$a=Ua?document:null,qa=!!$a,Ha="undefined"!=typeof global?global:Ua,Za="undefined"!=typeof console&&u(console.warn)&&u(console.warn.apply),Wa=$a?$a.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure","1.1"):!1,Ga=["o","ms","moz","webkit"];if(!Ha.Promise){var Qa={},Ya={},Ja={},Xa=Ha.Promise=function(t){var e,n,i=[],r=[],s=Qa,a=function(t){return function(a){s===Qa&&(e=a,s=t,n=eo(s===Ya?i:r,e),to(n));}},o=a(Ya),h=a(Ja);try{t(o,h);}catch(l){h(l);}return {then:function(t,e){var a=new Xa(function(o,h){var l=function(t,e,n){u(t)?e.push(function(e){try{no(a,t(e),o,h);}catch(n){h(n);}}):e.push(n);};l(t,i,o),l(e,r,h),s!==Qa&&to(n);});return a},"catch":function(t){return this.then(null,t)},"finally":function(t){return this.then(function(e){return t(),e},function(e){throw t(),e})}}};Xa.all=function(t){return new Xa(function(e,n){var i,r,s=[];if(!t.length)return void e(s);var a=function(t,r){t&&u(t.then)?t.then(function(t){s[r]=t,--i||e(s);},n):(s[r]=t,--i||e(s));};for(i=r=t.length;r--;)a(t[r],r);})},Xa.race=function(t){return new Xa(function(e,n){function i(t){s&&(s=!1,e(t));}function r(t){s&&(s=!1,n(t));}for(var s=!0,a=0;a<t.length;a++)t[a]&&u(t[a].then)&&t[a].then(i,r);})},Xa.resolve=function(t){return t&&u(t.then)?t:new Xa(function(e){e(t);})},Xa.reject=function(t){return t&&u(t.then)?t:new Xa(function(e,n){n(t);})};var to=function(t){setTimeout(t,0);},eo=function(t,e){return function(){for(var n=void 0;n=t.shift();)n(e);}},no=function(t,e,n,i){var r;if(e===t)throw new TypeError("A promise's fulfillment handler cannot return the same promise");if(e instanceof Xa)e.then(n,i);else if(e&&(o(e)||u(e))){try{r=e.then;}catch(s){return void i(s)}if(u(r)){var a,h=function(e){a||(a=!0,no(t,e,n,i));},l=function(t){a||(a=!0,i(t));};try{r.call(e,h,l);}catch(s){if(!a)return i(s),void(a=!0)}}else n(e);}else n(e);};}if(!("undefined"==typeof window||window.requestAnimationFrame&&window.cancelAnimationFrame)){var io=0;window.requestAnimationFrame=function(t){var e=Date.now(),n=Math.max(0,16-(e-io)),i=window.setTimeout(function(){t(e+n);},n);return io=e+n,i},window.cancelAnimationFrame=function(t){clearTimeout(t);};}var ro,so,ao,oo={el:void 0,append:!1,delegate:!0,enhance:!1,template:null,allowExpressions:!0,delimiters:["{{","}}"],tripleDelimiters:["{{{","}}}"],staticDelimiters:["[[","]]"],staticTripleDelimiters:["[[[","]]]"],csp:!0,interpolate:!1,preserveWhitespace:!1,sanitize:!1,stripComments:!0,contextLines:0,data:Ra(null),helpers:Ra(null),computed:Ra(null),syncComputedChildren:!1,resolveInstanceMembers:!1,warnAboutAmbiguity:!1,adapt:[],isolated:!0,twoway:!0,lazy:!1,noIntro:!1,noOutro:!1,transitionsEnabled:!0,complete:void 0,nestedTransitions:!0,css:null,noCSSTransform:!1},uo={linear:function(t){return t},easeIn:function(t){return Math.pow(t,3)},easeOut:function(t){return Math.pow(t-1,3)+1},easeInOut:function(t){return (t/=.5)<1?.5*Math.pow(t,3):.5*(Math.pow(t-2,3)+2)}},ho={};if(Za){var lo=["%cRactive.js %c1.3.14 %cin debug mode, %cmore...","color: rgb(114, 157, 52); font-weight: normal;","color: rgb(85, 85, 85); font-weight: normal;","color: rgb(85, 85, 85); font-weight: normal;","color: rgb(82, 140, 224); font-weight: normal; text-decoration: underline;"],co="You're running Ractive 1.3.14 in debug mode - messages will be printed to the console to help you fix problems and optimise your application.\n\nTo disable debug mode, add this line at the start of your app:\n  Ractive.DEBUG = false;\n\nTo disable debug mode when your app is minified, add this snippet:\n  Ractive.DEBUG = /unminified/.test(function(){/*unminified*/});\n\nGet help and support:\n  http://ractive.js.org\n  http://stackoverflow.com/questions/tagged/ractivejs\n  http://groups.google.com/forum/#!forum/ractive-js\n  http://twitter.com/ractivejs\n\nFound a bug? Raise an issue:\n  https://github.com/ractivejs/ractive/issues\n\n";ao=function(){if(Ma.WELCOME_MESSAGE===!1)return void(ao=f);var t="WELCOME_MESSAGE"in Ma?Ma.WELCOME_MESSAGE:co,e=!!console.groupCollapsed;e&&console.groupCollapsed.apply(console,lo),console.log(t),e&&console.groupEnd(lo),ao=f;},so=function(t,e){if(ao(),o(e[e.length-1])){var n=e.pop(),i=n?n.ractive:null;if(i){var r;i.component&&(r=i.component.name)&&(t="<"+r+"> "+t);var s;(s=n.node||i.fragment&&i.fragment.rendered&&i.find("*"))&&e.push(s);}}console.warn.apply(console,["%cRactive.js: %c"+t,"color: rgb(114, 157, 52);","color: rgb(85, 85, 85);"].concat(e));},ro=function(){console.log.apply(console,arguments);};}else so=ro=ao=f;var fo="Bad arguments",po='A function was specified for "%s" %s, but no %s was returned',mo=function(t,e){return 'Missing "'+t+'" '+e+" plugin. You may need to download a plugin via http://ractive.js.org/integrations/#"+e+"s"},vo={number:function(t,e){if(!r(t)||!r(e))return null;t=+t,e=+e;var n=e-t;return n?function(e){return t+e*n}:function(){return t}},array:function(t,e){var n,i;if(!Fa(t)||!Fa(e))return null;var r=[],s=[];for(i=n=Math.min(t.length,e.length);i--;)s[i]=k(t[i],e[i]);for(i=n;i<t.length;i+=1)r[i]=t[i];for(i=n;i<e.length;i+=1)r[i]=e[i];return function(t){for(var e=n;e--;)r[e]=s[e](t);return r}},object:function(e,n){if(!s(e)||!s(n))return null;var i=[],r={},a={},o=function(s){t(e,s)&&(t(n,s)?(i.push(s),a[s]=k(e[s],n[s])||function(){
	return n[s]}):r[s]=e[s]);};for(var u in e)o(u);for(var h in n)t(n,h)&&!t(e,h)&&(r[h]=n[h]);var l=i.length;return function(t){for(var e=l;e--;){var n=i[e];r[n]=a[n](t);}return r}}},go=/\[\s*(\*|[0-9]|[1-9][0-9]+)\s*\]/g,yo=/([^\\](?:\\\\)*)\./,bo=/\\|\./g,wo=/((?:\\)+)\1|\\(\.)/g,xo=Function.prototype.bind,ko={early:[],mark:[]},_o={early:[],mark:[]},Eo={virtual:!1},Ao=function(t){this.deps=[],this.children=[],this.childByKey={},this.links=[],this.bindings=[],t&&(this.parent=t,this.root=t.root);},Co=Ao.prototype;Co.addShuffleTask=function(t,e){void 0===e&&(e="early"),ko[e].push(t);},Co.addShuffleRegister=function(t,e){void 0===e&&(e="early"),_o[e].push({model:this,item:t});},Co.downstreamChanged=function(){},Co.findMatches=function(t){var e,n,i=t.length,r=[this],s=function(){var i=t[n];"*"===i?(e=[],r.forEach(function(t){e.push.apply(e,t.getValueChildren(t.get()));})):e=r.map(function(t){return t.joinKey(i)}),r=e;};for(n=0;i>n;n+=1)s();return e},Co.getKeypath=function(t){if(t!==this.ractive&&this._link)return this._link.target.getKeypath(t);if(!this.keypath){var e=this.parent&&this.parent.getKeypath(t);this.keypath=e?this.parent.getKeypath(t)+"."+_(this.key):_(this.key);}return this.keypath},Co.getValueChildren=function(t){var e,n=this;Fa(t)?(e=[],"length"in this&&this.length!==t.length&&e.push(this.joinKey("length")),t.forEach(function(t,i){e.push(n.joinKey(i));})):s(t)||u(t)?e=La(t).map(function(t){return n.joinKey(_(t))}):null!=t&&(e=[]);var i=this.computed;return i&&e.push.apply(e,La(i).map(function(t){return n.joinKey(t)})),e},Co.getVirtual=function(t){var e=this,n=this.get(t,{virtual:!1});if(a(n)){for(var i=Fa(n)?[]:Ra(null),r=La(n),s=r.length;s--;){var o=e.childByKey[r[s]];o?o._link?i[r[s]]=o._link.getVirtual():i[r[s]]=o.getVirtual():i[r[s]]=n[r[s]];}for(s=this.children.length;s--;){var u=e.children[s];u.key in i||!u._link||(i[u.key]=u._link.getVirtual());}if(this.computed)for(r=La(this.computed),s=r.length;s--;)i[r[s]]=e.computed[r[s]].get();return i}return n},Co.has=function(t){var e=this;if(this._link)return this._link.has(t);var n=this.get(!1,Eo);if(!n)return !1;if(t=C(t),(u(n)||s(n))&&t in n)return !0;var i=this.computed;return i&&t in this.computed?!0:(i=this.root.ractive&&this.root.ractive.computed,i&&La(i).forEach(function(t){return i[t].pattern&&i[t].pattern.test(e.getKeypath())?!0:void 0}),!1)},Co.joinAll=function(t,e){for(var n=this,i=0;i<t.length;i+=1){if(e&&e.lastLink===!1&&i+1===t.length&&n.childByKey[t[i]]&&n.childByKey[t[i]]._link)return n.childByKey[t[i]];n=n.joinKey(t[i],e);}return n},Co.notifyUpstream=function(t){for(var e=this,n=this.parent,i=t||[this.key];n;)n.patterns&&n.patterns.forEach(function(t){return t.notify(i.slice())}),i.unshift(n.key),n.links.forEach(function(t){return t.notifiedUpstream(i,e.root)}),n.deps.forEach(function(t){return t.handleChange(i)}),n.downstreamChanged(t),n=n.parent;},Co.rebind=function(t,e,n){var i=this;if(this._link&&this._link.rebind(t,e,!1),t!==this){for(var r=this.deps.length;r--;)i.deps[r].rebind&&i.deps[r].rebind(t,e,n);for(r=this.links.length;r--;){var s=i.links[r];s.owner&&s.owner._link&&s.relinking(t,n);}for(r=this.children.length;r--;){var a=i.children[r];a.rebind(t?t.joinKey(a.key):void 0,a._link||a,n),i.dataModel&&i.addShuffleTask(function(){return U(i,i.retrieve())},"early");}for(r=this.bindings.length;r--;)i.bindings[r].rebind(t,e,n);}},Co.reference=function(){"refs"in this?this.refs++:this.refs=1;},Co.register=function(t){this.deps.push(t);},Co.registerLink=function(t){S(this.links,t);},Co.registerPatternObserver=function(t){(this.patterns||(this.patterns=[])).push(t),this.register(t);},Co.registerTwowayBinding=function(t){this.bindings.push(t);},Co.unreference=function(){"refs"in this&&this.refs--;},Co.unregister=function(t){V(this.deps,t);},Co.unregisterLink=function(t){V(this.links,t);},Co.unregisterPatternObserver=function(t){V(this.patterns,t),this.unregister(t);},Co.unregisterTwowayBinding=function(t){V(this.bindings,t);},Co.updateFromBindings=function(t){for(var e=this,n=this.bindings.length;n--;){var i=e.bindings[n].getValue();i!==e.value&&e.set(i);}if(!this.bindings.length){var r=D(this.deps);r&&r.value!==this.value&&this.set(r.value);}t&&(this.children.forEach(L),this.links.forEach(L),this._link&&this._link.updateFromBindings(t));};var So,Oo=[],jo={key:"@missing",animate:f,applyValue:f,get:f,getKeypath:function(){return this.key},joinAll:function(){return this},joinKey:function(){return this},mark:f,registerLink:f,shufle:f,set:f,unregisterLink:f};jo.parent=jo;var No=function(e){function n(t,n,i,r){e.call(this,t),this.owner=n,this.target=i,this.key=c(r)?n.key:r,n&&n.isLink&&(this.sourcePath=n.sourcePath+"."+this.key),i&&i.registerLink(this),t&&(this.isReadonly=t.isReadonly),this.isLink=!0;}e&&(n.__proto__=e);var i=n.prototype=Object.create(e&&e.prototype);return i.constructor=n,i.animate=function(t,e,n,i){return this.target.animate(t,e,n,i)},i.applyValue=function(t){this.boundValue&&(this.boundValue=null),this.target.applyValue(t);},i.attach=function(t){var e=Ye(t,this.key);e?this.relinking(e,!1):this.owner.unlink();},i.detach=function(){this.relinking(jo,!1);},i.get=function(t,e){void 0===e&&(e={}),t&&(H(this),e.unwrap="unwrap"in e?e.unwrap:!0);var n="shouldBind"in e?e.shouldBind:!0;return e.shouldBind=this.mapping&&this.target.parent&&this.target.parent.isRoot,K(this,this.target.get(!1,e),n)},i.getKeypath=function(t){return t&&t!==this.root.ractive?this.target.getKeypath(t):e.prototype.getKeypath.call(this,t)},i.handleChange=function(){this.deps.forEach(Q),this.links.forEach(Q),this.notifyUpstream();},i.isDetached=function(){return this.virtual&&this.target===jo},i.joinKey=function(e){if(c(e)||""===e)return this;if(!t(this.childByKey,e)){var i=new n(this,this,this.target.joinKey(e),e);this.children.push(i),this.childByKey[e]=i;}return this.childByKey[e]},i.mark=function(t){this.target.mark(t);},i.marked=function(){this.boundValue&&(this.boundValue=null),this.links.forEach(X),this.deps.forEach(Q);},i.markedAll=function(){this.children.forEach(tt),this.marked();},i.notifiedUpstream=function(t,e){var n=this;if(this.links.forEach(function(e){return e.notifiedUpstream(t,n.root)}),this.deps.forEach(Q),t&&this.rootLink&&this.root!==e){var i=t.slice(1);i.unshift(this.key),this.notifyUpstream(i);}},i.relinked=function(){this.target.registerLink(this),this.children.forEach(function(t){return t.relinked()});},i.relinking=function(t,e){var n=this;this.rootLink&&this.sourcePath&&(t=ht(this.sourcePath,t,this.target)),t&&this.target!==t&&(this.target&&this.target.unregisterLink(this),this.target=t,this.children.forEach(function(n){n.relinking(t.joinKey(n.key),e);}),this.rootLink&&this.addShuffleTask(function(){n.relinked(),e||(n.markedAll(),n.notifyUpstream());}));},i.set=function(t){this.boundValue&&(this.boundValue=null),this.target.set(t);},i.shuffle=function(t){this.shuffling||(this.target.shuffling?z(this,t,!0):this.target.shuffle?this.target.shuffle(t):this.target.mark());},i.source=function(){return this.target.source?this.target.source():this.target},i.teardown=function(){this._link&&this._link.teardown(),this.target.unregisterLink(this),this.children.forEach(it);},n}(Ao);Ao.prototype.link=function(t,e,n){var i=this._link||new No(this.parent,this,t,this.key);return i.implicit=n&&n.implicit,i.mapping=n&&n.mapping,i.sourcePath=e,i.rootLink=!0,this._link&&this._link.relinking(t,!1),this.rebind(i,this,!1),F(),this._link=i,i.markedAll(),this.notifyUpstream(),i},Ao.prototype.unlink=function(){if(this._link){var t=this._link;this._link=void 0,t.rebind(this,t,!1),F(),t.teardown(),this.notifyUpstream();}};var To=Ra(null),Vo=4,Mo=/^\s+/,Po=function(t){this.name="ParseError",this.message=t;try{throw new Error(t)}catch(e){this.stack=e.stack;}};Po.prototype=Error.prototype;var Io=function(t,e){var n,i=0;this.str=t,this.options=e||{},this.pos=0,this.lines=this.str.split("\n"),this.lineEnds=this.lines.map(function(t){var e=i+t.length+1;return i=e,e},0),this.init&&this.init(t,e);for(var r=[];this.pos<this.str.length&&(n=this.read());)r.push(n);this.leftover=this.remaining(),this.result=this.postProcess?this.postProcess(r,e):r;};Io.prototype={read:function(t){var e,n,i=this;t||(t=this.converters);var r=this.pos,s=t.length;for(e=0;s>e;e+=1)if(i.pos=r,n=t[e](i))return n;return null},getContextMessage:function(t,e){var n=this.getLinePos(t),i=n[0],r=n[1];if(-1===this.options.contextLines)return [i,r,e+" at line "+i+" character "+r];var s=this.lines[i-1],a="",o="";if(this.options.contextLines){var u=i-1-this.options.contextLines<0?0:i-1-this.options.contextLines;a=this.lines.slice(u,i-1-u).join("\n").replace(/\t/g,"  "),o=this.lines.slice(i,i+this.options.contextLines).join("\n").replace(/\t/g,"  "),a&&(a+="\n"),o&&(o="\n"+o);}var h=0,l=a+s.replace(/\t/g,function(t,e){return r>e&&(h+=1),"  "})+"\n"+new Array(r+h).join(" ")+"^----"+o;return [i,r,e+" at line "+i+" character "+r+":\n"+l]},getLinePos:function(t){for(var e=this,n=0,i=0;t>=this.lineEnds[n];)i=e.lineEnds[n],n+=1;var r=t-i;return [n+1,r+1,t]},error:function Hp(t){var e=this.getContextMessage(this.pos,t),n=e[0],i=e[1],r=e[2],Hp=new Po(r);throw Hp.line=n,Hp.character=i,Hp.shortMessage=t,Hp},matchString:function(t){return this.str.substr(this.pos,t.length)===t?(this.pos+=t.length,t):void 0},matchPattern:function(t){var e;return (e=t.exec(this.remaining()))?(this.pos+=e[0].length,e[1]||e[0]):void 0},sp:function(){this.matchPattern(Mo);},remaining:function(){return this.str.substring(this.pos)},nextChar:function(){return this.str.charAt(this.pos)},warn:function(t){var e=this.getContextMessage(this.pos,t)[2];y(e);}},Io.extend=function(e){var n=this,i=function(t,e){Io.call(this,t,e);};i.prototype=Ra(n.prototype);for(var r in e)t(e,r)&&(i.prototype[r]=e[r]);return i.extend=Io.extend,i};var Ro,Bo=1,Ko=2,Lo=3,Do=4,Fo=5,zo=6,Uo=7,$o=8,qo=9,Ho=10,Zo=11,Wo=13,Go=14,Qo=15,Yo=16,Jo=17,Xo=18,tu=19,eu=55,nu=20,iu=21,ru=22,su=23,au=24,ou=25,uu=26,hu=27,lu=30,cu=31,fu=32,du=33,pu=34,mu=35,vu=36,gu=40,yu=50,bu=51,wu=52,xu=53,ku=54,_u=60,Eu=61,Au=62,Cu=63,Su=70,Ou=71,ju=72,Nu=73,Tu=74,Vu=/^[^\s=]+/,Mu=/^\s+/,Pu=/^(\/(?:[^\n\r\u2028\u2029\/\\[]|\\.|\[(?:[^\n\r\u2028\u2029\]\\]|\\.)*])+\/(?:([gimuy])(?![a-z]*\2))*(?![a-zA-Z_$0-9]))/,Iu=/[-\/\\^$*+?.()|[\]{}]/g,Ru={},Bu={allowfullscreen:1,async:1,autofocus:1,autoplay:1,checked:1,compact:1,controls:1,declare:1,"default":1,defaultchecked:1,defaultmuted:1,defaultselected:1,defer:1,disabled:1,enabled:1,formnovalidate:1,hidden:1,indeterminate:1,inert:1,ismap:1,itemscope:1,loop:1,multiple:1,muted:1,nohref:1,noresize:1,noshade:1,novalidate:1,nowrap:1,open:1,pauseonexit:1,readonly:1,required:1,reversed:1,scoped:1,seamless:1,selected:1,sortable:1,translate:1,truespeed:1,typemustmatch:1,visible:1},Ku={area:1,base:1,br:1,col:1,command:1,doctype:1,embed:1,hr:1,img:1,input:1,keygen:1,link:1,meta:1,param:1,source:1,track:1,wbr:1},Lu={quot:34,amp:38,apos:39,lt:60,gt:62,nbsp:160,iexcl:161,cent:162,pound:163,curren:164,yen:165,brvbar:166,sect:167,uml:168,copy:169,ordf:170,laquo:171,not:172,shy:173,reg:174,macr:175,deg:176,plusmn:177,sup2:178,sup3:179,acute:180,micro:181,para:182,middot:183,cedil:184,sup1:185,ordm:186,raquo:187,frac14:188,frac12:189,frac34:190,iquest:191,Agrave:192,Aacute:193,Acirc:194,Atilde:195,Auml:196,Aring:197,AElig:198,Ccedil:199,Egrave:200,Eacute:201,Ecirc:202,Euml:203,Igrave:204,Iacute:205,Icirc:206,Iuml:207,ETH:208,Ntilde:209,Ograve:210,Oacute:211,Ocirc:212,Otilde:213,Ouml:214,times:215,Oslash:216,Ugrave:217,Uacute:218,Ucirc:219,Uuml:220,Yacute:221,THORN:222,szlig:223,agrave:224,aacute:225,acirc:226,atilde:227,auml:228,aring:229,aelig:230,ccedil:231,egrave:232,eacute:233,ecirc:234,euml:235,igrave:236,iacute:237,icirc:238,iuml:239,eth:240,ntilde:241,ograve:242,oacute:243,ocirc:244,otilde:245,ouml:246,divide:247,oslash:248,ugrave:249,uacute:250,ucirc:251,uuml:252,yacute:253,thorn:254,yuml:255,OElig:338,oelig:339,Scaron:352,scaron:353,Yuml:376,fnof:402,circ:710,tilde:732,Alpha:913,Beta:914,Gamma:915,Delta:916,Epsilon:917,Zeta:918,Eta:919,Theta:920,Iota:921,Kappa:922,Lambda:923,Mu:924,Nu:925,Xi:926,Omicron:927,Pi:928,Rho:929,Sigma:931,Tau:932,Upsilon:933,Phi:934,Chi:935,Psi:936,Omega:937,alpha:945,beta:946,gamma:947,delta:948,epsilon:949,zeta:950,eta:951,theta:952,iota:953,kappa:954,lambda:955,mu:956,nu:957,xi:958,omicron:959,pi:960,rho:961,sigmaf:962,sigma:963,tau:964,upsilon:965,phi:966,chi:967,psi:968,omega:969,thetasym:977,upsih:978,piv:982,ensp:8194,emsp:8195,thinsp:8201,zwnj:8204,zwj:8205,lrm:8206,rlm:8207,ndash:8211,mdash:8212,lsquo:8216,rsquo:8217,sbquo:8218,ldquo:8220,rdquo:8221,bdquo:8222,dagger:8224,Dagger:8225,bull:8226,hellip:8230,permil:8240,prime:8242,Prime:8243,lsaquo:8249,rsaquo:8250,oline:8254,frasl:8260,euro:8364,image:8465,weierp:8472,real:8476,trade:8482,alefsym:8501,larr:8592,uarr:8593,rarr:8594,darr:8595,harr:8596,crarr:8629,lArr:8656,uArr:8657,rArr:8658,dArr:8659,hArr:8660,forall:8704,part:8706,exist:8707,empty:8709,nabla:8711,isin:8712,notin:8713,ni:8715,prod:8719,sum:8721,minus:8722,lowast:8727,radic:8730,prop:8733,infin:8734,ang:8736,and:8743,or:8744,cap:8745,cup:8746,"int":8747,there4:8756,sim:8764,cong:8773,asymp:8776,ne:8800,equiv:8801,le:8804,ge:8805,sub:8834,sup:8835,nsub:8836,sube:8838,supe:8839,oplus:8853,otimes:8855,perp:8869,sdot:8901,lceil:8968,rceil:8969,lfloor:8970,rfloor:8971,lang:9001,rang:9002,loz:9674,spades:9824,clubs:9827,hearts:9829,diams:9830},Du=[8364,129,8218,402,8222,8230,8224,8225,710,8240,352,8249,338,141,381,143,144,8216,8217,8220,8221,8226,8211,8212,732,8482,353,8250,339,157,382,376],Fu=new RegExp("&(#?(?:x[\\w\\d]+|\\d+|"+La(Lu).join("|")+"));?","g"),zu=u(String.fromCodePoint),Uu=zu?String.fromCodePoint:String.fromCharCode,$u=/</g,qu=/>/g,Hu=/&/g,Zu=65533,Wu="Expected a JavaScript expression",Gu="Expected closing paren",Qu=/^(?:[+-]?)0*(?:(?:(?:[1-9]\d*)?\.\d+)|(?:(?:0|[1-9]\d*)\.)|(?:0|[1-9]\d*))(?:[eE][+-]?\d+)?/,Yu=/^(?=.)[^"'\\]+?(?:(?!.)|(?=["'\\]))/,Ju=/^\\(?:[`'"\\bfnrt]|0(?![0-9])|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|(?=.)[^ux0-9])/,Xu=/^\\(?:\r\n|[\u000A\u000D\u2028\u2029])/,th=_t('"'),eh=_t("'"),nh=/^[^`"\\\$]+?(?:(?=[`"\\\$]))/,ih=/[\r\n\t\b\f]/g,rh=/^[a-zA-Z_$][a-zA-Z_$0-9]*/,sh=/^\s*\.{3}/,ah=/^(?:[a-zA-Z$_0-9]|\\\.)+(?:(?:\.(?:[a-zA-Z$_0-9]|\\\.)+)|(?:\[[0-9]+\]))*/,oh=/^[a-zA-Z_$][-\/a-zA-Z_$0-9]*(?:\.(?:[a-zA-Z_$][-\/a-zA-Z_$0-9]*))*/,uh=/^[a-zA-Z_$][a-zA-Z_$0-9]*$/,hh=/^(?:Array|console|Date|RegExp|decodeURIComponent|decodeURI|encodeURIComponent|encodeURI|isFinite|isNaN|parseFloat|parseInt|JSON|Math|NaN|undefined|null|Object|Number|String|Boolean)\b/,lh=/^(?:break|case|catch|continue|debugger|default|delete|do|else|finally|for|function|if|in|instanceof|new|return|switch|throw|try|typeof|var|void|while|with)$/,ch=/^(?:\@\.|\@|~\/|(?:\^\^\/(?:\^\^\/)*(?:\.\.\/)*)|(?:\.\.\/)+|\.\/(?:\.\.\/)*|\.)/,fh=/^(key|index|keypath|rootpath|this|global|shared|context|event|node|local|style|helpers|last|macro)/,dh=function(t,e){return function(n){var i;return (i=e(n))?i:n.matchString(t)?(n.sp(),i=Dt(n),i||n.error(Wu),{s:t,o:i,t:du}):null}};!function(){var t,e,n,i,r="! ~ + - typeof".split(" ");for(i=Kt,t=0,e=r.length;e>t;t+=1)n=dh(r[t],i),i=n;Ro=i;}();var ph,mh=Ro,vh=function(t,e){return function(n){if(n.inUnquotedAttribute&&(">"===t||"/"===t))return e(n);var i,r,s;if(r=e(n),!r)return null;for(;;){if(i=n.pos,n.sp(),!n.matchString(t))return n.pos=i,r;if("in"===t&&/[a-zA-Z_$0-9]/.test(n.remaining().charAt(0)))return n.pos=i,r;if(n.sp(),s=e(n),!s)return n.pos=i,r;r={t:vu,s:t,o:[r,s]};}}};!function(){var t,e,n,i,r="* / % + - << >> >>> < <= > >= in instanceof == != === !== & ^ | && ||".split(" ");for(i=mh,t=0,e=r.length;e>t;t+=1)n=vh(r[t],i),i=n;ph=i;}();var gh=ph,yh=/^[^\s"'>\/=(]+/,bh=/^on/,wh=/^on-([a-zA-Z\*\.$_]((?:[a-zA-Z\*\.$_0-9\-]|\\-)+))$/,xh=/^(?:change|reset|teardown|update|construct|config|init|render|complete|unrender|detach|insert|destruct|attachchild|detachchild)$/,kh=/^as-([a-z-A-Z][-a-zA-Z_0-9]*)$/,_h=/^([a-zA-Z](?:(?!-in-out)[-a-zA-Z_0-9])*)-(in|out|in-out)$/,Eh=/^((bind|class)-(([-a-zA-Z0-9_])+))$/,Ah={lazy:{t:Nu,v:"l"},twoway:{t:Nu,v:"t"},"no-delegation":{t:Tu}},Ch=/^[^\s"'=<>\/`]+/,Sh=/^[^\s"'=<>@\[\]()]*/,Oh=/^\s+/,jh=/\\/g,Nh={t:Ho,exclude:!0},Th=/^(?:[a-zA-Z$_0-9]|\\\.)+(?:(?:(?:[a-zA-Z$_0-9]|\\\.)+)|(?:\[[0-9]+\]))*/,Vh=/^as/i,Mh={"else":/^\s*else\s*/,elseif:/^\s*elseif\s+/,then:/^\s*then\s*/,"catch":/^\s*catch\s*/},Ph={"else":_u,elseif:Eu,then:Au,"catch":Cu},Ih={each:wu,"if":yu,"with":ku,unless:bu},Rh=/^\s*:\s*([a-zA-Z_$][a-zA-Z_$0-9]*)/,Bh=/^\s*,\s*([a-zA-Z_$][a-zA-Z_$0-9]*)/,Kh=new RegExp("^("+La(Ih).join("|")+")\\b"),Lh="<!--",Dh="-->",Fh=/^[ \t\f\r\n]*\r?\n/,zh=/\r?\n[ \t\f\r\n]*$/,Uh=/[ \t\f\r\n]+/g,$h=/^[ \t\f\r\n]+/,qh=/[ \t\f\r\n]+$/,Hh=/^(?:\r\n|\r|\n)/,Zh=/(?:\r\n|\r|\n)$/,Wh=/^([a-zA-Z]{1,}:?[a-zA-Z0-9\-]*)\s*\>/,Gh=/^[a-zA-Z]{1,}:?[a-zA-Z0-9\-]*/,Qh=/^[a-zA-Z_$][-a-zA-Z0-9_$]*/,Yh=/^[\s\n\/>]/,Jh=/;\s*$/,Xh={exclude:!0},tl={li:["li"],dt:["dt","dd"],dd:["dt","dd"],p:"address article aside blockquote div dl fieldset footer form h1 h2 h3 h4 h5 h6 header hgroup hr main menu nav ol p pre section table ul".split(" "),rt:["rt","rp"],rp:["rt","rp"],optgroup:["optgroup"],option:["option","optgroup"],thead:["tbody","tfoot"],tbody:["tbody","tfoot"],tfoot:["tbody"],tr:["tr","tbody"],td:["td","th","tr"],th:["td","th","tr"]},el=/^\s*(elseif|else|then|catch)\s*/,nl=/^\s*#\s*partial\s+/,il={},rl=[le,oe,me,fe,ce],sl=[ae],al=[re,ve,Ee,Oe],ol=[je],ul={pre:1,script:1,style:1,textarea:1},hl={textarea:!0,script:!0,style:!0,template:!0},ll=Io.extend({init:function(t,e){var n=e.tripleDelimiters||il.defaults.tripleDelimiters,i=e.staticDelimiters||il.defaults.staticDelimiters,r=e.staticTripleDelimiters||il.defaults.staticTripleDelimiters;this.standardDelimiters=e.delimiters||il.defaults.delimiters,this.tags=[{isStatic:!1,isTriple:!1,open:this.standardDelimiters[0],close:this.standardDelimiters[1],readers:rl},{isStatic:!1,isTriple:!0,open:n[0],close:n[1],readers:sl},{isStatic:!0,isTriple:!1,open:i[0],close:i[1],readers:rl},{isStatic:!0,isTriple:!0,open:r[0],close:r[1],readers:sl}],this.contextLines=e.contextLines||il.defaults.contextLines,this.sortMustacheTags(),this.sectionDepth=0,this.elementStack=[],this.interpolate=Ia({},hl,il.defaults.interpolate,e.interpolate),e.sanitize===!0&&(e.sanitize={elements:"applet base basefont body frame frameset head html isindex link meta noframes noscript object param script style title".split(" "),eventAttributes:!0}),this.stripComments=e.stripComments!==!1,this.preserveWhitespace=o(e.preserveWhitespace)?!1:e.preserveWhitespace,this.sanitizeElements=e.sanitize&&e.sanitize.elements,this.sanitizeEventAttributes=e.sanitize&&e.sanitize.eventAttributes,this.includeLinePositions=e.includeLinePositions,this.textOnlyMode=e.textOnlyMode,this.csp=e.csp,this.allowExpressions=e.allowExpressions,e.expression&&(this.converters=[Dt]),e.attributes&&(this.inTag=!0),this.whiteSpaceElements=Ia({},e.preserveWhitespace,ul);},postProcess:function(t,e){var n=t[0];if(e.expression){var i=Ut(n);return i.e=ct(i.s,i.r.length),i}if(!t.length)return {t:[],v:Vo};if(this.sectionDepth>0&&this.error("A section was left open"),xe(n.t,this.stripComments,this.preserveWhitespace,!this.preserveWhitespace,!this.preserveWhitespace,this.whiteSpaceElements),this.csp!==!1){var r={};Te(n.t,r),Te(n.p||{},r),La(r).length&&(n.e=r);}return n},converters:[Ne],sortMustacheTags:function(){this.tags.sort(function(t,e){return e.open.length-t.open.length});}}),cl=["delimiters","tripleDelimiters","staticDelimiters","staticTripleDelimiters","csp","interpolate","preserveWhitespace","sanitize","stripComments","contextLines","allowExpressions","attributes"],fl="Either preparse or use a ractive runtime source that includes the parser. ",dl="Either include a version of Ractive that can parse or convert your computation strings to functions.",pl={fromId:function(t,e){if(!$a){if(e&&e.noThrow)return;throw new Error("Cannot retrieve template #"+t+" as Ractive is not running in a browser.")}t&&(t=t.replace(/^#/,""));var n;if(!(n=$a.getElementById(t))){if(e&&e.noThrow)return;throw new Error("Could not find template element with id #"+t)}if("SCRIPT"!==n.tagName.toUpperCase()){if(e&&e.noThrow)return;throw new Error("Template element with id #"+t+", must be a <script> element")}return "textContent"in n?n.textContent:n.innerHTML},isParsed:function(t){return !h(t)},getParseOptions:function(t){return t.defaults&&(t=t.defaults),cl.reduce(function(e,n){return e[n]=t[n],e},{})},parse:function(t,e){Re(Ie,"template",fl);var n=Ie(t,e);return dt(n),n},parseFor:function(t,e){return this.parse(t,this.getParseOptions(e))}},ml=0,vl=function(t,e){this.callback=t,this.parent=e,this.intros=[],this.outros=[],this.children=[],this.totalChildren=this.outroChildren=0,this.detachQueue=[],this.outrosComplete=!1,this.id=ml++,e&&e.addChild(this);},gl=vl.prototype;gl.add=function(t){var e=t.isIntro?this.intros:this.outros;t.starting=!0,e.push(t);},gl.addChild=function(t){this.children.push(t),this.totalChildren+=1,this.outroChildren+=1;},gl.checkStart=function(){this.parent&&this.parent.started&&this.start();},gl.decrementOutros=function(){this.outroChildren-=1,De(this);},gl.decrementTotal=function(){this.totalChildren-=1,De(this);},gl.detachNodes=function(){for(var t=this,e=this.detachQueue.length,n=0;e>n;n++)t.detachQueue[n].detach();e=this.children.length;for(var i=0;e>i;i++)t.children[i].detachNodes();this.detachQueue=[];},gl.ready=function(){this.detachQueue.length&&ze(this);},gl.remove=function(t){var e=t.isIntro?this.intros:this.outros;V(e,t),De(this);},gl.start=function(){this.started=!0,this.children.forEach(function(t){return t.start()}),this.intros.concat(this.outros).forEach(function(t){return t.start()}),De(this);};var yl,bl={active:function(){return !!yl},start:function(){var t,e=new Promise(function(e){return t=e});return yl={previousBatch:yl,transitionManager:new vl(t,yl&&yl.transitionManager),fragments:[],tasks:[],immediateObservers:[],deferredObservers:[],promise:e},e},end:function(){qe(),yl.previousBatch?yl.transitionManager.checkStart():yl.transitionManager.start(),yl=yl.previousBatch;},addFragment:function(t){S(yl.fragments,t);},addFragmentToRoot:function(t){if(yl){for(var e=yl;e.previousBatch;)e=e.previousBatch;S(e.fragments,t);}},addObserver:function(t,e){yl?S(e?yl.deferredObservers:yl.immediateObservers,t):t.dispatch();},registerTransition:function(t){t._manager=yl.transitionManager,yl.transitionManager.add(t);},detachWhenReady:function(t){yl.transitionManager.detachQueue.push(t);},scheduleTask:function(t,e){var n;if(yl){for(n=yl;e&&n.previousBatch;)n=n.previousBatch;n.tasks.push(t);}else t();},promise:function(){if(!yl)return Promise.resolve();for(var t=yl;t.previousBatch;)t=t.previousBatch;return t.promise||Promise.resolve()}},wl=[],xl=!1,kl=function(t){this.duration=t.duration,this.step=t.step,this.complete=t.complete,this.easing=t.easing,this.start=performance.now(),this.end=this.start+this.duration,this.running=!0,wl.push(this),xl||requestAnimationFrame(He);},_l=kl.prototype;_l.tick=function(t){if(!this.running)return !1;if(t>this.end)return this.step&&this.step(1),this.complete&&this.complete(1),!1;var e=t-this.start,n=this.easing(e/this.duration);return this.step&&this.step(n),!0},_l.stop=function(){this.abort&&this.abort(),this.running=!1;};var El={},Al={},Cl=function(e){function n(t,n){e.call(this,t),this.ticker=null,t&&(this.key=C(n),this.isReadonly=t.isReadonly,t.value&&(this.value=t.value[this.key],Fa(this.value)&&(this.length=this.value.length),this.adapt()));}e&&(n.__proto__=e);var s=n.prototype=Object.create(e&&e.prototype);return s.constructor=n,s.adapt=function(){var t=this,e=this.root.adaptors,n=e.length;if(this.rewrap=!1,0!==n){var i=this.wrapper?"newWrapperValue"in this?this.newWrapperValue:this.wrapperValue:this.value,r=this.root.ractive,s=this.getKeypath();if(this.wrapper){var a=this.wrapperValue===i?!1:!this.wrapper.reset||this.wrapper.reset(i)===!1;if(!a)return delete this.newWrapperValue,void(this.value=this.wrapper.get());if(this.wrapper.teardown(),delete this.wrapper,delete this.wrapperValue,delete this.newWrapperValue,void 0!==this.value){var o=this.parent.value||this.parent.createBranch(this.key);o[this.key]!==i&&(o[this.key]=i),this.value=i;}}var u;for(u=0;n>u;u+=1){var h=e[u];if(h.filter(i,s,r)){t.wrapper=h.wrap(r,i,s,We(s)),t.wrapperValue=i,t.wrapper.__model=t,t.value=t.wrapper.get();break}}}},s.animate=function(t,e,n,i){var r=this;this.ticker&&this.ticker.stop();var s,a=new Promise(function(t){return s=t});return this.ticker=new kl({duration:n.duration,easing:n.easing,step:function(t){var e=i(t);r.applyValue(e),n.step&&n.step(t,e);},complete:function(){r.applyValue(e),n.complete&&n.complete(e),r.ticker=null,s(e);}}),a.stop=this.ticker.stop,a},s.applyValue=function(t,e){if(void 0===e&&(e=!0),!i(t,this.value)){if(this.boundValue&&(this.boundValue=null),this.parent.wrapper&&this.parent.wrapper.set)this.parent.wrapper.set(this.key,t),this.parent.value=this.parent.wrapper.get(),this.value=this.parent.value[this.key],this.wrapper&&(this.newWrapperValue=this.value),this.adapt();else if(this.wrapper)this.newWrapperValue=t,this.adapt();else {var n=this.parent.value||this.parent.createBranch(this.key);if(!a(n))return void y("Attempted to set a property of a non-object '"+this.getKeypath()+"'");n[this.key]=t,this.value=t,this.adapt();}(this.dataModel||t&&t.viewmodel&&t.viewmodel.isRoot)&&U(this,t),Fa(t)?(this.length=t.length,this.isArray=!0):this.isArray=!1,this.links.forEach(Q),this.children.forEach(Y),this.deps.forEach(Q),e&&this.notifyUpstream(),this.parent.isArray&&("length"===this.key?this.parent.length=t:this.parent.joinKey("length").mark());}},s.compute=function(t,e){var n=this.computed||(this.computed={});return n[t]?(n[t].signature=Le(this.root.ractive,t,e),n[t].mark()):n[t]=new Al.Computation(this,Le(this.root.ractive,t,e),t),n[t]},s.createBranch=function(t){var e=r(t)?[]:{};return this.applyValue(e,!1),e},s.get=function(t,e){return this._link?this._link.get(t,e):(t&&H(this),e&&e.virtual?this.getVirtual(!1):K(this,(e&&"unwrap"in e?e.unwrap!==!1:t)&&this.wrapper?this.wrapperValue:this.value,!e||e.shouldBind!==!1))},s.joinKey=function(e,i){var r=this;if(this._link)return i&&i.lastLink!==!1&&(c(e)||""===e)?this:this._link.joinKey(e);if(c(e)||""===e)return this;var s;if(s=t(this.childByKey,e)?this.childByKey[e]:this.computed&&this.computed[e],!s){var a;if(this.isRoot&&this.ractive&&(a=this.ractive.computed[e]))s=this.compute(e,a);else if(!this.isRoot&&this.root.ractive){var o=this.root.ractive.computed;for(var u in o)a=o[u],a.pattern&&a.pattern.test(r.getKeypath()+"."+e)&&(s=r.compute(e,a));}}if(!s&&(s=new n(this,e),this.children.push(s),this.childByKey[e]=s,"data"===e)){var h=this.retrieve();h&&h.viewmodel&&h.viewmodel.isRoot&&(s.link(h.viewmodel,"data"),this.dataModel=h);}return !s._link||i&&i.lastLink===!1?s:s._link},s.mark=function(t){if(this._link)return this._link.mark(t);var e=this.value,n=this.retrieve();(this.dataModel||n&&n.viewmodel&&n.viewmodel.isRoot)&&U(this,n),(t||!i(n,e))&&(this.value=n,this.boundValue&&(this.boundValue=null),(e!==n||this.rewrap)&&(this.wrapper&&(this.newWrapperValue=n),this.adapt()),Fa(n)?(this.length=n.length,this.isArray=!0):this.isArray=!1,this.children.forEach(t?J:Y),this.links.forEach(X),this.deps.forEach(Q));},s.merge=function(t,e){var n=R(this.value===t?Ge(this):this.value,t,e);this.parent.value[this.key]=t,this.shuffle(n,!0);},s.retrieve=function(){return this.parent.value?this.parent.value[this.key]:void 0},s.set=function(t){this.ticker&&this.ticker.stop(),this.applyValue(t);},s.shuffle=function(t,e){z(this,t,!1,e);},s.source=function(){return this},s.teardown=function(){var t=this;this._link&&(this._link.teardown(),this._link=null),this.children.forEach(it),this.wrapper&&this.wrapper.teardown(),this.computed&&La(this.computed).forEach(function(e){return t.computed[e].teardown()});},n}(Ao),Sl={},Ol=function(t){function e(e,n,i){t.call(this,null,"@"+n),this.key="@"+n,this.value=e,this.isRoot=!0,this.root=this,this.adaptors=[],this.ractive=i;}t&&(e.__proto__=t);var n=e.prototype=Object.create(t&&t.prototype);return n.constructor=e,n.getKeypath=function(){return this.key},n.retrieve=function(){return this.value},e}(Cl),jl=new Ol(Sl,"shared"),Nl=new Ol(Ha,"global"),Tl={},Vl=function(t){this.ractive=t;};Vl.prototype.findContext=function(){return this.ractive.viewmodel};var Ml=Vl.prototype;Ml.getContext=rn,Ml.find=Ml.findComponent=Ml.findAll=Ml.findAllComponents=f;var Pl=!1,Il=/\*/,Rl={virtual:!1},Bl={},Kl="Cannot add to a non-numeric value",Ll=uo.linear,Dl={},Fl={},zl=function(t){this.event=t,this.method="on"+t;};zl.prototype.fire=function(t,e){var n=nn(t),i=this.method;t[i]&&(e?t[i](n,e):t[i](n)),wn(t,this.event,n,e?[e,t]:[t]);};var Ul=function(t){this.hook=new zl(t),this.inProcess={},this.queue={};},$l=Ul.prototype;$l.begin=function(t){this.inProcess[t._guid]=!0;},$l.end=function(t){var e=t.parent;e&&this.inProcess[e._guid]?_n(this.queue,e).push(t):En(this,t),delete this.inProcess[t._guid];};var ql={};["construct","config","attachchild","detach","detachchild","insert","complete","reset","render","unrendering","unrender","teardown","destruct","update"].forEach(function(t){ql[t]=new zl(t);}),ql.init=new Ul("init");var Hl=Array.prototype,Zl=qn("push").model,Wl=qn("pop").model,Gl=qn("shift").model,Ql=qn("unshift").model,Yl=qn("sort").model,Jl=qn("splice").model,Xl=qn("reverse").model,tc=function(t){function e(e){t.call(this,null,null),this.isRoot=!0,this.root=this,this.value={},this.ractive=e.ractive,this.adaptors=[],this.context=e.context;}t&&(e.__proto__=t);var n=e.prototype=Object.create(t&&t.prototype);return n.constructor=e,n.getKeypath=function(){return "@context.data"},n.rebound=function(){},e}(Cl),ec=function(t,e){this.fragment=t,this.element=e||zn(t),this.node=this.element&&this.element.node,this.ractive=t.ractive,this.root=this;},nc=ec.prototype,ic={decorators:{},_data:{}};ic.decorators.get=function(){var t={};return this.element?(this.element.decorators.forEach(function(e){return t[e.name]=e.handle}),t):t},ic._data.get=function(){return this.model||(this.root.model=new tc({ractive:this.ractive,context:this.root}))},nc.add=function(t,e,n){var i=l(e)?+e:1,s=o(e)?e:n;return an(Wn(this,t,i).map(function(t){var e=t[0],n=t[1],i=e.get();if(!r(n)||!r(i))throw new Error("Cannot add non-numeric value");return [e,i+n]}),s)},nc.animate=function(t,e,n){var i=Gn(this,t).model;return mn(this.ractive,i,e,n)},nc.find=function(t){return this.fragment.find(t)},nc.findAll=function(t){var e=[];return this.fragment.findAll(t,{result:e}),e},nc.findAllComponents=function(t){var e=[];return this.fragment.findAllComponents(t,{result:e}),e},nc.findComponent=function(t){return this.fragment.findComponent(t)},nc.get=function(t){if(!t)return this.fragment.findContext().get(!0);var e=Gn(this,t),n=e.model;return n?n.get(!0):void 0},nc.getParent=function(t){var e=this.fragment;return !e.parent&&t?e=e.componentParent:e.context?e=sn(e.parent):(e=sn(e.parent),e&&(e=!e.parent&&t?e.componentParent:sn(e.parent))),e&&e!==this.fragment?e.getContext():void 0},nc.hasListener=function(t,e){var n,i=this.fragment.owner.component?this.fragment.owner:this.element||this.fragment.owner;do{if(n=i.component||i,n.template.t===Uo&&Qn(n,t))return !0;i=i.up&&i.up.owner,i&&i.component&&(i=i.component);}while(i&&e)},nc.link=function(t,e){var n=Gn(this,t).model,i=Gn(this,e).model,r=bl.start();return i.link(n,t),bl.end(),r},nc.listen=function(t,e){var n=this.element;return n.on(t,e),{cancel:function(){n.off(t,e);}}},nc.observe=function(t,e,n){return void 0===n&&(n={}),s(t)&&(n=e||{}),n.fragment=this.fragment,this.ractive.observe(t,e,n)},nc.observeOnce=function(t,e,n){return void 0===n&&(n={}),s(t)&&(n=e||{}),n.fragment=this.fragment,this.ractive.observeOnce(t,e,n)},nc.pop=function(t){return Wl(Gn(this,t).model,[])},nc.push=function(t){for(var e=[],n=arguments.length-1;n-->0;)e[n]=arguments[n+1];return Zl(Gn(this,t).model,e)},nc.raise=function(t,e){for(var n=[],i=arguments.length-2;i-->0;)n[i]=arguments[i+2];for(var r,s=this.element;s;){if(s.component&&(s=s.component),r=Qn(s,t))return r.fire(r.element.getContext(e||{},!e||"original"in e?{}:{
	original:{}}),n);s=s.up&&s.up.owner;}},nc.readLink=function(t,e){return this.ractive.readLink(this.resolve(t),e)},nc.resolve=function(t,e){var n=Gn(this,t),i=n.model,r=n.instance;return i?i.getKeypath(e||r):t},nc.reverse=function(t){return Xl(Gn(this,t).model,[])},nc.set=function(t,e,n){return an(Wn(this,t,e),n)},nc.shift=function(t){return Gl(Gn(this,t).model,[])},nc.splice=function(t,e,n){for(var i=[],r=arguments.length-3;r-->0;)i[r]=arguments[r+3];return i.unshift(e,n),Jl(Gn(this,t).model,i)},nc.sort=function(t){return Yl(Gn(this,t).model,[])},nc.subtract=function(t,e,n){var i=l(e)?e:1,s=o(e)?e:n;return an(Wn(this,t,i).map(function(t){var e=t[0],n=t[1],i=e.get();if(!r(n)||!r(i))throw new Error("Cannot add non-numeric value");return [e,i-n]}),s)},nc.toggle=function(t,e){var n=Gn(this,t),i=n.model;return an([[i,!i.get()]],e)},nc.unlink=function(t){var e=Gn(this,t).model,n=bl.start();return e.owner&&e.owner._link&&e.owner.unlink(),bl.end(),n},nc.unlisten=function(t,e){this.element.off(t,e);},nc.unshift=function(t){for(var e=[],n=arguments.length-1;n-->0;)e[n]=arguments[n+1];return Ql(Gn(this,t).model,e)},nc.update=function(t,e){return Hn(this.ractive,Gn(this,t).model,e)},nc.updateModel=function(t,e){var n=Gn(this,t),i=n.model,r=bl.start();return i.updateFromBindings(e),bl.end(),r},nc.isBound=function(){var t=this.getBindingModel(this),e=t.model;return !!e},nc.getBindingPath=function(t){var e=this.getBindingModel(this),n=e.model,i=e.instance;return n?n.getKeypath(t||i):void 0},nc.getBinding=function(){var t=this.getBindingModel(this),e=t.model;return e?e.get(!0):void 0},nc.getBindingModel=function(t){var e=t.element;return {model:e.binding&&e.binding.model,instance:e.up.ractive}},nc.setBinding=function(t){var e=this.getBindingModel(this),n=e.model;return an([[n,t]])},Object.defineProperties(nc,ic),ec.forRactive=nn,Tl.Context=ec;var rc,sc,ac,oc,uc,hc,lc,cc,fc,dc=$a&&$a.querySelector,pc="http://www.w3.org/1999/xhtml",mc="http://www.w3.org/1998/Math/MathML",vc="http://www.w3.org/2000/svg",gc="http://www.w3.org/1999/xlink",yc="http://www.w3.org/XML/1998/namespace",bc="http://www.w3.org/2000/xmlns",wc={html:pc,mathml:mc,svg:vc,xlink:gc,xml:yc,xmlns:bc};if(rc=Wa?function(t,e,n){return e&&e!==pc?n?$a.createElementNS(e,t,n):$a.createElementNS(e,t):n?$a.createElement(t,n):$a.createElement(t)}:function(t,e,n){if(e&&e!==pc)throw "This browser does not support namespaces other than http://www.w3.org/1999/xhtml. The most likely cause of this error is that you're trying to render SVG in an older browser. See http://ractive.js.org/support/#svgs for more information";return n?$a.createElement(t,n):$a.createElement(t)},qa){for(ac=rc("div"),oc=["matches","matchesSelector"],fc=function(t){return function(e,n){return e[t](n)}},lc=oc.length;lc--&&!sc;)if(uc=oc[lc],ac[uc])sc=fc(uc);else for(cc=Ga.length;cc--;)if(hc=Ga[lc]+uc.substr(0,1).toUpperCase()+uc.substring(1),ac[hc]){sc=fc(hc);break}sc||(sc=function(t,e){var n,i;n=t.parentNode,n||(ac.innerHTML="",n=ac,t=t.cloneNode(),ac.appendChild(t));var r=n.querySelectorAll(e);for(i=r.length;i--;)if(r[i]===t)return !0;return !1});}else sc=null;var xc=function(t,e,n,i){this.context=i.context||t,this.callback=n,this.ractive=t,this.keypath=i.keypath,this.options=i,e&&this.resolved(e),u(i.old)&&(this.oldContext=Ra(t),this.oldFn=i.old),i.init!==!1?(this.dirty=!0,this.dispatch()):li(this),this.dirty=!1;},kc=xc.prototype;kc.cancel=function(){this.cancelled=!0,this.model?this.model.unregister(this):this.resolver.unbind(),V(this.ractive._observers,this);},kc.dispatch=function(){if(!this.cancelled){try{this.callback.call(this.context,this.newValue,this.oldValue,this.keypath);}catch(t){y("Failed to execute observer callback for '"+this.keypath+"': "+(t.message||t));}li(this,!0),this.dirty=!1;}},kc.handleChange=function(){var t=this;if(this.dirty)this.newValue=this.model.get();else {var e=this.model.get();if(i(e,this.oldValue))return;if(this.newValue=e,this.options.strict&&this.newValue===this.oldValue)return;bl.addObserver(this,this.options.defer),this.dirty=!0,this.options.once&&bl.scheduleTask(function(){return t.cancel()});}},kc.rebind=function(t,e){var n=this;return t=ht(this.keypath,t,e),t===this.model?!1:(this.model&&this.model.unregister(this),void(t&&t.addShuffleTask(function(){return n.resolved(t)})))},kc.resolved=function(t){this.model=t,this.oldValue=void 0,this.newValue=t.get(),t.register(this);};var _c=/\*+/g,Ec=function(t,e,n,i,r){var s=this;this.context=r.context||t,this.ractive=t,this.baseModel=e,this.keys=n,this.callback=i;var a=n.join("\\.").replace(_c,"(.+)"),o=this.baseKeypath=e.getKeypath(t);this.pattern=new RegExp("^"+(o?o+"\\.":"")+a+"$"),this.recursive=1===n.length&&"**"===n[0],this.recursive&&(this.keys=["*"]),r.old&&(this.oldContext=Ra(t),this.oldFn=r.old),this.oldValues={},this.newValues={},this.defer=r.defer,this.once=r.once,this.strict=r.strict,this.dirty=!1,this.changed=[],this.cache=[],this.partial=!1,this.links=r.links;var u=e.findMatches(this.keys);u.forEach(function(t){s.newValues[t.getKeypath(s.ractive)]=t.get();}),r.init!==!1?this.dispatch():di(this,this.newValues),e.registerPatternObserver(this);},Ac=Ec.prototype;Ac.cancel=function(){this.baseModel.unregisterPatternObserver(this),V(this.ractive._observers,this);},Ac.dispatch=function(){var t=this,e=this.newValues;this.newValues={},La(e).forEach(function(n){var r=e[n],s=t.oldValues[n];if(!(t.strict&&r===s||i(r,s))){var a=[r,s,n];if(n){var o=t.pattern.exec(n);o&&(a=a.concat(o.slice(1)));}try{t.callback.apply(t.context,a);}catch(u){y("Failed to execute pattern observer callback for '"+t.keypath+"': "+(u.message||u));}}}),di(this,e,this.partial),this.dirty=!1;},Ac.notify=function(t){var e=ci(t);~this.cache.indexOf(e)||(this.cache.push(e),this.changed.push(t));},Ac.shuffle=function(t){var e=this;if(Fa(this.baseModel.value)){for(var n=this.baseModel.value.length,i=0;i<t.length;i++)-1!==t[i]&&t[i]!==i&&e.changed.push([i]);for(var r=t.touchedFrom;n>r;r++)e.changed.push([r]);}},Ac.handleChange=function(){var t=this;if(!this.dirty||this.changed.length){if(this.dirty||(this.newValues={}),this.changed.length){var e=0;if(this.recursive){var n=this.changed.slice();this.changed.length=0,this.dirty=!0,n.forEach(function(n){var i=t.baseModel.joinAll(n);(!i.isLink||t.links)&&(e++,t.newValues[i.getKeypath(t.ractive)]=i.get());}),this.dirty=!1;}else {var i=this.baseModel.isRoot?this.changed.map(function(t){return t.map(_).join(".")}):this.changed.map(function(e){return t.baseKeypath+"."+e.map(_).join(".")});this.baseModel.findMatches(this.keys).forEach(function(n){var r=n.getKeypath(t.ractive),s=function(t){return 0===t.indexOf(r)&&(t.length===r.length||"."===t[r.length])||0===r.indexOf(t)&&(t.length===r.length||"."===r[t.length])};i.filter(s).length&&(e++,t.newValues[r]=n.get());});}if(!e)return;this.partial=!0;}else this.baseModel.findMatches(this.keys).forEach(function(e){var n=e.getKeypath(t.ractive);t.newValues[n]=e.get();}),this.partial=!1;bl.addObserver(this,this.defer),this.dirty=!0,this.changed.length=0,this.cache=[],this.once&&this.cancel();}};var Cc=function(t,e,n,i){this.ractive=t,this.model=e,this.keypath=e.getKeypath(),this.callback=n,this.options=i,this.pending=null,e.register(this),i.init!==!1?(this.sliced=[],this.shuffle([]),this.dispatch()):this.sliced=this.slice();},Sc=Cc.prototype;Sc.cancel=function(){this.model.unregister(this),V(this.ractive._observers,this);},Sc.dispatch=function(){try{this.callback(this.pending);}catch(t){y("Failed to execute array observer callback for '"+this.keypath+"': "+(t.message||t));}this.pending=null,this.options.once&&this.cancel();},Sc.handleChange=function(t){this.pending?bl.addObserver(this,this.options.defer):t||(this.shuffle(this.sliced.map(pi)),this.handleChange());},Sc.shuffle=function(t){var e,n=this,i=this.slice(),r=[],s=[],a={};t.forEach(function(t,i){a[t]=!0,t!==i&&c(e)&&(e=i),-1===t&&s.push(n.sliced[i]);}),c(e)&&(e=t.length);for(var o=i.length,u=0;o>u;u+=1)a[u]||r.push(i[u]);this.pending={inserted:r,deleted:s,start:e},this.sliced=i;},Sc.slice=function(){var t=this.model.get();return Fa(t)?t.slice():[]};var Oc={init:!1,once:!0},jc=function(t){return t.trim()},Nc=function(t){return ""!==t},Tc=qn("pop").path,Vc=qn("push").path,Mc="/* Ractive.js component styles */",Pc=[],Ic=!1,Rc=null,Bc=null,Kc={extend:function(t,e,n){e.adapt=M(e.adapt,N(n.adapt));},init:function(){}},Lc=/\/\*(?:[\s\S]*?)\*\//g,Dc=/url\(\s*(['"])(?:\\[\s\S]|(?!\1).)*\1\s*\)|url\((?:\\[\s\S]|[^)])*\)|(['"])(?:\\[\s\S]|(?!\2).)*\2/gi,Fc=/\0(\d+)/g,zc=/(?:^|\}|\{|\x01)\s*([^\{\}\0\x01]+)\s*(?=\{)/g,Uc=/@import\s*\([^)]*\)\s*;?/gi,$c=/\x01/g,qc=/@keyframes\s+[^\{\}]+\s*\{(?:[^{}]+|\{[^{}]+})*}/gi,Hc=/((?:(?:\[[^\]]+\])|(?:[^\s\+\>~:]))+)((?:::?[^\s\+\>\~\(:]+(?:\([^\)]+\))?)*\s*[\s\+\>\~]?)\s*/g,Zc=/^(?:@|\d+%)/,Wc=/\[data-ractive-css~="\{[a-z0-9-]+\}"]/g,Gc=function(t){function e(e){t.call(this,e.cssData,"@style"),this.component=e;}t&&(e.__proto__=t);var n=e.prototype=Object.create(t&&t.prototype);return n.constructor=e,n.downstreamChanged=function(t,e){if(!this.locked){var n=this.component;n.extensions.forEach(function(n){var i=n._cssModel;i.mark(),i.downstreamChanged(t,e||1);}),e||Pi(n,!0);}},e}(Ol),Qc=/\{/,Yc={name:"css",extend:function(t,e,n,i){i._cssIds=Ri(t),Ba(i,"cssData",{configurable:!0,value:Ia(Ra(t.cssData),n.cssData||{})}),Ba(i,"_cssModel",{configurable:!0,value:new Gc(i)}),n.css&&Ki(n,i,e);},init:function(t,e,n){n.css&&y("\nThe css option is currently not supported on a per-instance basis and will be discarded. Instead, we recommend instantiating from a component definition with a css option.\n\nconst Component = Ractive.extend({\n	...\n	css: '/* your css */',\n	...\n});\n\nconst componentInstance = new Component({ ... })\n		");}},Jc={name:"data",extend:function(t,e,n){var i,r;if(n.data&&s(n.data))for(i in n.data)r=n.data[i],r&&o(r)&&(s(r)||Fa(r))&&y("Passing a `data` option with object and array properties to Ractive.extend() is discouraged, as mutating them is likely to cause bugs. Consider using a data function instead:\n\n  // this...\n  data: function () {\n    return {\n      myObject: {}\n    };\n  })\n\n  // instead of this:\n  data: {\n    myObject: {}\n  }");e.data=Fi(e.data,n.data);},init:function(t,e,n){var i=Fi(t.prototype.data,n.data);if(u(i)&&(i=i.call(e)),i&&i.constructor===Object)for(var r in i)if(u(i[r])){var s=i[r];i[r]=B(s,e),i[r]._r_unbound=s;}return i||{}},reset:function(t){var e=this.init(t.constructor,t,t.viewmodel);return t.viewmodel.root.set(e),!0}},Xc={name:"template",extend:function(t,e,n){if("template"in n){var i=n.template;u(i)?e.template=i:e.template=Hi(i,e);}},init:function(t,e,n){var i="template"in n?n.template:t.prototype.template;if(i=i||{v:Vo,t:[]},u(i)){var r=i;i=qi(e,r),e._config.template={fn:r,result:i};}i=Hi(i,e),e.template=i.t,i.p&&Gi(e.partials,i.p);},reset:function(t){var e=$i(t);if(e){var n=Hi(e,t);return t.template=n.t,Gi(t.partials,n.p,!0),!0}}},tf=["adaptors","components","computed","decorators","easing","events","helpers","interpolators","partials","transitions"],ef=["computed","helpers"],nf=function(t,e){this.name=t,this.useDefaults=e;},rf=nf.prototype;rf.extend=function(t,e,n){var i=this.useDefaults?t.defaults:t,r=this.useDefaults?e:e.constructor;this.configure(i,r,n);},rf.init=function(){},rf.configure=function(t,e,n){var i=this.name,r=n[i],s=Ra(t[i]);Ia(s,r),e[i]=s,"partials"===i&&e[i]&&La(e[i]).forEach(function(t){dt(e[i][t]);});},rf.reset=function(t){var e=t[this.name],n=!1;return La(e).forEach(function(t){var i=e[t];i._fn&&(i._fn.isOwner?e[t]=i._fn:delete e[t],n=!0);}),n};var sf=tf.map(function(t){var e=ef.indexOf(t)>-1;return new nf(t,e)}),af={extend:function(t,e,n,i){return er("extend",t,e,n,i)},init:function(t,e,n){return er("init",t,e,n)},reset:function(t){return cf.filter(function(e){return e.reset&&e.reset(t)}).map(function(t){return t.name})}},of={adapt:Kc,computed:af,css:Yc,data:Jc,helpers:af,template:Xc},uf=La(oo),hf=ir(uf.filter(function(t){return !of[t]})),lf=ir(uf.concat(sf.map(function(t){return t.name}),["on","observe","attributes","cssData","use"])),cf=[].concat(uf.filter(function(t){return !sf[t]&&!of[t]}),sf,of.template,of.css),ff=/\b_super\b/,df=function(t){this.up=t.up,this.ractive=t.up.ractive,this.template=t.template,this.index=t.index,this.type=t.template.t,this.dirty=!1;},pf=df.prototype;pf.bubble=function(){this.dirty||(this.dirty=!0,this.up.bubble());},pf.destroyed=function(){this.fragment&&this.fragment.destroyed();},pf.find=function(){return null},pf.findComponent=function(){return null},pf.findNextNode=function(){return this.up.findNextNode(this)},pf.rebound=function(t){this.fragment&&this.fragment.rebound(t);},pf.shuffled=function(){this.fragment&&this.fragment.shuffled();},pf.valueOf=function(){return this.toString()},df.prototype.findAll=f,df.prototype.findAllComponents=f;var mf=function(t){function e(e){t.call(this,e);}t&&(e.__proto__=t);var n=e.prototype=Object.create(t&&t.prototype);return n.constructor=e,n.detach=function(){return this.fragment?this.fragment.detach():ei()},n.find=function(t){return this.fragment?this.fragment.find(t):void 0},n.findAll=function(t,e){this.fragment&&this.fragment.findAll(t,e);},n.findComponent=function(t){return this.fragment?this.fragment.findComponent(t):void 0},n.findAllComponents=function(t,e){this.fragment&&this.fragment.findAllComponents(t,e);},n.firstNode=function(t){return this.fragment&&this.fragment.firstNode(t)},n.toString=function(t){return this.fragment?this.fragment.toString(t):""},e}(df),vf=/\s+/,gf=[void 0,"text","search","url","email","hidden","password","search","reset","submit"],yf={"accept-charset":"acceptCharset",accesskey:"accessKey",bgcolor:"bgColor","class":"className",codebase:"codeBase",colspan:"colSpan",contenteditable:"contentEditable",datetime:"dateTime",dirname:"dirName","for":"htmlFor","http-equiv":"httpEquiv",ismap:"isMap",maxlength:"maxLength",novalidate:"noValidate",pubdate:"pubDate",readonly:"readOnly",rowspan:"rowSpan",tabindex:"tabIndex",usemap:"useMap"},bf=$a?rc("div"):null,wf=!1,xf=function(t){function e(e){t.call(this,e),this.attributes=[],this.owner=e.owner,this.fragment=new Mp({ractive:this.ractive,owner:this,template:this.template}),this.fragment.findNextNode=f,this.dirty=!1;}t&&(e.__proto__=t);var n=e.prototype=Object.create(t&&t.prototype);return n.constructor=e,n.bind=function(){this.fragment.bind();},n.bubble=function(){this.dirty||(this.dirty=!0,this.owner.bubble());},n.destroyed=function(){this.unrender();},n.render=function(){this.node=this.owner.node,this.node&&(this.isSvg=this.node.namespaceURI===vc),wf=!0,this.rendered||this.fragment.render(),this.rendered=!0,this.dirty=!0,this.update(),wf=!1;},n.toString=function(){return this.fragment.toString()},n.unbind=function(t){this.fragment.unbind(t);},n.unrender=function(){this.rendered=!1,this.fragment.unrender();},n.update=function(){var t,e,n=this;if(this.dirty){this.dirty=!1;var i=wf;wf=!0,this.fragment.update(),this.rendered&&this.node&&(t=this.fragment.toString(),e=_r(t,this.isSvg),this.attributes.filter(function(t){return Er(e,t)}).forEach(function(t){n.node.removeAttribute(t.name);}),e.forEach(function(t){n.node.setAttribute(t.name,t.value);}),this.attributes=e),wf=i||!1;}},e}(df),kf=/^\s*$/,_f=!1,Ef=function(t){function e(e){return t.call(this,e),this.name=e.template.n,this.namespace=null,this.owner=e.owner||e.up.owner||e.element||zn(e.up),this.element=e.element||(this.owner.attributeByName?this.owner:zn(e.up)),this.up=e.up,this.ractive=this.up.ractive,this.rendered=!1,this.updateDelegate=null,this.fragment=null,this.element.attributeByName[this.name]=this,Fa(e.template.f)?(this.fragment=new Mp({owner:this,template:e.template.f}),this.interpolator=this.fragment&&1===this.fragment.items.length&&this.fragment.items[0].type===Ko&&this.fragment.items[0],void(this.interpolator&&(this.interpolator.owner=this))):(this.value=e.template.f,void(0===this.value?this.value="":c(this.value)&&(this.value=!0)))}t&&(e.__proto__=t);var n=e.prototype=Object.create(t&&t.prototype);return n.constructor=e,n.bind=function(){this.fragment&&this.fragment.bind();},n.bubble=function(){this.dirty||(this.up.bubble(),this.element.bubble(),this.dirty=!0);},n.firstNode=function(){},n.getString=function(){_f=!0;var t=this.fragment?this.fragment.toString():null!=this.value?""+this.value:"";return _f=!1,t},n.getValue=function(){_f=!0;var t=this.fragment?this.fragment.valueOf():Bu[this.name.toLowerCase()]?!0:this.value;return _f=!1,t},n.render=function(){var t=this.element.node;if(this.node=t,t.namespaceURI&&t.namespaceURI!==wc.html||(this.propertyName=yf[this.name]||this.name,void 0!==t[this.propertyName]&&(this.useProperty=!0),(Bu[this.name.toLowerCase()]||this.isTwoway)&&(this.isBoolean=!0),"value"===this.propertyName&&(t._ractive.value=this.value)),t.namespaceURI){var e=this.name.indexOf(":");-1!==e?this.namespace=Ar(t,this.name.slice(0,e)):this.namespace=t.namespaceURI;}this.rendered=!0,this.updateDelegate=ar(this),this.updateDelegate();},n.toString=function(){if(kr())return "";_f=!0;var t=this.getValue();if("value"!==this.name||void 0===this.element.getAttribute("contenteditable")&&"select"!==this.element.name&&"textarea"!==this.element.name){if("name"===this.name&&"input"===this.element.name&&this.interpolator&&"radio"===this.element.getAttribute("type"))return 'name="{{'+this.interpolator.model.getKeypath()+'}}"';if(this.owner!==this.element||"style"!==this.name&&"class"!==this.name&&!this.style&&!this.inlineClass){if(!(this.rendered||this.owner!==this.element||this.name.indexOf("style-")&&this.name.indexOf("class-")))return void(this.name.indexOf("style-")?this.inlineClass=this.name.substr(6):this.style=_e(this.name.substr(6)));if(Bu[this.name.toLowerCase()])return t?h(t)?this.name+'="'+si(t)+'"':this.name:"";if(null==t)return "";var e=si(this.getString());return _f=!1,e?this.name+'="'+e+'"':this.name}}},n.unbind=function(t){this.fragment&&this.fragment.unbind(t);},n.unrender=function(){this.updateDelegate(!0),this.rendered=!1;},n.update=function(){if(this.dirty){var t;if(this.dirty=!1,this.fragment&&this.fragment.update(),this.rendered&&this.updateDelegate(),this.isTwoway&&!this.locked)this.interpolator.twowayBinding.lastVal(!0,this.interpolator.model.get());else if("value"===this.name&&(t=this.element.binding)){var e=t.attribute;e&&!e.dirty&&e.rendered&&this.element.binding.attribute.updateDelegate();}}},e}(df),Af=function(t){function e(e){t.call(this,e),this.owner=e.owner||e.up.owner||zn(e.up),this.element=this.owner.attributeByName?this.owner:zn(e.up),this.flag="l"===e.template.v?"lazy":"twoway",this.bubbler=this.owner===this.element?this.element:this.up,this.element.type===Uo&&(Fa(e.template.f)&&(this.fragment=new Mp({owner:this,template:e.template.f})),this.interpolator=this.fragment&&1===this.fragment.items.length&&this.fragment.items[0].type===Ko&&this.fragment.items[0]);}t&&(e.__proto__=t);var n=e.prototype=Object.create(t&&t.prototype);return n.constructor=e,n.bind=function(){this.fragment&&this.fragment.bind(),Sr(this,this.getValue(),!0);},n.bubble=function(){this.dirty||(this.bubbler.bubble(),this.dirty=!0);},n.getValue=function(){return this.fragment?this.fragment.valueOf():"value"in this?this.value:"f"in this.template?this.template.f:!0},n.render=function(){Sr(this,this.getValue(),!0);},n.toString=function(){return ""},n.unbind=function(t){this.fragment&&this.fragment.unbind(t),delete this.element[this.flag];},n.unrender=function(){this.element.rendered&&this.element.recreateTwowayBinding();},n.update=function(){this.dirty&&(this.dirty=!1,this.fragment&&this.fragment.update(),Sr(this,this.getValue(),!0));},e}(df),Cf=Ra(df.prototype);Ia(Cf,{bind:f,unbind:f,update:f,detach:function(){return ii(this.node)},firstNode:function(){return this.node},render:function(t){this.rendered=!0,this.node=$a.createComment(this.template.c),t.appendChild(this.node);},toString:function(){return "<!-- "+this.template.c+" -->"},unrender:function(t){this.rendered&&t&&this.detach(),this.rendered=!1;}}),Or.prototype=Cf;var Sf=function(t){function e(e){t.call(this,e,"@this"),this.ractive=e;}t&&(e.__proto__=t);var n=e.prototype=Object.create(t&&t.prototype);return n.constructor=e,n.joinKey=function(e){var n=t.prototype.joinKey.call(this,e);return "root"!==e&&"parent"!==e||n.isLink?"data"===e?this.ractive.viewmodel:"cssData"===e?this.ractive.constructor._cssModel:n:Tr(n,e)},e}(Ol),Of={"@this":function(t){return t.getRactiveModel()},"@global":function(){return Nl},"@shared":function(){return jl},"@style":function(t){return t.getRactiveModel().joinKey("cssData")},"@helpers":function(t){return t.getHelpers()}};Of["@"]=Of["@this"];var jf=function(t){function e(e){t.call(this,null,null),this.isRoot=!0,this.root=this,this.ractive=e.ractive,this.value=e.data,this.adaptors=e.adapt,this.adapt();}t&&(e.__proto__=t);var n=e.prototype=Object.create(t&&t.prototype);return n.constructor=e,n.attached=function(t){Vr(this,t);},n.createLink=function(t,e,n,i){for(var r=A(t),s=this;r.length;){var a=r.shift();s=s.childByKey[a]||s.joinKey(a);}return s.link(e,n,i)},n.detached=function(){Mr(this);},n.get=function(t,e){return t&&H(this),e&&e.virtual===!1?this.value:this.getVirtual()},n.getHelpers=function(){return this.helpers||(this.helpers=new Ol(this.ractive.helpers,"helpers",this.ractive)),this.helpers},n.getKeypath=function(){return ""},n.getRactiveModel=function(){return this.ractiveModel||(this.ractiveModel=new Sf(this.ractive))},n.getValueChildren=function(){var e=t.prototype.getValueChildren.call(this,this.value);return this.children.forEach(function(t){if(t._link){var n=e.indexOf(t);~n?e.splice(n,1,t._link):e.push(t._link);}}),e},n.has=function(e){if("~"===e[0]&&"/"===e[1]&&(e=e.slice(2)),Of[e]||""===e)return !0;if(t.prototype.has.call(this,e))return !0;var n=C(e);return this.childByKey[n]&&this.childByKey[n]._link?!0:void 0},n.joinKey=function(e,n){if("~"===e[0]&&"/"===e[1]&&(e=e.slice(2)),"@"!==e[0])return t.prototype.joinKey.call(this,e,n);var i=Of[e];return i?i(this):void 0},n.set=function(t){var e=this.wrapper;if(e){var n=!e.reset||e.reset(t)===!1;n&&(e.teardown(),this.wrapper=null,this.value=t,this.adapt());}else this.value=t,this.adapt();this.deps.forEach(Q),this.children.forEach(Y);},n.retrieve=function(){return this.wrapper?this.wrapper.get():this.value},n.teardown=function(){t.prototype.teardown.call(this),this.ractiveModel&&this.ractiveModel.teardown();},e}(Cl);jf.prototype.update=f;var Nf=["adaptors","components","decorators","easing","events","interpolators","partials","transitions"],Tf=["computed","helpers"],Vf=0,Mf=function(t){function e(e,n){var i=this;t.call(this,e);var r=e.template;this.isAnchor=r.t===Zo,this.type=this.isAnchor?Zo:Qo;var s=r.m,a=r.p||{};if("content"in a||(a.content=r.f||[]),this._partials=a,this.isAnchor)this.name=r.n,this.addChild=Lr,this.removeChild=Dr;else {var o=Ra(n.prototype);this.instance=o,this.name=r.e,(o.el||o.target)&&(y("The <"+this.name+"> component has a default '"+(o.el?"el":"target")+"' property; it has been disregarded"),o.el=o.target=null);for(var u,l=e.up;l;){if(l.owner.type===Yo){u=l.owner.container;break}l=l.parent;}o.parent=this.up.ractive,o.container=u||null,o.root=o.parent.root,o.component=this,Ir(this.instance,{partials:a}),r=this.template,s=r.m,Fa(this.mappings)?s=(s||[]).concat(this.mappings):h(this.mappings)&&(s=(s||[]).concat(pl.parse(this.mappings,{attributes:!0}).t)),o._inlinePartials=a;}if(this.attributeByName={},this.attributes=[],s){var c=[];s.forEach(function(t){switch(t.t){case Wo:case Su:i.attributes.push(Ys({owner:i,up:i.up,template:t}));break;case ju:case Nu:case Ou:break;default:c.push(t);}}),c.length&&this.attributes.push(new xf({owner:this,up:this.up,template:c}));}this.eventHandlers=[];}t&&(e.__proto__=t);var n=e.prototype=Object.create(t&&t.prototype);return n.constructor=e,n.bind=function(){this.isAnchor||(this.attributes.forEach(Z),this.eventHandlers.forEach(Z),ea(this.instance,{partials:this._partials},{cssIds:this.up.cssIds}),(this.instance.target||this.instance.el)&&(this.extern=!0),this.bound=!0);},n.bubble=function(){this.dirty||(this.dirty=!0,this.up.bubble());},n.destroyed=function(){!this.isAnchor&&this.instance.fragment&&this.instance.fragment.destroyed();},n.detach=function(){return this.isAnchor?this.instance?this.instance.fragment.detach():ei():this.instance.fragment.detach()},n.find=function(t,e){return this.instance?this.instance.fragment.find(t,e):void 0},n.findAll=function(t,e){this.instance&&this.instance.fragment.findAll(t,e);},n.findComponent=function(t,e){return t&&this.name!==t?this.instance.fragment?this.instance.fragment.findComponent(t,e):void 0:this.instance},n.findAllComponents=function(t,e){var n=e.result;!this.instance||t&&this.name!==t||n.push(this.instance),this.instance&&this.instance.findAllComponents(t,e);},n.firstNode=function(t){return this.instance?this.instance.fragment.firstNode(t):void 0},n.getContext=function(){for(var t=[],e=arguments.length;e--;)t[e]=arguments[e];return t.unshift(this.instance),nn.apply(null,t)},n.rebound=function(t){this.attributes.forEach(function(e){return e.rebound(t)});},n.render=function(t,e){this.isAnchor?(this.rendered=!0,this.target=t,Pf.length||(Pf.push(this.ractive),e?(this.occupants=e,Ur(),this.occupants=null):bl.scheduleTask(Ur,!0))):(this.attributes.forEach(et),this.eventHandlers.forEach(et),this.extern?(this.instance.delegate=!1,this.instance.render()):ia(this.instance,t,null,e),this.rendered=!0);},n.shuffled=function(){t.prototype.shuffled.call(this),this.instance&&!this.instance.isolated&&this.instance.fragment&&this.instance.fragment.shuffled();},n.toString=function(){return this.instance?this.instance.toHTML():void 0},n.unbind=function(t){this.isAnchor||(this.bound=!1,this.attributes.forEach(rt),t?this.instance.fragment.unbind():Nr(this.instance,function(){return bl.promise()}));},n.unrender=function(t){this.shouldDestroy=t,this.isAnchor?(this.item&&zr(this,this.item),this.target=null,Pf.length||(Pf.push(this.ractive),bl.scheduleTask(Ur,!0))):(this.instance.unrender(),this.instance.el=this.instance.target=null,this.attributes.forEach(st),this.eventHandlers.forEach(st)),this.rendered=!1;},n.update=function(){this.dirty=!1,this.instance&&(this.instance.fragment.update(),this.attributes.forEach(at),this.eventHandlers.forEach(at));},e}(df),Pf=[],If=function(e){function n(t,n){e.call(this,t,n),this.isReadonly=!this.root.ractive.syncComputedChildren,this.dirty=!0,this.isComputed=!0;}e&&(n.__proto__=e);var i=n.prototype=Object.create(e&&e.prototype);i.constructor=n;var r={setRoot:{}};return r.setRoot.get=function(){return this.parent.setRoot},i.applyValue=function(t){if(e.prototype.applyValue.call(this,t),!this.isReadonly){for(var n=this.parent;n&&n.shuffle;)n=n.parent;n&&n.dependencies.forEach(Y);}this.setRoot&&this.setRoot.set(this.setRoot.value);},i.get=function(t,e){if(t&&H(this),this.dirty){this.dirty=!1;var n=this.parent.get();this.value=n?n[this.key]:void 0,this.wrapper&&(this.newWrapperValue=this.value),this.adapt();}return (e&&"unwrap"in e?e.unwrap!==!1:t)&&this.wrapper?this.wrapperValue:this.value},i.handleChange=function(){this.dirty||(this.dirty=!0,this.boundValue&&(this.boundValue=null),this.links.forEach(X),this.deps.forEach(Q),this.children.forEach(Q));},i.joinKey=function(e){if(c(e)||""===e)return this;if(!t(this.childByKey,e)){var i=new n(this,e);this.children.push(i),this.childByKey[e]=i;}return this.childByKey[e]},Object.defineProperties(i,r),n}(Cl),Rf=function(t){function e(e,n,i){t.call(this,e,i),this.signature=n,this.isReadonly=!this.signature.setter,this.isComputed=!0,this.dependencies=[],this.children=[],this.childByKey={},this.deps=[],this.dirty=!0,this.shuffle=void 0;}t&&(e.__proto__=t);var n=e.prototype=Object.create(t&&t.prototype);n.constructor=e;var r={setRoot:{}};return r.setRoot.get=function(){return this.signature.setter?this:void 0},n.get=function(t,e){if(t&&H(this),this.dirty){var n=this.value;this.value=this.getValue(),bl.active()?i(n,this.value)||this.notifyUpstream():(bl.start(),i(n,this.value)||this.notifyUpstream(),bl.end()),this.wrapper&&(this.newWrapperValue=this.value),this.adapt(),this.dirty=!1;}return K(this,this.wrapper&&(e&&"unwrap"in e?e.unwrap!==!1:t)?this.wrapperValue:this.value,!e||e.shouldBind!==!1)},n.getContext=function(){return this.parent.isRoot?this.root.ractive:this.parent.get(!1,Eo)},n.getValue=function(){$();var t;try{t=this.signature.getter.call(this.root.ractive,this.getContext());}catch(e){if(y("Failed to compute "+this.getKeypath()+": "+(e.message||e)),Za){console.groupCollapsed&&console.groupCollapsed("%cshow details","color: rgb(82, 140, 224); font-weight: normal; text-decoration: underline;");var n=this.signature;console.error(e.name+": "+e.message+"\n\n"+n.getterString+(n.getterUseStack?"\n\n"+e.stack:"")),console.groupCollapsed&&console.groupEnd();}}var i=q();return this.parent.keypath&&!~i.indexOf(this.parent)&&i.push(this.parent),this.setDependencies(i),t},n.mark=function(){this.handleChange();},n.rebind=function(t,e){t!==e&&this.handleChange();},n.set=function(t){if(this.isReadonly)throw new Error("Cannot set read-only computed value '"+this.key+"'");this.signature.setter(t),this.mark();},n.setDependencies=function(t){for(var e=this,n=this.dependencies.length;n--;){var i=e.dependencies[n];~t.indexOf(i)||i.unregister(e);}for(n=t.length;n--;){var r=t[n];~e.dependencies.indexOf(r)||r.register(e);}this.dependencies=t;},n.teardown=function(){for(var e=this,n=this.dependencies.length;n--;)e.dependencies[n]&&e.dependencies[n].unregister(e);this.parent.computed[this.key]===this&&delete this.parent.computed[this.key],t.prototype.teardown.call(this);},Object.defineProperties(n,r),e}(Cl),Bf=Rf.prototype,Kf=If.prototype;Bf.handleChange=Kf.handleChange,Bf.joinKey=Kf.joinKey,Al.Computation=Rf;var Lf=function(t){function e(e,n){var i=this;t.call(this,e.ractive.viewmodel,null),this.fragment=e,this.template=n,this.isReadonly=!0,this.isComputed=!0,this.dirty=!0,this.fn=e.ractive.allowExpressions===!1?f:ft(n.s,n.r.length),this.models=this.template.r.map(function(t){return Ye(i.fragment,t)}),this.dependencies=[],this.shuffle=void 0,this.bubble();}t&&(e.__proto__=t);var n=e.prototype=Object.create(t&&t.prototype);return n.constructor=e,n.bubble=function(t){void 0===t&&(t=!0),this.keypath=void 0,t&&this.handleChange();},n.getKeypath=function(){var t=this;return this.template?(this.keypath||(this.keypath="@"+this.template.s.replace(/_(\d+)/g,function(e,n){if(n>=t.models.length)return e;var i=t.models[n];return i?i.getKeypath():"@undefined"})),this.keypath):"@undefined"},n.getValue=function(){var t=this;$();var e;try{var n=this.models.map(function(t){return t?t.get(!0):void 0});e=this.fn.apply(this.fragment.ractive,n);}catch(i){y("Failed to compute "+this.getKeypath()+": "+(i.message||i));}var r=q();return this.dependencies.filter(function(t){return !~r.indexOf(t)}).forEach(function(e){e.unregister(t),V(t.dependencies,e);}),r.filter(function(e){return !~t.dependencies.indexOf(e)}).forEach(function(e){e.register(t),t.dependencies.push(e);}),e},n.notifyUpstream=function(){},n.rebind=function(t,e,n){var i=this.models.indexOf(e);~i&&(t=ht(this.template.r[i],t,e),t!==e&&(e.unregister(this),this.models.splice(i,1,t),t&&t.addShuffleRegister(this,"mark"))),this.bubble(!n);},n.rebound=function(t){var e=this;this.models=this.template.r.map(function(t){return Ye(e.fragment,t)}),t&&this.bubble(!0);},n.retrieve=function(){return this.get()},n.teardown=function(){var e=this;this.fragment=void 0,this.dependencies&&this.dependencies.forEach(function(t){return t.unregister(e)}),t.prototype.teardown.call(this);},n.unreference=function(){t.prototype.unreference.call(this),$r(this);},n.unregister=function(e){t.prototype.unregister.call(this,e),$r(this);},n.unregisterLink=function(e){t.prototype.unregisterLink.call(this,e),$r(this);},e}(Cl),Df=Lf.prototype,Ff=Rf.prototype;Df.get=Ff.get,Df.handleChange=Ff.handleChange,Df.joinKey=Ff.joinKey,Df.mark=Ff.mark,Df.unbind=f;var zf={update:f,teardown:f},Uf=function(t){this.owner=t.owner||t.up.owner||zn(t.up),this.element=this.owner.attributeByName?this.owner:zn(t.up),this.up=t.up||this.owner.up,this.ractive=this.owner.ractive;var e=this.template=t.template;
	this.name=e.n,this.node=null,this.handle=null,this.element.decorators.push(this);},$f=Uf.prototype;$f.bind=function(){var t=this.element===this.owner?new Mp({owner:this.owner}):this.up;qr(this,this.template,t,{register:!0});},$f.bubble=function(){this.dirty||(this.dirty=!0,this.owner.bubble(),this.up.bubble());},$f.destroyed=function(){this.handle&&(this.handle.teardown(),this.handle=null),this.shouldDestroy=!0;},$f.handleChange=function(){this.bubble();},$f.rebound=function(t){this.model&&this.model.rebound(t);},$f.render=function(){var t=this;this.shouldDestroy=!1,this.handle&&this.unrender(),bl.scheduleTask(function(){if(t.element.rendered){var e=w("decorators",t.ractive,t.name);if(!e)return g(mo(t.name,"decorator")),void(t.handle=zf);t.node=t.element.node;var n=t.model?t.model.get():[];if(t.handle=e.apply(t.ractive,[t.node].concat(n)),!t.handle||!t.handle.teardown)throw new Error("The '"+t.name+"' decorator must return an object with a teardown method");t.shouldDestroy&&t.destroyed();}},!0);},$f.toString=function(){return ""},$f.unbind=function(){Zr(this,this.template);},$f.unrender=function(t){t&&!this.element.rendered||!this.handle||(this.handle.teardown(),this.handle=null);},$f.update=function(){var t=this.handle;if(!this.dirty)return void(t&&t.invalidate&&bl.scheduleTask(function(){return t.invalidate()},!0));if(this.dirty=!1,t)if(t.update){var e=this.model?this.model.get():[];t.update.apply(this.ractive,e);}else this.unrender(),this.render();},Uf.prototype.firstNode=f;var qf=function(t){function e(){t.apply(this,arguments);}t&&(e.__proto__=t);var n=e.prototype=Object.create(t&&t.prototype);return n.constructor=e,n.toString=function(){return "<!DOCTYPE"+this.template.a+">"},e}(df),Hf=qf.prototype;Hf.bind=Hf.render=Hf.teardown=Hf.unbind=Hf.unrender=Hf.update=f;var Zf=function(t,e){void 0===e&&(e="value"),this.element=t,this.ractive=t.ractive,this.attribute=t.attributeByName[e];var n=this.attribute.interpolator;n.twowayBinding=this;var i=n.model;if(i.isReadonly&&!i.setRoot){var r=i.getKeypath().replace(/^@/,"");return b("Cannot use two-way binding on <"+t.name+"> element: "+r+" is read-only. To suppress this warning use <"+t.name+" twoway='false'...>",{ractive:this.ractive}),!1}this.attribute.isTwoway=!0,this.model=i;var s=i.get();this.wasUndefined=c(s),c(s)&&this.getInitialValue&&(s=this.getInitialValue(),i.set(s)),this.lastVal(!0,s);var a=zn(this.element,!1,"form");a&&(this.resetValue=s,a.formBindings.push(this));},Wf=Zf.prototype;Wf.bind=function(){this.model.registerTwowayBinding(this);},Wf.handleChange=function(){var t=this,e=this.getValue();this.lastVal()!==e&&(bl.start(),this.attribute.locked=!0,this.model.set(e),this.lastVal(!0,e),this.model.get()!==e?this.attribute.locked=!1:bl.scheduleTask(function(){return t.attribute.locked=!1}),bl.end());},Wf.lastVal=function(t,e){return t?void(this.lastValue=e):this.lastValue},Wf.rebind=function(t,e){var n=this;this.model&&this.model===e&&e.unregisterTwowayBinding(this),t&&(this.model=t,bl.scheduleTask(function(){return t.registerTwowayBinding(n)}));},Wf.rebound=function(){this.model&&this.model.unregisterTwowayBinding(this),this.model=this.attribute.interpolator.model,this.model&&this.model.registerTwowayBinding(this);},Wf.render=function(){this.node=this.element.node,this.node._ractive.binding=this,this.rendered=!0;},Wf.setFromNode=function(t){this.model.set(t.value);},Wf.unbind=function(){this.model&&this.model.unregisterTwowayBinding(this);},Zf.prototype.unrender=f;var Gf=function(t){function e(e){t.call(this,e,"checked");}t&&(e.__proto__=t);var n=e.prototype=Object.create(t&&t.prototype);return n.constructor=e,n.render=function(){t.prototype.render.call(this),this.element.on("change",Wr),this.node.attachEvent&&this.element.on("click",Wr);},n.unrender=function(){this.element.off("change",Wr),this.node.attachEvent&&this.element.off("click",Wr);},n.getInitialValue=function(){return !!this.element.getAttribute("checked")},n.getValue=function(){return this.node.checked},n.setFromNode=function(t){this.model.set(t.checked);},e}(Zf),Qf=function(t,e,n){var i=this;this.model=e,this.hash=t,this.getValue=function(){return i.value=n.call(i),i.value},this.bindings=[];},Yf=Qf.prototype;Yf.add=function(t){this.bindings.push(t);},Yf.bind=function(){var t=this;this.value=this.model.get(),this.bindings.forEach(function(e){return e.lastVal(!0,t.value)}),this.model.registerTwowayBinding(this),this.bound=!0;},Yf.remove=function(t){V(this.bindings,t),this.bindings.length||this.unbind();},Yf.unbind=function(){this.model.unregisterTwowayBinding(this),this.bound=!1,delete this.model[this.hash];},Qf.prototype.rebind=Zf.prototype.rebind;var Jf=[].push,Xf=function(t){function e(e){if(t.call(this,e,"name"),this.checkboxName=!0,this.group=Gr("checkboxes",this.model,Qr),this.group.add(this),this.noInitialValue&&(this.group.noInitialValue=!0),this.group.noInitialValue&&this.element.getAttribute("checked")){var n=this.model.get(),i=this.element.getAttribute("value");this.arrayContains(n,i)||Jf.call(n,i);}}t&&(e.__proto__=t);var n=e.prototype=Object.create(t&&t.prototype);return n.constructor=e,n.bind=function(){this.group.bound||this.group.bind();},n.getInitialValue=function(){return this.noInitialValue=!0,[]},n.getValue=function(){return this.group.value},n.handleChange=function(){this.isChecked=this.element.node.checked,this.group.value=this.model.get().slice();var e=this.element.getAttribute("value");this.isChecked&&!this.arrayContains(this.group.value,e)?this.group.value.push(e):!this.isChecked&&this.arrayContains(this.group.value,e)&&this.removeFromArray(this.group.value,e),this.lastValue=null,t.prototype.handleChange.call(this);},n.render=function(){t.prototype.render.call(this);var e=this.node,n=this.model.get(),i=this.element.getAttribute("value");Fa(n)?this.isChecked=this.arrayContains(n,i):this.isChecked=this.element.compare(n,i),e.name="{{"+this.model.getKeypath()+"}}",e.checked=this.isChecked,this.element.on("change",Wr),this.node.attachEvent&&this.element.on("click",Wr);},n.setFromNode=function(t){if(this.group.bindings.forEach(function(t){return t.wasUndefined=!0}),t.checked){var e=this.group.getValue();e.push(this.element.getAttribute("value")),this.group.model.set(e);}},n.unbind=function(){this.group.remove(this);},n.unrender=function(){var t=this.element;t.off("change",Wr),this.node.attachEvent&&t.off("click",Wr);},n.arrayContains=function(t,e){for(var n=this,i=t.length;i--;)if(n.element.compare(e,t[i]))return !0;return !1},n.removeFromArray=function(t,e){var n=this;if(t)for(var i=t.length;i--;)n.element.compare(e,t[i])&&t.splice(i,1);},e}(Zf),td=function(t){function e(){t.apply(this,arguments);}t&&(e.__proto__=t);var n=e.prototype=Object.create(t&&t.prototype);return n.constructor=e,n.getInitialValue=function(){return this.element.fragment?this.element.fragment.toString():""},n.getValue=function(){return this.element.node.innerHTML},n.render=function(){t.prototype.render.call(this);var e=this.element;e.on("change",Wr),e.on("blur",Wr),this.ractive.lazy||(e.on("input",Wr),this.node.attachEvent&&e.on("keyup",Wr));},n.setFromNode=function(t){this.model.set(t.innerHTML);},n.unrender=function(){var t=this.element;t.off("blur",Wr),t.off("change",Wr),t.off("input",Wr),t.off("keyup",Wr);},e}(Zf),ed=function(t){function e(){t.apply(this,arguments);}t&&(e.__proto__=t);var n=e.prototype=Object.create(t&&t.prototype);return n.constructor=e,n.getInitialValue=function(){return ""},n.getValue=function(){return this.node.value},n.render=function(){t.prototype.render.call(this);var e=this.ractive.lazy,n=!1,i=this.element;"lazy"in this.element&&(e=this.element.lazy),r(e)&&(n=+e,e=!1),this.handler=n?Jr(n):Wr;var s=this.node;i.on("change",Wr),"file"!==s.type&&(e||(i.on("input",this.handler),s.attachEvent&&i.on("keyup",this.handler)),i.on("blur",Yr));},n.unrender=function(){var t=this.element;this.rendered=!1,t.off("change",Wr),t.off("input",this.handler),t.off("keyup",this.handler),t.off("blur",Yr);},e}(Zf),nd=function(t){function e(){t.apply(this,arguments);}t&&(e.__proto__=t);var n=e.prototype=Object.create(t&&t.prototype);return n.constructor=e,n.getInitialValue=function(){return void 0},n.getValue=function(){return this.node.files},n.render=function(){this.element.lazy=!1,t.prototype.render.call(this);},n.setFromNode=function(t){this.model.set(t.files);},e}(ed),id=function(t){function e(){t.apply(this,arguments);}t&&(e.__proto__=t);var n=e.prototype=Object.create(t&&t.prototype);return n.constructor=e,n.getInitialValue=function(){return this.element.options.filter(function(t){return t.getAttribute("selected")}).map(function(t){return t.getAttribute("value")})},n.getValue=function(){for(var t=this.element.node.options,e=t.length,n=[],i=0;e>i;i+=1){var r=t[i];if(r.selected){var s=r._ractive?r._ractive.value:r.value;n.push(s);}}return n},n.handleChange=function(){var e=this.attribute,n=e.getValue(),i=this.getValue();return (c(n)||!j(i,n))&&t.prototype.handleChange.call(this),this},n.render=function(){t.prototype.render.call(this),this.element.on("change",Wr),c(this.model.get())&&this.handleChange();},n.setFromNode=function(t){for(var e=Xr(t),n=e.length,i=new Array(n);n--;){var r=e[n];i[n]=r._ractive?r._ractive.value:r.value;}this.model.set(i);},n.unrender=function(){this.element.off("change",Wr);},e}(Zf),rd=function(t){function e(){t.apply(this,arguments);}t&&(e.__proto__=t);var n=e.prototype=Object.create(t&&t.prototype);return n.constructor=e,n.getInitialValue=function(){return void 0},n.getValue=function(){var t=parseFloat(this.node.value);return isNaN(t)?void 0:t},n.setFromNode=function(t){var e=parseFloat(t.value);isNaN(e)||this.model.set(e);},e}(ed),sd={},ad=function(t){function e(e){t.call(this,e,"checked"),this.siblings=ts(this.ractive._guid+this.element.getAttribute("name")),this.siblings.push(this);}t&&(e.__proto__=t);var n=e.prototype=Object.create(t&&t.prototype);return n.constructor=e,n.getValue=function(){return this.node.checked},n.handleChange=function(){bl.start(),this.siblings.forEach(function(t){t.model.set(t.getValue());}),bl.end();},n.render=function(){t.prototype.render.call(this),this.element.on("change",Wr),this.node.attachEvent&&this.element.on("click",Wr);},n.setFromNode=function(t){this.model.set(t.checked);},n.unbind=function(){V(this.siblings,this);},n.unrender=function(){this.element.off("change",Wr),this.node.attachEvent&&this.element.off("click",Wr);},e}(Zf),od=function(t){function e(e){var n=this;t.call(this,e,"name"),this.group=Gr("radioname",this.model,es),this.group.add(this),e.checked&&(this.group.value=this.getValue()),this.attribute.interpolator.pathChanged=function(){return n.updateName()};}t&&(e.__proto__=t);var n=e.prototype=Object.create(t&&t.prototype);return n.constructor=e,n.bind=function(){this.group.bound||this.group.bind();},n.getInitialValue=function(){return this.element.getAttribute("checked")?this.element.getAttribute("value"):void 0},n.getValue=function(){return this.element.getAttribute("value")},n.handleChange=function(){this.node.checked&&(this.group.value=this.getValue(),t.prototype.handleChange.call(this)),this.updateName();},n.lastVal=function(t,e){return this.group?t?void(this.group.lastValue=e):this.group.lastValue:void 0},n.rebind=function(e,n){t.prototype.rebind.call(this,e,n),this.updateName();},n.rebound=function(e){t.prototype.rebound.call(this,e),this.updateName();},n.render=function(){t.prototype.render.call(this);var e=this.node;this.updateName(),e.checked=this.element.compare(this.model.get(),this.element.getAttribute("value")),this.element.on("change",Wr),e.attachEvent&&this.element.on("click",Wr);},n.setFromNode=function(t){t.checked&&this.group.model.set(this.element.getAttribute("value"));},n.unbind=function(){this.group.remove(this);},n.unrender=function(){var t=this.element;t.off("change",Wr),this.node.attachEvent&&t.off("click",Wr);},n.updateName=function(){this.node&&(this.node.name="{{"+this.model.getKeypath()+"}}");},e}(Zf),ud=function(t){function e(){t.apply(this,arguments);}t&&(e.__proto__=t);var n=e.prototype=Object.create(t&&t.prototype);return n.constructor=e,n.forceUpdate=function(){var t=this,e=this.getValue();void 0!==e&&(this.attribute.locked=!0,bl.scheduleTask(function(){return t.attribute.locked=!1}),this.model.set(e));},n.getInitialValue=function(){if(void 0===this.element.getAttribute("value")){var t=this.element.options,e=t.length;if(e){for(var n,i,r=e;r--;){var s=t[r];if(s.getAttribute("selected")){s.getAttribute("disabled")||(n=s.getAttribute("value")),i=!0;break}}if(!i)for(;++r<e;)if(!t[r].getAttribute("disabled")){n=t[r].getAttribute("value");break}return void 0!==n&&(this.element.attributeByName.value.value=n),n}}},n.getValue=function(){var t,e=this.node.options,n=e.length;for(t=0;n>t;t+=1){var i=e[t];if(e[t].selected&&!e[t].disabled)return i._ractive?i._ractive.value:i.value}},n.render=function(){t.prototype.render.call(this),this.element.on("change",Wr);},n.setFromNode=function(t){var e=Xr(t)[0];this.model.set(e._ractive?e._ractive.value:e.value);},n.unrender=function(){this.element.off("change",Wr);},e}(Zf),hd=/;\s*$/,ld=function(t){function e(e){var n=this;if(t.call(this,e),this.name=e.template.e.toLowerCase(),this.parent=zn(this.up,!1),this.parent&&"option"===this.parent.name)throw new Error("An <option> element cannot contain other elements (encountered <"+this.name+">)");this.decorators=[],this.attributeByName={};for(var i,r,s,a,o,u,l,c,f=this.template.m,d=f&&f.length||0,p=0;d>p;p++)if(l=f[p],l.g)(n.statics||(n.statics={}))[l.n]=h(l.f)?l.f:l.n;else switch(l.t){case Wo:case Nu:case Ou:case Su:case ju:s=Ys({owner:n,up:n.up,template:l}),r=l.n,i=i||(i=n.attributes=[]),"value"===r?a=s:"name"===r?u=s:"class"===r?o=s:i.push(s);break;case Tu:n.delegate=!1;break;default:(c||(c=[])).push(l);}a&&i.push(a),u&&i.push(u),o&&i.unshift(o),c&&((i||(this.attributes=[])).push(new xf({owner:this,up:this.up,template:c})),c=[]),e.template.f&&!e.deferContent&&(this.fragment=new Mp({template:e.template.f,owner:this,cssIds:null})),this.binding=null;}t&&(e.__proto__=t);var n=e.prototype=Object.create(t&&t.prototype);return n.constructor=e,n.bind=function(){var t=this.attributes;if(t){t.binding=!0;for(var e=t.length,n=0;e>n;n++)t[n].bind();t.binding=!1;}this.fragment&&this.fragment.bind(),this.binding?this.binding.bind():this.recreateTwowayBinding();},n.createTwowayBinding=function(){if("twoway"in this?this.twoway:this.ractive.twoway){var t=is(this);if(t){var e=new t(this);if(e&&e.model)return e}}},n.destroyed=function(){this.attributes&&this.attributes.forEach(G),this.fragment&&this.fragment.destroyed();},n.detach=function(){return this.rendered||this.destroyed(),ii(this.node)},n.find=function(t,e){return this.node&&sc(this.node,t)?this.node:this.fragment?this.fragment.find(t,e):void 0},n.findAll=function(t,e){var n=e.result;sc(this.node,t)&&n.push(this.node),this.fragment&&this.fragment.findAll(t,e);},n.findNextNode=function(){return null},n.firstNode=function(){return this.node},n.getAttribute=function(t){if(this.statics&&t in this.statics)return this.statics[t];var e=this.attributeByName[t];return e?e.getValue():void 0},n.getContext=function(){for(var t=[],e=arguments.length;e--;)t[e]=arguments[e];return this.fragment?(n=this.fragment).getContext.apply(n,t):(this.ctx||(this.ctx=new ec(this.up,this)),t.unshift(Ra(this.ctx)),Ia.apply(null,t));var n;},n.off=function(t,e,n){void 0===n&&(n=!1);var i=this.up.delegate,r=this.listeners&&this.listeners[t];if(r)if(V(r,e),i){var s=(i.listeners||(i.listeners=[]))&&(i.listeners[t]||(i.listeners[t]=[]));s.refs&&!--s.refs&&i.off(t,os,!0);}else if(this.rendered){var a=this.node,o=a.addEventListener,u=a.removeEventListener;r.length?r.length&&!r.refs&&n&&(u.call(a,t,hs,!0),o.call(a,t,hs,!1)):u.call(a,t,hs,n);}},n.on=function(t,e,n){void 0===n&&(n=!1);var i=this.up.delegate,r=(this.listeners||(this.listeners={}))[t]||(this.listeners[t]=[]);if(i){var s=(i.listeners||(i.listeners=[]))&&i.listeners[t]||(i.listeners[t]=[]);s.refs?s.refs++:(s.refs=0,i.on(t,os,!0),s.refs++);}else if(this.rendered){var a=this.node,o=a.addEventListener,u=a.removeEventListener;r.length?r.length&&!r.refs&&n&&(u.call(a,t,hs,!1),o.call(a,t,hs,!0)):o.call(a,t,hs,n);}S(this.listeners[t],e);},n.recreateTwowayBinding=function(){this.binding&&(this.binding.unbind(),this.binding.unrender()),(this.binding=this.createTwowayBinding())&&(this.binding.bind(),this.rendered&&this.binding.render());},n.rebound=function(e){t.prototype.rebound.call(this,e),this.attributes&&this.attributes.forEach(function(t){return t.rebound(e)}),this.binding&&this.binding.rebound(e);},n.render=function(t,e){var n=this;this.namespace=as(this);var i,r=!1;if(e)for(var s;s=e.shift();){if(s.nodeName.toUpperCase()===n.template.e.toUpperCase()&&s.namespaceURI===n.namespace){n.node=i=s,r=!0;break}ii(s);}if(!r&&this.node&&(i=this.node,t.appendChild(i),r=!0),!i){var a=this.template.e;i=rc(this.namespace===pc?a.toLowerCase():a,this.namespace,this.getAttribute("is")),this.node=i;}Ba(i,"_ractive",{value:{proxy:this},configurable:!0}),this.statics&&La(this.statics).forEach(function(t){i.setAttribute(t,n.statics[t]);}),r&&this.foundNode&&this.foundNode(i);var o=this.intro;if(o&&o.shouldFire("intro")&&(o.isIntro=!0,o.isOutro=!1,bl.registerTransition(o)),this.fragment){var u=r?P(i.childNodes):void 0;this.fragment.render(i,u),u&&u.forEach(ii);}if(r){this.binding&&this.binding.wasUndefined&&this.binding.setFromNode(i);for(var h=i.attributes.length;h--;){var l=i.attributes[h].name;l in n.attributeByName||n.statics&&l in n.statics||i.removeAttribute(l);}}if(this.up.cssIds&&i.setAttribute("data-ractive-css",this.up.cssIds.map(function(t){return "{"+t+"}"}).join(" ")),this.attributes)for(var c=this.attributes.length,f=0;c>f;f++)n.attributes[f].render();if(this.binding&&this.binding.render(),!this.up.delegate&&this.listeners){var d=this.listeners;for(var p in d)d[p]&&d[p].length&&n.node.addEventListener(p,hs,!!d[p].refs);}r||t.appendChild(i),this.rendered=!0;},n.toString=function(){var t=this,e=this.template.e,n=this.attributes&&this.attributes.map(ss).join("")||"";this.statics&&La(this.statics).forEach(function(e){return "class"!==e&&"style"!==e&&(n=" "+e+'="'+si(t.statics[e])+'"'+n)}),"option"===this.name&&this.isSelected()&&(n+=" selected"),"input"===this.name&&rs(this)&&(n+=" checked");var i=this.statics?this.statics.style:void 0,r=this.statics?this.statics["class"]:void 0;this.attributes&&this.attributes.forEach(function(t){"class"===t.name?r=(r||"")+(r?" ":"")+si(t.getString()):"style"===t.name?(i=(i||"")+(i?" ":"")+si(t.getString()),i&&!hd.test(i)&&(i+=";")):t.style?i=(i||"")+(i?" ":"")+t.style+": "+si(t.getString())+";":t.inlineClass&&t.getValue()&&(r=(r||"")+(r?" ":"")+t.inlineClass);}),void 0!==i&&(n=" style"+(i?'="'+i+'"':"")+n),void 0!==r&&(n=" class"+(r?'="'+r+'"':"")+n),this.up.cssIds&&(n+=' data-ractive-css="'+this.up.cssIds.map(function(t){return "{"+t+"}"}).join(" ")+'"');var s="<"+e+n+">";return Ku[this.name.toLowerCase()]?s:("textarea"===this.name&&void 0!==this.getAttribute("value")?s+=bt(this.getAttribute("value")):void 0!==this.getAttribute("contenteditable")&&(s+=this.getAttribute("value")||""),this.fragment&&(s+=this.fragment.toString(!/^(?:script|style)$/i.test(this.template.e))),s+="</"+e+">")},n.unbind=function(t){var e=this.attributes;if(e){e.unbinding=!0;for(var n=e.length,i=0;n>i;i++)e[i].unbind(t);e.unbinding=!1;}this.binding&&this.binding.unbind(t),this.fragment&&this.fragment.unbind(t);},n.unrender=function(t){if(this.rendered){this.rendered=!1;var e=this.intro;e&&e.complete&&e.complete(),"option"===this.name?this.detach():t&&bl.detachWhenReady(this);var n=this.outro;n&&n.shouldFire("outro")&&(n.isIntro=!1,n.isOutro=!0,bl.registerTransition(n)),this.fragment&&this.fragment.unrender(),this.binding&&this.binding.unrender();}},n.update=function(){if(this.dirty){this.dirty=!1;var t=this.attributes;if(t)for(var e=t.length,n=0;e>n;n++)t[n].update();this.fragment&&this.fragment.update();}},e}(mf),cd=null!==Ua?Ua.UIEvent:null,fd=function(t){function e(e){t.call(this,e),this.formBindings=[];}t&&(e.__proto__=t);var n=e.prototype=Object.create(t&&t.prototype);return n.constructor=e,n.render=function(e,n){t.prototype.render.call(this,e,n),this.on("reset",ls);},n.unrender=function(e){this.off("reset",ls),t.prototype.unrender.call(this,e);},e}(ld),dd=function(t,e){-1!==t.indexOf("*")&&p('Only component proxy-events may contain "*" wildcards, <'+e.name+" on-"+t+'="..."/> is not valid'),this.name=t,this.owner=e,this.handler=null;},pd=dd.prototype;pd.bind=function(){},pd.render=function(t){var e=this,n=this.name,i=function(){var i=e.owner.node;e.owner.on(n,e.handler=function(e){return t.fire({node:i,original:e,event:e,name:n})});};"load"!==n?bl.scheduleTask(i,!0):i();},pd.unbind=function(){},pd.unrender=function(){this.handler&&this.owner.off(this.name,this.handler);};var md=function(t,e,n,i){this.eventPlugin=t,this.owner=e,this.name=n,this.handler=null,this.args=i;},vd=md.prototype;vd.bind=function(){},vd.render=function(t){var e=this;bl.scheduleTask(function(){var n=e.owner.node;e.handler=e.eventPlugin.apply(e.owner.ractive,[n,function(i){return void 0===i&&(i={}),i.original?i.event=i.original:i.original=i.event,i.name=e.name,i.node=i.node||n,t.fire(i)}].concat(e.args||[]));});},vd.unbind=function(){},vd.unrender=function(){this.handler.teardown();};var gd=function(t,e){this.component=t,this.name=e,this.handler=null;},yd=gd.prototype;yd.bind=function(t){var e=this.component.instance;this.handler=e.on(this.name,function(){for(var n=[],i=arguments.length;i--;)n[i]=arguments[i];if(n[0]instanceof ec){var r=n.shift();r.component=e,t.fire(r,n);}else t.fire({},n);return !1});},yd.render=function(){},yd.unbind=function(){this.handler.cancel();},yd.unrender=function(){};var bd=/^(event|arguments|@node|@event|@context)(\..+)?$/,wd=/^\$(\d+)(\..+)?$/,xd=function(t){this.owner=t.owner||t.up.owner||zn(t.up),this.element=this.owner.attributeByName?this.owner:zn(t.up,!0),this.template=t.template,this.up=t.up,this.ractive=t.up.ractive,this.events=[];},kd=xd.prototype;kd.bind=function(){var t=this;if(this.events.length&&(this.events.forEach(function(t){return t.unrender()}),this.events=[]),this.element.type===Qo||this.element.type===Zo)this.template.n.forEach(function(e){t.events.push(new gd(t.element,e));});else {var e;if(e=this.template.a){var n=e.r.map(function(e){var n=Ye(t.up,e);return n?n.get():void 0});try{e=ft(e.s,n.length).apply(null,n);}catch(i){e=null,y("Failed to compute args for event on-"+this.template.n.join("- ")+": "+(i.message||i));}}this.template.n.forEach(function(n){var i=w("events",t.ractive,n);i?t.events.push(new md(i,t.element,n,e)):t.events.push(new dd(n,t.element));});}this.models=null,S(this.element.events||(this.element.events=[]),this),qr(this,this.template),this.fn||(this.action=this.template.f),this.events.forEach(function(e){return e.bind(t)});},kd.destroyed=function(){this.events.forEach(function(t){return t.unrender()});},kd.fire=function(t,e){var n=this;void 0===e&&(e=[]);var i=t instanceof ec&&t.refire?t:this.element.getContext(t);if(this.fn){var r=[],s=Hr(this,this.template,this.up,{specialRef:function(t){var e=bd.exec(t);if(e)return {special:e[1],keys:e[2]?A(e[2].substr(1)):[]};var n=wd.exec(t);return n?{special:"arguments",keys:[n[1]-1].concat(n[2]?A(n[2].substr(1)):[])}:void 0}});s&&s.forEach(function(s){if(!s)return r.push(void 0);if(s.special){var a,o=s.special;"@node"===o?a=n.element.node:"@event"===o?a=t&&t.event:"event"===o?(b("The event reference available to event directives is deprecated and should be replaced with @context and @event"),a=i):a="@context"===o?i:e;for(var u=s.keys.slice();a&&u.length;)a=a[u.shift()];return r.push(a)}return s.wrapper?r.push(s.wrapperValue):void r.push(s.get())});var a=this.ractive,o=a.event;a.event=i;var u=this.fn.apply(a,r),l=u.pop();if(l===!1){var c=t?t.original:void 0;c?(c.preventDefault&&c.preventDefault(),c.stopPropagation&&c.stopPropagation()):b("handler '"+this.template.n.join(" ")+"' returned false, but there is no event available to cancel");}else !u.length&&Fa(l)&&h(l[0])&&(l=wn(this.ractive,l.shift(),i,l));return a.event=o,l}return wn(this.ractive,this.action,i,e)},kd.handleChange=function(){},kd.render=function(){var t=this;this.events.forEach(function(e){return e.render(t)});},kd.toString=function(){return ""},kd.unbind=function(t){V(this.element.events,this),this.events.forEach(function(e){return e.unbind(t)});},kd.unrender=function(){this.events.forEach(function(t){return t.unrender()});};var _d=xd.prototype;_d.firstNode=_d.rebound=_d.update=f;var Ed=function(t){function e(e,n){t.call(this,null,null,null,"@undefined"),this.root=e.ractive.viewmodel,this.template=n,this.rootLink=!0,this.template=n,this.fragment=e,this.rebound();}t&&(e.__proto__=t);var n=e.prototype=Object.create(t&&t.prototype);return n.constructor=e,n.getKeypath=function(){return this.model?this.model.getKeypath():"@undefined"},n.rebound=function(){var t,e=this,n=this.fragment,i=this.template,r=this.base=ms(n,i);this.proxy&&ds(this);var s=this.proxy={rebind:function(n,o){o===r?(n=ht(i,n,o),n!==r&&(e.base=r=n)):~(t=a.indexOf(o))&&(n=ht(i.m[t].n,n,o),n!==a[t]&&a.splice(t,1,n||jo)),n!==o&&(o.unregister(s),n&&n.addShuffleTask(function(){return n.register(s)}));},handleChange:function(){o();}};r.register(s);var a=this.members=i.m.map(function(t){if(h(t))return {get:function(){return t}};var e;return t.t===lu?(e=Ye(n,t.n),e.register(s),e):(e=new Lf(n,t),e.register(s),e)}),o=function(){var t=r&&r.joinAll(a.reduce(function(t,e){var n=e.get();return Fa(n)?t.concat(n):(t.push(_(String(n))),t)},[]));t!==e.model&&(e.model=t,e.relinking(t),F(),ps(e));};o();},n.teardown=function(){ds(this),t.prototype.teardown.call(this);},n.unreference=function(){t.prototype.unreference.call(this),this.deps.length||this.refs||this.teardown();},n.unregister=function(e){t.prototype.unregister.call(this,e),this.deps.length||this.refs||this.teardown();},e}(No),Ad=Lf.prototype,Cd=Ed.prototype;Cd.unreference=Ad.unreference,Cd.unregister=Ad.unregister,Cd.unregisterLink=Ad.unregisterLink;var Sd=function(t){function e(e){t.call(this,e),e.owner&&(this.parent=e.owner),this.isStatic=!!e.template.s,this.model=null,this.dirty=!1;}t&&(e.__proto__=t);var n=e.prototype=Object.create(t&&t.prototype);return n.constructor=e,n.bind=function(t){var e=this.template.y?this.template.y.containerFragment:this.containerFragment||this.up,n=t||ms(e,this.template);if(n){var i=n.get();if(this.isStatic)return this.model={get:function(){return i}},void n.unreference();n.register(this),this.model=n;}},n.handleChange=function(){this.bubble();},n.rebind=function(t,e,n){return this.isStatic?void 0:(t=ht(this.template,t,e,this.up),t===this.model?!1:(this.model&&this.model.unregister(this),t&&t.addShuffleRegister(this,"mark"),this.model=t,n||this.handleChange(),!0))},n.rebound=function(t){if(this.model){if(this.model.rebound)this.model.rebound(t);else {var e=this.template.y?this.template.y.containerFragment:this.containerFragment||this.up,n=ms(e,this.template);n!==this.model&&(this.model.unregister(this),this.bind(n));}t&&this.bubble();}this.fragment&&this.fragment.rebound(t);},n.unbind=function(){this.isStatic||(this.model&&this.model.unregister(this),this.model=void 0);},e}(df),Od=vs.prototype=Object.create(mf.prototype);Ia(Od,Sd.prototype,{constructor:vs});var jd=function(t){function e(){t.apply(this,arguments);}t&&(e.__proto__=t);var n=e.prototype=Object.create(t&&t.prototype);return n.constructor=e,n.bubble=function(){this.owner&&this.owner.bubble(),t.prototype.bubble.call(this);},n.detach=function(){return ii(this.node)},n.firstNode=function(){return this.node},n.getString=function(){return this.model?ri(this.model.get()):""},n.render=function(t,e){if(!kr()){var n=this.value=this.getString();this.rendered=!0,fs(this,t,e,n);}},n.toString=function(t){var e=this.getString();return t?bt(e):e},n.unrender=function(t){t&&this.detach(),this.rendered=!1;},n.update=function(){if(this.dirty&&(this.dirty=!1,this.rendered)){var t=this.getString();t!==this.value&&(this.node.data=this.value=t);}},n.valueOf=function(){return this.model?this.model.get():void 0},e}(Sd),Nd=function(t){function e(){t.apply(this,arguments);}t&&(e.__proto__=t);var n=e.prototype=Object.create(t&&t.prototype);return n.constructor=e,n.render=function(e,n){t.prototype.render.call(this,e,n),this.node.defaultValue=this.node.value;},n.compare=function(t,e){var n=this.getAttribute("value-comparator");if(n){if(u(n))return n(t,e);if(t&&e)return t[n]==e[n]}return t==e},e}(ld),Td={"true":!0,"false":!1,"null":null,undefined:void 0},Vd=new RegExp("^(?:"+La(Td).join("|")+")"),Md=/^(?:[+-]?)(?:(?:(?:0|[1-9]\d*)?\.\d+)|(?:(?:0|[1-9]\d*)\.)|(?:0|[1-9]\d*))(?:[eE][+-]?\d+)?/,Pd=/\$\{([^\}]+)\}/g,Id=/^\$\{([^\}]+)\}/,Rd=/^\s*$/,Bd=Io.extend({init:function(t,e){this.values=e.values,this.sp();},postProcess:function(t){return 1===t.length&&Rd.test(this.leftover)?{value:t[0].v}:null},converters:[function(e){if(!e.values)return null;var n=e.matchPattern(Id);return n&&t(e.values,n)?{v:e.values[n]}:void 0},function(t){var e=t.matchPattern(Vd);return e?{v:Td[e]}:void 0},function(t){var e=t.matchPattern(Md);return e?{v:+e}:void 0},function(t){var e=Et(t),n=t.values;return e&&n?{v:e.v.replace(Pd,function(t,e){return e in n?n[e]:e})}:e},function(t){if(!t.matchString("{"))return null;var e={};if(t.sp(),t.matchString("}"))return {v:e};for(var n;n=gs(t);){if(e[n.key]=n.value,t.sp(),t.matchString("}"))return {v:e};if(!t.matchString(","))return null}return null},function(t){if(!t.matchString("["))return null;var e=[];if(t.sp(),t.matchString("]"))return {v:e};for(var n;n=t.read();){if(e.push(n.v),t.sp(),t.matchString("]"))return {v:e};if(!t.matchString(","))return null;t.sp();}return null}]}),Kd=function(t){function e(e){t.call(this,e),this.name=e.template.n,this.owner=e.owner||e.up.owner||e.element||zn(e.up),this.element=e.element||(this.owner.attributeByName?this.owner:zn(e.up)),this.up=this.element.up,this.ractive=this.up.ractive,this.element.attributeByName[this.name]=this,this.value=e.template.f;}t&&(e.__proto__=t);var n=e.prototype=Object.create(t&&t.prototype);return n.constructor=e,n.bind=function(){var t=this.template.f,e=this.element.instance.viewmodel;if(0===t)e.joinKey(this.name).set(!0);else if(h(t)){var n=ys(t);e.joinKey(this.name).set(n?n.value:t);}else Fa(t)&&bs(this);},n.rebound=function(t){if(this.boundFragment&&this.boundFragment.rebound(t),this.link){this.model=ms(this.up,this.template.f[0]);var e=this.element.instance.viewmodel.joinAll(A(this.name));e.link(this.model,this.name,{mapping:!0});}},n.render=function(){},n.unbind=function(t){this.model&&this.model.unregister(this),this.boundFragment&&this.boundFragment.unbind(t),this.element.bound&&this.link.target===this.model&&this.link.owner.unlink();},n.unrender=function(){},n.update=function(){this.dirty&&(this.dirty=!1,this.boundFragment&&this.boundFragment.update());},e}(df),Ld=function(t){function e(e){var n=e.template;n.a||(n.a={}),!c(n.a.value)||"disabled"in n.a||(n.a.value=n.f||""),t.call(this,e),this.select=zn(this.parent||this.up,!1,"select");}t&&(e.__proto__=t);var n=e.prototype=Object.create(t&&t.prototype);return n.constructor=e,n.bind=function(){if(!this.select)return void t.prototype.bind.call(this);var e=this.attributeByName.selected;if(e&&void 0!==this.select.getAttribute("value")){var n=this.attributes.indexOf(e);this.attributes.splice(n,1),delete this.attributeByName.selected;}t.prototype.bind.call(this),this.select.options.push(this);},n.bubble=function(){var e=this.getAttribute("value");this.node&&this.node.value!==e&&(this.node._ractive.value=e),t.prototype.bubble.call(this);},n.getAttribute=function(t){var e=this.attributeByName[t];return e?e.getValue():"value"===t&&this.fragment?this.fragment.valueOf():void 0},n.isSelected=function(){var t=this,e=this.getAttribute("value");if(c(e)||!this.select)return !1;var n=this.select.getAttribute("value");if(this.select.compare(n,e))return !0;if(this.select.getAttribute("multiple")&&Fa(n))for(var i=n.length;i--;)if(t.select.compare(n[i],e))return !0},n.render=function(e,n){t.prototype.render.call(this,e,n),this.attributeByName.value||(this.node._ractive.value=this.getAttribute("value"));
	},n.unbind=function(e){t.prototype.unbind.call(this,e),this.select&&V(this.select.options,this);},e}(ld),Dd=As.prototype=Ra(vs.prototype);Ia(Dd,{constructor:As,bind:function(){var t=this.template;if(this.yielder){if(this.container=this.up.ractive,this.component=this.container.component,this.containerFragment=this.up,!this.component)return this.fragment=new Mp({owner:this,template:[]}),void this.fragment.bind();this.up=this.component.up,t.r||t.x||t.rx||(this.refName="content");}this.macro?this.fn=this.macro:(this.refName||(this.refName=t.r),this.refName&&Os(this,this.refName),this.partial||this.fn||(vs.prototype.bind.call(this),this.model&&Os(this,this.model.get()))),this.partial||this.fn||b("Could not find template for partial '"+this.name+"'"),Cs(this,this.partial||[]),this.fn&&Ts(this),this.fragment.bind();},bubble:function(){this.dirty||(this.dirty=!0,this.yielder?this.containerFragment.bubble():this.up.bubble());},findNextNode:function(){return (this.containerFragment||this.up).findNextNode(this)},handleChange:function(){this.dirtyTemplate=!0,this.externalChange=!0,this.bubble();},rebound:function(t){var e=this;this._attrs&&La(this._attrs).forEach(function(n){return e._attrs[n].rebound(t)}),vs.prototype.rebound.call(this,t);},refreshAttrs:function(){var t=this;La(this._attrs).forEach(function(e){t.handle.attributes[e]=!t._attrs[e].items.length||t._attrs[e].valueOf();});},resetTemplate:function(){var t=this;if(this.fn&&this.proxy){if(this.last=0,!this.externalChange)return this.partial=this.fnTemplate,!0;u(this.proxy.teardown)&&this.proxy.teardown(),this.fn=this.proxy=null;}if(this.partial=null,this.refName&&(this.partial=ws(this.ractive,this.refName,this.up)),!this.partial&&this.model&&Os(this,this.model.get()),!this.fn){if(this.last&&this.partial===this.last)return !1;this.partial&&(this.last=this.partial,Ss(this));}return this.unbindAttrs(),this.fn?(Ts(this),u(this.proxy.render)&&bl.scheduleTask(function(){return t.proxy.render()})):this.partial||b("Could not find template for partial '"+this.name+"'"),!0},render:function(t,e){this.fn&&this.fn._cssDef&&!this.fn._cssDef.applied&&_i(),this.fragment.render(t,e),this.proxy&&u(this.proxy.render)&&this.proxy.render();},unbind:function(t){this.fragment.unbind(t),this.unbindAttrs(t),vs.prototype.unbind.call(this,t);},unbindAttrs:function(t){var e=this;this._attrs&&La(this._attrs).forEach(function(n){e._attrs[n].unbind(t);});},unrender:function(t){this.proxy&&u(this.proxy.teardown)&&this.proxy.teardown(),this.fragment.unrender(t);},update:function(){var t=this,e=this.proxy;this.updating=1,this.dirtyAttrs&&(this.dirtyAttrs=!1,La(this._attrs).forEach(function(e){return t._attrs[e].update()}),this.refreshAttrs(),u(e.update)&&e.update(this.handle.attributes)),this.dirtyTemplate&&(this.dirtyTemplate=!1,this.resetTemplate()&&this.fragment.resetTemplate(this.partial||[])),this.dirty&&(this.dirty=!1,e&&u(e.invalidate)&&e.invalidate(),this.fragment.update()),this.externalChange=!1,this.updating=0;}});var Fd="extra-attributes",zd=function(t,e,n){this.value=this.key=t,this.context=e,this.isReadonly=this.isKey=!0,this.deps=[],this.links=[],this.children=[],this.instance=n;},Ud=zd.prototype;Ud.applyValue=function(t){t!==this.value&&(this.value=this.key=t,this.deps.forEach(Q),this.links.forEach(Q),this.children.forEach(function(t){t.applyValue(t.context.getKeypath(t.instance));}));},Ud.destroyed=function(){this.upstream&&this.upstream.unregisterChild(this);},Ud.get=function(t){return t&&H(this),C(this.value)},Ud.getKeypath=function(){return C(this.value)},Ud.has=function(){return !1},Ud.rebind=function(t,e){for(var n=this,i=this.deps.length;i--;)n.deps[i].rebind(t,e,!1);for(i=this.links.length;i--;)n.links[i].relinking(t,!1);},Ud.register=function(t){this.deps.push(t);},Ud.registerChild=function(t){S(this.children,t),t.upstream=this;},Ud.registerLink=function(t){S(this.links,t);},Ud.unregister=function(t){V(this.deps,t);},Ud.unregisterChild=function(t){V(this.children,t);},Ud.unregisterLink=function(t){V(this.links,t);},zd.prototype.reference=f,zd.prototype.unreference=f;var $d=/^"(\\"|[^"])+"$/,qd=function(t){this.parent=t.owner.up,this.up=this,this.owner=t.owner,this.ractive=this.parent.ractive,this.delegate=this.ractive.delegate!==!1&&(this.parent.delegate||Ms(this.parent)),this.delegate&&this.delegate.delegate===!1&&(this.delegate=!1),this.delegate&&(this.delegate.delegate=this.delegate),this.cssIds="cssIds"in t?t.cssIds:this.parent?this.parent.cssIds:null,this.context=null,this.rendered=!1,this.iterations=[],this.template=t.template,this.indexRef=t.indexRef,this.keyRef=t.keyRef,this.pendingNewIndices=null,this.previousIterations=null,this.isArray=!1;},Hd=qd.prototype;Hd.bind=function(t){var e=this;this.context=t,this.bound=!0;var n=t.get(),i=this.aliases=this.owner.template.z&&this.owner.template.z.slice(),r=i&&i.find(function(t){return "shuffle"===t.n});r&&r.x&&r.x.x&&("true"===r.x.x.s?this.shuffler=!0:$d.test(r.x.x.s)&&(this.shuffler=A(r.x.x.s.slice(1,-1)))),this.shuffler&&(this.values=Is(this,this.shuffler)),this.source&&this.source.model.unbind(this.source);var a=t.isComputed&&i&&i.find(function(t){return "source"===t.n});if(a&&a.x&&a.x.r){var o=ms(this,a.x);this.source={handleChange:function(){},rebind:function(t){this.model.unregister(this),this.model=t,t.register(this);}},this.source.model=o,o.register(this.source);}if(this.isArray=Fa(n)){this.iterations=[];for(var u=this.length=n.length,h=0;u>h;h+=1)e.iterations[h]=e.createIteration(h,h);}else if(s(n)){if(this.isArray=!1,this.indexRef){var l=this.indexRef.split(",");this.keyRef=l[0],this.indexRef=l[1];}var c=La(n);this.length=c.length,this.iterations=c.map(function(t,n){return e.createIteration(t,n)});}return this},Hd.bubble=function(t){this.bubbled||(this.bubbled=[]),this.bubbled.push(t),this.rebounding||this.owner.bubble();},Hd.createIteration=function(t,e){var n=new Mp({owner:this,template:this.template});return n.isIteration=!0,n.delegate=this.delegate,this.aliases&&(n.aliases={}),Ps(this,n,t,e),n.bind(n.context)},Hd.destroyed=function(){for(var t=this,e=this.iterations.length,n=0;e>n;n++)t.iterations[n].destroyed();this.pathModel&&this.pathModel.destroyed(),this.rootModel&&this.rootModel.destroyed();},Hd.detach=function(){var t=ei();return this.iterations.forEach(function(e){return t.appendChild(e.detach())}),t},Hd.find=function(t,e){return I(this.iterations,function(n){return n.find(t,e)})},Hd.findAll=function(t,e){return this.iterations.forEach(function(n){return n.findAll(t,e)})},Hd.findAllComponents=function(t,e){return this.iterations.forEach(function(n){return n.findAllComponents(t,e)})},Hd.findComponent=function(t,e){return I(this.iterations,function(n){return n.findComponent(t,e)})},Hd.findContext=function(){return this.context},Hd.findNextNode=function(t){var e=this;if(t.index<this.iterations.length-1)for(var n=t.index+1;n<this.iterations.length;n++){var i=e.iterations[n].firstNode(!0);if(i)return i}return this.owner.findNextNode()},Hd.firstNode=function(t){return this.iterations[0]?this.iterations[0].firstNode(t):null},Hd.getLast=function(){return this.lastModel||(this.lastModel=new zd(this.length-1))},Hd.rebind=function(t){var e=this;this.context=t,this.source||this.iterations.forEach(function(t){Ps(e,t,t.key,t.index);});},Hd.rebound=function(t){var e=this;this.context=this.owner.model,this.iterations.forEach(function(n,i){n.context=Rs(e,n,i),n.rebound(t);});},Hd.render=function(t,e){var n=this.iterations;if(n)for(var i=n.length,r=0;i>r;r++)n[r].render(t,e);this.rendered=!0;},Hd.shuffle=function(t,e){var n=this;this.pendingNewIndices||(this.previousIterations=this.iterations.slice()),this.pendingNewIndices||(this.pendingNewIndices=[]),this.pendingNewIndices.push(t);var i=[];t.forEach(function(t,r){if(-1!==t){var s=n.iterations[r];i[t]=s,t!==r&&s&&(s.dirty=!0,e&&(s.shouldRebind=1));}}),this.iterations=i,e||this.bubble();},Hd.shuffled=function(){this.iterations.forEach(nt);},Hd.toString=function(t){return this.iterations?this.iterations.map(t?ut:ot).join(""):""},Hd.unbind=function(t){this.bound=!1,this.source&&this.source.model.unregister(this.source);for(var e=this.pendingNewIndices?this.previousIterations:this.iterations,n=e.length,i=0;n>i;i++)e[i].unbind(t);return this},Hd.unrender=function(t){for(var e=this,n=this.iterations.length,i=0;n>i;i++)e.iterations[i].unrender(t);if(this.pendingNewIndices&&this.previousIterations){n=this.previousIterations.length;for(var r=0;n>r;r++)e.previousIterations[r].unrender(t);}this.rendered=!1;},Hd.update=function(){var t=this;if(this.pendingNewIndices)return this.bubbled.length=0,void this.updatePostShuffle();if(!this.updating){if(this.updating=!0,this.shuffler){var e=Is(this,this.shuffler),n=R(this.values,e);n.same?this.iterations.forEach(at):(this.shuffle(n,!0),this.updatePostShuffle());}else {for(var i=this.iterations.length,r=0;i>r;r++){var a=t.iterations[r];a&&a.idxModel&&a.idxModel.applyValue(r);}var o,u,h,l=this.context.get(),c=this.isArray,f=!0;if(this.isArray=Fa(l)){if(this.source){this.rebounding=1;var d=this.source.model.get();this.iterations.forEach(function(e,n){n<l.length&&e.lastValue!==l[n]&&~(h=d.indexOf(l[n]))&&(Ps(t,e,n,n),e.rebound(!0));}),this.rebounding=0;}c&&(f=!1,this.iterations.length>l.length&&(o=this.iterations.splice(l.length)));}else if(s(l)&&!c)for(f=!1,o=[],u={},h=this.iterations.length;h--;){var p=t.iterations[h];p.key in l?u[p.key]=!0:(t.iterations.splice(h,1),o.push(p));}var m=Fa(l)?l.length:s(l)?La(l).length:0;if(this.length=m,this.updateLast(),f&&(o=this.iterations,this.iterations=[]),o){i=o.length;for(var v=0;i>v;v++)o[v].unbind().unrender(!0);}if(!f&&this.isArray&&this.bubbled&&this.bubbled.length){var g=this.bubbled;this.bubbled=[],i=g.length;for(var y=0;i>y;y++)t.iterations[g[y]]&&t.iterations[g[y]].update();}else {i=this.iterations.length;for(var b=0;i>b;b++)t.iterations[b].update();}var w,x;if(m>this.iterations.length){if(w=this.rendered?ei():null,h=this.iterations.length,Fa(l))for(;h<l.length;)x=t.createIteration(h,h),t.iterations.push(x),t.rendered&&x.render(w),h+=1;else if(s(l)){if(this.indexRef&&!this.keyRef){var k=this.indexRef.split(",");this.keyRef=k[0],this.indexRef=k[1];}La(l).forEach(function(e){u&&e in u||(x=t.createIteration(e,h),t.iterations.push(x),t.rendered&&x.render(w),h+=1);});}if(this.rendered){var _=this.parent.findParentNode(),E=this.parent.findNextNode(this.owner);_.insertBefore(w,E);}}}this.updating=!1;}},Hd.updateLast=function(){this.lastModel&&this.lastModel.applyValue(this.length-1);},Hd.updatePostShuffle=function(){var t=this,e=this.pendingNewIndices[0],n=this.rendered?this.parent.findParentNode():null,i=n&&this.owner.findNextNode(),r=n?ei():null;this.pendingNewIndices.slice(1).forEach(function(t){e.forEach(function(n,i){e[i]=t[n];});});var s,a,u,h,l,f,d=this.length=this.context.get().length,p=this.previousIterations,m=this.iterations,v=this.context.get(),g={},y=new Array(e.length);for(e.forEach(function(t,e){return y[t]=e}),this.updateLast(),s=u=0;d>s;)c(y[s])?(h=m[s]=t.createIteration(s,s),n&&(l=p[u],l=l&&n&&l.firstNode()||i,h.render(r),n.insertBefore(r,l)),s++):(a=e[u],-1===a?(p[u]&&p[u].unbind().unrender(!0),p[u++]=0):a>s?(g[a]=p[u],p[u++]=null):(m[s]=h=m[s]||g[s]||t.createIteration(s,s),(g[s]||u!==s)&&(f=t.source&&h.lastValue!==v[s],Ps(t,h,s,s)),!n||!g[s]&&p[u]||(l=p[u+1],l=l&&n&&l.firstNode()||i,g[s]?n.insertBefore(h.detach(),l):(h.render(r),n.insertBefore(r,l))),p[u++]=0,s++),h&&o(h)&&((h.shouldRebind||f)&&(h.rebound(f),h.shouldRebind=0),h.update(),h.shuffled()));for(var b=p.length,w=0;b>w;w++)p[w]&&p[w].unbind().unrender(!0);this.shuffler&&(this.values=Is(this,this.shuffler)),this.pendingNewIndices=null,this.previousIterations=null;},qd.prototype.getContext=rn,qd.prototype.getKeypath=ta;var Zd=function(t){function e(e){t.call(this,e),this.isAlias=e.template.t===tu,this.sectionType=e.template.n||this.isAlias&&xu||null,this.templateSectionType=this.sectionType,this.subordinate=1===e.template.l,this.fragment=null;}t&&(e.__proto__=t);var n=e.prototype=Object.create(t&&t.prototype);return n.constructor=e,n.bind=function(){t.prototype.bind.call(this),this.subordinate&&(this.sibling=this.up.items[this.up.items.indexOf(this)-1],this.sibling.nextSibling=this),this.model||this.isAlias?(this.dirty=!0,this.update()):!this.sectionType||this.sectionType!==bu||this.sibling&&this.sibling.isTruthy()||(this.fragment=new Mp({owner:this,template:this.template.f}).bind());},n.bubble=function(){!this.dirty&&this["yield"]?(this.dirty=!0,this.containerFragment.bubble()):t.prototype.bubble.call(this);},n.detach=function(){var e=this.fragment||this.detached;return e?e.detach():t.prototype.detach.call(this)},n.isTruthy=function(){if(this.subordinate&&this.sibling.isTruthy())return !0;var t=this.model?this.model.isRoot?this.model.value:this.model.get():void 0;return !(!t||this.templateSectionType!==ku&&Bs(t))},n.rebind=function(e,n,i){t.prototype.rebind.call(this,e,n,i)&&this.fragment&&this.sectionType!==yu&&this.sectionType!==bu&&this.fragment.rebind(e);},n.rebound=function(e){this.model&&(this.model.rebound?this.model.rebound(e):(t.prototype.unbind.call(this),t.prototype.bind.call(this),(this.sectionType===xu||this.sectionType===ku||this.sectionType===wu)&&this.fragment&&this.fragment.rebind(this.model),e&&this.bubble())),this.fragment&&this.fragment.rebound(e);},n.render=function(t,e){this.rendered=!0,this.fragment&&this.fragment.render(t,e);},n.shuffle=function(t){this.fragment&&this.sectionType===wu&&this.fragment.shuffle(t);},n.unbind=function(e){t.prototype.unbind.call(this,e),this.fragment&&this.fragment.unbind(e);},n.unrender=function(t){this.rendered&&this.fragment&&this.fragment.unrender(t),this.rendered=!1;},n.update=function(){var t=this;if(this.dirty&&(this.fragment&&this.sectionType!==yu&&this.sectionType!==bu&&(this.fragment.context=this.model),this.model||this.sectionType===bu||this.isAlias)){this.dirty=!1;var e=this.model?this.model.isRoot?this.model.value:this.model.get():void 0,n=!this.subordinate||!this.sibling.isTruthy(),i=this.sectionType;this["yield"]&&this["yield"]!==e?(this.up=this.containerFragment,this.container=null,this["yield"]=null,this.rendered&&this.fragment.unbind().unrender(!0),this.fragment=null):this.rendered&&!this["yield"]&&e instanceof ec&&(this.rendered&&this.fragment&&this.fragment.unbind().unrender(!0),this.fragment=null),(null===this.sectionType||null===this.templateSectionType)&&(this.sectionType=Ks(e,this.template.i)),i&&i!==this.sectionType&&this.fragment&&(this.rendered&&this.fragment.unbind().unrender(!0),this.fragment=null);var r,s=this.sectionType===wu||this.sectionType===xu||n&&(this.sectionType===bu?!this.isTruthy():this.isTruthy())||this.isAlias;if(s)if(this.fragment||(this.fragment=this.detached),this.fragment)this.detached&&(Ls(this,this.fragment),this.detached=!1,this.rendered=!0),this.fragment.bound||this.fragment.bind(this.model),this.fragment.update();else if(this.sectionType===wu)r=new qd({owner:this,template:this.template.f,indexRef:this.template.i}).bind(this.model);else {var a=this.sectionType!==yu&&this.sectionType!==bu?this.model:null;e instanceof ec&&(this["yield"]=e,this.containerFragment=this.up,this.up=e.fragment,this.container=e.ractive,a=void 0),r=new Mp({owner:this,template:this.template.f}).bind(a);}else this.fragment&&this.rendered?Pl!==!0?this.fragment.unbind().unrender(!0):(this.unrender(!1),this.detached=this.fragment,bl.promise().then(function(){t.detached&&t.detach();})):this.fragment&&this.fragment.unbind(),this.fragment=null;r&&(this.rendered&&Ls(this,r),this.fragment=r),this.nextSibling&&(this.nextSibling.dirty=!0,this.nextSibling.update());}},e}(vs),Wd=function(t){function e(e){t.call(this,e),this.options=[];}t&&(e.__proto__=t);var n=e.prototype=Object.create(t&&t.prototype);return n.constructor=e,n.foundNode=function(t){if(this.binding){var e=Xr(t);e.length>0&&(this.selectedOptions=e);}},n.render=function(e,n){t.prototype.render.call(this,e,n),this.sync();for(var i=this.node,r=i.options.length;r--;)i.options[r].defaultSelected=i.options[r].selected;this.rendered=!0;},n.sync=function(){var t=this,e=this.node;if(e){var n=P(e.options);if(this.selectedOptions)return n.forEach(function(e){t.selectedOptions.indexOf(e)>=0?e.selected=!0:e.selected=!1;}),this.binding.setFromNode(e),void delete this.selectedOptions;var i=this.getAttribute("value"),r=this.getAttribute("multiple"),s=r&&Fa(i);if(void 0!==i){var a;n.forEach(function(e){var n=e._ractive?e._ractive.value:e.value,o=r?s&&t.valueContains(i,n):t.compare(i,n);o&&(a=!0),e.selected=o;}),a||r||this.binding&&this.binding.forceUpdate();}else this.binding&&this.binding.forceUpdate&&this.binding.forceUpdate();}},n.valueContains=function(t,e){for(var n=this,i=t.length;i--;)if(n.compare(e,t[i]))return !0},n.compare=function(t,e){var n=this.getAttribute("value-comparator");if(n){if(u(n))return n(e,t);if(e&&t)return e[n]==t[n]}return e==t},n.update=function(){var e=this.dirty;t.prototype.update.call(this),e&&this.sync();},e}(ld),Gd=function(t){function e(e){var n=e.template;e.deferContent=!0,t.call(this,e),this.attributeByName.value||(n.f&&ns({template:n})?(this.attributes||(this.attributes=[])).push(Ys({owner:this,template:{t:Wo,f:n.f,n:"value"},up:this.up})):this.fragment=new Mp({owner:this,cssIds:null,template:n.f}));}t&&(e.__proto__=t);var n=e.prototype=Object.create(t&&t.prototype);return n.constructor=e,n.bubble=function(){var t=this;this.dirty||(this.dirty=!0,this.rendered&&!this.binding&&this.fragment&&bl.scheduleTask(function(){t.dirty=!1,t.node.value=t.fragment.toString();}),this.up.bubble());},e}(Nd),Qd=function(t){function e(e){t.call(this,e),this.type=Bo;}t&&(e.__proto__=t);var n=e.prototype=Object.create(t&&t.prototype);return n.constructor=e,n.detach=function(){return ii(this.node)},n.firstNode=function(){return this.node},n.render=function(t,e){kr()||(this.rendered=!0,fs(this,t,e,this.template));},n.toString=function(t){return t?bt(this.template):this.template},n.unrender=function(t){this.rendered&&t&&this.detach(),this.rendered=!1;},n.valueOf=function(){return this.template},e}(df),Yd=Qd.prototype;Yd.bind=Yd.unbind=Yd.update=f;var Jd,Xd="hidden";if($a){var tp;if(Xd in $a)tp="";else for(var ep=Ga.length;ep--;){var np=Ga[ep];if(Xd=np+"Hidden",Xd in $a){tp=np;break}}void 0!==tp?($a.addEventListener(tp+"visibilitychange",Ds),Ds()):("onfocusout"in $a?($a.addEventListener("focusout",Fs),$a.addEventListener("focusin",zs)):(Ua.addEventListener("pagehide",Fs),Ua.addEventListener("blur",Fs),Ua.addEventListener("pageshow",zs),Ua.addEventListener("focus",zs)),Jd=!0);}var ip;if(qa){var rp={},sp=rc("div").style;ip=function(t){if(!rp[t]){var e=_e(t);if(void 0!==sp[t])rp[t]=e;else for(var n=Ga.length;n--;){var i="-"+Ga[n]+"-"+e;if(void 0!==sp[i]){rp[t]=i;break}}}return rp[t]};}else ip=null;var ap,op=ip,up=new RegExp("^(?:"+Ga.join("|")+")([A-Z])");if(qa){var hp,lp,cp,fp,dp,pp,mp=rc("div").style,vp=function(t){return t},gp={},yp={};void 0!==mp.transition?(hp="transition",lp="transitionend",cp=!0):void 0!==mp.webkitTransition?(hp="webkitTransition",lp="webkitTransitionEnd",cp=!0):cp=!1,hp&&(fp=hp+"Duration",dp=hp+"Property",pp=hp+"TimingFunction"),ap=function(t,e,n,i,r){setTimeout(function(){function s(){clearTimeout(d);}function a(){c&&f&&(t.unregisterCompleteHandler(s),t.ractive.fire(t.name+":end",t.node,t.isIntro),r());}function o(e){if(e.target===t.node){var n=i.indexOf(e.propertyName);-1!==n&&i.splice(n,1),i.length||(clearTimeout(d),l());}}function l(){m[dp]=v.property,m[pp]=v.duration,m[fp]=v.timing,t.node.removeEventListener(lp,o,!1),f=!0,a();}var c,f,d,p=(t.node.namespaceURI||"")+t.node.tagName,m=t.node.style,v={property:m[dp],timing:m[pp],duration:m[fp]};t.node.addEventListener(lp,o,!1),d=setTimeout(function(){i=[],l();},n.duration+(n.delay||0)+50),t.registerCompleteHandler(s),m[dp]=i.join(",");var g=Us(n.easing||"linear");m[pp]=g;var w=m[pp]===g;m[fp]=n.duration/1e3+"s",setTimeout(function(){for(var r,s,l,d,v,g=i.length,x=null,_=[];g--;){if(l=i[g],r=p+l,w&&cp&&!yp[r]){var E=m[l];m[l]=e[l],r in gp||(x=t.getStyle(l),gp[r]=t.getStyle(l)!=e[l],yp[r]=!gp[r],yp[r]&&(m[l]=E));}w&&cp&&!yp[r]||(null===x&&(x=t.getStyle(l)),s=i.indexOf(l),-1===s?y("Something very strange happened with transitions. Please raise an issue at https://github.com/ractivejs/ractive/issues - thanks!",{node:t.node}):i.splice(s,1),d=/[^\d]*$/.exec(x)[0],v=k(parseFloat(x),parseFloat(e[l])),v?_.push({name:l,interpolator:v,suffix:d}):m[l]=e[l],x=null);}if(_.length){var A;h(n.easing)?(A=t.ractive.easing[n.easing],A||(b(mo(n.easing,"easing")),A=vp)):A=u(n.easing)?n.easing:vp,new kl({duration:n.duration,easing:A,step:function(t){for(var e=_.length;e--;){var n=_[e];m[n.name]=n.interpolator(t)+n.suffix;}},complete:function(){c=!0,a();}});}else c=!0;i.length?m[dp]=i.join(","):(m[dp]="none",t.node.removeEventListener(lp,o,!1),f=!0,a());},0);},n.delay||0);};}else ap=null;var bp=ap,wp=Ua&&Ua.getComputedStyle,xp=Promise.resolve(),kp={t0:"intro-outro",t1:"intro",t2:"outro"},_p=function(t){this.owner=t.owner||t.up.owner||zn(t.up),this.element=this.owner.attributeByName?this.owner:zn(t.up),this.ractive=this.owner.ractive,this.template=t.template,this.up=t.up,this.options=t,this.onComplete=[];},Ep=_p.prototype;Ep.animateStyle=function(t,e,n){var i=this;if(4===arguments.length)throw new Error("t.animateStyle() returns a promise - use .then() instead of passing a callback");if(!Jd)return this.setStyle(t,e),xp;var r;return h(t)?(r={},r[t]=e):(r=t,n=e),new Promise(function(t){if(!n.duration)return i.setStyle(r),void t();for(var e=La(r),s=[],a=wp(i.node),o=e.length;o--;){var u=e[o],h=op(u),l=a[op(u)],c=i.node.style[h];h in i.originals||(i.originals[h]=i.node.style[h]),i.node.style[h]=r[u],i.targets[h]=i.node.style[h],i.node.style[h]=c,l!=r[u]&&(s.push(h),r[h]=r[u],i.node.style[h]=l);}return s.length?void bp(i,r,n,s,t):void t()})},Ep.bind=function(){var t=this.options,e=t.template&&t.template.v;e&&(("t0"===e||"t1"===e)&&(this.element.intro=this),("t0"===e||"t2"===e)&&(this.element.outro=this),this.eventName=kp[e]);var n=this.owner.ractive;this.name=t.name||t.template.n,t.params&&(this.params=t.params),u(this.name)?(this._fn=this.name,this.name=this._fn.name):this._fn=w("transitions",n,this.name),this._fn||b(mo(this.name,"transition"),{ractive:n}),qr(this,t.template);},Ep.getParams=function(){if(this.params)return this.params;if(this.fn){var t=Hr(this,this.template,this.up).map(function(t){return t?t.get():void 0});return this.fn.apply(this.ractive,t)}},Ep.getStyle=function(t){var e=wp(this.node);if(h(t))return e[op(t)];if(!Fa(t))throw new Error("Transition$getStyle must be passed a string, or an array of strings representing CSS properties");for(var n={},i=t.length;i--;){var r=t[i],s=e[op(r)];"0px"===s&&(s=0),n[r]=s;}return n},Ep.processParams=function(t,e){return l(t)?t={duration:t}:h(t)?t="slow"===t?{duration:600}:"fast"===t?{duration:200}:{duration:400}:t||(t={}),Ia({},e,t)},Ep.registerCompleteHandler=function(t){S(this.onComplete,t);},Ep.setStyle=function(e,n){var i=this;if(h(e)){var r=op(e);t(this.originals,r)||(this.originals[r]=this.node.style[r]),this.node.style[r]=n,this.targets[r]=this.node.style[r];}else {var s;for(s in e)t(e,s)&&i.setStyle(s,e[s]);}return this},Ep.shouldFire=function(t){if(!this.ractive.transitionsEnabled)return !1;if("intro"===t&&this.ractive.rendering&&$s("noIntro",this.ractive,!0))return !1;if("outro"===t&&this.ractive.unrendering&&$s("noOutro",this.ractive,!1))return !1;var e=this.getParams();if(!this.element.parent)return !0;if(e&&e[0]&&s(e[0])&&"nested"in e[0]){if(e[0].nested!==!1)return !0}else if($s("nestedTransitions",this.ractive)!==!1)return !0;for(var n=this.element.parent;n;){if(n[t]&&n[t].starting)return !1;n=n.parent;}return !0},Ep.start=function(){var t,e=this,n=this.node=this.element.node,i=this.originals={},r=this.targets={},s=this.getParams();if(this.complete=function(s){if(e.starting=!1,!t){if(e.onComplete.forEach(function(t){return t()}),!s&&e.isIntro)for(var a in r)n.style[a]===r[a]&&(n.style[a]=i[a]);e._manager.remove(e),t=!0;}},!this._fn)return void this.complete();var a=this._fn.apply(this.ractive,[this].concat(s));a&&a.then(this.complete);},Ep.toString=function(){return ""},Ep.unbind=function(){if(!this.element.attributes.unbinding){var t=this.options&&this.options.template&&this.options.template.v;("t0"===t||"t1"===t)&&(this.element.intro=null),("t0"===t||"t2"===t)&&(this.element.outro=null);}},Ep.unregisterCompleteHandler=function(t){V(this.onComplete,t);};var Ap=_p.prototype;Ap.destroyed=Ap.firstNode=Ap.rebound=Ap.render=Ap.unrender=Ap.update=f;var Cp,Sp,Op={};try{rc("table").innerHTML="foo";}catch(jp){Cp=!0,Sp={TABLE:['<table class="x">',"</table>"],THEAD:['<table><thead class="x">',"</thead></table>"],TBODY:['<table><tbody class="x">',"</tbody></table>"],TR:['<table><tr class="x">',"</tr></table>"],SELECT:['<select class="x">',"</select>"]};}var Np=function(t){function e(e){t.call(this,e);}t&&(e.__proto__=t);var n=e.prototype=Object.create(t&&t.prototype);return n.constructor=e,n.detach=function(){var t=ei();return this.nodes&&this.nodes.forEach(function(e){return t.appendChild(e)}),t},n.find=function(t){var e,n=this,i=this.nodes.length;for(e=0;i>e;e+=1){var r=n.nodes[e];if(1===r.nodeType){if(sc(r,t))return r;var s=r.querySelector(t);if(s)return s}}return null},n.findAll=function(t,e){var n,i=this,r=e.result,s=this.nodes.length;for(n=0;s>n;n+=1){var a=i.nodes[n];if(1===a.nodeType){sc(a,t)&&r.push(a);var o=a.querySelectorAll(t);o&&r.push.apply(r,o);}}},n.findComponent=function(){return null},n.firstNode=function(){return this.rendered&&this.nodes[0]},n.render=function(t,e,n){var i=this;if(!this.nodes){var r=this.model?this.model.get():"";this.nodes=qs(r,t);}var s=this.nodes;if(e){for(var a,o=-1;e.length&&(a=this.nodes[o+1]);)for(var u=void 0;u=e.shift();){var h=u.nodeType;if(h===a.nodeType&&(1===h&&u.outerHTML===a.outerHTML||(3===h||8===h)&&u.nodeValue===a.nodeValue)){i.nodes.splice(++o,1,u);break}t.removeChild(u);}o>=0&&(s=this.nodes.slice(o)),e.length&&(n=e[0]);}if(s.length){var l=ei();s.forEach(function(t){return l.appendChild(t)}),n?t.insertBefore(l,n):t.appendChild(l);}this.rendered=!0;},n.toString=function(){var t=this.model&&this.model.get();return t=null!=t?""+t:"",Cr()?yt(t):t},n.unrender=function(){this.nodes&&this.nodes.forEach(function(t){bl.detachWhenReady({node:t,detach:function(){ii(t);}});}),this.rendered=!1,this.nodes=null;},n.update=function(){this.rendered&&this.dirty?(this.dirty=!1,this.unrender(),this.render(this.up.findParentNode(),null,this.up.findNextNode(this))):this.dirty=!1;},e}(Sd),Tp={};Tp[tu]=Zd,Tp[Zo]=Mf,Tp[eu]=Qs,Tp[Xo]=qf,Tp[Ko]=jd,Tp[$o]=As,Tp[Do]=Zd,Tp[Lo]=Np,Tp[Yo]=As,Tp[Wo]=Ef,Tp[Nu]=Af,Tp[Ou]=Uf,Tp[Su]=xd,Tp[ju]=_p,Tp[qo]=Or;var Vp={doctype:qf,form:fd,input:Nd,option:Ld,select:Wd,textarea:Gd},Mp=function(t){this.owner=t.owner,this.isRoot=!t.owner.up,this.parent=this.isRoot?null:this.owner.up,this.ractive=t.ractive||(this.isRoot?t.owner:this.parent.ractive),this.componentParent=this.isRoot&&this.ractive.component?this.ractive.component.up:null,!this.isRoot||this.ractive.delegate?this.delegate=this.owner.containerFragment?this.owner.containerFragment&&this.owner.containerFragment.delegate:this.componentParent&&this.componentParent.delegate||this.parent&&this.parent.delegate:this.delegate=!1,this.context=null,this.rendered=!1,"cssIds"in t?this.cssIds=t.cssIds&&t.cssIds.length&&t.cssIds:this.cssIds=this.parent?this.parent.cssIds:null,this.dirty=!1,this.dirtyValue=!0,this.template=t.template||[],this.createItems();},Pp=Mp.prototype;Pp.bind=function(t){var e=this;this.context=t,this.owner.template.z&&(this.aliases=Xs(this.owner.template.z,this.owner.containerFragment||this.parent));for(var n=this.items.length,i=0;n>i;i++)e.items[i].bind();return this.bound=!0,this.dirty&&this.update(),this},Pp.bubble=function(){this.dirtyValue=!0,this.dirty||(this.dirty=!0,this.isRoot?this.ractive.component?this.ractive.component.bubble():this.bound&&bl.addFragment(this):this.owner.bubble(this.index));},Pp.createItems=function(){var t=this,e=this.template.length;this.items=[];for(var n=0;e>n;n++)t.items[n]=Ys({up:t,template:t.template[n],index:n});},Pp.destroyed=function(){for(var t=this,e=this.items.length,n=0;e>n;n++)t.items[n].destroyed();this.pathModel&&this.pathModel.destroyed(),this.rootModel&&this.rootModel.destroyed();},Pp.detach=function(){for(var t=ei(),e=this.items,n=e.length,i=0;n>i;i++)t.appendChild(e[i].detach());return t},Pp.find=function(t,e){return I(this.items,function(n){return n.find(t,e)})},Pp.findAll=function(t,e){this.items&&this.items.forEach(function(n){return n.findAll&&n.findAll(t,e)});},Pp.findComponent=function(t,e){return I(this.items,function(n){return n.findComponent(t,e)})},Pp.findAllComponents=function(t,e){this.items&&this.items.forEach(function(n){return n.findAllComponents&&n.findAllComponents(t,e)});},Pp.findContext=function(){var t=sn(this);return t&&t.context?t.context:this.ractive.viewmodel},Pp.findNextNode=function(t){var e=this;if(t)for(var n,i=t.index+1;i<this.items.length;i++)if(n=e.items[i],n&&n.firstNode){var r=n.firstNode(!0);if(r)return r}return this.isRoot?this.ractive.component?this.ractive.component.up.findNextNode(this.ractive.component):null:this.parent?this.owner.findNextNode(this):void 0},Pp.findParentNode=function(){var t=this;do{if(t.owner.type===Uo)return t.owner.node;if(t.isRoot&&!t.ractive.component)return t.ractive.el;t=t.owner.type===Yo?t.owner.containerFragment:t.componentParent||t.parent;}while(t);throw new Error("Could not find parent node")},Pp.firstNode=function(t){var e=I(this.items,function(t){return t.firstNode(!0)});return e?e:t?null:this.parent.findNextNode(this.owner)},Pp.getKey=function(){return this.keyModel||(this.keyModel=new zd(this.key))},Pp.getIndex=function(){return this.idxModel||(this.idxModel=new zd(this.index))},Pp.rebind=function(t){this.context=t,this.rootModel&&(this.rootModel.context=this.context),this.pathModel&&(this.pathModel.context=this.context);},Pp.rebound=function(t){if(this.owner.template.z){var e=this.aliases;for(var n in e)e[n].rebound?e[n].rebound(t):(e[n].unreference(),e[n]=0);Xs(this.owner.template.z,this.owner.containerFragment||this.parent,e);}this.items.forEach(function(e){return e.rebound(t)}),t&&(this.rootModel&&this.rootModel.applyValue(this.context.getKeypath(this.ractive.root)),this.pathModel&&this.pathModel.applyValue(this.context.getKeypath()));},Pp.render=function(t,e){if(this.rendered)throw new Error("Fragment is already rendered!");this.rendered=!0;for(var n=this.items,i=n.length,r=0;i>r;r++)n[r].render(t,e);},Pp.resetTemplate=function(t){var e=this.bound,n=this.rendered;if(e&&(n&&this.unrender(!0),this.unbind()),this.template=t,this.createItems(),e&&(this.bind(this.context),n)){var i=this.findParentNode(),r=this.findNextNode();if(r){var s=ei();this.render(s),i.insertBefore(s,r);}else this.render(i);}},Pp.shuffled=function(){this.items.forEach(nt),this.rootModel&&this.rootModel.applyValue(this.context.getKeypath(this.ractive.root)),this.pathModel&&this.pathModel.applyValue(this.context.getKeypath());},Pp.toString=function(t){return this.items.map(t?ut:ot).join("")},Pp.unbind=function(t){var e=this;if(this.owner.template.z&&!this.owner.yielder){for(var n in e.aliases)e.aliases[n].unreference();this.aliases={};}this.context=null;for(var i=this.items.length,r=0;i>r;r++)e.items[r].unbind(t);return this.bound=!1,this},Pp.unrender=function(t){for(var e=this,n=this.items.length,i=0;n>i;i++)e.items[i].unrender(t);this.rendered=!1;},Pp.update=function(){var t=this;if(this.dirty)if(this.updating)this.isRoot&&bl.addFragmentToRoot(this);else {this.dirty=!1,this.updating=!0;for(var e=this.items.length,n=0;e>n;n++)t.items[n].update();this.updating=!1;}},Pp.valueOf=function(){if(1===this.items.length)return this.items[0].valueOf();if(this.dirtyValue){var t={},e=Js(this.items,t,this.ractive._guid),n=ys(e,t);this.value=n?n.value:this.toString(),this.dirtyValue=!1;}return this.value},Mp.prototype.getContext=rn,Mp.prototype.getKeypath=ta;var Ip=["template","partials","components","decorators","events"],Rp=qn("reverse").path,Bp=qn("shift").path,Kp=qn("sort").path,Lp=qn("splice").path,Dp=qn("unshift").path,Fp={add:fn,
	animate:vn,attachChild:jn,compute:Mn,detach:Pn,detachChild:In,find:Rn,findAll:Bn,findAllComponents:Kn,findComponent:Ln,findContainer:Dn,findParent:Fn,fire:Yn,get:Jn,getContext:ti,insert:ai,link:ui,observe:mi,observeOnce:gi,off:yi,on:bi,once:wi,pop:Tc,push:Vc,readLink:xi,render:ra,reset:sa,resetPartial:oa,resetTemplate:ua,reverse:Rp,set:ha,shift:Bp,sort:Kp,splice:Lp,subtract:la,teardown:jr,toggle:ca,toCSS:fa,toCss:fa,toHTML:da,toHtml:da,toText:pa,transition:ma,unlink:va,unrender:ga,unshift:Dp,update:Zn,updateModel:ya,use:ba},zp=[],Up=/super\s*\(|\.call\s*\(\s*this/;if(Ka(Ma,{sharedGet:{value:Ca},sharedSet:{value:Aa},styleGet:{configurable:!0,value:xa.bind(Ma)},styleSet:{configurable:!0,value:Mi.bind(Ma)},addCSS:{configurable:!1,value:ka.bind(Ma)},hasCSS:{configurable:!1,value:Ea.bind(Ma)}}),Ua&&!Ua.Ractive){var $p="",qp=document.currentScript||document.querySelector("script[data-ractive-options]");qp&&($p=qp.getAttribute("data-ractive-options")||""),~$p.indexOf("ForceGlobal")&&(Ua.Ractive=Ma);}else Ua&&v("Ractive already appears to be loaded while loading 1.3.14.");return Ia(Ma.prototype,Fp,oo),Ma.prototype.constructor=Ma,Ma.defaults=Ma.prototype,il.defaults=Ma.defaults,il.Ractive=Ma,Ka(Ma,{DEBUG:{writable:!0,value:!0},DEBUG_PROMISES:{writable:!0,value:!0},extend:{value:Oa},extendWith:{value:ja},escapeKey:{value:_},evalObjectString:{value:ys},findPlugin:{value:Va},getContext:{value:Xn},getCSS:{value:Ei},isInstance:{value:wa},joinKeys:{value:ci},macro:{value:Ta},normaliseKeypath:{value:E},parse:{value:Ie},splitKeypath:{value:fi},unescapeKey:{value:C},use:{value:Sa},enhance:{writable:!0,value:!1},svg:{value:Wa},tick:{get:function(){return yl&&yl.promise}},VERSION:{value:"1.3.14"},adaptors:{writable:!0,value:{}},components:{writable:!0,value:{}},decorators:{writable:!0,value:{}},easing:{writable:!0,value:uo},events:{writable:!0,value:{}},extensions:{value:[]},helpers:{writable:!0,value:oo.helpers},interpolators:{writable:!0,value:vo},partials:{writable:!0,value:{}},transitions:{writable:!0,value:{}},cssData:{configurable:!0,value:{}},sharedData:{value:Sl},Ractive:{value:Ma},Context:{value:Tl.Context.prototype}}),Ba(Ma,"_cssModel",{configurable:!0,value:new Gc(Ma)}),Ba(Ma.prototype,"rendered",{get:function(){return this.fragment&&this.fragment.rendered}}),Ma});

	!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):(t="undefined"!=typeof globalThis?globalThis:t||self).$=e();}(window,(function(){let t;const e=(...e)=>t(...e);e.superMethod=e=>{t=e;};const n=Object,r=n.keys,s=n.is,o=n.assign,c=n.getOwnPropertyDescriptor,i=n.defineProperty,a=n.getOwnPropertyNames,l=t=>r(t).length;o(e,{assign:o,defineProperty:i,getOwnPropertyDescriptor:c,getOwnPropertyNames:a,is:s,keys:r,objectSize:l});const u=Array.from;o(e,{toArray:u});const p=Reflect.apply;o(e,{apply:p});const d=function(t){return void 0===t},h=t=>null===t,g=t=>!d(t)&&!h(t),m=t=>e=>!!g(e)&&e.constructor===t,f=/\.|\+/,y=Array.isArray,b=m(String),w=m(Number),A=t=>!!g(t)&&"Object("===t.constructor.toString().trim().slice(9,16),v=t=>!!g(t)&&t instanceof Function,O=t=>Boolean(t.length),S=t=>e=>!!g(e)&&t.test(e),j=S(/\.css$/),C=S(/\.json$/),E=S(/\.js$/),F=S(/\.html$/),k=S(/\./),x=/\.([0-9a-z]+)/,M=t=>"Boolean"===t.constructor.name;o(e,{getFileExtension:t=>{const e=t.match(x);if(e)return e[1]},has:(t,...e)=>t.includes(...e),hasDot:k,hasLength:O,hasValue:g,isArray:y,isBoolean:M,isDate:t=>t instanceof Date,isDecimal:t=>f.test(t.toString()),isEmpty:t=>b(t)||y(t)?!O(t):A(t)?!l(t):!g(t),isFileCSS:j,isFileHTML:F,isFileJS:E,isFileJSON:C,isFunction:v,isNull:h,isNumber:w,isPlainObject:A,isRegExp:t=>t instanceof RegExp,isString:b,isUndefined:d});const R=(t,e)=>{const n=t.length;for(let r=0;r<n;r++)e(t[r],r,t,n);return t},$=(t,e)=>{const n=t.length;for(let r=n-1;r>=0;r--)e(t[r],r,t,n);return t},I=(t,e)=>{const n=t.length;for(let r=0;r<n;r++)if(!1===e(t[r],r,t,n))return !1;return !0},N=(t,e,n=[])=>(R(t,((t,r,s,o)=>{!0===e(t,r,n,s,o)&&n.push(t);})),n),D=(L=R,(t,e,n=[])=>(L(t,((t,r,s,o)=>{n[r]=e(t,r,n,s,o);})),n));var L;const T=(t,e,n=[])=>(R(t,((t,r,s,o)=>{const c=e(t,r,n,s,o);g(c)&&n.push(c);})),n);o(e,{compactMapArray:T,eachArray:R,eachArrayRight:$,filterArray:N,mapArray:D,mapArrayRight:(t,e,n=[])=>{let r=0;const s=t.length;for(let o=s-1;o>=0;o--)n[r]=e(t[o],o,t,s),r++;return n},mapWhile:(t,e,n=[])=>{const r=t.length;for(let s=0;s<r;s++){const o=e(t[s],s,n,t,r);if(!1===o)break;n[s]=o;}return n},whileArray:I});const B=t=>`[object ${t}]`,U=t=>e=>!!g(e)&&e.toString()===t;R(["Arguments","Map","Set","WeakMap"],(t=>{e[`is${t}`]=U(B(t));}));R(["ArrayBuffer","Float32Array","Float64Array","Int8Array","Int16Array","Int32Array","Uint8Array","Uint8ClampedArray","Uint16Array","Uint32Array"],(t=>{e[`is${t}`]=e=>!!g(e)&&e.constructor.name===t;}));o(e,{asyncEach:async(t,e)=>{const n=t.length;for(let r=0;r<n;r++){const s=t[r];await s(e,r,t,n);}return t}});const q=t=>y(t)?t:[t];o(e,{ensureArray:q});const P=t=>t.flat(1/0);o(e,{flatten:(t,e=1)=>{let n=t;for(let t=0;t<e;t++)n=n.reduce(((t,e)=>t.concat(q(e))),[]);return n},flattenDeep:P});o(e,{remove:(t,e)=>{let n=t.length;for(let r=0;r<n;r++){const s=t[r];e.includes(s)&&(t.splice(r,1),r--,n--);}return t},removeBy:(t,e)=>{let n=t.length;for(let r=0;r<n;r++){e(t[r],r)&&(t.splice(r,1),r--,n--);}return t}});o(e,{chunk:(t,e=1)=>{const n=[];let r=0;return t.forEach(((t,s)=>{s%e||(n.push([]),s&&r++),n[r].push(t);})),n}});o(e,{rest:t=>t.slice(1,t.length)});const z=t=>(t.length=0,t);o(e,{clear:z});o(e,{right:(t,e)=>t[t.length-1-e]});o(e,{cloneArray:t=>t.slice()});const W=Math,H=W.floor,K=W.random,_=(t,e=0)=>H(K()*(t-e))+e;o(e,{add:(t,e)=>t+e,deduct:t=>t-1,divide:(t,e)=>t/e,increment:t=>t+1,minus:(t,e)=>t-e,multiply:(t,e)=>t*e,randomArbitrary:(t,e=0)=>K()*(t-e)+e,randomInt:_,remainder:(t,e)=>t%e});const Z=(t,e=t.length)=>{if(t.length<=1)return u(t);const n=u(t);let r,s,o=0;for(;o<e;)r=_(n.length-1,0),s=n[o],n[o]=n[r],n[r]=s,o++;return n};o(e,{shuffle:Z});o(e,{sample:(t,e=1)=>{if(!t)return !1;const n=t.length;if(n===e||e>n)return Z(t);if(1===e)return [t[_(n-1,0)]];const r=[],s={};let o,c=0;for(;c<e;)o=_(t.length-1,0),s[o]||(r.push(t[o]),s[o]=!0,c++);return r}});o(e,{compact:t=>t.filter((t=>!(b(t)&&!t.length)&&t))});o(e,{initial:t=>t.slice(0,t.length-1)});const J=Math.min;o(e,{smallest:t=>J(...t)});o(e,{range:(t,e,n=1)=>t<e?((t,e,n)=>{const r=[];let s=t;for(;s<e;)r.push(s),s+=n;return r})(t,e,n):((t,e,n)=>{const r=n<0?-1*n:n,s=[];let o=t;for(;o>e;)s.push(o),o-=r;return s})(t,e,n)});o(e,{intersect:(t,...e)=>T(t,(t=>{if(I(e,(e=>e.includes(t))))return t}))});o(e,{difference:(t,...e)=>{const n=P(e);return T(t,(t=>{if(!n.includes(t))return t}))}});const V=(t,e,n=t.length)=>t.splice(e,n);o(e,{drop:V,dropRight:(t,e,n=t.length)=>V(t,0,n-e)});const G=(t,e)=>t.length===e.length&&I(t,((t,n)=>e[n]===t));o(e,{isMatchArray:G});o(e,{sortedIndex:(t,e)=>{let n=0;return I(t,((t,r)=>(n=r,e>t))),n}});const Q=Math.max;o(e,{largest:t=>Q(...t)});o(e,{sum:t=>t.reduce(((t,e)=>t+e),0)});const X=async(t,e)=>{const n=t.length;for(let r=0;r<n;r++)await e(t[r],r,t,n);return t},Y=async(t,e)=>{const n=t.length;for(let r=n-1;r>=0;r--)await e(t[r],r,t,n);return t};o(e,{eachAsync:X,eachAsyncRight:Y});o(e,{last:(t,e)=>{const n=t.length;return e?t.slice(n-e,n):t[n-1]}});o(e,{take:(t,e=1)=>t.slice(0,e),takeRight:(t,e=1)=>{const n=t.length;return t.slice(n-e,n)}});const tt=async(t,e)=>{const n=[];return await X(t,(async(t,r,s)=>{n[r]=await e(t,r,s);})),n};o(e,{mapAsync:tt});const et=(t,e,n)=>n.indexOf(t)===e,nt=(t,e,n)=>t!==n[e-1],rt=(t,e)=>e?t.filter(nt):t.filter(et);o(e,{unique:rt});o(e,{union:(...t)=>rt(P(t))});o(e,{compactMapAsync:async(t,e)=>{const n=[];let r;return await X(t,(async(t,s,o)=>{r=await e(t,s,n,o),g(r)&&n.push(r);})),n}});const st=(t,e)=>t-e;o(e,{numSort:t=>t.sort(st)});o(e,{arrayToObject:(t,e)=>{const n={};return R(t,((t,r)=>{n[e[r]]=t;})),n}});o(e,{without:(t,e)=>t.filter((t=>!e.includes(t)))});o(e,{partition:(t,e)=>{const n=[];return [T(t,(t=>{if(e(t))return t;n.push(t);})),n]}});o(e,{xor:(...t)=>{const e=[];return R(t,(t=>{R(rt(t),(t=>{e.includes(t)?e.splice(e.indexOf(t),1):e.push(t);}));})),e}});o(e,{unZip:t=>t[0].map(((e,n)=>t.map((t=>t[n])))),zip:(...t)=>t[0].map(((e,n)=>t.map((t=>t[n]))))});o(e,{first:(t,e)=>e?t.slice(0,e):t[0]});const ot=(t,e)=>e-t;o(e,{rNumSort:t=>t.sort(ot)});const ct=(t,e,n)=>{const r=n?t:0,s=n?e:t,o=n||e;for(let t=r;t<s;t++)o(t,r,s);};o(e,{times:ct,timesMap:(t,e,n,r=[])=>{const s=n?t:0,o=n?e:t,c=n||e;let i;return ct(s,o,(t=>{i=c(t,s,o,r),g(i)&&r.push(i);})),r}});const it=(t,e)=>{const n=r(t);R(n,((r,s,o,c)=>{e(t[r],r,t,c,n);}));},at=(t,e)=>{const n=r(t);return I(n,((n,r,s,o)=>e(t[n],n,t,o,s)))},lt=(t,e,n={})=>(it(t,((t,r,s,o,c)=>{!0===e(t,r,n,s,o,c)&&(n[r]=t);})),n),ut=(t,e,n={})=>(it(t,((t,r,s,o,c)=>{n[r]=e(t,r,n,s,o,c);})),n),pt=(t,e,n={})=>(it(t,((t,r,s,o,c)=>{const i=e(t,r,n,o,c);g(i)&&(n[r]=i);})),n);o(e,{compactMapObject:pt,eachObject:it,filterObject:lt,mapObject:ut,whileObject:at});const dt=t=>t?dt[t]:r(dt),ht=navigator.userAgentData;if(ht&&(it(ht,((t,e)=>{M(t)&&t&&(dt[e]=t);})),R(ht.brands,(t=>{dt[t.brand]=t.version;}))),navigator.userAgent){let t=navigator.userAgent.toLowerCase();t=t.replace(/_/g,"."),t=t.replace(/[#_,;()]/g,"");const e=t.split(/ |\//);R(e,(t=>{dt[t]=!0;}));}o(e,{isAgent:dt});const gt=(t,...e)=>(t.addEventListener(...e),t);o(e,{eventAdd:gt,eventRemove:(t,...e)=>(t.removeEventListener(...e),t)});o(e,{isEnter:t=>13===t.keyCode}),document.createDocumentFragment.bind(document);const mt=(t,e)=>{const n={};return R(t,((t,r)=>{n[t]=e[r];})),n};o(e,{unZipObject:t=>{const e=[],n=[];return it(t,((t,r)=>{e.push(r),n.push(t);})),[e,n]},zipObject:mt});const ft=(t,e)=>y(e)?mt(e,D(e,(e=>t.getAttribute(e)))):(it(e,((e,n)=>{t.setAttribute(n,e);})),t);o(e,{nodeAttribute:ft});const yt=t=>new Promise(t);o(e,{promise:yt});const bt=(t,e=1)=>t.substr(e);o(e,{chunkString:(t,e)=>t.match(new RegExp(`(.|[\r\n]){1,${e}}`,"g")),initialString:(t,e=1)=>t.slice(0,-1*e),insertInRange:(t,e,n)=>t.slice(0,e)+n+t.slice(e,t.length),restString:bt,rightString:(t,e=1)=>t[t.length-e]});const wt=/^.[\w_-]+$/,At=/^[A-Za-z]+$/,vt=/\s/,Ot=document.getElementsByClassName.bind(document),St=document.getElementsByTagName.bind(document),jt=document.getElementById.bind(document),Ct=document.querySelector.bind(document),Et=document.querySelectorAll.bind(document);o(e,{getByClass:Ot,getById:jt,getByTag:St,querySelector:Ct,querySelectorAll:Et,selector:t=>{switch(t[0]){case"#":if(!vt.test(t))return jt(bt(t));break;case".":if(wt.test(t))return Ot(bt(t));break;default:if(At.test(t))return St(t)}return Et(t)}});const Ft=document.createElement.bind(document),kt=t=>(t=>yt(((e,n)=>{var r,s;gt(t,"load",e,!0),gt(t,"error",n,!0),r=Ct("head"),s=t,r.appendChild(s);})))(ft(Ft("script"),{async:"",src:`${t}.js`}));o(e,{importjs:kt});const xt=t=>{const e=document.readyState;return "interactive"===e||"completed"===e||"complete"===e?!t||t():(t&&gt(document,"DOMContentLoaded",t),!1)};o(e,{isDocumentReady:xt}),xt((()=>{kt("/index");}));const Mt=location.protocol,Rt="http:"===Mt?"ws":"wss",$t=location.hostname,It={hardware:{cores:navigator.hardwareConcurrency},host:{name:$t,protocol:Mt,protocolSocket:Rt}};o(e,{info:It});const Nt=()=>{o(It,{bodyHeight:document.body.offsetHeight,bodyWidth:document.body.offsetWidth,windowHeight:window.innerHeight,windowWidth:window.innerWidth});},Dt=()=>{requestAnimationFrame(Nt);};xt(Dt),gt(window,"load",Dt,!0),gt(window,"resize",Dt,!0),o(e,{saveDimensions:Nt,updateDimensions:Dt});const Lt=(t,...e)=>{if(v(t))return t(...e)};let Tt;o(e,{ifInvoke:Lt});const Bt=[],Ut=()=>{R(Bt,Lt),z(Bt),Tt=!1;};o(e,{batch:(...t)=>{Bt.push(...t),Tt||(Tt=requestAnimationFrame(Ut));}});const qt=JSON,Pt=qt.parse,zt=qt.stringify;o(e,{jsonParse:Pt,stringify:zt});const Wt=(t,e)=>`color:${t};background:${e};`,Ht={alert:Wt("#fff","#f44336"),important:Wt("#fff","#E91E63"),notify:Wt("#fff","#651FFF"),warning:Wt("#000","#FFEA00")};o(e,{cnsl:(t,e)=>{const n=b(t)?t:zt(t);console.log(`%c${n}`,`${Ht[e]}font-size:13px;padding:2px 5px;border-radius:2px;`);},cnslTheme:(t,e,n)=>{Ht[t]=Wt(e,n);}});e.isDom=t=>t&&9!==t.nodeType,R(["HTMLCollection","NodeList"],(t=>{e[`is${t}`]=U(B(t));}));const Kt=(t,e,n=!0)=>(n?t:[...t]).sort(((t,n)=>n[e]?t[e]?t[e]<n[e]?1:t[e]>n[e]?-1:0:1:-1));o(e,{getNewest:(t,e)=>Kt(t,e,!1)[0],sortNewest:Kt});const _t=(t,e="id",n=!0)=>(n?t:[...t]).sort(((t,n)=>n[e]?t[e]?t[e]<n[e]?-1:t[e]>n[e]?1:0:-1:1));o(e,{getOldest:(t,e="id")=>_t(t,e)[0],sortOldest:_t});o(e,{groupBy:(t,e)=>{const n={};return R(t,(t=>{const r=e(t);n[r]||(n[r]=[]),n[r].push(t);})),n}});o(e,{countBy:(t,e)=>{const n={};let r;return R(t,(t=>{r=e(t),n[r]||(n[r]=0),n[r]++;})),n},countKey:(t,e)=>{let n=0;return R(t,(t=>{t[e]&&n++;})),n},countWithoutKey:(t,e)=>{let n=0;return R(t,(t=>{t[e]||n++;})),n}});o(e,{indexBy:(t,e="id")=>{const n={};return R(t,(t=>{n[t[e]]=t;})),n}});o(e,{pluck:(t,e)=>D(t,(t=>t[e]))});const Zt=(t,e)=>D(e,(e=>t[e]));o(e,{pluckObject:Zt});o(e,{pluckValues:(t,e)=>D(t,(t=>Zt(t,e)))});o(e,{invoke:(t,e,n)=>D(t,((t,r)=>t[e](n,r)))});o(e,{invokeAsync:(t,e,n)=>tt(t,(async(t,r)=>t[e](n,r)))});const Jt=(t,e,n,r,s)=>{if(t[s]===r)return !0};o(e,{findIndex:(t,e,n="id")=>{const r=t.findIndex(((t,r)=>Jt(t,0,0,e,n)));return -1!==r&&r},findItem:(t,e,n="id")=>{const r=t.find(((t,r)=>Jt(t,0,0,e,n)));return -1!==r&&r}});o(e,{sortAlphabetical:(t,e)=>t.sort(((t,n)=>{const r=t[e],s=n[e];return r<s?-1:r>s?1:0}))});o(e,{ary:(t,e)=>(...n)=>t(...n.splice(0,e))});o(e,{curry:(t,e=t.length)=>{const n=[],r=(...s)=>{if(n.push(...s),n.length===e){const e=t(...n);return z(n),e}return r};return r},curryRight:(t,e=t.length)=>{const n=[],r=(...s)=>{if(n.unshift(...s),n.length===e){const e=t(...n);return z(n),e}return r};return r}});o(e,{after:(t,e)=>{let n,r=t;return (...t)=>(null!==r&&r--,r<=0&&(n=e(...t),r=null),n)},before:(t,e)=>{let n,r=t;return (...t)=>(null!==r&&r--,r>=1?n=e(...t):r=null,n)},once:t=>{let e;return (...n)=>(g(e)||(e=t(...n)),e)}});o(e,{noop:()=>{},stubArray:()=>[],stubFalse:()=>!1,stubObject:()=>({}),stubString:()=>"",stubTrue:()=>!0});const Vt=(t,e)=>t.forEach(e),Gt=(t,e)=>(n,r,s)=>{let o;if(g(n))return o=y(n)?t:A(n)||v(n)?e:n.forEach?Vt:e,o(n,r,s)},Qt=Gt(I,at),Xt=Gt(R,it),Yt=Gt(N,lt),te=Gt(D,ut),ee=Gt(T,pt);o(e,{compactMap:ee,each:Xt,eachWhile:Qt,filter:Yt,map:te});o(e,{bindAll:(t,e)=>te(t,(t=>v(t)?t.bind(e):t))});o(e,{negate:t=>(...e)=>!t(...e)});o(e,{every:Qt});o(e,{over:t=>(...e)=>te(t,(t=>t(...e))),overEvery:t=>(...e)=>Qt(t,(t=>t(...e)))});const ne=(t,e)=>setTimeout(t,e),re=(t,e)=>setInterval(t,e),se=(t,e)=>()=>{ct(0,t((()=>{}),0),(t=>{e(t);}));},oe=se(ne,clearTimeout),ce=se(re,clearInterval);o(e,{clearIntervals:ce,clearTimers:oe,debounce:(t,e)=>{let n=!1;const r=(...r)=>{!1!==n&&clearTimeout(n),n=ne((()=>{t(...r),n=!1;}),e);};return r.clear=()=>{n&&(clearTimeout(n),n=!1);},r},interval:re,throttle:(t,e)=>{let n,r=!1;const s=(...s)=>{r?n=!0:(t(...s),r=ne((()=>{n&&t(...s),r=!1;}),e));};return s.clear=()=>{clearTimeout(r),r=!1;},s},timer:ne});o(e,{chain:t=>{const e=t=>(e.value=t,e.methods);return o(e,{add:t=>((t,e)=>(Xt(e,((e,n)=>{t.methods[n]=(...n)=>(e(t.value,...n),t.methods);})),t))(e,t),done(){const t=e.value;return e.value=null,t},methods:{}}),e.add(t),e}});o(e,{inAsync:async(t,e)=>X(t,(async t=>{await t(e);})),inSync:(t,e)=>Xt(t,(t=>{t(e);}))});o(e,{nthArg:(t=0)=>(...e)=>e[t]});o(e,{reArg:(t,e)=>(...n)=>t(...e.map((t=>n[t])))});o(e,{wrap:(t,e)=>(...n)=>e(t,...n)});o(e,{isNumberEqual:(t,e)=>t===e,isNumberInRange:(t,e,n)=>t>e&&t<n,isZero:t=>0===t});const ie=(t,e)=>{const n=r(t);return I(e,(t=>n.includes(t)))};o(e,{hasAnyKeys:(t,e)=>{const n=r(t);return Boolean(e.find((t=>n.includes(t))))},hasKeys:ie});o(e,{pick:(t,e,n={})=>(R(e,(e=>{n[e]=t[e];})),n)});o(e,{compactKeys:t=>{const e=[];return it(t,((t,n)=>{t&&e.push(n);})),e}});o(e,{isMatchObject:(t,e)=>{const n=r(t);return !!G(n,r(e))&&I(n,(n=>t[n]===e[n]))}});o(e,{invert:(t,e={})=>(it(t,((t,n)=>{e[t]=n;})),e)});o(e,{omit:(t,e)=>lt(t,((t,n)=>!e.includes(n)))});const ae=async(t,e)=>{const n=r(t);return await X(n,((r,s,o,c)=>e(t[r],r,t,c,n))),t};o(e,{eachObjectAsync:ae});o(e,{compactMapObjectAsync:async(t,e,n={})=>(await ae(t,(async(t,r,s,o,c)=>{const i=await e(t,r,n,o,c);g(i)&&(n[r]=i);})),n),mapObjectAsync:async(t,e,n={})=>(await ae(t,(async(t,r,s,o,c)=>{n[r]=await e(t,r,n,s,o,c);})),n)});const le=/[-_]/g,ue=/ (.)/g;o(e,{camelCase:t=>t.toLowerCase().replace(ue,(t=>t.toUpperCase().replace(/ /g,""))),kebabCase:t=>t.replace(le," ").trim().toLowerCase().replace(ue,"-$1"),snakeCase:t=>t.replace(le," ").trim().toLowerCase().replace(ue,"_$1"),upperCase:t=>t.replace(le," ").trim().toUpperCase()});o(e,{replaceList:(t,e,n)=>t.replace(new RegExp("\\b"+e.join("|")+"\\b","gi"),n)});const pe=/%(?![\da-f]{2})/gi,de=/&/g,he=/</g,ge=/>/g,me=/"/g,fe=t=>decodeURIComponent(t.replace(pe,(()=>"%25"))),ye=t=>t.replace(de,"&amp;").replace(he,"&lt;").replace(ge,"&gt;").replace(me,"&quot;");o(e,{htmlEntities:ye,rawURLDecode:fe,sanitize:t=>ye(fe(t))});const be=/\S+/g,we=/\w+/g;o(e,{tokenize:t=>t.match(be)||[],words:t=>t.match(we)||[]});o(e,{truncate:(t,e)=>{const n=t.length;return n>e?((t,e,n)=>{const r=t.split(""),s=r.length;let o,c=n-e;for(;c<s&&c>=0&&(o=r[c]," "!==o);c--);return t.slice(0,c).trim()})(t,e,n):t},truncateRight:(t,e)=>{const n=t.length;return n>e?((t,e,n)=>{const r=t.split(""),s=r.length;let o,c=e;for(;c<s&&c>0&&(o=r[c]," "!==o);c++);return t.substr(c,n).trim()})(t,e,n):t}});const Ae=/ (.)/g,ve=t=>t[0].toUpperCase(),Oe=t=>ve(t)+bt(t).toLowerCase();o(e,{upperFirst:t=>ve(t)+bt(t),upperFirstAll:t=>t.replace(Ae,(t=>t.toUpperCase())),upperFirstLetter:ve,upperFirstOnly:Oe,upperFirstOnlyAll:t=>Oe(t.toLowerCase()).replace(Ae,(t=>t.toUpperCase()))});const Se=(t,e,n=!0)=>(Xt(e,((e,r)=>{A(e)&&A(t[r])?Se(t[r],e,n):n&&y(e)&&y(t[r])?t[r].push(...e):t[r]=e;})),t);o(e,{assignDeep:Se});const je=Function.prototype;o(e,{cacheNativeMethod:function(t){return je.call.bind(t)}});o(e,{ifNotEqual:(t,e,n)=>(e&&!g(t[e])&&(t[e]=n),t)});const Ce=(t,e)=>{if(t===e)return !0;if(t.toString()===e.toString())if(A(t)){const n=r(t);if(ie(e,n))return I(n,(n=>Ce(t[n],e[n])))}else if(y(t)&&t.length===e.length)return I(t,((t,n)=>Ce(t,e[n])));return !1};o(e,{isEqual:Ce});o(e,{propertyMatch:(t,e,n=r(t))=>I(n,(n=>Ce(t[n],e[n])))});const Ee=/\.|\[/,Fe=/]/g,ke=t=>t.replace(Fe,"").split(Ee);o(e,{toPath:ke});let xe=0;const Me=[],Re={},$e=()=>{let t=Me.shift(Me);return g(t)||(t=xe,Re[t]=!0,xe++),t};$e.free=t=>{Re[t]=null,Me.push(t);},o(e,{uid:$e});const Ie=(t,n=e)=>{let r=n;return I(ke(t),(t=>(r=r[t],g(r)))),r};o(e,{get:Ie});const Ne=(t,e)=>(g(e)&&(Ne[t]=e),Ie(t,Ne));e.superMethod(Ne),o(e,{model:Ne});o(e,{toggle:(t,e,n)=>Ce(e,t)?n:e});const De=t=>(...e)=>n=>{let r=n;return t(e,(t=>{r=t(r);})),r},Le=De(R),Te=De($);o(e,{flow:Le,flowRight:Te});const Be=t=>(...e)=>async n=>{let r=n;return await t(e,(async t=>{r=await t(r);})),r},Ue=Be(X),qe=Be(Y);return o(e,{flowAsync:Ue,flowAsyncRight:qe}),e}));

	(function() {
		const app = {
			events: {},
			start(data) {
				return app.workerRequest('configure', data);
			},
			log: console.log,
			security: {
				clear() {
					app.log('Cleanup');
					app.crate.clear();
				}
			},
			utility: window.$
		};
		window.app = app;
		const vStorage = {
			hasLocal: false,
			items: {},
			getItem(key) {
				return vStorage.items[key];
			},
			setItem(key, value) {
				vStorage.items[key] = value;
				return;
			},
			clear() {
				vStorage.storage.items = {};
				return;
			},
			removeItem(key) {
				vStorage.items[key] = null;
				return;
			}
		};
		function hasStorage(storeCheck) {
			try {
				storeCheck().removeItem('TESTING');
				vStorage.hasLocal = true;
			} catch (e) {
				console.log(e);
				vStorage.hasLocal = false;
			}
		}
		hasStorage(() => {
			return localStorage;
		});
		class Crate {
			constructor() {
				this.storage = vStorage.hasLocal ? localStorage : vStorage;
			}
			setItem(key, value) {
				return this.storage.setItem(key, value);
			}
			getItem(key) {
				return this.storage.getItem(key);
			}
			clear() {
				return this.storage.clear();
			}
			removeItem(key) {
				return this.storage.removeItem(key);
			}
		}
		app.crate = new Crate();
		const isEventNodeMethod = (componentEvent) => {
			if (!componentEvent || !componentEvent.original || !componentEvent.original.target) {
				return false;
			}
			return componentEvent.node === componentEvent.original.target;
		};
		app.isEventNode = isEventNodeMethod;
		const {
			last: last$2, first
		} = app.utility;
		const isLang = new RegExp(/^language\//);
		const languagePath = (filePath) => {
			let filePathCompiled = filePath;
			if (!isLang.test(filePathCompiled)) {
				if (first(filePathCompiled) !== '/') {
					filePathCompiled = `/${filePathCompiled}`;
				}
				filePathCompiled = `language${filePathCompiled}`;
			}
			if (last$2(filePathCompiled) !== '/') {
				filePathCompiled = `${filePathCompiled}/`;
			}
			return `${filePathCompiled}${app.systemLanguage}.json`;
		};
		app.languagePath = languagePath;
		const {
			utility: {
				hasValue: hasValue$4, promise: promise$1, uid, isString: isString$7
			}
		} = app;
		const mainWorker = new Worker('/worker.js');
		const workerRequest = async (requestName, dataArg) => {
			let compiledRequest;
			let callback;
			if (dataArg) {
				compiledRequest = {
					data: dataArg,
					request: requestName
				};
			} else {
				compiledRequest = requestName;
				callback = requestName.callback;
			}
			const requestObject = {
				data: compiledRequest.data,
				request: compiledRequest.request
			};
			if (requestObject.data.id) {
				return mainWorker.postMessage(requestObject);
			}
			return promise$1((accept) => {
				const uniq = uid();
				app.events[uniq] = callback ?
					function(dataCallback) {
						accept(dataCallback);
						callback(dataCallback);
					} :
					accept;
				requestObject.id = uniq;
				mainWorker.postMessage(requestObject);
			});
		};
		const workerMessage = (workerEvent) => {
			const eventData = workerEvent.data;
			const {
				id, data
			} = eventData;
			let generatedId = id;
			if (!hasValue$4(generatedId)) {
				generatedId = '_';
			}
			if (!app.events[generatedId]) {
				console.log(id, generatedId);
			}
			app.events[generatedId](data);
			if (!eventData.keep && !isString$7(generatedId)) {
				app.events[generatedId] = null;
				uid.free(generatedId);
			}
		};
		mainWorker.onmessage = (workerEvent) => {
			return workerMessage(workerEvent);
		};
		app.workerRequest = workerRequest;
		const {
			assign: assign$9, querySelector: querySelector$2, map: map$2, hasValue: hasValue$3, isString: isString$6
		} = app.utility;
		const {
			crate: crate$2
		} = app;
		const imported = {};
		const headNode$1 = querySelector$2('head');
		const styleNode = document.createElement('style');
		const loadScript = window.eval;
		const iJson = (contents) => {
			if (contents) {
				return loadScript(`(${contents})`);
			}
			return {};
		};
		const isLibRegex = new RegExp(/^js\/lib\//);
		const checksumReturn = (item) => {
			return crate$2.getItem(`cs-${item}`);
		};
		const constructStyleTagThenAppendToHead = (text, filePath) => {
			const node = styleNode.cloneNode(false);
			node.textContent = text;
			node.setAttribute('data-src', filePath);
			headNode$1.appendChild(node);
			return node;
		};
		/*
		When all the required items have been downloaded
		*/
		const getLoadedAssets = (item) => {
			return imported[item];
		};
		const getCompleted = async (config) => {
			const {
				callback, data
			} = config;
			const assetCollection = map$2(data, getLoadedAssets);
			callback(...assetCollection);
		};
		const checkIfCompleted = (config) => {
			if (!config.done && config.filesLoaded === config.fileCount) {
				config.done = true;
				getCompleted(config);
			}
		};
		const saveCompleted = async (json, config) => {
			const {
				file, cs, key, isJs, isJson, isCss, dirname
			} = json;
			const {
				appendCSS, data
			} = config;
			const filename = data[key];
			let fileContents = file;
			let skipCheck;
			if (fileContents === true) {
				if (!imported[filename]) {
					fileContents = crate$2.getItem(filename);
				}
			} else if (fileContents !== false) {
				if (app.debug) {
					console.log('SAVE FILE TO LOCAL', fileContents);
				}
				crate$2.setItem(`cs-${filename}`, cs);
				crate$2.setItem(filename, fileContents);
			}
			if (!hasValue$3(imported[filename]) || fileContents !== true) {
				if (!isJs) {
					if (fileContents === false) {
						imported[filename] = {};
					} else {
						imported[filename] = isJson ? iJson(fileContents) : fileContents;
					}
				} else if (fileContents) {
					if (isLibRegex.test(filename)) {
						loadScript(fileContents);
						imported[filename] = true;
					} else {
						if (imported[filename]) {
							config.filesLoaded++;
							return checkIfCompleted(config);
						}
						skipCheck = true;
						const moduleExports = {
							dirname: `${dirname}/`,
							name: filename
						};
						await loadScript(fileContents)(moduleExports);
						config.filesLoaded++;
						imported[filename] = moduleExports;
						return checkIfCompleted(config);
					}
				}
			}
			if (isCss && appendCSS && isString$6(imported[filename])) {
				constructStyleTagThenAppendToHead(imported[filename], filename);
				imported[filename] = true;
			}
			if (!skipCheck) {
				config.filesLoaded++;
				return checkIfCompleted(config);
			}
		};
		const fetchFile = async (config) => {
			const configData = config.data;
			config.filesLoaded = 0;
			config.fileCount = config.data.length;
			await workerRequest({
				async callback(json) {
					if (hasValue$3(json.file)) {
						await saveCompleted(json, config);
					} else {
						return checkIfCompleted(config);
					}
				},
				data: {
					data: {
						cs: map$2(configData, checksumReturn),
						files: configData
					}
				},
				request: 'socket.get'
			});
		};
		assign$9(app, {
			fetchFile
		});
		const {
			assign: assign$8
		} = app.utility;
		const request = async (requestName, config) => {
			const requestPackage = config ?
				{
					data: config,
					request: requestName
				} :
				requestName;
			const workerPackage = {
				data: {
					data: requestPackage,
					name: 'api'
				},
				request: 'socket.request'
			};
			if (requestPackage.id) {
				workerPackage.data.id = requestPackage.id;
				return workerRequest(workerPackage);
			}
			const json = await workerRequest(workerPackage);
			return json;
		};
		assign$8(app, {
			request
		});
		const {
			utility: {
				assign: assign$7,
				cnsl: cnsl$3,
				compactMapArray,
				isEmpty: isEmpty$1,
				eachAsync,
				eachObject,
				eachArray,
				isString: isString$5,
				isPlainObject: isPlainObject$2,
				hasValue: hasValue$2,
				drop
			}
		} = app;
		cnsl$3('Initilizing watchers module.', 'notify');
		const watchers = {};
		const watchersRegex = [];
		const onRegex = (type, callable) => {
			const watchObject = {};
			callable.regex = type;
			let number = watchersRegex.push(callable) - 1;
			assign$7(watchObject, {
				_: {
					isWatcher: true
				},
				callable,
				start() {
					if (!hasValue$2(number)) {
						number = watchersRegex.push(callable) - 1;
					}
				},
				stop() {
					if (hasValue$2(number)) {
						drop(watchersRegex, number);
						number = null;
					}
				}
			});
			return watchObject;
		};
		const onString = (type, callable) => {
			const watchObject = {};
			if (!watchers[type]) {
				watchers[type] = [];
			}
			const levelObject = watchers[type];
			let number = levelObject.push(callable) - 1;
			assign$7(watchObject, {
				_: {
					isWatcher: true
				},
				callable,
				start() {
					if (!hasValue$2(number)) {
						number = levelObject.push(callable) - 1;
					}
				},
				stop() {
					if (hasValue$2(number)) {
						drop(levelObject, number);
						number = null;
					}
				}
			});
			return watchObject;
		};
		const onCollection = (object, settings) => {
			const watching = [];
			const prefix = settings.prefix ? `${settings.prefix}.` : '';
			const suffix = settings.suffix ? `.${settings.suffix}` : '';
			const watchCollection = {
				_: {
					isWatcher: true
				},
				start() {
					eachArray(watching, (item) => {
						item.start();
					});
				},
				stop() {
					eachArray(watching, (item) => {
						item.stop();
					});
				},
				watching
			};
			eachObject(object, (item, key) => {
				watching.push(onString(`${prefix}${key}${suffix}`, item));
			});
			return watchCollection;
		};
		const watch$3 = (type, callable) => {
			let method;
			if (isString$5(type)) {
				method = onString;
			} else if (isPlainObject$2(type)) {
				method = onCollection;
			} else {
				method = onRegex;
			}
			return method(type, callable);
		};
		watch$3.status = true;
		watch$3.start = () => {
			watch$3.status = true;
		};
		watch$3.stop = () => {
			watch$3.status = null;
		};
		const onUpdate = async (json) => {
			if (!watch$3.status || !json) {
				return;
			}
			const type = json.type;
			const subscribers = [];
			const levelObject = watchers[type] || watchers[json.name];
			const regexSubscribers = compactMapArray(watchersRegex, (item) => {
				if (item.regex.test(type)) {
					return item;
				}
			});
			if (!isEmpty$1(regexSubscribers)) {
				subscribers.push(...regexSubscribers);
			}
			if (levelObject) {
				subscribers.push(...levelObject);
			}
			console.log(subscribers);
			if (subscribers.length) {
				eachAsync(subscribers, (watcher) => {
					return watcher(json, watcher);
				});
			}
		};
		const push = (requestName, data) => {
			return request({
				data,
				id: '_',
				request: requestName
			});
		};
		assign$7(app.events, {
			_(json) {
				return onUpdate(json.data);
			}
		});
		assign$7(app, {
			push,
			watch: watch$3,
			watchers
		});
		const {
			utility: {
				assign: assign$6,
				hasDot,
				promise,
				last: last$1,
				map: map$1,
				isString: isString$4,
				isPlainObject: isPlainObject$1,
				each: each$9,
				cnsl: cnsl$2,
				initialString,
				restString
			},
			crate: crate$1
		} = app;
		const commaString = ',';
		const buildFilePath = (itemArg) => {
			let item = itemArg;
			if (!hasDot(item)) {
				if (initialString(item, -9) === 'language/') {
					item = languagePath(item);
				} else if (last$1(item) === '/') {
					item += 'index.js';
				} else if (initialString(item, -3) === 'js/') {
					item += '.js';
				} else if (initialString(item, -4) === 'css/') {
					item += '.css';
				}
				if (app.debug) {
					console.log(item);
				}
			}
			if (restString(item, -3) === '.js') {
				if (app.debug) {
					console.log(item, watch$3);
				}
				if (!watchers[item]) {
					watch$3(item, (thing) => {
						if (app.debug) {
							console.log('Live Reload', thing);
						}
						crate$1.removeItem(thing.name);
						crate$1.removeItem(`cs-${thing.name}`);
					});
				}
			}
			return item;
		};
		const singleDemand = (items) => {
			return items[0];
		};
		const objectDemand = (items, arrayToObjectMap) => {
			return map$1(arrayToObjectMap, (item) => {
				return items[item];
			});
		};
		const multiDemand = (items) => {
			return items;
		};
		const streamAssets = (data, options) => {
			return promise((accept) => {
				fetchFile(
					assign$6(
						{
							callback(...args) {
								accept(args);
							},
							data
						},
						options
					)
				);
			});
		};
		const demand$4 = async (filesArg, options) => {
			const assets = [];
			let demandType;
			let arrayToObjectMap;
			let files = filesArg;
			if (isPlainObject$1(files)) {
				demandType = objectDemand;
				arrayToObjectMap = {};
				let index = 0;
				each$9(files, (item, key) => {
					arrayToObjectMap[key] = index;
					index++;
					assets.push(buildFilePath(item));
				});
			} else {
				files = isString$4(files) ? files.split(commaString) : files;
				demandType = files.length < 2 ? singleDemand : multiDemand;
				each$9(files, (item) => {
					assets.push(buildFilePath(item));
				});
			}
			const results = await streamAssets(assets, options);
			return demandType(results, arrayToObjectMap);
		};
		const demandTypeMethod = (type, optionsFunction) => {
			return function(filesArg, options) {
				let files = filesArg;
				if (isString$4(files)) {
					files = files.split(commaString);
				}
				if (optionsFunction) {
					optionsFunction(options);
				}
				files = map$1(files, (itemArg) => {
					let item = itemArg;
					if (type === 'js' && last$1(item) === '/') {
						item += 'index';
					}
					return `${item}.${type}`;
				});
				return demand$4(files, options);
			};
		};
		const demandCss$1 = demandTypeMethod('css', (appendCSS) => {
			return {
				appendCSS
			};
		});
		const demandJs$1 = demandTypeMethod('js');
		const demandHtml$1 = demandTypeMethod('html');
		const demandLang = (fileList) => {
			const files = isString$4(fileList) ? fileList.split(commaString) : fileList;
			return demand$4(map$1(files, languagePath));
		};
		assign$6(app.events, {
			async setupCompleted(data) {
				cnsl$2('Worker is Ready', 'notify');
				app.systemLanguage = data.language;
				try {
					await demand$4('app/');
				} catch (error) {
					console.log(error);
					crate$1.clear();
					window.location.reload();
				}
			}
		});
		assign$6(app, {
			demand: demand$4,
			demandCss: demandCss$1,
			demandHtml: demandHtml$1,
			demandJs: demandJs$1,
			demandLang
		});
		const spawnNotification = (data) => {};
		app.notify = async (data) => {
			if (Notification.permission === 'granted') {
				return spawnNotification();
			} else if (Notification.permission !== 'denied') {
				await Notification.requestPermission();
			}
		};
		const {
			utility: {
				debounce, eventAdd: eventAdd$1, isAgent, info, model, assign: assign$5
			}
		} = app;
		app.updateResize = async () => {
			await Ractive.sharedSet(info);
			const width = info.windowWidth;
			let widthLevel = 0;
			let screenSize;
			if (width < 640) {
				screenSize = 'miniScreen';
			} else if (width < 740) {
				screenSize = 'tinyScreen';
				widthLevel = 1;
			} else if (width < 1024) {
				screenSize = 'smallScreen';
				widthLevel = 2;
			} else if (width < 1920) {
				screenSize = 'mediumScreen';
				widthLevel = 3;
			} else if (width < 3000) {
				screenSize = 'hdScreen';
				widthLevel = 4;
			} else if (width > 3000) {
				screenSize = '4kScreen';
				widthLevel = 5;
			}
			console.log(screenSize);
			await Ractive.sharedSet(
				assign$5(Ractive.sharedGet(), {
					tinyScreen: false,
					smallScreen: false,
					mediumScreen: false,
					hdScreen: false,
					'4kScreen': false
				})
			);
			await Ractive.sharedSet('screenSize', screenSize);
			await Ractive.sharedSet(screenSize, true);
			await Ractive.sharedSet('widthLevel', widthLevel);
		};
		const updateResize = debounce(app.updateResize, 250);
		function calculateScreen() {
			requestAnimationFrame(updateResize);
		}
		eventAdd$1(
			window,
			'resize',
			() => {
				calculateScreen();
			},
			true
		);
		const smoothScroll = (element, to, duration) => {
			if (duration <= 0) {
				return;
			}
			const difference = to - element.scrollTop;
			const perTick = (difference / duration) * 10;
			requestAnimationFrame(() => {
				element.scrollTop = element.scrollTop + perTick;
				if (element.scrollTop === to) {
					return;
				}
				smoothScroll(element, to, duration - 10);
			});
		};
		const mobileCheck = () => {
			let check = false;
			const a = navigator.userAgent || navigator.vendor || window.opera;
			if (
				(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i).test(
					a
				) ||
	      (/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw(n|u)|c55\/|capi|ccwa|cdm|cell|chtm|cldc|cmd|co(mp|nd)|craw|da(it|ll|ng)|dbte|dcs|devi|dica|dmob|do(c|p)o|ds(12|d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(|_)|g1 u|g560|gene|gf5|gmo|go(\.w|od)|gr(ad|un)|haie|hcit|hd(m|p|t)|hei|hi(pt|ta)|hp( i|ip)|hsc|ht(c(| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i(20|go|ma)|i230|iac( ||\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|[a-w])|libw|lynx|m1w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|mcr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|([1-8]|c))|phil|pire|pl(ay|uc)|pn2|po(ck|rt|se)|prox|psio|ptg|qaa|qc(07|12|21|32|60|[2-7]|i)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h|oo|p)|sdk\/|se(c(|0|1)|47|mc|nd|ri)|sgh|shar|sie(|m)|sk0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h|v|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl|tdg|tel(i|m)|tim|tmo|to(pl|sh)|ts(70|m|m3|m5)|tx9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas|your|zeto|zte/i).test(
	      	a.substr(0, 4)
	      )
			) {
				check = true;
			}
			return check;
		};
		const tabletCheck = () => {
			return (/(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/).test(
				navigator.userAgent.toLowerCase()
			);
		};
		app.initializeScreen = async () => {
			const isMobile = mobileCheck();
			const isTablet = tabletCheck();
			if (isMobile) {
				await Ractive.sharedSet('classes.mobile', true);
				await Ractive.sharedSet('mobile', true);
			}
			if (isTablet) {
				await Ractive.sharedSet('classes.tablet', true);
				await Ractive.sharedSet('tablet', true);
			}
			if (!isMobile && !isTablet) {
				await Ractive.sharedSet('classes.desktop', true);
				await Ractive.sharedSet('desktop', true);
			}
			await Ractive.sharedSet('classes.chrome', isAgent.chrome);
			await Ractive.sharedSet('classes.android', isAgent.android);
			await Ractive.sharedSet('classes.linux', isAgent.linux);
			await Ractive.sharedSet('classes.mozilla', isAgent.mozilla);
			await Ractive.sharedSet('classes.applewebkit', isAgent.applewebkit);
			await app.updateResize();
		};
		model('smoothScroll', smoothScroll);
		window.Ractive.prototype.data = {
			$: app.utility,
			getComponent(partialName) {
				const componentName = partialName;
				const partial = `<${partialName} />`;
				console.log(componentName);
				const partialsCheck = Boolean(this.partials[partialName]);
				if (!partialsCheck) {
					this.partials[partialName] = partial;
				}
				return partialName;
			},
			makePartial(id, template) {
				const key = `partial-${id}`;
				const partialsCheck = Boolean(this.partials[id]);
				if (partialsCheck) {
					return key;
				}
				this.partials[key] = template;
				return key;
			}
		};
		const {
			utility: {
				findIndex,
				hasValue: hasValue$1,
				get: get$1,
				isPlainObject,
				findItem,
				assignDeep: assignDeep$1,
				ensureArray: ensureArray$1,
				assign: assign$4,
				each: each$8,
				isArray: isArray$1,
				isEmpty,
				sortNewest,
				sortOldest,
				clear
			}
		} = app;
		const extendRactive = {
			async afterIndex(path, indexMatch, item, indexName) {
				const index = findIndex(this.get(path), indexMatch, indexName);
				if (hasValue$1(index)) {
					await this.splice(path, index + 1, 0, ...ensureArray$1(item));
				} else {
					await this.push(path, item);
				}
			},
			async assign(path, mergeObject) {
				const item = this.get(path);
				if (hasValue$1(item)) {
					assignDeep$1(item, mergeObject);
					await this.update(path);
					return item;
				}
			},
			async beforeIndex(path, indexMatch, item, indexName) {
				const index = findIndex(this.get(path), indexMatch, indexName);
				if (hasValue$1(index)) {
					await this.splice(path, index - 1, 0, ...ensureArray$1(item));
				} else {
					await this.push(path, item);
				}
			},
			async clearArray(path) {
				const arrayToClear = this.get(path);
				if (arrayToClear) {
					clear(arrayToClear);
					await this.update(path);
				}
			},
			findItem(path, indexMatch, indexName) {
				const item = find(this.get(path), indexMatch, indexName);
				if (hasValue$1(item)) {
					return item;
				}
			},
			getIndex(path, indexMatch, indexName) {
				const index = findIndex(this.get(path), indexMatch, indexName);
				if (hasValue$1(index)) {
					return index;
				}
			},
			async mergeItem(path, indexMatch, newVal, indexName) {
				const item = findItem(this.get(path), indexMatch, indexName);
				if (hasValue$1(item)) {
					assignDeep$1(item, newVal);
					await this.update(path);
					return item;
				}
			},
			async removeIndex(path, indexMatch, indexName) {
				const index = findIndex(this.get(path), indexMatch, indexName);
				if (hasValue$1(index)) {
					await this.splice(path, index, 1);
				}
			},
			async setIndex(path, indexMatch, item, indexName, optionsArg) {
				const options = optionsArg || {};
				const index = findIndex(this.get(path), indexMatch, indexName);
				if (hasValue$1(index)) {
					const pathSuffix = options.pathSuffix ? `.${options.pathSuffix}` : '';
					await this.set(`${path}.${index}${pathSuffix}`, item);
				} else if (get$1('conflict', options) === 'insert') {
					await this[get$1('conflictMethod', options) || 'push'](path, item);
				}
			},
			async sortNewest(path, property) {
				const array = this.get(path);
				sortNewest(array, property, true);
				await this.update(path);
			},
			async sortOldest(path, property) {
				const array = this.get(path);
				sortOldest(array, property, true);
				await this.update(path);
			},
			async syncCollection(path, newValArg, type = 'push', indexName = 'id') {
				const oldVal = this.get(path);
				if (isPlainObject(oldVal)) {
					assignDeep$1(oldVal, newValArg);
				} else {
					const newVal = ensureArray$1(newValArg);
					each$8(newVal, (item) => {
						const oldValItem = findItem(oldVal, item[indexName], indexName);
						if (hasValue$1(oldValItem)) {
							assign$4(oldValItem, item);
						} else {
							oldVal[type](item);
						}
					});
				}
				await this.update(path);
			},
			async toggleIndex(path, indexMatchArg, pathSuffixArg, indexName) {
				let indexMatch;
				const arrayCheck = isArray$1(indexMatchArg);
				if (arrayCheck && !isEmpty(indexMatchArg)) {
					indexMatch = indexMatchArg.shift();
				} else {
					indexMatch = indexMatchArg;
				}
				const index = findIndex(this.get(path), indexMatch, indexName);
				if (hasValue$1(index)) {
					const pathSuffix = pathSuffixArg ? `.${pathSuffixArg}` : '';
					await this.toggle(`${path}.${index}${pathSuffix}`);
				}
				if (arrayCheck && !isEmpty(indexMatchArg)) {
					await this.toggleIndex(path, indexMatchArg, pathSuffixArg, indexName);
				}
			},
			async updateItem(path, indexMatch, react, indexName) {
				const item = findItem(this.get(path), indexMatch, indexName);
				if (hasValue$1(item)) {
					react(item);
					await this.update(path);
					return item;
				}
			}
		};
		assign$4(Ractive.prototype, extendRactive);
		const getComponentName = (componentModel, componentName) => {
			return componentModel === app.router.currentStateObject ? 'navState' : componentName;
		};
		const {
			watch: watch$2,
			demand: demand$3,
			utility: {
				each: each$7, isFunction: isFunction$1
			},
			crate
		} = app;
		const onHtml = async (matchFilename, componentName, json) => {
			const type = json.type;
			const filePath = json.name;
			if (app.debug) {
				console.log('WATCH HTML', matchFilename, json);
			}
			if (!filePath.includes(matchFilename)) {
				return;
			}
			const html = await demand$3(filePath);
			crate.setItem(filePath, html);
			if (app.debug) {
				console.log(type, filePath, html);
			}
			if (isFunction$1(componentName)) {
				componentName(html);
			} else {
				each$7(app.view.findAllComponents(componentName), (item) => {
					if (app.debug) {
						console.log(item);
					}
					item.resetTemplate(html);
				});
			}
			window.UIkit.update(document.body, 'update');
		};
		const watchHtml = (matchFilename, componentName) => {
			if (app.debug) {
				console.log('WATCH HTML', matchFilename);
			}
			return watch$2(matchFilename, (json) => {
				onHtml(matchFilename, componentName, json);
			});
		};
		watch$2.html = watchHtml;
		const {
			utility: {
				each: each$6
			}
		} = app;
		const importPartials = (componentName, componentModel, asset) => {
			if (asset.partials) {
				each$6(asset.partials, (item, key) => {
					watchHtml(item.includes('.html') ? item : `${item}.html`, (html) => {
						const realName = getComponentName(componentModel, componentName);
						each$6(app.view.findAllComponents(realName), (subItem) => {
							subItem.resetPartial(key, html);
						});
					});
				});
			}
		};
		const importTemplate = (componentName, componentModel, asset) => {
			let template = asset.template;
			if (!template.includes('.html') && !template.includes('.hbs') && !template.includes('.mustache')) {
				template = asset.template = asset.template = `${template}.html`;
			}
			if (template) {
				watchHtml(template, (html) => {
					const realName = getComponentName(componentModel, componentName);
					if (realName) {
						const matchedComponent = app.view.findComponent(realName);
						if (matchedComponent) {
							matchedComponent.resetTemplate(html);
						}
					}
				});
			}
		};
		const {
			utility: {
				each: each$5, isString: isString$3, isArray, apply: apply$1
			}
		} = app;
		const logMulti = console;
		function debugMultiEvent(...args) {
			if (app.debug || app.debugMultiEvent) {
				apply$1(logMulti.log, logMulti, args);
			}
		}
		const multiEvent = (currentView, componentEvent, events, ...args) => {
			debugMultiEvent(currentView, componentEvent, events);
			debugMultiEvent(args);
			if (componentEvent && events.length) {
				const {
					original
				} = componentEvent;
				original.preventDefault();
				original.stopPropagation();
			}
			if (events) {
				if (isString$3(events)) {
					each$5(events.split(','), (subItem) => {
						if (subItem) {
							currentView.fire(subItem.trim(), componentEvent, ...args);
						}
					});
				} else if (isArray(events)) {
					each$5(events, (item) => {
						if (item) {
							each$5(item.split(','), (subItem) => {
								if (subItem) {
									currentView.fire(subItem.trim(), componentEvent, ...args);
								}
							});
						}
					});
				}
			}
		};
		const {
			utility: {
				each: each$4, assign: assign$3, querySelector: querySelector$1
			}
		} = app;
		const headNode = querySelector$1('head');
		const importedCssCount = {};
		const importedCss = {};
		const render = (code, filePath) => {
			if (importedCss[filePath]) {
				importedCssCount[filePath]++;
			} else {
				importedCssCount[filePath] = 0;
				const node = document.createElement('style');
				node.innerHTML = code;
				node.setAttribute('data-src', filePath);
				headNode.appendChild(node);
				importedCss[filePath] = node;
			}
		};
		const unrender = (code, filePath) => {
			if (importedCss[filePath]) {
				importedCssCount[filePath]--;
				if (importedCssCount[filePath] < 0) {
					importedCss[filePath].remove();
					importedCss[filePath] = null;
					importedCssCount[filePath] = null;
				}
			}
		};
		const cssRender = (css) => {
			if (css) {
				each$4(css, render);
			}
		};
		const cssUnrender = (css) => {
			if (css) {
				each$4(css, unrender);
			}
		};
		const componentsWithCss = {};
		const registerCssComponent = (css, componentConfig) => {
			if (!css) {
				return;
			}
			each$4(css, (item, key) => {
				if (!componentsWithCss[key]) {
					componentsWithCss[key] = [];
				}
				componentsWithCss[key].push(componentConfig);
			});
		};
		assign$3(app, {
			componentsWithCss,
			importedCss,
			importedCssCount
		});
		const {
			watch: watch$1,
			utility: {
				each: each$3, get, apply
			}
		} = app;
		const createWatchers = (currentView, item, key) => {
			if (get('isWatcher', item._)) {
				currentView.watchers[key] = item;
				return;
			}
			item.options = item.options || {};
			item.methods = item.methods || {};
			let {
				prefix, suffix
			} = item.options;
			const {
				methods
			} = item;
			const createMethod = methods.create || 'push';
			const readMethod = methods.read || 'push';
			prefix = prefix ? `${prefix}.` : '';
			suffix = suffix ? `.${suffix}` : '';
			item.prefix = prefix;
			item.suffix = suffix;
			currentView.watchers[key] = watch$1(
				{
					async create(json) {
						await currentView.syncCollection(key, json.item, createMethod);
						currentView.fire(`${prefix}create${suffix}`, json.item, json);
					},
					async delete(json) {
						await currentView.removeIndex(key, json.item.id);
						currentView.fire(`${prefix}delete${suffix}`, json.item, json);
					},
					async read(json) {
						await currentView.syncCollection(key, json.items, readMethod);
						currentView.fire(`${prefix}read${suffix}`, json.item, json);
					},
					async update(json) {
						await currentView.syncCollection(key, json.item, createMethod);
						currentView.fire(`${prefix}update${suffix}`, json.item, json);
					}
				},
				item.options
			);
		};
		const removeInstance = function(currentView, css) {
			cssUnrender(css);
			each$3(currentView.watchers, (item, key) => {
				item.stop();
				item[key] = null;
			});
		};
		const onrenderInstance = function(currentView, css) {
			cssRender(css);
			if (currentView.watchers) {
				each$3(currentView.watchers, (item) => {
					item.start();
				});
			}
		};
		const buildComponentEvents = function(componentConfig) {
			const {
				css, watchers
			} = componentConfig;
			const thisComponent = this;
			thisComponent.watchers = watchers ? watchers(thisComponent) : {};
			if (thisComponent.watchers) {
				each$3(thisComponent.watchers, (item, key) => {
					createWatchers(thisComponent, item, key);
				});
			}
			thisComponent.on({
				multi(cmpntEvent, ...args) {
					if (app.debug) {
						console.log(cmpntEvent, ...args);
					}
					return multiEvent(this, cmpntEvent, ...args);
				},
				render() {
					return onrenderInstance(this, css);
				},
				teardown() {
					return removeInstance(this, css);
				}
			});
		};
		const onConstruct = function(componentConfig) {
			const sourceConstruct = componentConfig.onconstruct;
			componentConfig.onconstruct = function(...args) {
				apply(buildComponentEvents, this, [componentConfig, ...args]);
				if (sourceConstruct) {
					return apply(sourceConstruct, this, args);
				}
			};
			const sourceRender = componentConfig.onrender;
			componentConfig.onrender = function(...args) {
				if (sourceRender) {
					return apply(sourceRender, this, args);
				}
			};
		};
		const {
			utility: {
				cnsl: cnsl$1, assign: assign$2
			}
		} = app;
		cnsl$1('viewSetup Module', 'notify');
		const initializeComponent = (componentConfig) => {
			componentConfig.decorators = assign$2(componentConfig.decorators || {}, {});
			const {
				css, model: componentModel, asset, name: componentName
			} = componentConfig;
			registerCssComponent(css, componentConfig);
			if (asset && (componentName || componentModel)) {
				importTemplate(componentName, componentModel, asset);
				importPartials(componentName, componentModel, asset);
			}
			onConstruct(componentConfig);
		};
		const {
			utility: {
				omit
			}
		} = app;
		const buildComponent = (componentConfig) => {
			initializeComponent(componentConfig);
			const {
				name: componentName, model
			} = componentConfig;
			const cmpntConfigClean = omit(componentConfig, ['css', 'asset']);
			if (componentConfig.CSS) {
				cmpntConfigClean.css = componentConfig.CSS;
			}
			const Component = Ractive.extend(cmpntConfigClean);
			if (componentName) {
				Ractive.components[componentName] = Component;
			}
			if (model) {
				model.component = Component;
			}
			return Component;
		};
		const {
			demand: demand$2,
			demandCss,
			demandHtml,
			utility: {
				assign: assign$1, each: each$2, ensureArray, isString: isString$2
			}
		} = app;
		const asyncComponent = async function(componentConfig) {
			const componentModel = componentConfig.model;
			let asset = componentConfig.asset || {};
			if (isString$2(asset)) {
				asset = {
					css: [`${asset}style`],
					template: `${asset}template`
				};
			}
			componentConfig.asset = asset;
			componentConfig.css = componentConfig.css || {};
			componentConfig.partials = componentConfig.partials || {};
			if (asset) {
				if (asset.template) {
					componentConfig.template = await demandHtml(asset.template);
				}
				if (asset.demand) {
					componentConfig.demand = await demand$2(asset.demand);
				}
				if (asset.partials) {
					assign$1(componentConfig.partials, await demandHtml(asset.partials));
				}
				if (asset.css) {
					const assetCss = asset.css;
					const loadCss = await demandCss(assetCss);
					each$2(ensureArray(loadCss), (item, index) => {
						let keyName = assetCss[index];
						if (!keyName.includes('.css')) {
							keyName = `${keyName}.css`;
						}
						componentConfig.css[keyName] = item;
					});
				}
			}
			const componentPromise = buildComponent(componentConfig);
			if (componentModel) {
				componentModel.component = componentPromise;
			}
			return componentPromise;
		};
		const {
			utility: {
				isString: isString$1
			}
		} = app;
		const components = {};
		const generateComponent = (ComponentView, config) => {
			return new ComponentView(config);
		};
		const getComponent = (componentName, config) => {
			const componentObject = components[componentName];
			return config ? generateComponent(componentObject, config) : componentObject;
		};
		const component$1 = (componentName, componentConfigOption) => {
			let method;
			const componentConfig = componentConfigOption ? componentConfigOption : componentName;
			if (isString$1(componentName)) {
				componentConfig.name = componentName;
			}
			console.log(componentConfig);
			if (componentConfig.asset) {
				method = asyncComponent;
			} else {
				method = buildComponent;
			}
			return method(componentConfig);
		};
		app.component = component$1;
		app.getComponent = getComponent;
		const {
			demand: demand$1,
			watch,
			utility: {
				each: each$1, querySelector, isDom
			}
		} = app;
		const onCss = async (json) => {
			const filePath = json.name;
			const componentName = json.type;
			const componentsUsingCss = componentsWithCss[filePath];
			console.log('CSS UPDATE', filePath, componentsUsingCss);
			const node = importedCss[filePath] || importedCss[componentName] || querySelector(`[data-src="${filePath}"]`);
			if (node || componentsUsingCss) {
				const content = await demand$1(filePath);
				if (isDom(node)) {
					node.innerHTML = content;
				}
				if (componentsUsingCss) {
					each$1(componentsUsingCss, (item) => {
						console.log(item);
						item.css[filePath] = content;
					});
				}
			}
		};
		watch(/\.css/, onCss);
		const {
			demand,
			utility: {
				assign, each, isFunction
			}
		} = app;
		const view = new Ractive({
			data() {
				return {
					notification: [],
					screenSize: ''
				};
			},
			template: `{{#@shared.components.main:key}}{{>getComponent(key)}}{{/}}`
		});
		view.on({
			async '*.loadComponent'(componentEvent) {
				const imported = await demand(componentEvent.get('demand'));
				const afterDemand = componentEvent.get('afterDemand');
				if (afterDemand) {
					const afterDemandEvents = afterDemand[componentEvent.original.type];
					each(afterDemandEvents, (item, key) => {
						if (isFunction(item)) {
							item(imported, item, key);
						} else {
							app.view.findComponent(key).fire(item);
						}
					});
				}
			},
			'*.preventDefault'(context) {
				const {
					original
				} = context;
				original.preventDefault();
				original.stopPropagation();
			}
		});
		app.importComponent = async (componentName, importURL, type = 'dynamic') => {
			if (importURL) {
				await demand(importURL);
			}
			await view.set(`@shared.components.${type}.${componentName}`, true);
			await view.update('@shared.components.${type}');
		};
		app.title = new Ractive({
			target: 'head',
			append: true,
			data() {
				return {};
			},
			template: `<title>{{@shared.pageTitle}}</title>`
		});
		assign(app, {
			async render() {
				await Ractive.sharedSet('components', {
					dynamic: {},
					layout: {},
					main: {}
				});
				await app.initializeScreen();
				await view.render('body');
			},
			view
		});
		const {
			demandJs,
			utility: {
				cnsl, assignDeep, mapArray, map, isString, rest, camelCase, eventAdd, isRegExp, mapWhile, ifInvoke, hasValue, last
			},
			component
		} = app;
		cnsl('ROUTER ONLINE', 'important');
		class Router {
			constructor() {
				return this;
			}
	    debug = false;
	    hostname = location.hostname;
	    pathname = location.pathname;
	    navHistory = [];
	    historyIndex = 0;
	    routes = [];
	    methods = {};
	    defaults = {
	    	protected: false,
	    	role: false
	    };
	    state;
	    log(...args) {
	    	if (this.debug || app.debug) {
	    		console.log(...args);
	    	}
	    }
	    popstate(popstateEvent) {
	    	app.router.log('popstate', popstateEvent);
	    	popstateEvent.preventDefault();
	    	app.router.process();
	    }
	    pushState(url) {
	    	history.pushState({}, url, url);
	    	app.router.process();
	    }
	    installRoute(routeModel) {
	    	app.router.log('Install Route', routeModel);
	    	const {
	    		match
	    	} = routeModel;
	    	if (match) {
	    		routeModel.regex = isRegExp(match) ? match : new RegExp(match);
	    	}
	    	return app.router.routes.push(routeModel);
	    }
	    add(item) {
	    	this.log('add routes', item);
	    	return mapArray(item, this.installRoute);
	    }
	    async setup(options) {
	    	this.log('setup router');
	    	this.add(options.routes);
	    	this.log('assign options');
	    	assignDeep(this, options);
	    	this.log('eventAdd popstate');
	    	eventAdd(window, 'popstate', this.popstate, true);
	    	await this.process();
	    }
	    async updateLocation() {
	    	map(location, (item, index) => {
	    		if (isString(item)) {
	    			this[index] = item;
	    		}
	    	});
	    	this.pathScored = this.pathname.replace(/\//g, '_');
	    	this.paths = rest(this.pathname.split('/'));
	    	this.pathCamel = camelCase(this.paths.join('_'));
	    	this.navHistory.push(this.pathname);
	    	this.historyIndex++;
	    }
	    async compilePath() {
	    	const {
	    		route, secured, role, path
	    	} = this.pathState;
	    	this.log(this.pathState);
	    	if (route) {
	    		this.pathState.path = route();
	    	} else if (!path) {
	    		this.pathState.path = this.pathname;
	    	}
	    	if (last(this.pathState.path) !== '/') {
	    		this.pathState.path = `${this.pathState.path}/`;
	    	}
	    	if (this.pathState.path[0] !== '/') {
	    		this.pathState.path = `/${this.pathState.path}`;
	    	}
	    	this.log(this.pathState.path);
	    	if (secured) {
	    		const securityCheck = Boolean(await this.methods.security(this.match));
	    		if (securityCheck) {
	    			const success = await this.methods.success();
	    			if (role) {
	    				this.pathState.path = `${this.pathState.path}${success}/`;
	    			}
	    		} else {
	    			this.pathState.path = `/${await this.methods.fail()}/`;
	    		}
	    	}
	    	this.pathState.path = `/${this.defaults.root}${this.pathState.path}index`;
	    }
	    checkMatch(routeObject) {
	    	const check = routeObject.regex.test(app.router.pathname);
	    	if (check) {
	    		app.router.routeState = routeObject;
	    	}
	    	app.router.log(check, app.router.pathname, routeObject.regex);
	    	return !check;
	    }
	    async close() {
	    	const currentComponent = this.component;
	    	if (currentComponent) {
	    		console.log('Close Component', this, currentComponent);
	    		await app.view.findComponent('navstate').teardown();
	    	}
	    }
	    async process() {
	    	app.view.fire('router.loading');
	    	this.log('Router Loading State');
	    	this.updateLocation();
	    	this.log(this.routes);
	    	mapWhile(this.routes, this.checkMatch);
	    	const match = app.router.routeState;
	    	this.log('Match found', match);
	    	if (match) {
	    		await this.close();
	    		const {
	    			path, route
	    		} = match;
	    		const secured = hasValue(match.secured) ? match.secured : this.defaults.secured;
	    		const role = hasValue(match.role) ? match.role : this.defaults.role;
	    		const pathState = {
	    			match,
	    			secured,
	    			role,
	    			path,
	    			route
	    		};
	    		this.pathState = pathState;
	    		this.match = match;
	    		await this.compilePath();
	    		await Ractive.sharedSet('currentPath', this.pathname);
	    		await Ractive.sharedSet('navState', false);
	    		this.log('Checking if Model Loaded', match.model);
	    		if (match.assets) {
	    			if (match.assets.scripts) {
	    				await demandJs(match.assets.scripts);
	    			}
	    		}
	    		this.log('match model', pathState.path);
	    		const stateModel = await demandJs(pathState.path);
	    		this.log(stateModel);
	    		const initializeComponent = await component(stateModel.component);
	    		this.log('component made', initializeComponent);
	    		Ractive.components.navstate = initializeComponent;
	    		ifInvoke(stateModel.open);
	    		ifInvoke(this.methods.onLoad);
	    		await Ractive.sharedSet('navState', true);
	    	} else {
	    		return false;
	    	}
	    	this.log('Finished processing');
	    }
	    back() {
	    	this.log('Router back State');
	    	const navHistory = this.navHistory;
	    	if (navHistory.length) {
	    		router.historyIndex--;
	    		window.history.back();
	    	}
	    }
	    forward() {
	    	this.log('Router forward State');
	    	const navHistory = this.navHistory;
	    	if (navHistory.length > this.historyIndex) {
	    		router.historyIndex++;
	    		window.history.forward();
	    	}
	    }
		}
		app.router = new Router();
		app.view.on({
			'*.routerBack'() {
				app.router.back();
			},
			'*.routerForward'() {
				app.router.forward();
			},
			'*.route'(componentEvent) {
				const {
					original, node
				} = componentEvent;
				const url = componentEvent.get('href') || node.getAttribute('href') || node.getAttribute('data-href');
				original.preventDefault();
				app.router.log(componentEvent, url);
				app.router.pushState(url);
				return false;
			}
		});
	})();

})();