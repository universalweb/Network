module.exports = (type, state = {}) => {
	state.type = type;
	state.utility = require('Lucy');
	state.getUtil = (names) => {
		names.forEach((item) => {
			require(`../utilities/${item}/`)(state);
		});
	};
	state.getUtil(['console', 'msgpack', 'file', 'crypto', 'certificate']);
	return state;
};
