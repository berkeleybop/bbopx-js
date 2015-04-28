////
//// The idea here is to have a generic class expression class that
//// can be used at all levels of communication an display (instead of
//// the previous major/minor models).
////

if ( typeof bbopx == "undefined" ){ var bbopx = {}; }
if ( typeof bbopx.minerva == "undefined" ){ bbopx.minerva = {}; }

/**
 * Class expressions.
 * 
 * This is a full-bodied implementation of all the different aspects
 * that we need to capture for type class expressions: information
 * capture from JSON, on-the-fly creations, and display
 * properties. These used to be separate behaviors, but with the
 * client taking over more responsibility from Minerva, a more robust
 * and testable soluton was needed.
 * 
 * Types can be: class ids and the expressions: SVF, union, and
 * intersection. Of the latter group, all are nestable.
 * 
 * Categories is a graphical/UI distinction. They can be: instance_of,
 * <relation id>, union, and intersection.
 * 
 * This model also incorporates whether or not the type is
 * inferred. At this level they are treated the same, but a higher
 * level may (must) treat them as display decorations.
 *
 * The argument "in_type" may be:
 *  - a class id (string)
 *  - a JSON blob as described from Minerva
 *  - another <bbopx.minerva.class_expression>
 *  - null (user will load or interactively create one)
 *
 * Parameters:
 *  in_type - the raw type description (see above)
 *  inferred_p - *[optional]* whether or not the type is inferred (default false)
 */
bbopx.minerva.class_expression = function(in_type, inferred_p){
    this._is_a = 'bbopx.minerva.class_expression';

    // Aliases.
    var anchor = this;
    var each = bbop.core.each;
    var what_is = bbop.core.what_is;

    ///
    /// Initialize.
    ///

    // in_type is always a JSON object, trivial catch of attempt to
    // use just a string as a class identifier.
    if( in_type ){
    	if( what_is(in_type) == 'bbopx.minerva.class_expression' ){
    	    // Unfold and re-parse (takes some properties of new
    	    // host).
    	    in_type = in_type.structure();
    	}else if( what_is(in_type) == 'object' ){
	    // Fine as it is.
    	}else if( what_is(in_type) == 'string' ){
	    // Convert to a safe representation.
	    in_type = {
		'type': 'class',
		'id': in_type,
		'label': in_type
	    };
    	}
    }

    // Inferred type defaults to false.
    this._inferred_p = false;
    if( typeof(inferred_p) !== 'undefined' && inferred_p == true ){
	this._inferred_p = true;
    }

    // Every single one is a precious snowflake (which is necessary
    // for managing some of the aspects of the UI for some use cases).
    this._id = bbop.core.uuid();

    // Derived property defaults.
    this._type = null;
    this._category = 'unknown';
    this._class_id = null;
    this._class_label = null;
    this._property_id = null;
    this._property_label = null;
    // Recursive elements.
    this._frame = [];

    // 
    this._raw_type = in_type;
    if( in_type ){
	anchor.parse(in_type);
    }
};

/**
 * Function: id
 * 
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  string
 */
bbopx.minerva.class_expression.prototype.id = function(){
    return this._id;
};

/**
 * Function: inferred_p
 * 
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  true or false
 */
bbopx.minerva.class_expression.prototype.inferred_p = function(){
    return this._inferred_p;
};

/** 
 * Function: nested_p
 *
 * If the type has a recursive frame.
 *
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  true or false
 */
bbopx.minerva.class_expression.prototype.nested_p = function(){
    var retval = false;
    if( this._frame.length > 0 ){
	retval = true;
    }
    return retval;
};

/**
 * Function: signature
 * 
 * A cheap way of identifying if two class_expressions are the same.
 * This essentially returns a string of the main attributes of a type.
 * It is meant to be semi-unique and collide with dupe inferences.
 *
 * BUG/WARNING: At this point, colliding signatures should mean a
 * dupe, but non-colliding signamtes does *not* guarantee that they
 * are not dupes (think different intersection orderings).
 *
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  string
 */
bbopx.minerva.class_expression.prototype.signature = function(){
    var anchor = this;
    var each = bbop.core.each;

    var sig = [];

    // The easy ones.
    sig.push(anchor.category() || '');
    sig.push(anchor.type() || '');
    sig.push(anchor.class_id() || '');
    sig.push(anchor.property_id() || '');

    // And now recursively on frames.
    if( anchor.frame() ){
	each(anchor.frame(), function(f){
	    sig.push(f.signature() || '');
	});
    }

    return sig.join('_');
};

