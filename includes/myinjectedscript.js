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
!function( undefined ) {
	var i18nObj = function() {
		var _m = [];
		var localizeTransactions = [];
		function _om (msg) {
			var d = (msg.data && msg.data.data) ? msg.data.data : {}, 
				s = [];
			if(!d || d.action!=='dataLocalized') return;
			for(var j in d.data) 
				s[j] = _messagesVariable[j] = d.data[j];
			localizeTransactions[ d.id ]( d.language, s );
		}
		var _ll = function( scope, callback ) {
			if(!callback && typeof scope == 'function') { callback = scope; scope = null; }
			var x = Math.floor(Math.random()*1e16),
				oex = opera.extension,
				cb = (callback && typeof callback == 'function') ? callback : function() {};
			localizeTransactions[x] = cb;
			if(localizeTransactions.length===1) 
				oex.addEventListener('message', _om, false);
			oex.postMessage({ "action": 'loadLocaleData', "id": x, "scope": scope });
		};
		var _l = function( stringData, callback ) {
			if( !stringData )	{ // no data :(
				if( callback && typeof callback == 'function' )
					callback( '??', stringData );
				return; 
			}
			var x = Math.floor(Math.random()*1e16),
				oex = opera.extension,
				cb = (callback && typeof callback == 'function') ? callback : function() {};
			localizeTransactions[x] = cb;
			if(localizeTransactions.length===1) 
				oex.addEventListener('message', _om, false);
			oex.postMessage({ "action": 'localizeData', "id": x, "strings": stringData });
		};
		opera.extension.messages = _m;
		return {
			get loadLocale() { return _ll; },
			get localize() { return _l; }
		};
	};
	opera.extension.i18n = new i18nObj();
}();


/** 
 * Initialization script for getting the localized messages for the 'injectedMessages' scope.
 */ 
opera.extension.i18n.loadLocale( 'injectedMessages', function( lang /*, messages*/ ) {
	opera.postError('# of messages: ' + opera.extension.messages.length);
	
	opera.postError('Loaded [' + lang + '] message strings for injected scripts.');
	// As a test, dump each localized message output to the error console:
	for(var i in opera.extension.messages) {
		opera.postError( "[" + i + "] " + opera.extension.messages[i] );
	}
});
