(async () => {
	console.log('TESTING');
	await app.view.set('pageTitle', 'DEMO SITE');
	await app.component({
		name: 'exampleApp',
		template: 'HELLO WORLD'
	});
	await app.view.set('components.main.exampleApp', true);
})();
