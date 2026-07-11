import { decode, encode } from './cbor.js';
import { ensureBase64 } from './utils.js';
// Endpoints where a 404 is part of the normal flow (e.g. an address has no
// account record yet). These get console-logged but suppressed from the
// in-app notification stream so users don't see "404" noise for expected
// "not yet created" states.
const SILENT_404_PATTERNS = [
	/^\/accounts\/[^/]+$/,
	/^\/accounts\/[^/]+\/transactions/,
];
function shouldSilence(endpoint, status) {
	if (status !== 404) {
		return false;
	}
	for (let index = 0; index < SILENT_404_PATTERNS.length; index += 1) {
		if (SILENT_404_PATTERNS[index].test(endpoint)) {
			return true;
		}
	}
	return false;
}
function dispatchApiError(detail) {
	if (typeof globalThis?.dispatchEvent !== 'function' || typeof globalThis?.CustomEvent !== 'function') {
		return;
	}
	globalThis.dispatchEvent(new globalThis.CustomEvent('viat:api-error', {
		detail,
	}));
}
export async function request(method, endpoint, data = null) {
	const url = `${this.baseURL}${endpoint}`;
	const config = {
		method,
		headers: {
			...this.defaultHeaders,
		},
	};
	if (data && (method === 'POST' || method === 'PUT')) {
		if (this.useCBOR) {
			// `encode` is async and returns a Buffer; without awaiting fetch
			// would serialise a Promise body and the server would reject it.
			const encoded = await encode(data);
			config.body = encoded instanceof Uint8Array ? encoded : Buffer.from(encoded);
		} else {
			config.body = JSON.stringify(data);
		}
	}
	let response;
	try {
		response = await fetch(url, config);
	} catch (networkError) {
		const message = networkError?.message || 'Network failure';
		console.warn('[viat:api]', method, endpoint, message);
		dispatchApiError({
			endpoint,
			method,
			status: 0,
			message,
			silent: false,
		});
		return null;
	}
	if (!response.ok) {
		let errorBody = {};
		try {
			errorBody = await this.parseResponse(response);
		} catch (parseError) {
			errorBody = {
				error: response.statusText,
			};
		}
		const message = errorBody?.error || errorBody?.message || `HTTP ${response.status}`;
		const silent = shouldSilence(endpoint, response.status);
		console.warn('[viat:api]', method, endpoint, response.status, message);
		dispatchApiError({
			endpoint,
			method,
			status: response.status,
			message,
			body: errorBody,
			silent,
		});
		return null;
	}
	return this.parseResponse(response);
}
export async function parseResponse(response) {
	const contentType = response.headers.get('content-type') || '';
	if (contentType.includes('application/cbor')) {
		const buffer = await response.arrayBuffer();
		return decode(Buffer.from(buffer));
	}
	if (contentType.includes('application/json')) {
		return response.json();
	}
	// Last-resort: try JSON, fall back to text.
	const text = await response.text();
	if (!text) {
		return {};
	}
	try {
		return JSON.parse(text);
	} catch (parseError) {
		return {
			raw: text,
		};
	}
}
export async function health() {
	return this.request('GET', '/health');
}
export async function createAccount(publicKey, address = null) {
	const data = {
		publicKey: ensureBase64(publicKey),
	};
	if (address) {
		data.address = ensureBase64(address);
	}
	return this.request('POST', '/accounts', data);
}
export async function getAccount(address) {
	const addressStr = ensureBase64(address);
	return this.request('GET', `/accounts/${encodeURIComponent(addressStr)}`);
}
export async function listRecentAccounts(options = {}) {
	const params = new URLSearchParams();
	if (options.page) {
		params.append('page', String(options.page));
	}
	if (options.limit) {
		params.append('limit', String(options.limit));
	}
	const query = params.toString();
	return this.request('GET', `/accounts${query ? `?${query}` : ''}`);
}
export async function getAccountTransactions(address, options = {}) {
	const addressStr = ensureBase64(address);
	const params = new URLSearchParams();
	if (options.page) {
		params.append('page', options.page.toString());
	}
	if (options.limit) {
		params.append('limit', options.limit.toString());
	}
	const query = params.toString();
	const endpoint = `/accounts/${encodeURIComponent(addressStr)}/transactions${query ? `?${query}` : ''}`;
	return this.request('GET', endpoint);
}
export async function createTransaction(data) {
	if (!data.publicKey) {
		throw new Error('Public key is required for transaction creation');
	}
	return this.request('POST', '/transactions', data);
}
export async function getTransaction(id) {
	if (!id) {
		throw new Error('Transaction id required');
	}
	return this.request('GET', `/transactions/${encodeURIComponent(id)}`);
}
export async function listRecentTransactions(options = {}) {
	const params = new URLSearchParams();
	if (options.page) {
		params.append('page', String(options.page));
	}
	if (options.limit) {
		params.append('limit', String(options.limit));
	}
	if (options.type) {
		params.append('type', String(options.type));
	}
	const query = params.toString();
	return this.request('GET', `/transactions${query ? `?${query}` : ''}`);
}
export async function mintFunds(toAddress, amount) {
	const data = {
		to: ensureBase64(toAddress),
	};
	return this.request('POST', '/transactions/mint', data);
}
export async function setURL(config) {
	const origin = config?.baseURL || globalThis.location?.origin || '';
	this.baseURL = `${String(origin).replace(/\/$/, '')}/api`;
	this.useCBOR = Boolean(config?.useCBOR);
	this.applyAPIHeaders();
}
export async function setAPICBORMode(useCBOR) {
	if (typeof useCBOR === 'boolean') {
		this.useCBOR = useCBOR;
	}
	this.applyAPIHeaders();
}
export function applyAPIHeaders() {
	this.defaultHeaders = {
		'Content-Type': this.useCBOR ? 'application/cbor' : 'application/json',
		Accept: this.useCBOR ? 'application/cbor' : 'application/json',
	};
}
export const webAPI = {
	request,
	parseResponse,
	health,
	createAccount,
	getAccount,
	getAccountTransactions,
	listRecentAccounts,
	createTransaction,
	getTransaction,
	listRecentTransactions,
	mintFunds,
	setURL,
	setAPICBORMode,
	applyAPIHeaders,
};
export default webAPI;
