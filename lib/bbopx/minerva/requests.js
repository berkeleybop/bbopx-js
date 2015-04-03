/* 
 * Package: requests.js
 */

if ( typeof bbopx == "undefined" ){ var bbopx = {}; }
if ( typeof bbopx.minerva == "undefined" ){ bbopx.minerva = {}; }

/*
 * Namespace: bbopx.minerva.request_variable
 * 
 * Internal usage variable for keeping track of implicit
 * assignToVariable on the client (see Minerva).
 * 
 * NOTE: This might eventually find its way into bbop-js.
 */

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
 * Namespace: bbopx.minerva.request
 * 
 * Handle requests to Minerva in a somewhat structured way.
 * 
 * NOTE: This might eventually find its way into bbop-js.
 */

/*
 * Constructor: request
 * 
 * Contructor for a Minerva request item. See table for
 * operation/entity combinations:
 * https://github.com/berkeleybop/bbopx-js/wiki/MinervaRequestAPI .
 * 
 * Arguments:
 *  entity - string, see table
 *  operation - string, see table
 * 
 * Returns:
 *  request object
 */
bbopx.minerva.request = function(entity, operation){
    var anchor = this;
    anchor._is_a = 'bbopx.minerva.request';

    var each = bbop.core.each;
    var what_is = bbop.core.what_is;

    // Minerva entity to make a call against.
    anchor._entity = entity;

    // Minerva operation to perform on entity.
    anchor._operation = operation;

    // Almost all non-meta operations require a model id. However,
    // this is sometimes implied in the case of new model creation.
    anchor._model_id = null;

    // Tons of ops require individuals, and they need to be implicitly
    // passable.
    anchor._individual_id = new bbopx.minerva.request_variable();

    // Hold most other additional arguments to the request.
    // TODO: Could use some checking here? Maybe per-entity?
    // Could possibly explore using swagger or json-schema?
    anchor._arguments = {};

    ///
    /// Internal helper functions.
    ///

    // Our list of values must be defined if we go this way.
    anchor._ensure_list = function(key){
	if( ! anchor._arguments[key] ){
	    anchor._arguments[key] = [];
	}
    };

    // Add generic property (non-list).
    anchor._add = function(key, val){
	anchor._arguments[key] = val;
	return anchor._arguments[key];
    };

    // Get generic property (non-list).
    anchor._get = function(key){
	var ret = null;
	var t = anchor._arguments[key];
	if( t != null ){
	    ret = t;
	}
	return ret;
    };

    // Getter/setter (non-list).
    anchor._get_set = function(key, variable){
	if( variable ){
	    anchor._add(key, variable);
	}
	return anchor._get(key);
    };

    ///
    /// Public API.
    ///

    /*
     * Function: entity
     *
     * The specified entity string.
     *
     * Parameters:
     *  n/a
     *
     * Returns: 
     *  string or null
     */
    anchor.entity = function(){
	return anchor._entity;
    };

    /*
     * Function: specify
     *
     * Add a "special" variable to the request. For a subset of
     * requests, this may be required. See table:
     * https://github.com/berkeleybop/bbopx-js/wiki/MinervaRequestAPI .
     *
     * Parameters: 
     *  name - string
     *  val - string
     *
     * Returns: 
     *  added value
     */
    anchor.special = function(name, val){
	return anchor._get_set(name, val);
    };

    /*
     * Function: objectify
     *
     * Should only be used in the context of making a request set.
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

	// Things we will always return.
	var base = {
	    'entity': anchor._entity,
	    'operation': anchor._operation,
	    'arguments': anchor._arguments
	};

	// If we're using an implicitly set individual id, make sure
	// that is added to the call.
	if( anchor._entity == 'individual' && ! anchor._individual_id.set_p() ){
	    base['arguments']['assignToVariable'] =
		anchor._individual_id.value();
	}

	return base;
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
	//anchor._add('individual', anchor._individual_id.value());
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
	return anchor._get_set('subject', sub);
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
	return anchor._get_set('object', obj);
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
	return anchor._get_set('predicate', pred);
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
	return anchor._get_set('modelId', model);
    };
    
    /*
     * Function: fact
     *
     * Add a fact to the request. The same as adding subject, object,
     * and predicate all separately.
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
    };

    /*
     * Function: add_annotation
     *
     * Add an annotation pair to the request.
     *
     * Parameters: 
     *  key - string
     *  val - string
     *
     * Returns: 
     *  number of annotations
     */
    anchor.add_annotation = function(key, val){
	// Our list of values must be defined if we go this way.
	anchor._ensure_list('values');
	anchor._arguments['values'].push({'key': key, 'value': val});
	return anchor._arguments['values'].length;
    };

    /*
     * Function: annotations
     *
     * Return list of annotations in request.
     *
     * Parameters: 
     *  n/a
     *
     * Returns: 
     *  (actual) list of request "values" pairs
     */
    anchor.annotations = function(){
	return anchor._arguments['values'];
    };

    /*
     * Function: add_class_expression
     *
     * General use for simple ops.
     *
     * Parameters: 
     *  class_id - string
     *  property_id - string
     *
     * Returns: 
     *  number of expressions
     */
    anchor.add_class_expression = function(class_id){
	// Our list of values must be defined if we go this way.
	anchor._ensure_list('expressions');

	var expression = {
	    'type': 'class',
	    'literal': class_id
	};
	anchor._arguments['expressions'].push(expression);

	return anchor._arguments['expressions'].length;
    };

    /*
     * Function: add_svf_expression
     *
     * Special use.
     * A short form for "addition" requests that can overload the
     * literal (on the server side) with Manchester syntax.
     *
     * WARNING: I'm not actually sure of the veracity of the above
     * statement.
     *
     * Parameters: 
     *  class_id - string
     *  property_id - string (id or...something more complicated?!?)
     *
     * Returns: 
     *  number of expressions
     */
    anchor.add_svf_expression = function(class_id, property_id){
	// Our list of values must be defined if we go this way.
	anchor._ensure_list('expressions');
	var expression = {
            'type': 'svf',
            'literal': class_id,
            'onProp': property_id
	};
	anchor._arguments['expressions'].push(expression);
	return anchor._arguments['expressions'].length;
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

    /*
     * Function: add_complex_class_expression
     *
     * Most general free form.
     *
     * Parameters: 
     *  type - complex class expression in JSON format (<bbopx.noctua.edit.type>)
     *
     * Returns: 
     *  number of expressions
     */
    anchor.add_complex_class_expression = function(type){
	// Our list of values must be defined if we go this way.
	anchor._ensure_list('expressions');

	// May be very complicated--recursively assemble.
	var expression = _gen_class_exp(type);
	anchor._arguments['expressions'].push(expression);
	return anchor._arguments['expressions'].length;
    };

    /*
     * Function: expressions
     *
     * Return list of expressions in request.
     *
     * Parameters: 
     *  n/a
     *
     * Returns: 
     *  (actual) list of request "expressions".
     */
    anchor.expressions = function(){
	return anchor._arguments['expressions'];
    };
};

/*
 * Namespace: bbopx.minerva.request_set
 * 
 * Handle sets of requests and serialize for Minerva call.
 * 
 * NOTE: This might eventually find its way into bbop-js.
 */

/*
 * Constructor: request_set
 * 
 * Constructor for a Minerva request item set.
 * 
 * Request sets are essentially serial request queues, that reference
 * eachother using the request_variables contained in invididual
 * requests.
 * 
 * As the request_set operations almost always produce request_sets
 * (with senisible defaults and fail modes), they can easily be
 * chained together.
 * 
 * If a model_id is given, it will be applied to any request that does
 * not have one.
 *
 * Arguments:
 *  user_token - string
 *  intention - string
 *  model_id - *[optional]* string
 * 
 * Returns:
 *  request set object
 */
bbopx.minerva.request_set = function(user_token, intention, model_id){
    var anchor = this;
    anchor._is_a = 'bbopx.minerva.request_set';

    var each = bbop.core.each;
    //var uuid = bbop.core.uuid;

    // 
    anchor._user_token = user_token || null;
    anchor._intention = intention;
    anchor._model_id = model_id || null;
    anchor._requests = [];
    anchor._last_entity_id = null;

    /*
     * Method: last_individual_id
     * 
     * Return the ID of the last individual identified in a call
     * (implicitly or explicitly).
     * 
     * Arguments:
     *  number_to_skip - *[optional]* number of matches to skip (default: 0)
     * 
     * Returns:
     *  string or null
     *
     * See also:
     *  <bbopx.minerva.request_set.last_fact_triple>
     */
    anchor.last_individual_id = function(number_to_skip){
	var retval = null;

	// Get the last thing identifiable as an individual.
	// 'for' necessary for backwards breakable iteration.
	for( var ugh = anchor._requests.length; ugh > 0; ugh-- ){
	    var req = anchor._requests[ugh -1];
	    if( req.entity() === 'individual' ){
		if( number_to_skip > 0 ){ // knock off skippables
		    number_to_skip--;
		}else{
		    retval = req.individual();
		    break;
		}
	    }
	};
	
	return retval;
    };

    /*
     * Method: last_fact_triple
     * 
     * In our model, facts are anonymous (do not have an ID) and need
     * to be referred to by their unique triple: subject id, object
     * id, and predicate (edge type) id.
     * 
     * This methods return a list of the three string or null.
     * 
     * Arguments:
     *  number_to_skip - *[optional]* number of matches to skip (default: 0)
     * 
     * Returns:
     *  list of three strings or null
     *
     * See also:
     *  <bbopx.minerva.request_set.last_individual_id>
     */
    anchor.last_fact_triple = function(number_to_skip){
	var retval = null;

	// Get the last thing identifiable as an individual.
	// 'for' necessary for backwards breakable iteration.
	for( var ugh = anchor._requests.length; ugh > 0; ugh-- ){
	    var req = anchor._requests[ugh -1];
	    if( req.entity() === 'edge' ){
		if( number_to_skip > 0 ){ // knock off skippables
		    number_to_skip--;
		}else{
		    retval = [];
		    retval.push(req.subject());
		    retval.push(req.object());
		    retval.push(req.predicate());
		    break;
		}
	    }
	};
	
	return retval;
    };

    /*
     * Method: add
     * 
     * Add a request to the queue. This is the most "primitive" method
     * of adding things to the request queue and should only be used
     * when other methods (look at the API) are not available.
     * 
     * Arguments:
     *  req - <bbopx.minerva.request>
     * 
     * Returns:
     *  <bbopx.minerva.request_set>
     */
    anchor.add = function(req){
	anchor._requests.push(req);
	return anchor;
    };

    /*
     * Method: add_simple_individual
     * 
     * Requests necessary to add an instance of with type class to the
     * model.
     * 
     * Arguments:
     *  cls_id - string
     *  model_id - *[optional]* string
     * 
     * Returns:
     *  <bbopx.minerva.request_set>
     */
    anchor.add_simple_individual = function(cls_id, model_id){

	if( cls_id ){
	    var ind_req = new bbopx.minerva.request('individual', 'add');
	    if( model_id ){ ind_req.model(model_id); } // optionally add

	    ind_req.add_class_expression(cls_id); 

	    anchor.add(ind_req);
	}

	return anchor;
    };

    /*
     * Method: add_fact
     * 
     * Requests necessary to add an edge between two instances in a
     * model.
     * 
     * Arguments:
     *  subject_cls_id - string
     *  object_cls_id - string
     *  predicate_id - string
     *  model_id - *[optional]* string
     * 
     * Returns:
     *  <bbopx.minerva.request_set>
     */
    anchor.add_fact = function(subject_cls_id, object_cls_id, predicate_id,
			       model_id){

	if( subject_cls_id && object_cls_id && predicate_id ){
	    var edge_req = new bbopx.minerva.request('edge', 'add');
	    if( model_id ){ edge_req.model(model_id); } // optionally add

	    edge_req.fact(subject_cls_id, object_cls_id, predicate_id);

	    anchor.add(edge_req);
	}

	return anchor;
    };

    /*
     * Method: add_evidence_to_fact
     * 
     * Adds "anonymous" evidence individual that is referenced in the
     * fact's annotations, as well as a fact of it's own to the batch.
     * 
     * Arguments:
     *  evidence_id - string
     *  source_ids - null, string, or list of strings (PMIDs, etc.)
     *  subject_cls_id - string
     *  object_cls_id - string
     *  predicate_id - string
     *  model_id - *[optional]* string
     * 
     * Returns:
     *  <bbopx.minerva.request_set>
     */
    anchor.add_evidence_to_fact = function(evidence_id, source_ids,
					   subject_cls_id, object_cls_id,
					   predicate_id, model_id){

	if( evidence_id && subject_cls_id && object_cls_id && predicate_id ){

	    // Create floating evidence instance...
	    var ev_ind_req = new bbopx.minerva.request('individual', 'add');
	    ev_ind_req.model(model_id);
	    ev_ind_req.add_class_expression(evidence_id);
	    anchor.add(ev_ind_req);

	    // If there are source_id(s), add them to our new
	    // individual.
	    if( source_ids ){

		// Ensure an iterable list of source ids no matter
		// what our argument is.
		var source_id_list = [];
		if( bbop.core.what_is(source_ids) == 'string' ){
		    source_id_list = [source_ids];
		}else if( bbop.core.what_is(source_ids) == 'array' ){
		    source_id_list = source_ids;
		}else{
		    // Don't know what it is, not gunna touch it.
		}

		// Add each source as an annotation to the floating
		// evidence instance.
		each(source_id_list, function(src_id){
		    var ev_ind_ann_req =
			    new bbopx.minerva.request('individual',
						      'add-annotation');
		    if( model_id ){ ev_ind_ann_req.model(model_id); } // optional
		    ev_ind_ann_req.individual(ev_ind_req.individual());
		    ev_ind_ann_req.add_annotation('source', src_id);
		    anchor.add(ev_ind_ann_req);
		});
	    }
	    
	    // Tie the floating evidence to the edge with an
	    // annotation to the edge.
	    var ev_edge_ann_req =
		    new bbopx.minerva.request('edge', 'add-annotation');
	    if( model_id ){ ev_edge_ann_req.model(model_id); } // optional
	    ev_edge_ann_req.fact(subject_cls_id, object_cls_id, predicate_id);
	    ev_edge_ann_req.add_annotation('evidence', ev_ind_req.individual());
	    anchor.add(ev_edge_ann_req);
	}

	return anchor;
    };

    /*
     * Method: add_evidence_to_last_fact
     * 
     * Adds "anonymous" evidence individual that is referenced in the
     * fact's annotations, as well as a fact of it's own to the batch.
     * 
     * *[WARNING: Can only be used once, probably not at all!]*
     * 
     * Arguments:
     *  evidence_id - string
     *  source_ids - null, string, or list of strings (PMIDs, etc.)
     *  model_id - *[optional]* string
     * 
     * Returns:
     *  <bbopx.minerva.request_set>
     */
    anchor.add_evidence_to_last_fact = function(evidence_id, source_ids,
						model_id){

	var tmp_triple = anchor.last_fact_triple();
	if( tmp_triple ){
	    anchor.add_evidence_to_fact(evidence_id, source_ids,
					tmp_triple[0], tmp_triple[1],
					tmp_triple[2], model_id);
	}

	return anchor;
    };

    /*
     * Method: structure
     * 
     * Create the JSON object that will be passed to the Minerva
     * server.
     * 
     * Arguments:
     *  n/a
     * 
     * Returns:
     *  final object of all queued requests
     */
    anchor.structure = function(){

	// Ready the base return.
	var rset = {
	    'token': anchor._user_token,
	    'intention': anchor._intention
	};

	// Add a JSON stringified request arguments.
	var reqs = [];
	each(anchor._requests,
	     function(req){
		 // If possible, add model in cases where is was not
		 // supplied.
		 if( ! req.model() && anchor._model_id ){
		     req.model(anchor._model_id);
		 }
		 reqs.push(req.objectify());
	     });
	rset['requests'] = reqs;

	return rset;
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
     *  serialization of all queued requests
     */
    anchor.callable = function(){

	var rset = anchor.structure();
	var reqs = rset['requests'];

	var str = bbop.json.stringify(reqs);
	var enc = encodeURIComponent(str);
	rset['requests'] = enc;

	return rset;
    };
};
