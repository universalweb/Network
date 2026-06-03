import VIAT_DEFAULTS from '#viat/defaults';
const { NETWORK_ID } = VIAT_DEFAULTS;
const methods = {
	async setDefaults() {
		this.setVersion();
		this.setBlockType();
		this.setFormat();
		this.setNetworkId();
		this.setStateAnchors();
		/*
			Deterministic blocks (anchors, audit, genesis, receipt) must reproduce byte-for-byte
			from the same input — so no wall-clock timestamp and no random nonce. Receipts inherit
			both from their source transaction; audit blocks derive timing from the cycle. Signed
			blocks get a fresh timestamp + random nonce for freshness and replay protection.
		*/
		if (this.isSigned) {
			this.setTimestamp();
			await this.setNonce();
		}
		return this;
	},
	setVersion(value) {
		this.setMeta('version', value || this.version);
		return this;
	},
	setTimestamp(timestamp) {
		this.setMeta('timestamp', timestamp || Date.now());
		return this;
	},
	setBlockType(blockType) {
		this.setMeta('blockType', blockType || this.blockType);
		return this;
	},
	setFormat(format) {
		this.setMeta('format', format || this.fileType);
		return this;
	},
	setNetworkId(networkId) {
		this.setMeta('networkId', (networkId === undefined) ? NETWORK_ID : networkId);
		return this;
	},
	/**
	 * Initialize the prior/future state anchors. Each anchor carries the audit
	 * block's numeric STATE_ID (ordering, staleness, precompute) and its 32-byte
	 * hash (binds to the real state, defends against forks). Future hash is null
	 * until the audit block forms; the chaining layer fills these via the setters.
	 */
	setStateAnchors() {
		this.setMeta('priorState', {
			id: 0n,
			hash: null,
		});
		this.setMeta('futureState', {
			id: 0n,
			hash: null,
		});
		return this;
	},
	setPriorState(stateId, stateHash) {
		this.setMeta('priorState', {
			id: stateId,
			hash: stateHash || null,
		});
		return this;
	},
	setFutureState(stateId, stateHash) {
		this.setMeta('futureState', {
			id: stateId,
			hash: stateHash || null,
		});
		return this;
	},
	async setNonce(nonce) {
		this.setMeta('nonce', nonce || await this.cipherSuite.createBlockNonce(this.nonceSize));
		return this;
	},
};
export default methods;
