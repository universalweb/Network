export async function destroy(err) {
	this.state = false;
	console.log(`Destroying ${this.type} ID:${this.id} ->`, err);
	this.source().requestQueue.delete(this.id);
	this.flush();
	if (this.compiledData) {
		this.compiledData.fill(0);
	}
	if (this.headCompiled) {
		this.headCompiled.fill(0);
	}
}
