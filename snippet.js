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
 * You MUST include the contents of this file (the snippet) in to your Popup or Injected Script 
 * file(s).
 * 
 * See the README file for full instructions or visit the support page:
 * 
 * http://my.opera.com/richtr/blog/experimental-auto-internationalization-i18n-library-for-opera-11-extension-dev
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
			if(!initialized) {
				initialized = true;
				lang = d.language;
				for(var i = 0, l = readyTransactions.length; i < l; i++) {
					readyTransactions[ i ]( lang );
					readyTransactions = readyTransactions.splice(i, 1);
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
		var _gm = function( id, replacements ) {
			if( !_m[ id ]) return id;
			var s = _m[ id ][ "message" ];
			if(replacements)
				for(var i in replacements) s = s.replace('<string+>', replacements[i] );
			return s;
		};
		oex.messages = _m;
		oex.addEventListener('message', _om, false);
		oex.postMessage({ "action": 'quickLoad' }); 
		return {
			get ready() { return _r; }, 	 // parameters: (callback_function)
			get localize() { return _l; },   // parameters: (strings, callback_function)
			get getMessage() { return _gm; } // parameters: (message_id)
		};
	};
	if(!oex.i18n) oex.i18n = new i18nObj();
}();