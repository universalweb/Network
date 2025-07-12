import { encodeStrict } from '#utilities/serialize';
const methods = {
	async exportBinary() {
		return encodeStrict(this.block);
	},
	async exportDataBinary() {
		return encodeStrict(this.block.data);
	},
	async exportMetaBinary() {
		return encodeStrict(this.block.data.meta);
	},
	async exportCoreBinary() {
		return encodeStrict(this.block.data.core);
	},
};
export default methods;
