import app from '../app';
const {
	utility: {
		each,
		isString,
		isArray,
		apply
	}
} = app;
const logMulti = console;
function debugMultiEvent(...args) {
	if (app.debug || app.debugMultiEvent) {
		apply(logMulti.log, logMulti, args);
	}
}
const multiEvent = (currentView, componentEvent, events, ...args) => {
	debugMultiEvent(currentView, componentEvent, events);
	debugMultiEvent(args);
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
