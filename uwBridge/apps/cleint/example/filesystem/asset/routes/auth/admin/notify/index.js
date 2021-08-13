(async () => {
  const dirname = exports.dirname;
  const {
    page,
    assign,
  } = app;
  assign(exports, {
    config: {
      data: {
        pageTitle: 'Notify users',
        hero: {
          icon: 'notifications',
          background: {
            color: '#33108e',
            image: '/image/hermesHeaderApp.jpg',
            position: 'center center',
            size: 'auto',
          },
        },
        theme: 'Indigo',
      },
      onrender({
        source
      }) {
        source.on({
          submit(event) {
            const item = event.get();
            push('admin.notifyAll', {
              item,
            });
          },
        });
      },
    },
    asset: {
      partials: {
        page: `${dirname}template`,
      },
    },
    compile() {
      const language = exports.assets.language;
      language.color = 'indigo';
      return page.compile(exports);
    },
  });
})();
