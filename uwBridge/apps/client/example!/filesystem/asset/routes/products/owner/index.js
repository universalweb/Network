(async () => {
	const {
		component,
		utility: { assign },
	} = app;
	app.debug = true;
	import { eventsCompile } from 'models/universal/index.js';
	await component({
		model: exports,
		asset: {
			partials: {
				product: `models/product/list`,
				productCreateModal: `models/product/modal/create`,
				productRemoveModal: `models/product/modal/remove`,
				productsCreateModal: `models/product/modal/csvCreate`,
				batchCreateModal: `models/batch/modal/create`,
			},
			template: `models/product/template`,
			css: [`models/product/style`],
		},
		data() {
			// const source = this;
			return {};
		},
		async onrender() {
			const source = this;
			const productEvents = await eventsCompile({
				rootProp: 'product',
				type: 'product',
				rootAPI: 'product.operator',
				source,
			});
			const batchEvents = await eventsCompile({
				rootProp: 'batch',
				type: 'batch',
				rootAPI: 'batch.operator',
				source,
			});
			console.log(productEvents, batchEvents);
			// assign(source.get('product.create'), {
			// 	name: 'iPhone 13 Pro Max',
			// 	description: `The iPhone is a line of smartphones designed and marketed by Apple Inc. that use Apple's iOS mobile operating system. The first-generation iPhone was announced by then-Apple CEO Steve Jobs on January 9, 2007. Since then, Apple has annually released new iPhone models and iOS updates. As of November 1, 2018, more than 2.2 billion iPhones had been sold. https://www.apple.com`,
			// 	html: `<b>This is an HTML field</b>`,
			// 	homepage: `https://www.apple.com/iphone`,
			// 	releasedate: `2022-09-04`,
			// 	ageRestriction: '18',
			// 	qrColor: '#000',
			// 	qrBackground: '#fff',
			// 	qrSize: 100,
			// 	logo: ''
			// });
			// assign(source.get('batch.create'), {
			// 	name: 'iPhone 13 Pro Max',
			// 	description: `The iPhone is a line of smartphones designed and marketed by Apple Inc. that use Apple's iOS mobile operating system. The first-generation iPhone was announced by then-Apple CEO Steve Jobs on January 9, 2007. Since then, Apple has annually released new iPhone models and iOS updates. As of November 1, 2018, more than 2.2 billion iPhones had been sold. https://www.apple.com`,
			// 	html: `<b>This is an HTML field</b>`,
			// 	homepage: `https://www.apple.com/iphone`,
			// 	releasedate: `2022-09-04`,
			// 	ageRestriction: '18',
			// });
			await source.update('product.create');
			await source.update('batch.create');
			await productEvents.loadMain(true);
		},
	});
	exports.compile = () => {};
})();
