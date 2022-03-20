const {
	compactMapArray,
	hasDot,
	last
} = require('Acid');
const type = 'js';
let filePath = '/../js/util/markdown.js';
if (filePath[0] !== '/') {
	filePath = `/${filePath}`;
}
const filepathArray = filePath.split('/');
const path = '/app/';
const pathArray = path.split('/');
const filePathMod = compactMapArray([...filepathArray], (itemDir, index) => {
	if (itemDir === '..') {
		if (index === 1) {
			return;
		}
		return pathArray[index];
	} else {
		return itemDir;
	}
});
filePath = filePathMod.join('/');
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
