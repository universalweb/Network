import app from '../app';
const {
	utility: {
		each,
	}
} = app;
const multiEvent = (currentView, componentEvent, ...events) => {
	console.log(currentView, componentEvent, events);
	each(events, (item) => {
		if (item) {
			each(item.split(','), (subItem) => {
				currentView.fire(subItem.trim(), componentEvent);
			});
		}
	});
};
export default multiEvent;
