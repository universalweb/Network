import { decode, encode } from '#utilities/serialize';
import { isBuffer } from '@universalweb/acid';
export class UML {
	constructor(source) {
		this.data = {
			nodes: [],
			edges: []
		};
	}
	async addNode(node) {
		this.data.nodes.push(node);
	}
	async addEdge(edge) {
		this.data.edges.push(edge);
	}
	async encode() {
		return encode(this.data);
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
