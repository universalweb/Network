// indexCodebase.js — parse JS class declarations and emit one JSON doc per class.
//
// Modes:
//   node ./agent/indexCodebase.js                                 // all important classes (whole repo)
//   node ./agent/indexCodebase.js --class WebComponent            // just one class by name
//   node ./agent/indexCodebase.js --source viat/centralSite/...   // scope the scan to a folder
//   node ./agent/indexCodebase.js --out agent/docs/classes        // override output folder
//   node ./agent/indexCodebase.js --min-score 3                   // change importance threshold
//
// Flags compose: --source narrows the scan, --class filters the output, --out redirects, --min-score
// gates the default "all classes" mode. With --class, the score gate is ignored so the named class
// always appears even if its score is low.
import fileSystem from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const scriptPath = fileURLToPath(import.meta.url);
const agentFolderPath = path.dirname(scriptPath);
const repoFolderPath = path.resolve(agentFolderPath, '..');
const ignoreFolderSet = new Set([
	'.git',
	'node_modules',
	'dist',
	'build',
	'coverage',
	'.next',
	'.cache',
	'.turbo',
	'.github',
	'.pnpm-store',
	'components_backup',
]);
const validExtensionSet = new Set(['.js']);
const purposeOrder = [
	'core',
	'components',
	'services',
	'utilities',
	'viat',
	'udsp',
	'browser',
	'agent',
	'docs',
	'examples',
];
const validMethodNamePattern = new RegExp('^[A-Za-z][A-Za-z0-9]*$');
function parseArgs(rawArgs) {
	const settings = {
		sourcePath: repoFolderPath,
		outputPath: path.resolve(agentFolderPath, 'docs', 'classes'),
		minimumScore: 3,
		classNameFilter: null,
	};
	for (let argIndex = 0; argIndex < rawArgs.length; argIndex += 1) {
		const argValue = rawArgs[argIndex];
		if (argValue === '--source' && rawArgs[argIndex + 1]) {
			settings.sourcePath = path.resolve(rawArgs[argIndex + 1]);
			argIndex += 1;
			continue;
		}
		if (argValue === '--out' && rawArgs[argIndex + 1]) {
			settings.outputPath = path.resolve(rawArgs[argIndex + 1]);
			argIndex += 1;
			continue;
		}
		if (argValue === '--min-score' && rawArgs[argIndex + 1]) {
			const parsedValue = Number(rawArgs[argIndex + 1]);
			if (Number.isFinite(parsedValue) && parsedValue >= 0) {
				settings.minimumScore = parsedValue;
			}
			argIndex += 1;
			continue;
		}
		if (argValue === '--class' && rawArgs[argIndex + 1]) {
			settings.classNameFilter = String(rawArgs[argIndex + 1]);
			argIndex += 1;
		}
	}
	return settings;
}
function sanitizeName(rawName) {
	const cleanName = String(rawName || '').replace(/[^A-Za-z0-9.-]+/g, '');
	if (cleanName) {
		return cleanName;
	}
	return 'Unknown';
}
function sanitizeSlug(rawValue) {
	const cleanValue = String(rawValue || '')
		.replace(/[^A-Za-z0-9]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
	if (cleanValue) {
		return cleanValue;
	}
	return 'class';
}
function pathToUnix(filePath) {
	return filePath.split(path.sep).join('/');
}
function getPurposeFolder(relativeFilePath) {
	const unixPath = pathToUnix(relativeFilePath);
	const pathSegments = unixPath.split('/').filter(Boolean);
	for (let orderIndex = 0; orderIndex < purposeOrder.length; orderIndex += 1) {
		const purposeName = purposeOrder[orderIndex];
		if (pathSegments.includes(purposeName)) {
			return purposeName;
		}
	}
	if (pathSegments.length) {
		return sanitizeSlug(pathSegments[0]);
	}
	return 'misc';
}
function getFilePurposeName(relativeFilePath) {
	const unixPath = pathToUnix(relativeFilePath);
	const trimmedPath = unixPath.replace(/\.[^.]+$/, '');
	const segments = trimmedPath.split('/').filter(Boolean);
	const tailSize = Math.min(3, segments.length);
	const tailSegments = segments.slice(segments.length - tailSize);
	return sanitizeSlug(tailSegments.join('-'));
}
function buildLineStarts(sourceText) {
	const lineStarts = [0];
	for (let charIndex = 0; charIndex < sourceText.length; charIndex += 1) {
		if (sourceText.charCodeAt(charIndex) === 10) {
			lineStarts.push(charIndex + 1);
		}
	}
	return lineStarts;
}
function getLineNumber(lineStarts, targetIndex) {
	let lowIndex = 0;
	let highIndex = lineStarts.length - 1;
	while (lowIndex <= highIndex) {
		const middleIndex = (lowIndex + highIndex) >> 1;
		const middleValue = lineStarts[middleIndex];
		if (middleValue === targetIndex) {
			return middleIndex + 1;
		}
		if (middleValue < targetIndex) {
			lowIndex = middleIndex + 1;
			continue;
		}
		highIndex = middleIndex - 1;
	}
	return highIndex + 1;
}
function findMatchingBrace(sourceText, openBraceIndex) {
	let braceDepth = 0;
	let inSingleQuote = false;
	let inDoubleQuote = false;
	let inTemplateQuote = false;
	let inLineComment = false;
	let inBlockComment = false;
	let isEscaped = false;
	for (let scanIndex = openBraceIndex; scanIndex < sourceText.length; scanIndex += 1) {
		const currentChar = sourceText[scanIndex];
		const nextChar = sourceText[scanIndex + 1];
		if (inLineComment) {
			if (currentChar === '\n') {
				inLineComment = false;
			}
			continue;
		}
		if (inBlockComment) {
			if (currentChar === '*' && nextChar === '/') {
				inBlockComment = false;
				scanIndex += 1;
			}
			continue;
		}
		if (inSingleQuote) {
			if (isEscaped) {
				isEscaped = false;
				continue;
			}
			if (currentChar === '\\') {
				isEscaped = true;
				continue;
			}
			if (currentChar === '\'') {
				inSingleQuote = false;
			}
			continue;
		}
		if (inDoubleQuote) {
			if (isEscaped) {
				isEscaped = false;
				continue;
			}
			if (currentChar === '\\') {
				isEscaped = true;
				continue;
			}
			if (currentChar === '"') {
				inDoubleQuote = false;
			}
			continue;
		}
		if (inTemplateQuote) {
			if (isEscaped) {
				isEscaped = false;
				continue;
			}
			if (currentChar === '\\') {
				isEscaped = true;
				continue;
			}
			if (currentChar === '`') {
				inTemplateQuote = false;
			}
			continue;
		}
		if (currentChar === '/' && nextChar === '/') {
			inLineComment = true;
			scanIndex += 1;
			continue;
		}
		if (currentChar === '/' && nextChar === '*') {
			inBlockComment = true;
			scanIndex += 1;
			continue;
		}
		if (currentChar === '\'') {
			inSingleQuote = true;
			continue;
		}
		if (currentChar === '"') {
			inDoubleQuote = true;
			continue;
		}
		if (currentChar === '`') {
			inTemplateQuote = true;
			continue;
		}
		if (currentChar === '{') {
			braceDepth += 1;
			continue;
		}
		if (currentChar === '}') {
			braceDepth -= 1;
			if (braceDepth === 0) {
				return scanIndex;
			}
		}
	}
	return -1;
}
function parseMethodSignature(signatureText) {
	const compactSignature = signatureText.replace(/\s+/g, ' ').trim();
	if (!compactSignature || !compactSignature.endsWith(')')) {
		return null;
	}
	if (compactSignature.includes('=')) {
		return null;
	}
	const parenIndex = compactSignature.indexOf('(');
	if (parenIndex < 1) {
		return null;
	}
	const headerText = compactSignature.slice(0, parenIndex).trim();
	const paramsText = compactSignature.slice(parenIndex + 1, compactSignature.length - 1).trim();
	if (!headerText || headerText.includes('[') || headerText.includes(']')) {
		return null;
	}
	const headerTokens = headerText.split(' ').filter(Boolean);
	if (!headerTokens.length) {
		return null;
	}
	const methodName = headerTokens[headerTokens.length - 1];
	if (!validMethodNamePattern.test(methodName)) {
		return null;
	}
	if (methodName === 'if' || methodName === 'for' || methodName === 'while' || methodName === 'switch' || methodName === 'catch' || methodName === 'return') {
		return null;
	}
	let isStatic = false;
	let isAsync = false;
	let methodKind = 'method';
	for (let tokenIndex = 0; tokenIndex < headerTokens.length - 1; tokenIndex += 1) {
		const tokenValue = headerTokens[tokenIndex];
		if (tokenValue === 'static') {
			isStatic = true;
			continue;
		}
		if (tokenValue === 'async') {
			isAsync = true;
			continue;
		}
		if (tokenValue === 'get' || tokenValue === 'set') {
			methodKind = tokenValue;
			continue;
		}
		return null;
	}
	return {
		name: methodName,
		params: paramsText,
		isStatic,
		isAsync,
		kind: methodKind,
	};
}
function parseMethodsFromBody(classBodyText) {
	const methodList = [];
	let memberStart = 0;
	let scanIndex = 0;
	let braceDepth = 0;
	let inSingleQuote = false;
	let inDoubleQuote = false;
	let inTemplateQuote = false;
	let inLineComment = false;
	let inBlockComment = false;
	let isEscaped = false;
	while (scanIndex < classBodyText.length) {
		const currentChar = classBodyText[scanIndex];
		const nextChar = classBodyText[scanIndex + 1];
		if (inLineComment) {
			if (currentChar === '\n') {
				inLineComment = false;
			}
			scanIndex += 1;
			continue;
		}
		if (inBlockComment) {
			if (currentChar === '*' && nextChar === '/') {
				inBlockComment = false;
				scanIndex += 2;
				continue;
			}
			scanIndex += 1;
			continue;
		}
		if (inSingleQuote) {
			if (isEscaped) {
				isEscaped = false;
				scanIndex += 1;
				continue;
			}
			if (currentChar === '\\') {
				isEscaped = true;
				scanIndex += 1;
				continue;
			}
			if (currentChar === '\'') {
				inSingleQuote = false;
			}
			scanIndex += 1;
			continue;
		}
		if (inDoubleQuote) {
			if (isEscaped) {
				isEscaped = false;
				scanIndex += 1;
				continue;
			}
			if (currentChar === '\\') {
				isEscaped = true;
				scanIndex += 1;
				continue;
			}
			if (currentChar === '"') {
				inDoubleQuote = false;
			}
			scanIndex += 1;
			continue;
		}
		if (inTemplateQuote) {
			if (isEscaped) {
				isEscaped = false;
				scanIndex += 1;
				continue;
			}
			if (currentChar === '\\') {
				isEscaped = true;
				scanIndex += 1;
				continue;
			}
			if (currentChar === '`') {
				inTemplateQuote = false;
			}
			scanIndex += 1;
			continue;
		}
		if (currentChar === '/' && nextChar === '/') {
			inLineComment = true;
			scanIndex += 2;
			continue;
		}
		if (currentChar === '/' && nextChar === '*') {
			inBlockComment = true;
			scanIndex += 2;
			continue;
		}
		if (currentChar === '\'') {
			inSingleQuote = true;
			scanIndex += 1;
			continue;
		}
		if (currentChar === '"') {
			inDoubleQuote = true;
			scanIndex += 1;
			continue;
		}
		if (currentChar === '`') {
			inTemplateQuote = true;
			scanIndex += 1;
			continue;
		}
		if (currentChar === ';' && braceDepth === 0) {
			memberStart = scanIndex + 1;
			scanIndex += 1;
			continue;
		}
		if (currentChar === '{') {
			if (braceDepth === 0) {
				const signatureText = classBodyText.slice(memberStart, scanIndex).trim();
				const methodMeta = parseMethodSignature(signatureText);
				if (methodMeta) {
					methodList.push(methodMeta);
				}
			}
			braceDepth += 1;
			scanIndex += 1;
			continue;
		}
		if (currentChar === '}') {
			if (braceDepth > 0) {
				braceDepth -= 1;
				if (braceDepth === 0) {
					memberStart = scanIndex + 1;
				}
			}
			scanIndex += 1;
			continue;
		}
		scanIndex += 1;
	}
	return methodList;
}
function getExtendsName(extendsRaw) {
	if (!extendsRaw) {
		return '';
	}
	const tokenList = String(extendsRaw).match(/[A-Za-z][A-Za-z0-9]*/g) || [];
	if (!tokenList.length) {
		return '';
	}
	return tokenList[tokenList.length - 1];
}
function parseFileImports(sourceText) {
	const importsByLocal = new Map();
	const namespacePattern = /import\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\s+['"]([^'"]+)['"]/g;
	let nsMatch = namespacePattern.exec(sourceText);
	while (nsMatch) {
		importsByLocal.set(nsMatch[1], {
			kind: 'namespace',
			source: nsMatch[2],
		});
		nsMatch = namespacePattern.exec(sourceText);
	}
	const namedPattern = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
	let namedMatch = namedPattern.exec(sourceText);
	while (namedMatch) {
		const itemList = namedMatch[1].split(',').map((rawItem) => {
			return rawItem.trim();
		}).filter(Boolean);
		for (let itemIndex = 0; itemIndex < itemList.length; itemIndex += 1) {
			const aliasParts = itemList[itemIndex].split(/\s+as\s+/).map((part) => {
				return part.trim();
			});
			const originalName = aliasParts[0];
			const localName = aliasParts[1] ?? originalName;
			importsByLocal.set(localName, {
				kind: 'named',
				source: namedMatch[2],
				importedName: originalName,
			});
		}
		namedMatch = namedPattern.exec(sourceText);
	}
	return importsByLocal;
}
function parseFileExports(sourceText) {
	const exportList = [];
	const seenNames = new Set();
	const addExport = (name, kind, isAsync, params) => {
		if (!name || seenNames.has(name)) {
			return;
		}
		seenNames.add(name);
		exportList.push({
			name,
			kind,
			isAsync: isAsync === true,
			params: params ?? '',
		});
	};
	const fnPattern = /export\s+(async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/g;
	let fnMatch = fnPattern.exec(sourceText);
	while (fnMatch) {
		addExport(fnMatch[2], 'function', Boolean(fnMatch[1]), fnMatch[3].trim());
		fnMatch = fnPattern.exec(sourceText);
	}
	const constPattern = /export\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g;
	let constMatch = constPattern.exec(sourceText);
	while (constMatch) {
		addExport(constMatch[1], 'binding', false);
		constMatch = constPattern.exec(sourceText);
	}
	const classExportPattern = /export\s+(?:default\s+)?class\s+([A-Za-z_$][\w$]*)/g;
	let classMatch = classExportPattern.exec(sourceText);
	while (classMatch) {
		addExport(classMatch[1], 'class', false);
		classMatch = classExportPattern.exec(sourceText);
	}
	const reExportPattern = /export\s+\{([^}]+)\}/g;
	let reMatch = reExportPattern.exec(sourceText);
	while (reMatch) {
		const itemList = reMatch[1].split(',').map((rawItem) => {
			return rawItem.trim();
		}).filter(Boolean);
		for (let itemIndex = 0; itemIndex < itemList.length; itemIndex += 1) {
			const aliasParts = itemList[itemIndex].split(/\s+as\s+/).map((part) => {
				return part.trim();
			});
			const exportedName = aliasParts[1] ?? aliasParts[0];
			addExport(exportedName, 'binding', false);
		}
		reMatch = reExportPattern.exec(sourceText);
	}
	return exportList;
}
function splitTopLevelArgs(argsText) {
	const args = [];
	let depth = 0;
	let inSingle = false;
	let inDouble = false;
	let inTemplate = false;
	let isEscaped = false;
	let buffer = '';
	for (let scanIndex = 0; scanIndex < argsText.length; scanIndex += 1) {
		const currentChar = argsText[scanIndex];
		if (isEscaped) {
			buffer += currentChar;
			isEscaped = false;
			continue;
		}
		if (currentChar === '\\' && (inSingle || inDouble || inTemplate)) {
			buffer += currentChar;
			isEscaped = true;
			continue;
		}
		if (inSingle) {
			buffer += currentChar;
			if (currentChar === '\'') {
				inSingle = false;
			}
			continue;
		}
		if (inDouble) {
			buffer += currentChar;
			if (currentChar === '"') {
				inDouble = false;
			}
			continue;
		}
		if (inTemplate) {
			buffer += currentChar;
			if (currentChar === '`') {
				inTemplate = false;
			}
			continue;
		}
		if (currentChar === '\'') {
			inSingle = true;
			buffer += currentChar;
			continue;
		}
		if (currentChar === '"') {
			inDouble = true;
			buffer += currentChar;
			continue;
		}
		if (currentChar === '`') {
			inTemplate = true;
			buffer += currentChar;
			continue;
		}
		if (currentChar === '(' || currentChar === '{' || currentChar === '[') {
			depth += 1;
			buffer += currentChar;
			continue;
		}
		if (currentChar === ')' || currentChar === '}' || currentChar === ']') {
			depth -= 1;
			buffer += currentChar;
			continue;
		}
		if (currentChar === ',' && depth === 0) {
			const trimmedArg = buffer.trim();
			if (trimmedArg) {
				args.push(trimmedArg);
			}
			buffer = '';
			continue;
		}
		buffer += currentChar;
	}
	const finalArg = buffer.trim();
	if (finalArg) {
		args.push(finalArg);
	}
	return args;
}
function parseObjectLiteralKeys(objectBodyText) {
	const propertyList = splitTopLevelArgs(objectBodyText);
	const keyList = [];
	for (let itemIndex = 0; itemIndex < propertyList.length; itemIndex += 1) {
		const trimmedProperty = propertyList[itemIndex];
		if (!trimmedProperty || trimmedProperty.startsWith('...')) {
			continue;
		}
		const keyMatch = trimmedProperty.match(/^(?:async\s+|get\s+|set\s+)?([A-Za-z_$][\w$]*)/);
		if (keyMatch) {
			keyList.push(keyMatch[1]);
		}
	}
	return keyList;
}
function findLocalConstObjectBody(sourceText, constName) {
	const escapedName = constName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const pattern = new RegExp(`(?:^|[\\s;])(?:const|let|var)\\s+${escapedName}\\s*=\\s*\\{`, 'm');
	const headerMatch = pattern.exec(sourceText);
	if (!headerMatch) {
		return null;
	}
	const openIdx = headerMatch.index + headerMatch[0].length - 1;
	const closeIdx = findMatchingBrace(sourceText, openIdx);
	if (closeIdx < 0) {
		return null;
	}
	return sourceText.slice(openIdx + 1, closeIdx);
}
function findPrototypeMixinCalls(sourceText, className) {
	const callList = [];
	const escapedName = className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const assignPattern = new RegExp(`(?:^|[\\s;=({,])(?:Object\\.)?assign\\s*\\(\\s*${escapedName}\\.prototype\\s*,`, 'g');
	let assignMatch = assignPattern.exec(sourceText);
	while (assignMatch) {
		const commaIdx = assignMatch.index + assignMatch[0].length - 1;
		const argsEnd = findMatchingParenForCall(sourceText, commaIdx);
		if (argsEnd > commaIdx) {
			const argsText = sourceText.slice(commaIdx + 1, argsEnd);
			callList.push({
				kind: 'assign',
				args: splitTopLevelArgs(argsText),
			});
		}
		assignPattern.lastIndex = commaIdx + 1;
		assignMatch = assignPattern.exec(sourceText);
	}
	const definePattern = new RegExp(`(?:^|[\\s;=({,])Object\\.defineProperties\\s*\\(\\s*${escapedName}\\.prototype\\s*,`, 'g');
	let defineMatch = definePattern.exec(sourceText);
	while (defineMatch) {
		const commaIdx = defineMatch.index + defineMatch[0].length - 1;
		const argsEnd = findMatchingParenForCall(sourceText, commaIdx);
		if (argsEnd > commaIdx) {
			const argsText = sourceText.slice(commaIdx + 1, argsEnd);
			callList.push({
				kind: 'defineProperties',
				args: splitTopLevelArgs(argsText),
			});
		}
		definePattern.lastIndex = commaIdx + 1;
		defineMatch = definePattern.exec(sourceText);
	}
	return callList;
}
function findMatchingParenForCall(sourceText, commaIdx) {
	let depth = 1;
	let inSingle = false;
	let inDouble = false;
	let inTemplate = false;
	let inLineComment = false;
	let inBlockComment = false;
	let isEscaped = false;
	for (let scanIndex = commaIdx + 1; scanIndex < sourceText.length; scanIndex += 1) {
		const currentChar = sourceText[scanIndex];
		const nextChar = sourceText[scanIndex + 1];
		if (inLineComment) {
			if (currentChar === '\n') {
				inLineComment = false;
			}
			continue;
		}
		if (inBlockComment) {
			if (currentChar === '*' && nextChar === '/') {
				inBlockComment = false;
				scanIndex += 1;
			}
			continue;
		}
		if (isEscaped) {
			isEscaped = false;
			continue;
		}
		if (currentChar === '\\' && (inSingle || inDouble || inTemplate)) {
			isEscaped = true;
			continue;
		}
		if (inSingle) {
			if (currentChar === '\'') {
				inSingle = false;
			}
			continue;
		}
		if (inDouble) {
			if (currentChar === '"') {
				inDouble = false;
			}
			continue;
		}
		if (inTemplate) {
			if (currentChar === '`') {
				inTemplate = false;
			}
			continue;
		}
		if (currentChar === '/' && nextChar === '/') {
			inLineComment = true;
			scanIndex += 1;
			continue;
		}
		if (currentChar === '/' && nextChar === '*') {
			inBlockComment = true;
			scanIndex += 1;
			continue;
		}
		if (currentChar === '\'') {
			inSingle = true;
			continue;
		}
		if (currentChar === '"') {
			inDouble = true;
			continue;
		}
		if (currentChar === '`') {
			inTemplate = true;
			continue;
		}
		if (currentChar === '(') {
			depth += 1;
			continue;
		}
		if (currentChar === ')') {
			depth -= 1;
			if (depth === 0) {
				return scanIndex;
			}
		}
	}
	return -1;
}
function resolveRelativeImport(currentAbsoluteFilePath, importSource) {
	if (!importSource || importSource[0] !== '.') {
		return null;
	}
	const baseDir = path.dirname(currentAbsoluteFilePath);
	return path.resolve(baseDir, importSource);
}
function parseClassesFromFile(sourceText, relativeFilePath) {
	const classList = [];
	const lineStarts = buildLineStarts(sourceText);
	const classPattern = /(^|[\s;])(?:(export)\s+(?:default\s+)?)?class\s+([A-Za-z][A-Za-z0-9]*)\s*(?:extends\s+([^\n{]+))?\s*\{/gm;
	let patternMatch = classPattern.exec(sourceText);
	while (patternMatch) {
		const className = patternMatch[3];
		const extendsRaw = (patternMatch[4] || '').trim();
		const openBraceIndex = classPattern.lastIndex - 1;
		const closeBraceIndex = findMatchingBrace(sourceText, openBraceIndex);
		if (closeBraceIndex < 0) {
			patternMatch = classPattern.exec(sourceText);
			continue;
		}
		const classBodyText = sourceText.slice(openBraceIndex + 1, closeBraceIndex);
		const methodList = parseMethodsFromBody(classBodyText);
		let staticMethodCount = 0;
		let asyncMethodCount = 0;
		for (let methodIndex = 0; methodIndex < methodList.length; methodIndex += 1) {
			if (methodList[methodIndex].isStatic) {
				staticMethodCount += 1;
			}
			if (methodList[methodIndex].isAsync) {
				asyncMethodCount += 1;
			}
		}
		const classTokenIndex = sourceText.lastIndexOf('class', openBraceIndex);
		const lineNumber = getLineNumber(lineStarts, classTokenIndex >= 0 ? classTokenIndex : openBraceIndex);
		const uniqueId = `${pathToUnix(relativeFilePath)}:${lineNumber}:${className}`;
		classList.push({
			uniqueId,
			name: className,
			exported: patternMatch[2] === 'export',
			extendsRaw,
			extendsName: getExtendsName(extendsRaw),
			methodList,
			methodCount: methodList.length,
			staticMethodCount,
			asyncMethodCount,
			lineNumber,
			relativeFilePath: pathToUnix(relativeFilePath),
			purpose: getPurposeFolder(relativeFilePath),
		});
		patternMatch = classPattern.exec(sourceText);
	}
	return classList;
}
function scoreClassImportance(classMeta) {
	let scoreValue = 0;
	if (classMeta.exported) {
		scoreValue += 3;
	}
	if (classMeta.extendsName) {
		scoreValue += 2;
	}
	if (classMeta.methodCount >= 5) {
		scoreValue += 2;
	}
	if (classMeta.methodCount >= 10) {
		scoreValue += 1;
	}
	if (classMeta.staticMethodCount >= 2) {
		scoreValue += 1;
	}
	if (classMeta.purpose === 'core' || classMeta.purpose === 'components' || classMeta.purpose === 'services' || classMeta.purpose === 'viat' || classMeta.purpose === 'udsp') {
		scoreValue += 1;
	}
	return scoreValue;
}
function getNameFamilyKey(className) {
	const cleanName = String(className || '').toLowerCase();
	const withoutSuffix = cleanName.replace(/(base|component|controller|manager|service|client|server|model|store|factory|helper|util|core)$/, '');
	if (withoutSuffix.length >= 4) {
		return withoutSuffix;
	}
	return cleanName;
}
function buildSimilarNamesMap(classList) {
	const similarNamesMap = new Map();
	const namesByLower = new Map();
	const namesByFamily = new Map();
	for (let classIndex = 0; classIndex < classList.length; classIndex += 1) {
		const className = classList[classIndex].name;
		if (!similarNamesMap.has(className)) {
			similarNamesMap.set(className, new Set());
		}
		const lowerName = className.toLowerCase();
		if (!namesByLower.has(lowerName)) {
			namesByLower.set(lowerName, []);
		}
		namesByLower.get(lowerName).push(className);
		const familyKey = getNameFamilyKey(className);
		if (!namesByFamily.has(familyKey)) {
			namesByFamily.set(familyKey, []);
		}
		namesByFamily.get(familyKey).push(className);
	}
	const lowerValues = Array.from(namesByLower.values());
	for (let lowerIndex = 0; lowerIndex < lowerValues.length; lowerIndex += 1) {
		const nameList = lowerValues[lowerIndex];
		if (nameList.length < 2) {
			continue;
		}
		for (let leftIndex = 0; leftIndex < nameList.length; leftIndex += 1) {
			for (let rightIndex = 0; rightIndex < nameList.length; rightIndex += 1) {
				if (leftIndex === rightIndex) {
					continue;
				}
				similarNamesMap.get(nameList[leftIndex]).add(nameList[rightIndex]);
			}
		}
	}
	const familyValues = Array.from(namesByFamily.values());
	for (let familyIndex = 0; familyIndex < familyValues.length; familyIndex += 1) {
		const nameList = familyValues[familyIndex];
		if (nameList.length < 2) {
			continue;
		}
		for (let leftIndex = 0; leftIndex < nameList.length; leftIndex += 1) {
			for (let rightIndex = 0; rightIndex < nameList.length; rightIndex += 1) {
				if (leftIndex === rightIndex) {
					continue;
				}
				similarNamesMap.get(nameList[leftIndex]).add(nameList[rightIndex]);
			}
		}
	}
	return similarNamesMap;
}
function buildClassMaps(classList) {
	const classesByName = new Map();
	const classCountByLowerName = new Map();
	for (let classIndex = 0; classIndex < classList.length; classIndex += 1) {
		const classMeta = classList[classIndex];
		if (!classesByName.has(classMeta.name)) {
			classesByName.set(classMeta.name, []);
		}
		classesByName.get(classMeta.name).push(classMeta);
		const lowerName = classMeta.name.toLowerCase();
		classCountByLowerName.set(lowerName, (classCountByLowerName.get(lowerName) || 0) + 1);
	}
	return {
		classesByName,
		classCountByLowerName,
	};
}
function computeExtendDepth(classMeta, classesByName, depthMemo, seenSet) {
	if (depthMemo.has(classMeta.uniqueId)) {
		return depthMemo.get(classMeta.uniqueId);
	}
	if (!classMeta.extendsName) {
		depthMemo.set(classMeta.uniqueId, 0);
		return 0;
	}
	if (seenSet.has(classMeta.uniqueId)) {
		return 0;
	}
	seenSet.add(classMeta.uniqueId);
	const parentList = classesByName.get(classMeta.extendsName);
	if (!parentList || !parentList.length) {
		seenSet.delete(classMeta.uniqueId);
		depthMemo.set(classMeta.uniqueId, 1);
		return 1;
	}
	let bestParentDepth = 0;
	for (let parentIndex = 0; parentIndex < parentList.length; parentIndex += 1) {
		const parentDepth = computeExtendDepth(parentList[parentIndex], classesByName, depthMemo, seenSet);
		if (parentDepth > bestParentDepth) {
			bestParentDepth = parentDepth;
		}
	}
	seenSet.delete(classMeta.uniqueId);
	const totalDepth = 1 + bestParentDepth;
	depthMemo.set(classMeta.uniqueId, totalDepth);
	return totalDepth;
}
function markComplexity(classList) {
	const similarNamesMap = buildSimilarNamesMap(classList);
	const mapPack = buildClassMaps(classList);
	const depthMemo = new Map();
	for (let classIndex = 0; classIndex < classList.length; classIndex += 1) {
		const classMeta = classList[classIndex];
		const lowerName = classMeta.name.toLowerCase();
		const sameNameCount = mapPack.classCountByLowerName.get(lowerName) || 0;
		const extendDepth = computeExtendDepth(classMeta, mapPack.classesByName, depthMemo, new Set());
		const similarNameSet = similarNamesMap.get(classMeta.name) || new Set();
		const reasonList = [];
		if (extendDepth >= 2) {
			reasonList.push('manyExtends');
		}
		if (classMeta.methodCount >= 16) {
			reasonList.push('manyMethods');
		}
		if (sameNameCount > 1) {
			reasonList.push('nameCollision');
		}
		if (similarNameSet.size > 0) {
			reasonList.push('nameSimilarity');
		}
		classMeta.extendDepth = extendDepth;
		classMeta.similarNames = Array.from(similarNameSet).sort();
		classMeta.complexReasons = reasonList;
		classMeta.isComplex = reasonList.length > 0;
	}
}
async function collectJavaScriptFiles(sourcePath) {
	const fileList = [];
	const folderQueue = [sourcePath];
	for (let queueIndex = 0; queueIndex < folderQueue.length; queueIndex += 1) {
		const currentFolder = folderQueue[queueIndex];
		let entries = [];
		try {
			entries = await fileSystem.readdir(currentFolder, {
				withFileTypes: true,
			});
		} catch (readError) {
			continue;
		}
		for (let entryIndex = 0; entryIndex < entries.length; entryIndex += 1) {
			const entryMeta = entries[entryIndex];
			const entryPath = path.join(currentFolder, entryMeta.name);
			if (entryMeta.isDirectory()) {
				if (ignoreFolderSet.has(entryMeta.name)) {
					continue;
				}
				folderQueue.push(entryPath);
				continue;
			}
			if (!entryMeta.isFile()) {
				continue;
			}
			const extensionName = path.extname(entryMeta.name).toLowerCase();
			if (!validExtensionSet.has(extensionName)) {
				continue;
			}
			fileList.push(entryPath);
		}
	}
	return fileList;
}
async function readClassIndex(classFileList, sourcePath) {
	const classList = [];
	const fileDataByAbsolutePath = new Map();
	for (let fileIndex = 0; fileIndex < classFileList.length; fileIndex += 1) {
		const absoluteFilePath = classFileList[fileIndex];
		let fileText = '';
		try {
			fileText = await fileSystem.readFile(absoluteFilePath, 'utf8');
		} catch (readError) {
			continue;
		}
		const relativeFilePath = path.relative(sourcePath, absoluteFilePath);
		const importsByLocal = parseFileImports(fileText);
		const exportList = parseFileExports(fileText);
		fileDataByAbsolutePath.set(absoluteFilePath, {
			absolutePath: absoluteFilePath,
			source: fileText,
			importsByLocal,
			exportList,
		});
		const discoveredClasses = parseClassesFromFile(fileText, relativeFilePath);
		for (let classIndex = 0; classIndex < discoveredClasses.length; classIndex += 1) {
			const classMeta = discoveredClasses[classIndex];
			classMeta.absoluteFilePath = absoluteFilePath;
			classList.push(classMeta);
		}
	}
	return {
		classList,
		fileDataByAbsolutePath,
	};
}
function collectPrototypeMixins(classMeta, fileDataByAbsolutePath) {
	const fileData = fileDataByAbsolutePath.get(classMeta.absoluteFilePath);
	if (!fileData) {
		return [];
	}
	const mixinCallList = findPrototypeMixinCalls(fileData.source, classMeta.name);
	if (!mixinCallList.length) {
		return [];
	}
	const mixinMethodList = [];
	const seenMethodNames = new Set();
	const addMethod = (name, kind, isAsync, params, sourceLabel, viaLabel) => {
		if (!name || seenMethodNames.has(name)) {
			return;
		}
		seenMethodNames.add(name);
		mixinMethodList.push({
			name,
			kind,
			isAsync: isAsync === true,
			params: params ?? '',
			source: sourceLabel,
			via: viaLabel,
		});
	};
	for (let callIndex = 0; callIndex < mixinCallList.length; callIndex += 1) {
		const call = mixinCallList[callIndex];
		for (let argIndex = 0; argIndex < call.args.length; argIndex += 1) {
			const argText = call.args[argIndex];
			if (!argText) {
				continue;
			}
			const methodKind = call.kind === 'defineProperties' ? 'get' : 'method';
			if (argText[0] === '{') {
				const keyList = parseObjectLiteralKeys(argText.slice(1, argText.length - 1));
				for (let keyIndex = 0; keyIndex < keyList.length; keyIndex += 1) {
					addMethod(keyList[keyIndex], methodKind, false, '', classMeta.relativeFilePath, '(inline)');
				}
				continue;
			}
			const importInfo = fileData.importsByLocal.get(argText);
			if (importInfo && importInfo.source) {
				const targetAbsolutePath = resolveImportTarget(classMeta.absoluteFilePath, importInfo.source, fileDataByAbsolutePath);
				if (!targetAbsolutePath) {
					continue;
				}
				const targetData = fileDataByAbsolutePath.get(targetAbsolutePath);
				if (!targetData) {
					continue;
				}
				if (importInfo.kind === 'namespace') {
					for (let exportIndex = 0; exportIndex < targetData.exportList.length; exportIndex += 1) {
						const exportEntry = targetData.exportList[exportIndex];
						if (exportEntry.kind !== 'function' && exportEntry.kind !== 'binding') {
							continue;
						}
						addMethod(exportEntry.name, methodKind, exportEntry.isAsync, exportEntry.params, importInfo.source, argText);
					}
					continue;
				}
				if (importInfo.kind === 'named') {
					const sourceName = importInfo.importedName ?? argText;
					const constBody = findLocalConstObjectBody(targetData.source, sourceName);
					if (constBody !== null) {
						const keyList = parseObjectLiteralKeys(constBody);
						for (let keyIndex = 0; keyIndex < keyList.length; keyIndex += 1) {
							addMethod(keyList[keyIndex], methodKind, false, '', importInfo.source, argText);
						}
					}
					continue;
				}
			}
			const localConstBody = findLocalConstObjectBody(fileData.source, argText);
			if (localConstBody !== null) {
				const keyList = parseObjectLiteralKeys(localConstBody);
				for (let keyIndex = 0; keyIndex < keyList.length; keyIndex += 1) {
					const keyName = keyList[keyIndex];
					const fwdImport = fileData.importsByLocal.get(keyName);
					let params = '';
					let isAsync = false;
					if (fwdImport && fwdImport.kind === 'named' && fwdImport.source) {
						const fwdTargetPath = resolveImportTarget(classMeta.absoluteFilePath, fwdImport.source, fileDataByAbsolutePath);
						const fwdTargetData = fwdTargetPath ? fileDataByAbsolutePath.get(fwdTargetPath) : null;
						if (fwdTargetData) {
							const fwdExport = fwdTargetData.exportList.find((entry) => {
								return entry.name === (fwdImport.importedName ?? keyName);
							});
							if (fwdExport) {
								params = fwdExport.params ?? '';
								isAsync = fwdExport.isAsync === true;
							}
						}
					}
					addMethod(keyName, methodKind, isAsync, params, classMeta.relativeFilePath, argText);
				}
			}
		}
	}
	return mixinMethodList;
}
function resolveImportTarget(currentAbsoluteFilePath, importSource, fileDataByAbsolutePath) {
	const baseTarget = resolveRelativeImport(currentAbsoluteFilePath, importSource);
	if (!baseTarget) {
		return null;
	}
	const candidates = [
		baseTarget,
		`${baseTarget}.js`,
		path.join(baseTarget, 'index.js'),
	];
	for (let candidateIndex = 0; candidateIndex < candidates.length; candidateIndex += 1) {
		if (fileDataByAbsolutePath.has(candidates[candidateIndex])) {
			return candidates[candidateIndex];
		}
	}
	return null;
}
function buildClassDocument(classMeta, generatedAt) {
	const unifiedMethods = [];
	for (let methodIndex = 0; methodIndex < classMeta.methodList.length; methodIndex += 1) {
		const declared = classMeta.methodList[methodIndex];
		unifiedMethods.push({
			name: declared.name,
			kind: declared.kind,
			params: declared.params ?? '',
			isStatic: declared.isStatic === true,
			isAsync: declared.isAsync === true,
			origin: 'declared',
			via: null,
			source: null,
		});
	}
	const mixinList = classMeta.prototypeMixins ?? [];
	let mixinAsyncCount = 0;
	for (let mixinIndex = 0; mixinIndex < mixinList.length; mixinIndex += 1) {
		const mixin = mixinList[mixinIndex];
		if (mixin.isAsync) {
			mixinAsyncCount += 1;
		}
		unifiedMethods.push({
			name: mixin.name,
			kind: mixin.kind,
			params: mixin.params ?? '',
			isStatic: false,
			isAsync: mixin.isAsync === true,
			origin: 'prototype-mixin',
			via: mixin.via,
			source: mixin.source,
		});
	}
	return {
		className: classMeta.name,
		purpose: classMeta.purpose,
		sourcePath: classMeta.relativeFilePath,
		sourceLine: classMeta.lineNumber,
		exported: classMeta.exported,
		extends: {
			raw: classMeta.extendsRaw || null,
			name: classMeta.extendsName || null,
			depth: classMeta.extendDepth,
		},
		importanceScore: classMeta.importanceScore,
		metrics: {
			methodCount: unifiedMethods.length,
			declaredMethodCount: classMeta.methodCount,
			prototypeMixinMethodCount: mixinList.length,
			staticMethodCount: classMeta.staticMethodCount,
			asyncMethodCount: classMeta.asyncMethodCount + mixinAsyncCount,
		},
		complexity: {
			isComplex: classMeta.isComplex,
			reasons: classMeta.complexReasons,
		},
		similarNames: classMeta.similarNames,
		methods: unifiedMethods,
		generatedAt,
	};
}
function sortClasses(classList) {
	classList.sort((leftClass, rightClass) => {
		if (leftClass.purpose < rightClass.purpose) {
			return -1;
		}
		if (leftClass.purpose > rightClass.purpose) {
			return 1;
		}
		if (leftClass.name < rightClass.name) {
			return -1;
		}
		if (leftClass.name > rightClass.name) {
			return 1;
		}
		if (leftClass.relativeFilePath < rightClass.relativeFilePath) {
			return -1;
		}
		if (leftClass.relativeFilePath > rightClass.relativeFilePath) {
			return 1;
		}
		return leftClass.lineNumber - rightClass.lineNumber;
	});
}
async function writeClassDocs(classList, outputPath, sourcePath, scannedFileCount, discoveredClassCount) {
	const generatedAt = new Date().toISOString();
	await fileSystem.rm(outputPath, {
		recursive: true,
		force: true,
	});
	await fileSystem.mkdir(outputPath, {
		recursive: true,
	});
	const lowerNameCount = new Map();
	for (let classIndex = 0; classIndex < classList.length; classIndex += 1) {
		const lowerName = classList[classIndex].name.toLowerCase();
		lowerNameCount.set(lowerName, (lowerNameCount.get(lowerName) || 0) + 1);
	}
	const groupMap = new Map();
	let complexCount = 0;
	for (let classIndex = 0; classIndex < classList.length; classIndex += 1) {
		const classMeta = classList[classIndex];
		if (classMeta.isComplex) {
			complexCount += 1;
		}
		const safeClassName = sanitizeName(classMeta.name);
		const sameNameCount = lowerNameCount.get(classMeta.name.toLowerCase()) || 0;
		const targetFolder = path.join(outputPath, safeClassName);
		await fileSystem.mkdir(targetFolder, {
			recursive: true,
		});
		let fileNameCore = safeClassName;
		if (sameNameCount > 1) {
			fileNameCore = `${safeClassName}-${getFilePurposeName(classMeta.relativeFilePath)}`;
		}
		const targetFilePath = path.join(targetFolder, `${fileNameCore}.json`);
		const docData = buildClassDocument(classMeta, generatedAt);
		await fileSystem.writeFile(targetFilePath, `${JSON.stringify(docData, null, 2)}\n`, 'utf8');
		const docPath = pathToUnix(path.relative(sourcePath, targetFilePath));
		const classRef = {
			className: classMeta.name,
			purpose: classMeta.purpose,
			sourcePath: classMeta.relativeFilePath,
			docPath,
			isComplex: classMeta.isComplex,
			importanceScore: classMeta.importanceScore,
		};
		if (!groupMap.has(classMeta.purpose)) {
			groupMap.set(classMeta.purpose, []);
		}
		groupMap.get(classMeta.purpose).push(classRef);
	}
	const groups = [];
	const groupKeys = Array.from(groupMap.keys()).sort();
	for (let groupIndex = 0; groupIndex < groupKeys.length; groupIndex += 1) {
		const groupName = groupKeys[groupIndex];
		const groupClasses = groupMap.get(groupName) || [];
		groups.push({
			purpose: groupName,
			count: groupClasses.length,
			classes: groupClasses,
		});
	}
	const summaryDoc = {
		generatedAt,
		sourcePath: pathToUnix(path.relative(sourcePath, sourcePath) || '.'),
		outputPath: pathToUnix(path.relative(sourcePath, outputPath)),
		totals: {
			scannedFileCount,
			discoveredClassCount,
			importantClassCount: classList.length,
			complexClassCount: complexCount,
			groupCount: groups.length,
		},
		groups,
	};
	const summaryPath = path.join(outputPath, 'classIndex.json');
	await fileSystem.writeFile(summaryPath, `${JSON.stringify(summaryDoc, null, 2)}\n`, 'utf8');
	return {
		summaryPath,
		importantClassCount: classList.length,
		complexClassCount: complexCount,
		groupCount: groups.length,
	};
}
async function run() {
	const settings = parseArgs(process.argv.slice(2));
	const classFileList = await collectJavaScriptFiles(settings.sourcePath);
	const { classList: allClassList, fileDataByAbsolutePath } = await readClassIndex(classFileList, settings.sourcePath);
	for (let classIndex = 0; classIndex < allClassList.length; classIndex += 1) {
		allClassList[classIndex].prototypeMixins = collectPrototypeMixins(allClassList[classIndex], fileDataByAbsolutePath);
	}
	markComplexity(allClassList);
	for (let classIndex = 0; classIndex < allClassList.length; classIndex += 1) {
		allClassList[classIndex].importanceScore = scoreClassImportance(allClassList[classIndex]);
	}
	const importantClassList = allClassList.filter((classMeta) => {
		if (settings.classNameFilter && classMeta.name !== settings.classNameFilter) {
			return false;
		}
		if (settings.classNameFilter) {
			return true;
		}
		return classMeta.importanceScore >= settings.minimumScore;
	});
	sortClasses(importantClassList);
	const writeMeta = await writeClassDocs(
		importantClassList,
		settings.outputPath,
		settings.sourcePath,
		classFileList.length,
		allClassList.length
	);
	console.log('[classIndex] ✅ Completed');
	console.log(`[classIndex] scanned files: ${classFileList.length}`);
	console.log(`[classIndex] discovered classes: ${allClassList.length}`);
	console.log(`[classIndex] important classes: ${writeMeta.importantClassCount}`);
	console.log(`[classIndex] complex classes: ${writeMeta.complexClassCount}`);
	console.log(`[classIndex] groups: ${writeMeta.groupCount}`);
	console.log(`[classIndex] summary: ${pathToUnix(path.relative(settings.sourcePath, writeMeta.summaryPath))}`);
}
run().catch((error) => {
	console.error('[classIndex] ❌ Failed');
	console.error(error);
	process.exitCode = 1;
});
