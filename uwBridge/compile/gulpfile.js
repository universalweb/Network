const $ = require('Lucy')();
const concat = require('gulp-concat');
const babel = require('gulp-babel');
const beautify = require('gulp-beautify');
const notify = require('gulp-notify');
const addsrc = require('gulp-add-src');
const gulp = require('gulp');
const compile = () => {
	const {
		each
	} = $;
	const dirname = __dirname.replace('/compile', '');
	const directory = $.directory;
	const appsRootLocation = `${dirname}/apps/`;
	const clientAppRootLocation = `${appsRootLocation}client/`;
	// masterAppRootLocation = `${appsRootLocation}master/`,
	const compileRootLocation = `${dirname}/Sentivate/compile/`;
	const compileDist = `${compileRootLocation}dist/`;
	const compileSource = `${compileRootLocation}source/`;
	const compileFront = `${compileSource}front/`;
	const compileSocket = `${compileSource}socket/`;
	const compileWorker = `${compileSource}worker/`;
	const getAssetAppDir = `filesystem/asset/Sentivateh/`;
	const getPublicAppDir = `filesystem/public/js/`;
	const locationsFront = {
		filename: 'Sentivateh',
		dest: getPublicAppDir,
		libs: [
			`${compileFront}libs/acid.js`,
			`${compileFront}libs/ractive.js`,
			`${compileFront}libs/ractivePlugins.js`,
		],
		core: [
			`${compileFront}core/credits/index.js`,
			`${compileFront}core/spiral/start.js`,
			`${compileFront}core/spiral/imports.js`,
			`${compileFront}core/spiral/api.js`,
			`${compileFront}core/spiral/var.js`,
			`${compileFront}core/spiral/module.js`,
			`${compileFront}core/spiral/demand.js`,
			`${compileFront}core/spiral/x.js`,
			`${compileFront}core/spiral/language.js`,
			`${compileFront}core/spiral/super.js`,
			`${compileFront}core/spiral/pipe.js`,
			`${compileFront}core/spiral/end.js`,
		],
	};
	const locationsWorker = {
		filename: 'SentivatehWorker',
		dest: getPublicAppDir,
		libs: [
			`${compileWorker}libs/pre.js`,
			`${compileWorker}libs/lucy.js`,
			`${compileWorker}libs/socketio.js`,
			`${compileWorker}libs/zip.js`,
		],
		core: [
			`${compileWorker}core/start.js`,
			`${compileWorker}core/socket.js`,
			`${compileWorker}core/core.js`,
			`${compileWorker}core/end.js`,
		],
	};
	const locationsSocket = {
		filename: 'index',
		dest: getAssetAppDir,
		libs: [],
		core: [
			`${compileSocket}core/start.js`,
			`${compileSocket}core/imports.js`,
			`${compileSocket}core/security.js`,
			`${compileSocket}core/defaultData.js`,
			`${compileSocket}core/extendRactive.js`,
			`${compileSocket}core/view.js`,
			`${compileSocket}core/component.js`,
			`${compileSocket}core/baseComponent.js`,
			`${compileSocket}core/notifications.js`,
			`${compileSocket}core/pipeEvents.js`,
			`${compileSocket}core/routerSetup.js`,
			`${compileSocket}core/resize.js`,
			`${compileSocket}core/end.js`,
		],
	};
	const setApps = async (rootObject, fileName) => {
		const apps = await directory.shallow(clientAppRootLocation);
		each(apps, (app) => {
			console.log(app);
			gulp.src(compileDist + fileName)
				.pipe(concat(fileName))
				.pipe(gulp.dest(app + rootObject.dest))
				.pipe(notify(() => {
					return `DONE ${app}${fileName}`;
				}));
		});
	};
	const beautifyOptions = {
		indent_size: 2,
		indent_char: ' ',
		indent_with_tabs: false,
	};
	const babelOptions = {
		presets: ['babili'],
		comments: false,
		highlightCode: false,
		ast: false,
		compact: true,
		minified: true,
	};
	const compileIt = function(rootObject) {
		const name = rootObject.filename;
		gulp.src(rootObject.core)
			.pipe(concat(`${name}.js`))
			.pipe(beautify(beautifyOptions))
			.pipe(addsrc.prepend(rootObject.libs))
			.pipe(concat(`${name}.js`))
			.pipe(gulp.dest(compileDist))
			.pipe(notify(() => {
				setApps(rootObject, `${name}.js`);
				return `Pretty ${name}`;
			}));
		gulp.src(rootObject.core)
			.pipe(concat(`${name}Min.js`))
			.pipe(babel(babelOptions))
			.pipe(addsrc.prepend(rootObject.libs))
			.pipe(concat(`${name}Min.js`))
			.pipe(gulp.dest(compileDist))
			.pipe(notify(() => {
				setApps(rootObject, `${name}Min.js`);
				return `Min ${name}`;
			}));
	};
	const watchLocations = function(config) {
		const locations = [];
		locations.push(...config.core);
		locations.push(...config.libs);
		gulp.watch(locations, () => {
			compileIt(config);
		});
	};
	compileIt(locationsFront);
	compileIt(locationsWorker);
	compileIt(locationsSocket);
	watchLocations(locationsFront);
	watchLocations(locationsWorker);
	watchLocations(locationsSocket);
};
gulp.task('scripts', () => {
	require('../system/setup/plugin/directory')($);
	compile();
});
gulp.task('default', ['scripts'], () => {});
