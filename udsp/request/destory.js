export async function destroy(err) {
	this.state = 2;
	if (err) {
		this.err = err;
	}
	console.log(`Destroying ${this.type} ${this.id}`);
	this.flush();
	this.source().queue.delete(this.id);
}
