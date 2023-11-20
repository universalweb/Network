export async function destroy(err) {
	this.state = 2;
	if (err) {
		this.err = err;
	}
	console.log(`Destroying ${this.type} ID:${this.id} ->`, err);
	this.flush();
	if (this.compiledData) {
		this.compiledData.fill(0);
	}
	if (this.headCompiled) {
		this.headCompiled.fill(0);
	}
	this.source().requestQueue.delete(this.id);
}
