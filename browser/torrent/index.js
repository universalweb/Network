const WebTorrent = require('webtorrent');
const client = new WebTorrent();
const {
	promise
} = require('Lucy');
async function download(magnetURI, options = {}) {
	return promise((accept) => {
		client.add(magnetURI, options, accept);
	});
}
async function remove(torrentId) {
	return promise((accept) => {
		client.remove(torrentId, accept);
	});
}
async function seed(input, options = {}) {
	return promise((accept) => {
		client.seed(input, options, accept);
	});
}
async function events(component) {
	component.on({
		async torrentStart(a, b, c) {
			console.log(a, b, c);
			let magnet;
			if (magnet) {
				const savePath = await component.get('torrentSavePath');
				const torrent = await download(magnet, {
					path: savePath
				});
				console.log('Client is downloading:', torrent.infoHash);
				torrent.on('download', (bytes) => {
					console.log(`just downloaded: ${bytes}`);
					console.log(`total downloaded: ${torrent.downloaded}`);
					console.log(`download speed: ${torrent.downloadSpeed}`);
					console.log(`progress: ${torrent.progress}`);
				});
				return torrent;
			}
		},
		async torrentRemove(torrentId) {
			await remove(torrentId);
		},
		async torrentSeed(input) {
			await seed(input);
		}
	});
	return component;
}
const methods = {
	client,
	download,
	remove,
	seed,
	get all() {
		return client.torrents;
	},
	get(torrentId) {
		return client.get(torrentId);
	},
	get downloadSpeed() {
		return client.downloadSpeed;
	},
	get uploadSpeed() {
		return client.uploadSpeed;
	},
	get progress() {
		return client.progress;
	},
	get ratio() {
		return client.ratio;
	},
	events,
};
module.exports = methods;
