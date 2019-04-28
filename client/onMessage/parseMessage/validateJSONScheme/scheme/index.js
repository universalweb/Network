module.exports = {
	type: 'object',
	properties: {
		rid: {
			type: 'number',
			maximum: 9999,
			minimum: 0,
		},
		eid: {
			type: 'number',
			maximum: 999,
			minimum: 0,
		},
		data: {
			type: 'string',
			maxLength: 900,
			minimum: 200,
		}
	}
};
