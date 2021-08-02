(async function () {
  console.log('login');
  const {
    page,
    router,
    isEnter,
    alert
  } = app;
  exports.success = () => {
    notify({
      title: 'Login',
      body: 'Welcome!'
    });
    router.pushState('/');
  };
  exports.login = async function (event) {
    if (event.original.key && !isEnter(event.original)) {
      return;
    }
    console.log('Login btn');
    try {
      const self = this;
      const results = await app.login({
        username: this.get('username'),
        password: this.get('password')
      });
      exports.success(results);
      self.set({
        password: '',
        username: ''
      });
    } catch (error) {
      console.log(error);
    }
  };
  exports.signup = async function (event) {
    const self = this;
    if (event.original.key && !isEnter(event.original)) {
      return;
    } else if (this.get('signup.password') !== this.get('signup.confirmPassword')) {
      return alert({
        message: 'Passwords do not match.'
      });
    } else if (!this.get('signup.password')
      .length) {
      return alert({
        message: 'Password too short'
      });
    } else if (!this.get('signup.username')
      .length) {
      return alert({
        message: 'Username too short'
      });
    } else if (!this.get('signup.email')
      .length) {
      return alert({
        message: 'Email too short'
      });
    }
    console.log('Signup btn');
    const json = await app.login({
      email: self.get('signup.email'),
      username: self.get('signup.username'),
      password: self.get('signup.password')
    });
    if (json && !json.error) {
      console.log(json);
      await self.set({
        'signup.username': '',
        'signup.password': '',
        'signup.confirmPassword': '',
        'signup.agreed': false,
        'signup.email': ''
      });
      exports.success(json);
    } else {
      alert({
        message: json.error
      });
    }
  };
  exports.reload = function () {};
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
      theme: 'Indigo',
      username: '',
      password: '',
      accessKey: '',
      dynamic: {
        login: true
      },
      signup: {
        username: '',
        password: '',
        confirmPassword: '',
        email: '',
        agreed: false
      },
      tabState: 'login',
      tabs: [{
        title: 'Login',
        state: 'login',
        icon: 'power_settings_new',
        active: true
      }, {
        title: 'Signup',
        state: 'signup',
        icon: 'edit',
        active: false
      }]
    },
    onrender() {
      const self = this;
      self.on({
        '*.login': exports.login,
        '*.signup': exports.signup,
        changeTab(event) {
          console.log(event);
          self.set('tabState', event.get('state'));
          self.set('tabs.*.active', false);
          self.set(`${event.resolve()}.active`, true);
        }
      });
      /*
      self.set({
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
      login: 'routes/page/login/template'
    }
  };
  exports.compile = function () {
    const language = exports.assets.language;
    language.color = 'indigo';
    return page.compile(exports);
  };
})();
