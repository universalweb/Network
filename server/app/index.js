module.exports = (state) => {
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
			const {
				path: location
			} = body;
			if (!isString(location) || !location.length || !isValid(location)) {
				console.log('No valid state request recieved - Returning empty data');
				return stream.send({
					api: json.api,
					rid: json.rid,
					error: 404
				});
			}
			const cleanedPath = cleanPath(`${resourceDirectory}/${location}`);
			const ext = path.extname(cleanedPath);
			console.log(`EXT => ${ext}`);
			return {
				data: {
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
			if (!isString(fileName) || !isValid(fileName)) {
				console.log('No valid state request recieved - Returning empty data');
				return stream.send({
					api: json.api,
					rid: json.rid,
					error: 404
				});
			}
			const cleanedPath = (fileName) ? cleanPath(`${resourceDirectory}/states/${fileName}/index.js`) : cleanPath(`${resourceDirectory}/states/index.js`);
			const file = await read(cleanedPath);
			console.log(cleanedPath, file);
			return {
				data: file
			};
		},
	};
	assign(state.app, api);
	alert(`LOADED PUBLIC API: COUNT: ${keys(api).length} ||| ${keys(api).join(' , ')}`);
};
