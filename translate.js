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

// todo: write translate library with:
//
//	- background process message listeners for:
//		'localizeData' & 'loadLocaleData'
//
// - postMessage for:
// 		'dataLocalized' & 'localeDataLoaded'
//
// - caching of translations w/ localStorage (or widget.preferences? more storage??).
//
// - Google Translate API AJAX
//

!function(w, undefined){
	
	var userLanguage = window.navigator.language || 'en';

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
	
	function getAnalysisUrl ( text ) {
	    var url = 'https://ajax.googleapis.com/ajax/services/language/detect?v=1.0&q=';
	    text = encodeURIComponent( text );
	    opera.postError(text);
	    if ( text.length > 1300 ) {
	    	text = text.slice( 0, text.lastIndexOf( '%', 1300 ) );
	    }
	    url += text;
	    opera.postError(url);
	    return url;
	}
	
	function getTranslatePackets ( fromLanguage, strings ) {
	    var packets = [],
	        i = 0,
	        l = strings.length;
	    while ( i < l ) {
	    	// Set destination language
	        var packet = 'v=1.0&langpair=' + fromLanguage + '%7C' + userLanguage;
	        var len = packet.length;

	        for ( var segments = 0;
	                i < l && segments < 100; i += 1, segments += 1 ) {
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
	    }
	    return packets;
	}
	  
	var analyze = function( strings, callback ) {
		
        var xhr = xhrManager.get();
        xhr.open( 'GET', getAnalysisUrl( strings ), true );
        opera.postError(getAnalysisUrl( strings ));
        xhr.onreadystatechange = function () {
            if ( xhr.readyState < 4 ) {
            	opera.postError('failed without trying :(');
            	callback.call( this ); // no parameter indicates an error
            	return;
            }
            var result = JSON.parse( xhr.responseText ),
                data = result.responseData;
            if ( ( xhr.status >= 200 && xhr.status < 300 ) &&
                    ( result.responseStatus === 200 ) ) {
                callback.call( this, data.language );
            } else {
            	opera.postError('failed after trying :(');
            	callback.call( this ); // no parameter indicates an error
            }
            xhrManager.release( xhr );
        };
        xhr.send();		
	}
	
	var translate = function( fromLanguage, strings, callback ) {
		if( fromLanguage === userLanguage ) {
			callback.call( this, strings );
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
	                setTimeout( send, 0 );
	            } else {
	                callback.call( this, translatedStringData ); 
	                xhrManager.release( xhr );
	            }
	        } else {
	        	callback.call( this, strings );
	            xhrManager.release( xhr );
	        }
	    };
	    send();
	}
	
	function fail ( source, id, stringData ) {
		source.postMessage({
			action: 'dataLocalized',
			"id": id,
			"language": userLanguage,
			"data": stringData
		});
	}
	
	var actions = {
		localizeData: function( data, source ) {
			var id = data.id;
			
			analyze( data.strings, function( language ) {
				if( language ) {
					translate( language, data.strings, function( translatedStringData ) {
						source.postMessage({
							action: 'dataLocalized',
							"id": id,
							"language": language,
							"data": translatedStringData
						});
					});
				} else {
					fail( source, id, data.strings );
				}
			});
		},
		loadLocaleData: function( data, source ) {
			var id = data.id,
				msgs = [],
				strings = [];
			
			if(!opera.extension.messages ||
					opera.extension.messages.length === 0) {
				fail( source, id, {} );
				return;
			}
			
			/*
			 for(var i in opera.extension.messages) {
				for(var j in opera.extension.messages[i]) {
					opera.postError(opera.extension.messages[i][j]);
				}
				strings[i] = opera.extension.messages[i].message;
			 }
			 */
			
			Array.prototype.push.apply( msgs, [ opera.extension.messages ].map(
                    function( item ) {
                    	if(data.scope) {
                    		if(item.scope === data.scope)
    							return item;
    					}
    					return item;
                    }
			) );
			
			if( msgs.length > 0 ) {
				for(var i in msgs) {
					strings[i] = msgs[i]['message'];
				}
			} else {
				opera.postError('stupid fail :(');
				fail( source, id, {} );
				return;
			}
			opera.postError('message received2');
			opera.postError(strings[0] + " / " + strings.length);
			
			analyze( strings, function( language ) {
				if( language ) {
					translate( language, strings, function( translatedStringData ) {
						for(var i in translatedStringData)
							msgs[i].message = translatedStringData[i];
							
						source.postMessage({
							action: 'dataLocalized',
							"id": id,
							"language": language,
							"data": msgs
						});
					});
				} else {
					fail( source, id, msgs );
				}
			});
		}
	};
	
	if( opera && opera.extension ) {
		opera.extension.addEventListener( 'message', function( msg ) {
			if( msg.data.action !== 'localizeData' && msg.data.action !== 'loadLocaleData' )
				return;
			actions[ msg.data.action ]( msg.data, msg.source );
		}, false);
	}

}(window);