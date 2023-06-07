import WebTorrent from 'webtorrent';
const client = new WebTorrent();
import { promise } from '@universalweb/acid';
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
async function streamPlay(torrentId, domSelector) {
	return promise((accept) => {
		client.add(torrentId, (torrent) => {
			const streamFile = torrent.files.find((file) => {
				const extCheck = file.name.endsWith('.mp4') || file.name.endsWith('.mkv') || file.name.endsWith('.m4v');
				return extCheck && !file.name.includes('sample');
			});
			streamFile.appendTo(domSelector);
			accept(torrent);
		});
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
		},
		magnetStream(componentEvent) {
			if (componentEvent.original.keyCode === 13) {
				const magnet = this.get('torrent.magnet');
				streamPlay(magnet, '#torrentView');
				console.log(magnet, componentEvent);
			}
		}
	});
	return component;
}
export const methods = {
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
	streamPlay(torrentId, domSelector) {
		return streamPlay(torrentId, domSelector);
	},
	events,
};
