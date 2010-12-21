/**
 * Auto-Translate Library for Opera 11 Extensions.
 * ------------------------------------------------
 * ------------------------------------------------
 * 
 * This library will take all input strings from messages.js and convert your extension 
 * in to the user's current language via the Google Translate API.
 * 
 * All translations are cached to speed up localization delivery and prevent unnecessary 
 * translation lookups.
 * 
 * For full usage instructions please consult the README file.
 * 
 */

// currently not working:
//
// - caching of translations w/ localStorage
//
!function( undefined ) {
	
	var userLanguage = 'es',
		storage = localStorage;
	
	if(!storage[ userLanguage ]) storage[ userLanguage ] = {};

	var xhrManager = ( function() {
	    var pool = [];
	    return {
	        get: function () {
	            return pool.pop() || new XMLHttpRequest();
	        },
	        release: function( xhr ) {
	            xhr.onreadystatechange = function () {};
	            pool.push( xhr );
	        }
	    };
	}() );
	
	function getAnalysisUrl ( strings ) {
	    var url = 'https://ajax.googleapis.com/ajax/services/language/detect?v=1.0&q='
	    	text = '',
	    	s = [];
	    
	    for(var i in strings) {
	    	if(text !== '') text += ' ';
	    	text += strings[s];
	    }
	    text = encodeURIComponent( text );
	    if ( text.length > 1300 ) {
	    	text = text.slice( 0, text.lastIndexOf( '%', 1300 ) );
	    }
	    url += text;
	    return url;
	}
	
	function getTranslatePackets ( fromLanguage, strings ) {
		opera.postError('pushing packets');
	    var packets = [],
	        i = 0
	        s = [];
	    
	    var l = 0;
	    for(var i in strings) l++;
	    
	    //while ( i < l ) {
	    	// Set destination language
	        var packet = 'v=1.0&langpair=' + fromLanguage + '%7C' + userLanguage;
	        var len = packet.length;

	        for(var i in strings) {
	       /* for ( var segments = 0;
	                i < l && segments < 100; i += 1, segments += 1 ) {*/
	            var next = encodeURIComponent( strings[i] ),
	                nextLen = next.length;
	            // If the text is too long, abort.
	            if ( nextLen > 4900 ) {
	                return [];
	            }
	            // Google Translate requests have a 5000 character limit.
	            if ( len + nextLen > 4900 ) {
	                break;
	            }
	            packet += '&q=';
	            packet += next;
	            len += nextLen;
	        }
	        packets.push( packet );
	    //}
	    return packets;
	}
	
	// Before we analyze check if we already have the translations
	function getCached ( strings ) {
		var cached = [],
			isCached = true;
		for(var i in strings) {
			var item = storage.getItem(encodeURIComponent("autolang_" + userLanguage + "_" + strings[i]));
			if(item) {
				cached[i] = item;
			} else {
				flushCache(); // Flush the cache!
				isCached = false;
				break;
			}
		}
		return isCached ? cached : null;
	}
	
	function flushCache () {
		// Only remove autolang_ storage attributes
		for(var j = 0, l = storage.length; j < l; j++) {
			var key = decodeURIComponent( storage.key( j ) );
			if(key.indexOf("autolang_" + userLanguage) === 0)
				storage.removeItem( key );
		}
	}
	  
	function analyze ( strings, callback ) {
        var xhr = xhrManager.get();
        xhr.open( 'GET', getAnalysisUrl( strings ), true );
        xhr.onreadystatechange = function () {
            if ( xhr.readyState < 4 ) return;
            var result = JSON.parse( xhr.responseText ),
                data = result.responseData;
            if ( ( xhr.status >= 200 && xhr.status < 300 ) &&
                    ( result.responseStatus === 200 ) ) {
                callback( data.language );
            } else {
            	callback( ); // no parameter indicates an error
            }
            xhrManager.release( xhr );
        };
        xhr.send();		
	}
	
	function translate ( fromLanguage, strings, callback ) {
		if( fromLanguage === userLanguage ) {
			callback( strings );
			return;
		}
		
        var xhr = xhrManager.get(),
	        packets = getTranslatePackets( fromLanguage, strings ),
	        l = packets.length,
	        i = 0,
	        translatedStringData = [];
	
	    function send () {
	        xhr.open( 'POST', 'https://ajax.googleapis.com/ajax/services/language/translate',
	        		true );
	        xhr.setRequestHeader( 'Content-type', 
	            'application/x-www-form-urlencoded' );
	        xhr.send( packets[i] );
	        opera.postError('translation request sent: ' + packets[i]);
	    }
	    
	    xhr.onreadystatechange = function () {
	        if ( xhr.readyState < 4 ) return;
	        var result = JSON.parse( xhr.responseText ),
	            data = result.responseData;
	            
	        if ( ( xhr.status >= 200 && xhr.status < 300 ) &&
	                result.responseStatus === 200 ) {
	            if ( !( data instanceof Array ) ) {
	                data = [ data ];
	            }
	            Array.prototype.push.apply( translatedStringData, data.map(
	                      function( item ) {
	                          return item.responseStatus === 200 ? 
	                              item.responseData.translatedText : null;
	                      }
	            ) );
	            i += 1;
	            if ( i < l ) {
	                send();
	            } else {
	            	for(var j in translatedStringData)
	                	storage.setItem(encodeURIComponent("autolang_" + userLanguage + "_" + strings[j]), translatedStringData[j]);
	                callback( translatedStringData );
	                xhrManager.release( xhr );
	            }
	        } else {
	        	callback( strings );
	            xhrManager.release( xhr );
	        }
	    };
	    send();
	}
	
	function fail ( callbackOrSource, id, stringData ) {
		if( typeof callbackOrSource == 'function' ) {
			callbackOrSource( userLanguage, stringData );
		} else {
			callbackOrSource.postMessage({
				action: 'dataLocalized',
				"id": id || null,
				"language": userLanguage,
				"data": stringData
			});
		}
	}
	
	var initialized = false;
	
	var actions = {
		quickLoad: function( data, source, callback ) {
			if( source ) {
				source.postMessage({
					action: 'dataLocalized',
					"data": opera.extension.messages || []
				});
			} else if (callback) {
				callback( ( initialized ? userLanguage : null ), opera.extension.messages || [] );
			}
		},
		loadLocaleData: function( data, source, callback ) {
			var id = data.id,
				messages = opera.extension.messages || [],
				strings = {};
			
			if( messages.length <= 0 ) {
				fail( source || callback, id, [] );
				return;
			}
			
			for(var i in messages) 
				strings.i = messages[i]["message"];

			var cached = getCached( strings );
			
			if( cached ) {
				for(var i in cached)
					messages[i]["message"] = cached[i];
				
				opera.postError('Received from cache!');
				if( source ) {
					source.postMessage({
						action: 'dataLocalized',
						"language": userLanguage,
						"data": messages
					});
				} else if (callback) {
					callback( userLanguage, opera.extension.messages );
				}
				return;
			}
			
			analyze( strings, function( language ) {
				if( language ) {
					translate( language, strings, function( translatedStringData ) {
						for(var i in translatedStringData)
							if(messages[i])
								messages[i]["message"] = translatedStringData[i];
						if( source ) {
							source.postMessage({
								action: 'dataLocalized',
								"language": language,
								"data": messages
							});
						} else if (callback) {
							callback( language, messages );
						}
					});
				} else {
					fail( source || callback, id, messages );
				}
			});
		},
		localizeData: function( data, source, callback ) {
			var id = data.id,
				messages = data.messages || null,
				strings = {};
			
			if( !messages ) {
				fail( source || callback, id, {} );
				return;
			}
			
			for(var i in messages)
				strings.i = messages[i]["message"];
			
			var cached = getCached( strings );
			
			if( cached ) {
				for(var i in cached)
					messages[i]["message"] = cached[i];
				
				opera.postError('Received from cache!');
				if( source ) {
					source.postMessage({
						action: 'dataLocalized',
						"id": id || null,
						"language": userLanguage,
						"data": messages
					});
				} else if (callback) {
					callback( userLanguage, messages );
				}
				return;
			}
			
			analyze( strings, function( language ) {
				if( language ) {
					translate( language, strings, function( translatedStringData ) {
						for(var i in translatedStringData)
							messages[i]["message"] = translatedStringData[i];
						if( source ) {
							source.postMessage({
								action: 'dataLocalized',
								"id": id || null,
								"language": language,
								"data": messages
							});
						} else if (callback) {
							callback( language, messages );
						}
					});
				} else {
					fail( source || callback, id, messages );
				}
			});
		}
	};
	
	opera.extension.addEventListener( 'message', function( msg ) {
		if( msg.data.action !== 'quickLoad' && 
				msg.data.action !== 'localizeData' && 
					msg.data.action !== 'loadLocaleData' )
			return;
		actions[ msg.data.action ]( msg.data, msg.source );
	}, false);

	
// Load the i18n library and provide the API @ opera.extension.i18n
	
	var oex = opera.extension;
	var i18nObj = function() {
		var lang = 'en',
			readyTransactions = [];
		function _loadedCB ( language, messages ) {
			var s = [];
			for(var j in messages) {
				s[j] = oex.messages[j] = messages[j];
			}
			if(!initialized){ // after 'quickLoad'
				if( language ) {
					initialized = true;
					lang = language;
					for(var i = 0, l = readyTransactions.length; i < l; i++) {
						readyTransactions[ i ]( lang );
						readyTransactions = readyTransactions.splice(i, 1);
					}
				} else {
					actions[ 'loadLocaleData' ]( {}, null, _loadedCB );
				}
			}
		}
		var _l = function( stringData, callback ) {
			if( !stringData )	{ // no data :(
				if( callback && typeof callback == 'function' )	callback( lang, stringData );
				return; 
			}
			actions[ 'localizeData' ]({ "messages": stringData }, null, cb);
		};
		var _r = function( callback ) {
			var cb = (callback && typeof callback == 'function') ? callback : function() {};
			initialized ? callback( lang ) : readyTransactions.push( cb );
		};
		var _gm = function( id ) {
			return oex.messages[ id ] ? oex.messages[ id ][ "message" ] : id;
		};
		actions[ 'quickLoad' ]( {}, null, _loadedCB );
		return {
			get ready() { return _r; }, 	 // parameters: (callback_function)
			get localize() { return _l; },   // parameters: (strings, callback_function)
			get getMessage() { return _gm; } // parameters: (message_id)
		};
	};
	if(!oex.i18n) oex.i18n = new i18nObj();
	
}();