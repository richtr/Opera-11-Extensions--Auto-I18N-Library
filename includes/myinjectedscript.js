// ==UserScript==
// @include http://*
// @include https://*
// ==/UserScript==

// Simple translation test script. Check the Opera Error Console for 
// output -> open with Ctrl+Shift+O on Windows/*nix (or Cmd+Shift+O on Mac).

/**
 * ---------------------------------------
 * OEX Auto Localization Library Snippet
 * ---------------------------------------
 */
!function( undefined ) {
	var oex = opera.extension;
	var i18nObj = function() {
		var _m = [],
			lang = 'en',
			readyTransactions = [],
			localizeTransactions = [],
			initialized = false;
		function _om ( msg ) {
			var d = msg.data, 
				s = [];
			if(!d || d.action!=='dataLocalized') return;
			for(var j in d.data) s[j] = _m[j] = d.data[j];
			if(d.id) localizeTransactions[ d.id ]( d.language, s );
			if(!initialized){ // after 'quickLoad'
				if(d.language) {
					initialized = true;
					lang = d.language;
					for(var i = 0, l = readyTransactions.length; i < l; i++) {
						readyTransactions[ i ]( lang );
						readyTransactions = readyTransactions.splice(i, 1);
					}
				} else {
					oex.postMessage({ "action": 'loadLocaleData' });
				}
			}
		}
		var _l = function( stringData, callback ) {
			if( !stringData )	{ // no data :(
				if( callback && typeof callback == 'function' )	callback( '??', stringData );
				return; 
			}
			var id = Math.floor(Math.random()*1e16),
				cb = (callback && typeof callback == 'function') ? callback : function() {};
			localizeTransactions[ id ] = cb;
			oex.postMessage({ "action": 'localizeData', "id": id, "messages": stringData });
		};
		var _r = function( callback ) {
			var cb = (callback && typeof callback == 'function') ? callback : function() {};
			initialized ? callback( lang ) : readyTransactions.push( cb );
		};
		oex.messages = _m;
		oex.addEventListener('message', _om, false);
		oex.postMessage({ "action": 'quickLoad' }); 
		return {
			get ready() { return _r; },
			get localize() { return _l; },
			get messages() { return _m; }
		};
	};
	oex.i18n = new i18nObj();
}();


// AUTO-LOCALIZATION TEST
opera.extension.i18n.ready( function( userLanguage ) {
	opera.postError('opera.extensions.i18n converted messages to lang[' + userLanguage + ']');

	for(var i in opera.extension.messages) {
		opera.postError( "[" + i + "] " + opera.extension.messages[i]["message"] );
	}
	
	opera.postError('To see different results, change your browser locale in Opera > Preferences > Language');
});


