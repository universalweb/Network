export async function destroy(err) {
	this.state = 2;
	if (err) {
		this.err = err;
	}
	console.log(`Destroying ${this.type} ID:${this.id} ->`, err);
	this.flush();
	if (this.isAsk) {
		this.source().requestQueue.delete(this.id);
	} else {
		this.source().replyQueue.delete(this.id);
	}
}
