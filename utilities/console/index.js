const chalk = require(`chalk`);
module.exports = (state) => {
	const {
		utility: {
			stringify,
			mapArray,
			isPlainObject
		}
	} = state;
	function prettyObjects(values) {
		return mapArray(values, (item) => {
			return (isPlainObject(item)) ? stringify(item, null, `  `) : item;
		});
	}
	state.warn = (...args) => {
		const prettyItems = prettyObjects(args);
		console.log(chalk.bgYellow.black(`${state.type}:  WARNING =>  `, ...prettyItems, `\n`));
	};
	state.error = (...args) => {
		const prettyItems = prettyObjects(args);
		console.log(chalk.bgRed.white(`${state.type}:  ERROR =>  `, ...prettyItems, `\n`));
	};
	state.cnsl = (...args) => {
		const prettyItems = prettyObjects(args);
		console.log(chalk.hex(`#2962ff`)(`${state.type}:  LOG =>  `, ...prettyItems, `\n`));
	};
	state.logConfig = (...args) => {
		const prettyItems = prettyObjects(args);
		console.log(chalk.bgMagenta.white(`${state.type}: CONFIGURATION =>  `, ...prettyItems, `\n`));
	};
	state.logSent = (...args) => {
		const header = ` ---------------- Message Sent ----------------  `;
		const prettyItems = prettyObjects(args);
		console.log(chalk.hex(`#6200ea`)(`${state.type}: ${header}`, ...prettyItems, `\n`).replace(`${header} `, `${header}\n`));
		const header = ` ---------------- Message Sent END ----------------  `;
	};
	state.logReceived = (...args) => {
		const header = ` ---------------- Message Received ----------------  `;
		const prettyItems = prettyObjects(args);
		console.log(chalk.hex(`#2962ff`)(`${(state.type)}: ${header}`, ...prettyItems, `\n`).replace(`${header} `, `${header}\n`));
		const header = ` ---------------- Message Received END ----------------  `;
	};
	state.logImprt = (value, directory) => {
		const logValue = (directory) ? `${value} - ${directory}` : value;
		console.log(chalk.hex(`#f50057`)(`${state.type || logValue}:  IMPORTED =>  `, logValue, `\n`));
	};
	state.certLog = (...args) => {
		const header = ` ---------------- Certificate ----------------  `;
		const prettyItems = prettyObjects(args);
		console.log(chalk.hex(`#ffab00`)(`${state.type}: ${header}`, ...prettyItems, `\n`)
			.replace(`${header} `, `${header}\n`));
	};
	state.attention = (...args) => {
		const prettyItems = prettyObjects(args);
		console.log(chalk.red(`${state.type}:  ATTENTION =>  `, ...prettyItems, `\n`));
	};
	state.success = (...args) => {
		const prettyItems = prettyObjects(args);
		console.log(chalk.hex(`#00e676`)(`${state.type}:  SUCCESS =>  `, ...prettyItems, `\n`));
	};
	state.sent = (...args) => {
		const prettyItems = prettyObjects(args);
		console.log(chalk.hex(`#00e676`)(`${state.type}:  SENT =>  `, ...prettyItems, `\n`));
	};
	state.received = (...args) => {
		const prettyItems = prettyObjects(args);
		console.log(chalk.hex(`#2962ff`)(`${state.type}:  RECEIVED =>  `, ...prettyItems, `\n`));
	};
	state.alert = (...args) => {
		const header = ` ---------------- Alert ----------------  `;
		const prettyItems = prettyObjects(args);
		console.log(chalk.hex(`#d50000`)(`${state.type}: ${header}`, ...prettyItems, `\n`)
			.replace(`${header} `, `${header}\n`));
	};
	state.logImprt(`Console`, __dirname);
};
