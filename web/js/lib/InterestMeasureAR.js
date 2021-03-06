/**
 * Class InterestMeasureAR
 * @license http://www.apache.org/licenses/LICENSE-2.0 Apache License, Version 2.0
 * @link http://github.com/kizi/easyminer-miningui
 *
 * @type Class
 */
var InterestMeasureAR = new Class({
	Extends: InterestMeasure,

	threshold: null,
	alpha: null,
	displayPrecision: 6,
	
	initialize: function (name, localizedName, explanation, thresholdType, compareType, fields, stringHelper, calculation, def, required, threshold, alpha) {
		this.parent(name, localizedName, explanation, thresholdType, compareType, fields, stringHelper, calculation, def, required);
		this.threshold = threshold;
		this.alpha = alpha;
	},
	
	getThreshold: function () {
		return this.threshold;
	},
	
	setThreshold: function (val) {
		this.threshold = val;
	},
	
	getAlpha: function () {
		return this.alpha;
	},
	
	setAlpha: function (val) {
		this.alpha = val;
	},
	
	serialize: function () {
		var arr =  {
			name: this.name,
            localizedName: this.localizedName,
			thresholdType: this.thresholdType,
			compareType: this.compareType,
			fields: [],
            threshold: this.threshold,
            alpha: this.alpha
        };

		if (this.hasThreshold()) {
			var tr = {name: 'threshold', value: this.threshold};
			arr.fields.push(tr);
		}
		if (this.hasAlpha()) {
			var tr = {name: 'alpha', value: this.alpha};
			arr.fields.push(tr);
		}
		
		return arr;
	},
	
	toString: function () {
		return this.getLocalizedName() + ':<span class="im-value">' + this.getThreshold().format({decimals: this.displayPrecision}) + '</span>';
	}

});