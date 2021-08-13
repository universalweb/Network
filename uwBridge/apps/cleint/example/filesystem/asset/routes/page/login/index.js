(async () => {
  const dirname = exports.dirname;
  console.log('login');
  const {
    page,
    router,
    utility: {
      isEnter
    },
    createAlert,
    notify
  } = app;
  exports.success = () => {
    notify({
      title: 'Login',
      body: 'Welcome!'
    });
    router.pushState('/');
  };
  exports.login = async (event) => {
    if (event.original.key && !isEnter(event.original)) {
      return;
    }
    console.log('Login btn');
    try {
      const results = await app.login({
        password: event.source.get('password'),
        username: event.source.get('username'),
      });
      exports.success(results);
      event.source.set({
        password: '',
        username: ''
      });
    } catch (error) {
      console.log(error);
    }
  };
  exports.signup = async function(event) {
    if (event.original.key && !isEnter(event.original)) {
      return;
    } else if (this.get('signup.password') !== this.get('signup.confirmPassword')) {
      return createAlert({
        message: 'Passwords do not match.'
      });
    } else if (!this.get('signup.password')
      .length) {
      return createAlert({
        message: 'Password too short'
      });
    } else if (!this.get('signup.username')
      .length) {
      return createAlert({
        message: 'Username too short'
      });
    } else if (!this.get('signup.email')
      .length) {
      return createAlert({
        message: 'Email too short'
      });
    }
    console.log('Signup btn');
    const json = await app.login({
      email: event.source.get('signup.email'),
      password: event.source.get('signup.password'),
      referrer: event.source.get('signup.referrer'),
      username: event.source.get('signup.username'),
    });
    if (json && !json.error) {
      console.log(json);
      await event.source.set({
        'signup.agreed': false,
        'signup.confirmPassword': '',
        'signup.email': '',
        'signup.password': '',
        'signup.referrer': '',
        'signup.username': '',
      });
      exports.success(json);
    } else {
      createAlert({
        message: json.error
      });
    }
  };
  exports.reload = function() {};
  exports.config = {
    data: {
      pageTitle: 'Login',
      hero: {
        icon: 'power_settings_new',
        background: {
          color: '#33108e',
          image: '/image/hermesHeaderApp.jpg',
          position: 'center center',
          size: 'auto'
        }
      },
      accessKey: '',
      password: '',
      theme: 'Indigo',
      username: '',
      dynamic: {
        login: true
      },
      signup: {
        agreed: false,
        confirmPassword: '',
        email: '',
        password: '',
        referrer: '',
        username: '',
      },
      tabState: 'login',
      tabs: [{
        active: true,
        icon: 'power_settings_new',
        state: 'login',
        title: 'Login',
      }, {
        active: false,
        icon: 'edit',
        state: 'signup',
        title: 'Signup',
      }]
    },
    onrender({
      source
    }) {
      source.on({
        '*.login': exports.login,
        '*.signup': exports.signup,
        changeTab(event) {
          source.set('tabState', event.get('state'));
          source.set('tabs.*.active', false);
          source.set(`${event.resolve()}.active`, true);
        }
      });
      /*
      source.set({
        'signup.username': 'testg',
        'signup.password': 'testg',
        'signup.confirmPassword': 'testg',
        'signup.agreed': true,
        'signup.email': 'testg@gmail.com'
      });
      */
    },
  };
  exports.asset = {
    partials: {
      login: `${dirname}template`
    }
  };
  exports.compile = () => {
    const language = exports.assets.language;
    language.color = 'indigo';
    return page.compile(exports);
  };
})();
