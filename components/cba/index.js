// UW Domain Record APPS
// Applications that can be in full or in part inside of a singular Domain Certificate.
import { decode, encodeStrict } from '#utilities/serialize';
// Certificate Embedded App
// Certificate-Bound App
// Domain Certificate Binary
// Domain Certificate App
// Certificate Based Binary
// Certificate Based App
// CBOR-X-encoded binary within a domain certificate
const dcaSchema = {
	dependencies: {
		scripts: [],
		styles: [],
		images: [],
	},
	preload: {
		scripts: [],
	},
	exit: {
		scripts: [],
	},
	meta: {
		title: '',
		description: '',
		thumbnail: {},
		favicon: {},
	},
	content: {
		type: 'uwm||html||text',
		value: '',
	},
	keywords: [],
	author: '',
	license: '',
	version: '1.0.0',
	timestamp: new Date(),
	nonce: '',
	wallet: 'viat-address',
	contact: {
		email: '',
		phone: '',
	},
};
export async function encodeDomainRecordApp(app) {
	return encodeStrict(app);
}
export async function decodeDomainRecordApp(app) {
	return decode(app);
}
