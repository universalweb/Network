import app from './app.js';
const {
	isEventNode,
	utility: {
		isEnter,
		apply
	}
} = app;
const preventDefault = function(callable) {
	return function(componentEvent, ...args) {
		if (componentEvent) {
			console.log(componentEvent);
			if (componentEvent.node && !isEventNode(componentEvent)) {
				componentEvent.notTarget = false;
			} else {
				componentEvent.isTarget = true;
			}
			const original = componentEvent.original;
			if (original && original.keyCode) {
				componentEvent.isEnter = isEnter(original);
			}
		}
		console.log(this);
		apply(callable, this, [componentEvent, ...args]);
		return false;
	};
};
export default preventDefault;
