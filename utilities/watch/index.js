module.exports = (state) => {
	const nodeWatch = require('node-watch');
	const {
		utility: {
			isString
		}
	} = state;
	state.watch = (item, callback) => {
		return nodeWatch(item, {
			recursive: true
		}, (evt, filename) => {
			if (evt === 'update' && filename && isString(filename)) {
				if (!filename.includes('.')) {
					return;
				}
				return callback(filename);
			}
		});
	};
};
