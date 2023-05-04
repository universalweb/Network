import path from 'path';
import { protocol } from 'electron';
import { currentPath } from '#utilities/directory';
const resourcesDirectory = path.normalize(`${currentPath(import.meta)}/../../resources/`);
console.log(resourcesDirectory);
const resourceWhiteList = ['css/index.css', 'css/uikit-rtl.css', 'css/uikit-rtl.css', 'css/uikit.css',
	'images/logo.png', 'js/msgPack.js', 'js/ractive.js', 'js/components.js',
	'js/uikit.js', 'js/uikitIcons.js', 'js/utility.js'];
protocol.registerFileProtocol('local', (request, callback) => {
	const url = request.url.substr(8);
	console.log('RAW URL', url);
	if (!url) {
		return console.log('EMPTY URL FOR LOCAL ASSET');
	}
	const cleaned = path.normalize(url);
	console.log('CLEANED URL', cleaned);
	if (!resourceWhiteList.includes(url)) {
		return console.log('NONE WHITELISTED LOCAL ASSET');
	}
	const normalized = path.normalize(`${resourcesDirectory}/${cleaned}`);
	console.log('LOCAL ASSET FINAL PATH', normalized);
	return callback({
		path: normalized
	});
}, (error) => {
	if (error) {
		return console.error('Failed to register protocol');
	}
});
