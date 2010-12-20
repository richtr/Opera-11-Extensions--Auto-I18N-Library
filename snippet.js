/**
 * OEX Auto Localization Library
 * -------------------------------
 * -------------------------------
 * 
 * The auto-translation library for Opera 11+ extension developers provides a convenient
 * way for developers to include multi-language support within their extensions.
 * 
 * Follow these simple instructions to setup and use this auto-localization library from
 * your Popup and/or Injected Script files:
 * 
 * --------------------------
 * Pre-defined Localization:
 * --------------------------
 * 
 * 1. Include the following line in your Background process (typically /index.html):
 * 
 * 		<script type="text/javascript" src="translate.js"></script>
 * 
 * 2. Create your reference strings in /messages.js (see /messages.js for more details)
 * 
 * 3. Copy and paste this file once in to your Popup or Injected Script target files.
 * 
 * 4. In this file, then load either ALL localized versions of your reference strings 
 *    from messages.js...
 * 
 *  	loadLocale();
 *  
 *    ...OR, load only a sub-set of the localized versions of your reference strings 
 *    using a pre-defined scope (more details in /messages.js):
 *  
 *  	loadLocale( 'popupStrings' );
 *  	loadLocale( 'injectedStrings' );
 *  
 *    You can use an *optional* callback to determine when the localized messages have 
 *    been returned:
 *    
 *     	loadLocale( 'popupStrings', function(toLanguage, localizedMessages) {
 *     		opera.postError('Translated messages to ' + toLanguage);
 *     		// ...your initialization code here.
 *     	});
 *     
 *    ...OR, you could just use a callback without including a scope:
 *    
 *    	loadLocale( function(toLanguage, localizedMessages) {
 *			opera.postError('Translated messages to ' + toLanguage);
 *     		// ...your initialization code here.
 *    	});
 * 
 * 5. Once this process has completed, access the your localized messages are available 
 *    by their *id* as follows within Javascript:
 * 
 * 		_message['welcomeMessage'];
 * 		_message['helpButtonString'];
 *		// etc...
 * 
 * That's all you need for complete auto-localization of your extension.
 * 
 * ------------------------
 * On-demand Localization:
 * ------------------------
 * 
 * In addition to localizing your pre-defined strings from messages.js, this library also 
 * provides an on-demand localization/translation feature for Opera 11 extensions.
 * 
 * To use the on-demand localization feature, follow these instructions:
 * 
 * 1. Once again, make sure that translate.js is included in your Background process page 
 *    (typically in index.html):
 * 
 * 		<script type="text/javascript" src="translate.js"></script>
 * 
 * 2. Copy and paste this file once in to your Popup or Injected Script target files.
 * 
 * 3. Perform on-demand translation/localization with the following code:
 * 
 * 		localize(
 * 			'en', // The language code of the strings below.
 * 			{
 * 				'id': 'mystring1',
 * 				'string': 'string 1 to translate'
 * 			},
 * 			{
 * 				'id': 'mystring2',
 * 				'string': 'string 2 to translate'
 * 			}, 
 * 			{
 * 				'id': 'mystring3',
 * 				'string': 'string 3 to translate'
 * 			},
 * 			// include as many strings here as you like...
 * 			{
 * 				'id': 'mystring4',
 * 				'string': '...etc...'
 * 			},
 * 			// *Mandatory* translation callback function:
 * 			function( toLanguage, translatedStrings ) {
 *				opera.postError('Translated messages to ' + toLanguage);
 *				// Process resulting translations here
 * 			}
 * 		);
 * 
 * 4. Use the callback to determine when and whether your strings could be translated to 
 *    the user's locale.
 *    
 *    
 * *** NOTE *******************************************************************************
 * ***                                                                                  ***
 * *** IT IS QUICKER TO USE THE FIRST METHOD TO OBTAIN TRANSLATIONS. THE SECOND METHOD  ***
 * *** SENDS AN INDIVIDUAL TRANSLATION REQUEST TO THE SERVERS EACH TIME THIS FUNCTION   *** 
 * *** IS CALLED. WHERE POSSIBLE YOU SHOULD PRE-DEFINE YOUR MESSAGES IN messages.js.    ***
 * ***                                                                                  ***
 * ****************************************************************************************
 * 
 * That's it!
 * 
 * Any problems, questions or feedback please visit: http://my.opera.com/richtr
 * 
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
			if(!d || d.action!=='localeDataLoaded') return;
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
			oex.postMessage({ action: 'localizeData', id: x, data: s });
			if(localizeTransactions.length===0) {
				oex.addEventListener('message', function(msg) {
					var d = (msg.data && msg.data.data) ? msg.data.data : {}, o = [];
					if(!d || d.action!=='dataLocalized') return;
					for(var x in d.data) o[d.data[x].id] = d.data[x].value;
					localizeTransactions[d.id](d.language, o);
				}, false);
			}
		}
	};
	w.loadLocale = loadLocaleFunction;
	w.localize = localizeFunction;
}(window);