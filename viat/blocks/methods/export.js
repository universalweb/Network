import { encodeStrict } from '#utilities/serialize';
/* encodeStrict is the unified bignum-safe canonical encoder: amounts >= 2^64 (VIAT reaches 10^58) serialize as CBOR bignum tags, smaller values as preferred-serialization ints. */
const methods = {
	async exportBinary() {
		return encodeStrict(this.get());
	},
	async exportDataBinary() {
		return encodeStrict(this.getData());
	},
	async exportMetaBinary() {
		return encodeStrict(this.getMeta());
	},
	async exportCoreBinary() {
		return encodeStrict(this.getCore());
	},
	async exportObject() {
		return this.get();
	},
};
export default methods;
