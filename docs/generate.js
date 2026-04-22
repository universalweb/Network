import {
	arrayToRegex, currentPath, has, replaceList,
} from '@universalweb/utilitylib';
import { read, write } from '#utilities/file';
import { watch } from '#utilities/watch';
const filePath = currentPath(import.meta);
const githubURL = 'https://raw.githubusercontent.com/universalweb/Network/refs/heads/master/docs/';
function removeHighCharCodes(str, maxCharCode) {
	let result = '';
	for (let i = 0; i < str.length; i++) {
		if (str.charCodeAt(i) <= maxCharCode) {
			result += str[i];
		}
	}
	return result;
}
async function createIndexPage(viatContent) {
	const htmlDOC = await read(`${filePath}/docTemplate.html`);
	console.log('INDEX PAGE GENERATED');
	return htmlDOC.toString().replace('${viat}', viatContent.toString());
}
async function generateIndexPage() {
	const viatContents = await read(`${filePath}/viat.html`);
	const page = await createIndexPage(viatContents);
	await write(`${filePath}/index.html`, page);
	let cleanedContent = removeHighCharCodes(page, 50000);
	cleanedContent = cleanedContent.replaceAll('./', githubURL);
	await write(`${filePath}/README.md`, cleanedContent);
}
await generateIndexPage();
const checkList = arrayToRegex(['README.md']);
const pathNameRegex = /\.md|\.html|\.css/;
watch(`${filePath}/docTemplate.html`, async (eventType, pathName) => {
	const regex = pathName.match(pathNameRegex);
	if (regex && regex.length && !has(pathName, checkList)) {
		if (eventType === 'change') {
			console.log('Event Type', eventType, 'Path Name', pathName);
		}
		await generateIndexPage();
	}
});
