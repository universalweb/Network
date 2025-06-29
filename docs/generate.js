import { currentPath, replaceList } from '@universalweb/acid';
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
async function createIndexPage(content) {
	const htmlDOC = await read(`${filePath}/docTemplate.html`);
	console.log(htmlDOC);
	return htmlDOC.toString().replace('${content}', content);
}
async function generateIndexPage() {
	const contents = await read(`${filePath}/content.html`);
	await write(`${filePath}/index.html`, await createIndexPage(contents));
	let cleanedContent = removeHighCharCodes(contents.toString(), 50000);
	cleanedContent = cleanedContent.replaceAll('./', githubURL);
	await write(`${filePath}/README.md`, cleanedContent);
}
await generateIndexPage();
watch(`${filePath}/`, async (eventType, pathName) => {
	const regex = pathName.match(/content\.html|\.css/);
	if (regex && regex.length) {
		console.log(regex, 'Event Type', eventType, 'Path Name', pathName);
		await generateIndexPage();
	}
});
