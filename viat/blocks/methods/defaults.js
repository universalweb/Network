const methods = {
	async setDefaults() {
		await this.setTimestamp();
		await this.setVersion();
		await this.setBlockType();
		await this.setNonce();
		return this;
	},
	setVersion(value) {
		if (value) {
			this.setMeta('version', value);
		} else {
			this.setMeta('version', this.version);
		}
		return this;
	},
	setTimestamp(timestamp) {
		if (timestamp) {
			this.setMeta('timestamp', timestamp);
		} else {
			this.setMeta('timestamp', Date.now());
		}
		return this;
	},
	setBlockType(blockType) {
		if (blockType) {
			this.setMeta('blockType', blockType);
		} else {
			this.setMeta('blockType', this.blockType);
		}
		return this;
	},
	async setNonce(nonce) {
		if (nonce) {
			await this.setMeta('nonce', nonce);
		} else {
			await this.setMeta('nonce', await this.cipherSuite.createBlockNonce(this.nonceSize));
		}
		return this;
	},
};
export default methods;
