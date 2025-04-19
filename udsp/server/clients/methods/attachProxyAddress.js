export async function attachProxyAddress(source) {
	// Change connection IP:Port to be the workers IP:Port
	const scale = this.scale;
	if (scale) {
		const {
			ipBuffer,
			portBuffer,
			proxyAddress
		} = this;
		if (proxyAddress) {
			source[4] = proxyAddress;
		} else if (portBuffer) {
			source[4] = portBuffer;
		}
	}
}
