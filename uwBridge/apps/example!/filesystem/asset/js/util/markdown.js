(async () => {
	import 'js/lib/showdown.min.js';
	const { utility: { cnsl } } = app;
	cnsl('regex Module', 'notify');
	const markdown = new window.showdown.Converter();
	const slashFirst = new RegExp('<a href="\\/', 'g');
	const httpFirst = new RegExp('<a href="h', 'g');
	const textList = new RegExp('<ul>', 'g');
	const htmlEntitiesLight = function(n) {
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
		return string.replace(slashFirst, '<a on-click="routerLoad" data-href="/')
			.replace(httpFirst, '<a target="_blank" href="h')
			.replace(textList, '<ul class="textList">');
	}
	const links = /(^|["'(\s]|&lt;)(www\..+?\..+?)((?:[:?]|\.+)?(?=(?:\s|$)|&gt;|["', \r\n|\n|\r]))/g;
	const linksOther = /(^|[(\s]|&lt;)((?:(?:https?|ftp):\/\/|mailto:).+?)((?:[:?]|\.+)?(?=(?:\s|$)|&gt;|["', \r\n|\n|\r]))/g;
	const hashcodes = /(^|\s)#([^\/ -]\w+)/ig;
	const magnetLink = /(^|["'(\s]|<)(magnet:.+?)((?:\s|$)|>|[)"'])/g;
	const mentions = /(^|\s)@([^\[\]?\s.]{2,})/g;
	const directoryFull = /(^|\s)\/d\/([^\[\]?\s.]{2,})/ig;
	const directoryHalf = /(^|\s)d\/([^\[\]?\s.]{2,})/ig;
	const usernameRegex = /(^|\s)u\/([^\[\]?\s.]{2,})/ig;
	const directory = /(^|\s)\/([^\[\]?\s.]{2,})/g;
	const twitter = /(^|\s)twitter@([^\[\]?\s.]{2,})/ig;
	const facebook = /(^|\s)facebook@([^\/ -]\w+)/ig;
	const youtube = /(^|\s)youtube@(\w+)/ig;
	const instagram = /(^|\s)instagram@(\w+)/ig;
	const twitch = /(^|\s)twitch@(\w+)/ig;
	const endingHTTPpatch = new RegExp('"<``>', 'g');
	function lnkit(strings) {
		let strng;
		if (strings) {
			strng = strings.replace(links, '$1<span on-click="openBrowser" href="<``>://$2">$2</span>$3')
				.replace(linksOther, '$1<span on-click="openBrowser" href="$2">$2</span>$3')
				.replace(hashcodes, '$1<a data-href="#$2">#$2</a>')
				.replace(magnetLink, '$1<span data-click="magnet.go"><a href="$2" data-click="up"><i class="icon icon-magnet"></i></a></span>$3')
				.replace(mentions, '$1<a data-href="/@$2">@$2</a>')
				.replace(directoryFull, '$1<a data-href="/d/$2">/$2</a>')
				.replace(directoryHalf, '$1<a data-href="/d/$2">/$2</a>')
				.replace(directory, '$1<a data-href="/d/$2">/$2</a>')
				.replace(usernameRegex, '$1<a data-href="/@$2">@$2</a>')
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
	exports.html = function(string) {
		return lnkit(styleHtmlAddEvents(markdown.makeHtml(htmlEntitiesLight(string))));
	};
	exports.utilMarkdown = markdown;
	app.markdownHTML = exports.html;
})();
