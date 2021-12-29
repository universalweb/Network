import app from '../app';
const {
	isEventNode,
	utility: {
		isEnter,
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
		componentEvent.source = componentEvent.ractive;
		callable(componentEvent, ...args);
		return false;
	};
};
export default preventDefault;