/** 
 * Function: category
 *
 * Try to put an instance type into some kind of rendering
 * category.
 *
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  string (default 'unknown')
 */
bbopx.minerva.class_expression.prototype.category = function(){
    return this._category;
};

/** 
 * Function: type
 *
 * The "type" of the type.
 *
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  string or null
 */
bbopx.minerva.class_expression.prototype.type = function(){
    return this._type;
};

/** 
 * Function: svf_class_expression
 *
 * The class expression when we are dealing with SVF.
 *
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  type or null
 */
bbopx.minerva.class_expression.prototype.svf_class_expression = function(){
    var ret = null
    if( this.type() == 'svf' ){
	ret = this._frame[0];
    }    
    return ret; 
};

/** 
 * Function: frame
 *
 * If the type has a recursive frame, a list of the types it contains.
 *
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  list of <bbopx.minerva.class_expression>
 */
bbopx.minerva.class_expression.prototype.frame = function(){
    return this._frame;
};

/** 
 * Function: class_id
 *
 * The considered class id.
 *
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  string or null
 */
bbopx.minerva.class_expression.prototype.class_id = function(){
    return this._class_id;
};

/** 
 * Function: class_label
 *
 * The considered class label, defaults to ID if not found.
 *
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  string or null
 */
bbopx.minerva.class_expression.prototype.class_label = function(){
    return this._class_label;
};

/** 
 * Function: property_id
 *
 * The considered class property id.
 * Not defined for 'class' types.
 *
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  string or null
 */
bbopx.minerva.class_expression.prototype.property_id = function(){
    return this._property_id;
};

/** 
 * Function: property_label
 *
 * The considered class property label.
 * Not defined for 'class' types.
 *
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  string or null
 */
bbopx.minerva.class_expression.prototype.property_label = function(){
    return this._property_label;
};

/**
 * Function: parse
 * 
 * Parse a JSON blob into the current instance, clobbering anything in
 * there, except id.
 *
 * Parameters: 
 *  in_type - conformant JSON object
 *
 * Returns:
 *  self
 */
bbopx.minerva.class_expression.prototype.parse = function(in_type){

    var anchor = this;
    var each = bbop.core.each;

    // Helper.
    function _decide_type(type){
	var rettype = null;

	// Easiest case.
	var t = type['type'] || null;
	if( t == 'class' ){
	    rettype = 'class';
	}else if( t == 'union' ){
	    rettype = 'union';
	}else if( t == 'intersection' ){
	    rettype = 'intersection';
	}else if( t == 'svf' || t == 'restriction' ){
	    // Leaving us with SVF for now for "restriction".
	    rettype = 'svf';
	}else{
	    // No idea...
	}

	return rettype;
    }

    // Define the category, and build up an instant picture of what we
    // need to know about the property.
    var t = _decide_type(in_type);
    if( t == 'class' ){

	// Easiest to extract.
	this._type = t;
	this._category = 'instance_of';
	this._class_id = in_type['id'];
	this._class_label = in_type['label'] || this._class_id;
	// No related properties.
	
    }else if( t == 'union' || t == 'intersection' ){ // conjunctions

	// These are simply recursive.
	this._type = t;
	this._category = t;

	// Load stuff into the frame.
	this._frame = [];
	var f_set = in_type['expressions'] || [];
	each(f_set, function(f_type){
	    anchor._frame.push(new bbopx.minerva.class_expression(f_type));
	}); 
    }else if( t == 'svf' ){ // SVF
	    
	// We're then dealing with an SVF: a property plus a class
	// expression. We are expecting a "restriction", although we
	// don't really do anything with that information (maybe
	// later).
	this._type = t;
	// Extract the property information
	this._category = in_type['property']['id'];
	this._property_id = in_type['property']['id'];
	this._property_label =
	    in_type['property']['label'] || this._property_id;	    

	// Okay, let's recur down the class expression. It should be
	// one, but we'll use the frame. Access should be though
	// svf_class_expression().
	var f_type = in_type['svf'];
	this._frame = [new bbopx.minerva.class_expression(f_type)];
    }else{
	// Should not be possible, so let's stop it here.
	//console.log('unknown type :', in_type);
	throw new Error('unknown type leaked in');
    }

    return anchor;
};

