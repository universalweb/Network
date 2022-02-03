(async () => {
	import { html } from 'js/util/markdown';
	const {
		component,
		translate,
		view,
		utility: {
			assignDeep,
			cnsl
		}
	} = app;
	cnsl('page Module', 'notify');
	exports.page = function(pageModule) {
		let templateUrl;
		const config = assignDeep({
			data: {},
			partials: {},
		}, pageModule.config || {});
		const partials = config.partials;
		const data = config.data;
		config.data.language = language;
		if (language.content) {
			partials.contentPartial = html(language.content);
		} else {
			partials.contentPartial = language.content = '';
		}
		if (data.customContent) {
			partials.contentPartial = language.content + data.customContent;
		}
		if (language.custom) {
			templateUrl = 'component/page/custom';
		} else {
			templateUrl = 'component/page/template';
		}
		config.data.translate = translate;
		const OGConfig = config.data;
		config.data = function() {
			return OGConfig;
		};
		const cmpntConfig = assignDeep({
			model: pageModule,
			asset: assignDeep({
				template: templateUrl,
				css: [`${exports.dirname}style`]
			}, pageModule.asset || {}),
		}, config);
		console.log(pageModule, cmpntConfig);
		return component(cmpntConfig);
	};
	exports.open = function(pageModule) {
		view.set('pageTitle', pageModule.assets.language.pageTitle || pageModule.config.data.pageTitle);
	};
	exports.close = function() {};
	exports.compile = function(pageModule) {
		const ogOpen = pageModule.open;
		const ogClose = pageModule.close;
		pageModule.open = async (options) => {
			exports.open(pageModule, options);
			if (ogOpen) {
				await ogOpen();
			}
		};
		pageModule.close = async (options) => {
			exports.close(pageModule, options);
			if (ogClose) {
				await ogClose();
			}
		};
		return exports.page(pageModule);
	};
	app.page = exports;
})();
