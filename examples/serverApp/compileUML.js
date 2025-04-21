import { currentPath, isArray, isString } from '@universalweb/acid';
import { decode, encode, encodeStrict } from '#utilities/serialize';
import { parse, parseFragment } from 'parse5';
import { read } from '#utilities/file';
import zlib from 'zlib';
const dirname = currentPath(import.meta);
// EXPERIMENTAL CONVERT HTML STRING TO COMPRESSED UML THEN COMPARE
function htmlToJson(node, index) {
	let tagName = node.tagName;
	if (isArray(node) && node.length) {
		return node.map(htmlToJson);
	}
	if (node.nodeName === '#text') {
		if (node.value.trim()) {
			return node.value;
		}
		return;
	}
	if (node.nodeName === '#documentType') {
		return [`!DOCTYPE ${node.name}`];
	}
	if (node.nodeName === '#document-fragment') {
		// console.log('Document-fragment', node);
		return htmlToJson(node.childNodes);
	}
	if (node.nodeName === '#document') {
		// console.log('Document', node);
		return htmlToJson(node.childNodes);
	}
	if (!node.tagName && node.childNodes?.length) {
		// console.log(node.nodeName, node.tagName);
		return htmlToJson(node.childNodes);
	}
	const attributes = {};
	if (node.attrs) {
		if (node.attrs.id) {
			tagName += `#${node.attrs.id}`;
		}
		if (node.attrs.class) {
			tagName += `.${node.attrs.class}`;
		}
		if (node.attrs.length) {
			tagName += ` `;
		}
		for (const attr of node.attrs) {
			if (attr.name === 'class' || attr.name === 'id') {
				continue;
			}
			tagName += `${attr.name}="${attr.value}" `;
		}
		// tagName = tagName.trim();
	}
	const children = (node.childNodes || [])
		.map(htmlToJson)
		.filter((child) => {
			if (child !== null && child !== undefined) {
				return child;
			}
			return false;
		}).filter((x) => {
			return x !== undefined;
		});
	const result = [];
	if (tagName) {
		result[0] = tagName;
		if (children.length) {
			result.push(...children);
		}
	} else if (children.length) {
		result.push(...children);
	}
	return result.filter((x) => {
		return x !== undefined;
	});
}
async function unWrap(source) {
	return source;
}
async function convertHtmlToMsgPack(html) {
	const doc = await parse(html);
	// console.log(doc);
	const jsonStructure = await htmlToJson(doc);
	if (jsonStructure) {
		const unWrapped = await unWrap(jsonStructure);
		return unWrapped;
	}
}
// Example HTML
const htmlFile = await read(`${dirname}/resources/randomData.html`);
const htmlContent = htmlFile.toString('utf8');
// Convert and encode
const packedDataStructure = await convertHtmlToMsgPack(htmlContent);
// console.dir(packedDataStructure, {
// 	depth: null,
// 	colors: true
// });
const packedData = encodeStrict(packedDataStructure);
console.log('UML uncompressed size:', packedData.length);
console.log('RAW HTML SIZE', htmlFile.length);
const compressedString = zlib.brotliCompressSync(htmlFile);
// zlib.brotliDecompressSync(compressedString).toString()
console.log('compressedString', compressedString.length);
const dictionary = Buffer.from('');
const compressOptions = {
	level: 9,
	memLevel: 9,
	windowBits: 15,
	dictionary
};
const compressedUML = zlib.brotliCompressSync(packedData);
const decompress = zlib.brotliDecompressSync(compressedUML);
const decoded = decode(decompress);
console.log('compressedUML', compressedUML.length, decompress.length);
// console.log(zlib.gzipSync(packedData, compressOptions).length);
// console.log(decoded[1]);
// console.dir(decode(packedData), {
// 	depth: null,
// 	colors: true
// });
