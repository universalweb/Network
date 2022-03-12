module.exports = (uwApp) => {
	const nodeWatch = require('node-watch');
	const {
		isString
	} = uwApp.utility;
	uwApp.watch = (item, callback) => {
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
