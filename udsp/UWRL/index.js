import { initialString, jsonParse, restString } from '@universalweb/acid';
class UWRL {
	constructor(urlOriginal, paramaters) {
		let url = urlOriginal;
		if (paramaters) {
			this.paramaters = paramaters;
		}
		if (url.includes('{')) {
			const jsonStringStartIndex = url.indexOf('{');
			console.log(jsonStringStartIndex, url[45]);
			url = initialString(url, jsonStringStartIndex);
			this.params = restString(url, jsonStringStartIndex).trim();
			try {
				this.paramaters = jsonParse(this.params);
			} catch {
				this.paramaters = {};
			}
			if (paramaters) {
				if (paramaters['#']) {
					this.hash = paramaters['#'];
				}
				if (paramaters[':']) {
					this.account = paramaters[':'][0];
					this.password = paramaters[':'][1];
				}
			}
		}
		console.log(url);
		const urlObject = new URL(url);
		console.log(urlObject);
		this.href = url;
		this.origin = urlObject.origin;
	}
	get search() {
		return this.paramaterString;
	}
	get searchParams() {
		return this.parameters;
	}
	hash = '';
	isUWRI = true;
}
// Supports Username Password and URL Fragments
// Server can opt in to get the URL fragments
// fragments are turned into client side state tracking
const uwri = new UWRL('https://www.example.com:8080/path/to/resource{"query":"value", "#": "fragment", ":": ["username", "password"]}');
console.log(uwri);
// const uwri2 = new UWRL('https://www.example.com:8080/path/to/resource', {
// 	query: 'value',
// 	'#': 'fragment',
// 	'@': ['username', 'password']
// });
// console.log(uwri2);
