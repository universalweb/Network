const {
	fromCharCode
} = String;
function incrementLetter(letter) {
	if (letter === 'Z') {
		return null;
	} else {
		let charCode = letter.charCodeAt(0);
		charCode++;
		return fromCharCode(charCode);
	}
}
function incrementChar(lettersOriginal) {
	const letters = lettersOriginal.split('');
	let idx = letters.length - 1;
	let nextLetter;
	while (true) {
		if (idx < 0) {
			letters.unshift('A');
			break;
		}
		nextLetter = incrementLetter(letters[idx]);
		if (nextLetter) {
			letters[idx] = nextLetter;
			break;
		} else {
			letters[idx] = 'A';
			idx--;
		}
	}
	return letters.join('');
}
function fillLetters(lettersOriginal, numLettersOriginal) {
	let letters = lettersOriginal;
	let numLetters = numLettersOriginal - letters.length;
	while (numLetters > 0) {
		letters = `A${letters}`;
		numLetters--;
	}
	return letters;
}
function incrementInt(numOriginal, upperBound) {
	let num = numOriginal;
	return num === upperBound ? null : ++num;
}
function fillZeros(num, digits) {
	let number = num.toString();
	let numDigits = digits - number.length;
	while (numDigits > 0) {
		number = `0${number}`;
		numDigits--;
	}
	return number;
}
function parseId(idOriginal) {
	if (!idOriginal) {
		return null;
	}
	const id = idOriginal.trim();
	const ltrs = id.match(/^([A-z]*)\s*/);
	const nums = id.match(/\s*(\d*)$/);
	const result = {};
	if (ltrs || nums) {
		result.numbers = nums[1] || '';
		result.letters = ltrs[1] ? ltrs[1].toUpperCase() : '';
		return result;
	} else {
		return null;
	}
}
function generateId(letters, numLetters, numbers, numNumbers) {
	if (numLetters > 0 && numNumbers <= 0) {
		const nextLetters = incrementChar(letters);
		const id = fillLetters(nextLetters, numLetters);
		return {
			id,
			letters: nextLetters,
		};
	} else if (numLetters <= 0 && numNumbers > 0) {
		const nextNumber = incrementInt(numbers);
		const id = fillZeros(nextNumber, numNumbers);
		return {
			id,
			numbers: nextNumber
		};
	} else {
		const maxNumber = Math.pow(10, numNumbers) - 1;
		let nextNumber = incrementInt(numbers, maxNumber);
		let nextLetters = letters;
		if (nextNumber === null) {
			nextNumber = 0;
			nextLetters = incrementChar(letters);
		}
		const id = `${fillLetters(nextLetters, numLetters)}${fillZeros(nextNumber, numNumbers)}`;
		return {
			id,
			letters: nextLetters,
			numbers: nextNumber
		};
	}
}
function int(input, defaultValue) {
	if (typeof (input) === 'undefined') {
		return defaultValue;
	}
	const value = parseInt(input, 10);
	return isNaN(value) ? defaultValue : value;
}
class Generator {
	constructor(options = {}) {
		this.options = options;
		this.options.autoAddKeys = Boolean(options.autoAddKeys);
		this.set(options);
	}
	set(options) {
		this.options = options;
		this.options.digits = int(options.digits, 6);
		this.options.letters = int(options.letters, 3);
		this.options.restore = options.restore || null;
		this.numbers = -1;
		this.letters = 'A';
		if (options.digits === 0) {
			this.letters = 'A';
		}
		if (options.restore) {
			this.restore(options.restore);
		}
		this.ids = [];
		return true;
	}
	restore(restore) {
		const result = parseId(restore);
		if (result) {
			this.numbers = parseInt(result.numbers, 10);
			this.options.digits = result.numbers.length;
			this.letters = result.letters;
			this.options.letters = result.letters.length;
		}
	}
	next() {
		const {
			letters,
			numbers,
			options
		} = this;
		const {
			id
		} = generateId(letters, options.letters, numbers, options.digits);
		return id;
	}
	generate() {
		const {
			letters,
			numbers,
			id
		} = generateId(this.letters, this.options.letters, this.numbers, this.options.digits);
		this.letters = letters;
		this.numbers = numbers;
		this.ids.push(id);
		return id;
	}
}
function idGenerator(options) {
	return new Generator(options);
}
module.exports = idGenerator;
