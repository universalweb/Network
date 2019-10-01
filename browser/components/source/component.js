import app from './app';
const {
	utility: {
		isString
	}
} = app;
const component = (config) => {
	const componentName = config.name;
	if (isString(componentName) && !config) {
		return new Ractive.components[componentName]();
	} else if (Ractive.components[componentName]) {
		return new Ractive.components[componentName](config);
	}
	Ractive.components[componentName] = Ractive.extend(config);
};
window.Ractive.prototype.data = {
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
app.component = component;
export default component;
