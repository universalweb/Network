const methods = {
	async hash256(binary) {
		if (binary) {
			return this.cipherSuite.hash.hash256(binary);
		}
	},
	async hash512(binary) {
		if (binary) {
			return this.cipherSuite.hash.hash512(binary);
		}
	},
	async hash1024(binary) {
		if (binary) {
			return this.cipherSuite.hash.hash1024(binary);
		}
	},
	async hashXOF(binary, options) {
		if (binary) {
			return this.cipherSuite.hash.hashXOFObject(binary, options || this.hashXOFConfig);
		}
	},
	async getSenderPathHash() {
		const hash = await this.getHash();
		const sender = this.getSender();
		const hashed = await this.hash512(Buffer.concat([hash, sender]));
		return hashed;
	},
	async getReceiverPathHash() {
		const hash = await this.getHash();
		const receiver = this.getReceiver();
		const hashed = await this.hash512(Buffer.concat([hash, receiver]));
		return hashed;
	},
	async hashData() {
		const binary = await this.exportDataBinary();
		return this.hash512(binary);
	},
	async hashXOFData(config) {
		const binary = await this.exportDataBinary();
		return this.hashXOF(binary, config);
	},
	async hashMeta() {
		const binary = await this.exportMetaBinary();
		return this.hash512(binary);
	},
	async hashCore() {
		const binary = await this.exportCoreBinary();
	},
	async hashBlock() {
		const binary = await this.exportBinary();
		return this.hash512(binary);
	},
	async hashXOFBlock(config) {
		const binary = await this.exportBinary();
		return this.hashXOF(binary, config);
	},
	async setHash() {
		await this.set('hash', await this.hashData());
	},
	async setHashXOF(options) {
		await this.set('hash', await this.hashXOFData(options));
	},
	async getHash() {
		if (!this.get('hash')) {
			await this.setHash();
		}
		return this.get('hash');
	},
};
export default methods;
