function t(t) {
	return t.finished;
} function e(t) {
	return t.offsetWidth;
} async function n(n) {
	e(n); const r = n.getAnimations(); r.length && await Promise.allSettled(r.map(t));
} function r(t, e) {
	const n = e.width ? t.width / e.width : 1; const r = e.height ? t.height / e.height : 1; return `translate(${t.left - e.left}px, ${t.top - e.top}px) scale(${n}, ${r})`;
} function s(t, e, n = {}) {
	const s = !0 === n.reverse; const i = !0 === globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches; const o = t.getBoundingClientRect(); let l; let c; return i ? (l = {
		opacity: 0,
	}, c = {
		opacity: 1,
	}) : (t.style.transformOrigin = 'top left', l = {
		transform: r(e, o),
		opacity: 0,
	}, c = {
		transform: 'none',
		opacity: 1,
	}, null != n.radiusFrom && null != n.radiusTo && (l.borderRadius = n.radiusFrom, c.borderRadius = n.radiusTo)), t.animate(s ? [c, l] : [l, c], {
		duration: i ? 120 : n.duration ?? 380,
		easing: n.easing ?? 'cubic-bezier(0.34, 1.3, 0.64, 1)',
		fill: 'both',
	});
} const i = Object.freeze({
	__proto__: null,
	async animateIn(t) {
		const r = t?.target ?? this; const s = t?.className ?? 'is-entering'; e(r), r.classList.add(s), await n(r), r.classList.remove(s);
	},
	async animateOut(t) {
		const r = t?.target ?? this; const s = t?.className ?? 'is-exiting'; e(r), r.classList.add(s), await n(r);
	},
	flipMorph: s,
	async leave(t) {
		await this.animateOut(t), this.remove();
	},
}); function o(t) {
	return null !== t && 'object' == typeof t;
} function l(t) {
	if ('object' != typeof t || null === t) {
		return !1;
	} const e = Object.getPrototypeOf(t); return e === Object.prototype || null === e;
} function c(t) {
	return 'string' == typeof t;
} function a(t) {
	return 'function' == typeof t;
} function u(t) {
	return 'symbol' == typeof t;
} function h(t) {
	return t instanceof Element;
} function d(t) {
	return t instanceof ShadowRoot;
} function f(t) {
	return null !== t && 'object' == typeof t && a(t.then);
} function p(t) {
	return t instanceof Error;
} function m(t) {
	return void 0 === t;
} function g(t) {
	return 'undefined' === t;
} function y(t) {
	return null === t;
} function b(t) {
	return Boolean(m(t) || y(t));
} function v(t) {
	return !b(t);
} function w(t) {
	return Array.isArray(t);
} function E(t) {
	return t instanceof Map;
} function S(t) {
	return t instanceof Set;
} function T(t, ...e) {
	return Object.assign(t, ...e);
} function x(t, e) {
	return Object.hasOwn(t, e);
} function C(t) {
	return Object.keys(t);
} function R(t) {
	return Object.getPrototypeOf(t);
} function M(t) {
	return c(t) ? '' === t.trim() : w(t) ? 0 === t.length : Boolean(o(t)) && 0 === Object.keys(t).length;
} function k(t) {
	const e = document.createElement('template'); return e.innerHTML = t.trim(), e.content.firstElementChild;
} function L(t) {
	return c(t) ? document.querySelector(t) : t;
} const N = (t) => {
	t();
}; const P = (t, e) => {
	for (let n = 0; n < t.length; n++) {
		e(t[n], n);
	}
}; const A = (t, e) => {
	const n = Object.keys(t); for (let r = 0; r < n.length; r++) {
		e(n[r], t[n[r]]);
	}
}; const O = (t, e) => {
	for (let n = 0; n < t.length; n++) {
		e(t[n], n);
	}
}; function I(t) {
	queueMicrotask(() => {
		throw t;
	});
} function D(t, e) {
	if (t === e) {
		return !0;
	} if (t?.constructor !== e?.constructor) {
		return !1;
	} if (l(t) || w(t)) {
		const n = Object.keys(t); return n.length === Object.keys(e).length && n.every((n) => {
			return D(t[n], e[n]);
		});
	} return !1;
} function $(t, e) {
	if (t === e) {
		return !0;
	} const n = t.length; const r = e.length; return n < r ? 46 === e.charCodeAt(n) && e.startsWith(t) : r < n && 46 === t.charCodeAt(r) && t.startsWith(e);
} const F = new Map(); function j(t) {
	if (!t) {
		return null;
	} let e = F.get(t); return e || (e = t.split('.'), F.set(t, e)), e;
} function B(t, e) {
	const n = j(e); if (!n) {
		return t;
	} let r = t; for (let t = 0; t < n.length; t++) {
		if (null == r) {
			return;
		} const e = n[t]; r = S(r) ? r.has(e) : E(r) ? r.get(e) : r[e];
	} return r;
} function V(t, e, n) {
	let r = t.get(e); return void 0 === r && (r = n(), t.set(e, r)), r;
} function W(t, e, n, r, s, i) {
	let o = t.get(e); o || (o = new Map(), t.set(e, o)); const l = o.get(n); if (l) {
		return l;
	} const c = r.build(e, n, s, i); return o.set(n, c), c;
} function U(t, e) {
	return t ? `${t}.${String(e)}` : String(e);
} const z = Promise.resolve(); function K(t, e) {
	const n = Promise.withResolvers(); t[e] = n.promise, t[`${e}Resolver`] = n.resolve;
} function _(t, e) {
	const n = `${e}Resolver`; t[n] && (t[n](), t[n] = null, t[e] = z);
} function q(t, e, n, r = 'onLifecycleError') {
	if (!t[e]) {
		return !0;
	} let s; try {
		s = n ? t[e](...n) : t[e]();
	} catch (e) {
		return t[r](e), !1;
	} return !f(s) || s.then(() => {
		return !0;
	}, (e) => {
		return (t[r](e), !1);
	});
} function H(t) {
	t.unsubscribe ? t.unsubscribe() : t();
} function G(t) {
	t && (t.forEach(H), t.clear());
} function X(t) {
	t && (t.forEach(G), t.clear());
} function Y(t, e, n, r) {
	const s = [...t.entries()]; for (let n = 0; n < s.length; n += 1) {
		const r = s[n][0]; e.has(r) || (H(s[n][1]), t.delete(r));
	} const i = [...e]; for (let e = 0; e < i.length; e += 1) {
		const s = i[e]; t.has(s) || t.set(s, n(s, r));
	} return t;
} function J(t, e) {
	if (l(t) && l(e)) {
		const n = {
			...t,
		}; const r = Object.keys(e); for (let s = 0; s < r.length; s++) {
			const i = r[s]; n[i] = J(t[i], e[i]);
		} return n;
	} return w(t) && w(e) ? [...t, ...e] : S(t) && S(e) ? new Set([...t, ...e]) : E(t) && E(e) ? new Map([...t, ...e]) : e;
} function Z(t) {
	if (null === t || 'object' != typeof t) {
		return t;
	} if (w(t)) {
		const e = new Array(t.length); for (let n = 0; n < t.length; n++) {
			e[n] = Z(t[n]);
		} return e;
	} if (E(t)) {
		return new Map(t);
	} if (S(t)) {
		return new Set(t);
	} if (l(t)) {
		const e = {}; const n = Object.keys(t); for (let r = 0; r < n.length; r++) {
			const s = n[r]; e[s] = Z(t[s]);
		} return e;
	} return t;
} function Q(t, e, n) {
	if (!e.includes('.')) {
		return void (t[e] = n);
	} const r = e.split('.'); const s = r.pop(); let i = t; for (let t = 0; t < r.length; t++) {
		const e = r[t]; l(i[e]) || w(i[e]) || (i[e] = {}), i = i[e];
	}i[s] = n;
} function tt(t) {
	const e = t.parentNode; return e ? e.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? e.host ?? null : e.nodeType === Node.ELEMENT_NODE ? e : null : null;
} function et(t) {
	const e = t.providerRef.deref(); e && e.providedConsumers?.get(t.key)?.delete(this);
} const nt = Object.freeze({
	__proto__: null,
	clearInjectLinks() {
		this.injectLinks && (this.injectLinks.forEach(et, this), this.injectLinks.clear());
	},
	inject(t, e) {
		const n = (function(t, e) {
			let n = tt(t); for (;n;) {
				if (n.isWebComponent && n.provided?.has(e)) {
					return n;
				} n = tt(n);
			} return null;
		}(this, t)); return n ? ((function(t, e, n) {
			const r = t.providedConsumers ??= new Map(); let s = r.get(e); s || (s = new Set(), r.set(e, s)), s.has(n) || (s.add(n), (n.injectLinks ??= new Set()).add({
				providerRef: new WeakRef(t),
				key: e,
			}));
		}(n, t, this)), n.provided.get(t)) : e;
	},
	provide(t, e) {
		const n = this.provided ??= new Map(); const r = n.has(t); const
			s = n.get(t); if (n.set(t, e), r && s === e) {
			return e;
		} const i = this.providedConsumers?.get(t); if (i && i.size) {
			const t = [...i]; for (let e = 0; e < t.length; e++) {
				t[e].receiveContextUpdate();
			}
		} return e;
	},
	receiveContextUpdate() {
		if (!this.isConnected) {
			return;
		} this.cleanupTemplate(), this.templateBuilt = !1; const t = this.updateView(); f(t) && t.catch(I);
	},
}); const rt = new WeakMap(); function st(t) {
	return V(rt, t, () => {
		return new Map();
	});
} function it(t, e) {
	return V(st(t), e, () => {
		return [];
	});
} function ot(t, e) {
	const n = it(t, e.tagName.toLowerCase()); return n.includes(e) || n.push(e), () => {
		const t = n.indexOf(e); -1 !== t && n.splice(t, 1);
	};
} function lt(t) {
	const e = rt.get(t); if (!e) {
		return [];
	} const n = []; return e.forEach((t) => {
		!(function(t, e) {
			for (let n = 0; n < e.length; n++) {
				t.push(e[n]);
			}
		}(n, t));
	}), n;
} function ct(t, e) {
	return b(e) ? st(t) : it(t, e);
} function at(t) {
	return ct(this, t?.toLowerCase())[0] ?? null;
} function ut(t) {
	return ct(this, t?.toLowerCase());
} function ht(t) {
	if (t) {
		const e = ct(this, t.toLowerCase()); return e ? e.slice() : [];
	} const e = []; return st(this).forEach((t) => {
		for (let n = 0; n < t.length; n++) {
			e.push(t[n]);
		}
	}), e;
} function dt(t, e) {
	if (!a(e)) {
		return null;
	} if (t) {
		const n = ct(this, t.toLowerCase()); if (!n) {
			return null;
		} for (let t = 0; t < n.length; t++) {
			if (e(n[t])) {
				return n[t];
			}
		} return null;
	} let n = null; return st(this).forEach((t) => {
		if (!n) {
			for (let r = 0; r < t.length; r++) {
				if (e(t[r])) {
					return void (n = t[r]);
				}
			}
		}
	}), n;
} function ft() {
	return this.shadowRoot ?? this;
} function pt(t) {
	return L(t)?.appendChild(this);
} function mt(t) {
	return L(t)?.prepend(this);
} function gt(t) {
	return A(t, (t, e) => {
		v(this.state[t]) && (this.state[t] = e);
	}), t;
} const yt = Object.freeze({
	__proto__: null,
	appendTo: pt,
	findComponent: dt,
	getComponent: at,
	getComponentRoot: ft,
	getComponents: ut,
	getComponentsArray: ht,
	ifAssign: gt,
	prependTo: mt,
}); class bt {
	componentRef = null; elementRef = null; eventName = ''; handler = null; options = null; subscribed = !1; signal = null; fireOnce = !1; static create(t, e, n, r, s) {
		const i = new bt(); return i.componentRef = new WeakRef(t), i.elementRef = new WeakRef(r || t), i.eventName = e, i.handler = n, i.options = s || null, i.fireOnce = o(s) && !0 === s.once, i.signal = o(s) && s.signal || null, i;
	}handleEvent(t) {
		const e = this.componentRef.deref(); if ('abort' === t.type) {
			return e && e.eventEntries?.delete(this), this.subscribed = !1, void (this.signal = null);
		} if (!e) {
			return void this.unsubscribe();
		} if (this.fireOnce && this.unsubscribe(), !a(this.handler)) {
			return;
		} const n = this.elementRef.deref() || t.currentTarget; const r = this.handler.call(e, t, n, this.eventName); return f(r) && r.catch((n) => {
			!(function(t, e, n, r) {
				queueMicrotask(() => {
					throw Object.assign(p(t) ? t : new Error(String(t)), {
						element: n,
						event: e,
						eventName: r,
					});
				});
			}(n, t, e, this.eventName));
		}), r;
	}subscribe() {
		if (this.subscribed) {
			return this;
		} if (this.signal?.aborted) {
			return this;
		} const t = this.componentRef.deref(); const e = this.elementRef.deref(); return t && e ? (e.addEventListener(this.eventName, this, this.options || void 0), (t.eventEntries ??= new Set()).add(this), this.subscribed = !0, this.signal && this.signal.addEventListener('abort', this, {
			once: !0,
		}), this) : this;
	}unsubscribe() {
		if (!this.subscribed) {
			return this.detachSignal(), this;
		} const t = this.componentRef.deref(); const e = this.elementRef.deref(); return e && e.removeEventListener(this.eventName, this, this.options || void 0), t && t.eventEntries?.delete(this), this.detachSignal(), this.subscribed = !1, this;
	}detachSignal() {
		this.signal && (this.signal.removeEventListener('abort', this), this.signal = null);
	}
} function vt(t) {
	return !0 === t || Boolean(o(t)) && !0 === t.capture;
} function wt(t) {
	const e = this.componentRef.deref(); if (e) {
		return e.runEventHandler(this.handler, t, t.currentTarget, t.type);
	}
} function Et(t, e, n) {
	return this.addEvent(t, e, this, n);
} const St = Object.freeze({
	__proto__: null,
	addEvent(t, e, n, r) {
		let s = t; let i = e; let l = n; let u = r; if (o(t) && (s = t.eventName, i = t.handler, l = t.element, u = t.options), !c(s) || !s.trim()) {
			throw new TypeError('eventName must be a non-empty string');
		} if (!a(i)) {
			throw new TypeError('handler must be a function');
		} const h = s.trim(); const d = l || this; const f = bt.create(this, h, i, d, u); return f.subscribe(), f;
	},
	clearEventListeners() {
		const t = this.eventEntries; if (!t?.size) {
			return;
		} const e = Array.from(t); for (let t = 0; t < e.length; t++) {
			e[t].unsubscribe();
		}t.clear();
	},
	emit(t, e = {}, n, r) {
		const {
			bubbles: s = !0, cancelable: i = !1, composed: l = !0,
		} = o(n) ? n : {}; const c = {
			bubbles: s,
			cancelable: i,
			composed: l,
			detail: {
				data: e,
				source: r || this,
			},
		}; return this.dispatchEvent(new CustomEvent(t, c));
	},
	handleEventError(t, e, n, r) {
		queueMicrotask(() => {
			throw Object.assign(p(t) ? t : new Error(String(t)), {
				element: n,
				event: e,
				eventName: r,
			});
		});
	},
	listener(t) {
		if (!a(t)) {
			throw new TypeError('handlerFunction must be a function');
		} this.listenerCache || (this.listenerCache = new WeakMap()); const e = this.listenerCache.get(t); if (e) {
			return e;
		} const n = {
			componentRef: new WeakRef(this),
			handler: t,
			handleEvent: wt,
		}; return this.listenerCache.set(t, n), n;
	},
	off(t, e, n) {
		if (!c(t) || !t.trim()) {
			throw new TypeError('eventName must be a non-empty string');
		} const r = this.eventEntries; if (!r?.size) {
			return this;
		} const s = this; const i = t.trim(); const o = void 0 === n ? null : vt(n); const l = Array.from(r); for (let t = 0; t < l.length; t++) {
			const n = l[t]; n.eventName === i && n.elementRef?.deref() === s && (e && n.handler !== e || null !== o && vt(n.options) !== o || n.unsubscribe());
		} return this;
	},
	on: Et,
	onFn(t, e) {
		return Et(t.name || t?.constructor.name, t, e);
	},
	once(t, e, n) {
		const r = o(n) ? {
			...n,
			once: !0,
		} : {
			once: !0,
		}; return this.on(t, e, r);
	},
	runEventHandler(t, e, n, r = e?.type) {
		if (!a(t)) {
			return;
		} const s = t.call(this, e, n, r); return f(s) && s.catch((t) => {
			return this.handleEventError(t, e, n, r);
		}), s;
	},
}); const Tt = !0; const xt = Object.freeze({
	silent: 0,
	error: 1,
	warn: 2,
	success: 3,
	info: 3,
	debug: 4,
	perf: 5,
}); let Ct = xt[globalThis.CONFIG?.logLevel] ?? xt.error; const Rt = {
	info: 'color: #3b82f6; font-weight: bold;',
	success: 'color: #10b981; font-weight: bold;',
	warn: 'color: #f59e0b; font-weight: bold;',
	error: 'color: #ef4444; font-weight: bold;',
	debug: 'color: #8b5cf6; font-weight: bold;',
	perf: 'background:#dc2626; color:#fff; padding:2px 8px; border-radius:3px; font-weight:800;',
}; const Mt = {
	banner: 'font-size: 18px; font-weight: 800; padding: 6px 12px; border-radius: 6px; background: #111827; color: #f9fafb;',
	title: 'font-size: 14px; font-weight: 700; color: #111827; border-bottom: 2px solid #111827; padding: 2px 0;',
	pill: 'font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: #6366f1; color: #fff;',
	gradient: 'font-size: 16px; font-weight: 800; padding: 6px 14px; border-radius: 6px; background: linear-gradient(90deg,#6366f1,#ec4899); color: #fff;',
}; const kt = {
	error: 'error',
	warn: 'warn',
	perf: 'warn',
}; function Lt() {} function Nt(t, e) {
	if ('error' !== t) {
		return Lt;
	} const n = xt[t]; return function(...t) {
		if (!(n > Ct)) {
			return e(...t);
		}
	};
} function Pt(t) {
	return Nt('info', (...e) => {
		console[t](...e);
	});
} function At(t, e = 'info') {
	return Nt(e, (...e) => {
		console[t]?.(...e);
	});
} function Ot(t) {
	return (e, ...n) => {
		'undefined' != typeof performance && performance[t] && performance[t](e, ...n);
	};
} const It = Nt('info', (t, e) => {
	console.log(`%c${t}`, (function(t) {
		return 'string' == typeof t && t.includes(':') ? t : Mt[t] || Mt.banner;
	}(e)));
}); const Dt = Nt('info', (t) => {
	const e = '─'.repeat(48); t ? console.log(`%c${e}\n  ${t}\n${e}`, 'color:#6b7280;font-weight:600;') : console.log(`%c${e}`, 'color:#6b7280;');
}); const $t = Nt('info', (t, e) => {
	console[e ? 'groupCollapsed' : 'group'](`%c${t}`, Mt.title);
}); const Ft = Nt('info', (t, ...e) => {
	console.trace(`%c[${t}]`, Rt.debug, ...e);
}); const jt = Pt('groupEnd'); const Bt = Pt('table'); const Vt = Pt('dir'); const Wt = Pt('count'); const Ut = Pt('countReset'); const zt = Pt('time'); const Kt = Pt('timeLog'); const _t = Pt('timeEnd'); const qt = Pt('clear'); const Ht = Ot('mark'); const Gt = Ot('measure'); const Xt = At('profile', 'info'); const Yt = At('profileEnd', 'info'); class Jt {
	label = null; constructor(t = null) {
		this.label = t;
	} static setLevel(t) {
		return (function(t) {
			const e = xt[t]; return void 0 !== e && (Ct = e), Ct;
		}(t));
	}setLevel(t) {
		return Jt.setLevel(t);
	} static getLevel() {
		return Ct;
	}getLevel() {
		return Ct;
	} get debugOn() {
		return !1;
	} get perfOn() {
		return !1;
	}info(...t) {
		return this.#t('info', ...t);
	}success(...t) {
		return this.#t('success', ...t);
	}warn(...t) {
		return this.#t('warn', ...t);
	}error(...t) {
		return this.#t('error', ...t);
	}debug(...t) {
		return this.#t('debug', ...t);
	}perf(...t) {
		return this.#t('perf', ...t);
	}#t(t, ...e) {
		if ('error' !== t) {
			return;
		} if (xt[t] > Ct) {
			return;
		} let n; let r; let s; null === this.label || void 0 === this.label ? (n = e[0], r = e[1], s = e.slice(2)) : e.length > 1 && 'string' == typeof e[0] ? (n = `${this.label}:${e[0]}`, r = e[1], s = e.slice(2)) : (n = this.label, r = e[0], s = e.slice(1)); const i = 'function' == typeof r ? r(...s) : r; null != i && (function(t, e, n, r) {
			const s = kt[t] ?? 'log'; const i = `%c[${e}]`; const o = Rt[t]; r.length > 0 ? console[s](i, o, n, ...r) : console[s](i, o, n);
		}(t, n, i, []));
	}header(t, e) {
		return It(t, e);
	}rule(t) {
		return Dt(t);
	}group(t, e) {
		let n = t; let r = e; return null !== this.label && void 0 !== this.label && (arguments.length > 0 ? (n = `${this.label}:${t}`, r = e) : (n = this.label, r = t)), $t(n, r);
	}groupEnd() {
		return jt();
	}table(...t) {
		return Bt(...t);
	}dir(...t) {
		return Vt(...t);
	}count(...t) {
		return Wt(...t);
	}countReset(...t) {
		return Ut(...t);
	}time(...t) {
		return zt(...t);
	}timeLog(...t) {
		return Kt(...t);
	}timeEnd(...t) {
		return _t(...t);
	}clear(...t) {
		return qt(...t);
	}trace(...t) {
		let e; let n; return null === this.label || void 0 === this.label ? (e = t[0], n = t.slice(1)) : t.length > 1 && 'string' == typeof t[0] ? (e = `${this.label}:${t[0]}`, n = t.slice(1)) : (e = this.label, n = t), Ft(e, ...n);
	}assert(t, e, ...n) {
		let r = e; let s = n; null !== this.label && void 0 !== this.label && (void 0 !== e && 'string' == typeof e ? (r = `${this.label}:${e}`, s = n) : (r = this.label, s = [e, ...n])), console.assert(t, `%c[${r}]`, Rt.error, ...s);
	}mark(t, ...e) {
		return Ht(t, ...e);
	}measure(t, ...e) {
		return Gt(t, ...e);
	}profile(...t) {
		return Xt(...t);
	}profileEnd(...t) {
		return Yt(...t);
	}break(t) {}breakOn(t, e) {
		null === this.label || void 0 === this.label || this.label;
	}inspect(t, e) {
		let n = e; return null === this.label || void 0 === this.label || (arguments.length > 1 ? (this.label, n = e) : (this.label, n = t)), n;
	}
} class Zt extends Jt {
	constructor(t) {
		let e; e = null == t ? 'component' : 'string' == typeof t ? t : t.tagName ? t.tagName : t.constructor?.name ? t.constructor.name : String(t), super(e);
	}
} const Qt = new Jt(); const
	te = new Map(); function ee(t) {
	return t.id || null;
} const ne = new Proxy(te, {
	get: (t, e) => {
		return (c(e) ? t.get(e) : Reflect.get(t, e));
	},
	set: (t, e, n) => {
		return (t.set(e, n), !0);
	},
	has: (t, e) => {
		return t.has(e);
	},
}); const re = Object.freeze({
	CREATED: 'created',
	CONNECTED: 'connected',
	RENDERED: 'rendered',
	MOUNTED: 'mounted',
	LIVE: 'live',
	DISCONNECTED: 'disconnected',
	DESTROYED: 'destroyed',
}); const se = {
	[re.CREATED]: 0,
	[re.CONNECTED]: 1,
	[re.RENDERED]: 2,
	[re.MOUNTED]: 3,
	[re.LIVE]: 4,
}; function ie(t) {
	const e = se[t]; const n = se[this.phase]; return void 0 !== e && void 0 !== n && n >= e;
} const oe = {
	isMounted: {
		configurable: !0,
		get() {
			return this.atPhase(re.MOUNTED);
		},
	},
	isLive: {
		configurable: !0,
		get() {
			return this.atPhase(re.LIVE);
		},
	},
	isRendered: {
		configurable: !0,
		get() {
			return this.atPhase(re.RENDERED);
		},
	},
	isDisconnected: {
		configurable: !0,
		get() {
			return this.phase === re.DISCONNECTED;
		},
	},
	isDestroyed: {
		configurable: !0,
		get() {
			return this.phase === re.DESTROYED;
		},
	},
	whenTreeVisible: {
		configurable: !0,
		get() {
			if (this.lifecycle.treeVisiblePromise) {
				return this.lifecycle.treeVisiblePromise;
			} const t = lt(this).map((t) => {
				return t.whenTreeVisible;
			}); return this.lifecycle.treeVisiblePromise = Promise.all([this.lifecycle.whenVisible, ...t]), this.lifecycle.treeVisiblePromise;
		},
	},
}; const le = new Map(); let ce = !1; function ae(t, e) {
	return t.length ? t[Math.min(t.length - 1, Math.floor(t.length * e))] : 0;
} const ue = {
	start() {},
	stop() {
		ce = !1;
	},
	clear() {
		le.clear();
	},
	isActive: () => {
		return ce && !1;
	},
	mark: (t) => {
		return null;
	},
	measure(t, e) {},
	report() {
		const t = []; const e = [...le.entries()]; for (let n = 0; n < e.length; n++) {
			const r = e[n][0]; const s = e[n][1]; const i = s.count > 0 ? s.total / s.count : 0; const o = [...s.samples].sort((t, e) => {
				return t - e;
			}); t.push({
				category: r,
				count: s.count,
				totalMs: Number(s.total.toFixed(3)),
				avgMs: Number(i.toFixed(4)),
				p50Ms: Number(ae(o, 0.5).toFixed(4)),
				p95Ms: Number(ae(o, 0.95).toFixed(4)),
				maxMs: Number(s.max.toFixed(4)),
			});
		} return t.sort((t, e) => {
			return e.totalMs - t.totalMs;
		}), t;
	},
}; function he(t, e) {
	if (!t) {
		return;
	} const n = t.querySelectorAll('*'); for (let t = 0; t < n.length; t++) {
		const r = n[t]; r.isWebComponent && e.push(r), r.shadowRoot && he(r.shadowRoot, e);
	}
} function de(t) {
	const e = t.stateBus; return {
		stateSubs: e?.subs?.size ?? 0,
		renderDeps: t.renderDepUnsubs?.size ?? 0,
		stateUnsubs: t.stateUnsubs?.byPath?.size ?? 0,
		globalUnsubs: t.globalUnsubs?.byPath?.size ?? 0,
		eventEntries: t.eventEntries?.size ?? 0,
		delegateEntries: t.delegateEntries?.size ?? 0,
		hotkeyEntries: t.hotkeyEntries?.size ?? 0,
		refs: t.refsMap?.size ?? 0,
	};
} function fe() {
	const t = globalThis.performance?.memory; return t ? t.usedJSHeapSize : 0;
} function pe() {
	if ('function' == typeof globalThis.gc) {
		return globalThis.gc(), !0;
	} const t = globalThis.Bun; return !(!t || 'function' != typeof t.gc || (t.gc(!0), 0));
} function me() {
	return 'function' != typeof requestAnimationFrame ? Promise.resolve() : new Promise((t) => {
		requestAnimationFrame(t);
	});
}ue.census = function() {
	const t = []; he(document, t); const e = new Map(); const
		n = new Map(); let r = 0; let s = 0; let i = 0; let o = 0; let l = 0; let c = 0; let a = 0; let u = 0; for (let h = 0; h < t.length; h++) {
		const d = t[h]; const f = d.tagName.toLowerCase(); e.set(f, (e.get(f) ?? 0) + 1); const p = d.phase ?? '(unset)'; n.set(p, (n.get(p) ?? 0) + 1); const m = de(d); r += m.stateSubs, s += m.renderDeps, i += m.stateUnsubs, o += m.globalUnsubs, l += m.eventEntries, c += m.delegateEntries, a += m.hotkeyEntries, u += m.refs;
	} return {
		totalComponents: t.length,
		uniqueTags: e.size,
		byTag: [...e.entries()].sort((t, e) => {
			return e[1] - t[1];
		}),
		byPhase: [...n.entries()],
		totals: {
			stateBusSubs: r,
			renderDeps: s,
			observers: i + o,
			eventEntries: l,
			delegateEntries: c,
			hotkeyEntries: a,
			refs: u,
		},
	};
}, ue.memory = function() {
	const t = globalThis.performance?.memory; return t ? {
		usedHeapMb: Math.round(t.usedJSHeapSize / 1024 / 1024),
		totalHeapMb: Math.round(t.totalJSHeapSize / 1024 / 1024),
		heapLimitMb: Math.round(t.jsHeapSizeLimit / 1024 / 1024),
	} : null;
}, ue.settle = async function(t = 3) {
	const e = 'number' == typeof t ? t : 3; for (let t = 0; t < e; t++) {
		await Promise.resolve();
	}
}, ue.settleHeap = async function() {
	if (pe()) {
		return await ('function' != typeof requestAnimationFrame ? Promise.resolve() : new Promise((t) => {
			requestAnimationFrame(() => {
				requestAnimationFrame(t);
			});
		})), pe(), fe();
	} let t = 1 / 0; for (let e = 0; e < 6; e++) {
		await me(); const e = fe(); e > 0 && e < t && (t = e);
	} return t === 1 / 0 ? fe() : t;
}, ue.bench = async function(t, e, n) {
	return null;
}, ue.forceGc = pe; const ge = 'undefined' != typeof navigator && (navigator.userAgentData?.platform || navigator.platform) || ''; const ye = (/mac|iphone|ipad|ipod/i).test(ge); const be = {
	cmd: 'meta',
	command: 'meta',
	control: 'ctrl',
	option: 'alt',
	super: 'meta',
	win: 'meta',
	windows: 'meta',
}; const ve = {
	del: 'delete',
	down: 'arrowdown',
	esc: 'escape',
	left: 'arrowleft',
	return: 'enter',
	right: 'arrowright',
	spacebar: 'space',
	up: 'arrowup',
}; const we = [
	'alt', 'ctrl', 'meta',
]; const Ee = new Set([
	'Alt', 'AltGraph', 'Control', 'Meta', 'Shift',
]); const Se = {}; const Te = {
	entry: null,
	unregister() {},
}; function xe(t) {
	const e = String(t).toLowerCase().split('+'); const n = []; for (let t = 0; t < e.length; t += 1) {
		let r = e[t].trim(); r && ('mod' === r ? r = ye ? 'meta' : 'ctrl' : be[r] ? r = be[r] : ve[r] && (r = ve[r]), -1 === n.indexOf(r) && n.push(r));
	} return n.sort(), n.join('+');
} const Ce = new Map(); let Re = !1; function Me(t) {
	return Ee.has(t);
} function ke(t) {
	const e = t.toLowerCase(); return ' ' === e ? 'space' : e;
} function Le(t, e) {
	return t.code || e;
} function Ne(t) {
	const e = t.key; if (!e || Me(e)) {
		return;
	} const n = ke(e); Ce.set(Le(t, n), n), (function(t, e) {
		const n = Ie.get(t); if (!n || 0 === n.size) {
			return;
		} const r = (function(t) {
			if (!t || 1 !== t.nodeType) {
				return !1;
			} const e = t.tagName; return 'INPUT' === e || 'TEXTAREA' === e || 'SELECT' === e || !0 === t.isContentEditable;
		}(e.composedPath()[0])) && !(function(t) {
			const e = t.split('+'); for (let t = 0; t < e.length; t += 1) {
				if (-1 !== we.indexOf(e[t])) {
					return !0;
				}
			} return !1;
		}(t)); const
			s = !0 === e.repeat; let i = !1; let o = !1; n.forEach((l) => {
			const c = l.targetRef.deref(); if (!c) {
				return n.delete(l), void De.unregister(l);
			} if (!1 === c.isConnected) {
				return;
			} const a = l.options; s && !a.allowRepeat || r && !a.whileTyping || (i = !0, !1 !== a.preventDefault && (o = !0), (function(t, e, n, r) {
				const s = t.handler.call(e, n, r); f(s) && s.catch(I);
			}(l, c, e, t)));
		}), 0 === n.size && (Ie.delete(t), 0 === Ie.size && Oe()), i && o && e.preventDefault();
	}((function(t) {
		const e = []; return t.ctrlKey && e.push('ctrl'), t.altKey && e.push('alt'), t.metaKey && e.push('meta'), t.shiftKey && (function() {
			let t = !1; return Ce.forEach((e) => {
				(e.length > 1 || e >= 'a' && e <= 'z') && (t = !0);
			}), t;
		}()) && e.push('shift'), Ce.forEach((t) => {
			-1 === e.indexOf(t) && e.push(t);
		}), e.sort(), e.join('+');
	}(t)), t));
} function Pe(t) {
	const e = t.key; e && !Me(e) && Ce.delete(Le(t, ke(e)));
} function Ae() {
	Ce.clear();
} function Oe() {
	Re && (Re = !1, document.removeEventListener('keydown', Ne, {
		capture: !0,
	}), document.removeEventListener('keyup', Pe, {
		capture: !0,
	}), globalThis.removeEventListener('blur', Ae), Ce.clear());
} const Ie = new Map(); const
	De = new FinalizationRegistry(Fe); function $e() {
	return new Set();
} function Fe(t) {
	const e = Ie.get(t.combo); e && (e.delete(t), 0 === e.size && Ie.delete(t.combo), 0 === Ie.size && Oe());
} function je(t) {
	De.unregister(t), Fe(t);
} function Be(t, e, n, r, s) {
	const i = xe(e); if (!i) {
		return Te;
	} const o = {
		combo: i,
		handler: n,
		options: s || Se,
		source: r || 'api',
		targetRef: new WeakRef(t),
	}; return V(Ie, i, $e).add(o), Re || (Re = !0, document.addEventListener('keydown', Ne, {
		capture: !0,
	}), document.addEventListener('keyup', Pe, {
		capture: !0,
	}), globalThis.addEventListener('blur', Ae)), De.register(t, o, o), {
		entry: o,
		unregister() {
			je(o);
		},
	};
} const Ve = Object.freeze({
	CONNECTED: 'whenConnected',
	RENDERED: 'whenRendered',
	MOUNTED: 'whenMounted',
	LIVE: 'whenLive',
	VISIBLE: 'whenVisible',
	DESTROYED: 'whenDestroyed',
}); const We = [
	Ve.CONNECTED, Ve.RENDERED, Ve.MOUNTED, Ve.LIVE, Ve.VISIBLE,
]; function Ue(t, e) {
	if (e && e.isWebComponent) {
		return t.parentComponent = e, void (t.unregisterFromParent = ot(e, t));
	} t.parentComponent = null;
} function ze(t) {
	const e = t.getRootNode(); return d(e) ? e.host : t.parentElement;
} function Ke(t, e, n) {
	return t[e]().catch((e) => {
		Qt.error('WebComponent', `[${t.tagName}] ${n} error:`, e), t.onLifecycleError(e);
	});
} const _e = Object.freeze({
	__proto__: null,
	LIFECYCLE_PROMISE: Ve,
	connectedCallback() {
		this.firstRenderDone || this.classList.add('mounting'), this.pendingConnect = Ke(this, 'handleConnect', 'Connected');
	},
	connectedMoveCallback() {
		Ke(this, 'handleMove', 'Move');
	},
	createConnectCyclePromises() {
		for (let t = 0; t < We.length; t++) {
			K(this.lifecycle, We[t]);
		} this.lifecycle.treeVisiblePromise = null;
	},
	createWhenDestroyedPromise() {
		K(this.lifecycle, Ve.DESTROYED);
	},
	destroy() {
		return this.phase === re.DESTROYED || (this.pendingDestroy = !0, this.isConnected ? this.remove() : this.handleDestroy().catch((t) => {
			this.onLifecycleError(t);
		})), this.lifecycle.whenDestroyed;
	},
	disconnectedCallback() {
		Ke(this, 'handleDisconnect', 'Disconnected');
	},
	async handleConnect() {
		const t = ue.mark('connect'); !(function(t) {
			const e = ee(t); e && (Qt.debug('registry', 'register', e), te.set(e, t));
		}(this)), Ue(this, ze(this)); const e = this.applyStyles(); e && 'function' == typeof e.then && await e; const n = this.applyThemeStyles(); if (n && 'function' == typeof n.then && await n, this.onConnect) {
			const t = this.onConnect(); t && 'function' == typeof t.then && await t;
		} this.phase = re.CONNECTED, _(this.lifecycle, Ve.CONNECTED), Object.keys(this.STATE).length ? await this.updateView() : await this.renderView(), ue.measure('connect', t);
	},
	async handleDestroy() {
		await (this.onDestroy?.()), this.phase = re.DESTROYED, _(this.lifecycle, Ve.DESTROYED);
	},
	async handleDisconnect() {
		let t; await this.pendingConnect, this.pendingConnect = null, (function(t) {
			const e = ee(t); e && te.get(e) === t && te.delete(e);
		}(this)), this.unregisterFromParent?.(), this.unregisterFromParent = null, this.parentComponent = null, this.uninstallObserver(), this.disposeRemoteLists(), this.visibleFired = !1, this.isIntersecting = !1, this.isIntersected = !1, this.isVisible = !1, this.clearTimeouts(), this.clearIntervals(), this.stateUnsubs?.clear(), this.globalUnsubs?.clear(), this.clearDelegateListeners(), (t = this.hotkeyEntries) && 0 !== t.size && (t.forEach(je), t.clear()), G(this.gestureUnsubs), this.clearInjectLinks(), this.refsMap = null, this.refsProxy = null, this.cleanupTemplate(), this.templateBuilt = !1, this.firstRenderDone = !1, this.isRendering = !1, X(this.renderDepUnsubs), this.clearEventListeners(), this.resolveStrandedConnectCyclePromises(), await (this.onDisconnect?.()), this.phase = re.DISCONNECTED, this.createConnectCyclePromises(), this.pendingDestroy && await this.handleDestroy();
	},
	async handleMove() {
		const t = this.parentComponent; this.unregisterFromParent?.(), this.unregisterFromParent = null, Ue(this, ze(this)), await (this.onMove?.(t, this.parentComponent));
	},
	resolveStrandedConnectCyclePromises() {
		for (let t = 0; t < We.length; t++) {
			_(this.lifecycle, We[t]);
		} this.lifecycle.treeVisiblePromise = null;
	},
}); const qe = 'undefined' != typeof scheduler && 'function' == typeof scheduler.postTask; let He = null; let Ge = []; let Xe = !1; function Ye() {
	const t = Ge; Ge = [], Xe = !1; for (let e = 0; e < t.length; e++) {
		t[e]();
	}
} function Je(t) {
	Ge.push(t);
} function Ze() {
	const t = new Promise(Je); return Xe || (Xe = !0, requestAnimationFrame(Ye)), t;
} async function Qe() {
	const t = ue.mark('schedulerFlush'); const e = He; if (He = null, !e) {
		return void ue.measure('schedulerFlush', t);
	} const n = []; const r = [...e.tasks.entries()]; for (let t = 0; t < r.length; t++) {
		const e = r[t][0]; const s = r[t][1]; const i = e === s ? s() : s.call(e); f(i) && n.push(i);
	} if (n.length) {
		const t = await Promise.allSettled(n); for (let e = 0; e < t.length; e++) {
			'rejected' === t[e].status && I(t[e].reason);
		}
	}e.resolve(), ue.measure('schedulerFlush', t);
} function tn(t, e) {
	!(function() {
		if (He) {
			return;
		} const t = Promise.withResolvers(); He = {
			tasks: new Map(),
			promise: t.promise,
			resolve: t.resolve,
		}, qe ? scheduler.postTask(Qe, {
			priority: 'user-visible',
		}) : requestAnimationFrame(Qe);
	}()); const n = e ?? t; return He.tasks.set(n, t), He.promise;
} const en = new Set(); function nn(t) {
	en.add(t);
} const rn = new Set(); const
	sn = new Set(); let on = !1; function ln() {
	return new Set();
} function cn(t, e, n) {
	const r = t.handler; if (!r) {
		return;
	} const s = t.target; const i = s ? r.call(s, e, n) : r(e, n); f(i) && i.catch(I);
} function an() {
	on = !1; const t = [...sn]; sn.clear(); for (let e = 0; e < t.length; e++) {
		t[e].flush();
	}!(function() {
		if (!en.size) {
			return;
		} const t = [...en]; en.clear(); for (let e = 0; e < t.length; e++) {
			t[e].drain();
		}
	}()), (function() {
		if (!rn.size) {
			return;
		} const t = [...rn]; rn.clear(); for (let e = 0; e < t.length; e++) {
			const n = t[e].updateView(); f(n) && n.catch(I);
		}
	}());
} class un {
	byPath = new Map(); add(t) {
		let e = this.byPath.get(t.path); e || (e = new Set(), this.byPath.set(t.path, e)), e.add(t);
	}delete(t) {
		const e = this.byPath.get(t.path); e && (e.delete(t), e.size || this.byPath.delete(t.path));
	}removeByKey(t) {
		const e = this.byPath.get(t); if (!e) {
			return;
		} const n = [...e]; this.byPath.delete(t); for (let t = 0; t < n.length; t += 1) {
			n[t].unsubscribe();
		}
	}clear() {
		const t = []; const e = [...this.byPath.values()]; for (let n = 0; n < e.length; n += 1) {
			const r = [...e[n]]; for (let e = 0; e < r.length; e += 1) {
				t.push(r[e]);
			}
		} this.byPath.clear(); for (let e = 0; e < t.length; e += 1) {
			t[e].unsubscribe();
		}
	}
} class hn {
	constructor(t, e) {
		this.tracker = t, this.subscriptions = e;
	}unsubscribe() {
		const t = this.tracker; const e = this.subscriptions; for (let n = 0; n < e.length; n += 1) {
			e[n].unsubscribe(), t.delete(e[n]);
		}
	}
} class dn {
	constructor(t, e, n, r, s) {
		this.bus = t, this.path = e, this.handler = n, this.target = r ?? null, this.multiPath = !0 === s; const i = V(t.subs, e, ln); i.add(this), this.subscriptions = i;
	}unsubscribe() {
		this.handler && (this.subscriptions.delete(this), this.subscriptions.size || this.bus.subs.delete(this.path), this.handler = null, this.target = null, this.subscriptions = null);
	}
} class fn {
	subs = new Map(); pending = new Set(); flushScheduled = !1; getValue(t) {
		throw new Error('PathSubscriptions.getValue must be overridden by a subclass');
	}onFlush() {}subscribe(t, e, n, r) {
		return new dn(this, t, e, n, r);
	}notify(t) {
		this.pending.add(t), this.flushScheduled || (this.flushScheduled = !0, sn.add(this), on || (on = !0, queueMicrotask(an)));
	}flush() {
		const t = ue.mark('busFlush'); this.flushScheduled = !1; const e = [...this.pending]; if (this.pending.clear(), this.subs.size) {
			const t = [...this.subs.entries()]; for (let n = 0; n < t.length; n++) {
				const r = t[n][0]; const s = t[n][1]; if (!s.size) {
					continue;
				} let i; let o = null; let l = !1; for (let t = 0; t < e.length; t++) {
					if (!$(r, e[t])) {
						continue;
					} const n = e[t]; if (o) {
						for (let t = 0; t < o.length; t++) {
							const e = o[t]; e.multiPath && cn(e, i, n);
						}
					} else {
						i = this.getValue(r), o = [...s]; for (let t = 0; t < o.length; t++) {
							const e = o[t]; e.multiPath && (l = !0), cn(e, i, n);
						} if (!l) {
							break;
						}
					}
				}
			}
		} this.onFlush(), ue.measure('busFlush', t);
	}
} const pn = Symbol('statePath'); class mn extends fn {
	constructor(t) {
		super(), this.component = t;
	}getValue(t) {
		return B(this.component.STATE, t);
	}onFlush() {
		const t = this.component.updateView(); f(t) && t.catch(I);
	}
} function gn(t) {
	return t.stateBus || (t.stateBus = new mn(t)), t.stateBus;
} class yn {
	constructor(t) {
		this.component = t, this.bus = gn(t), this.global = !1;
	}read(t) {
		return B(this.component.STATE, t);
	}write(t, e) {
		Q(this.component.stateProxy, t, e);
	}
} function bn(t) {
	return t.localRealmRef || (t.localRealmRef = new yn(t)), t.localRealmRef;
} function vn(t, e) {
	gn(t).notify(e);
} function wn(t, e) {
	const n = t.propertyIndex; return !n || !n.hasNonReactive || !n.nonReactivePaths.has(e);
} class En {
	constructor(t, e, n, r) {
		this.target = t, this.component = e, this.path = n, this.asMap = r;
	}notifyKey(t) {
		vn(this.component, U(this.path, t));
	}add(t) {
		return this.target.has(t) || (this.target.add(t), this.notifyKey(t)), this.target;
	}set(t, e) {
		return this.target.has(t) && this.target.get(t) === e || (this.target.set(t, e), this.notifyKey(t)), this.target;
	}delete(t) {
		return Boolean(this.target.has(t)) && (this.target.delete(t), this.notifyKey(t), !0);
	}clear() {
		if (!this.target.size) {
			return;
		} const t = this.asMap ? [...this.target.keys()] : [...this.target]; this.target.clear(); for (let e = 0; e < t.length; e++) {
			this.notifyKey(t[e]);
		}
	}has(t) {
		return this.target.has(t);
	}get(t) {
		return this.target.get(t);
	}forEach(t) {
		return this.target.forEach(t);
	}keys() {
		return this.target.keys();
	}values() {
		return this.target.values();
	}entries() {
		return this.target.entries();
	} get size() {
		return this.target.size;
	}[Symbol.iterator]() {
		return this.target[Symbol.iterator]();
	}
} class Sn {
	static instance = new Sn(); static create(t, e, n, r) {
		return W(e.proxyCache, t, n, Sn, e, r);
	} static build(t, e, n, r) {
		const s = new En(t, n, e, r); return new Proxy(s, Sn.instance);
	}get(t, e, n) {
		return e === pn ? {
			realm: bn(t.component),
			path: t.path,
		} : Reflect.get(t, e, n);
	}set() {
		!(function() {
			throw new Error('Do not mutate Map/Set proxy properties directly. Use .set() or .add() instead.');
		}());
	}deleteProperty() {
		!(function() {
			throw new Error('Do not delete Map/Set proxy properties directly. Use .delete() instead.');
		}());
	}getPrototypeOf(t) {
		return t.asMap ? Map.prototype : Set.prototype;
	}
} function Tn(t, e, n, r) {
	return Sn.create(t, e, n, r);
} class xn {
	constructor(t, e) {
		this.component = t, this.path = e;
	} static create(t, e, n = '') {
		return W(e.proxyCache, t, n, xn, e);
	} static build(t, e, n) {
		return new Proxy(t, new xn(n, e));
	}get(t, e) {
		if (u(e)) {
			return Reflect.get(t, e);
		} if ('' === this.path) {
			const t = this.component.propertyIndex; if (t?.hasAccessors && t.getters.has(e)) {
				return t.getters.get(e).call(this.component);
			}
		} const n = Reflect.get(t, e); const r = U(this.path, e); return l(n) || w(n) ? xn.create(n, this.component, r) : S(n) ? Tn(n, this.component, r, !1) : E(n) ? Tn(n, this.component, r, !0) : n;
	}set(t, e, n) {
		if ('' === this.path) {
			const t = this.component.propertyIndex; if (t?.hasAccessors) {
				const r = t.setters.get(e); if (r) {
					r.call(this.component, n); const t = String(e); return wn(this.component, t) && vn(this.component, t), !0;
				} if (t.getters.has(e)) {
					return !0;
				}
			}
		} if (t[e] === n) {
			return !0;
		} const r = U(this.path, e); return Reflect.set(t, e, n), wn(this.component, r) && vn(this.component, r), !0;
	}deleteProperty(t, e) {
		if (!x(t, e) || null === t[e]) {
			return !0;
		} const n = U(this.path, e); return t[e] = null, wn(this.component, n) && vn(this.component, n), !0;
	}
} function Cn(t, e) {
	if (!l(t)) {
		return !1;
	} const n = !0 === e?.silent; const r = Object.keys(t); let s = !1; for (let e = 0; e < r.length; e++) {
		const i = r[e]; const o = t[i]; this.STATE[i] !== o && (this.STATE[i] = o, s = !0, !n && wn(this, i) && vn(this, i));
	} return s;
} class Rn {
	constructor(t, e, n, r) {
		this.component = t, this.handler = e, this.previousValue = n, this.fireOnce = !0 === r?.once, this.subscription = null;
	}handle(t, e) {
		const n = this.handler.call(this.component, t, this.previousValue, e); return this.previousValue = t, this.fireOnce && this.subscription && this.subscription.unsubscribe(), n;
	}
} function Mn(t, e, n, r) {
	const s = String(e ?? ''); const i = gn(t); const o = B(t.STATE, s); const l = new Rn(t, n, o, r); const c = i.subscribe(s, Rn.prototype.handle, l); return l.subscription = c, !0 === r?.immediate && (n.call(t, o, void 0, s), !0 === r.once && c.unsubscribe()), c;
} function kn(t, e) {
	let n = Object.getPrototypeOf(t); for (;n && n !== HTMLElement.prototype;) {
		const t = Object.getOwnPropertyDescriptor(n, e); if (t) {
			return t.set ? t : null;
		} n = Object.getPrototypeOf(n);
	} return null;
} const Ln = Object.freeze({
	__proto__: null,
	STATE_PATH: pn,
	assignState: Cn,
	ensureStateBus: gn,
	initState() {
		this.proxyCache = new WeakMap(), this.stateProxy = xn.create(this.STATE, this);
	},
	localRealm: bn,
	observe(t, e, n) {
		const r = this.stateUnsubs ??= new un(); if (l(t)) {
			const s = l(e) ? e : n; const i = Object.keys(t); const o = []; for (let e = 0; e < i.length; e += 1) {
				const n = i[e]; const l = Mn(this, n, t[n], s); r.add(l), o.push(l);
			} return new hn(r, o);
		} if (w(t)) {
			const s = []; for (let i = 0; i < t.length; i += 1) {
				const o = Mn(this, t[i], e, n); r.add(o), s.push(o);
			} return new hn(r, s);
		} const s = Mn(this, t, e, n); return r.add(s), s;
	},
	replaceState(t = {}) {
		if (D(this.STATE, t)) {
			return Promise.resolve();
		} if (this.STATE = l(t) ? {
			...t,
		} : {}, this.proxyCache = new WeakMap(), this.stateProxy = xn.create(this.STATE, this), this.stateBus) {
			const t = this.stateBus; const e = [...t.subs.keys()]; for (let n = 0; n < e.length; n++) {
				t.notify(e[n]);
			}
		} return this.updateView();
	},
	unobserve(t) {
		this.stateUnsubs?.removeByKey(String(t ?? ''));
	},
	async updateView() {
		const t = ue.mark('updateView'); try {
			const t = this.onStateChange?.(); const e = f(t) ? t : null; const n = this.isConnected && !this.templateBuilt && this.atPhase(re.CONNECTED) ? this.renderView() : null; e && n ? await Promise.all([e, n]) : n ? await n : e && await e;
		} finally {
			ue.measure('updateView', t);
		}
	},
	upgradeShadowedProperties() {
		const t = Object.getOwnPropertyNames(this); for (let e = 0; e < t.length; e += 1) {
			const n = t[e]; const r = kn(this, n); if (!r) {
				continue;
			} const s = this[n]; Object.defineProperty(this, n, r), 'state' === n && l(s) ? this.assignState(s) : this[n] = s;
		}
	},
}); class Nn extends fn {
	constructor(t) {
		super(), this.store = t;
	}getValue(t) {
		return B(this.store.proxy, t);
	}
} class Pn {
	constructor(t, e) {
		this.store = t, this.path = e;
	} static create(t, e, n = '') {
		return l(e) || w(e) ? W(t.proxyCache, e, n, Pn, t) : e;
	} static build(t, e, n) {
		return new Proxy(t, new Pn(n, e));
	}get(t, e) {
		if (u(e)) {
			return Reflect.get(t, e);
		} const n = Reflect.get(t, e); const r = U(this.path, e); return l(n) || w(n) ? Pn.create(this.store, n, r) : n;
	}set(t, e, n) {
		if (t[e] === n) {
			return !0;
		} const r = U(this.path, e); return Reflect.set(t, e, n), this.store.bus.notify(r), !0;
	}deleteProperty(t, e) {
		if (!x(t, e) || null === t[e]) {
			return !0;
		} const n = U(this.path, e); return t[e] = null, this.store.bus.notify(n), !0;
	}
} class An {
	STATE = {}; proxyCache = new WeakMap(); proxy = null; bus = null; static create() {
		const t = new An(); return t.bus = new Nn(t), t.proxy = Pn.create(t, t.STATE), t;
	}get(t) {
		return void 0 === t ? this.proxy : B(this.proxy, t);
	}set(t) {
		if (!l(t)) {
			return;
		} const e = this.proxy; const n = Object.keys(t); for (let r = 0; r < n.length; r++) {
			const s = n[r]; const i = t[s]; const o = B(e, s); o !== i && (D(o, i) || Q(e, s, i));
		}
	}observe(t, e) {
		return this.bus.subscribe(t, e);
	}
} const On = An.create(); const In = {
	bus: On.bus,
	global: !0,
	read: (t) => {
		return B(On.proxy, t);
	},
	write(t, e) {
		On.set({
			[t]: e,
		});
	},
}; const Dn = {
	TEXT: 'text',
	HTML: 'html',
	COMPONENT: 'component',
	LIST: 'list',
	EMPTY: 'empty',
}; let $n = null; function Fn(t) {
	$n = t;
} class jn {
	constructor(t, e, n = null) {
		t.startsWith('global.') ? (this.global = !0, this.key = t.slice(7)) : (this.global = !1, this.key = t), this.value = e, this.kind = n;
	}toString() {
		return String(this.value ?? '');
	}valueOf() {
		return this.value;
	}
} function Bn(t, e, n) {
	let r = t.get(e); r || (r = new Set(), t.set(e, r)), r.add(n);
} class Vn {
	constructor(t, e, n) {
		this.source = t ?? null, this.realm = e, this.cache = new WeakMap(), this.component = n ?? null, this.propertyIndex = n?.propertyIndex ?? null;
	}setValue(t, e) {
		Q(this.source, t, e);
	}create(t, e = '') {
		return !o(t) || ArrayBuffer.isView(t) || t instanceof ArrayBuffer ? t : W(this.cache, t, e, zn, this);
	}
} class Wn {
	constructor(t, e, n) {
		this.target = t, this.factory = e, this.path = n;
	}has(t) {
		return this.target.has(t);
	}get(t) {
		return this.target.get(t);
	}add(t) {
		return this.target.add(t), this.target;
	}set(t, e) {
		return this.target.set(t, e), this.target;
	}delete(t) {
		return this.target.delete(t);
	}clear() {
		return this.target.clear();
	}forEach(t) {
		return this.target.forEach(t);
	}keys() {
		return this.target.keys();
	}values() {
		return this.target.values();
	}entries() {
		return this.target.entries();
	} get size() {
		if ($n) {
			const t = this.factory; const e = t.propertyIndex; const n = U(this.path, 'size'); e && e.hasNonReactive && e.nonReactivePaths.has(n) || Bn($n, t.realm, n);
		} return this.target.size;
	}[Symbol.iterator]() {
		return this.target[Symbol.iterator]();
	}
} class Un {
	static instance = new Un(); get(t, e, n) {
		return e === pn ? {
			realm: t.factory.realm,
			path: t.path,
		} : Reflect.get(t, e, n);
	}set(t, e, n) {
		const r = t.factory; const s = U(t.path, e); return r.source ? (r.setValue(s, n), !0) : Reflect.set(t.target, e, n);
	}getPrototypeOf(t) {
		return E(t.target) ? Map.prototype : Set.prototype;
	}
} class zn {
	constructor(t, e) {
		this.factory = t, this.path = e;
	} static build(t, e, n) {
		if (S(t) || E(t)) {
			const r = new Wn(t, n, e); return new Proxy(r, Un.instance);
		} return new Proxy(t, new zn(n, e));
	}get(t, e) {
		const n = this.factory; if (e === pn) {
			return {
				realm: n.realm,
				path: this.path,
			};
		} if (u(e)) {
			return Reflect.get(t, e);
		} const r = n.propertyIndex; if ('' === this.path && r?.hasAccessors && r.getters.has(e)) {
			return $n && Bn($n, n.realm, e), r.getters.get(e).call(n.component);
		} const s = Reflect.get(t, e); const i = U(this.path, e); return !a(s) && $n && (r && r.hasNonReactive && r.nonReactivePaths.has(i) || Bn($n, n.realm, i)), o(s) ? n.create(s, i) : s;
	}set(t, e, n) {
		const r = this.factory; const s = U(this.path, e); return r.source ? (r.setValue(s, n), !0) : Reflect.set(t, e, n);
	}
} function Kn(t, e) {
	const n = e?.stateProxy ?? t; const r = e ? bn(e) : null; return new Vn(n, r, e ?? null).create(t ?? {}, '');
} function _n(t) {
	return new Vn(t, In, null).create(t ?? {}, '');
} function qn(t, e) {
	return new jn(String(t ?? ''), e, null);
} function Hn(t, e, n) {
	return a(t) ? (t.contentKind = n, t) : new jn(String(t ?? ''), e, n);
}qn.text = function(t, e) {
	return Hn(t, e, Dn.TEXT);
}, qn.html = function(t, e) {
	return Hn(t, e, Dn.HTML);
}, qn.component = function(t, e) {
	return Hn(t, e, Dn.COMPONENT);
}; class Gn extends jn {
	static isListBinding(t) {
		return t instanceof Gn;
	}constructor(t, e, n, r = null) {
		super(t, null), this.renderFn = e, this.keyFn = n, this.filterFn = r;
	}
} class Xn extends Gn {
	static isRemoteListBinding(t) {
		return t instanceof Xn;
	}constructor(t, e, n, r, s) {
		super(t, e, n, r), this.remoteConfig = s;
	}
} function Yn(t) {
	if (!t) {
		return !1;
	} const e = t.constructor; return e === jn || e === Gn || e === Xn;
} class Jn extends fn {
	#e; constructor(t, e) {
		super(), this.component = t, this.#e = e;
	}getValue(t) {
		if (t) {
			return B(this.#e, t);
		}
	}onFlush() {
		const t = this.component.updateView(); f(t) && t.catch(I);
	}
} class Zn {
	constructor(t, e) {
		this.component = t, this.bus = e, this.global = !1, this.private = !0, this.cache = new WeakMap(), this.rootProxy = null;
	}read(t) {
		return this.bus.getValue(t);
	}write(t, e) {
		this.rootProxy && Q(this.rootProxy, t, e);
	}
} class Qn {
	constructor(t, e) {
		this.realm = t, this.path = e;
	} static build(t, e, n) {
		return new Proxy(t, new Qn(n, e));
	}get(t, e) {
		if (e === pn) {
			return {
				realm: this.realm,
				path: this.path,
			};
		} if (u(e)) {
			return Reflect.get(t, e);
		} const n = Reflect.get(t, e); const r = U(this.path, e); if ($n && 'function' != typeof n && Bn($n, this.realm, r), l(n) || w(n)) {
			const t = this.realm.cache; let e = t.get(n); e || (e = new Map(), t.set(n, e)); const s = e.get(r); if (s) {
				return s;
			} const i = Qn.build(n, r, this.realm); return e.set(r, i), i;
		} return n;
	}set(t, e, n) {
		if (t[e] === n) {
			return !0;
		} const r = U(this.path, e); return Reflect.set(t, e, n), this.realm.bus.notify(r), !0;
	}deleteProperty(t, e) {
		if (!Object.hasOwn(t, e) || null === t[e]) {
			return !0;
		} const n = U(this.path, e); return t[e] = null, this.realm.bus.notify(n), !0;
	}
} const tr = Object.freeze({
	__proto__: null,
	observePrivate(t, e, n) {
		const r = t?.[pn]; const s = r?.realm?.bus; if (!s) {
			return null;
		} if (l(e) && void 0 === n) {
			const t = Object.keys(e); const n = []; for (let r = 0; r < t.length; r += 1) {
				n.push(s.subscribe(t[r], e[t[r]]));
			} return new hn(new un(), n);
		} if (w(e)) {
			const t = []; for (let r = 0; r < e.length; r += 1) {
				t.push(s.subscribe(e[r], n));
			} return new hn(new un(), t);
		} return s.subscribe(String(e ?? ''), n);
	},
	privateState(t = {}) {
		const e = o(t) ? t : {}; const n = new Jn(this, e); const r = new Zn(this, n); const s = Qn.build(e, '', r); return r.rootProxy = s, s;
	},
}); const er = new Map(); const nr = new Map(); const
	rr = new Set(); function sr(t, e) {
	er.set(t, String(e).replace(/\/+$/, ''));
} function ir() {
	return er;
} function or(t) {
	const e = t.indexOf('-'); if (-1 === e) {
		return null;
	} const n = er.get(t.slice(0, e)); if (!n) {
		return null;
	} const r = t.slice(e + 1).split('_'); return `${n}/${r.join('/')}/${r[r.length - 1]}.js`;
} function lr(t) {
	if (customElements.get(t)) {
		return null;
	} const e = nr.get(t); if (e) {
		return e;
	} if (rr.has(t)) {
		return null;
	} const n = or(t); if (!n) {
		return null;
	} const r = import(n).then(() => {
		return (nr.delete(t), customElements.whenDefined(t));
	}, (e) => {
		nr.delete(t), rr.add(t), console.error(`[resolver] failed to load <${t}> from ${n}`, e);
	}); return nr.set(t, r), r;
} function cr(t) {
	if (!t || !t.querySelectorAll) {
		return null;
	} const e = t.querySelectorAll(':not(:defined)'); if (0 === e.length) {
		return null;
	} const n = new Set(); let r = null; for (let t = 0; t < e.length; t++) {
		const s = e[t].localName; if (n.has(s)) {
			continue;
		} n.add(s); const i = lr(s); i && (r ??= []).push(i);
	} return r;
} function ar(t, e) {
	if (!0 === t.config?.fastLifecycle) {
		return;
	} const n = lt(t); if (!n.length) {
		return;
	} const r = new Array(n.length); for (let t = 0; t < n.length; t++) {
		r[t] = n[t].lifecycle[e];
	} return Promise.all(r);
} function ur(t, e) {
	return e.realm.bus.subscribe(t, e.handler, e.component);
} const hr = Object.freeze({
	__proto__: null,
	finishRender(t) {
		t(), this.lifecycle.whenRenderedResolver === t && (this.lifecycle.whenRenderedResolver = null);
	},
	async handleLive() {
		await Ze(), this.isConnected ? (this.classList.remove('mounting'), await ar(this, Ve.LIVE), this.isConnected ? (await (this.onLive?.()), this.phase === re.MOUNTED && (this.phase = re.LIVE), _(this.lifecycle, Ve.LIVE), this.installObserver()) : _(this.lifecycle, Ve.LIVE)) : _(this.lifecycle, Ve.LIVE);
	},
	handleMount() {
		const t = ar(this, Ve.MOUNTED); if (t) {
			return (async function(t, e) {
				if (await e, t.isConnected) {
					if (t.onMount) {
						const e = t.onMount(); e && 'function' == typeof e.then && await e;
					}t.phase === re.RENDERED && (t.phase = re.MOUNTED), _(t.lifecycle, Ve.MOUNTED);
				} else {
					_(t.lifecycle, Ve.MOUNTED);
				}
			}(this, t));
		} if (this.isConnected) {
			if (this.onMount) {
				const t = this.onMount(); if (t && 'function' == typeof t.then) {
					return (async function(t, e) {
						await e, t.phase === re.RENDERED && (t.phase = re.MOUNTED), _(t.lifecycle, Ve.MOUNTED);
					}(this, t));
				}
			} this.phase === re.RENDERED && (this.phase = re.MOUNTED), _(this.lifecycle, Ve.MOUNTED);
		} else {
			_(this.lifecycle, Ve.MOUNTED);
		}
	},
	handleRendered(t, e, n) {
		const r = ar(this, Ve.RENDERED); if (r) {
			return (async function(t, e, n, r, s) {
				if (await s, e === t.renderSeq) {
					if (t.onRendered) {
						const e = t.onRendered(); e && 'function' == typeof e.then && await e;
					}n && t.phase === re.CONNECTED && (t.phase = re.RENDERED), t.finishRender(r);
				} else {
					t.finishRender(r);
				}
			}(this, t, e, n, r));
		} if (t === this.renderSeq) {
			if (this.onRendered) {
				const r = this.onRendered(); if (r && 'function' == typeof r.then) {
					return (async function(t, e, n, r, s) {
						await s, e === t.renderSeq ? (n && t.phase === re.CONNECTED && (t.phase = re.RENDERED), t.finishRender(r)) : t.finishRender(r);
					}(this, t, e, n, r));
				}
			}e && this.phase === re.CONNECTED && (this.phase = re.RENDERED), this.finishRender(n);
		} else {
			this.finishRender(n);
		}
	},
	invalidateRender() {
		this.templateBuilt = !1, this.renderDepDirty = !1, this.isConnected && this.updateView();
	},
	markRenderDirty() {
		this.templateBuilt = !1, this.renderDepDirty = !0;
	},
	markRenderDirtyGlobal() {
		this.templateBuilt = !1, this.renderDepDirty = !0, rn.add(this);
	},
	async renderView() {
		const t = ue.mark('renderView'); try {
			this.templateBuilt = !1; const t = ++this.renderSeq; if (!this.lifecycle.whenRenderedResolver) {
				const t = Promise.withResolvers(); this.lifecycle.whenRendered = t.promise, this.lifecycle.whenRenderedResolver = t.resolve;
			} const e = this.lifecycle.whenRenderedResolver; const n = new Map(); const r = !this.firstRenderDone; const s = !r && !0 === this.renderDepDirty; this.renderDepDirty = !1, this.isRendering = !0; let i = !1; try {
				if (this.beforeRender) {
					const t = this.beforeRender(); f(t) ? !1 === await t && (i = !0) : !1 === t && (i = !0);
				} if (t !== this.renderSeq) {
					return this.isRendering = !1, void this.finishRender(e);
				} if (i) {
					return this.isRendering = !1, void this.finishRender(e);
				} this.renderTracking = !0; const r = this.STATE ?? {}; this.renderProxy && this.renderProxyState === r || (this.renderProxy = Kn(r, this), this.renderProxyState = r), Fn(n); const s = this.render?.(); if (Fn(null), f(s) && await s, t !== this.renderSeq) {
					return this.isRendering = !1, void this.finishRender(e);
				} cr(this.shadowRoot ?? this);
			} finally {
				if (Fn(null), t === this.renderSeq) {
					this.renderTracking = !1; const t = this.tplBoundKeys; if (t && t.size) {
						const e = n.get(bn(this)); e && t.forEach(e.delete, e);
					} this.subscribeRenderDeps(n);
				}
			} if (t !== this.renderSeq) {
				return void this.finishRender(e);
			} if (this.templateBuilt = !0, s) {
				return this.isRendering = !1, void this.finishRender(e);
			} if (this.onRender) {
				const t = this.onRender(); t && 'function' == typeof t.then && await t;
			} if (t !== this.renderSeq) {
				return void this.finishRender(e);
			} const o = this.handleRendered(t, r, e); if (o && 'function' == typeof o.then && await o, !r) {
				return void (this.isRendering = !1);
			} this.firstRenderDone = !0, this.isRendering = !1; const l = this.handleMount(); l && 'function' == typeof l.then && await l; const c = this.handleLive(); c && 'function' == typeof c.then && await c;
		} finally {
			ue.measure('renderView', t);
		}
	},
	subscribeRenderDeps(t) {
		const e = this.renderDepUnsubs; if (e.size) {
			const n = [...e.keys()]; for (let r = 0; r < n.length; r++) {
				const s = n[r]; t && t.has(s) || (G(e.get(s)), e.delete(s));
			}
		} if (!t || 0 === t.size) {
			return;
		} const n = [...t]; for (let t = 0; t < n.length; t++) {
			const r = n[t][0]; const s = n[t][1]; let i = e.get(r); i || (i = new Map(), e.set(r, i)), Y(i, s, ur, {
				realm: r,
				handler: r.global ? this.markRenderDirtyGlobal : this.markRenderDirty,
				component: this,
			});
		}
	},
}); const dr = new Map(); async function fr(t) {
	const e = String(t); if (dr.has(e)) {
		return dr.get(e);
	} const n = new CSSStyleSheet(); const
		r = await fetch(t); if (r.ok) {
		const t = await r.text(); n.replaceSync(t), dr.set(e, n);
	} else {
		console.warn(`Failed to load stylesheet: ${t} (status: ${r.status})`);
	} return n;
} const pr = await Promise.all(Object.entries({
	'uwc.reset': 'reset.css',
	'uwc.elements': 'elements-forms.css',
	'uwc.elements-buttons': 'elements-buttons.css',
	'uwc.prose': 'elements-prose.css',
	'uwc.util-spacing': 'util-spacing.css',
	'uwc.util-layout': 'util-layout.css',
	'uwc.util-type': 'util-type.css',
	'uwc.util-elevation': 'util-elevation.css',
	'uwc.util-surface': 'util-surface.css',
	'uwc.animations': 'animations.css',
	'uwc.effects': 'effects.css',
}).map((t) => {
	return fr(new URL(`./modules/${t[1]}`, import.meta.url)).then((e) => {
		return [t[0], e];
	});
})); const mr = Object.fromEntries(pr); function gr(t) {
	return w(t) ? t : [t];
} function yr(t, e) {
	for (let n = 0; n < e.length; n += 1) {
		t.add(e[n]);
	} return new hn(t, e);
} class br {
	constructor(t, e, n, r) {
		this.component = t, this.callback = e, this.previousValue = n, this.nextValue = n, this.changedPath = '', this.fireOnce = !0 === r?.once, this.subscription = null;
	}handle(t, e) {
		this.nextValue = t, this.changedPath = e, tn(br.prototype.fire, this);
	}fire() {
		const t = this.nextValue; const e = this.previousValue; const n = this.changedPath; this.previousValue = t, this.callback.call(this.component, t, e, n), this.fireOnce && this.subscription && this.subscription.unsubscribe();
	}
} function vr(t, e, n, r) {
	const s = String(e ?? ''); const i = gn(t); const o = B(t.STATE, s); const l = new br(t, n, o, r); const c = i.subscribe(s, br.prototype.handle, l); return l.subscription = c, !0 === r?.immediate && (n.call(t, o, void 0, s), !0 === r.once && c.unsubscribe()), c;
} class wr {
	constructor(t, e) {
		this.callback = t, this.previousValue = e;
	}handle(t, e) {
		const n = this.callback(t, this.previousValue, e); return this.previousValue = t, n;
	}
} function Er(t, e) {
	const n = On.get(e); const r = new wr(t, n); return On.bus.subscribe(e, wr.prototype.handle, r);
} const Sr = Object.freeze({
	__proto__: null,
	observeAsync(t, e, n) {
		const r = gr(t); const s = new Array(r.length); for (let t = 0; t < r.length; t++) {
			s[t] = vr(this, r[t], e, n);
		} return yr(this.stateUnsubs ??= new un(), s);
	},
	observeGlobal(t, e) {
		const n = gr(t); const r = new Array(n.length); for (let t = 0; t < n.length; t++) {
			r[t] = Er(e, n[t]);
		} return yr(this.globalUnsubs ??= new un(), r);
	},
	unobserveGlobal(t) {
		this.globalUnsubs?.removeByKey(String(t ?? ''));
	},
}); function Tr(t, e) {
	const n = setTimeout(() => {
		this.timeouts?.delete(n), t();
	}, e); return (this.timeouts ??= new Set()).add(n), n;
} function xr(t) {
	clearTimeout(t), this.timeouts?.delete(t);
} function Cr() {
	this.timeouts && (this.timeouts.forEach(clearTimeout), this.timeouts.clear());
} function Rr(t, e) {
	const n = setInterval(t, e); return (this.intervals ??= new Set()).add(n), n;
} function Mr(t) {
	clearInterval(t), this.intervals?.delete(t);
} function kr() {
	this.intervals && (this.intervals.forEach(clearInterval), this.intervals.clear());
} function Lr(t, e, n) {
	if (null != e && !(e instanceof CSSStyleSheet || c(e))) {
		throw new TypeError(`${n}.styles.${t} must be CSSStyleSheet | string | null | undefined.`);
	}
} const Nr = Object.freeze({
	STRING: 'string',
	NUMBER: 'number',
	BOOLEAN: 'boolean',
	BIGINT: 'bigint',
	SYMBOL: 'symbol',
	FUNCTION: 'function',
	UNDEFINED: 'undefined',
	ARRAY: 'array',
	MAP: 'map',
	SET: 'set',
	OBJECT: 'object',
	NULL: 'null',
}); const Pr = new Set([
	Nr.NUMBER, Nr.BOOLEAN, Nr.BIGINT,
]); function Ar(t) {
	if (null === t) {
		return Nr.NULL;
	} if (w(t)) {
		return Nr.ARRAY;
	} if (E(t)) {
		return Nr.MAP;
	} if (S(t)) {
		return Nr.SET;
	} const e = typeof t; return 'object' === e ? Nr.OBJECT : e;
} function Or(t, e, n, r, s) {
	const i = Object.keys(t); for (let o = 0; o < i.length; o++) {
		const c = i[o]; const a = Object.getOwnPropertyDescriptor(t, c); if (!a || a.get || a.set) {
			continue;
		} const u = a.value; const h = e ? `${e}.${c}` : c; const d = Ar(u); n.set(h, d), Pr.has(d) ? r.set(h, Dn.TEXT) : d === Nr.OBJECT && s < 8 && l(u) && Or(u, h, n, r, s + 1);
	}
} function Ir(t) {
	const e = new Map(); const
		n = new Map(); return t && Or(t, '', e, n, 0), {
		types: e,
		kinds: n,
	};
} function Dr(t) {
	const e = []; let n = t; for (;n && n !== HTMLElement;) {
		e.push(n), n = R(n);
	} return e.reverse(), e;
} function $r(t, e, n) {
	if (x(t, n)) {
		return t[n];
	} const r = (function(t, e) {
		const n = R(t); if (null !== n && R(n) === HTMLElement) {
			return x(t, e) ? {
				...t[e],
			} : {};
		} const r = Dr(t); const s = {}; for (let t = 0; t < r.length; t++) {
			const n = r[t]; x(n, e) && T(s, n[e]);
		} return s;
	}(t, e)); return Object.defineProperty(t, n, {
		value: r,
		configurable: !0,
		writable: !0,
	}), r;
} function Fr(t, e, n) {
	Object.defineProperty(t, e, n);
} function jr(t, e, n) {
	const r = Object.getOwnPropertyDescriptors(e); const s = Object.keys(r); for (let e = 0; e < s.length; e++) {
		const i = s[e]; const o = r[i]; if (o.get || o.set) {
			Fr(t, i, o); continue;
		} if (!n) {
			Fr(t, i, o); continue;
		} const l = Object.getOwnPropertyDescriptor(t, i); Fr(t, i, {
			value: J(!l || l.get || l.set ? void 0 : l.value, o.value),
			writable: !0,
			enumerable: !0,
			configurable: !0,
		});
	}
} function Br(t, e) {
	let n = t; for (;n && n !== HTMLElement.prototype;) {
		if (x(n, e)) {
			return !0;
		} n = R(n);
	} return !1;
} function Vr(t) {
	if (x(t, 'mergedState')) {
		return t.mergedState;
	} const e = (function(t) {
		const e = !1 === t.mergeState; const n = !0 === t.mergeObjects; const r = {}; if (e) {
			return x(t, 'state') && jr(r, t.state, !1), r;
		} const s = Dr(t); for (let t = 0; t < s.length; t++) {
			const e = s[t]; x(e, 'state') && jr(r, e.state, n);
		} return r;
	}(t)); return Object.defineProperty(t, 'mergedState', {
		value: e,
		configurable: !0,
		writable: !0,
	}), (function(t, e) {
		const n = t.prototype; if (!n) {
			return;
		} const r = Object.getOwnPropertyNames(e); for (let t = 0; t < r.length; t++) {
			const e = r[t]; 'state' !== e && 95 !== e.charCodeAt(0) && (Br(n, e) || Object.defineProperty(n, e, {
				configurable: !0,
				enumerable: !1,
				get() {
					const t = this.stateProxy; return t ? t[e] : this.STATE ? this.STATE[e] : void 0;
				},
				set(t) {
					const n = this.stateProxy; n ? n[e] = t : Object.defineProperty(this, e, {
						configurable: !0,
						enumerable: !0,
						writable: !0,
						value: t,
					});
				},
			}));
		}
	}(t, e)), e;
} function Wr(t) {
	return $r(t, 'attrs', 'mergedAttrs');
} function Ur(t) {
	return $r(t, 'properties', 'mergedProperties');
} function zr(t) {
	if (x(t, 'mergedPropertyIndex')) {
		return t.mergedPropertyIndex;
	} const e = Ur(t); const n = Vr(t); const r = Ir(n); const s = r.types; const i = r.kinds; const o = Object.keys(e); const l = new Set(); const c = new Map(); const a = new Map(); for (let t = 0; t < o.length; t++) {
		const n = o[t]; const r = e[n]; r && (!1 === r.react && l.add(n), r.kind && i.set(n, r.kind));
	}!(function(t, e, n) {
		const r = Object.getOwnPropertyDescriptors(t); const s = Object.getOwnPropertyNames(r); for (let t = 0; t < s.length; t++) {
			const i = s[t]; const o = r[i]; o.get && e.set(i, o.get), o.set && n.set(i, o.set);
		}
	}(n, c, a)); const u = {
		hasProperties: o.length > 0,
		hasNonReactive: l.size > 0,
		hasKinds: i.size > 0,
		hasTypes: s.size > 0,
		hasAccessors: c.size > 0 || a.size > 0,
		nonReactivePaths: l,
		kinds: i,
		types: s,
		getters: c,
		setters: a,
	}; return Object.defineProperty(t, 'mergedPropertyIndex', {
		value: u,
		configurable: !0,
		writable: !0,
	}), u;
} const Kr = new Map(); const _r = new WeakMap(); const
	qr = new WeakSet(); function Hr(t) {
	const e = Dr(t); const n = new Map(); return P(e, (t) => {
		x(t, 'styles') && ((function(t, e) {
			if (void 0 === t) {
				return;
			} if (!o(t) || w(t)) {
				throw new TypeError(`${e}.styles must be an object map of { name: CSSStyleSheet | string | null }.`);
			} const n = Object.keys(t); for (let r = 0; r < n.length; r++) {
				Lr(n[r], t[n[r]], e);
			}
		}(t.styles, t.name)), A(t.styles, (e, r) => {
			n.set(e, {
				owner: t,
				value: r,
			});
		}));
	}), n;
} function Gr(t) {
	const e = t.value; if (null != e) {
		if (e instanceof CSSStyleSheet) {
			!(function(t) {
				if (_r.has(t)) {
					return;
				} const e = document.createElement('style'); e.textContent = (function(t) {
					const e = t.cssRules; let n = ''; for (let t = 0; t < e.length; t++) {
						n += `${e[t].cssText}\n`;
					} return n;
				}(t)), _r.set(t, e), document.head.appendChild(e);
			}(e));
		} else if (c(e)) {
			if (!x(t.owner, 'url')) {
				throw new TypeError(`${t.owner.name}.styles: relative path "${e}" requires \`static url = import.meta.url\` on ${t.owner.name}.`);
			} !(function(t) {
				if (Kr.has(t)) {
					return;
				} const e = document.createElement('link'); e.rel = 'stylesheet', e.href = t, Kr.set(t, e), document.head.appendChild(e);
			}(new URL(e, t.owner.url).toString()));
		}
	}
} const Xr = new Map(); const
	Yr = 'uwc.components'; function Jr(t, e) {
	if (w(t)) {
		return Promise.all(t.map((t) => {
			return Jr(t, e);
		}));
	} const n = e ? new URL(t, e).toString() : t; if (Xr.has(n)) {
		return Xr.get(n);
	} if (e) {
		const t = fr(n); return Xr.set(n, t), t;
	} const r = new CSSStyleSheet(); return r.replaceSync(t), Xr.set(n, r), r;
} async function Zr(t) {
	const e = Hr(t); const n = []; const r = []; e.forEach((t, e) => {
		const {
			owner: s, value: i,
		} = t; if (null == i) {
			return;
		} if (i instanceof CSSStyleSheet) {
			return void n.push({
				key: e,
				sheet: i,
			});
		} if (!x(s, 'url')) {
			throw new TypeError(`${s.name}.styles.${e}: relative path "${i}" requires \`static url = import.meta.url\` on ${s.name}.`);
		} const o = {
			key: e,
			sheet: null,
		}; n.push(o), r.push(Jr(i, s.url).then((t) => {
			o.sheet = (function(t) {
				return t === globalThis.WebComponent || t && 'WebComponent' === t.name;
			}(s)) ? t : (function(t) {
					if (!(t instanceof CSSStyleSheet)) {
						return t;
					} const e = t.cssRules; let n = ''; for (let t = 0; t < e.length; t++) {
						n += `${e[t].cssText}\n`;
					} const r = new CSSStyleSheet(); return r.replaceSync(function(t) {
						return `@layer ${Yr} {\n${t}\n}`;
					}(n)), r;
				}(t));
		}));
	}), await Promise.all(r); const s = new Map(); return P(n, (t) => {
		s.set(t.key, t.sheet);
	}), {
		map: s,
		array: Object.freeze([...s.values()]),
	};
} function Qr(t) {
	if (x(t, 'compiledStylesPromise')) {
		return t.compiledStylesPromise;
	} const e = Zr(t).then((e) => {
		return (t.compiledStyles = e.map, t.compiledStylesArray = e.array, e);
	}); return Object.defineProperty(t, 'compiledStylesPromise', {
		value: e,
		configurable: !0,
		writable: !0,
	}), e;
} const ts = new Set(); function es(t, e) {
	if (!(t instanceof CSSStyleSheet)) {
		return null;
	} const n = t.cssRules; let r = ''; for (let t = 0; t < n.length; t++) {
		r += `${n[t].cssText}\n`;
	} const s = new CSSStyleSheet(); return s.replaceSync(`@layer ${Yr} {\n@scope (${e}) {\n${(function(t) {
		return t.replace(/:host\(([^)]*)\)/g, ':scope$1').replace(/:host(?![-\w(])/g, ':scope');
	}(r))}\n}\n}`), s;
} function ns(t, e, n) {
	if (ts.has(t)) {
		return;
	} ts.add(t); const r = Dr(t)[0]; const s = Hr(t); const i = [...e]; const o = []; for (let t = 0; t < i.length; t++) {
		const e = i[t][0]; const l = s.get(e); if (l && l.owner === r) {
			continue;
		} const c = es(i[t][1], n); c && o.push(c);
	}o.length && (document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...o]);
} const rs = new WeakMap(); function ss() {
	return document.documentElement.dataset.theme || '';
} function is(t) {
	const e = rs.get(t); if (e) {
		return e;
	} const n = Dr(t); const r = []; for (let t = 0; t < n.length; t++) {
		const e = n[t]; x(e, 'themes') && w(e.themes) && x(e, 'url') && r.push({
			layerClass: e,
			key: `theme:${e.name}`,
		});
	} return rs.set(t, r), r;
} const os = new Map(); const
	ls = new Set(); function cs(t) {
	const e = os.get(t.type); if (!e || 0 === e.size) {
		return;
	} const n = Array.from(e); for (let e = 0; e < n.length; e++) {
		n[e].invoke(t, null);
	}
} const as = new Map(); const
	us = new Set(); function hs(t) {
	const e = as.get(t.type); if (!e || 0 === e.size) {
		return;
	} const n = Array.from(e); for (let e = 0; e < n.length; e++) {
		n[e].invoke(t, null);
	}
} const ds = new WeakMap(); class fs {
	ownerRef = null; kind = ''; eventName = ''; selector = ''; scope = null; handler = null; fireOnce = !1; signal = null; subscribed = !1; static create(t, e, n, r, s) {
		const i = new fs(); return i.ownerRef = t ? new WeakRef(t) : null, i.kind = e, i.eventName = n, i.handler = r, i.fireOnce = o(s) && !0 === s.once, i.signal = o(s) && s.signal || null, i;
	}invoke(t, e) {
		let n = null; if (this.ownerRef && (n = this.ownerRef.deref(), !n)) {
			return void this.unsubscribe();
		} if (this.fireOnce && this.unsubscribe(), !a(this.handler)) {
			return;
		} const r = n || e || null; const s = this.handler.call(r, t, e || n, this.eventName); f(s) && s.catch((e) => {
			!(function(t, e, n, r) {
				queueMicrotask(() => {
					throw Object.assign(p(t) ? t : new Error(String(t)), {
						element: n,
						event: e,
						eventName: r,
					});
				});
			}(e, t, n, this.eventName));
		});
	}handleEvent(t) {
		'abort' === t.type && this.unsubscribe();
	}subscribe() {
		if (this.subscribed) {
			return this;
		} if (this.signal?.aborted) {
			return this;
		} let t = null; if (this.ownerRef && (t = this.ownerRef.deref(), !t)) {
			return this;
		} if ('bus' === this.kind) {
			let t = os.get(this.eventName); t || (t = new Set(), os.set(this.eventName, t)), t.add(this), e = this.eventName, ls.has(e) || (document.addEventListener(e, cs, {
				capture: !0,
			}), ls.add(e));
		} else if ('env' === this.kind) {
			let t = as.get(this.eventName); t || (t = new Set(), as.set(this.eventName, t)), t.add(this), (function(t) {
				us.has(t) || (globalThis.addEventListener(t, hs), us.add(t));
			}(this.eventName));
		} else if ('scoped' === this.kind) {
			const t = (function(t, e) {
				let n = ds.get(t); n || (n = new Map(), ds.set(t, n)); const r = n.get(e); if (r) {
					return r;
				} const s = {
					eventName: e,
					scope: t,
					entries: new Set(),
					handleEvent(e) {
						if (!s.entries.size) {
							return;
						} const n = e.composedPath(); const r = n.length ? n[0] : e.target; if (!r || 'function' != typeof r.closest) {
							return;
						} const i = -1 !== n.indexOf(t); const o = Array.from(s.entries); for (let n = 0; n < o.length; n++) {
							const s = o[n]; const l = r.closest(s.selector); l && (i || t.contains(l)) && s.invoke(e, l);
						}
					},
				}; return t.addEventListener(e, s), n.set(e, s), s;
			}(this.scope, this.eventName)); t.entries.add(this);
		} var e; return t && (t.delegateEntries ??= new Set()).add(this), this.subscribed = !0, this.signal && this.signal.addEventListener('abort', this, {
			once: !0,
		}), this;
	}unsubscribe() {
		if (!this.subscribed) {
			return this.detachSignal(), this;
		} if ('bus' === this.kind) {
			const e = os.get(this.eventName); e && (e.delete(this), 0 === e.size && (os.delete(this.eventName), t = this.eventName, ls.has(t) && (document.removeEventListener(t, cs, {
				capture: !0,
			}), ls.delete(t))));
		} else if ('env' === this.kind) {
			const t = as.get(this.eventName); t && (t.delete(this), 0 === t.size && (as.delete(this.eventName), (function(t) {
				us.has(t) && (globalThis.removeEventListener(t, hs), us.delete(t));
			}(this.eventName))));
		} else {
			'scoped' === this.kind && (function(t, e, n) {
				const r = ds.get(t); if (!r) {
					return;
				} const s = r.get(e); s && (s.entries.delete(n), 0 === s.entries.size && (t.removeEventListener(e, s), r.delete(e), 0 === r.size && ds.delete(t)));
			}(this.scope, this.eventName, this));
		} var t; if (this.ownerRef) {
			const t = this.ownerRef.deref(); t && t.delegateEntries?.delete(this);
		} return this.detachSignal(), this.subscribed = !1, this.scope = null, this;
	}detachSignal() {
		this.signal && (this.signal.removeEventListener('abort', this), this.signal = null);
	}
} function ps(t, e, n, r, s, i) {
	if (!c(e) || !e.trim()) {
		throw new TypeError('eventName must be a non-empty string');
	} if (!c(n) || !n.trim()) {
		throw new TypeError('selector must be a non-empty string');
	} if (!a(r)) {
		throw new TypeError('handler must be a function');
	} const o = s || t; if (!o) {
		throw new TypeError('scope must be provided when no owner is bound');
	} const l = fs.create(t, 'scoped', e.trim(), r, i); return l.selector = n.trim(), l.scope = o, l.subscribe(), l;
} function ms(t, e) {
	document.dispatchEvent(new CustomEvent(t, {
		bubbles: !0,
		composed: !0,
		detail: {
			data: e,
			source: null,
		},
	}));
} function gs(t) {
	return ne[t] ?? null;
} async function ys(t, e, n = {}) {
	const r = n.duration ?? 240; const s = n.easing ?? 'cubic-bezier(0.4,0,0.2,1)'; t.style.cssText += ';opacity:0;pointer-events:none;will-change:opacity', a(e) ? e(t) : e instanceof HTMLElement && (e.appendChild(t), console.log('Pre-render Appended element to mount point', e)), t.isWebComponent && await t.lifecycle.whenLive; const i = t.animate([
		{
			opacity: 0,
		}, {
			opacity: 1,
		},
	], {
		duration: r,
		easing: s,
	}); return await i.finished, i.commitStyles(), i.cancel(), t.style.opacity = '', t.style.pointerEvents = '', t.style.willChange = '', t;
} async function bs(t = {}) {
	const { Source: e } = t; return e.create(t.state, t.config);
} const vs = new Map(); const ws = new Set(); const
	Es = new WeakSet(); function Ss(t, e) {
	if ('string' != typeof t || !t) {
		throw new TypeError('registerBehavior: behaviorName must be a non-empty string');
	} vs.set(t, e), ws.add(t), 'function' != typeof e?.init || Es.has(e) || (Es.add(e), e.init());
} function Ts(t) {
	return vs.get(t);
} function xs(t) {
	return ws.has(t);
} function Cs() {
	return ws;
} const Rs = /(auto|scroll|overlay)/; function Ms(t) {
	return t && '#' === t[0] ? t.slice(1) : t;
} function ks(t) {
	return 'number' == typeof t ? t : 'string' == typeof t && parseFloat(t) || 0;
} class Ls {
	static create(t, e, n) {
		return new Ls(t, e, n);
	}constructor(t, e, n) {
		this.component = t, this.stateKey = e, this.config = n.remoteConfig, this.keyFn = n.keyFn, this.cursor = null, this.hasMore = !0, this.loading = !1, this.error = '', this.started = !1, this.mounted = !1, this.disposed = !1, this.loadToken = 0, this.scroller = null, this.scrollTarget = null, this.paused = !1, this.page = 1, this.anchorElement = null, this.loadMoreElement = null, this.prevElement = null, this.nextElement = null, this.abortController = null, this.scrollReportUninstall = null, this.seenKeys = new Set(), this.autoFillCount = 0, this.fillFrame = 0, this.maxAutoFill = Number.isFinite(this.config.maxAutoFill) ? this.config.maxAutoFill : 8;
	} get exhausted() {
		return this.started && !this.hasMore;
	} get hasPrev() {
		return this.page > 1;
	}attach(t) {
		this.disposed || (this.anchorElement = t, this.detachDom(), this.wireTriggers(t), this.mounted ? this.reflectRefs() : (this.mounted = !0, !1 === this.config.auto ? this.reflectRefs() : this.reset()));
	}wireTriggers(t) {
		const e = this.config; const n = (e.scroller ? this.component.getRef(Ms(e.scroller)) : null) ?? (function(t) {
			let e = t; for (;e && 1 === e.nodeType;) {
				const t = getComputedStyle(e).overflowY; if (Rs.test(t) && e.scrollHeight > e.clientHeight) {
					return e;
				} const n = e.parentNode; e = n && 11 === n.nodeType ? n.host : n;
			} return null;
		}(t)); if (n) {
			this.scroller = n, this.scrollTarget = n;
		} else {
			const t = globalThis.document; this.scroller = t.scrollingElement ?? t.documentElement, this.scrollTarget = globalThis;
		} const r = e.mode ?? 'scroll'; if ('scroll' !== r && 'both' !== r || !this.scrollTarget || this.scrollTarget.addEventListener('scroll', this, {
			passive: !0,
		}), 'button' === r || 'both' === r) {
			const t = e.loadMore ? this.component.getRef(Ms(e.loadMore)) : null; t && (this.loadMoreElement = t, t.addEventListener('click', this));
		} if ('paged' === r && (this.wirePagedButton(e.prev, 'prevElement'), this.wirePagedButton(e.next, 'nextElement')), e.scrollReport && this.scroller) {
			const t = Ts('scroll-report'); t && (this.scrollReportUninstall = t.install(this.scroller));
		}
	}wirePagedButton(t, e) {
		const n = t ? this.component.getRef(Ms(t)) : null; n && (this[e] = n, n.addEventListener('click', this));
	}detachDom() {
		this.scrollTarget && this.scrollTarget.removeEventListener('scroll', this), this.loadMoreElement && (this.loadMoreElement.removeEventListener('click', this), this.loadMoreElement = null), this.prevElement && (this.prevElement.removeEventListener('click', this), this.prevElement = null), this.nextElement && (this.nextElement.removeEventListener('click', this), this.nextElement = null), this.scrollReportUninstall && (this.scrollReportUninstall(), this.scrollReportUninstall = null), this.scroller = null, this.scrollTarget = null;
	}handleEvent(t) {
		if ('scroll' === t.type) {
			return void this.onScroll();
		} const e = t.currentTarget; e !== this.prevElement ? e !== this.nextElement ? this.loadMore() : this.goNext() : this.goPrev();
	}onScroll() {
		const t = this.scroller; if (!t || this.loading || this.exhausted || this.paused) {
			return;
		} const e = ks(this.config.prefetch); t.scrollTop + t.clientHeight >= t.scrollHeight - e && this.loadMore();
	}shouldAutoFill() {
		if (!0 !== this.config.fillViewport) {
			return !1;
		} const t = this.config.mode ?? 'scroll'; return ('scroll' === t || 'both' === t) && this.hasMore && !this.loading && !this.paused && !this.disposed;
	}isViewportFilled() {
		const t = this.anchorElement; const e = this.scroller; if (!t || !e) {
			return !0;
		} const n = t.getBoundingClientRect(); if (0 === n.height && 0 === n.width) {
			return !0;
		} const r = ks(this.config.prefetch); return n.bottom > this.resolveVisibleBottom(e) + r;
	}resolveVisibleBottom(t) {
		if (this.scrollTarget === globalThis) {
			const t = globalThis.document.documentElement; return t?.clientHeight ?? globalThis.innerHeight;
		} return t.getBoundingClientRect().bottom;
	}scheduleFillCheck() {
		!this.fillFrame && this.shouldAutoFill() && (this.fillFrame = requestAnimationFrame(() => {
			this.runFillCheck();
		}));
	}runFillCheck() {
		this.fillFrame = 0, this.shouldAutoFill() && (this.isViewportFilled() ? this.autoFillCount = 0 : this.autoFillCount >= this.maxAutoFill ? this.emit('fill-capped') : (this.autoFillCount += 1, this.load(!1)));
	}reset() {
		this.cursor = null, this.hasMore = !0, this.error = '', this.autoFillCount = 0, this.seenKeys.clear(); const t = this.component.state[this.stateKey]; return (!Array.isArray(t) || t.length > 0) && (this.component.state[this.stateKey] = []), this.load(!0);
	}refresh() {
		return this.reset();
	}loadMore() {
		return this.loading || this.exhausted || this.paused ? Promise.resolve() : this.load(!1);
	}goto(t) {
		return this.hasMore = !0, this.error = '', this.autoFillCount = 0, this.seenKeys.clear(), this.load(!0, t);
	}gotoPage(t) {
		const e = Number.isFinite(t) && t >= 1 ? t : 1; return this.goto(e);
	}goPrev() {
		return this.loading || !this.hasPrev ? Promise.resolve() : this.gotoPage(this.page - 1);
	}goNext() {
		return this.loading || !this.hasMore ? Promise.resolve() : this.gotoPage(this.page + 1);
	}setMode(t) {
		this.config.mode !== t && (this.config.mode = t, this.anchorElement && (this.detachDom(), this.wireTriggers(this.anchorElement)), 'paged' === t ? this.goto(this.page) : this.reflectRefs());
	}prepend(t) {
		if (!1 !== this.config.dedupe) {
			const e = this.keyFn(t, 0); if (this.seenKeys.has(e)) {
				return;
			} this.seenKeys.add(e);
		} const e = Array.isArray(this.component.state[this.stateKey]) ? this.component.state[this.stateKey] : []; this.component.state[this.stateKey] = [t].concat(e);
	} async load(t, e) {
		const n = this.config; if (!a(n.loader)) {
			return this.error = 'remoteList: no loader configured', void this.reflectRefs();
		} if (this.loading) {
			return;
		} this.loading = !0, this.started = !0, this.error = '', this.reflectRefs(), this.emit('loading'); const r = this.loadToken + 1; this.loadToken = r, this.abortController?.abort(); const s = new AbortController(); this.abortController = s; const i = null != e; let o = this.cursor; i ? (o = e, this.page = e) : t ? (o = null, this.page = 1) : 'number' == typeof o && (this.page = o); let l = null; let c = null; try {
			l = await n.loader.call(this.component, {
				reset: t && !i,
				cursor: o,
				signal: s.signal,
			});
		} catch (t) {
			c = t;
		} if (r !== this.loadToken) {
			return;
		} if (this.loading = !1, c || !l) {
			return this.error = c?.message || 'Could not load results', this.reflectRefs(), void this.emit('error');
		} const u = Array.isArray(l.items) ? l.items : []; const h = !1 === n.dedupe ? u : this.dropDuplicates(u); const d = Array.isArray(this.component.state[this.stateKey]) ? this.component.state[this.stateKey] : []; const f = t ? h : d.concat(h); D(d, f) || (this.component.state[this.stateKey] = f), this.cursor = l.nextCursor ?? null, this.hasMore = Boolean(l.hasMore), this.reflectRefs(), this.emit('loaded'), this.exhausted && this.emit('exhausted'), this.scheduleFillCheck();
	}dropDuplicates(t) {
		const e = []; for (let n = 0; n < t.length; n += 1) {
			const r = t[n]; const s = this.keyFn(r, n); this.seenKeys.has(s) || (this.seenKeys.add(s), e.push(r));
		} return e;
	}reflectRefs() {
		const t = this.config; if (t.spinner) {
			const e = this.component.getRef(Ms(t.spinner)); this.applyRefState(e, {
				active: this.loading,
			}, !this.loading, void 0);
		} if (this.loadMoreElement) {
			const t = this.loading || this.exhausted; this.applyRefState(this.loadMoreElement, {
				loading: this.loading,
				disabled: t,
				exhausted: this.exhausted,
			}, this.exhausted, t);
		} if (this.prevElement) {
			const t = this.loading || !this.hasPrev; this.applyRefState(this.prevElement, {
				disabled: t,
			}, !1, t);
		} if (this.nextElement) {
			const t = this.loading || !this.hasMore; this.applyRefState(this.nextElement, {
				disabled: t,
			}, !1, t);
		}
	}applyRefState(t, e, n, r) {
		t && (a(t.assignState) && t.assignState(e), n ? t.setAttribute('hidden', '') : t.removeAttribute('hidden'), !0 === r ? t.setAttribute('disabled', '') : !1 === r && t.removeAttribute('disabled'));
	}emit(t) {
		this.component.emit?.(`${this.stateKey}:${t}`, {
			key: this.stateKey,
			loading: this.loading,
			error: this.error,
			exhausted: this.exhausted,
			page: this.page,
		});
	}dispose() {
		this.disposed = !0, this.loadToken += 1, this.fillFrame && (cancelAnimationFrame(this.fillFrame), this.fillFrame = 0), this.abortController?.abort(), this.abortController = null, this.detachDom(), this.seenKeys.clear();
	}
} function Ns(t, e, n) {
	const r = n.key; let s = t.remoteControllers; s || (s = new Map(), t.remoteControllers = s); let i = s.get(r); return i || (i = Ls.create(t, r, n), s.set(r, i)), queueMicrotask(() => {
		i.attach(e);
	}), i;
} const Ps = /^[a-z_][a-z0-9_]*$/; const As = new FinalizationRegistry(({
	map: t, name: e,
}) => {
	void 0 === t.get(e)?.deref() && t.delete(e);
}); const Os = {
	get(t, e) {
		if (c(e)) {
			return t.get(e)?.deref();
		}
	},
	has: (t, e) => {
		return Boolean(c(e)) && void 0 !== t.get(e)?.deref();
	},
}; function Is(t) {
	let e = t.refsMap; return e || (e = new Map(), t.refsMap = e), e;
} function Ds(t) {
	return Ps.test(t);
} function $s(t, e, n) {
	const r = Is(t); const s = new WeakRef(n); r.set(e, s); const i = {}; return As.register(n, {
		map: r,
		name: e,
	}, i), () => {
		As.unregister(i), r.get(e) === s && r.delete(e);
	};
} function Fs(t, e) {
	return t.refsMap?.get(e)?.deref();
} function js(t) {
	return new Proxy(Is(t), Os);
} const Bs = new WeakMap(); let Vs = null; function Ws(t) {
	this.isIntersecting = t.isIntersecting, t.isIntersecting && !this.isIntersected && (this.isIntersected = !0), this.onIntersect?.(t.isIntersecting); const e = t.isIntersecting && (function(t) {
		const e = getComputedStyle(t); return 'hidden' !== e.visibility && 'none' !== e.display && Number(e.opacity) > 0;
	}(this)); this.isVisible = e, e && !this.visibleFired && (this.visibleFired = !0, _(this.lifecycle, Ve.VISIBLE), this.onVisible?.());
} const Us = Object.freeze({
	TEXT: 'text',
	BARE_ATTR: 'bare-attr',
	ATTR: 'attr',
	BOOL_ATTR: 'bool-attr',
	PROP: 'prop',
	MULTI_ATTR: 'multi-attr',
	CLASS_LIST: 'class-list',
	EVENT: 'event',
	BIND: 'bind',
}); const zs = Object.freeze({
	BINDING: 'binding',
	LIST: 'list',
	COMPUTED: 'computed',
	MULTI: 'multi',
	CLASS: 'class',
}); const Ks = 'data-expr'; const _s = 'uwc:'; const qs = 'uwc/'; function Hs() {
	return !0;
} function Gs(t) {
	return 'function' == typeof t ? t : 'string' == typeof t ? function(e) {
		return !e?.[t];
	} : Hs;
} const Xs = /^[a-zA-Z_:][a-zA-Z0-9_.:-]*$/; function Ys(t) {
	const e = t.match(/([?.])?([\w:-]+)=(["']?)$/); return e ? {
		sigil: e[1] ?? null,
		name: e[2],
		quote: e[3],
	} : null;
} function Js(t) {
	const e = t.match(/^(?<prefix>[\s\S]*?)@(?<eventName>[\w:-]+)(?<modifiers>(?:\.\w+)*)=["']?$/); if (e?.groups?.eventName) {
		const t = e.groups.modifiers; return {
			eventName: e.groups.eventName,
			prefix: e.groups.prefix,
			modifiers: t ? t.slice(1).split('.') : null,
			deduceFromExpr: !1,
		};
	} const n = t.match(/^(?<prefix>[\s\S]*?\s)@$/); return n ? {
		eventName: null,
		prefix: n.groups.prefix,
		deduceFromExpr: !0,
	} : null;
} function Zs(t) {
	return `data-event-${String(t).toLowerCase().replace(/[^a-z0-9:-]/g, '-')}`;
} function Qs(t) {
	return `data-bind-expr-${t}`;
} function ti(t) {
	const e = (/^(?<prefix>[\s\S]*?)@bind=["']?$/).exec(t); return e ? e.groups.prefix : null;
} function ei(t) {
	return `data-attr-expr-${t}`;
} function ni(t) {
	return `data-multi-attr-${t}`;
} const ri = /([?.])?([\w:-]+)=(["'])([^"']*)$/; function si(t, e) {
	const n = ri.exec(t); if (!n) {
		return null;
	} const [
		,r,
		s,
		i,
		o,
	] = n; if (0 === o.length && e.startsWith(i)) {
		return null;
	} if (r) {
		throw new SyntaxError(`${r}${s}="..." cannot have interpolated string content. Use ${r}${s}="\${expr}" with a single expression.`);
	} return {
		name: s,
		quote: i,
		prefix: o,
		totalLength: s.length + 2 + o.length,
	};
} function ii(t, e = '') {
	if (t.lastIndexOf('<') <= t.lastIndexOf('>')) {
		return !1;
	} const n = t.at(-1); if (![
		' ', '\t', '\n', '\r',
	].includes(n)) {
		return !1;
	} const r = e[0]; return !(r && ![
		' ', '\t', '\n', '\r', '/', '>',
	].includes(r));
} function oi(t) {
	if (!Yn(t)) {
		return null;
	} const e = String(t.key ?? '').split('.').pop()
		?.trim(); return e && Xs.test(e) ? e : null;
} const li = /(?:^|[\s>])\^(text|html)$/; const ci = {
	text: Dn.TEXT,
	html: Dn.HTML,
}; function ai(t) {
	const e = li.exec(t); return e ? {
		kind: ci[e[1]],
		sigilLength: e[1].length + 1,
	} : null;
} const ui = new Set([
	'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr',
]); const hi = new Set([
	'script', 'style', 'textarea', 'title', 'select', 'option', 'optgroup',
]); const di = new Set([
	' ', '>', '/', '\t', '\n', '\r',
]); function fi(t, e, n) {
	let r = e + 1; for (;r < n && !di.has(t[r]);) {
		r++;
	} return t.slice(e + 1, r).toLowerCase();
} function pi(t, e) {
	if (!e.startsWith('</')) {
		return !1;
	} const n = t.length - 1; if ('>' !== t[n] || '/' === t[n - 1]) {
		return !1;
	} const r = t.lastIndexOf('<'); if (-1 === r) {
		return !1;
	} const s = t[r + 1]; if ('/' === s || '!' === s) {
		return !1;
	} const i = fi(t, r, n); return !ui.has(i) && !hi.has(i);
} function mi(t) {
	const e = t.lastIndexOf('<'); if (-1 === e) {
		return !1;
	} const n = t[e + 1]; return '/' === n || '!' === n || !hi.has(fi(t, e, t.length));
} function gi(t) {
	t.style.height = 'auto', t.style.height = `${t.scrollHeight}px`;
} const yi = {
	name: 'auto-resize',
	install(t) {
		const e = () => {
			return gi(t);
		}; return t.addEventListener('input', e), requestAnimationFrame(() => {
			return gi(t);
		}), function() {
			t.removeEventListener('input', e);
		};
	},
}; const bi = {
	name: 'autofocus',
	install(t, e) {
		const n = Number(e) || 0; const r = setTimeout(() => {
			!(function(t) {
				if ('function' == typeof t.focus) {
					return void t.focus();
				} const e = (t.shadowRoot ?? t).querySelector('input, textarea, select, button, [tabindex]'); e?.focus?.();
			}(t));
		}, n); return function() {
			clearTimeout(r);
		};
	},
}; function vi(t) {
	const e = t.currentTarget; 'function' == typeof e.select && e.select();
} const wi = {
	name: 'autoselect',
	install: (t) => {
		return (t.addEventListener('focus', vi), function() {
			t.removeEventListener('focus', vi);
		});
	},
}; function Ei(t, e) {
	this.dispatchEvent(new CustomEvent('hotkey', {
		bubbles: !0,
		composed: !0,
		detail: {
			combo: e,
			keyEvent: t,
		},
	}));
} const Si = {
	name: 'hotkey',
	install: (t, e) => {
		return Be(t, e, Ei, 'template').unregister;
	},
}; let Ti = null; const xi = new WeakMap(); const Ci = {
	name: 'reveal',
	install(t, e) {
		const n = Ti || (Ti = new IntersectionObserver((t) => {
			t.forEach((t) => {
				t.isIntersecting && xi.get(t.target) && (t.target.classList.add('is-revealed'), Ti.unobserve(t.target), xi.delete(t.target));
			});
		}, {
			rootMargin: '0px 0px -10% 0px',
		}), Ti); return xi.set(t, {
			rootMargin: e || null,
		}), n.observe(t), function() {
			n.unobserve(t), xi.delete(t);
		};
	},
}; const Ri = {
	name: 'scroll-report',
	install(t) {
		let e = null; function n() {
			const n = t.scrollTop > 8; n !== e && (e = n, On.set({
				'environment.scrolled': n,
			}));
		} return t.addEventListener('scroll', n, {
			passive: !0,
		}), requestAnimationFrame(n), function() {
			t.removeEventListener('scroll', n);
		};
	},
}; const
	Mi = new WeakMap(); let ki = null; let Li = null; let Ni = 0; function Pi() {
	return Li?.deref() ?? null;
} function Ai() {
	Ni = 0; const t = Pi(); if (!t) {
		return;
	} const e = Mi.get(t); e && (async function(t, e) {
		if (!e) {
			return;
		} const n = await (ki || (ki = (async function() {
			await customElements.whenDefined('ui-tooltip'); const t = document.createElement('ui-tooltip'); return document.body.append(t), await t.lifecycle.whenMounted, t;
		}()), ki)); t.isConnected && Pi() === t && n.show({
			text: e,
			targetRect: t.getBoundingClientRect(),
		});
	}(t, e));
} function Oi() {
	Ni && (cancelAnimationFrame(Ni), Ni = 0), Li = null, ki && ki.then((t) => {
		t.hide();
	}).catch(() => {});
} function Ii(t, e) {
	const n = null == e || !1 === e ? '' : String(e); n ? Mi.set(t, n) : Mi.delete(t), ki && Pi() === t && (n ? ki.then((e) => {
		e.show({
			text: n,
			targetRect: t.getBoundingClientRect(),
		});
	}).catch(() => {}) : Oi());
} const Di = {
	handleEvent(t) {
		Li = new WeakRef(t.currentTarget), Ni || (Ni = requestAnimationFrame(Ai));
	},
}; const $i = {
	handleEvent(t) {
		Pi() === t.currentTarget && Oi();
	},
}; function Fi() {} const ji = (/Mobi|iPhone|iPod|Android.*Mobile/i).test(navigator.userAgent || '') ? {
	name: 'tooltip',
	install: Fi,
	applyValue: Fi,
} : {
	name: 'tooltip',
	install: (t, e) => {
		return (void 0 !== e && Ii(t, e), (function(t) {
			t.addEventListener('pointerenter', Di), t.addEventListener('pointerleave', $i);
		}(t)), function() {
			!(function(t) {
				t.removeEventListener('pointerenter', Di), t.removeEventListener('pointerleave', $i), Pi() === t && Oi();
			}(t)), (function(t) {
				Mi.delete(t), Pi() === t && Oi();
			}(t));
		});
	},
	applyValue(t, e) {
		Ii(t, e);
	},
}; Ss(ji.name, ji), Ss(Si.name, Si), Ss(bi.name, bi), Ss(wi.name, wi), Ss(yi.name, yi), Ss(Ci.name, Ci), Ss(Ri.name, Ri); const Bi = new WeakMap(); function Vi(t) {
	return t.nodeType === Node.ELEMENT_NODE && t.getAttribute('slot') || '';
} function Wi(t, e) {
	const n = []; for (let r = 0; r < t.length; r++) {
		Vi(t[r]) === e && n.push(t[r]);
	} return n;
} function Ui(t) {
	const e = t.parentNode; for (;t.firstChild;) {
		e.insertBefore(t.firstChild, t);
	}e.removeChild(t);
} function zi(t, e) {
	const n = t.parentNode; for (let r = 0; r < e.length; r++) {
		n.insertBefore(e[r], t);
	}n.removeChild(t);
} const Ki = new WeakMap(); function _i(t) {
	return t && 'body' !== t ? document.querySelector(t) : document.body;
} function qi(t, e) {
	const n = 'function' == typeof e.moveBefore; for (;t.firstChild;) {
		const r = t.firstChild; n && r.isConnected ? e.moveBefore(r, null) : e.appendChild(r);
	}
} function Hi(t) {
	const e = document.createElement('div'); e.className = 'uwc-portal'; const n = t.shadowRoot; if (n) {
		const t = e.attachShadow({
			mode: 'open',
		}); return t.adoptedStyleSheets = n.adoptedStyleSheets, {
			wrapper: e,
			mount: t,
		};
	} return {
		wrapper: e,
		mount: e,
	};
} function Gi(t) {
	const e = t.parentNode; for (;t.firstChild;) {
		e.insertBefore(t.firstChild, t);
	}e.removeChild(t);
} const Xi = Cs(); function Yi(t, e, n) {
	if (!Xi.has(e)) {
		return !1;
	} t.hasAttribute(e) && t.removeAttribute(e); const r = Ts(e); if (r && 'function' == typeof r.applyValue) {
		return r.applyValue(t, n), !0;
	} if (null == n || !1 === n || '' === n) {
		return t.removeAttribute(`data-${e}`), !0;
	} const s = !0 === n ? '' : String(n); return t.setAttribute(`data-${e}`, s), !0;
} class Ji {
	static isClassList(t) {
		return t instanceof Ji;
	}isClassList = !0; constructor(...t) {
		this.items = t;
	} async create(...t) {
		return new Ji(...t);
	}
} function Zi(...t) {
	return new Ji(...t);
} const Qi = /[A-Z]/g; function to(t) {
	return `-${t.toLowerCase()}`;
} function eo(t) {
	return t.startsWith('--') ? t : t.replace(Qi, to);
} function no(t) {
	if (!t || 'object' != typeof t) {
		return '';
	} let e = ''; const n = Object.keys(t); for (let r = 0; r < n.length; r++) {
		const s = n[r]; const i = t[s]; null != i && !1 !== i && (e += `${eo(s)}:${i};`);
	} return e;
} function ro(t, e) {
	if ('string' != typeof t) {
		return;
	} const n = t.split(/\s+/); for (let t = 0; t < n.length; t++) {
		const r = n[t]; r && e.add(r);
	}
} function so(t, e, n, r) {
	for (let s = 0; s < t.length; s++) {
		const i = t[s]; const o = typeof i; if ('string' === o) {
			ro(i, e); continue;
		} if (null == i || !1 === i) {
			continue;
		} if ('function' === o) {
			let t; if (r) {
				const e = Po(r, i); Io(n, e.deps), t = e.value;
			} else {
				t = i();
			}'string' == typeof t ? ro(t, e) : t && so([t], e, n, r); continue;
		} if (Yn(i)) {
			if (r) {
				const t = Ao(i.key, r, i.global); Bn(n, t.realm, t.path);
			} const t = r ? No(r, i.key, i.global) : i.value; 'string' == typeof t ? ro(t, e) : t && so([t], e, n, r); continue;
		} if (i instanceof Set) {
			i.forEach((t) => {
				'string' == typeof t && e.add(t);
			}); const t = i[pn]; t && Bn(n, t.realm, t.path); continue;
		} if (Array.isArray(i)) {
			so(i, e, n, r); const t = i[pn]; t && Bn(n, t.realm, t.path); continue;
		} if (i instanceof Map) {
			i.forEach((t, n) => {
				t && 'string' == typeof n && e.add(n);
			}); const t = i[pn]; t && Bn(n, t.realm, t.path); continue;
		} const l = Object.keys(i); for (let t = 0; t < l.length; t++) {
			const s = l[t]; const o = i[s]; let c = o; if ('function' == typeof o) {
				if (r) {
					const t = Po(r, o); Io(n, t.deps), c = t.value;
				} else {
					c = o();
				}
			}c && e.add(s);
		}
	}
} const io = Symbol('templateCleanup'); const oo = new Set([
	'INPUT', 'SELECT', 'TEXTAREA',
]); const lo = new Set(['value', 'checked']); function co(t) {
	if (!t) {
		return;
	} const e = t[io]; a(e) && (t[io] = null, e(t));
} function ao(t, e) {
	let n = t.nextSibling; for (;n && n !== e;) {
		const t = n.nextSibling; co(n), n.remove(), n = t;
	}
} function uo(t) {
	return a(t) && t.prototype instanceof HTMLElement;
} class ho {
	constructor(t, e) {
		this.strings = t, this.values = e;
	} static is(t) {
		return t instanceof ho;
	}
} function fo(t, ...e) {
	return new ho(t, e);
} const po = new WeakMap(); class mo {
	constructor(t) {
		this.value = t;
	} static is(t) {
		return t instanceof mo;
	}
} function go(t) {
	return new mo(t);
} function yo(t, e) {
	return e;
} class bo {
	items = []; renderFn; keyFn; kind = null; spot = null; constructor(t, e = yo) {
		this.renderFn = t, this.keyFn = e, this.kind = (function(t) {
			return c(t) ? 'tag' : uo(t) ? 'class' : 'fn';
		}(t));
	} get length() {
		return this.items.length;
	} static isLiveList(t) {
		return t instanceof bo;
	}connectSpot(t) {
		this.spot = t;
	}disconnectSpot() {
		this.spot = null;
	}createElement(t) {
		return (function(t, e, n, r) {
			if ('tag' === t) {
				const t = document.createElement(e); return t.state = n, t;
			} return 'class' === t ? new e(n) : (function(t) {
				if (ho.is(t)) {
					return (function(t) {
						const e = Tl(t.strings); const n = t.values; !(function(t, e) {
							for (let t = 0; t < e.length; t++) {
								const n = e[t]; if (a(n) || Yn(n)) {
									throw new TypeError('each() html row expressions must be plain values — compute inline (`${item.x * 2}`), not `${() => …}` or a binding.');
								}
							} if (t.refPlans && t.refPlans.length || t.dataBindPlans && t.dataBindPlans.length || t.subeventPlans && t.subeventPlans.length) {
								throw new TypeError('each() html row does not support #refs, two-way bindings, or behaviors — use the component (class) kind for those.');
							}
						}(e, n)); const r = e.fragment.cloneNode(!0); const s = e.spotPlans; const i = []; const o = new Array(s.length); for (let t = 0; t < s.length; t++) {
							o[t] = gl(s[t], r);
						} for (let t = 0; t < s.length; t++) {
							const e = Ll(s[t], o[t], n, null); e && i.push(e);
						} if (1 !== r.children.length) {
							throw new TypeError('each() html row must have exactly one root element.');
						} const l = r.firstElementChild; return po.set(l, {
							spots: i,
							prevExprs: n.slice(),
						}), l;
					}(t));
				} if (c(t)) {
					return k(t);
				} if (h(t)) {
					return t;
				} throw new TypeError('List render functions must return an Element or HTML string.');
			}(e.call(r, n)));
		}(this.kind, this.renderFn, t, this.spot?.component));
	}splice(t, e = 0, ...n) {
		const r = this.items.length; const s = t < 0 ? Math.max(0, r + t) : Math.min(t, r); const i = this.items[s + e]; const o = void 0 === i ? null : this.keyFn(i, s + e); const l = this.spot && null !== o ? this.spot.keyMap?.get(o) ?? null : null; if (this.spot) {
			for (let t = s; t < s + e && t < r; t++) {
				const e = this.keyFn(this.items[t], t); const n = this.spot.keyMap?.get(e); co(n), n?.remove(), this.spot.keyMap?.delete(e), this.spot.prevItemMap?.delete(e);
			}
		} if (this.items.splice(s, e, ...n), n.length && this.spot) {
			const t = document.createDocumentFragment(); this.spot.keyMap ??= new Map(), this.spot.prevItemMap ??= new Map(); for (let e = 0; e < n.length; e++) {
				const r = n[e]; const i = this.keyFn(r, s + e); const o = this.createElement(r); this.spot.keyMap.set(i, o), this.spot.prevItemMap.set(i, r), t.append(o);
			} const e = this.spot.anchored ? this.spot.startComment.parentNode : this.spot.el; const r = this.spot.anchored ? this.spot.endComment : null; e.insertBefore(t, l ?? r);
		} return this;
	}push(...t) {
		return this.splice(this.items.length, 0, ...t);
	}unshift(...t) {
		return this.splice(0, 0, ...t);
	}pop() {
		return this.items.length ? this.splice(this.items.length - 1, 1) : this;
	}shift() {
		return this.items.length ? this.splice(0, 1) : this;
	}[Symbol.iterator]() {
		return this.items[Symbol.iterator]();
	}
} function vo(t, e) {
	return e;
} function wo(t, e, n = vo) {
	const r = new bo(e, n); return Array.isArray(t) && t.length && (r.items = t.slice()), r;
} function Eo(t, e) {
	return t?.key ?? t?.id ?? e;
} function So(t, e, n = Eo) {
	return new Gn(t, e, n);
} function To(t, e, n, r = Eo) {
	return new Gn(t, e, r, Gs(n));
} function xo(t, e) {
	return t?.key ?? t?.id ?? e;
} function Co(t, e, n = {}) {
	const r = n.keyFn ?? xo; const s = void 0 === n.filter ? null : Gs(n.filter); return new Xn(t, e, r, s, n);
} function Ro(t, e, n = null) {
	const r = c(t); const s = new Map(); return function() {
		return (function(t, e) {
			if (null == t) {
				return null;
			} if (c(t) || 'number' == typeof t || 'boolean' == typeof t) {
				return t;
			} if (uo(t)) {
				let n = e.get(t); return n || (n = new t(), e.set(t, n)), n;
			} if (t instanceof Node || mo.is(t) || bo.isLiveList(t)) {
				return t;
			} throw new TypeError('ifThen() branch must be a value (string/number/boolean/null), a component class, or built content (Node/comp()/list). For reactive branch markup, use a component class — a raw inline html`` block is not a reactive branch.');
		}((r ? Boolean(B(this.state, t)) : Boolean(t.call(this))) ? e : n, s));
	};
} function Mo(t, e, n) {
	if (po.has(t)) {
		return (function(t, e) {
			const n = po.get(t); n && Bl(n, e.values);
		}(t, n.renderFn.call(n.spot?.component, e))), t;
	} if (a(t.assignState)) {
		return t.assignState(e), t;
	} const r = n.createElement(e); return co(t), t.replaceWith(r), r;
} function ko(t, e) {
	t.liveList && t.liveList !== e && t.liveList.disconnectSpot && t.liveList.disconnectSpot(), e.connectSpot && e.connectSpot(t), t.liveList = e; const {
		items: n, keyFn: r,
	} = e; const s = t.anchored ? t.startComment.parentNode : t.el; const i = t.anchored ? t.endComment : null; const o = t.keyMap ?? new Map(); const l = t.prevItemMap ?? new Map(); const c = new Map(); const a = n.length; if (0 === o.size) {
		const o = a > 1 ? document.createDocumentFragment() : null; for (let t = 0; t < a; t++) {
			const a = n[t]; const u = r(a, t); const h = e.createElement(a); c.set(u, h), l.set(u, a), o ? o.append(h) : s.insertBefore(h, i);
		} return o && s.insertBefore(o, i), t.keyMap = c, void (t.prevItemMap = l);
	} if (a === o.size && (function(t, e, n) {
		const r = n.keys(); for (let n = 0; n < t.length; n++) {
			if (e(t[n], n) !== r.next().value) {
				return !1;
			}
		} return !0;
	}(n, r, o))) {
		const r = o.keys(); for (let t = 0; t < a; t++) {
			const s = n[t]; const i = r.next().value; s !== l.get(i) && (o.set(i, Mo(o.get(i), s, e)), l.set(i, s));
		} return t.keyMap = o, void (t.prevItemMap = l);
	} const u = [...o.keys()]; const h = new Map(); for (let t = 0; t < u.length; t++) {
		h.set(u[t], t);
	} const d = new Array(a); const f = new Array(a); let p = !1; let m = -1; for (let t = 0; t < a; t++) {
		const s = n[t]; const i = r(s, t); let a = o.get(i); if (a) {
			o.delete(i), s !== l.get(i) && (a = Mo(a, s, e)); const n = h.get(i); f[t] = n, n < m ? p = !0 : m = n;
		} else {
			a = e.createElement(s), f[t] = -1, p = !0;
		}d[t] = a, c.set(i, a), l.set(i, s);
	} const g = [...o.entries()]; for (let t = 0; t < g.length; t++) {
		const e = g[t][1]; co(e), e.remove(), l.delete(g[t][0]);
	} if (p) {
		const t = (function(t) {
			const e = t.length; const n = new Array(e); const r = []; for (let s = 0; s < e; s++) {
				const e = t[s]; if (e < 0) {
					continue;
				} let i = 0; let o = r.length; for (;i < o;) {
					const n = i + o >> 1; t[r[n]] < e ? i = n + 1 : o = n;
				}n[s] = i > 0 ? r[i - 1] : -1, i === r.length ? r.push(s) : r[i] = s;
			} const s = new Set(); let i = r.length ? r[r.length - 1] : -1; for (;i >= 0;) {
				s.add(i), i = n[i];
			} return s;
		}(f)); const e = 'function' == typeof s.moveBefore && s.isConnected; let n = i; for (let r = a - 1; r >= 0; r--) {
			const i = d[r]; -1 === f[r] ? s.insertBefore(i, n) : t.has(r) || i.nextSibling === n || (e ? s.moveBefore(i, n) : s.insertBefore(i, n)), n = i;
		}
	}t.keyMap = c, t.prevItemMap = l;
} function Lo(t = []) {
	return P(t, H), [];
} function No(t, e, n) {
	const r = Ao(e, t, n); return r.realm.read(r.path);
} function Po(t, e) {
	!(function(t) {
		const e = t.STATE ?? {}; t.renderProxy && t.renderProxyState === e || (t.renderProxy = Kn(e, t), t.renderProxyState = e); const n = On.proxy; t.globalRenderProxy && t.globalRenderProxyState === n || (t.globalRenderProxy = _n(n), t.globalRenderProxyState = n);
	}(t)); const n = t.renderTracking; t.renderTracking = !0; const r = (function(t, e) {
		const n = new Map(); const
			r = $n; $n = n; const s = t.call(e); return $n = r, {
			value: s,
			deps: n,
		};
	}(e, t)); return t.renderTracking = n, r;
} function Ao(t, e, n) {
	return {
		realm: n ? In : bn(e),
		path: t,
	};
} function Oo(t, e, n) {
	const r = Ao(t, e, n); return (function(t, e) {
		const n = new Map(); return n.set(t, new Set([e])), n;
	}(r.realm, r.path));
} function Io(t, e) {
	for (const [
		n,
		r,
	] of e) {
		for (const e of r) {
			Bn(t, n, e);
		}
	}
} function Do(t, e) {
	return e.realm.bus.subscribe(t, e.spot.handle, e.spot, e.spot.kind === zs.LIST);
} function $o(t, e) {
	let n = t.depMap; if (n || (n = new Map(), t.depMap = n), n.size) {
		const t = [...n.keys()]; for (let r = 0; r < t.length; r++) {
			const s = t[r]; e.has(s) || (G(n.get(s)), n.delete(s));
		}
	} for (const [
		r,
		s,
	] of e) {
		let e = n.get(r); e || (e = new Map(), n.set(r, e)), Y(e, s, Do, {
			realm: r,
			spot: t,
		});
	}
} function Fo(t, e) {
	!t.keyMap && t.el.firstChild && (t.el.textContent = ''), ko(t, e);
} function jo(t, e) {
	const n = mo.is(e) ? e.value : e; t.el.firstChild !== n && (t.el.textContent = '', n && t.el.appendChild(n));
}qn.list = So; let Bo = null; function Vo(t, e) {
	if ('bigint' == typeof e) {
		return String(e);
	} if (null !== e && 'object' == typeof e) {
		if (Bo.has(e)) {
			return '[Circular]';
		} Bo.add(e);
	} return e;
} function Wo(t) {
	return null == t ? '' : 'object' != typeof t ? String(t) : ArrayBuffer.isView(t) || t instanceof ArrayBuffer ? (function(t) {
		let e; if (e = t instanceof Uint8Array ? t : t instanceof ArrayBuffer ? new Uint8Array(t) : new Uint8Array(t.buffer, t.byteOffset, t.byteLength), e.toBase64) {
			return e.toBase64({
				alphabet: 'base64url',
				omitPadding: !0,
			});
		} const n = globalThis.Buffer; if (n) {
			return n.from(e).toString('base64url');
		} let r = ''; for (let t = 0; t < e.length; t += 32768) {
			r += String.fromCharCode(...e.subarray(t, t + 32768));
		} return btoa(r).split('+').join('-')
			.split('/')
			.join('_')
			.split('=')
			.join('');
	}(t)) : (function(t) {
		Bo = new WeakSet(); const e = JSON.stringify(t, Vo) ?? ''; return Bo = null, e;
	}(t));
} function Uo(t, e) {
	const n = Wo(e); t.el.textContent !== n && (t.el.textContent = n);
} function zo(t) {
	return null == t || '' === t ? Dn.EMPTY : bo.isLiveList(t) ? Dn.LIST : mo.is(t) || t instanceof Node ? Dn.COMPONENT : Dn.TEXT;
} const Ko = {
	[Dn.EMPTY]: Uo,
	[Dn.TEXT]: Uo,
	[Dn.HTML](t, e) {
		t.el.innerHTML = String(e ?? '');
	},
	[Dn.COMPONENT]: jo,
	[Dn.LIST]: Fo,
}; function _o(t, e) {
	const n = Wo(e); const r = t.textNode; if (null !== r && null !== r.parentNode && r.previousSibling === t.startComment && r.nextSibling === t.endComment) {
		return void (r.data !== n && (r.data = n));
	} ao(t.startComment, t.endComment); const s = document.createTextNode(n); t.textNode = s, t.startComment.parentNode.insertBefore(s, t.endComment);
} const qo = {
	[Dn.EMPTY]: _o,
	[Dn.TEXT]: _o,
	[Dn.HTML](t, e) {
		ao(t.startComment, t.endComment), t.textNode = null; const n = String(e ?? ''); if ('' === n) {
			return;
		} const r = document.createElement('template'); r.innerHTML = n, t.startComment.parentNode.insertBefore(r.content, t.endComment);
	},
	[Dn.COMPONENT](t, e) {
		const n = mo.is(e) ? e.value : e; (t.startComment.nextSibling !== n || null !== n && n.nextSibling !== t.endComment) && (ao(t.startComment, t.endComment), t.textNode = null, n && t.startComment.parentNode.insertBefore(n, t.endComment));
	},
	[Dn.LIST](t, e) {
		t.keyMap || t.startComment.nextSibling === t.endComment || ao(t.startComment, t.endComment), t.textNode = null, ko(t, e);
	},
}; function Ho(t) {
	console.error('[template] async spot error:', t);
} function Go(t, e) {
	if (e instanceof Promise) {
		const n = (t.patchToken ?? 0) + 1; return t.patchToken = n, void (async function(t, e, n) {
			t.catch(Ho); const r = await t; e.patchToken === n && Xo(e, r);
		}(e, t, n));
	} if (t.type === Us.TEXT) {
		if (t.keyMap && !bo.isLiveList(e) && (t.keyMap.forEach(co), t.keyMap = null, t.prevItemMap = null, t.patch = null, t.anchored && (ao(t.startComment, t.endComment), t.textNode = null)), !t.patch) {
			if (!t.declaredKind && (null == e || '' === e)) {
				return void (t.anchored ? (t.startComment.nextSibling !== t.endComment && ao(t.startComment, t.endComment), t.textNode = null) : '' !== t.el.textContent && (t.el.textContent = ''));
			} !(function(t, e) {
				let n = t.declaredKind ?? zo(e); n === Dn.HTML && null != e && 'string' != typeof e && (n = zo(e)), t.contentKind = n, t.patch = (t.anchored ? qo : Ko)[n], t.elided || t.anchored || (t.el.style.pointerEvents = (function(t, e) {
					return t === Dn.LIST || t === Dn.COMPONENT || t === Dn.HTML && String(e ?? '').includes('<');
				}(n, e)) ? '' : 'none');
			}(t, e));
		} return void t.patch(t, e);
	} if (t.type === Us.BARE_ATTR) {
		if (Yi(t.el, t.attr, e)) {
			return;
		} if (!1 === e || null == e || '' === e) {
			return void (t.el.hasAttribute(t.attr) && t.el.removeAttribute(t.attr));
		} if (!0 === e) {
			return void (t.el.hasAttribute(t.attr) || t.el.setAttribute(t.attr, ''));
		} const n = String(e); return void (t.el.getAttribute(t.attr) !== n && t.el.setAttribute(t.attr, n));
	} if (t.type === Us.BOOL_ATTR) {
		const n = t.el.hasAttribute(t.attr); return void (e && !n ? t.el.setAttribute(t.attr, '') : !e && n && t.el.removeAttribute(t.attr));
	} if (t.type === Us.PROP) {
		return 'state' === t.attr && a(t.el.assignState) ? void t.el.assignState(e) : void (t.el[t.attr] !== e && (t.el[t.attr] = e));
	} if (Yi(t.el, t.attr, e)) {
		return;
	} if ('' === e || null == e || !1 === e) {
		return void (t.el.hasAttribute(t.attr) && t.el.removeAttribute(t.attr));
	} if ('style' === t.attr && l(e)) {
		return void (function(t, e) {
			const n = t.el.style; t.styleWasString && (n.cssText = '', t.styleWasString = !1); const r = t.prevStyleKeys; const s = new Set(); const i = Object.keys(e); for (let t = 0; t < i.length; t++) {
				const r = i[t]; const o = e[r]; null != o && !1 !== o && (s.add(r), r.includes('-') ? n.setProperty(r, String(o)) : n[r] = o);
			} if (r) {
				const t = [...r]; for (let e = 0; e < t.length; e++) {
					const r = t[e]; s.has(r) || (r.includes('-') ? n.removeProperty(r) : n[r] = '');
				}
			}t.prevStyleKeys = s;
		}(t, e));
	} let n; if ('class' === t.attr && Ji.isClassList(e)) {
		const t = new Set(); so(e.items, t, new Map(), null), n = [...t].join(' ');
	} else {
		n = String(e ?? '');
	}'style' === t.attr && (t.prevStyleKeys = null, t.styleWasString = !0), t.el.getAttribute(t.attr) !== n && t.el.setAttribute(t.attr, n);
} function Xo(t, e) {
	const n = ue.mark('patch'); const r = Go(t, e); return ue.measure('patch', n), r;
} const Yo = new WeakMap(); function Jo(t) {
	const e = Yo.get(this); if (!e) {
		return;
	} const n = e.get(t.type); if (!n) {
		return;
	} if (n.modSelf && t.target !== this) {
		return;
	} n.modStop && t.stopPropagation(), n.modPrevent && t.preventDefault(); const r = n.component.runEventHandler(n.expr, t, this, t.type); return n.modOnce && n.unsubscribe(), r;
} class Zo {
	constructor() {
		this.unsubs = [], this.depMap = null, this.pendingPaths = null;
	}handle(t, e) {
		this.kind === zs.LIST && (this.pendingPaths || (this.pendingPaths = []), this.pendingPaths.push(e)), nn(this);
	}drain() {
		return this.refresh();
	}refresh() {}unsubscribe() {
		this.depMap && (X(this.depMap), this.depMap = null), this.unsubs && this.unsubs.length && (this.unsubs = Lo(this.unsubs)), this.pendingPaths = null;
	}
} class Qo extends Zo {
	constructor(t, e, n, r, s, i, o, l, c) {
		super(), this.kind = zs.BINDING, this.type = n, this.attr = r, this.el = t, this.slotIndex = e, this.expr = s, this.component = i, this.bindingKey = o, this.bindingGlobal = c, this.declaredKind = l, this.contentKind = null, this.patch = null, this.pendingValue = void 0, this.elided = !1, this.anchored = !1, this.startComment = null, this.endComment = null, this.textNode = null;
	}handle(t) {
		this.pendingValue = t, nn(this);
	}drain() {
		Xo(this, this.pendingValue);
	}refresh() {
		Xo(this, No(this.component, this.bindingKey, this.bindingGlobal));
	}
} class tl extends Zo {
	constructor(t, e, n, r, s, i, o, l, c = null) {
		super(), this.kind = zs.LIST, this.type = n, this.el = t, this.slotIndex = e, this.expr = r, this.component = s, this.bindingKey = i, this.bindingGlobal = !1, this.renderFn = o, this.keyFn = l, this.filterFn = c, this.keyMap = null, this.liveList = null, this.prevItemMap = null, this.patch = null, this.anchored = !1, this.startComment = null, this.endComment = null, this.textNode = null;
	}drain() {
		const t = this.pendingPaths; if (this.pendingPaths = null, t && t.length > 1) {
			let e; for (let n = 0; n < t.length; n++) {
				e = this.refresh(t[n]);
			} return e;
		} return this.refresh(t ? t[0] : null);
	}refresh(t = null) {
		const {
			component: e, bindingKey: n, bindingGlobal: r, renderFn: s, keyFn: i, filterFn: o,
		} = this; const c = (function(t, e) {
			if (Array.isArray(t)) {
				if (!e) {
					return t;
				} const n = []; for (let r = 0; r < t.length; r++) {
					const s = t[r]; e(s, r) && n.push(s);
				} return n;
			} if (l(t)) {
				const n = Object.keys(t); const r = []; for (let s = 0; s < n.length; s++) {
					const i = t[n[s]]; e && !e(i, s) || r.push(i);
				} return r;
			} return [];
		}(No(e, n, r), o)); if (!o && t && t !== n && t.startsWith(`${n}.`) && this.keyMap && c.length === this.keyMap.size) {
			const e = t.slice(n.length + 1); const r = e.indexOf('.'); if (-1 !== r) {
				const t = Number(e.slice(0, r)); if (!Number.isNaN(t)) {
					const e = c[t]; if (void 0 !== e) {
						const n = i(e, t); const r = this.keyMap.get(n); if (a(r?.assignState)) {
							return void r.assignState(e);
						}
					}
				}
			}
		}Xo(this, wo(c, s, i));
	}unsubscribe() {
		this.liveList && this.liveList.disconnectSpot && this.liveList.disconnectSpot(), this.liveList = null, this.keyMap = null, this.prevItemMap = null, super.unsubscribe();
	}
} class el extends Zo {
	constructor(t, e, n, r, s, i, o) {
		super(), this.kind = zs.COMPUTED, this.type = n, this.attr = r, this.el = t, this.slotIndex = e, this.expr = s, this.component = i, this.declaredKind = o, this.contentKind = null, this.patch = null, this.elided = !1, this.anchored = !1, this.startComment = null, this.endComment = null, this.textNode = null;
	}refresh() {
		const {
			value: t, deps: e,
		} = Po(this.component, this.expr); Xo(this, t), $o(this, e);
	}
} class nl extends Zo {
	constructor(t, e, n, r, s) {
		super(), this.kind = zs.MULTI, this.type = Us.MULTI_ATTR, this.attr = n, this.el = t, this.slotIndex = e, this.parts = r, this.component = s;
	}refresh() {
		const t = this.component; const e = this.parts; const n = new Map(); let r = ''; for (let s = 0; s < e.length; s++) {
			const i = e[s]; if (void 0 !== i.literal) {
				r += i.literal; continue;
			} const o = i.expr; if (Yn(o)) {
				const e = Ao(o.key, t, o.global); Bn(n, e.realm, e.path), r += No(t, o.key, o.global) ?? ''; continue;
			} if (a(o)) {
				const e = Po(t, o); Io(n, e.deps), r += e.value ?? ''; continue;
			}r += o ?? '';
		}Yi(this.el, this.attr, r) || this.el.getAttribute(this.attr) !== r && this.el.setAttribute(this.attr, r), $o(this, n);
	}
} class rl extends Zo {
	constructor(t, e, n, r) {
		super(), this.kind = zs.CLASS, this.type = Us.CLASS_LIST, this.attr = 'class', this.el = t, this.slotIndex = e, this.parts = n, this.component = r, this.classListCurrent = null;
	}refresh() {
		const t = this.component; const e = this.parts; const n = new Set(); const r = new Map(); for (let s = 0; s < e.length; s++) {
			const i = e[s]; if (void 0 !== i.literal) {
				ro(i.literal, n); continue;
			} const o = i.expr; Ji.isClassList(o) ? so(o.items, n, r, t) : so([o], n, r, t);
		} const s = this.classListCurrent ?? new Set(); !(function(t, e, n) {
			e.forEach((e) => {
				n.has(e) || t.classList.remove(e);
			}), n.forEach((n) => {
				e.has(n) || t.classList.add(n);
			});
		}(this.el, s, n)), this.classListCurrent = n, $o(this, r);
	}
} class sl extends Zo {
	constructor(t, e, n, r, s, i) {
		if (super(), this.type = Us.EVENT, this.el = t, this.slotIndex = e, this.eventName = n, this.expr = r, this.component = s, this.modifiers = i ?? null, this.modStop = !1, this.modPrevent = !1, this.modSelf = !1, this.modOnce = !1, this.modCapture = !1, this.modPassive = !1, i) {
			for (let t = 0; t < i.length; t++) {
				const e = i[t]; 'stop' === e ? this.modStop = !0 : 'prevent' === e ? this.modPrevent = !0 : 'self' === e ? this.modSelf = !0 : 'once' === e ? this.modOnce = !0 : 'capture' === e ? this.modCapture = !0 : 'passive' === e && (this.modPassive = !0);
			}
		}
	}listenerOptions() {
		if (this.modifiers) {
			return {
				capture: this.modCapture,
				passive: this.modPassive,
			};
		}
	}unsubscribe() {
		const t = Yo.get(this.el); t && t.delete(this.eventName), this.el.removeEventListener(this.eventName, Jo, this.modCapture), super.unsubscribe();
	}
} function il(t, e, n, r) {
	const s = new rl(e, t.slotIndex, n, r); return s.refresh(), s;
} class ol extends Zo {
	constructor(t, e, n, r, s, i) {
		super(), this.type = n, this.attr = r, this.el = t, this.slotIndex = e, this.expr = s, this.declaredKind = i ?? null, this.contentKind = null, this.patch = null, this.elided = !1, this.anchored = !1, this.startComment = null, this.endComment = null, this.textNode = null;
	}
} function ll(t, e, n) {
	'checked' === e ? t.checked = Boolean(n) : 'selectedIndex' === e ? t.selectedIndex = Number(n ?? -1) : t.value = String(n ?? '');
} function cl(t) {
	return 'SELECT' === t.tagName || 'checkbox' === t.type || 'radio' === t.type ? 'change' : 'input';
} const al = new WeakMap(); function ul() {
	const t = al.get(this); if (!t) {
		return;
	} const e = t.get(this.eventTypeKey ?? 'input') ?? t.get('input') ?? t.get('change'); let n; let r; e && (function(t, e, n, r) {
		const s = Ao(e, t, r); s.realm.write(s.path, n);
	}(e.component, e.bindingKey, (n = this, 'checked' === (r = e.twoWayAttr) ? n.checked : 'selectedIndex' === r ? n.selectedIndex : n.value), e.bindingGlobal));
} class hl extends Zo {
	constructor(t, e, n, r, s, i, o, l, c, a) {
		super(), this.type = n, this.attr = r, this.el = t, this.slotIndex = e, this.expr = s, this.component = i, this.bindingKey = o, this.bindingGlobal = a, this.twoWayAttr = l, this.twoWayEvent = c;
	}handle(t) {
		ll(this.el, this.twoWayAttr, t);
	}unsubscribe() {
		const t = al.get(this.el); t && t.delete(this.twoWayEvent), this.el.removeEventListener(this.twoWayEvent, ul), super.unsubscribe();
	}
} function dl(t, e, n, r, s, i) {
	const o = s ?? n.key; const l = i ?? n.global ?? !1; const c = t.attr ?? (function(t) {
		return 'checkbox' === t.type || 'radio' === t.type ? 'checked' : 'SELECT' === t.tagName ? 'selectedIndex' : 'value';
	}(e)); const a = cl(e); const u = new hl(e, t.slotIndex, t.type, c, n, r, o, c, a, l); ll(e, c, No(r, o, l)), e.hasAttribute('value') && e.removeAttribute('value'), e.hasAttribute('checked') && e.removeAttribute('checked'); const h = Ao(o, r, l); u.unsubs.push(h.realm.bus.subscribe(h.path, hl.prototype.handle, u)); let d = al.get(e); return d || (d = new Map(), al.set(e, d)), d.set(a, u), e.addEventListener(a, ul), u;
} const fl = new WeakMap(); function pl(t, e) {
	const n = []; let r = t; for (;r !== e;) {
		const t = r.parentNode; if (!t) {
			return null;
		} let e = 0; let s = t.firstChild; for (;s && s !== r;) {
			s = s.nextSibling, e += 1;
		}n.push(e), r = t;
	} return n.reverse(), n;
} function ml(t, e) {
	let n = t; for (let t = 0; t < e.length; t++) {
		n = n.childNodes[e[t]];
	} return n;
} function gl(t, e) {
	return t.anchored ? {
		startComment: ml(e, t.startPath),
		endComment: ml(e, t.endPath),
	} : ml(e, t.path);
} function yl(t, e) {
	if (t.length === e) {
		return !1;
	} for (let n = e; n < t.length; n++) {
		const e = t.charCodeAt(n); if (e < 48 || e > 57) {
			return !1;
		}
	} return !0;
} function bl(t, e) {
	return '' === e ? t.startsWith('data-') : 101 === e.charCodeAt(0) && e.startsWith('expr') ? yl(e, 4) : 'data-expr' === t && yl(e, 0);
} function vl(t, e, n) {
	return t.get(`${e}|${n}`);
} const wl = /^\$(\w+)((?:\.\w+)*)$/; function El(t) {
	return t.startsWith('state.') ? t.slice(6) : t.startsWith('globalState.') ? `global.${t.slice(12)}` : t;
} const Sl = /^expr\d+$/; function Tl(t) {
	let e = fl.get(t); return e || (e = (function(t) {
		const e = new Array(Math.max(0, t.length - 1)); const {
			html: n, meta: r,
		} = (function(t, e) {
			let n = ''; const r = []; let s = null; for (let i = 0; i < t.length; i++) {
				let o = t[i]; const l = t[i + 1] ?? ''; if (s) {
					const t = o.indexOf(s.quote); if (-1 === t) {
						o.length > 0 && s.parts.push({
							literal: o,
						}), i < e.length && s.parts.push({
							exprIndex: i,
							expr: e[i],
						}); continue;
					}t > 0 && s.parts.push({
						literal: o.slice(0, t),
					}), r.push({
						i: s.markerIdx,
						type: Us.MULTI_ATTR,
						attr: s.name,
						parts: s.parts,
					}), n += ` data-uwc ${ni(s.markerIdx)}=""`, s = null, o = o.slice(t + 1);
				} const c = ai(o); c && (o = o.slice(0, o.length - c.sigilLength)); const a = si(o, l); if (a) {
					n += o.slice(0, o.length - a.totalLength), s = {
						name: a.name,
						quote: a.quote,
						parts: a.prefix.length > 0 ? [
							{
								literal: a.prefix,
							},
						] : [],
						markerIdx: i,
					}, i < e.length && s.parts.push({
						exprIndex: i,
						expr: e[i],
					}); continue;
				} const u = ti(o); const h = null === u ? Js(o) : null; if (n += null === u ? h?.prefix ?? o : u, i >= e.length) {
					continue;
				} const d = e[i]; if (null !== u) {
					n += `data-uwc ${Qs(i)}=""`, r.push({
						i,
						type: Us.BIND,
						expr: d,
					}); continue;
				} if (h) {
					h.deduceFromExpr ? (n += `data-uwc data-uwc-evfn-${i}=""`, r.push({
						i,
						type: Us.EVENT,
						eventName: null,
						deduceFromExpr: !0,
						expr: d,
					})) : (n += `data-uwc ${Zs(h.eventName)}="expr${i}"`, r.push({
						i,
						type: Us.EVENT,
						eventName: h.eventName,
						modifiers: h.modifiers,
						deduceFromExpr: !1,
						expr: d,
					})); continue;
				} const f = Ys(o); if (f) {
					n += '' === f.quote ? `expr${i} data-uwc` : `expr${i}${f.quote} data-uwc=${f.quote}`; const t = {
						i,
						attr: f.name,
						sigil: f.sigil,
						expr: d,
					}; '?' === f.sigil ? r.push({
						...t,
						type: Us.BOOL_ATTR,
					}) : '.' === f.sigil ? r.push({
						...t,
						type: Us.PROP,
					}) : r.push({
						...t,
						type: Us.ATTR,
					});
				} else if (ii(o, l)) {
					const t = oi(d); if (t) {
						n += `data-uwc ${ei(i)}=""`, r.push({
							i,
							type: Us.BARE_ATTR,
							attr: t,
							expr: d,
						}); continue;
					}
				} else {
					pi(n, l) ? (n = `${n.slice(0, n.length - 1)} data-uwc ${Ks}="${i}">`, r.push({
						i,
						type: Us.TEXT,
						expr: d,
						declaredKind: c ? c.kind : null,
						elided: !0,
					})) : mi(n) ? (n += `\x3c!--${_s}${i}--\x3e\x3c!--${qs}${i}--\x3e`, r.push({
						i,
						type: Us.TEXT,
						expr: d,
						declaredKind: c ? c.kind : null,
						anchored: !0,
					})) : (n += `<span data-uwc ${Ks}="${i}"></span>`, r.push({
						i,
						type: Us.TEXT,
						expr: d,
						declaredKind: c ? c.kind : null,
					}));
				}
			} return {
				html: n,
				meta: r,
			};
		}(t, e)); const s = document.createElement('template'); s.innerHTML = n; const i = s.content; const o = (function(t) {
			const e = new Map(); O(t.querySelectorAll('[data-uwc]'), (n) => {
				const r = pl(n, t); if (!r) {
					return;
				} n.removeAttribute('data-uwc'); const s = n.attributes; for (let t = 0; t < s.length; t++) {
					const i = s[t].name; const o = s[t].value; bl(i, o) && e.set(`${i}|${o}`, {
						el: n,
						path: r,
					});
				}
			}); const n = document.createTreeWalker(t, NodeFilter.SHOW_COMMENT); let r = n.nextNode(); for (;r;) {
				const s = r.data; if ((s.startsWith(_s) || s.startsWith(qs)) && yl(s, 4)) {
					const n = pl(r, t); n && e.set(s, {
						el: r,
						path: n,
					});
				}r = n.nextNode();
			} return e;
		}(i)); const l = []; P(r, (t) => {
			const e = (function(t, e) {
				if (e.type === Us.BIND) {
					const n = Qs(e.i); const r = vl(t, n, ''); return r ? (r.el.removeAttribute(n), {
						type: Us.BIND,
						slotIndex: e.i,
						path: r.path,
					}) : null;
				} if (e.type === Us.MULTI_ATTR) {
					const n = ni(e.i); const r = vl(t, n, ''); if (!r) {
						return null;
					} r.el.removeAttribute(n); const s = e.parts.map((t) => {
						return (void 0 !== t.literal ? {
							literal: t.literal,
						} : {
							exprIndex: t.exprIndex,
						});
					}); return {
						type: Us.MULTI_ATTR,
						slotIndex: e.i,
						path: r.path,
						attr: e.attr,
						parts: s,
					};
				} if (e.type === Us.EVENT) {
					const n = !0 === e.deduceFromExpr; const r = n ? `data-uwc-evfn-${e.i}` : Zs(e.eventName); const s = vl(t, r, n ? '' : `expr${e.i}`); return s ? (s.el.removeAttribute(r), {
						type: Us.EVENT,
						slotIndex: e.i,
						path: s.path,
						eventName: n ? null : e.eventName,
						modifiers: n ? null : e.modifiers ?? null,
						deduceFromExpr: n,
					}) : null;
				} if (e.type === Us.TEXT) {
					if (e.anchored) {
						const n = t.get(`${_s}${e.i}`); const r = t.get(`${qs}${e.i}`); return n && r ? {
							type: Us.TEXT,
							slotIndex: e.i,
							anchored: !0,
							startPath: n.path,
							endPath: r.path,
							declaredKind: e.declaredKind ?? null,
						} : null;
					} const n = vl(t, Ks, String(e.i)); return n ? (n.el.removeAttribute(Ks), e.elided || (n.el.style.display = 'contents'), {
						type: Us.TEXT,
						slotIndex: e.i,
						path: n.path,
						declaredKind: e.declaredKind ?? null,
						elided: !0 === e.elided,
					}) : null;
				} if (e.type === Us.BARE_ATTR) {
					const n = ei(e.i); const r = vl(t, n, ''); return r ? (r.el.removeAttribute(n), {
						type: Us.BARE_ATTR,
						slotIndex: e.i,
						path: r.path,
					}) : null;
				} if (e.type === Us.ATTR) {
					const n = vl(t, e.attr, `expr${e.i}`); return n ? (Xi.has(e.attr) || n.el.removeAttribute(e.attr), {
						type: Us.ATTR,
						slotIndex: e.i,
						path: n.path,
						attr: e.attr,
					}) : null;
				} if (e.type === Us.BOOL_ATTR || e.type === Us.PROP) {
					const n = `${e.type === Us.BOOL_ATTR ? '?' : '.'}${e.attr}`.toLowerCase(); const r = vl(t, n, `expr${e.i}`); return r ? (r.el.removeAttribute(n), {
						type: e.type,
						slotIndex: e.i,
						path: r.path,
						attr: e.attr,
					}) : null;
				} return null;
			}(o, t)); e && l.push(e);
		}); const c = (function(t) {
			const e = []; return O(t.querySelectorAll('[data-bind]'), (n) => {
				const r = n.dataset.bind; if (!r) {
					return;
				} const s = pl(n, t); s && (e.push({
					path: s,
					key: El(r),
				}), n.removeAttribute('data-bind'));
			}), O(t.querySelectorAll('*'), (n) => {
				const r = n.getAttribute('@bind'); if (!r) {
					return;
				} const s = pl(n, t); s && (e.push({
					path: s,
					key: El(r),
				}), n.removeAttribute('@bind'));
			}), O(t.querySelectorAll('*'), (n) => {
				const r = n.attributes; for (let s = r.length - 1; s >= 0; s--) {
					const i = r[s].name; const o = wl.exec(i); if (!o) {
						continue;
					} const l = r[s].value; if (!l) {
						n.removeAttribute(i); continue;
					} const c = pl(n, t); if (c) {
						const t = o[2]; e.push({
							path: c,
							key: El(l),
							modifiers: t ? t.slice(1).split('.') : null,
						});
					}n.removeAttribute(i);
				}
			}), e;
		}(i)); const a = (function(t) {
			const e = []; return Xi.forEach((n) => {
				const r = t.querySelectorAll(`[${n}]`); O(r, (r) => {
					const s = r.getAttribute(n); r.removeAttribute(n); const i = pl(r, t); if (!i) {
						return;
					} const o = Sl.test(s); e.push({
						path: i,
						attrName: n,
						value: o ? void 0 : s,
					});
				});
			}), e;
		}(i)); const u = (function(t) {
			const e = []; return O(t.querySelectorAll('*'), (n) => {
				const r = n.attributes; for (let s = r.length - 1; s >= 0; s--) {
					const i = r[s].name; if (35 !== i.charCodeAt(0)) {
						continue;
					} const o = i.slice(1); if (n.removeAttribute(i), !Ds(o)) {
						throw new SyntaxError(`Invalid #ref name "${o}". Use lowercase letters, digits, and underscore only ("_" not "-" for word separators). Example: <input #email_field>.`);
					} const l = pl(n, t); l && e.push({
						path: l,
						name: o,
					});
				}
			}), e;
		}(i)); return {
			fragment: i,
			spotPlans: l,
			dataBindPlans: c,
			subeventPlans: a,
			refPlans: u,
			hasPortal: Boolean(i.querySelector('portal')),
			isStatic: !(l.length || c.length || a.length || u.length),
		};
	}(t)), fl.set(t, e)), e;
} const xl = new WeakMap(); function Cl() {
	const t = xl.get(this); if (!t) {
		return;
	} if (t.isCheck) {
		return void Q(t.component.stateProxy, t.bindingKey, this.checked);
	} let e = this.value; if (t.modTrim && (e = e.trim()), t.modNumber) {
		const t = parseFloat(e); e = Number.isNaN(t) ? e : t;
	}Q(t.component.stateProxy, t.bindingKey, e);
} class Rl {
	constructor(t, e, n, r) {
		this.el = t, this.component = n, this.bindingKey = e, this.isCheck = 'checkbox' === t.type || 'radio' === t.type, this.modNumber = !1, this.modTrim = !1; let s = !1; if (r) {
			for (let t = 0; t < r.length; t++) {
				const e = r[t]; 'number' === e ? this.modNumber = !0 : 'trim' === e ? this.modTrim = !0 : 'lazy' === e && (s = !0);
			}
		} this.eventType = s ? 'change' : cl(t), this.busSubscription = null;
	}handle(t) {
		this.isCheck ? this.el.checked = Boolean(t) : this.el.value = String(t ?? '');
	}unsubscribe() {
		xl.delete(this.el), this.el.removeEventListener(this.eventType, Cl), this.busSubscription && (this.busSubscription.unsubscribe(), this.busSubscription = null);
	}
} function Ml(t, e, n, r, s) {
	const i = new Rl(t, e, n, s); xl.set(t, i), t.addEventListener(i.eventType, Cl), i.busSubscription = (function(t, e, n, r) {
		return gn(t).subscribe(e, n, r);
	}(n, e, Rl.prototype.handle, i)), r.push(i); const o = B(n.STATE, e); void 0 !== o && i.handle(o);
} function kl(t, e, n) {
	t.anchored = !0, t.startComment = e, t.endComment = n, t.textNode = null;
} function Ll(t, e, n, r) {
	if (t.anchored) {
		return (function(t, e, n, r) {
			const s = e.startComment; const i = e.endComment; if (!s || !i) {
				return null;
			} const o = s.parentNode; const l = n[t.slotIndex]; if (Gn.isListBinding(l)) {
				const e = new tl(o, t.slotIndex, Us.TEXT, l, r, l.key, l.renderFn, l.keyFn, l.filterFn); return e.bindingGlobal = l.global, kl(e, s, i), e.refresh(null), $o(e, Oo(l.key, r, l.global)), Xn.isRemoteListBinding(l) && Ns(r, o, l), e;
			} if (Yn(l)) {
				const e = l.key; const n = l.global; const c = r?.propertyIndex; const a = t.declaredKind ?? l.kind ?? c?.kinds.get(e) ?? null; const u = new Qo(o, t.slotIndex, Us.TEXT, void 0, l, r, e, a, n); return kl(u, s, i), c?.hasNonReactive && c.nonReactivePaths.has(e) ? (u.kind = null, u.refresh(), u) : (u.refresh(), $o(u, Oo(e, r, n)), u);
			} if (a(l)) {
				const e = t.declaredKind ?? l.contentKind ?? null; const n = new el(o, t.slotIndex, Us.TEXT, void 0, l, r, e); return kl(n, s, i), n.refresh(), n;
			} const c = new ol(o, t.slotIndex, Us.TEXT, void 0, l, t.declaredKind); return kl(c, s, i), Xo(c, l), c;
		}(t, e, n, r));
	} const s = e; if (!s) {
		return null;
	} if (t.type === Us.MULTI_ATTR) {
		const e = (function(t, e) {
			const n = new Array(t.length); for (let r = 0; r < t.length; r++) {
				const s = t[r]; void 0 === s.literal ? n[r] = {
					exprIndex: s.exprIndex,
					expr: e[s.exprIndex],
				} : n[r] = {
					literal: s.literal,
				};
			} return n;
		}(t.parts, n)); return 'class' === t.attr ? il(t, s, e, r) : (function(t, e, n, r) {
			const s = new nl(e, t.slotIndex, t.attr, n, r); return s.refresh(), s;
		}(t, s, e, r));
	} const i = n[t.slotIndex]; if (t.type === Us.BIND) {
		return Yn(i) ? dl(t, s, i, r) : null;
	} if (t.type === Us.EVENT) {
		if (t.deduceFromExpr && (null == i || !1 === i)) {
			return null;
		} const e = (function(t, e) {
			if (!t.deduceFromExpr) {
				return t.eventName;
			} if (!a(e)) {
				throw new TypeError('Template event handler must be a function.');
			} const n = e.name; if (!n || n.startsWith('bound ')) {
				throw new TypeError(`@\${fn} requires a named function reference; got "${n || 'anonymous'}". Pass a class method, named function, or class arrow field; not an anonymous arrow or .bind() result.`);
			} return n;
		}(t, i)); return (function(t, e, n, r, s) {
			const i = new sl(e, t.slotIndex, n, r, s, t.modifiers); let o = Yo.get(e); return o || (o = new Map(), Yo.set(e, o)), o.set(n, i), e.addEventListener(n, Jo, i.listenerOptions()), i;
		}(t, s, e, i, r));
	} const o = t.type; let l = t.attr; if (t.type === Us.TEXT) { } else if (t.type === Us.BARE_ATTR) {
		const t = oi(i); if (!t) {
			return null;
		} l = t;
	} else if (t.type === Us.ATTR) {
		if ('class' === t.attr) {
			return il(t, s, [
				{
					exprIndex: t.slotIndex,
					expr: i,
				},
			], r);
		}
	} else if (t.type !== Us.BOOL_ATTR && t.type !== Us.PROP) {
		return null;
	} const c = l === t.attr ? t : {
		...t,
		attr: l,
	}; if (Yn(i)) {
		return (o === Us.ATTR || o === Us.BARE_ATTR) && oo.has(s.tagName) && lo.has(l) ? dl(c, s, i, r) : (function(t, e, n, r) {
			const s = n.key; const i = n.global; if (Gn.isListBinding(n)) {
				const o = new tl(e, t.slotIndex, t.type, n, r, s, n.renderFn, n.keyFn, n.filterFn); return o.bindingGlobal = i, o.refresh(null), $o(o, Oo(s, r, i)), Xn.isRemoteListBinding(n) && Ns(r, e, n), o;
			} const o = r.propertyIndex; const l = t.declaredKind ?? n.kind ?? o?.kinds.get(s) ?? null; const c = new Qo(e, t.slotIndex, t.type, t.attr, n, r, s, l, i); return c.elided = !0 === t.elided, o?.hasNonReactive && o.nonReactivePaths.has(s) ? (c.kind = null, c.refresh(), c) : (c.refresh(), $o(c, Oo(s, r, i)), c);
		}(c, s, i, r));
	} if (a(i)) {
		const t = (function(t, e, n, r, s) {
			if (n !== Us.ATTR && n !== Us.BARE_ATTR || !oo.has(r.tagName) || !lo.has(s)) {
				return null;
			} const i = Po(t, e); const o = (function(t) {
				let e = null; let n = 0; for (const [
					r,
					s,
				] of t) {
					for (const t of s) {
						if (n += 1, n > 1) {
							return null;
						} e = {
							realm: r,
							path: t,
						};
					}
				} return 1 === n ? e : null;
			}(i.deps)); if (!o) {
				return null;
			} const l = !0 === o.realm.global; const c = (function(t, e, n) {
				const r = Ao(e, t, n); return r.realm.read(r.path);
			}(t, o.path, l)); return c === i.value ? {
				key: o.path,
				global: l,
			} : null;
		}(r, i, o, s, l)); return t ? dl(c, s, i, r, t.key, t.global) : (function(t, e, n, r) {
			const s = t.declaredKind ?? n.contentKind ?? null; const i = new el(e, t.slotIndex, t.type, t.attr, n, r, s); return i.elided = !0 === t.elided, i.refresh(), i;
		}(c, s, i, r));
	} const u = new ol(s, t.slotIndex, o, l, i, t.declaredKind); return u.elided = !0 === t.elided, o === Us.TEXT && (Gn.isListBinding(i) ? (u.patch = Fo, u.elided || (s.style.pointerEvents = '')) : mo.is(i) && (u.patch = jo, u.elided || (s.style.pointerEvents = ''))), Xo(u, i), u;
} function Nl(t) {
	if (t && t.length) {
		for (let e = 0; e < t.length; e++) {
			t[e].unsubscribe();
		}
	}
} function Pl(t, e) {
	const n = new Set(); for (let e = 0; e < t.length; e++) {
		const r = t[e]; if (r.type !== Us.MULTI_ATTR && r.type !== Us.CLASS_LIST) {
			r.bindingKey ? n.add(r.bindingKey) : Yn(r.expr) && n.add(r.expr.key);
		} else {
			for (let t = 0; t < r.parts.length; t++) {
				const e = r.parts[t]; Yn(e.expr) && n.add(e.expr.key);
			}
		}
	} if (e) {
		for (let t = 0; t < e.length; t++) {
			const r = e[t]; r.key && n.add(r.key);
		}
	} return n;
} const Al = Object.freeze([]); const Ol = Object.freeze([]); const Il = new Set(); function Dl(t, e, n) {
	if (t.isStatic) {
		return {
			fragment: t.fragment.cloneNode(!0),
			spots: Al,
			unsubs: Ol,
			boundKeys: Il,
		};
	} const r = ue.mark('instantiate'); const s = t.fragment.cloneNode(!0); const i = []; const o = []; const l = t.spotPlans; const c = t.dataBindPlans; const a = t.subeventPlans; const u = t.refPlans; const h = ue.mark('spotInstall'); const d = new Array(l.length); for (let t = 0; t < l.length; t++) {
		d[t] = gl(l[t], s);
	} const f = new Array(c.length); for (let t = 0; t < c.length; t++) {
		f[t] = ml(s, c[t].path);
	} const p = a ? new Array(a.length) : null; if (a) {
		for (let t = 0; t < a.length; t++) {
			p[t] = ml(s, a[t].path);
		}
	} const m = u ? new Array(u.length) : null; if (u) {
		for (let t = 0; t < u.length; t++) {
			m[t] = ml(s, u[t].path);
		}
	} for (let t = 0; t < l.length; t++) {
		const r = Ll(l[t], d[t], e, n); r && i.push(r);
	}ue.measure('spotInstall', h); for (let t = 0; t < c.length; t++) {
		const e = f[t]; e && Ml(e, c[t].key, n, o, c[t].modifiers);
	} if (a) {
		for (let t = 0; t < a.length; t++) {
			const e = p[t]; if (!e) {
				continue;
			} const r = a[t]; const s = Ts(r.attrName); if (s?.install) {
				const t = s.install(e, r.value, n); 'function' == typeof t && o.push(t);
			}
		}
	} if (u) {
		for (let t = 0; t < u.length; t++) {
			const e = m[t]; e && o.push($s(n, u[t].name, e));
		}
	} const g = {
		fragment: s,
		spots: i,
		unsubs: o,
		boundKeys: Pl(i, t.dataBindPlans),
	}; return ue.measure('instantiate', r), g;
} function $l(t, e, n) {
	t.type !== Us.EVENT ? t.type !== Us.BIND && (Yn(e) || a(e) ? t.expr = e : t.type !== Us.TEXT && t.type !== Us.ATTR && t.type !== Us.BARE_ATTR && t.type !== Us.BOOL_ATTR && t.type !== Us.PROP || (Xo(t, e), t.expr = e)) : t.expr = e;
} function Fl(t) {
	return null !== t && 'object' == typeof t && void 0 !== t[pn];
} function jl(t, e) {
	let n = !1; for (let r = 0; r < t.length; r++) {
		const s = t[r]; if (void 0 === s.exprIndex) {
			continue;
		} const i = e[s.exprIndex]; s.expr !== i && (s.expr = i, n = !0);
	} return n;
} function Bl(t, e, n) {
	const {
		spots: r, prevExprs: s,
	} = t; for (let t = 0; t < r.length; t++) {
		const n = r[t]; if (n.type === Us.MULTI_ATTR) {
			jl(n.parts, e) && n.refresh(); continue;
		} if (n.type === Us.CLASS_LIST) {
			jl(n.parts, e) && n.refresh(); continue;
		} const i = n.slotIndex; if (void 0 === i) {
			continue;
		} const o = e[i]; (o !== s[i] || Fl(o)) && $l(n, o);
	}t.prevExprs = e.slice();
} function Vl(t) {
	co(t);
} function Wl(t) {
	!(function(t) {
		const e = Ki.get(t); if (e) {
			for (let t = 0; t < e.length; t++) {
				e[t].remove();
			}Ki.delete(t);
		}
	}(t)), t.tplState && Nl(t.tplState.spots), P(t.tplUnsubs, H), t.tplUnsubs = [], t.tplCleanupNodes.size && (t.tplCleanupNodes.forEach(Vl), t.tplCleanupNodes.clear()), t.tplState = null, t.tplBoundKeys = new Set(), t.htmlElementCache?.clear();
} const Ul = new WeakMap(); function zl(t) {
	const e = Ul.get(t); e && (Ul.delete(t), Nl(e.spots), Lo(e.unsubs));
} let Kl = !1; let _l = null; let ql = null; let Hl = null; let Gl = null; const Xl = 320; const Yl = 'cubic-bezier(0.34, 1.56, 0.64, 1)'; const Jl = {
	down: 1,
	right: 1,
	up: -1,
	left: -1,
}; function Zl() {
	return !0;
} function Ql() {
	return !1;
} function tc() {
	return 0;
} function ec(t, e = {}) {
	if (!t) {
		return {
			destroy() {},
		};
	} const n = 'x' === e.axis ? 'x' : 'y'; const r = 'x' === n ? 'clientX' : 'clientY'; const s = e.opensToward || ('x' === n ? 'right' : 'down'); const i = Jl[s] ?? 1; const o = e.threshold ?? 6; const l = e.snapRatio ?? 0.3; const c = e.snapVelocity ?? 0.5; const a = e.enabled || Zl; const u = e.isOpen || Ql; const h = e.extent || tc; const d = e.snapExtent || h; const f = e.onStart; const p = e.onMove; const m = e.onSettle; let g = null; let y = 0; let b = 0; let v = 0; let w = !1; let E = !1; let S = 1; let T = !1; let x = !1; function C() {
		if (null === g) {
			return;
		} const t = globalThis.document; t.removeEventListener('pointermove', M), t.removeEventListener('pointerup', k), t.removeEventListener('pointercancel', k), globalThis.removeEventListener('blur', L), g = null;
	} function R(t) {
		if (x || null !== g) {
			return;
		} if (void 0 !== t.button && 0 !== t.button) {
			return;
		} if (!a(t)) {
			return;
		} g = t.pointerId, y = t[r], b = performance.now(), v = 0, w = !1, T = !1, E = !0 === u(), S = E ? -i : i; const e = globalThis.document; e.addEventListener('pointermove', M), e.addEventListener('pointerup', k), e.addEventListener('pointercancel', k), globalThis.addEventListener('blur', L);
	} function M(t) {
		if (t.pointerId !== g) {
			return;
		} const e = t[r] - y; if (v = (function(t, e) {
			return e * Math.max(0, e * t);
		}(e, S)), !w) {
			if (Math.abs(e) <= o) {
				return;
			} w = !0, f?.(E);
		} const n = h(); const s = n > 0 ? Math.min(1, Math.abs(v) / n) : 0; p?.(s, v);
	} function k(t) {
		if (t.pointerId !== g) {
			return;
		} if (C(), !w) {
			return;
		} T = !0; const e = Math.max(performance.now() - b, 1); const n = Math.abs(v); const r = n / e; const s = d(); const i = (s > 0 ? n / s : 0) >= l || r >= c; const o = E ? !i : i; m?.(o);
	} function L() {
		null !== g && k({
			pointerId: g,
		});
	} function N(t) {
		T && (T = !1, t.stopPropagation(), t.preventDefault());
	} return t.addEventListener('pointerdown', R), t.addEventListener('click', N, !0), {
		destroy() {
			x || (x = !0, C(), t.removeEventListener('pointerdown', R), t.removeEventListener('click', N, !0));
		},
	};
} function nc() {
	return !0;
} function rc() {
	return 0;
} function sc(t, e = {}) {
	if (!t) {
		return {
			destroy() {},
		};
	} const n = 'y' == ('y' === e.axis ? 'y' : 'x') ? 'clientY' : 'clientX'; const r = e.threshold ?? 8; const s = e.stepRatio ?? 0.25; const i = e.stepVelocity ?? 0.4; const o = e.enabled || nc; const l = e.extent || rc; const c = e.canStep || nc; const a = e.onStart; const u = e.onMove; const h = e.onSettle; let d = null; let f = 0; let p = 0; let m = 0; let g = !1; let y = !1; let b = !1; function v() {
		if (null === d) {
			return;
		} const t = globalThis.document; t.removeEventListener('pointermove', E), t.removeEventListener('pointerup', S), t.removeEventListener('pointercancel', S), globalThis.removeEventListener('blur', T), d = null;
	} function w(t) {
		if (b || null !== d) {
			return;
		} if (void 0 !== t.button && 0 !== t.button) {
			return;
		} if (!o(t)) {
			return;
		} d = t.pointerId, f = t[n], p = performance.now(), m = 0, g = !1, y = !1; const e = globalThis.document; e.addEventListener('pointermove', E), e.addEventListener('pointerup', S), e.addEventListener('pointercancel', S), globalThis.addEventListener('blur', T);
	} function E(t) {
		if (t.pointerId !== d) {
			return;
		} if (m = t[n] - f, !g) {
			if (Math.abs(m) <= r) {
				return;
			} g = !0, a?.();
		} const e = l(); const s = e > 0 ? Math.min(1, Math.abs(m) / e) : 0; u?.(m, s);
	} function S(t) {
		if (t.pointerId !== d) {
			return;
		} if (v(), !g) {
			return;
		} y = !0; const e = Math.max(performance.now() - p, 1); const n = Math.abs(m); const r = n / e; const o = l(); let a = 0; if (((o > 0 ? n / o : 0) >= s || r >= i) && 0 !== m) {
			const t = m < 0 ? 1 : -1; c(t) && (a = t);
		}h?.(a);
	} function T() {
		null !== d && S({
			pointerId: d,
		});
	} function x(t) {
		y && (y = !1, t.stopPropagation(), t.preventDefault());
	} return t.addEventListener('pointerdown', w), t.addEventListener('click', x, !0), {
		destroy() {
			b || (b = !0, v(), t.removeEventListener('pointerdown', w), t.removeEventListener('click', x, !0));
		},
	};
} function ic(t) {
	this.inertSequence += 1; const e = this.inertSequence; if (!t) {
		return this.toggleAttribute('inert', !1), Promise.resolve();
	} const n = this.getAnimations({
		subtree: !0,
	}).filter((t) => {
		return t.effect?.getTiming?.()?.iterations !== 1 / 0;
	}); return n.length ? Promise.allSettled(n.map((t) => {
		return t.finished;
	})).then(() => {
		this.inertSequence === e && this.isConnected && this.toggleAttribute('inert', !0);
	}) : (this.toggleAttribute('inert', !0), Promise.resolve());
} class oc extends HTMLElement {
	static url = import.meta.url; static styles = {
		...mr,
	}; static scopeStyles = !0; static state = {}; static attrs = {}; static config = {}; static properties = {}; static mergeState = !0; static mergeObjects = !1; static skipStaticState = !1; static isWebComponent(t) {
		return t instanceof oc;
	} static getById = gs; static preRender = ys; static createBound = bs; static assertConfig(t = {}) {
		!(function(t) {
			if (!(function(t) {
				return o(t) && !w(t) && !f(t) && !a(t.replaceSync);
			}(t))) {
				throw new TypeError('WebComponent constructor expects a config object.');
			}
		}(t));
	} static styleSheet(t, e) {
		return Jr(t, e);
	} static collectClassChain(t) {
		return Dr(t);
	} static ensureMergedState(t = this) {
		return Vr(t);
	} static ensureMergedAttrs(t = this) {
		return Wr(t);
	} static ensureMergedConfig(t = this) {
		return (function(t) {
			return $r(t, 'config', 'mergedConfig');
		}(t));
	} static ensureMergedProperties(t = this) {
		return Ur(t);
	} static ensurePropertyIndex(t = this) {
		return zr(t);
	} static get observedAttributes() {
		return C(Wr(this));
	} static compileStyles(t) {
		return Zr(t);
	} static ensureCompiledStyles(t = this) {
		return Qr(t);
	} static preload(t = this) {
		return Qr(t);
	} static delegateTo(t, e, n, r, s) {
		return (function(t, e, n, r, s) {
			return ps(null, t, e, n, r, s);
		}(t, e, n, r, s));
	} static async compile(t) {
		const e = new this(t); const n = document.createElement('div'); n.style.cssText = 'position:absolute;left:-99999px;top:0;width:1px;height:1px;overflow:hidden;pointer-events:none;', document.body.appendChild(n), n.appendChild(e); try {
			await (e.lifecycle?.whenRendered);
		} finally {
			n.remove();
		}
	} static async create(t, e = {}) {
		return this.assertConfig(e), new this(await t, e);
	}constructor(t = {}, e, n) {
		super(); const r = ue.mark('construct'); let s; let i; let o; if (this.flags.skipStaticState = !0 === this.constructor.skipStaticState, this.flags.mergeState = !1 !== this.constructor.mergeState, this.flags.mergeObjects = !0 === this.constructor.mergeObjects, n && T(this.flags, n), this.propertyIndex = zr(this.constructor), T(this.config, this.constructor.ensureMergedConfig()), e && (this.constructor.assertConfig(e), T(this.config, e)), !1 !== this.constructor.useShadow && this.attachShadow({
			mode: 'open',
		}), this.constructor.ensureCompiledStyles(), (s = this).tplUnsubs = [], s.tplState = null, s.tplBoundKeys = new Set(), s.tplCleanupNodes = new Set(), s.htmlElementCache = new Map(), this.attrs = (i = this, o = this.constructor.ensureMergedAttrs(), new Proxy({}, {
			get(t, e) {
				if ('symbol' != typeof e && e in o) {
					return (function(t, e, n) {
						if ('boolean' == typeof n) {
							return t.hasAttribute(e);
						} const r = t.getAttribute(e); return null == r ? n : 'number' == typeof n ? Number(r) : r;
					}(i, e, o[e]));
				}
			},
			set: (t, e, n) => {
				return 'symbol' == typeof e || !(e in o) || ((function(t, e, n) {
					null != n && !1 !== n ? !0 !== n ? t.setAttribute(e, String(n)) : t.setAttribute(e, '') : t.removeAttribute(e);
				}(i, e, n)), !0);
			},
			has: (t, e) => {
				return e in o;
			},
			ownKeys: () => {
				return Object.keys(o);
			},
			getOwnPropertyDescriptor(t, e) {
				if (e in o) {
					return {
						configurable: !0,
						enumerable: !0,
					};
				}
			},
		})), !this.flags.skipStaticState) {
			const t = this.constructor.ensureMergedState(); const e = Object.getOwnPropertyDescriptors(t); const n = Object.getOwnPropertyNames(e); for (let t = 0; t < n.length; t += 1) {
				const r = n[t]; const s = e[r]; if (s.get || s.set) {
					continue;
				} const i = s.value; this.STATE[r] = null === i || 'object' != typeof i ? i : Z(i);
			}
		} if (l(t)) {
			if (this.flags.mergeObjects) {
				const e = C(t); for (let n = 0; n < e.length; n += 1) {
					const r = e[n]; this.STATE[r] = J(this.STATE[r], t[r]);
				}
			} else {
				T(this.STATE, t);
			}
		} this.onInit?.(t, e, n), this.initState(), this.upgradeShadowedProperties(), this.createConnectCyclePromises(), this.createWhenDestroyedPromise(), ue.measure('construct', r);
	}console(...t) {
		Qt.info('WebComponent', `[${this.constructor.name}] Constructor`, ...t);
	}debug(...t) {}config = {}; flags = {}; lifecycle = {}; isWebComponent = !0; propertyIndex = null; STATE = {}; stateProxy = null; stateBus = null; proxyCache = null; globalUnsubs = null; eventEntries = null; stateUnsubs = null; delegateEntries = null; hotkeyEntries = null; gestureUnsubs = null; listenerCache = null; provided = null; providedConsumers = null; injectLinks = null; templateBuilt = !1; renderDepDirty = !1; firstRenderDone = !1; renderTracking = !1; renderProxy = null; renderProxyState = null; globalRenderProxy = null; globalRenderProxyState = null; intervals = null; phase = re.CREATED; isRendering = !1; isIntersecting = !1; isIntersected = !1; isVisible = !1; parentComponent = null; pendingDestroy = !1; intersectObserved = !1; visibleFired = !1; renderSeq = 0; unregisterFromParent = null; timeouts = null; pendingConnect = null; styleMap = null; inertSequence = 0; renderDepUnsubs = new Map(); refsMap = null; refsProxy = null; get refs() {
		return this.refsProxy ??= js(this), this.refsProxy;
	}getRef(t) {
		return Fs(this, t);
	} get state() {
		return this.renderTracking ? this.renderProxy : this.stateProxy;
	} set state(t) {
		this.replaceState(t);
	} get global() {
		return this.renderTracking ? (this.globalRenderProxy && this.globalRenderProxyState === On.proxy || (this.globalRenderProxy = _n(On.proxy), this.globalRenderProxyState = On.proxy), this.globalRenderProxy) : On.proxy;
	}atPhase = ie; onLifecycleError(t) {
		console.error(`[${this.localName}] lifecycle error:`, t);
	}onRenderError(t) {
		console.error(`[${this.localName}] render error:`, t);
	}nextFrame() {
		return Ze();
	}
} const lc = {
	addInterval: Rr,
	async addStyle(t, e, n) {
		if (!c(t)) {
			throw new TypeError('addStyle: key must be a string.');
		} await Qr(this.constructor); const r = await this.resolveStyle(e, n); return this.forkStyleMap(), this.styleMap.set(t, r), this.shadowRoot && (this.shadowRoot.adoptedStyleSheets = [...this.styleMap.values()]), r;
	},
	async applyStyles() {
		const t = this.constructor; if (!this.shadowRoot && !1 === t.scopeStyles) {
			return void (function(t) {
				if (qr.has(t)) {
					return;
				} qr.add(t); const e = Dr(t)[0]; const n = [...Hr(t).values()]; for (let t = 0; t < n.length; t++) {
					const r = n[t]; r.owner !== e && Gr(r);
				}
			}(t));
		} if (this.styleMap) {
			return void (this.shadowRoot ? this.shadowRoot.adoptedStyleSheets = [...this.styleMap.values()] : ns(t, this.styleMap, this.localName));
		} const e = await Qr(t); this.shadowRoot ? this.shadowRoot.adoptedStyleSheets = this.styleMap ? [...this.styleMap.values()] : e.array : ns(t, e.map, this.localName);
	},
	applyThemeStyles() {
		return is(this.constructor).length ? (this.delegate('theme:change', this.handleThemeChange), this.syncThemeStyles(ss())) : null;
	},
	applyViewportBucket() {
		const t = this.global?.environment?.viewport?.w ?? 'lg'; this.setAttribute('data-vw', t);
	},
	handleThemeChange(t) {
		const e = t?.detail?.data?.id ?? ss(); return this.syncThemeStyles(e);
	},
	async syncThemeStyles(t) {
		const e = is(this.constructor); for (let n = 0; n < e.length; n++) {
			const {
				layerClass: r, key: s,
			} = e[n]; t && r.themes.includes(t) ? await this.addStyle(s, `./themes/${t}.css`, r.url) : this.hasStyle(s) && await this.removeStyle(s);
		}
	},
	bind: qn,
	clearIntervals: kr,
	clearTimeouts: Cr,
	cleanupTemplate() {
		Wl(this);
	},
	clearDelegateListeners() {
		const t = this.delegateEntries; if (!t?.size) {
			return;
		} const e = Array.from(t); for (let t = 0; t < e.length; t++) {
			e[t].unsubscribe();
		}t.clear();
	},
	async confirm(t) {
		return await (async function() {
			const t = lr('ui-modal'); t && await t, _l || ((function() {
				if (Kl) {
					return;
				} const t = document.createElement('style'); t.textContent = '\n.confirm-prompt { display:flex; flex-direction:column; gap:1rem; padding:1.25rem 1.5rem; min-width:280px; max-width:480px; font:inherit; }\n.confirm-prompt-msg { margin:0; line-height:1.4; white-space:pre-wrap; }\n.confirm-prompt-actions { display:flex; gap:.5rem; justify-content:flex-end; margin:0; padding:0; list-style:none; }\n.confirm-prompt-actions button { font:inherit; cursor:pointer; padding:.5rem 1rem; border-radius:.375rem; border:1px solid currentColor; background:transparent; color:inherit; }\n.confirm-prompt-accept { background:currentColor; }\n.confirm-prompt-accept > * { color:canvas; }\n.confirm-prompt-actions button:hover { opacity:.85; }\n', document.head.appendChild(t), Kl = !0;
			}()), _l = document.createElement('ui-modal'), _l.innerHTML = '\n\t\t<div class="confirm-prompt">\n\t\t\t<p class="confirm-prompt-msg"></p>\n\t\t\t<div class="confirm-prompt-actions">\n\t\t\t\t<button type="button" class="confirm-prompt-cancel">Cancel</button>\n\t\t\t\t<button type="button" class="confirm-prompt-accept">OK</button>\n\t\t\t</div>\n\t\t</div>\n\t', document.body.appendChild(_l), ql = _l.querySelector('.confirm-prompt-msg'), Hl = _l.querySelector('.confirm-prompt-accept'), Gl = _l.querySelector('.confirm-prompt-cancel'), await _l.lifecycle.whenRendered);
		}()), ql.textContent = String(t), new Promise((t) => {
			let e = !1; function n(n) {
				e || (e = !0, Hl.removeEventListener('click', r), Gl.removeEventListener('click', s), _l.removeEventListener('modal-close', i), _l.close(), t(n));
			} function r() {
				n(!0);
			} function s() {
				n(!1);
			} function i() {
				n(!1);
			}Hl.addEventListener('click', r), Gl.addEventListener('click', s), _l.addEventListener('modal-close', i), _l.open();
		});
	},
	copyText(t) {
		if (null == t || '' === t) {
			return Promise.resolve(!1);
		} const e = globalThis.navigator?.clipboard; return e?.writeText ? e.writeText(String(t)).then(() => {
			return !0;
		}, () => {
			return !1;
		}) : Promise.resolve(!1);
	},
	delegate(t, e, n) {
		if (!c(t) || !t.trim()) {
			throw new TypeError('eventName must be a non-empty string');
		} if (!a(e)) {
			throw new TypeError('handler must be a function');
		} const r = fs.create(this, 'bus', t.trim(), e, n); return r.subscribe(), r;
	},
	delegateTo(t, e, n, r, s) {
		return ps(this, t, e, n, r, s);
	},
	dragSnap(t, e) {
		const n = ec(t, e); return (this.gestureUnsubs ??= new Set()).add(n.destroy), n;
	},
	dragTrack(t, e) {
		const n = sc(t, e); return (this.gestureUnsubs ??= new Set()).add(n.destroy), n;
	},
	forkStyleMap() {
		if (this.styleMap) {
			return this.styleMap;
		} const t = this.constructor.compiledStyles; return this.styleMap = t ? new Map(t) : new Map(), this.styleMap;
	},
	handleObserverCallback: Ws,
	hasStyle(t) {
		if (this.styleMap) {
			return this.styleMap.has(t);
		} const e = this.constructor.compiledStyles; return Boolean(e) && e.has(t);
	},
	hotKey(t, e, n) {
		const r = this; const s = Be(r, t, e, 'api', n); const i = s.entry; return i ? ((r.hotkeyEntries ??= new Set()).add(i), function() {
			s.unregister(), r.hotkeyEntries?.delete(i);
		}) : s.unregister;
	},
	hotKeyListeners(t) {
		const e = Ie.get(xe(t)); const n = []; if (!e) {
			return n;
		} const r = this; return e.forEach((t) => {
			const e = t.targetRef.deref(); e && e !== r && -1 === n.indexOf(e) && n.push(e);
		}), n;
	},
	html(t, ...e) {
		const n = this.tplState; if (n && n.strings === t) {
			return Bl(n, e), void (this.templateBuilt = !0);
		} Wl(this); const r = Tl(t); const s = Dl(r, e, this); this.tplUnsubs = s.unsubs, this.tplBoundKeys = s.boundKeys; const i = this.shadowRoot ?? this; i === this && (function(t) {
			if (Bi.has(t)) {
				return;
			} const e = []; let n = t.firstChild; for (;n;) {
				e.push(n), n = n.nextSibling;
			}Bi.set(t, e);
		}(this)), i.replaceChildren(s.fragment), i === this && (function(t) {
			const e = [...t.getElementsByTagName('slot')]; if (!e.length) {
				return;
			} const n = Bi.get(t) ?? []; const r = new Set(); for (let t = 0; t < e.length; t++) {
				const s = e[t]; const i = s.getAttribute('name') || ''; const o = r.has(i) ? [] : Wi(n, i); r.add(i), o.length ? zi(s, o) : Ui(s);
			}
		}(this)), r.hasPortal && (function(t, e) {
			const n = [...e.querySelectorAll('portal')]; if (!n.length) {
				return;
			} const r = []; for (let e = 0; e < n.length; e++) {
				const s = n[e]; const i = _i(s.getAttribute('to')); if (!i) {
					Gi(s); continue;
				} const o = Hi(t); i.appendChild(o.wrapper), qi(s, o.mount), s.remove(), r.push(o.wrapper);
			}r.length && Ki.set(t, r);
		}(this, i)), this.templateBuilt = !0, this.tplState = {
			strings: t,
			spots: s.spots,
			prevExprs: e.slice(),
		};
	},
	htmlElement(t, ...e) {
		const n = this.htmlElementCache; if (n) {
			const r = n.get(t); if (r) {
				return Bl(r.tplState, e), r.element;
			}
		} const r = Dl(Tl(t), e, this); if (1 !== r.fragment.children.length) {
			throw Nl(r.spots), Lo(r.unsubs), new TypeError('htmlElement requires exactly one root element.');
		} const s = r.fragment.firstElementChild; return Ul.set(s, r), s[io] = zl, this.tplCleanupNodes?.add(s), n && n.set(t, {
			element: s,
			tplState: {
				strings: t,
				spots: r.spots,
				prevExprs: e.slice(),
			},
		}), s;
	},
	installObserver() {
		if (this.intersectObserved) {
			return;
		} if (!this.onIntersect && !this.onVisible) {
			return;
		} const t = Vs || (g(typeof IntersectionObserver) ? null : (Vs = new IntersectionObserver((t) => {
			for (let e = 0; e < t.length; e++) {
				const n = t[e]; const r = Bs.get(n.target); r && Ws.call(r, n);
			}
		}, {
			threshold: 0,
		}), Vs)); t && (Bs.set(this, this), this.intersectObserved = !0, t.observe(this));
	},
	uninstallObserver() {
		if (!this.intersectObserved) {
			return;
		} const t = Vs; Bs.delete(this), this.intersectObserved = !1, t?.unobserve(this);
	},
	onEnv(t, e, n) {
		if (!c(t) || !t.trim()) {
			throw new TypeError('eventName must be a non-empty string');
		} if (!a(e)) {
			throw new TypeError('handler must be a function');
		} const r = fs.create(this, 'env', t.trim(), e, n); return r.subscribe(), r;
	},
	reflectViewport() {
		this.applyViewportBucket(), this.delegate('viewport:change', this.applyViewportBucket);
	},
	remote(t) {
		return this.remoteControllers?.get(t) ?? null;
	},
	disposeRemoteLists() {
		const t = this.remoteControllers; if (t) {
			for (const e of t.values()) {
				e.dispose();
			}t.clear(), this.remoteControllers = null;
		}
	},
	async removeStyle(t) {
		if (!c(t)) {
			throw new TypeError('removeStyle: key must be a string.');
		} await Qr(this.constructor), this.forkStyleMap(); const e = this.styleMap.delete(t); return e && this.shadowRoot && (this.shadowRoot.adoptedStyleSheets = [...this.styleMap.values()]), e;
	},
	removeTimeout: xr,
	async resolveStyle(t, e) {
		if (t instanceof CSSStyleSheet) {
			return t;
		} if (!c(t)) {
			throw new TypeError('addStyle expects CSSStyleSheet or string path.');
		} return Jr(t, e ?? this.constructor.url ?? document.baseURI);
	},
	setTimeout: Tr,
	setInert: ic,
	stopInterval: Mr,
}; T(oc.prototype, Ln, tr, nt, i, St, _e, hr, Sr, yt, lc), Object.defineProperties(oc.prototype, oe), Object.defineProperty(oc.prototype, 'importStyles', {
	set(t) {
		if (null == t) {
			return void this.removeStyle('imported-0');
		} const e = w(t) ? t : [t]; for (let t = 0; t < e.length; t++) {
			this.addStyle(`imported-${t}`, e[t]);
		}
	},
	configurable: !0,
}); const cc = new Map(); const ac = new WeakMap(); const uc = new WeakMap(); const hc = new WeakMap(); const dc = new Set(); const fc = new Map(); const pc = new WeakMap(); const mc = new Map(); const
	gc = new Set(); let yc = 0; function bc(t) {
	gc.forEach((e) => {
		try {
			e(t);
		} catch (t) {
			queueMicrotask(() => {
				throw t;
			});
		}
	});
} function vc(t) {
	return ac.get(t) ?? null;
} function wc(t) {
	return hc.get(t) ?? null;
} function Ec() {
	return Array.from(dc);
} function Sc(t) {
	const e = new Map(); mc.forEach((t, n) => {
		e.set(n, t);
	}); const n = t?.constructor?.aiTools; l(n) && Object.keys(n).forEach((t) => {
		e.set(t, n[t]);
	}); const r = t?.tagName?.toLowerCase(); r && fc.has(r) && fc.get(r).forEach((t, n) => {
		e.set(n, t);
	}); const s = pc.get(t); return s && s.forEach((t, n) => {
		e.set(n, t);
	}), e;
} let Tc = null; let xc; function Cc(t, e) {
	return e.toUpperCase();
}a(xc = function() {
	Tc = null;
}) && gc.add(xc); class Rc {
	componentByPath = new Map(); pathByComponent = new WeakMap(); nameByComponent = new WeakMap(); static create() {
		return new Rc();
	}visit(t, e, n) {
		const r = (function(t, e) {
			const n = t.constructor.aiName; if (c(n) && n.length) {
				return n;
			} const r = t.id; if (c(r) && r.length && !r.includes('.')) {
				return r;
			} const s = (function(t) {
				const e = t.tagName.toLowerCase(); const n = e.indexOf('-'); return (n >= 0 ? e.slice(n + 1) : e).replace(/-([a-z0-9])/g, Cc);
			}(t)); let i = s; let o = 2; for (;e.has(i);) {
				i = `${s}${o}`, o += 1;
			} return i;
		}(t, n)); n.add(r), this.nameByComponent.set(t, r); const s = e ? `${e}.${r}` : r; this.componentByPath.set(s, t), this.pathByComponent.set(t, s); const i = wc(t); if (!i?.size) {
			return;
		} const o = [...i]; const l = new Set(); for (let t = 0; t < o.length; t += 1) {
			this.visit(o[t], s, l);
		}
	}build() {
		const t = Ec(); const e = new Set(); for (let n = 0; n < t.length; n += 1) {
			this.visit(t[n], '', e);
		} return this;
	}
} function Mc() {
	return Tc || (Tc = Rc.create().build()), Tc;
} function kc(t) {
	return t ? Mc().pathByComponent.get(t) ?? null : null;
} function Lc(t) {
	return t ? Mc().nameByComponent.get(t) ?? null : null;
} function Nc(t) {
	const e = wc(t); return e?.size ? Array.from(e) : [];
} function Pc(t, e, n) {
	const r = (function(t, e) {
		const n = {
			tag: t.tagName.toLowerCase(),
		}; const r = t.constructor.aiRole ?? t.getAttribute('role'); r && (n.role = r); const s = t.getAttribute('aria-label') ?? t.constructor.aiLabel ?? null; return s && (n.label = s), e?.withPhase && (n.phase = t.phase ?? null), e?.withVisibility && (n.visible = !0 === t.isVisible, n.intersecting = !0 === t.isIntersecting), n;
	}(t, n)); if (e <= 0) {
		return r;
	} const s = wc(t); if (!s?.size) {
		return r;
	} const i = {}; const o = Mc().nameByComponent; return s.forEach((t) => {
		const r = o.get(t); r && (i[r] = Pc(t, e - 1, n));
	}), r.children = i, r;
} function Ac(t = {}) {
	const e = t.depth ?? 1 / 0; const n = Mc().nameByComponent; if (t.root) {
		const r = n.get(t.root) ?? t.root.tagName?.toLowerCase() ?? 'root'; return {
			[r]: Pc(t.root, e - 1, t),
		};
	} const r = {}; return Ec().forEach((s) => {
		const i = n.get(s); i && (r[i] = Pc(s, e - 1, t));
	}), r;
} function Oc(t, e) {
	if (e > 4) {
		return '[depth-limit]';
	} if (null == t) {
		return t;
	} const n = typeof t; if ('number' === n || 'boolean' === n) {
		return t;
	} if ('string' === n) {
		return t.length > 600 ? `${t.slice(0, 600)}…` : t;
	} if ('function' === n) {
		return '[fn]';
	} if ('symbol' === n || 'bigint' === n) {
		return t.toString();
	} if (Array.isArray(t)) {
		const n = t.slice(0, 50); const r = new Array(n.length); for (let t = 0; t < n.length; t++) {
			r[t] = Oc(n[t], e + 1);
		} return t.length > 50 && r.push(`[+${t.length - 50} more]`), r;
	} if (t instanceof Element) {
		return `<${t.tagName.toLowerCase()}${t.id ? `#${t.id}` : ''}>`;
	} if (t instanceof Date) {
		return t.toISOString();
	} if (l(t)) {
		const n = {}; const r = Object.keys(t); for (let s = 0; s < r.length; s++) {
			n[r[s]] = Oc(t[r[s]], e + 1);
		} return n;
	} return `[${n}]`;
} function Ic(t) {
	if (!t.isConnected) {
		return null;
	} const e = t.getBoundingClientRect(); const n = e.bottom > 0 && e.right > 0 && e.top < globalThis.innerHeight && e.left < globalThis.innerWidth; return {
		x: Math.round(e.x),
		y: Math.round(e.y),
		w: Math.round(e.width),
		h: Math.round(e.height),
		visible: e.width > 0 && e.height > 0,
		inViewport: n,
	};
} function Dc(t) {
	const e = {}; const n = t.attributes; for (let t = 0; t < n.length; t++) {
		e[n[t].name] = n[t].value;
	} return e;
} function $c(t, e, n, r, s, i) {
	const o = s ? '' : r ? '└── ' : '├── '; const l = e.tag ? ` <${e.tag}>` : ''; const c = e.phase ? ` :${e.phase}` : ''; const a = !0 === e.visible ? ' 👁' : ''; const u = e.role ? ` [${e.role}]` : ''; const h = e.label ? ` "${e.label}"` : ''; if (i.push(`${n}${o}${t}${l}${c}${a}${u}${h}`), !e.children) {
		return;
	} const d = s ? n : n + (r ? '    ' : '│   '); const f = Object.entries(e.children); for (let t = 0; t < f.length; t++) {
		const [
			e,
			n,
		] = f[t]; $c(e, n, d, t === f.length - 1, !1, i);
	}
} const Fc = Symbol('viat-ai-mixin-applied'); const jc = {
	[re.CONNECTED]: Ve.CONNECTED,
	[re.RENDERED]: Ve.RENDERED,
	[re.MOUNTED]: Ve.MOUNTED,
	[re.LIVE]: Ve.LIVE,
	visible: Ve.VISIBLE,
	[re.DESTROYED]: Ve.DESTROYED,
}; function Bc(t, e) {
	const n = Nc(t); for (let t = 0; t < n.length; t++) {
		e(n[t]), Bc(n[t], e);
	}
} function Vc(t) {
	if (a(t)) {
		return t;
	} if (!t || 'object' != typeof t) {
		return null;
	} const e = t.tag ? String(t.tag).toLowerCase() : null; const n = t.role ?? null; const r = t.label ? String(t.label).toLowerCase() : null; const s = t.pathStartsWith ? String(t.pathStartsWith) : null; return (t) => {
		if (e && t.tagName.toLowerCase() !== e) {
			return !1;
		} if (n && (t.constructor.aiRole ?? t.getAttribute('role')) !== n) {
			return !1;
		} if (r) {
			const e = (t.getAttribute('aria-label') ?? t.constructor.aiLabel ?? '').toLowerCase(); const n = (t.constructor.aiDescription ?? '').toLowerCase(); if (!e.includes(r) && !n.includes(r)) {
				return !1;
			}
		} return !(s && !(kc(t) ?? '').startsWith(s));
	};
} const Wc = {
	aiRegister(t) {
		return (function(t, e = null) {
			let n = ac.get(t); if (!n) {
				for (n = (function(t) {
					return c(t.id) && t.id.length ? t.id : (yc += 1, `${t.tagName.toLowerCase()}.${yc}`);
				}(t)); cc.has(n) && cc.get(n) !== t;) {
					yc += 1, n = `${t.tagName.toLowerCase()}.${yc}`;
				}ac.set(t, n);
			} return cc.set(n, t), (function(t, e) {
				if (e) {
					uc.set(t, e); let n = hc.get(e); n || (n = new Set(), hc.set(e, n)), n.add(t), dc.delete(t);
				} else {
					uc.set(t, null), dc.add(t);
				}
			}(t, e)), bc({
				type: 'componentAdded',
				id: n,
				tag: t.tagName.toLowerCase(),
			}), n;
		}(this, (void 0 === t ? (function(t) {
			const e = t.getRootNode(); const n = e instanceof ShadowRoot ? e.host : t.parentElement; return n && vc(n) ? n : null;
		}(this)) : t) ?? null));
	},
	aiUnregister() {
		return (function(t) {
			const e = ac.get(t); e && (cc.get(e) === t && cc.delete(e), ac.delete(t), pc.delete(t), (function(t) {
				const e = uc.get(t); if (e) {
					const n = hc.get(e); n?.delete(t);
				}uc.delete(t), dc.delete(t), hc.delete(t);
			}(t)), bc({
				type: 'componentRemoved',
				id: e,
			}));
		}(this));
	},
	aiId() {
		return vc(this);
	},
	aiPath() {
		return kc(this);
	},
	aiSegment() {
		return Lc(this);
	},
	aiChildren() {
		return Nc(this);
	},
	aiOverview(t) {
		return Ac({
			...t,
			root: this,
		});
	},
	aiMap(t) {
		return (function(t = {}) {
			const e = Ac(t); const n = []; const r = Object.entries(e); for (let t = 0; t < r.length; t++) {
				const [
					e,
					s,
				] = r[t]; $c(e, s, '', t === r.length - 1, !0, n);
			} return n.join('\n');
		}({
			...t,
			root: this,
		}));
	},
	aiDescribe(t) {
		return (function(t, e = {}) {
			const n = !1 !== e.includeChildren; const r = !1 !== e.includeState; const s = !1 !== e.includeText; const i = !1 !== e.includeTools; const o = !1 !== e.includeRefs; const c = vc(t); const u = kc(t); const h = t.getAttribute('aria-label'); const d = {
				id: c,
				path: u,
				tag: t.tagName.toLowerCase(),
				phase: t.phase ?? null,
				role: t.constructor.aiRole ?? t.getAttribute('role') ?? null,
				label: h ?? t.constructor.aiLabel ?? null,
				description: t.constructor.aiDescription ?? '',
				attributes: Dc(t),
				bounds: Ic(t),
				visibility: {
					isConnected: t.isConnected,
					isRendered: !0 === t.isRendered,
					isMounted: !0 === t.isMounted,
					isLive: !0 === t.isLive,
					isVisible: !0 === t.isVisible,
					isIntersecting: !0 === t.isIntersecting,
					isIntersected: !0 === t.isIntersected,
				},
			}; if (o && t.refsMap && (d.refs = Object.keys(t.refsMap)), s && (d.text = (function(t) {
				const e = t.shadowRoot ?? t; const n = e.textContent?.trim() ?? ''; if (!n) {
					return '';
				} const r = n.replace(/\s+/g, ' '); return r.length > 240 ? `${r.slice(0, 240)}…` : r;
			}(t))), i && (d.tools = (function(t) {
				const e = Sc(t); const n = []; return e.forEach((t, e) => {
					n.push({
						name: e,
						description: t.description ?? '',
						inputSchema: t.inputSchema ?? {
							type: 'object',
						},
						mutating: !0 === t.mutating,
					});
				}), n;
			}(t))), r && l(t.STATE)) {
				const e = a(t.constructor.aiState) ? t.constructor.aiState : null; const n = e ? e(t) : t.STATE; d.state = Oc(n, 0);
			} if (n) {
				const e = Nc(t); d.children = e.map((t) => {
					return {
						name: Lc(t),
						path: kc(t),
						id: vc(t),
						tag: t.tagName.toLowerCase(),
						phase: t.phase ?? null,
					};
				});
			} return d;
		}(this, t));
	},
	aiTools() {
		return Sc(this);
	},
	aiDefineTool(t, e) {
		return (function(t, e, n) {
			let r = pc.get(t); return r || (r = new Map(), pc.set(t, r)), r.set(e, n), () => {
				const r = pc.get(t); r?.get(e) === n && r.delete(e);
			};
		}(this, t, e));
	},
	aiPhase() {
		return this.phase ?? null;
	},
	aiState() {
		const t = a(this.constructor.aiState) ? this.constructor.aiState : null; return Oc(t ? t(this) : this.STATE, 0);
	},
	aiAttrs() {
		return (function(t) {
			const e = {}; const n = t.attributes; for (let t = 0; t < n.length; t++) {
				e[n[t].name] = n[t].value;
			} return e;
		}(this));
	},
	aiBounds() {
		return (function(t) {
			if (!t.isConnected) {
				return null;
			} const e = t.getBoundingClientRect(); const n = e.bottom > 0 && e.right > 0 && e.top < globalThis.innerHeight && e.left < globalThis.innerWidth; return {
				x: Math.round(e.x),
				y: Math.round(e.y),
				w: Math.round(e.width),
				h: Math.round(e.height),
				visible: e.width > 0 && e.height > 0,
				inViewport: n,
			};
		}(this));
	},
	aiVisibility() {
		return {
			phase: this.phase ?? null,
			isConnected: this.isConnected,
			isRendered: !0 === this.isRendered,
			isMounted: !0 === this.isMounted,
			isLive: !0 === this.isLive,
			isVisible: !0 === this.isVisible,
			isIntersecting: !0 === this.isIntersecting,
			isIntersected: !0 === this.isIntersected,
		};
	},
	aiRefs() {
		return this.refsMap ? [...this.refsMap.keys()] : [];
	},
	aiRef(t) {
		return a(this.getRef) ? this.getRef(t) : null;
	},
	aiText(t = 240) {
		const e = this.shadowRoot ?? this; const n = e.textContent?.trim() ?? ''; if (!n) {
			return '';
		} const r = n.replace(/\s+/g, ' '); return r.length > t ? `${r.slice(0, t)}…` : r;
	},
	aiEmit(t, e) {
		return a(this.emit) ? this.emit(t, e) : null;
	},
	aiGlobalState() {
		return Oc(this.global, 0);
	},
	aiWaitFor(t) {
		const e = jc[t]; return e ? this[e] ?? Promise.resolve() : Promise.reject(new Error(`aiWaitFor: unknown phase "${t}"`));
	},
	aiQuery(t) {
		const e = []; const n = Vc(t); return n ? (Bc(this, (t) => {
			n(t) && e.push(t);
		}), e) : (Bc(this, (t) => {
			return e.push(t);
		}), e);
	},
	aiFind(t) {
		const e = Vc(t); if (!e) {
			return Nc(this)[0] ?? null;
		} let n = null; return Bc(this, (t) => {
			n || e(t) && (n = t);
		}), n;
	},
}; let Uc = null; let zc = 'title'; function Kc(t) {
	'string' == typeof t && document.title !== t && (document.title = t);
} function _c(t) {
	Kc(t);
} function qc(t = 'title') {
	return Uc && Uc.unsubscribe(), zc = t, Kc(On.get(t)), Uc = On.bus.subscribe(t, _c), Uc;
} function Hc(t, e = zc) {
	'string' == typeof t && (document.title = t), On.proxy[e] = t;
} function Gc() {}'undefined' != typeof document && qc('title'); class Xc {
	#n = 0; constructor(t, e = {}) {
		const n = e.prefix || 'ind'; this.indicatorElement = t, this.visibleClass = e.visibleClass || 'is-visible', this.snapClass = e.snapClass || 'no-transition', this.propX = `--${n}-x`, this.propY = `--${n}-y`, this.propW = `--${n}-w`, this.propH = `--${n}-h`;
	} static create(t, e) {
		return new Xc(t, e);
	}#r(t) {
		const e = this.indicatorElement.style; e.setProperty(this.propX, `${t.offsetLeft}px`), e.setProperty(this.propY, `${t.offsetTop}px`), e.setProperty(this.propW, `${t.offsetWidth}px`), e.setProperty(this.propH, `${t.offsetHeight}px`);
	}#s() {
		this.#n = 0, this.indicatorElement.classList.remove(this.snapClass);
	}hide() {
		this.indicatorElement.classList.remove(this.visibleClass);
	}moveTo(t, e = !1) {
		t ? (e && this.indicatorElement.classList.add(this.snapClass), this.#r(t), this.indicatorElement.classList.add(this.visibleClass), e && (this.indicatorElement.getBoundingClientRect(), this.#n && cancelAnimationFrame(this.#n), this.#n = requestAnimationFrame(() => {
			this.#s();
		}))) : this.hide();
	}destroy() {
		this.#n && (cancelAnimationFrame(this.#n), this.#n = 0);
	}
} const Yc = Object.freeze({
	moveTo: Gc,
	hide: Gc,
	destroy: Gc,
}); function Jc(t, e = {}) {
	return t ? Xc.create(t, e) : Yc;
} const Zc = {
	top: 'bottom',
	bottom: 'top',
	left: 'right',
	right: 'left',
}; function Qc(t, e, n) {
	return n < e ? e : Math.min(Math.max(t, e), n);
} function ta(t, e, n = {}) {
	const r = n.offset ?? 8; const s = n.padding ?? 8; const i = n.viewportWidth ?? globalThis.innerWidth ?? 0; const o = n.viewportHeight ?? globalThis.innerHeight ?? 0; const l = String(n.placement ?? 'bottom-start').split('-'); let c = l[0]; const a = l[1] ?? 'start'; const u = (n) => {
		return ('bottom' === n ? t.bottom + r + e.height <= o - s : 'top' === n ? t.top - r - e.height >= s : 'right' === n ? t.right + r + e.width <= i - s : 'left' !== n || t.left - r - e.width >= s);
	}; (n.flip ?? 1) && !u(c) && u(Zc[c]) && (c = Zc[c]); const h = 'top' === c || 'bottom' === c; let d; let f; return h ? (d = 'bottom' === c ? t.bottom + r : t.top - r - e.height, f = 'end' === a ? t.right - e.width : 'center' === a ? t.left + (t.width - e.width) / 2 : t.left) : (f = 'right' === c ? t.right + r : t.left - r - e.width, d = 'end' === a ? t.bottom - e.height : 'center' === a ? t.top + (t.height - e.height) / 2 : t.top), (n.shift ?? 1) && (h ? f = Qc(f, s, i - e.width - s) : d = Qc(d, s, o - e.height - s)), {
		top: d,
		left: f,
		placement: `${c}-${a}`,
	};
} const ea = Object.freeze({
	ASK: 'ask',
	REPLY: 'reply',
	ERROR: 'error',
	NOTIFY: 'notify',
	PING: 'ping',
	PONG: 'pong',
}); class na {
	#i = null; #o = new Map(); #l = new Map(); #c = null; #a = 1; #u = null; #h = null; #d = 0; #f = !0; #p = null; #m = null; constructor(t, e = {}) {
		if (!t) {
			throw new TypeError('UniversalWebSocket requires a url');
		} this.url = t, this.mode = 'cbor' === e.mode ? 'cbor' : 'json', this.#c = e.cborCodec ?? null, this.ticket = e.ticket ?? null, this.protocol = e.protocol ?? 'uws.v1', this.shouldReconnect = e.reconnect ?? !0, this.minReconnectMs = e.minReconnectMs ?? 500, this.maxReconnectMs = e.maxReconnectMs ?? 3e4, this.heartbeatMs = e.heartbeatMs ?? 25e3, this.askTimeoutMs = e.askTimeoutMs ?? 3e4, this.maxInFlight = e.maxInFlight ?? 256, this.#d = this.minReconnectMs;
	} get connected() {
		return 1 === this.#i?.readyState;
	}open() {
		return this.#f = !0, 'cbor' !== this.mode || this.#c ? (this.#g(), new Promise((t, e) => {
			this.#p = t, this.#m = e;
		})) : Promise.reject(new TypeError('UniversalWebSocket: mode cbor requires options.cborCodec'));
	}#y() {
		if (!this.ticket) {
			return this.url;
		} const t = this.url.includes('?') ? '&' : '?'; return `${this.url}${t}ticket=${encodeURIComponent(this.ticket)}`;
	}#g() {
		if (!this.#f) {
			return;
		} const t = new WebSocket(this.#y(), this.protocol); t.binaryType = 'arraybuffer', this.#i = t, t.addEventListener('open', this), t.addEventListener('message', this), t.addEventListener('close', this), t.addEventListener('error', this);
	}handleEvent(t) {
		if ('message' !== t.type) {
			return 'open' === t.type ? (this.#d = this.minReconnectMs, Qt.info('uws', `connected ${this.url} (${this.mode})`), this.#b(), void this.#v()) : void ('close' !== t.type ? Qt.warn('uws', 'socket error', t?.message ?? t) : this.#w());
		} this.#E(t);
	} async #E(t) {
		const e = 'string' != typeof t.data; let n; try {
			n = (function(t, e, n) {
				if (e) {
					if (!n) {
						throw new Error('UniversalWebSocket: binary frame received without a CBOR codec');
					} const e = t instanceof Uint8Array ? t : new Uint8Array(t); return n.decode(e);
				} return JSON.parse(t);
			}(t.data, e, this.#c));
		} catch (t) {
			return void Qt.warn('uws', 'decode error', t);
		} await this.#S(n);
	} async #S(t) {
		const e = t.type; if (e === ea.REPLY || e === ea.ERROR) {
			return void this.#T(t);
		} if (e === ea.PING) {
			return void this.#x({
				type: ea.PONG,
			});
		} if (e === ea.PONG) {
			return;
		} const n = this.#l.get(t.method); n ? e !== ea.NOTIFY ? await this.#C(t, n) : n(t.data, this) : e === ea.ASK && this.#x({
			type: ea.ERROR,
			id: t.id,
			error: {
				code: 'method_not_found',
				message: t.method,
			},
		});
	} async #C(t, e) {
		try {
			const n = await e(t.data, this); this.#x({
				type: ea.REPLY,
				id: t.id,
				data: n,
			});
		} catch (e) {
			this.#x({
				type: ea.ERROR,
				id: t.id,
				error: {
					code: 'handler_error',
					message: e?.message ?? 'handler failed',
				},
			});
		}
	}#T(t) {
		const e = this.#o.get(t.id); if (e) {
			if (this.#o.delete(t.id), clearTimeout(e.timer), t.type === ea.ERROR) {
				const n = new Error(t.error?.message ?? 'request failed'); return n.code = t.error?.code ?? 'error', void e.reject(n);
			}e.resolve(t.data);
		}
	}ask(t, e, n = {}) {
		if (!this.connected) {
			return Promise.reject(new Error('UniversalWebSocket: not connected'));
		} if (this.#o.size >= this.maxInFlight) {
			return Promise.reject(new Error('UniversalWebSocket: too many in-flight requests'));
		} const r = this.#a++; const s = n.timeoutMs ?? this.askTimeoutMs; return new Promise((n, i) => {
			const o = setTimeout(() => {
				this.#o.delete(r), i(new Error(`UniversalWebSocket: ask '${t}' timed out`));
			}, s); this.#o.set(r, {
				resolve: n,
				reject: i,
				timer: o,
			}), this.#x({
				type: ea.ASK,
				id: r,
				method: t,
				data: e,
			}) || (this.#o.delete(r), clearTimeout(o), i(new Error('UniversalWebSocket: send failed')));
		});
	}send(t, e) {
		return this.#x({
			type: ea.NOTIFY,
			method: t,
			data: e,
		});
	}on(t, e) {
		this.#l.set(t, e);
	}off(t) {
		this.#l.delete(t);
	}#x(t) {
		if (1 !== this.#i?.readyState) {
			return !1;
		} let e; try {
			e = (function(t, e, n) {
				if ('cbor' === e) {
					if (!n) {
						throw new Error('UniversalWebSocket: CBOR mode requires an injected codec');
					} return n.encode(t);
				} return JSON.stringify(t);
			}(t, this.mode, this.#c));
		} catch (t) {
			return Qt.warn('uws', 'encode error', t), !1;
		} return this.#i.send(e), !0;
	}#b() {
		this.#R(), this.heartbeatMs && (this.#u = setInterval(() => {
			this.#x({
				type: ea.PING,
			});
		}, this.heartbeatMs));
	}#R() {
		this.#u && (clearInterval(this.#u), this.#u = null);
	}#v() {
		this.#p && (this.#p(this), this.#p = null, this.#m = null);
	}#M(t) {
		this.#m && (this.#m(new Error(t)), this.#p = null, this.#m = null);
	}#k(t) {
		const e = new Error(t); for (const t of this.#o.values()) {
			clearTimeout(t.timer), t.reject(e);
		} this.#o.clear();
	}#w() {
		this.#R(), this.#i = null, this.#k('UniversalWebSocket: connection closed'), this.#f && this.shouldReconnect ? this.#L() : this.#M('UniversalWebSocket: closed before connect');
	}#L() {
		clearTimeout(this.#h), this.#h = setTimeout(() => {
			this.#g();
		}, this.#d), this.#d = Math.min(2 * this.#d, this.maxReconnectMs);
	}close() {
		this.#f = !1, clearTimeout(this.#h), this.#h = null, this.#R(), this.#M('UniversalWebSocket: closed by caller'), this.#k('UniversalWebSocket: closed by caller'), this.#i && (this.#i.close(), this.#i = null);
	}
}!(function(t, e = {}) {
	if (!t || t[Fc]) {
		return;
	} const n = t.prototype; Object.assign(n, Wc), !1 !== e.autoRegister && ((function(t, e) {
		const n = t[e]; t[e] = function(...t) {
			let e; return a(n) && (e = n.apply(this, t)), this.aiRegister(), e;
		};
	}(n, 'connectedCallback')), (function(t, e) {
		const n = t[e]; t[e] = function(...t) {
			if (this.aiUnregister(), a(n)) {
				return n.apply(this, t);
			}
		};
	}(n, 'disconnectedCallback'))), t[Fc] = !0;
}(oc)), globalThis.WebComponent ??= oc; export {
	Rr as addInterval, lt as allChildren, pt as appendTo, Jt as AppLogger, T as assign, K as assignPromisePair, Cn as assignState, ie as atPhase, Cs as behaviorAttrNames, qn as bind, W as cachedProxy, N as callFn, xe as canonicalizeCombo, Ji as ClassList, Zi as classList, kr as clearIntervals, Cr as clearTimeouts, G as clearUnsubs, go as comp, Zt as ComponentLogger, ta as computeAnchor, Dn as CONTENT_KIND, ec as createDragSnap, sc as createDragTrack, k as createElementFromHTML, fs as DelegateEntry, wo as each, P as eachArray, O as eachNodeList, A as eachObject, ms as emitDelegate, To as filter, dt as findComponent, _ as fireResolver, s as flipMorph, ea as FRAME_TYPE, Ts as getBehavior, at as getComponent, ft as getComponentRoot, ut as getComponents, ht as getComponentsArray, V as getOrInit, R as getProto, Fs as getRef, ir as getRoots, B as getValueAtPath, On as globalState, x as hasOwn, v as hasValue, fo as html, gt as ifAssign, Ro as ifThen, Tt as IS_PRODUCTION, w as isArray, xs as isBehaviorAttr, h as isElement, M as isEmpty, p as isError, a as isFunction, y as isNull, o as isObject, l as isPlainObject, f as isPromiseLike, d as isShadowRoot, c as isString, u as isSymbol, g as isTypeUndefined, m as isUndefined, U as joinPath, C as keysOf, So as list, ct as liveChildren, Qt as Logger, js as makeRefsProxy, Jc as movingIndicator, Ze as nextFrame, b as noValue, j as parsePath, $ as pathsOverlap, D as plainEqual, mt as prependTo, I as queueAsyncError, Ss as registerBehavior, ot as registerChild, Be as registerHotkey, $s as registerRef, sr as registerRoot, ne as registry, Co as remoteList, xr as removeComponentTimeout, lr as resolveTag, or as resolveTagUrl, L as resolveTarget, q as runHook, cr as scanAndResolve, tn as schedule, Tr as setComponentTimeout, Hc as setDocumentTitle, ic as setInert, Q as setValueAtPath, Z as smartClone, Yl as SNAP_CURVE, Xl as SNAP_MS, Mr as stopInterval, An as Store, no as styles, qc as syncDocumentTitle, Y as syncSubsByDiff,
	na as UniversalWebSocket, oc as WebComponent,
};
// # sourceMappingURL=core.js.map
