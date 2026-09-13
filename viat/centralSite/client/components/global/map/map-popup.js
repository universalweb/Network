/*
	Shared marker popup/info content for map hosts (Google InfoWindow,
	Leaflet bindPopup). `item.info` is a caller-trusted raw-HTML string
	passthrough. The label/description fallback is a real node so text
	never enters an HTML string context.
*/
export function markerInfoContent(item, fallbackId) {
	if (item?.info) {
		return item.info;
	}
	const title = document.createElement('strong');
	title.textContent = item?.label || fallbackId;
	if (item?.description) {
		const root = document.createElement('div');
		const body = document.createElement('div');
		body.textContent = item.description;
		root.append(title, body);
		return root;
	}
	return title;
}
