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
	/* Pick the hash width from this block's configured hashSize. */
	async hashBySize(binary) {
		if (!binary) {
			return;
		}
		if (this.hashSize === 32) {
			return this.hash256(binary);
		}
		if (this.hashSize === 64) {
			return this.hash512(binary);
		}
		if (this.hashSize > 64 && this.hashXOFConfig) {
			return this.hashXOF(binary, this.hashXOFConfig);
		}
		return this.hash512(binary);
	},
	async hashData() {
		return this.hashBySize(await this.exportDataBinary());
	},
	async hashXOFData(config) {
		return this.hashXOF(await this.exportDataBinary(), config || this.hashXOFConfig);
	},
	async hashMeta() {
		return this.hash512(await this.exportMetaBinary());
	},
	async hashCore() {
		return this.hash512(await this.exportCoreBinary());
	},
	async hashBlock() {
		return this.hash512(await this.exportBinary());
	},
	async hashBlockShort() {
		return this.hash256(await this.exportBinary());
	},
	async hashXOFBlock(config) {
		return this.hashXOF(await this.exportBinary(), config);
	},
	/**
	 * The pre-hash is H(DATA) — the message the owner signs. It commits all block
	 * details (meta + core) and survives signature pruning. Signed blocks only.
	 */
	async setPreHash() {
		this.set('preHash', await this.hashData());
		return this;
	},
	async getPreHash() {
		if (!this.get('preHash')) {
			await this.setPreHash();
		}
		return this.get('preHash');
	},
	/**
	 * The chain-reference hash. Deterministic blocks hash DATA directly. Signed
	 * blocks hash preHash ‖ signature (Option A) so the signature is bound into
	 * the id other blocks reference — no signature swap without changing identity.
	 * Returns undefined for a signed block that is not yet signed.
	 */
	async hashFinal() {
		if (!this.isSigned) {
			return this.hashData();
		}
		const signature = this.get('signature');
		if (!signature) {
			return;
		}
		const preHash = await this.getPreHash();
		return this.hashBySize(Buffer.concat([preHash, signature]));
	},
	async setHash() {
		const hash = await this.hashFinal();
		if (hash) {
			this.set('hash', hash);
		}
		return this;
	},
	async setHashXOF(options) {
		this.set('hash', await this.hashXOFData(options));
		return this;
	},
	async getHash() {
		if (!this.get('hash')) {
			await this.setHash();
		}
		return this.get('hash');
	},
};
export default methods;
