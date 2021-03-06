module('AssociationRule', {});

test('generateIdent - Subset *', function () {
    var AR = new AssociationRule();

    // antecedent
    var field = new FieldAR(1, new Attribute('District'), 'Subset', null, null, 1, 1);
    var antecedent = new Cedent(1, 1, new Connective(1, 'Conjunction'), [field], []);
    AR.addAntecedent(antecedent);

    strictEqual(AR.generateIdent().stripTags(), 'District(*)=>Empty');
});

test('generateIdent - Subset 1-2', function () {
    var AR = new AssociationRule();

    // antecedent
    var field = new FieldAR(1, new Attribute('District'), 'Subset', 'Any one value', null, 1, 2);
    var antecedent = new Cedent(1, 1, new Connective(1, 'Conjunction'), [field], []);
    AR.addAntecedent(antecedent);

    strictEqual(AR.generateIdent().stripTags(), 'District(*Any one value 1-2)=>Empty');
});

test('generateIdent - antecedent', function () {
	var AR = new AssociationRule();
	
	// antecedent
	var field = new FieldAR(1, new Attribute('District'), 'One category', null, null, 'Praha');
	var antecedent = new Cedent(1, 1, new Connective(1, 'Conjunction'), [field], []);
	AR.addAntecedent(antecedent);
	
	strictEqual(AR.generateIdent().stripTags(), 'District(Praha)=>Empty');
});

test('generateIdent - IM', function () {
	var AR = new AssociationRule();
	
	// IM
	AR.addIM(new InterestMeasureAR('Support', '', '', null, null, 0.850));
	
	strictEqual(AR.generateIdent().stripTags(), 'Empty=>Empty');
});

test('generateIdent - succedent', function () {
	var AR = new AssociationRule();
	
	// succedent
	var field = new FieldAR(1, new Attribute('Quality'), 'One category', null, null, 'good');
	var succedent = new Cedent(1, 1, null, [field], []);
	AR.addSuccedent(succedent);
	
	strictEqual(AR.generateIdent().stripTags(), 'Empty=>Quality(good)');
});

test('getMarkedRuleCSSID', function () {
	var rule = new AssociationRule();
	rule.setId(1);
	
	strictEqual(rule.getMarkedRuleCSSID(), 'marked-rule-1');
});

test('getMarkedRuleCSSRemoveID', function () {
	var rule = new AssociationRule();
	rule.setId(1);
	
	strictEqual(rule.getMarkedRuleCSSRemoveID(), 'remove-marked-rule-1');
});

test('toSettings', function() {
    var AR = new AssociationRule();
    var antecedent = new Cedent(null, 1, new Connective(null, 'Conjunction'));
    AR.addAntecedent(antecedent);
    var succedent = new Cedent(null, 1, new Connective(null, 'Disjunction'));
    AR.addSuccedent(succedent);
    var settings = {
        'antecedent': {1: {Conjunction: true}},
        'consequent': {1: {Disjunction: true}}
    };

    deepEqual(AR.toSettings(), settings);
});

test('serialize', function() {
    var AR = new AssociationRule();
    var antecedent = new Cedent(null, 1, new Connective(null, 'Conjunction'));
    AR.addAntecedent(antecedent);
    var IM = new InterestMeasureAR('Support', '', '', null, null, 0.850);
    AR.addIM(IM);
    var succedent = new Cedent(null, 1, new Connective(null, 'Disjunction'));
    AR.addSuccedent(succedent);

    strictEqual(instanceOf(AR.serialize().antecedent, Object), true);
    strictEqual(instanceOf(AR.serialize().IMs, Array), true);
    strictEqual(instanceOf(AR.serialize().succedent, Object), true);
});