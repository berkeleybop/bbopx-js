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
 * Constructor: request_variable
 * 
 * Contructor for a request variable, used to relate references during
 * a request.
 * 
 * Arguments:
 *  varvalue - *[optional]* string representing a future variable value
 * 
 * Returns:
 *  request variable object
 */
bbopx.minerva.request_variable = function(varvalue){
    var anchor = this;
    anchor._is_a = 'bbopx.minerva.request_variable';

    var uuid = bbop.core.uuid;

    anchor._var = uuid(); // primo
    anchor._use_var_p = false;

    function _value(value){
	if( value ){
	    anchor._var = value;
	    anchor._use_var_p = true;
	}
	return anchor._var;
    }
    // Do an initial revalue depending on the constructor's incoming
    // arguments.
    _value(varvalue);

    /*
     * Function: value
     *
     * The value of the variable to be used.
     *
     * Parameters: 
     *  n/a 
     *
     * Returns: 
     *  string
     */
    anchor.value = _value;

    /*
     * Function: set_p
     *
     * Returns true or false on whether or not the user changed the
     * value of the setting.
     *
     * Parameters: 
     *  n/a
     *
     * Returns: 
     *  boolean
     */
    anchor.set_p = function(){
	return anchor._use_var_p;
    };

};

/*
 * Constructor: request
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
    anchor._is_a = 'bbopx.minerva.request';

    var each = bbop.core.each;
    var what_is = bbop.core.what_is;

    //
    //var possible_entities = ['individual', 'edge', 'model', 'relations'];
    anchor._entity = entity;

    //
    //var possible_operations = ['get', 'remove', 'add', 'generate', ???];
    anchor._operation = operation;

    // Almost all non-meta operations require a model id.
    anchor._model_id = null;

    // 
    anchor._subject_id = null;
    anchor._object_id = null;
    anchor._predicate_id = null;

    // Tons of ops require individuals.
    anchor._individual_id = new bbopx.minerva.request_variable();

    // // Try to take care of new assignToVariable
    // var soft_variables = ['subject', 'object', 'predicate'];
    // anchor._var_store = {};
    // each(soft_variables, function(soft_var){
    // 	anchor._var_store[soft_var] = new bbopx.minerva.request_variable();
    // });
    
    // Hold most other additional arguments to the request.
    // TODO: Could use some checking here? Maybe per-entity?
    // Could possibly explore using swagger or json-schema?
    anchor._arguments = {};

    ///
    /// Internal helper functions.
    ///

    // // Essentially, if the argument is another request, get the
    // // primary string value out of it (arg order), otherwise, just the
    // // string.
    // anchor._squeeze = function(variable, aspect){
    // 	var ret = null;
    // 	if( variable &&
    // 	    what_is(variable) === 'bbopx.minerva.request' &&
    // 	    variable._var_store[aspect] ){
    // 		ret = variable._var_store[aspect];
    // 	}else if( variable && // special handling for special model
    // 		  what_is(variable) === 'bbopx.minerva.request' &&
    // 		  aspect === 'model' ){
    // 		      ret = variable._model_id;
    // 	}else if( variable && what_is(variable) === 'string' ){
    // 	    ret = variable;
    // 	}
    // 	return ret;
    // };

    // Add generic property.
    anchor._add = function(key, val){
	anchor._arguments[key] = val;
	return anchor._arguments[key];
    };

    // Get generic property.
    anchor._get = function(key){
	var ret = null;
	var t = anchor._arguments[key];
	if( t != null ){
	    ret = t;
	}
	return ret;
    };

    ///
    /// Main API.
    ///

    /*
     * Function: specify
     *
     * Return a higher-level representation/"serialization" of the
     * complete object.
     *
     * Parameters: 
     *  n/a
     *
     * Returns: 
     *  simple object
     */
    anchor.specify = function(name, val){
	return anchor._add(name, val);
    };

    /*
     * Function: objectify
     *
     * Return a higher-level representation/"serialization" of the
     * complete object.
     *
     * Parameters: 
     *  n/a
     *
     * Returns: 
     *  simple object
     */
    anchor.objectify = function(){
	return {
	    'entity': anchor._entity,
	    'operation': anchor._operation,
	    'arguments': anchor._arguments
	};
    };

    /*
     * Function: individual
     *
     * Get/set the instance of this request. If not set explicitly,
     * will fall back to a default value.
     *
     * Parameters: 
     *  ind_id - *[optional]* individual id we're going to refer to
     *
     * Returns: 
     *  string
     */
    anchor.individual = function(ind_id){
	if( ind_id ){
	    anchor._individual_id.value(ind_id);
	    anchor._add('individual', ind_id);
	}else{
	    // Fallback to using anonymous one (no change to default).
	}
	anchor._add('individual', anchor._individual_id.value());
	return anchor._individual_id.value();
    };

    /*
     * Function: subject
     *
     * Get/set the subject of this request.
     *
     * Parameters: 
     *  sub - *[optional]* string
     *
     * Returns: 
     *  string or null
     */
    anchor.subject = function(sub){
	if( sub ){
	    anchor._subject_id = sub;
	}
	return anchor._subject_id;
    };

    /*
     * Function: object
     *
     * Get/set the object of this request. This will be used in
     * fact/edge requests, but not much else.
     *
     * Parameters: 
     *  obj - *[optional]* a string
     *
     * Returns: 
     *  string or null
     */
    anchor.object = function(obj){
	if( obj ){
	    anchor._object_id = obj;
	}
	return anchor._object_id;
    };

    /*
     * Function: predicate
     *
     * Get/set the predicate of this request. This will be used in
     * fact/edge requests, but not much else.
     *
     * Parameters: 
     *  pred - *[optional]* a string
     *
     * Returns: 
     *  string or null
     */
    anchor.predicate = function(pred){
	if( pred ){
	    anchor._predicate_id = pred;
	}
	return anchor._predicate_id;
    };

    /*
     * Function: model
     *
     * Get/set the topic model of this request.
     *
     * If a model is not set, like during requests in a set to a
     * not-yet-created model, Minerva will often add this itself if it
     * can after the fact.
     *
     * Parameters: 
     *  model - *[optional]* a string id
     *
     * Returns: 
     *  string or null
     */
    anchor.model = function(model){
	if( model ){
	    anchor._add('modelId', model);
	}
	return anchor._get('modelId');
    };
    
    /*
     * Function: fact
     *
     * Add a fact to the request.
     *
     * Parameters: 
     *  sub - string
     *  obj - string
     *  pred - string
     *
     * Returns: 
     *  n/a
     */
    anchor.fact = function(sub, obj, pred){

	// Update the request's internal variables.
	anchor.subject(sub);
	anchor.object(obj);
	anchor.predicate(pred);

	anchor._add('subject', sub);
	anchor._add('object', obj);
	anchor._add('predicate', pred);
    };

    // /*
    //  * Function: subject_class
    //  *
    //  * DEPRECATED
    //  *
    //  * Parameters: 
    //  *  cls - class id
    //  *
    //  * Returns: 
    //  *  class id
    //  */
    // anchor.subject_class = function(cls){
    // 	if( cls ){
    // 	    anchor._add('subject', cls);
    // 	}
    // 	return cls;
    // };

    anchor.add_annotation = function(key, val){
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
    anchor.add_svf_expression = function(class_id, property_id){
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
    anchor.add_class_expression = function(class_id){
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

    anchor.add_complex_class_expression = function(class_id, type){
	// Our list of expressions must be defined if we go this way.
	if( ! anchor._arguments['expressions'] ){
	    anchor._arguments['expressions'] = [];
	}

	// May be very complicated--recursively assemble.
	var expression = _gen_class_exp(type);

	anchor._arguments['expressions'].push(expression);
    };

    // TODO
    // /**
    //  * SPECIAL
    //  */
    // anchor.expressions = function(exprs){
    // 	// Our list of expressions must be defined if we go this way.
    //     if( ! anchor._arguments['expressions'] ){
    //         anchor._arguments['expressions'] = [];
    //     }
    // 	var expression = {
    //         'type': 'svf',
    //         'literal': class_id,
    //         'onProp': property_id
    // 	};
    // 	anchor._arguments['expressions'].push(expression);
    // };
};

/*
 * Constructor: request_set
 * 
 * Contructor for a Minerva request item set.
 * 
 * Request sets are essentially serial request queues, that reference
 * eachother using the request_variables contained in invididual
 * requests.
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
    anchor._is_a = 'bbopx.minerva.request_set';

    var each = bbop.core.each;
    //var uuid = bbop.core.uuid;

    // 
    anchor._user_token = user_token || null;
    anchor._intention = intention;
    anchor._requests = [];
    //anchor._fallback_entity_id = uuid();

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
		 reqs.push(req.objectify());
	     });
	var str = bbop.json.stringify(reqs);
	var enc = encodeURIComponent(str);
	rset['requests'] = enc;

	return rset;
    };
};

// 
