/**
 * Class BrowserDectector
 * @license http://www.apache.org/licenses/LICENSE-2.0 Apache License, Version 2.0
 * @link http://github.com/kizi/easyminer-miningui
 *
 * @type Class
 */
var BrowserDetector = new Class({

	isDeprecated: function () {
        var version = Browser.version;

        if (Browser.ie) { // Internet Explorer
            if (version < 10) { return true; }
        } else if (Browser.firefox) { // Firefox
            if (version < 15) { return true; }
        } else if (Browser.chrome) { // Google Chrome
            if (version < 25) { return true; }
        } else if (Browser.safari) { // Apple Safari
            if (version < 5) { return true; }
        } else if (Browser.opera) { // Opera
            if (version < 11) { return true; }
        }

        return false;
    },

    getName: function() {
        if (Browser.ie) {
            return 'Internet Explorer'
        }

        return Browser.name.capitalize();
    },

	getFullName: function () {
        return this.getName() + ' ' + Browser.version;
	}
	
});