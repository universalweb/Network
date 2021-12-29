import app from '../app';
const {
	utility: {
		debounce,
		eventAdd,
		isAgent,
		info,
		model
	},
} = app;
const updateResize = debounce(() => {
	Ractive.sharedSet(info);
	const width = info.windowWidth;
	let screenSize;
	if (isAgent.mobile) {
		screenSize = 'mobileScreen';
	} else if (width < 1024) {
		screenSize = 'smallScreen';
	} else if (width < 1920) {
		screenSize = 'mediumScreen';
	} else if (width < 3000) {
		screenSize = 'hdScreen';
	} else if (width > 3000) {
		screenSize = '4kScreen';
	}
	console.log(screenSize);
	Ractive.sharedSet('screenSize', screenSize);
}, 250);
eventAdd(window, 'resize', () => {
	requestAnimationFrame(updateResize);
}, true);
updateResize();
const smoothScroll = (element, to, duration) => {
	if (duration <= 0) {
		return;
	}
	const difference = to - element.scrollTop;
	const perTick = difference / duration * 10;
	requestAnimationFrame(() => {
		element.scrollTop = element.scrollTop + perTick;
		if (element.scrollTop === to) {
			return;
		}
		smoothScroll(element, to, duration - 10);
	});
};
model('smoothScroll', smoothScroll);
