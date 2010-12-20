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