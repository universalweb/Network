import app from './app.js';
const {
	utility: {
		debounce,
		eventAdd,
		isAgent,
	},
	componentStore
} = app;
async function updateResize() {
	app.utility.saveDimensions();
	const info = app.utility.info;
	await componentStore(info);
	const orientation = (screen.orientation || {}).type || screen.mozOrientation || screen.msOrientation;
	const width = info.windowWidth;
	const height = info.windowHeight;
	let widthLevel = 0;
	let screenSize;
	if (width < 640) {
		screenSize = 'miniScreen';
	} else if (width < 740) {
		screenSize = 'tinyScreen';
		widthLevel = 1;
	} else if (width < 1024) {
		screenSize = 'smallScreen';
		widthLevel = 2;
	} else if (width < 1920) {
		screenSize = 'mediumScreen';
		widthLevel = 3;
	} else if (width < 3000) {
		screenSize = 'hdScreen';
		widthLevel = 4;
	} else if (width > 3000) {
		screenSize = '4kScreen';
		widthLevel = 5;
	}
	console.log(screenSize);
	await componentStore('classList.screenSize', screenSize);
	await componentStore('widthLevel', widthLevel);
	if (orientation) {
		await componentStore('classList.orientation', orientation);
	}
	if (height > width) {
		await componentStore('classList.orientationBasic', 'portrait');
	} else if (width > height) {
		await componentStore('classList.orientationBasic', 'landscape');
	} else if (width === height) {
		await componentStore('classList.orientationBasic', 'perfectSquare');
	}
}
const updateResizeAnimationFrame = () => {
	requestAnimationFrame(updateResize);
};
app.updateResizeAnimationFrame = updateResizeAnimationFrame;
const updateResizeDebounce = debounce(app.updateResizeAnimationFrame, 250);
app.updateResizeDebounce = updateResizeDebounce;
app.updateResize = updateResize;
const mobileCheck = () => {
	let check = false;
	const a = navigator.userAgent || navigator.vendor || window.opera;
	if ((/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i).test(a) || (/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw(n|u)|c55\/|capi|ccwa|cdm|cell|chtm|cldc|cmd|co(mp|nd)|craw|da(it|ll|ng)|dbte|dcs|devi|dica|dmob|do(c|p)o|ds(12|d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(|_)|g1 u|g560|gene|gf5|gmo|go(\.w|od)|gr(ad|un)|haie|hcit|hd(m|p|t)|hei|hi(pt|ta)|hp( i|ip)|hsc|ht(c(| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i(20|go|ma)|i230|iac( ||\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|[a-w])|libw|lynx|m1w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|mcr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|([1-8]|c))|phil|pire|pl(ay|uc)|pn2|po(ck|rt|se)|prox|psio|ptg|qaa|qc(07|12|21|32|60|[2-7]|i)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h|oo|p)|sdk\/|se(c(|0|1)|47|mc|nd|ri)|sgh|shar|sie(|m)|sk0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h|v|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl|tdg|tel(i|m)|tim|tmo|to(pl|sh)|ts(70|m|m3|m5)|tx9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas|your|zeto|zte/i).test(a.substr(0, 4))) {
		check = true;
	}
	return check;
};
const tabletCheck = () => {
	return (/(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/).test(navigator.userAgent.toLowerCase());
};
app.initializeScreen = async () => {
	const isMobile = mobileCheck();
	const isTablet = tabletCheck();
	if (isMobile) {
		await componentStore('classes.mobile', true);
		await componentStore('mobile', true);
	}
	if (isTablet) {
		await componentStore('classes.tablet', true);
		await componentStore('tablet', true);
	}
	if (!isMobile && !isTablet) {
		await componentStore('classes.desktop', true);
		await componentStore('desktop', true);
	}
	await componentStore('classes.chrome', isAgent.chrome);
	await componentStore('classes.android', isAgent.android);
	await componentStore('classes.linux', isAgent.linux);
	await componentStore('classes.mozilla', isAgent.mozilla);
	await componentStore('classes.applewebkit', isAgent.applewebkit);
	await app.updateResize();
	eventAdd(window, 'resize', () => {
		requestAnimationFrame(updateResizeDebounce);
	}, true);
};
