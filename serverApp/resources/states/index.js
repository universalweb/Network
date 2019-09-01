(async () => {
	console.log('TESTING');
	await app.view.set('pageTitle', 'DEMO SITE');
	await app.component({
		name: 'exampleApp',
		template: '<h1>HELLO WORLD</h1><p>The first UW Website using UDSP</p>'
	});
	await app.view.set('components.main.exampleApp', true);
})();
