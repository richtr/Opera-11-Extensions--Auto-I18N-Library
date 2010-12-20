// ==UserScript==
// @include http://*
// @include https://*
// ==/UserScript==

// Simple translation test script. Check the Opera Error Console for 
// output -> open with Ctrl+Shift+O on Windows/*nix (or Cmd+Shift+O on Mac).

/**
 * OEX Auto Localization Library.
 * See /snippet.js for full instructions and details.
 */
!function(w, undefined) {
	w._message = [];
	var loadLocaleFunction = function( scope, callback ) {
		if(!callback && typeof scope == 'function') { callback = scope; scope = null; }
		var oex = w.opera ? w.opera.extension : null,
			cb = (callback && typeof callback == 'function') ? callback || function() {};
		if(!oex) return;
		oex.addEventListener('message', function() {
			var d = (msg.data && msg.data.data) ? msg.data.data : {}, s;
			if(!d || d.action!=='localeData') return;
			for(var x in d.data) s[d.data[x].id] = d.data[x].value;
			w._message = s;
			cb(d.language, s);
		}, false);
		oex.postMessage({action:'loadLocaleData',"scope":scope});
	}
	var localizeTransactions = [];
	var localizeFunction = function(/*lang, string[s]..., callback*/) {
		var a = arguments, s = [], cb, lang = a[0];
		for (var i=1, l=a.length; i<l; i++) {
			(i<l-1) ? s[] = a[i] ? cb = a[i];
		}
		if(lang && s.length>0 && cb && typeof cb == 'function' && w.opera && w.opera.extension) {
			var x = Math.floor(Math.random()*1e16),
				oex = w.opera.extension;
			localizeTransactions[x] = cb;
			oex.postMessage({ action: 'localize', id: x, data: s });
			if(localizeTransactions.length===0) {
				oex.addEventListener('message', function(msg) {
					var d = (msg.data && msg.data.data) ? msg.data.data : {}, o = [];
					if(!d || d.action!=='localize') return;
					for(var x in d.data) o[d.data[x].id] = d.data[x].value;
					localizeTransactions[d.id](d.language, o);
				}, false);
			}
		}
	};
	w.loadLocale = loadLocaleFunction;
	w.localize = localizeFunction;
}(window);


/** 
 * Initialization script for getting the localized messages for the 'injectedMessages' scope.
 */ 
loadLocale( 'injectedMessages', function(lang) {
	opera.postError('Loaded [' + lang + '] message strings for injected scripts.');
	// As a test, dump each localized message output to the error console:
	for(var i in _message) {
		opera.postError( _message[i] );
	}
});
