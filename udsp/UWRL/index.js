import { jsonParse } from '@universalweb/acid';
class UWRL {
	constructor(urlOriginal, paramaters) {
		let url = urlOriginal;
		if (paramaters) {
			this.paramaters = paramaters;
		}
		if (url.includes('{')) {
			const urlParts = urlOriginal.split('{');
			url = urlParts[0];
			try {
				this.paramaters = jsonParse(`{${urlParts[1]}`);
				if (paramaters) {
					if (paramaters['#']) {
						this.hash = paramaters['#'];
					}
				}
			} catch {
				this.paramaters = {};
			}
		}
		this.href = url;
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
const uwri = new UWRL('https://www.example.com:8080/path/to/resource{"query":"value", "#": "fragment also known as on the UW as state", ":": ["username", "password"]}');
console.log(uwri);
const uwri2 = new UWRL('https://www.example.com:8080/path/to/resource', {
	query: 'value',
	'#': 'fragment',
	'@': ['username', 'password']
});
console.log(uwri2);
