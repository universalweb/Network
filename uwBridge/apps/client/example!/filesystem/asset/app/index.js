(async () => {
	const {
		demandCss,
		importComponent,
		router,
		utility: {
			cnsl,
			map
		},
	} = app;
	cnsl('App Module', 'important');
	await Ractive.sharedSet({
		loginStatus: false,
		classes: {},
		logo: {
			motto: '',
			title: 'EXAMPLE',
		},
		pageTitle: 'EXAMPLE',
	});
	await Ractive.sharedSet('moment', (item) => {
		return $.upperCase(window.moment.utc(item).fromNow());
	});
	await demandCss(map(['blotr', 'theme', 'animation'], (item) => {
		return `css/core/${item}`;
	}), {
		appendCSS: true
	});
	import { html } from 'js/util/markdown';
	import 'routes/';
	import 'app/watchers/';
	import 'js/action/login';
	console.log('APP MODULE ABOUT TO RENDER');
	await app.render();
	import 'component/base/';
	import 'component/uploadImg/';
	import 'component/slideshow/';
	import 'component/questions/';
	await importComponent('layout', 'component/layout/', 'main');
	await importComponent('navigationbar', 'component/navigationBar/');
	await importComponent('sidebar', 'component/sidebar/');
	await Ractive.sharedSet('markdownConvert', html);
	router.setup();
})();
