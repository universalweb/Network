/**
 * Method-dispatch shootout.
 *
 * Compares the cost of CALLING a class method defined three ways:
 *
 *   A. wrapping   — method body delegates to a module-scope first-class fn,
 *                   passing `this` through:  compute(x) { return impl(this, x); }
 *   B. assigned   — a module-scope first-class fn is hung directly on the
 *                   prototype as the method (uses its own `this`).
 *   C. direct     — the full body lives on the class method to begin with.
 *
 * Plus two reference points the code-style rules care about:
 *   D. fieldAssigned — fn assigned per-instance in the ctor (per-instance
 *                      allocation; the anti-pattern) to show its real cost.
 *   E. returnedClosure — method mints+returns a fresh closure each call, then
 *                        we invoke it (the literal "wrap AND return a fn").
 *
 * Run:  node benchmarks/method-dispatch.bench.js
 *   or: bun benchmarks/method-dispatch.bench.js
 */

const INSTANCE_COUNT = 1024;
const CALLS_PER_TRIAL = 5_000_000;
const TRIALS = 12;
const WARMUP_TRIALS = 4;

/** Shared numeric kernel — identical work in every variant so we time dispatch,
 *  not arithmetic. Kept non-trivial so the JIT cannot fold it away. */
function kernel(value, x) {
	const a = value * 1.0000001 + x;
	const b = (a * a - value) % 9973;
	return b + (x ^ (value & 0xff));
}

/* ── A. wrapping ─────────────────────────────────────────────── */
function wrappingImpl(self, x) {
	return kernel(self.value, x);
}
class Wrapping {
	static create(value) { return new Wrapping(value); }
	constructor(value) { this.value = value; }
	compute(x) { return wrappingImpl(this, x); }
}

/* ── B. assigned to prototype ────────────────────────────────── */
function assignedImpl(x) {
	return kernel(this.value, x);
}
class Assigned {
	static create(value) { return new Assigned(value); }
	constructor(value) { this.value = value; }
}
Assigned.prototype.compute = assignedImpl;

/* ── C. direct method ────────────────────────────────────────── */
class Direct {
	static create(value) { return new Direct(value); }
	constructor(value) { this.value = value; }
	compute(x) { return kernel(this.value, x); }
}

/* ── D. per-instance field assignment (anti-pattern) ─────────── */
function fieldImpl(self, x) {
	return kernel(self.value, x);
}
class FieldAssigned {
	static create(value) { return new FieldAssigned(value); }
	constructor(value) {
		this.value = value;
		const self = this;
		this.compute = function fieldCompute(x) { return fieldImpl(self, x); };
	}
}

/* ── E. method returns a fresh closure, which we then call ───── */
class ReturnedClosure {
	static create(value) { return new ReturnedClosure(value); }
	constructor(value) { this.value = value; }
	compute() {
		const self = this;
		return function closure(x) { return kernel(self.value, x); };
	}
}

function buildInstances(Klass) {
	const list = new Array(INSTANCE_COUNT);
	for (let index = 0; index < INSTANCE_COUNT; index++) {
		list[index] = Klass.create(index + 1);
	}
	return list;
}

function runDirectStyle(instances) {
	let sum = 0;
	const count = instances.length;
	for (let call = 0; call < CALLS_PER_TRIAL; call++) {
		const instance = instances[call & (count - 1)];
		sum += instance.compute(call & 0xffff);
	}
	return sum;
}

function runReturnedStyle(instances) {
	let sum = 0;
	const count = instances.length;
	for (let call = 0; call < CALLS_PER_TRIAL; call++) {
		const instance = instances[call & (count - 1)];
		const fn = instance.compute();
		sum += fn(call & 0xffff);
	}
	return sum;
}

function timeTrial(runner, instances) {
	const start = performance.now();
	const sum = runner(instances);
	const elapsed = performance.now() - start;
	return { elapsed, sum };
}

function bench(label, Klass, runner) {
	const instances = buildInstances(Klass);
	let guard = 0;
	for (let trial = 0; trial < WARMUP_TRIALS; trial++) {
		guard += timeTrial(runner, instances).sum;
	}
	const samples = new Array(TRIALS);
	for (let trial = 0; trial < TRIALS; trial++) {
		const result = timeTrial(runner, instances);
		guard += result.sum;
		samples[trial] = result.elapsed;
	}
	samples.sort(function ascending(a, b) { return a - b; });
	const median = samples[samples.length >> 1];
	const best = samples[0];
	const opsPerSec = CALLS_PER_TRIAL / (median / 1000);
	return { label, median, best, opsPerSec, guard };
}

function format(rows) {
	const fastest = rows.reduce(function pickMax(acc, row) {
		return row.opsPerSec > acc ? row.opsPerSec : acc;
	}, 0);
	console.log(
		'\n'
			+ pad('variant', 16)
			+ pad('median ms', 12)
			+ pad('best ms', 12)
			+ pad('M ops/sec', 12)
			+ 'relative',
	);
	console.log('-'.repeat(64));
	for (const row of rows) {
		const relative = (row.opsPerSec / fastest * 100).toFixed(1) + '%';
		console.log(
			pad(row.label, 16)
				+ pad(row.median.toFixed(2), 12)
				+ pad(row.best.toFixed(2), 12)
				+ pad((row.opsPerSec / 1e6).toFixed(1), 12)
				+ relative,
		);
	}
}

function pad(text, width) {
	const value = String(text);
	return value.length >= width ? value + ' ' : value + ' '.repeat(width - value.length);
}

function main() {
	const runtime = typeof Bun !== 'undefined' ? 'bun ' + Bun.version : 'node ' + process.version;
	console.log('runtime: ' + runtime);
	console.log(
		'instances=' + INSTANCE_COUNT
			+ '  calls/trial=' + CALLS_PER_TRIAL.toLocaleString()
			+ '  trials=' + TRIALS + ' (warmup ' + WARMUP_TRIALS + ')',
	);

	const rows = [
		bench('A wrapping', Wrapping, runDirectStyle),
		bench('B assigned', Assigned, runDirectStyle),
		bench('C direct', Direct, runDirectStyle),
		bench('D fieldAssign', FieldAssigned, runDirectStyle),
		bench('E retClosure', ReturnedClosure, runReturnedStyle),
	];

	format(rows);

	let total = 0;
	for (const row of rows) total += row.guard;
	console.log('\n(guard ' + (total % 2147483647) + ' — ignore)');
	console.log('\nNote: E mints+invokes a closure per call, so it times two calls; '
		+ 'it is the literal "wrap AND return a fn" cost, not comparable 1:1.');
}

main();
