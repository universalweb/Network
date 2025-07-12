const methods = {
	setDefaults() {
		this.setTimestamp();
		this.setVersion();
		this.setBlockType();
		this.setNonce();
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
	setNonce(nonce) {
		if (nonce) {
			this.setMeta('nonce', nonce);
		} else {
			this.setMeta('nonce', this.cipherSuite.createBlockNonce(this.nonceSize));
		}
		return this;
	},
};
export default methods;
