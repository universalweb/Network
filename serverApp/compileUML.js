import { decode, encode } from '#utilities/serialize';
import { parse, parseFragment } from 'parse5';
// EXPERIMENTAL
function htmlToJson(node, index) {
	console.log(node, index);
	if (node.length) {
		return node.map(htmlToJson);
	}
	if (node.nodeName === '#text') {
		return node.value.trim() ? node.value : null;
	}
	if (!node.tagName && node.childNodes?.length) {
		return htmlToJson(node.childNodes);
	}
	const tagName = node.tagName;
	const attributes = {};
	if (node.attrs) {
		for (const attr of node.attrs) {
			attributes[attr.name] = attr.value;
		}
	}
	const children = (node.childNodes || [])
		.map(htmlToJson)
		.filter((child) => {
			return child !== null;
		}); // Remove null entries
	return [
		tagName, Object.keys(attributes).length ? attributes : undefined, children.length ? children : undefined
	].filter((x) => {
		return x !== undefined;
	});
}
async function convertHtmlToMsgPack(html) {
	const doc = await parseFragment(html);
	console.log(doc.childNodes);
	const jsonStructure = await htmlToJson(doc.childNodes);
	console.dir(jsonStructure, {
		depth: null,
		colors: true
	});
	// return encode(jsonStructure);
}
// Example HTML
const htmlContent = `<div id="container"><h1>Hello</h1><p class="text">World</p></div>`;
// Convert and encode
const packedData = await convertHtmlToMsgPack(htmlContent);
// console.log('MessagePack Buffer:', packedData);
// console.log('MessagePack length:', packedData.length, Buffer.from(htmlContent, 'utf8').length);
console.dir(decode(packedData), {
	depth: null,
	colors: true
});
