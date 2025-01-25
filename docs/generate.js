import { read, write } from '#utilities/file';
import { currentPath } from '@universalweb/acid';
const filePath = currentPath(import.meta);
function createIndexPage(content) {
	const htmlDOC = `<!doctype html>
	<html>
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
		</head>

		<body>
			${content}
		</body>
	</html>`;
	return htmlDOC;
}
const readmeFile = await read(`${filePath}/../README.md`);
await write(`${filePath}/index.html`, createIndexPage(readmeFile));
