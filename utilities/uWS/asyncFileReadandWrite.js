function asyncFileReadandWrite(res, path) {
	const Buffer = require('buffer');
	const fs = require('fs');
	res.onData((chunk, isLast) => {
		const chunks = [];
		chunks.push(chunk);
		if (isLast) {
			const body = Buffer.concat(chunks);
			res.end('Thanks for the data!');
			fs.writeFile(path, chunks, [encoding], (e) => {
				if (e) {
					return console.log(e);
				}
				console.log(`${chunks} > ${path}`);
			});
		}
	});
}
module.exports = asyncFileReadandWrite;
