(async () => {
	if (require.main !== module) {
		require('update-electron-app')({
			logger: require('electron-log')
		});
	}
	const path = require('path');
	const electron = require('electron');
	const uw = require('./protocol/');
	const utility = require('Lucy');
	const state = {
		electron,
		utility
	};
	await require('./utilities/console/')(state);
	await require('./utilities/file/')(state);
	const {
		app,
		protocol,
		BrowserWindow
	} = electron;
	protocol.registerSchemesAsPrivileged([
		{
			scheme: 'uw',
			privileges: {
				standard: true,
				secure: true
			}
		},
		{
			scheme: 'local',
			privileges: {
				standard: true,
				secure: true
			}
		}
	]);
	const dialog = electron.dialog;
	dialog.showErrorBox = function(title, content) {
		console.log(`${title}\n${content}`);
	};
	if (process.mas) {
		app.setName('Universal Web Browser by Arity');
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
					nodeIntegration: false
				},
			};
			mainWindow = new BrowserWindow(windowOptions);
			mainWindow.loadURL(path.join('file://', __dirname, '/index.html'));
			mainWindow.on('closed', () => {
				mainWindow = null;
			});
		}
		app.on('ready', async () => {
			await uw(state);
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
})();
