import { BaseNode } from '#viat/nodes/index';
export class Auditor extends BaseNode {
	constructor() {
		super();
	}
	type = 'auditor';
	isAuditor = true;
}
