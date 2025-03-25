function uriScheme(scheme, privileges = {
	standard: true,
	secure: true
}) {
	const model = {
		scheme,
		privileges
	};
	return model;
}
export const schemes = [uriScheme('uw'), uriScheme('local'), uriScheme('eth'),
	uriScheme('btc'), uriScheme('bch'), uriScheme('bsv'), uriScheme('lyc'), uriScheme('bnb'), uriScheme('eos'), uriScheme('sntvt')];
