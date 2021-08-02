const state = require('../state/')('hashID check');
const {
	crypto: {
		hash
	}
} = state;
console.log(hash(Buffer.from('sjfhhjfhdshfjhkdfshkjfhjdsfhjkhkfjdfjhkfhsdhfjskh')).toString('base64'));
