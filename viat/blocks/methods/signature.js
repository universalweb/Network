const methods = {
	async createSignature(wallet) {
		const binary = this.block.hash;
		const signature = await wallet.signPartial(binary);
		return signature;
	},
	async sign(wallet) {
		const signature = await this.createSignature(wallet);
		await this.set('signature', signature);
		return this;
	},
	async createFullSignature(wallet) {
		const binary = await this.exportDataBinary();
		const signature = await wallet.sign(binary);
		return signature;
	},
	async signFull(wallet) {
		const signature = await this.createFullSignature(wallet);
		await this.set('signature', signature);
		return this;
	},
	async verifySignature(wallet) {
		const signature = await this.get('signature');
		const binary = await this.exportDataBinary();
		const isValid = await wallet.verifyPartialSignature(signature, binary);
		return isValid;
	},
	async verifyFullSignature(wallet) {
		const signature = await this.get('signature');
		const binary = await this.exportDataBinary();
		const isValid = await wallet.verifySignature(signature, binary);
		return isValid;
	},
};
export default methods;
