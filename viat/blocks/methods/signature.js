const methods = {
	async createSignature(wallet) {
		if (!wallet) {
			return;
		}
		const preHash = await this.getPreHash();
		return wallet.signPartial(preHash);
	},
	async sign(wallet) {
		if (!wallet) {
			return;
		}
		const signature = await this.createSignature(wallet);
		this.set('signature', signature);
		/* Bind the signature into the chain-reference hash (Option A). */
		await this.setHash();
		return this;
	},
	async createFullSignature(wallet) {
		if (!wallet) {
			return;
		}
		const preHash = await this.getPreHash();
		return wallet.sign(preHash);
	},
	async signFull(wallet) {
		if (!wallet) {
			return;
		}
		const signature = await this.createFullSignature(wallet);
		this.set('signature', signature);
		await this.setHash();
		return this;
	},
	async verifySignature(wallet) {
		if (!wallet) {
			return;
		}
		const signature = this.get('signature');
		const preHash = await this.getPreHash();
		return wallet.verifyPartialSignature(signature, preHash);
	},
	async verifyFullSignature(wallet) {
		if (!wallet) {
			return;
		}
		const signature = this.get('signature');
		const preHash = await this.getPreHash();
		return wallet.verifySignature(signature, preHash);
	},
};
export default methods;
