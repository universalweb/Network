// UW Domain Record APPS
import { decode, encodeStrict } from '#utilities/serialize';
const domainRecordScheme = {
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
