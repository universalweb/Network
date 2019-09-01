module.exports = async (state) => {
	const path = require('path');
	const {
		logImprt,
		cnsl,
		alert,
		utility: {
			stringify,
			keys,
			assign,
			cleanPath,
			isString,
		},
		configuration: {
			resourceDirectory
		},
		crypto: {
			toBase64
		},
		file: {
			read
		}
	} = state;
	logImprt('APP', __dirname);
	const isValid = require('is-valid-path');
	const api = {
		async open(stream, body, json) {
			cnsl(`
      JSON:  ${stringify(json)}
      BODY:  ${stringify(body)}
      SID:${stream.id}`);
			return {
				status: 1,
				date: Date.now()
			};
		},
		async reKey(stream, body) {
			cnsl(`${toBase64(body.certificate.key)}`);
			stream.reKey(body.certificate);
		},
		async file(stream, body, json) {
			cnsl(`
      JSON:  ${stringify(json)}
      BODY:  ${stringify(body)}
      SID:${stream.id}`);
			const cleanedPath = cleanPath(`${resourceDirectory}/${body.location}`);
			const ext = path.extname(cleanedPath);
			return {
				data: {
					ext,
					file: await read(cleanedPath)
				}
			};
		},
		async state(stream, body, json) {
			cnsl(`
      JSON:  ${stringify(json)}
      BODY:  ${stringify(body)}
      SID:${stream.id}`);
			const {
				state: fileName
			} = body;
			if (!isString(fileName) || !fileName.length || !isValid(fileName)) {
				return {
					data: ''
				};
			}
			const cleanedPath = cleanPath(`${resourceDirectory}/states/${fileName}/index.js`);
			const file = await read(cleanedPath);
			return {
				data: file
			};
		},
	};
	assign(state.app, api);
	alert(`LOADED PUBLIC API: COUNT: ${keys(api).length} ||| ${keys(api).join(' , ')}`);
};
