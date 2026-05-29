/**
 * Proxy + `this` binding exploration — confirm what `this` resolves to inside
 * a user-defined getter/setter function across every plausible invocation
 * pattern. Goal: find a path where the function can access the component
 * WITHOUT `.bind`, `.call`, `.apply`, or polluting the component's prototype.
 *
 * Run with: node test.js
 */
'use strict';
function section(label) {
	console.log(`\n=== ${label} ===`);
}
function describe(name, value) {
	const tag = value === undefined
		? 'undefined'
		: value === null
			? 'null'
			: value?.__label__ ?? value?.constructor?.name ?? typeof value;
	console.log(`  ${name.padEnd(40)} → ${tag}`);
}
// ─────────────────────────────────────────────────────────────────────────
section('1. Plain function value — what is `this` per call shape?');
// ─────────────────────────────────────────────────────────────────────────
{
	const desc = {
		set(value) {
			return this;
		},
	};
	desc.__label__ = 'desc';
	const fnRef = desc.set;
	describe('desc.set(5) [method call on desc]', desc.set(5));
	describe('fnRef(5) [plain call, strict]', fnRef(5));
	const otherHost = {
		set: desc.set,
		__label__: 'otherHost',
	};
	describe('otherHost.set(5) [method call elsewhere]', otherHost.set(5));
}
// ─────────────────────────────────────────────────────────────────────────
section('2. Proxy trap context — what is `this` INSIDE a trap?');
// ─────────────────────────────────────────────────────────────────────────
{
	const handler = {
		__label__: 'handler',
		component: { __label__: 'component', state: {} },
		set(target, key, value) {
			describe('inside trap, this', this);
			describe('inside trap, this.component', this.component);
			return Reflect.set(target, key, value);
		},
	};
	const proxy = new Proxy({}, handler);
	proxy.balance = 10;
}
// ─────────────────────────────────────────────────────────────────────────
section('3. Invoke a user fn from within the trap — what `this` does it see?');
// ─────────────────────────────────────────────────────────────────────────
{
	const userSet = function (value) {
		return this;
	};
	const handler = {
		__label__: 'handler',
		component: { __label__: 'component', state: {} },
		set(target, key, value) {
			// 3a) Plain call from trap — function detached from any receiver
			const a = userSet(value);
			describe('3a) userSet(value)', a);
			// 3b) Method call THROUGH this (handler) — but userSet isn't a method of `this`
			const handlerWithFn = this;
			handlerWithFn.userSet = userSet;
			const b = handlerWithFn.userSet(value);
			describe('3b) this.userSet(value) [method on handler]', b);
			// Cleanup
			handlerWithFn.userSet = null;
			return Reflect.set(target, key, value);
		},
	};
	new Proxy({}, handler).balance = 10;
}
// ─────────────────────────────────────────────────────────────────────────
section('4. Per-component receiver via Object.create — methods inherited, .component own');
// ─────────────────────────────────────────────────────────────────────────
{
	// Class-level shared methods (not on component prototype):
	const classAccessors = {
		__label__: 'classAccessors',
		setBalance(value) {
			return {
				this_is: this,
				value,
			};
		},
		getFormatted(stored) {
			return {
				this_is: this,
				stored,
			};
		},
	};
	// Per-instance: a small receiver inheriting from class methods, carrying .component
	function makeReceiver(component) {
		const receiver = Object.create(classAccessors);
		receiver.__label__ = 'receiver';
		receiver.component = component;
		return receiver;
	}
	const componentA = { __label__: 'componentA' };
	const componentB = { __label__: 'componentB' };
	const recvA = makeReceiver(componentA);
	const recvB = makeReceiver(componentB);
	const resultA = recvA.setBalance(5);
	const resultB = recvB.setBalance(7);
	describe('4a) recvA.setBalance(5).this_is', resultA.this_is);
	describe('4a) recvA.setBalance(5).this_is.component', resultA.this_is?.component);
	describe('4b) recvB.setBalance(7).this_is', resultB.this_is);
	describe('4b) recvB.setBalance(7).this_is.component', resultB.this_is?.component);
}
// ─────────────────────────────────────────────────────────────────────────
section('5. Receiver embedded in proxy handler — invoke through handler.receiver');
// ─────────────────────────────────────────────────────────────────────────
{
	// Class-level shared methods:
	const classAccessors = {
		__label__: 'classAccessors',
		setBalance(value) {
			return {
				this_is: this,
				value,
			};
		},
	};
	function makeHandler(component) {
		const receiver = Object.create(classAccessors);
		receiver.__label__ = 'receiver';
		receiver.component = component;
		return {
			__label__: 'handler',
			component,
			receiver,
			set(target, key, value) {
				if (key === 'balance') {
					const transformed = this.receiver.setBalance(value);
					describe('inside trap, transformed.this_is', transformed.this_is);
					describe('inside trap, transformed.this_is.component', transformed.this_is.component);
					value = transformed.value;
				}
				return Reflect.set(target, key, value);
			},
		};
	}
	const component = { __label__: 'component', state: {} };
	const proxy = new Proxy({}, makeHandler(component));
	proxy.balance = 99;
}
// ─────────────────────────────────────────────────────────────────────────
section('6. Per-class handler subclass — user fns as handler methods (no component-prototype pollution)');
// ─────────────────────────────────────────────────────────────────────────
{
	class BaseHandler {
		constructor(component) {
			this.component = component;
			this.__label__ = 'BaseHandler instance';
		}
		set(target, key, value) {
			const methodName = `__set_${key}`;
			if (typeof this[methodName] === 'function') {
				const transformed = this[methodName](value);
				describe(`inside trap (key=${key}), transformed.this_is`, transformed.this_is);
				describe(`inside trap (key=${key}), transformed.this_is.component`, transformed.this_is.component);
				value = transformed.value;
			}
			return Reflect.set(target, key, value);
		}
	}
	// Per-class handler — methods live HERE, not on component prototype
	class WalletStateHandler extends BaseHandler {
		__set_balance(value) {
			return {
				this_is: this,
				value: Math.max(0, value),
			};
		}
	}
	const component = { __label__: 'component', state: {} };
	const proxy = new Proxy({}, new WalletStateHandler(component));
	proxy.balance = -5;
}
// ─────────────────────────────────────────────────────────────────────────
section('7. What if the descriptor itself carries a `.component` field per call? (mutation pattern)');
// ─────────────────────────────────────────────────────────────────────────
{
	// User's descriptor (class-level, shared):
	const descriptor = {
		__label__: 'descriptor (shared!)',
		set(value) {
			return {
				this_is: this,
				value,
			};
		},
	};
	function invokeWithComponent(desc, component, value) {
		desc.component = component;
		const result = desc.set(value);
		desc.component = null;
		return result;
	}
	const componentA = { __label__: 'componentA' };
	const componentB = { __label__: 'componentB' };
	const resultA = invokeWithComponent(descriptor, componentA, 5);
	const resultB = invokeWithComponent(descriptor, componentB, 7);
	describe('7a) resultA.this_is', resultA.this_is);
	describe('7a) resultA.this_is.component', resultA.this_is.component);
	describe('7b) resultB.this_is', resultB.this_is);
	describe('7b) resultB.this_is.component', resultB.this_is.component);
	console.log('  ⚠ this PATTERN is shared-state-mutation; concurrent invocations would race.');
}
// ─────────────────────────────────────────────────────────────────────────
section('8. Method-name string dispatch via component method lookup');
// ─────────────────────────────────────────────────────────────────────────
{
	// User writes methods on the class as normal methods:
	class Wallet {
		constructor() {
			this.__label__ = 'Wallet instance';
		}
		normalizeBalance(value) {
			return {
				this_is: this,
				value: Math.max(0, value),
			};
		}
	}
	const component = new Wallet();
	// Framework receives method NAME (string), looks it up on component:
	const setterName = 'normalizeBalance';
	const result = component[setterName](-5);
	describe('8) component[name](value).this_is', result.this_is);
	describe('8) component[name](value).this_is.constructor', result.this_is?.constructor);
	console.log('  Note: methods live on the CLASS the user wrote (Wallet.prototype),');
	console.log('  not synthesized symbol slots. No framework pollution.');
}
// ─────────────────────────────────────────────────────────────────────────
section('Summary');
// ─────────────────────────────────────────────────────────────────────────
console.log(`
  • Plain fn call: this === undefined (strict mode).
  • Method call (obj.fn): this === obj.
  • Proxy trap: this === handler. Handler has .component as a field.
  • Function value DOES NOT carry receiver — only the invocation syntax determines this.
  • To get this === component (or this.component === component) inside a user fn:
      A) Method call on component:     pollutes component prototype.
      B) Method call on handler:       per-class handler subclass, methods live there. (test 6)
      C) Method call on receiver obj:  per-instance receiver via Object.create. (test 4/5)
      D) Pass component as arg:        explicit, no this games. (rejected earlier)
      E) Method-name string dispatch:  user writes methods on their own class. (test 8)
  • No JS mechanism rebinds 'this' WITHOUT one of: .bind, .call, .apply, method-syntax.
`);
