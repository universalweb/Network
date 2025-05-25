export async function destroy(err) {
	await this.clearSetupTimeout();
	await this.clearSendPathReadyTimeout();
	await this.clearSendParametersReadyTimeout();
	await this.clearSendHeadReadyTimeout();
	await this.clearSendDataReadyTimeout();
	if (this.source().requestQueue.get(this.id) === this) {
		this.state = false;
		this.logInfo(`Destroying Request ID:${this.id} ->`, err || 'No reason given');
		this.source().requestQueue.delete(this.id);
		this.flush();
		if (this.compiledData) {
			this.compiledData.fill(0);
		}
		if (this.headCompiled) {
			this.headCompiled.fill(0);
		}
	}
}
