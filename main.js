if (require.main !== module) {
	require('update-electron-app')({
		logger: require('electron-log')
	});
}
const schemes = require('./schemes/');
const path = require('path');
const electron = require('electron');
const state = require('./state')('browser', {
	bufferSize: 2 ** 13
}, {
	electron
});
const {
	file: {
		readJson
	}
} = state;
const config = readJson('./config/index.json');
const universalWebSocket = require('./browser/protocol/');
const {
	app,
	BrowserWindow,
	dialog,
	protocol
} = electron;
protocol.registerSchemesAsPrivileged(schemes);
dialog.showErrorBox = function(title, content) {
	console.log(`${title}\n${content}`);
};
if (process.platform === 'darwin') {
	console.log('MAC BUILD');
} else if (process.platform === 'linux') {
	console.log('Linux BUILD');
} else if (process.platform === 'win32') {
	console.log('Windows BUILD');
}
if (process.mas) {
	app.setName('Universal Web Browser');
	console.log('MAC OSX STORE BUILD');
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
			title: app.name,
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
		console.log(config);
		if (config.mainDev) {
			mainWindow.webContents.openDevTools();
		}
	}
	app.on('ready', async () => {
		await universalWebSocket(state);
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
