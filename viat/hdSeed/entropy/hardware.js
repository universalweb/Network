import { encode, hash } from '../utils.js';
function timeout0() {
	return new Promise((resolve) => {
		setTimeout(resolve, 0);
	});
}
function immediate() {
	if (typeof setImmediate === 'function') {
		return new Promise((resolve) => {
			setImmediate(resolve);
		});
	}
	return timeout0();
}
function microtask() {
	return new Promise((resolve) => {
		queueMicrotask(resolve);
	});
}
function animationFrame() {
	if (typeof requestAnimationFrame === 'function') {
		return new Promise((resolve) => {
			requestAnimationFrame((time) => {
				resolve(time);
			});
		});
	}
	return timeout0().then(() => {
		return globalThis.performance?.now?.() ?? Date.now();
	});
}
function normalizeBigIntArray(source) {
	return source.map((item) => {
		return item.toString();
	});
}
async function collectNodeTimingJitter(samples = 256) {
	const microtaskDeltas = [];
	const immediateDeltas = [];
	const timerDeltas = [];
	for (let index = 0; index < samples; index++) {
		const start = process.hrtime.bigint();
		await microtask();
		const microtaskEnd = process.hrtime.bigint();
		await immediate();
		const immediateEnd = process.hrtime.bigint();
		await timeout0();
		const timerEnd = process.hrtime.bigint();
		microtaskDeltas.push(microtaskEnd - start);
		immediateDeltas.push(immediateEnd - microtaskEnd);
		timerDeltas.push(timerEnd - immediateEnd);
	}
	return {
		runtime: 'node',
		samples,
		microtaskDeltas: normalizeBigIntArray(microtaskDeltas),
		immediateDeltas: normalizeBigIntArray(immediateDeltas),
		timerDeltas: normalizeBigIntArray(timerDeltas),
	};
}
async function collectBrowserTimingJitter(samples = 256) {
	const microtaskDeltas = [];
	const timerDeltas = [];
	const frameDeltas = [];
	for (let index = 0; index < samples; index++) {
		const start = globalThis.performance?.now?.() ?? Date.now();
		await microtask();
		const microtaskEnd = globalThis.performance?.now?.() ?? Date.now();
		await timeout0();
		const timerEnd = globalThis.performance?.now?.() ?? Date.now();
		const frameStart = globalThis.performance?.now?.() ?? Date.now();
		const frameEnd = await animationFrame();
		microtaskDeltas.push(microtaskEnd - start);
		timerDeltas.push(timerEnd - microtaskEnd);
		frameDeltas.push(frameEnd - frameStart);
	}
	return {
		runtime: 'browser',
		samples,
		microtaskDeltas,
		timerDeltas,
		frameDeltas,
	};
}
export async function getHardwareEntropy(size = 64, samples = 256) {
	const payload = (typeof process !== 'undefined' && typeof process.hrtime?.bigint === 'function') ? await collectNodeTimingJitter(samples) : await collectBrowserTimingJitter(samples);
	// console.log(payload);
	const encoded = await encode(payload);
	return hash(encoded, size);
}
export default {
	getHardwareEntropy,
};
console.log(await getHardwareEntropy());
