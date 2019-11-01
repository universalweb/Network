module.exports = (server) => {
	function chunking(message) {
		const {
			body
		} = message;
		const length = body.length;
		console.log(body, length);
	}
	server.chunking = chunking;
};
