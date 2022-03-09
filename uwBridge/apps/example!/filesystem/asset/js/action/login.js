(async () => {
	const {
		router,
		request,
		utility: {
			jsonParse,
			stringify,
			cnsl,
			hasValue
		},
		workerRequest,
		view,
		crate,
	} = app;
	cnsl('login model', 'notify');
	console.log(crate.check);
	let creditCheck = crate.getItem('credit');
	exports.success = async function(data) {
		cnsl('login success', 'notify');
		console.log(data);
		if (data.credit) {
			const credit = data.credit;
			$.credit = credit;
			crate.setItem('credit', stringify(credit));
			workerRequest('credit', credit);
		} else if (crate.getItem('credit')) {
			$.credit = jsonParse(crate.getItem('credit'));
		}
		await view.set('@shared.loginStatus', true);
		creditCheck = $.credit;
		return data;
	};
	exports.fail = async function(data) {
		cnsl('login failure', 'notify');
		crate.removeItem('credit');
		$.credit = null;
		if (creditCheck) {
			creditCheck = false;
			crate.clear();
			router.pushState('/');
		} else if (data && data.message) {
			console.log(data);
		}
		return data;
	};
	exports.logoutForce = async function() {
		const requestLogout = await request(`${app.view.get('@shared.account.role')}.universal.logout`, {});
		if (requestLogout.logout) {
			creditCheck = false;
			$.credit = null;
			crate.removeItem('credit');
			await view.set('@shared.account', false);
			await view.set('@shared.loginStatus', false);
			router.pushState('/');
		} else {
			console.log('Logout FAILED');
		}
	};
	exports.login = async function(data) {
		const credit = (crate.getItem('credit')) ? {
			credit: jsonParse(crate.getItem('credit'))
		} : false;
		let loginRequest;
		if (!credit && !data) {
			return;
		} else if (credit) {
			workerRequest('credit', credit);
			loginRequest = await request('open.loginCredit', credit);
		} else {
			loginRequest = await request('open.login', {
				account: data
			});
		}
		console.log(loginRequest);
		if (loginRequest.credit) {
			await view.set('@shared.credit', loginRequest.credit);
			await view.set('@shared.account', loginRequest.account);
			return exports.success(loginRequest);
		} else {
			return exports.fail(loginRequest);
		}
	};
	exports.checkState = async function(data) {
		cnsl('Login CHECK STATE', 'notify');
		console.log(crate);
		console.log(crate.getItem('credit'));
		if (crate.getItem('credit')) {
			return exports.login(data);
		} else {
			return exports.fail(data);
		}
	};
	view.observe('@shared.loginStatus', async (newValue, oldValue, keypath) => {
		console.log('@shared.loginStatus', newValue, oldValue, keypath);
		if (hasValue(oldValue) && newValue !== oldValue) {
			cnsl(`Login State Change ${newValue}`, 'notify');
		}
	});
	view.on({
		'*.logoutForce': exports.logoutForce
	});
	await exports.checkState();
})();
