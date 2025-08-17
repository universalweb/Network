export async function destroy(err) {
	this.clearSetupTimeout();
	this.clearSendPathReadyTimeout();
	this.clearSendParametersReadyTimeout();
	this.clearSendHeadReadyTimeout();
	this.clearSendDataReadyTimeout();
	if (this.source().requestQueue.get(this.id) === this) {
		this.state = false;
		console.log(`Destroying Request ID:${this.id} ->`, err || 'No reason given');
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
