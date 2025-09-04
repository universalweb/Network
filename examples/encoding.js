import * as cbor from 'cbor-x';
import * as msgPack from 'msgpackr';
import { runBench } from '#utilities/benchmark';
const example = {
	foo: 'bar',
	bar: {
		baz: 'qux',
	},
	qux: [
		1, 2, 3,
	],
	quux: {
		corge: 'grault',
	},
	grault: {
		garply: 'waldo',
	},
	garply: {
		fred: 'plugh',
	},
	plugh: {
		waldo: 'xyzzy',
	},
	xyzzy: {
		thud: 'quux',
	},
	thud: {
		quux: 'corge',
	},
	bin: Buffer.from('hello world'),
	timestamp: new Date(),
	timenow: Date.now(),
};
const cborEncode = await cbor.encode(example);
const msgPackEncode = await msgPack.encode(example);
await runBench(async () => {
	await cbor.encode(example);
	await cbor.decode(cborEncode);
}, async () => {
	await msgPack.encode(example);
	await msgPack.decode(msgPackEncode);
});