/**
 * Function: as_class
 * 
 * Parse a JSON blob into the current instance, clobbering anything in
 * there, except id.
 *
 * Parameters: 
 *  in_type - string
 *
 * Returns:
 *  self
 */
bbopx.minerva.class_expression.prototype.as_class = function(in_type){

    if( in_type ){
	var ce = new bbopx.minerva.class_expression(in_type);
	this.parse(ce.structure());
    }

    return this;
};

/**
 * Function: as_svf
 * 
 * Convert a null class_expression into an arbitrary SVF.
 *
 * Parameters:
 *  class_expr - ID string (e.g. GO:0022008) or <bbopx.minerva.class_expression>
 *  property_id - string
 *
 * Returns:
 *  self
 */
bbopx.minerva.class_expression.prototype.as_svf = function(
    class_expr, property_id){

    // Cheap our way into this--can be almost anything.
    var cxpr = new bbopx.minerva.class_expression(class_expr);

    // Our list of values must be defined if we go this way.
    var expression = {
	'type': 'restriction',
	'svf': cxpr.structure(),
	'property': {
	    'type': "property",
	    'id': property_id
	}
    };

    this.parse(expression);

    return this;
};

/**
 * Function: as_set
 * 
 * Convert a null class_expression into a set of class expressions.
 *
 * Parameters:
 *  set_type - 'intersection' || 'union'
 *  set_list - list of ID strings of <bbopx.minerva.class_expressions>
 *
 * Returns:
 *  self
 */
bbopx.minerva.class_expression.prototype.as_set = function(
    set_type, set_list){

    // We do allow empties.
    if( ! set_list ){ set_list = []; }

    if( set_type == 'union' || set_type == 'intersection' ){

	// Work into a viable argument.
	var set = [];
	bbop.core.each(set_list, function(item){
	    var cexpr = new bbopx.minerva.class_expression(item);
	    set.push(cexpr.structure());
	}); 

	// A little massaging is necessary to get it into the correct
	// format here.
	var fset = set_type;
	var parsable = {};
	parsable['type'] = fset;
	parsable['expressions'] = set;
	this.parse(parsable);
    }

    return this;
};

/** 
 * Function: structure
 *
 * Hm. Essentially dump out the information contained within into a
 * JSON object that is appropriate for consumption my Minerva
 * requests.
 *
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  JSON object
 */
bbopx.minerva.class_expression.prototype.structure = function(){

    // Aliases.
    var anchor = this;
    var each = bbop.core.each;

    // We'll return this.
    var expression = {};
    
    // Extract type.
    var t = anchor.type(); 
    if( t == 'class' ){ // trivial

	expression['type'] = 'class';
	expression['id'] = anchor.class_id();

    }else if( t == 'svf' ){ // SVF
	
	// Easy part of SVF.
	expression['type'] = 'restriction';
	expression['property'] = {
	    'type': 'property',
	    'id': anchor.property_id()
	};
	
	// The hard part: grab or recur for someValuesFrom class
	// expression.
	var svfce = anchor.svf_class_expression();
	var st = svfce.type();
	if( st == 'class' ){
	    expression['svf'] = {
		'type': 'class',
		'id': svfce.class_id()
	    };
	}else if( t == 'union' || t == 'intersection' || t == 'svf' ){
	    expression['svf'] = [svfce.structure()];
	}else{
	    throw new Error('unknown type in sub-request processing: ' + st);
	}
	
    }else if( t == 'union' || t == 'intersection' ){ // compositions
	
	// Recursively add all of the types in the frame.
	var ecache = [];
	var frame = anchor.frame();
	each(frame, function(ftype){
	    ecache.push(ftype.structure());
	});

	// Correct structure.
	expression['type'] = t;
	expression['expressions'] = ecache;
	
    }else{
	throw new Error('unknown type in request processing: ' + t);
    }
    
    return expression;
};


bbopx.minerva.class_expression.intersection = function(list){
    var ce = new bbopx.minerva.class_expression();
    ce.as_set('intersection', list);
    return ce;
};

bbopx.minerva.class_expression.union = function(list){
    var ce = new bbopx.minerva.class_expression();
    ce.as_set('union', list);
    return ce;
};

bbopx.minerva.class_expression.svf = function(cls_expr, prop_id){
    var ce = new bbopx.minerva.class_expression();
    ce.as_svf(cls_expr, prop_id);
    return ce;
};

bbopx.minerva.class_expression.cls = function(id){
    var ce = new bbopx.minerva.class_expression();
    ce.as_class(id);
    return ce;
};
