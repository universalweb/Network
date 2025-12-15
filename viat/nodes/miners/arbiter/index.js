import { BaseNode } from '#viat/nodes/index';
export class Arbiter extends BaseNode {
	constructor(config) {
		super(config);
	}
	async processBlock(block) {
		const target = await this.validateBlock(block);
	}
	async validateBlock(block) {
		return {
			block,
			valid: true,
		};
	}
	async registerAuditor(auditor) {
		this.auditors.set(auditor.id, auditor);
	}
	type = 'arbiter';
	isArbiter = true;
}
