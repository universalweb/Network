(async function () {
  app.observe('loginStatus', (newValue) => {
    if (newValue) {
      console.log(newValue);
      push('friend.watch');
      push('user.watch');
      push('stats.watch');
      push('friend.watchOnline');
      push('chat.watch');
      push('stats.read');
    } else {
      push('friend.unwatch');
      push('user.unwatch');
      push('stats.unwatch');
      push('friend.unwatchOnline');
      push('chat.unwatch');
    }
  });
})();
