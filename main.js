(async () => {
	if (require.main !== module) {
		require('update-electron-app')({
			logger: require('electron-log')
		});
	}
	const path = require('path');
	const config = require('./config');
	const universalWebSocket = require('./browser/protocol/');
	const state = {
		electron: require('electron'),
	};
	require('./state')('browser', {
		bufferSize: 2 ** 13
	}, state);
	const {
		electron,
		electron: {
			app,
			protocol,
			BrowserWindow
		}
	} = state;
	protocol.registerSchemesAsPrivileged([{
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
	},
	{
		scheme: 'eth',
		privileges: {
			standard: true,
			secure: true
		}
	},
	{
		scheme: 'btc',
		privileges: {
			standard: true,
			secure: true
		}
	},
	{
		scheme: 'bch',
		privileges: {
			standard: true,
			secure: true
		}
	},
	{
		scheme: 'bsv',
		privileges: {
			standard: true,
			secure: true
		}
	},
	{
		scheme: 'ltc',
		privileges: {
			standard: true,
			secure: true
		}
	},
	{
		scheme: 'bnb',
		privileges: {
			standard: true,
			secure: true
		}
	},
	{
		scheme: 'eos',
		privileges: {
			standard: true,
			secure: true
		}
	},
	{
		scheme: 'sntvt',
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
})();
