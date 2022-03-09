module.exports = (state) => {
	if (state && state.logImprt) {
		state.logImprt('FILE', __dirname);
	}
	const {
		writeFile,
		readFile,
		readFileSync
	} = require('fs');
	const {
		promise,
		jsonParse
	} = require('Acid');
	const {
		normalize
	} = require('path');
	const operations = {
		write(filePath, contents, encode) {
			return promise((accept, reject) => {
				writeFile(normalize(filePath), contents, encode, (error) => {
					if (error) {
						reject(error);
					} else {
						accept();
					}
				});
			});
		},
		read(filePath, encode) {
			return promise((accept, reject) => {
				readFile(normalize(filePath), encode, (error, contents) => {
					if (error) {
						reject(error);
					} else {
						accept(contents);
					}
				});
			});
		},
		async copy(source, destination, config) {
			let file = await operations.read(source);
			if (config) {
				if (config.prepend) {
					file = config.prepend + file;
				}
			}
			await operations.write(normalize(destination), file);
		},
		readJson(filePath) {
			return jsonParse(readFileSync(filePath));
		}
	};
	if (state) {
		state.file = operations;
	}
	return operations;
};
