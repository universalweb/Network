module.exports = async (state) => {
	const {
		success,
		attention
	} = state;
	state.streamEvents = {
		async connected(stream) {
			success(`STREAM EVENT -> connected - ID:${stream.id}`);
		},
		async connection(stream) {
			attention(`STREAM EVENT -> connection - ID:${stream.id}`);
		},
		async created(stream) {
			attention(`STREAM EVENT -> created - ID:${stream.id}`);
		},
		async destroy(stream) {
			attention(`STREAM EVENT -> destroy - ID:${stream.id}`);
		},
		async identity(stream) {
			attention(`STREAM EVENT -> identity - ID:${stream.id}`);
		},
		async reKey(stream) {
			attention(`STREAM EVENT -> reKey - ID:${stream.id}`);
		},
		async sent(stream) {
			attention(`STREAM EVENT -> sent - ID:${stream.id}`);
		},
		async statusUpdate(stream) {
			attention(`STREAM EVENT -> statusUpdate - ID:${stream.id}`);
		},
	};
};
