import app from '../app';
const {
	utility: {
		assign
	}
} = app;
const methods = {
	$: app.utility,
	getComponent(partialName) {
		const componentName = partialName;
		const partial = `<${partialName} />`;
		console.log(componentName);
		const partialsCheck = Boolean(this.partials[partialName]);
		if (!partialsCheck) {
			this.partials[partialName] = partial;
		}
		return partialName;
	},
	makePartial(id, template) {
		const key = `partial-${id}`;
		const partialsCheck = Boolean(this.partials[id]);
		if (partialsCheck) {
			return key;
		}
		this.partials[key] = template;
		return key;
	},
};
assign(Ractive.prototype.data, methods);
