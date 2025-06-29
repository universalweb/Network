// .pattern(/^[0-9]+n$/)
export const bigIntType = (joi) => {
	return {
		type: 'bigint',
		base: joi.any(),
		messages: {
			'bigint.base': '"{#label}" must be a BigInt',
			'bigint.min': '"{#label}" must be greater than or equal to {#limit}',
			'bigint.max': '"{#label}" must be less than or equal to {#limit}',
		},
		coerce(value, helpers) {
			if (typeof value === 'string' && (/^-?\d+n?$/).test(value)) {
				try {
					return {
						value: BigInt(value.endsWith('n') ? value.slice(0, -1) : value)
					};
				} catch (e) {
					return {
						errors: helpers.error('bigint.base')
					};
				}
			}
			return {
				value
			};
		},
		validate(value, helpers) {
			if (typeof value !== 'bigint') {
				return {
					errors: helpers.error('bigint.base')
				};
			}
			return {
				value
			};
		},
		rules: {
			min: {
				method(limit) {
					return this.$_addRule({
						name: 'min',
						args: {
							limit: BigInt(limit)
						}
					});
				},
				args: [
					{
						name: 'limit',
						ref: true,
						assert: (value) => {
							return typeof value === 'bigint' || typeof value === 'number' || typeof value === 'string';
						},
						message: 'limit must be a valid BigInt, number or string',
					},
				],
				validate(value, helpers, args, options) {
					if (value < args.limit) {
						return helpers.error('bigint.min', {
							limit: args.limit
						});
					}
					return value;
				},
			},
			max: {
				method(limit) {
					return this.$_addRule({
						name: 'max',
						args: {
							limit: BigInt(limit)
						}
					});
				},
				args: [
					{
						name: 'limit',
						ref: true,
						assert: (value) => {
							return typeof value === 'bigint' || typeof value === 'number' || typeof value === 'string';
						},
						message: 'limit must be a valid BigInt, number or string',
					},
				],
				validate(value, helpers, args, options) {
					if (value > args.limit) {
						return helpers.error('bigint.max', {
							limit: args.limit
						});
					}
					return value;
				},
			},
			positive: {
				method() {
					return this.$_addRule({
						name: 'positive'
					});
				},
				validate(value, helpers) {
					if (value <= 0n) {
						return helpers.error('bigint.min', {
							limit: 1n
						});
					}
					return value;
				},
			},
			negative: {
				method() {
					return this.$_addRule({
						name: 'negative'
					});
				},
				validate(value, helpers) {
					if (value >= 0n) {
						return helpers.error('bigint.max', {
							limit: -1n
						});
					}
					return value;
				},
			},
		},
	};
};
export default bigIntType;
