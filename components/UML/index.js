import { decode, encode, encodeStrict } from '#utilities/serialize';
import { isArray, isBuffer, isPlainObject } from '@universalweb/utilitylib';
// UNIVERSAL MARKUP LANGUAGE EXPERIMENTAL SYNTAX
export function div(attrs, contents) {
	return [
		'div', attrs, contents
	];
}
export function head(attrs, contents) {
	return [
		'head', attrs, contents
	];
}
export function body(attrs, contents) {
	return [
		'body', attrs, contents
	];
}
export function html(attrs, contents) {
	return [
		'html', attrs, contents
	];
}
export function addChild(target, source) {
	const contents = target[2];
	if (contents) {
		if (isArray(contents)) {
			contents.push(source);
		} else {
			target[2] = [
				contents,
				source
			];
		}
	} else if (isArray(target[1])) {
		target[1].push(source);
	} else {
		target[2] = source;
	}
}
export class UML {
	constructor(source) {
		if (isPlainObject(source)) {
			this.data = source;
		}
	}
	async processDocument(source) {
	}
	async addNode(node) {
		this.data.nodes.push(node);
	}
	async addEdge(edge) {
		this.data.edges.push(edge);
	}
	async encode() {
		return encodeStrict(this.data);
	}
	async decode(data) {
		this.data = await decode(data);
	}
	async searchNodeById(id) {
		return this.data.nodes.find((node) => {
			return node.id === id;
		});
	}
	async searchByType(type) {
		return this.data.nodes.filter((node) => {
			return node.type === type;
		});
	}
	async searchByClass(className) {
		return this.data.nodes.filter((node) => {
			return node.class === className;
		});
	}
	async save(path) {
		return;
	}
	async read(path) {
		return;
	}
}
export function uml(source) {
	return new UML(source);
}
