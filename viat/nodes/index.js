import { assign } from '@universalweb/utilitylib';
export class BaseNode {
	constructor(config) {
		if (config) {
			assign(this, config);
		}
	}
	auditors = new Map();
	arbiters = new Map();
	nodes = new Map();
	lightNodes = new Map();
	type = 'base';
	isNode = true;
}
