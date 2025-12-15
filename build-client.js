#!/usr/bin/env node
/**
 * Simple browser bundle builder for VIAT client
 * Includes cbor-x library for CBOR support.
 */
import { readFileSync, writeFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
// Read the browser client source
const browserJs = readFileSync('viat/centralSite/client/browser.js', 'utf8');
// Get cbor-x source (simplified approach - inline the functions we need)
const cborX = require('cbor-x');
const cborEncode = cborX.encode.toString();
const cborDecode = cborX.decode.toString();
// Create a simple bundle
const bundle = `/**
 * VIAT Client v1.0.0 - Browser Bundle
 * https://github.com/universalweb/Network
 *
 * Browser-compatible client for VIAT cryptocurrency API
 * Supports JSON and CBOR serialization
 *
 * Usage:
 *   <script src="viat-client.min.js"></script>
 *   <script>
 *     const client = new VIATClient();
 *     client.health().then(console.log);
 *   </script>
 */

(function(global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.VIAT = {}));
}(this, (function(exports) {
	'use strict';

	// CBOR implementation (from cbor-x)
	const encode = ${cborEncode};
	const decode = ${cborDecode};

	// Browser-compatible utilities
	const BrowserBuffer = {
		alloc(size) {
			return new Uint8Array(size);
		},
		from(data, encoding) {
			if (typeof data === 'string') {
				if (encoding === 'base64') {
					return new Uint8Array(Array.from(atob(data), (c) => {
						return c.charCodeAt(0);
					}));
				}
				return new TextEncoder().encode(data);
			}
			if (data instanceof ArrayBuffer) {
				return new Uint8Array(data);
			}
			if (Array.isArray(data)) {
				return new Uint8Array(data);
			}
			return new Uint8Array(data);
		},
		isBuffer(obj) {
			return obj instanceof Uint8Array || obj instanceof ArrayBuffer;
		},
	};

	// CBOR encoding/decoding using cbor-x
	const cbor = {
		encode,
		decode,
	};

	// VIAT Client Constructor
	function VIATClient(baseURL, options) {
		this.baseURL = (baseURL || 'http://localhost:3001/api').replace(/\\/$/, '');
		this.useCBOR = (options && options.useCBOR) || false;
		this.defaultHeaders = {
			'Content-Type': this.useCBOR ? 'application/cbor' : 'application/json',
			Accept: this.useCBOR ? 'application/cbor' : 'application/json',
		};
	}

	VIATClient.prototype.request = async function(method, endpoint, data) {
		const url = this.baseURL + endpoint;
		const config = {
			method: method,
			headers: Object.assign({}, this.defaultHeaders),
		};

		if (data && (method === 'POST' || method === 'PUT')) {
			config.body = this.useCBOR ? cbor.encode(data) : JSON.stringify(data);
		}

		const response = await fetch(url, config);

		if (!response.ok) {
			const errorData = await this.parseResponse(response);
			throw new Error(\`API Error: \${response.status} - \${errorData.error || 'Unknown error'}\`);
		}

		return this.parseResponse(response);
	};

	VIATClient.prototype.parseResponse = async function(response) {
		const contentType = response.headers.get('content-type');

		if (contentType && contentType.includes('application/cbor')) {
			const buffer = await response.arrayBuffer();
			return cbor.decode(new Uint8Array(buffer));
		} else {
			return response.json();
		}
	};

	VIATClient.prototype.health = async function() {
		return this.request('GET', '/health');
	};

	VIATClient.prototype.createAccount = async function(publicKey, address) {
		const data = {
			publicKey: this.uint8ArrayToBase64(BrowserBuffer.from(publicKey)),
		};

		if (address) {
			data.address = this.uint8ArrayToBase64(BrowserBuffer.from(address));
		}

		return this.request('POST', '/accounts', data);
	};

	VIATClient.prototype.getAccount = async function(address) {
		const addressStr = typeof address === 'string' ? address : this.uint8ArrayToBase64(BrowserBuffer.from(address));
		return this.request('GET', \`/accounts/\${encodeURIComponent(addressStr)}\`);
	};

	VIATClient.prototype.getAccountTransactions = async function(address, options) {
		const addressStr = typeof address === 'string' ? address : this.uint8ArrayToBase64(BrowserBuffer.from(address));
		const params = new URLSearchParams();

		if (options && options.page) {
			params.append('page', options.page.toString());
		}
		if (options && options.limit) {
			params.append('limit', options.limit.toString());
		}

		const query = params.toString();
		const endpoint = \`/accounts/\${encodeURIComponent(addressStr)}/transactions\${query ? '?' + query : ''}\`;

		return this.request('GET', endpoint);
	};

	VIATClient.prototype.createTransaction = async function(fromAddress, toAddress, amount, signature) {
		const data = {
			from: this.uint8ArrayToBase64(BrowserBuffer.from(fromAddress)),
			to: this.uint8ArrayToBase64(BrowserBuffer.from(toAddress)),
			amount: amount.toString(),
			signature: this.uint8ArrayToBase64(BrowserBuffer.from(signature)),
		};

		return this.request('POST', '/transactions', data);
	};

	VIATClient.prototype.mintFunds = async function(toAddress, amount) {
		const data = {
			to: this.uint8ArrayToBase64(BrowserBuffer.from(toAddress)),
			amount: amount.toString(),
		};

		return this.request('POST', '/transactions/mint', data);
	};

	VIATClient.prototype.setCBOR = function(useCBOR) {
		this.useCBOR = useCBOR;
		this.defaultHeaders = {
			'Content-Type': this.useCBOR ? 'application/cbor' : 'application/json',
			Accept: this.useCBOR ? 'application/cbor' : 'application/json',
		};
	};

	VIATClient.prototype.getFormat = function() {
		return this.useCBOR ? 'CBOR' : 'JSON';
	};

	VIATClient.prototype.uint8ArrayToBase64 = function(uint8Array) {
		const binary = Array.from(uint8Array, function(byte) {
			return String.fromCharCode(byte);
		}).join('');
		return btoa(binary);
	};

	VIATClient.prototype.base64ToUint8Array = function(base64) {
		const binary = atob(base64);
		return new Uint8Array(Array.from(binary, function(char) {
			return char.charCodeAt(0);
		}));
	};

	// Create default instance
	const viatClient = new VIATClient();

	// Export for browsers
	if (typeof window !== 'undefined') {
		window.VIATClient = VIATClient;
		window.viatClient = viatClient;
	}

	// Export for Node.js compatibility
	if (typeof module !== 'undefined' && module.exports) {
		module.exports = viatClient;
		module.exports.VIATClient = VIATClient;
	}

	Object.defineProperty(exports, '__esModule', { value: true });
	exports.VIATClient = VIATClient;
	exports.default = viatClient;
})));`;
// Write the bundle
writeFileSync('viat/centralSite/client/viat-client.min.js', bundle);
console.log('✅ VIAT browser client bundle created with CBOR support!');
