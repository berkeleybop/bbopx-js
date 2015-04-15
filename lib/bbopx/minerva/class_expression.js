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
 *  #TODO? - null (user will load or interactively create one)
 *
 * Parameters:
 *  in_type - the raw type description (see above)
 *  inferred_p - *[optional]* whether or not the type is inferred (default false)
 */
bbopx.minerva.class_expression = function(in_type, inferred_p){

    // Aliases.
    var anchor = this;
    var each = bbop.core.each;
    var what_is = bbop.core.what_is;

    ///
    /// Initialize.
    ///

    // in_type is always a JSON object, trivial catch of attempt to
    // use just a string as a class identifier.
    if( in_type && what_is(in_type) == 'string' ){
	// var cls_id = in_type;
	// in_type = anchor.structure();
	// in_type['id'] = cls_id;
	// in_type['label'] = cls_id;
	in_type = {
	    'type': 'Class',
	    'id': in_type,
	    'label': in_type
	};
    }
    this._raw_type = in_type;

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

    // Helpers.
    function _decide_type(type){
	var rettype = null;

	// Easiest case.
	var t = type['type'] || null;
	if( t == 'Class' ){
	    rettype = 'class';
	}else{
	    // Okay, we're dealing with a class expression...but which
	    // one? Talking to Heiko, these can be only one--they are
	    // not going to be mixed.
	    if( type['unionOf'] ){
		rettype = 'union';
	    }else if( type['intersectionOf'] ){
		rettype = 'intersection';
	    }else{
		// Leaving us with SVF.
		rettype = 'svf';
	    }
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
	
    }else if( t == 'union' || t == 'intersection' ){

	// These are simply recursive.
	this._type = t;
	this._category = t;

	// Load stuff into the frame.
	this._frame = [];
	// TODO: Argh! Hardcode-y!
	var f_set = in_type[t + 'Of'] || [];
	each(f_set, function(f_type){
	    anchor._frame.push(new bbopx.minerva.class_expression(f_type));
	});
    }else{
	    
	// We're then dealing with an SVF: a property plus a class
	// expression. We are expecting a "Restriction", although we
	// don't really do anything with that information (maybe
	// later).
	this._type = t;
	// Extract the property information
	this._category = in_type['onProperty']['id'];
	this._property_id = in_type['onProperty']['id'];
	this._property_label =
	    in_type['onProperty']['label'] || this._property_id;	    

	// Okay, let's recur down the class expression. It should be
	// one, but we'll use the frame. Access should be though
	// svf_class_expression().
	var f_type = in_type['someValuesFrom'];
	this._frame = [new bbopx.minerva.class_expression(f_type)];
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
 *  boolean
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
 * A cheap way of identifying if two types are the same.
 * This essentially returns a string of the main attributes of a type.
 * It is meant to be semi-unique and collide with dupe inferences.
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
 * Not defined for 'Class' types.
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
 * Not defined for 'Class' types.
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

	expression['type'] = 'Class';
	expression['id'] = anchor.class_id();

    }else if( t == 'svf' ){ // SVF
	
	// Easy part of SVF.
	expression['type'] = 'Restriction';
	expression['onProperty'] = {
	    'type': 'ObjectProperty',
	    'id': anchor.property_id()
	};
	
	// The hard part: grab or recur for someValuesFrom.
	var svfce = anchor.svf_class_expression();
	var st = svfce.type();
	if( st == 'class' ){
	    expression['type'] = 'Class';
	    expression['id'] = svfce.class_id();
	}else if( t == 'union' || t == 'intersection' || t == 'svf' ){
	    expression['someValuesFrom'] = [anchor.structure(svfce)];
	}else{
	    throw new Error('unknown type in sub-request processing: ' + st);
	}
	
    }else if( t == 'union' || t == 'intersection' ){ // compositions
	
	// Recursively add all of the types in the frame.
	var ecache = [];
	var frame = anchor.frame();
	each(frame, function(ftype){
	    ecache.push(anchor.structure(ftype));
	});

	// Correct structure.
	var ekey = t + 'Of';	
	expression[ekey] = ecache;
	
    }else{
	throw new Error('unknown type in request processing: ' + t);
    }
    
    return expression;
};
