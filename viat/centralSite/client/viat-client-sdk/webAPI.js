import { decode, encode } from './cbor.js';
import { ensureBase64 } from './utils.js';
export async function request(method, endpoint, data = null) {
	const url = `${this.baseURL}${endpoint}`;
	const config = {
		method,
		headers: {
			...this.defaultHeaders,
		},
	};
	if (data && (method === 'POST' || method === 'PUT')) {
		config.body = this.useCBOR ? encode(data) : JSON.stringify(data);
	}
	const response = await fetch(url, config);
	if (!response.ok) {
		const errorData = await this.parseResponse(response);
		throw new Error(`API Error: ${response.status} - ${errorData.error || 'Unknown error'}`);
	}
	return this.parseResponse(response);
}
export async function parseResponse(response) {
	const contentType = response.headers.get('content-type');
	if (contentType && contentType.includes('application/cbor')) {
		const buffer = await response.arrayBuffer();
		return decode(Buffer.from(buffer));
	}
	return response.json();
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
export async function mintFunds(toAddress, amount) {
	const data = {
		to: ensureBase64(toAddress),
	};
	return this.request('POST', '/transactions/mint', data);
}
export async function setURL(config) {
	const href = config?.baseURL || window.location.origin;
	this.baseURL = `${href.replace(/\/$/, '')}/api`;
	this.useCBOR = config?.useCBOR || false;
	this.defaultHeaders = {
		'Content-Type': this.useCBOR ? 'application/cbor' : 'application/json',
		Accept: this.useCBOR ? 'application/cbor' : 'application/json',
	};
}
export async function setAPICBORMode() {
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
	createTransaction,
	mintFunds,
	setURL,
	setAPICBORMode,
};
export default webAPI;
