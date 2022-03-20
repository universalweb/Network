const { isFileJS, } = self.$;
const shouldNotUpgrade = /(^js\/lib\/)|(\.min\.js)/;
const importRegexGlobal = /\bimport\b([^:;=]*?){([^;]*?)}(\s\bfrom\b).*(('|"|`).*('|"|`));$/gm;
const importSingleRegexGlobal = /\bimport\b([^:;={}]*?)([^;{}]*?)(\s\bfrom\b).*(('|"|`).*('|"|`));$/gm;
const importEntire = /\bimport\b\s(('|"|`).*('|"|`));$/gm;
const importDynamic = /{([^;]*?)}\s=\simport\((('|"|`).*('|"|`))\);$/gm;
const replaceImports = function(file) {
	let compiled = file;
	const dirnameOptions = `import.meta`;
	compiled = compiled.replace(importRegexGlobal, `const {$2} = await appGlobal.demandJs($4, ${dirnameOptions});`);
	compiled = compiled.replace(importSingleRegexGlobal, `const $2 = await appGlobal.demandJs($4, ${dirnameOptions});`);
	compiled = compiled.replace(importEntire, `await appGlobal.demandJs($1, ${dirnameOptions});`);
	compiled = compiled.replace(importDynamic, `{$1} = await appGlobal.demandJs($2, ${dirnameOptions});`);
	return compiled;
};
const keepObject = {
	keep: true,
};
export const processScriptRequest = async function(contex, response, configObj, workerInfo) {
	const { body } = response;
	const {
		file,
		cs,
		cache
	} = body;
	const key = body.key;
	const fileList = configObj.fileList;
	const filepath = fileList.files[key];
	const completedFiles = configObj.completedFiles;
	const checksums = configObj.checksum;
	const isLib = shouldNotUpgrade.test(filepath);
	const isJs = isFileJS(filepath);
	if (file) {
		completedFiles[key] = file;
		checksums[key] = cs;
		configObj.filesLoaded += 1;
	} else if (file === false) {
		checksums[key] = false;
		completedFiles[key] = false;
		configObj.filesLoaded += 1;
	} else if (cache) {
		completedFiles[key] = true;
		configObj.filesLoaded += 1;
	}
	let completedFile = completedFiles[key];
	if (completedFile !== true && isJs && !isLib && completedFile !== false) {
		completedFile = replaceImports(completedFile);
	}
	const message = {
		key,
	};
	if (cs) {
		message.cs = cs;
	}
	if (completedFile) {
		message.file = completedFile;
	}
	contex.post(workerInfo.id, message, keepObject);
	if (configObj.filesLoaded === configObj.fileListLength) {
		const returned = {
			loaded: configObj.filesLoaded
		};
		return returned;
	}
	return false;
};
