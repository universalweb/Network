import app from '../app';
const {
	utility: {
		each,
		isString,
		isArray
	}
} = app;
const multiEvent = (currentView, componentEvent, events, ...args) => {
	console.log(currentView, componentEvent, events);
	console.log(args);
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
		} else if (isArray(events)) {
			each(events, (item) => {
				if (item) {
					each(item.split(','), (subItem) => {
						if (subItem) {
							currentView.fire(subItem.trim(), componentEvent, ...args);
						}
					});
				}
			});
		}
	}
};
export default multiEvent;
