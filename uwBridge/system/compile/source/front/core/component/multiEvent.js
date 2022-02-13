import app from '../app';
const {
	utility: {
		each,
		isString,
		isArray,
		isFunction
	}
} = app;
const multiEvent = (currentView, componentEvent, events, ...args) => {
	app.log(currentView, componentEvent, events);
	app.log(args);
	if (componentEvent && events.length) {
		const {
			original
		} = componentEvent;
		original.preventDefault();
		original.stopPropagation();
	}
	if (events) {
		if (isString(events)) {
			each(events.split(','), (subItem) => {
				if (subItem) {
					currentView.fire(subItem.trim(), componentEvent, ...args);
				}
			});
		} else if (isFunction(events)) {
			events(componentEvent, ...args);
		} else if (isArray(events)) {
			each(events, (item) => {
				if (item) {
					multiEvent(currentView, componentEvent, item, ...args);
				}
			});
		}
	}
};
export default multiEvent;
