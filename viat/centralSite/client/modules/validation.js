export function validateAmount(value) {
	if (!value || value.trim() === '') {
		return {
			valid: false,
			message: 'Amount is required',
		};
	}
	const numeric = parseFloat(value);
	if (Number.isNaN(numeric)) {
		return {
			valid: false,
			message: 'Amount must be a valid number',
		};
	}
	if (numeric < 0) {
		return {
			valid: false,
			message: 'Amount must be positive',
		};
	}
	if (numeric === 0) {
		return {
			valid: false,
			message: 'Amount must be greater than zero',
		};
	}
	return {
		valid: true,
		message: '',
	};
}
export function validateAddress(value) {
	if (!value || value.trim() === '') {
		return {
			valid: false,
			message: 'Address is required',
		};
	}
	const trimmed = value.trim();
	if (trimmed.length !== 32) {
		return {
			valid: false,
			message: `Address must be exactly 32 characters (currently ${trimmed.length})`,
		};
	}
	const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
	if (!base64Pattern.test(trimmed)) {
		return {
			valid: false,
			message: 'Address contains invalid base64 characters',
		};
	}
	return {
		valid: true,
		message: '',
	};
}
