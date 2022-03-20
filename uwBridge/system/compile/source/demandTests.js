const {
	hasDot,
	last,
	compact
} = require('Acid');
const type = 'js';
let filePath = '../mainModal/index.js';
if (filePath[0] !== '/') {
	filePath = `/${filePath}`;
}
const path = '/component/settings/test/';
const pathArray = compact(path.split('/'));
const pathArrayLength = pathArray.length;
const matches = filePath.match(/\.\.\//g);
console.log(pathArray, matches, matches.length);
filePath = `${pathArray.slice(0, pathArrayLength - matches.length).join('/') + filePath.replace(/\.\.\//g, '')}`;
if (filePath.substring(0, 3) === '/./') {
	filePath = path + filePath.substring(3);
}
if (!hasDot(filePath)) {
	if (last(filePath) === '/') {
		filePath += `index.${type}`;
	} else {
		filePath += `.${type}`;
	}
}
console.log(filePath);
