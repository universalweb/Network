module.exports = async (app) => {
	const {
		config: {
			database,
			database: {
				host,
				port,
				table
			},
		},
		utility: {
			keys,
			eachObject
		},
		model
	} = app;
	console.log('View Index Client App');
	console.log(database, ' DATABASE CONFIG');
	const mongoose = require('mongoose');
	const db = await mongoose.connect(`mongodb://${host}:${port}/${table}`);
	app.db = db;
	app.mongoose = mongoose;
	const {
		Types: {
			ObjectId
		}
	} = mongoose;
	app.ObjectId = ObjectId;
	const dbModel = (modelName, schemaObj) => {
		if (schemaObj) {
			const schema = new mongoose.Schema(schemaObj, {
				timestamps: true
			});
			const Model = mongoose.model(modelName, schema);
			console.log('dbModel', Model);
			return (modelObject) => {
				return new Model(modelObject);
			};
		}
		return mongoose.model(modelName);
	};
	app.dbModel = dbModel;
	app.qrcode = require('qrcode');
	console.log('DB CONNECTED');
	console.log('View Index Client App');
	app.isObjectIdValid = (id) => {
		return (ObjectId.isValid(id) ? Boolean(String(new ObjectId(id) === id)) : false);
	};
	app.proxy = (type, scope) => {
		const Model = mongoose.model(type, new mongoose.Schema(scope.scheme, {
			timestamps: true
		}));
		const proxy = new Proxy(Model, {
			get(target, prop) {
				if (prop === 'build') {
					return (...args) => {
						return new Model(...args);
					};
				}
				if (target[prop]) {
					return target[prop];
				} else if (scope[prop]) {
					return scope[prop];
				}
			}
		});
		app.model[type] = proxy;
		return app.model[type];
	};
	require('./languages/')(app);
	require('./socketEvent/')(app);
	console.log(keys(model));
};
