// installSkills.js — install every `*.SKILL.md` under `agent/docs/` into the
// two destinations the editing tools in this repo read from:
//
//   .claude/skills/<skill-name>/SKILL.md     ← Claude Code (workspace-scoped skill)
//   .github/prompts/<skill-name>.prompt.md   ← GitHub Copilot Chat (slash command)
//
// Both targets get a transformed copy of the source — frontmatter is rewritten
// to each tool's expected shape, the body is copied verbatim.
//
// Usage:
//   node ./agent/installSkills.js          // install / re-install all skills
//   node ./agent/installSkills.js --clean  // remove only the skills this script manages
//
// Re-running install is idempotent: existing target files are overwritten in place.
import fileSystem from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const scriptPath = fileURLToPath(import.meta.url);
const agentFolderPath = path.dirname(scriptPath);
const repoFolderPath = path.resolve(agentFolderPath, '..');
const skillSourceFolder = path.join(agentFolderPath, 'docs');
const claudeSkillsFolder = path.join(repoFolderPath, '.claude', 'skills');
const copilotPromptsFolder = path.join(repoFolderPath, '.github', 'prompts');
async function findSkillFiles(rootFolder) {
	const foundFiles = [];
	const folderQueue = [rootFolder];
	while (folderQueue.length) {
		const currentFolder = folderQueue.shift();
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
				folderQueue.push(entryPath);
				continue;
			}
			if (entryMeta.isFile() && entryMeta.name.endsWith('.SKILL.md')) {
				foundFiles.push(entryPath);
			}
		}
	}
	return foundFiles;
}
function parseSkillFile(rawText) {
	if (!rawText.startsWith('---')) {
		return {
			frontmatter: {},
			body: rawText,
		};
	}
	const closeIdx = rawText.indexOf('\n---', 4);
	if (closeIdx < 0) {
		return {
			frontmatter: {},
			body: rawText,
		};
	}
	const frontmatterText = rawText.slice(4, closeIdx);
	const bodyText = rawText.slice(closeIdx + 4).replace(/^\r?\n/, '');
	const frontmatter = {};
	const lineList = frontmatterText.split('\n');
	for (let lineIndex = 0; lineIndex < lineList.length; lineIndex += 1) {
		const currentLine = lineList[lineIndex];
		const colonIdx = currentLine.indexOf(':');
		if (colonIdx <= 0) {
			continue;
		}
		const key = currentLine.slice(0, colonIdx).trim();
		let value = currentLine.slice(colonIdx + 1).trim();
		if ((value.startsWith('\'') && value.endsWith('\'')) || (value.startsWith('"') && value.endsWith('"'))) {
			value = value.slice(1, -1);
		}
		frontmatter[key] = value;
	}
	return {
		frontmatter,
		body: bodyText,
	};
}
function escapeYamlSingleQuoted(rawValue) {
	return String(rawValue).replace(/'/g, '\'\'');
}
function resolveSkillName(frontmatter, sourcePath) {
	if (frontmatter.name) {
		return frontmatter.name;
	}
	const baseName = path.basename(sourcePath, '.SKILL.md');
	return baseName.toLowerCase();
}
async function writeClaudeSkill(skillName, frontmatter, body) {
	const folderPath = path.join(claudeSkillsFolder, skillName);
	await fileSystem.mkdir(folderPath, {
		recursive: true,
	});
	const filePath = path.join(folderPath, 'SKILL.md');
	const description = frontmatter.description ?? '';
	const content = `---
name: ${skillName}
description: ${description}
---

${body.trimEnd()}
`;
	await fileSystem.writeFile(filePath, content, 'utf8');
	return filePath;
}
async function writeCopilotPrompt(skillName, frontmatter, body) {
	await fileSystem.mkdir(copilotPromptsFolder, {
		recursive: true,
	});
	const filePath = path.join(copilotPromptsFolder, `${skillName}.prompt.md`);
	const description = escapeYamlSingleQuoted(frontmatter.description ?? '');
	const content = `---
description: '${description}'
mode: 'agent'
---

${body.trimEnd()}
`;
	await fileSystem.writeFile(filePath, content, 'utf8');
	return filePath;
}
async function installAll() {
	const skillFiles = await findSkillFiles(skillSourceFolder);
	if (!skillFiles.length) {
		console.log('No *.SKILL.md files found under agent/docs/. Nothing to install.');
		return;
	}
	for (let fileIndex = 0; fileIndex < skillFiles.length; fileIndex += 1) {
		const sourcePath = skillFiles[fileIndex];
		const rawText = await fileSystem.readFile(sourcePath, 'utf8');
		const parsed = parseSkillFile(rawText);
		const skillName = resolveSkillName(parsed.frontmatter, sourcePath);
		const claudePath = await writeClaudeSkill(skillName, parsed.frontmatter, parsed.body);
		const copilotPath = await writeCopilotPrompt(skillName, parsed.frontmatter, parsed.body);
		console.log(`✅ ${skillName}`);
		console.log(`   source  ${path.relative(repoFolderPath, sourcePath)}`);
		console.log(`   claude  ${path.relative(repoFolderPath, claudePath)}`);
		console.log(`   copilot ${path.relative(repoFolderPath, copilotPath)}`);
	}
	console.log(`\nInstalled ${skillFiles.length} skill(s).`);
	console.log('Claude Code: open the workspace and invoke via Skill (or the picker).');
	console.log('Copilot Chat: type `/<skill-name>` in chat (e.g. /webcomponent-authoring).');
}
async function cleanAll() {
	const skillFiles = await findSkillFiles(skillSourceFolder);
	if (!skillFiles.length) {
		console.log('No *.SKILL.md sources found. Nothing to clean.');
		return;
	}
	let removedCount = 0;
	for (let fileIndex = 0; fileIndex < skillFiles.length; fileIndex += 1) {
		const sourcePath = skillFiles[fileIndex];
		const rawText = await fileSystem.readFile(sourcePath, 'utf8');
		const parsed = parseSkillFile(rawText);
		const skillName = resolveSkillName(parsed.frontmatter, sourcePath);
		const claudeTarget = path.join(claudeSkillsFolder, skillName);
		const copilotTarget = path.join(copilotPromptsFolder, `${skillName}.prompt.md`);
		await fileSystem.rm(claudeTarget, {
			recursive: true,
			force: true,
		});
		await fileSystem.rm(copilotTarget, {
			force: true,
		});
		removedCount += 1;
		console.log(`🗑  ${skillName}`);
	}
	console.log(`\nRemoved ${removedCount} skill(s).`);
}
async function run() {
	const rawArgs = process.argv.slice(2);
	if (rawArgs.includes('--clean')) {
		await cleanAll();
		return;
	}
	await installAll();
}
run().catch((runError) => {
	console.error('[installSkills] ❌ Failed');
	console.error(runError);
	process.exitCode = 1;
});
