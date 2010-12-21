/**
 * OEX Auto Localization Snippet
 * -------------------------------
 * Written by Rich Tibbett.
 * Distributed under the Creative Commons Sharealike License 
 * http://creativecommons.org/licenses/by-sa/2.5/
 * 
 * The auto-translation library for Opera 11+ extension developers provides a convenient
 * way for developers to include multi-language support within their extensions.
 * 
 * You must include the contents of this file (the snippet) in to your Popup or Injected Script 
 * file(s).
 * 
 * Once included, you must call loadLocale() if you want this library to work!
 * 
 * See the README file for full instructions.
 */
!function( undefined ) {
	var i18nObj = function() {
		var _m = [],
			localizeTransactions = [],
			initialized = false
		function _om ( msg ) {
			var d = msg.data, 
				s = [];
			if(!d || d.action!=='dataLocalized') return;
			for(var j in d.data) 
				s[j] = _m[j] = d.data[j];
			localizeTransactions[ d.id ]( d.language, s );
		}
		var _ll = function( scope, callback ) {
			if(!callback && typeof scope == 'function') { callback = scope; scope = null; }
			var x = Math.floor(Math.random()*1e16),
				oex = opera.extension,
				cb = (callback && typeof callback == 'function') ? callback : function() {};
			localizeTransactions[x] = cb;
			if(!initialized) {
				oex.addEventListener('message', _om, false);
				initialized = true;
			}
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
			if(!initialized) {
				oex.addEventListener('message', _om, false);
				initialized = true;
			}
			oex.postMessage({ "action": 'localizeData', "id": x, "messages": stringData });
		};
		opera.extension.messages = _m;
		return {
			get loadLocale() { return _ll; },
			get localize() { return _l; }
		};
	};
	opera.extension.i18n = new i18nObj();
}();