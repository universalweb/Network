const gulp = require('gulp');
const babel = require('gulp-babel');
const JavaScriptObfuscator = require('javascript-obfuscator');
const replace = require('gulp-replace');
const $ = require('Lucy')(this);
require(`${__dirname}/system/setup/plugin/directory`)($);
const {
	shallow,
	last,
	initialString,
	each,
	initial
} = $;
const babelOptions = {
	presets: ['babili'],
	comments: false,
	highlightCode: false,
	ast: false,
	compact: true,
	minified: true,
};
const obfuscateOptions = {
	rotateStringArray: false,
	debugProtection: true,
	debugProtectionInterval: true,
	disableConsoleOutput: true,
	selfDefending: false,
	stringArray: true,
	stringArrayEncoding: false,
	stringArrayThreshold: 1,
	domainLock: ['.Sentivateh.com', 'ws.Sentivateh.com', 'Sentivateh.com']
};
// .pipe(wrap('(async function(){\n<%= contents %>\n})();', {}, { parse: false /* do not parse the JSON file for template data */ }))
function uglifyObfuscate(path) {
	const name = initialString(path);
	const filePaths = ['!**/dead/**', '!**/broken/**', `${name}Production/filesystem/asset/**/*.js`];
	const filePathsConfig = {
		base: './'
	};
	gulp.src(filePaths, filePathsConfig)
		.pipe(replace(/\/\/<obfuscate>([^]*?)\/\/<\/obfuscate>/gm, (codeString) => {
			// console.log(codeString);
			return JavaScriptObfuscator.obfuscate(codeString, obfuscateOptions);
		}))
		.pipe(replace(/\/\*<development>\*\/([^]+)\/\*<\/development>\*\//g, ''))
		.pipe(babel(babelOptions))
		.pipe(gulp.dest('./'));
}
function productionFolder(path) {
	if (last(initial(path.split('/')))
		.includes('Production')) {
		return;
	}
	const name = initialString(path);
	gulp.src(`${path}**/*`)
		.pipe(gulp.dest(`${name}Production`))
		.on('end', () => {
			uglifyObfuscate(path);
		});
}
(async function() {
	const apps = await shallow(`${__dirname}/apps/client/`);
	console.log(apps);
	each(apps, productionFolder);
})();
