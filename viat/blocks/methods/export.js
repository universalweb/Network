import { encodeStrictBig } from '#utilities/serialize';
/* Blocks use the bignum-safe canonical encoder — VIAT amounts (up to 10^58) exceed cborg's plain 2^64 int cap. */
const methods = {
	async exportBinary() {
		return encodeStrictBig(this.get());
	},
	async exportDataBinary() {
		return encodeStrictBig(this.getData());
	},
	async exportMetaBinary() {
		return encodeStrictBig(this.getMeta());
	},
	async exportCoreBinary() {
		return encodeStrictBig(this.getCore());
	},
	async exportObject() {
		return this.get();
	},
};
export default methods;
