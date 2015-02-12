/* 
 * Package: requests.js
 * 
 * Namespace: bbopx.minerva.request/bbopx.minerva.request_set
 * 
 * Handle requests to Minerva in a somewhat structured way.
 * 
 * NOTE: This might eventually find its way into bbop-js.
 */

if ( typeof bbopx == "undefined" ){ var bbopx = {}; }
if ( typeof bbopx.minerva == "undefined" ){ bbopx.minerva = {}; }

/*
 * Constructor: requests
 * 
 * Contructor for a Minerva request item.
 * 
 * Arguments:
 *  entity - string
 *  operation - string
 * 
 * Returns:
 *  request object
 */
bbopx.minerva.request = function(entity, operation){
    var anchor = this;

    // "individual", "edge", "model", "relations"
    anchor._entity = entity;

    // "get", "remove", "add", "generate", etc.
    anchor._operation = operation;
    
    //	
    anchor._arguments = {};

    anchor.bundle = function(){
	return {
	    'entity': anchor._entity,
	    'operation': anchor._operation,
	    'arguments': anchor._arguments
	};
    };

    // Generic.
    anchor.add = function(key, val){
	anchor._arguments[key] = val;
    };

    anchor.model_id = function(model_id){
	anchor.add('modelId', model_id);
    };

    anchor.fact = function(sub_id, obj_id, pred_id){
	anchor.add('subject', sub_id);
	anchor.add('object', obj_id);
	anchor.add('predicate', pred_id);
    };

    anchor.individual = function(ind_id){
	anchor.add('individual', ind_id);
    };

    anchor.subject_class = function(class_id){
	anchor.add('subject', class_id);
    };

    anchor.annotation_values = function(key, val){
	// Our list of values must be defined if we go this way.
	if( ! anchor._arguments['values'] ){
	    anchor._arguments['values'] = [];
	}
	anchor._arguments['values'].push({'key': key, 'value': val});
    };

    /**
     * Special use.
     * A short form for "addition" requests that can overload the
     * literal (on the server side) with Manchester syntax.
     */
    anchor.svf_expressions = function(class_id, property_id){
	// Our list of expressions must be defined if we go this way.
        if( ! anchor._arguments['expressions'] ){
            anchor._arguments['expressions'] = [];
        }
	var expression = {
            'type': 'svf',
            'literal': class_id,
            'onProp': property_id
	};
	anchor._arguments['expressions'].push(expression);
    };

    /**
     * General use for simple ops.
     */
    anchor.class_expressions = function(class_id){
	// Our list of expressions must be defined if we go this way.
	if( ! anchor._arguments['expressions'] ){
	    anchor._arguments['expressions'] = [];
	}
	var expression = {
	    'type': 'class',
	    'literal': class_id
	};
	anchor._arguments['expressions'].push(expression);
    };

    // Create a usable argument bundle from a type.
    function _gen_class_exp(type){

	var each = bbop.core.each;
	
	// We'll return this.
	var expression = {};
	
	// Extract type.
	var t = type.type(); 
	if( t == 'class' ){ // trivial
	    expression['type'] = 'class';
	    expression['literal'] = type.class_id();
	}else if( t == 'union' || t == 'intersection' ){

	    expression['type'] = t;

	    // Recursively add all of the types in the frame.
	    var ecache = [];
	    var frame = type.frame();
	    each(frame,
		 function(ftype){
		     ecache.push(_gen_class_exp(ftype));
		 });
	    expression['expressions'] = ecache;
	    
	}else if( t == 'svf' ){

	    // Easy part of SVF.
	    expression['type'] = 'svf';
	    expression['onProp'] = type.property_id();
	    
	    // The hard part: grab or recur.
	    var svfce = type.svf_class_expression();
	    var st = svfce.type();
	    if( st == 'class' ){
		expression['literal'] = svfce.class_id();
	    }else if( t == 'union' || t == 'intersection' || t == 'svf' ){
		expression['expressions'] = [_gen_class_exp(svfce)];
	    }else{
		throw new Error('unknown type in sub-request prcessing: ' + st);
	    }
	    
	}else{
	    throw new Error('unknown type in request prcessing: ' + t);
	}

	return expression;
    }

    anchor.complex_class_expressions = function(class_id, type){
	// Our list of expressions must be defined if we go this way.
	if( ! anchor._arguments['expressions'] ){
	    anchor._arguments['expressions'] = [];
	}

	// May be very complicated--recursively assemble.
	var expression = _gen_class_exp(type);

	anchor._arguments['expressions'].push(expression);
    };
};

/*
 * Constructor: request_set
 * 
 * Contructor for a Minerva request item set.
 * 
 * Arguments:
 *  user_token - string
 *  intention - string
 * 
 * Returns:
 *  request set object
 */
bbopx.minerva.request_set = function(user_token, intention){
    var anchor = this;

    var each = bbop.core.each;

    anchor._user_token = user_token || null;
    anchor._intention = intention;
    anchor._requests = [];
    
    /*
     * Method: add
     * 
     * Add a request to the queue.
     * 
     * Arguments:
     *  req - <bbopx.minerva.request>
     * 
     * Returns:
     *  n/a
     */
    anchor.add = function(req){
	anchor._requests.push(req);
    };

    /*
     * Method: callable
     * 
     * Serialize a request set and the component requests.
     * 
     * Arguments:
     *  n/a
     * 
     * Returns:
     *  ???
     */
    anchor.callable = function(){

	// Ready the base return.
	var rset = {
	    'token': anchor._user_token,
	    'intention': anchor._intention
	};

	// Add a JSON stringified request arguments.
	var reqs = [];
	each(anchor._requests,
	     function(req){
		 reqs.push(req.bundle());
	     });
	var str = bbop.json.stringify(reqs);
	var enc = encodeURIComponent(str);
	rset['requests'] = enc;

	return rset;
    };
};

