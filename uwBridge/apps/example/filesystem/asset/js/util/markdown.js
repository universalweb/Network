(async function () {
  console.log('regex Module', 'notify');
  const markdown = new showdown.Converter(),
    slashFirst = new RegExp('<a href="\\/', 'g'),
    httpFirst = new RegExp('<a href="h', 'g'),
    textList = new RegExp('<ul>', 'g'),
    htmlEntitiesLight = function (n) {
      // htmlEntities without quotes and ampersand
      return n.replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    };
  exports.htmlEntitiesLight = htmlEntitiesLight;
  $.htmlEntitiesLight = htmlEntitiesLight;
  markdown.setOption('parseImgDimensions', true);
  markdown.setOption('simplifiedAutoLink', true);
  markdown.setOption('strikethrough', true);
  markdown.setOption('tables', true);
  markdown.setOption('noHeaderId', true);
  markdown.setOption('tasklists', true);

  function styleHtmlAddEvents(string) {
    return string.replace(slashFirst, '<a on-click="openBrowser" data-href="/')
      .replace(httpFirst, '<a on-click="openBrowser" data-href="h')
      .replace(textList, '<ul class="textList">');
  }

  const links = /(^|["'(\s]|&lt;)(www\..+?\..+?)((?:[:?]|\.+)?(?=(?:\s|$)|&gt;|["', \r\n|\n|\r]))/g,
    linksOther = /(^|[(\s]|&lt;)((?:(?:https?|ftp):\/\/|mailto:).+?)((?:[:?]|\.+)?(?=(?:\s|$)|&gt;|["', \r\n|\n|\r]))/g,
    hashtags = /(^|\s)#([^\/ -]\w+)/ig,
    magnetLink = /(^|["'(\s]|<)(magnet:.+?)((?:\s|$)|>|[)"'])/g,
    mentions = /(^|\s)@([^\[\]?\s.]{2,})/g,
    directoryFull = /(^|\s)\/d\/([^\[\]?\s.]{2,})/ig,
    directoryHalf = /(^|\s)d\/([^\[\]?\s.]{2,})/ig,
    usernameRegex = /(^|\s)u\/([^\[\]?\s.]{2,})/ig,
    directory = /(^|\s)\/([^\[\]?\s.]{2,})/g,
    twitter = /(^|\s)twitter@([^\[\]?\s.]{2,})/ig,
    facebook = /(^|\s)facebook@([^\/ -]\w+)/ig,
    youtube = /(^|\s)youtube@(\w+)/ig,
    instagram = /(^|\s)instagram@(\w+)/ig,
    twitch = /(^|\s)twitch@(\w+)/ig,
    endingHTTPpatch = new RegExp('"<``>', 'g');

  function lnkit(strings) {
    let strng;
    if (strings) {
      strng = strings.replace(links, '$1<span on-click="openBrowser" href="<``>://$2">$2</span>$3')
        .replace(linksOther, '$1<span on-click="openBrowser" href="$2">$2</span>$3')
        .replace(hashtags, '$1<a data-href="#$2">#$2</a>')
        .replace(magnetLink, '$1<span data-click="magnet.go"><a href="$2" data-click="up"><i class="icon icon-magnet"></i></a></span>$3')
        .replace(mentions, '$1<a data-href="u/$2">@$2</a>')
        .replace(directoryFull, '$1<a data-href="/d/$2">/$2</a>')
        .replace(directoryHalf, '$1<a data-href="/d/$2">/$2</a>')
        .replace(directory, '$1<a data-href="/d/$2">/$2</a>')
        .replace(usernameRegex, '$1<a data-href="/u/$2">@$2</a>')
        .replace(twitter, '$1<a on-click="openBrowser" target="_blank" href="//twitter.com/@$2"><i class="icon icon-twitter">$2</i></a>')
        .replace(facebook, '$1<a on-click="openBrowser" target="_blank" href="//facebook.com/$2"><i class="icon icon-facebook">$2</i></a>')
        .replace(youtube, '$1<a on-click="openBrowser" target="_blank" href="//youtube.com/user/$2"><i class="icon icon-youtube">$2</i></a>')
        .replace(instagram, '$1<a on-click="openBrowser" target="_blank" href="//instagram.com/$2"><i class="icon icon-instagram">$2</i></a>')
        .replace(twitch, '$1<a on-click="openBrowser" target="_blank" href="//www.twitch.tv/$2/profile"><i class="icon icon-twitch">$2</i></a>')
        .replace(endingHTTPpatch, '"http');
    } else {
      strng = '';
    }
    return strng;
  }
  exports.html = function (string) {
    return lnkit(styleHtmlAddEvents(markdown.makeHtml(htmlEntitiesLight(string))));
  };
  $.markdownHTML = exports.html;
  $('markdown', exports);
})();
