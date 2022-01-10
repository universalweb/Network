module.exports = (utility) => {
	const nodeWatch = require('node-watch');
	const {
		isString
	} = utility;
	utility.watch = (item, callback) => {
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
