module.exports = async (state) => {
	state.logImprt('FILE', __dirname);
	const {
		writeFile,
		readFile
	} = require('fs');
	const {
		utility: {
			promise
		},
		success
	} = state;
	const operations = {
		write(fileName, contents) {
			return promise((accept, reject) => {
				writeFile(fileName, contents, 'utf8', (error) => {
					if (error) {
						reject(error);
					} else {
						success('SAVED', fileName);
						accept();
					}
				});
			});
		},
		read(fileName) {
			return promise((accept, reject) => {
				readFile(fileName, 'utf8', (error, contents) => {
					if (error) {
						reject(error);
					} else {
						accept(contents);
					}
				});
			});
		},
		async copy(source, destination) {
			const file = await operations.read(source);
			await operations.write(destination, file);
		}
	};
	state.file = operations;
};
