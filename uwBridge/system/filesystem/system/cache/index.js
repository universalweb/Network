module.exports = async (uwApp) => {
	const {
		utility: {
			VirtualStorage
		},
	} = uwApp;
	class ServerCache extends VirtualStorage {
		checksum(contents) {
			const contentsLength = contents.length;
			let hash = contentsLength;
			if (contentsLength === 0) {
				return hash;
			}
			for (let i = 0; i < contentsLength; i++) {
				const char = contents.charCodeAt(i);
				hash = (hash ^ ((char + hash) << char)) - i;
			}
			return (hash - contentsLength).toString();
		}
		set(cacheName, item, checksum) {
			const computedChecksum = checksum || this.checksum(item);
			const cacheObject = {
				checksum: computedChecksum,
				item
			};
			this.setItem(cacheName, cacheObject);
			return cacheObject;
		}
		get(cacheName) {
			return this.getItem(cacheName);
		}
	}
	const serverCache = new ServerCache();
	uwApp.serverCache = serverCache;
	await require('./assets')(uwApp);
};
