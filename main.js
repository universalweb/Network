if (require.main !== module) {
	require('update-electron-app')({
		logger: require('electron-log')
	});
}
const path = require('path');
const {
	app, BrowserWindow
} = require('electron');
if (process.mas) {
	app.setName('Sentivate Browser');
}
let mainWindow = null;
function initialize() {
	if (process.mas) {
		return;
	}
	app.requestSingleInstanceLock();
	app.on('second-instance', () => {
		if (mainWindow) {
			if (mainWindow.isMinimized()) {
				mainWindow.restore();
			}
			mainWindow.focus();
		}
	});
	function createWindow() {
		const windowOptions = {
			width: 1500,
			minWidth: 500,
			height: 900,
			title: app.getName(),
			webPreferences: {
				webviewTag: true,
				nodeIntegration: true
			},
		};
		mainWindow = new BrowserWindow(windowOptions);
		mainWindow.loadURL(path.join('file://', __dirname, '/index.html'));
		mainWindow.on('closed', () => {
			mainWindow = null;
		});
	}
	app.on('ready', () => {
		createWindow();
	});
	app.on('window-all-closed', () => {
		if (process.platform !== 'darwin') {
			app.quit();
		}
	});
	app.on('activate', () => {
		if (mainWindow === null) {
			createWindow();
		}
	});
}
initialize();
