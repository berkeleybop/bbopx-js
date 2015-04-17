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
     * Function: special
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
	    base['arguments']['assign-to-variable'] =
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
	return anchor._get_set('model-id', model);
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
     * General use for whatever.
     *
     * Parameters: 
     *  class_expr - anything that can be taken by <bbopx.minerva.class_expression> constructor
     *  property_id - string
     *
     * Returns: 
     *  number of expressions
     */
    anchor.add_class_expression = function(class_expr){
	// Our list of values must be defined if we go this way.
	anchor._ensure_list('expressions');

	var expr = new bbopx.minerva.class_expression(class_expr);
	anchor._arguments['expressions'].push(expr.structure());

	return anchor._arguments['expressions'].length;
    };

    /*
     * Function: add_svf_expression
     *
     * Special use.
     * A short form for "addition" requests that can overload the
     * literal (on the server side) with Manchester syntax.
     *
     * Parameters: 
     *  class_expr - anything that can be taken by <bbopx.minerva.class_expression> constructor
     *  property_id - string (id or...something more complicated?!?)
     *
     * Returns: 
     *  number of expressions
     */
    anchor.add_svf_expression = function(class_expr, property_id){
	// Our list of values must be defined if we go this way.
	anchor._ensure_list('expressions');

	var expr = new bbopx.minerva.class_expression();
	expr.as_svf(class_expr, property_id);
	anchor._arguments['expressions'].push(expr.structure());

	return anchor._arguments['expressions'].length;
    };

    /*
     * Function: add_set_class_expression
     *
     * Intersections and unions.
     *
     * Parameters: 
     *  type - 'intersection' or 'union'
     *  class_expr_list - a list of anything that can be taken by <bbopx.minerva.class_expression> constructor
     *
     * Returns: 
     *  number of expressions
     */
    anchor.add_set_class_expression = function(type, class_expr_list){
    	// Our list of values must be defined if we go this way.
    	anchor._ensure_list('expressions');

	var expr = new bbopx.minerva.class_expression();
	expr.as_set(type, class_expr_list);
	anchor._arguments['expressions'].push(expr.structure());

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
 *  model_id - *[optional]* string
 * 
 * Returns:
 *  request set object
 */
bbopx.minerva.request_set = function(user_token, model_id){
    var anchor = this;
    anchor._is_a = 'bbopx.minerva.request_set';

    var each = bbop.core.each;
    //var uuid = bbop.core.uuid;
    var what_is = bbop.core.what_is;

    // 
    anchor._user_token = user_token || null;
    //anchor._intention = intention;
    anchor._model_id = model_id || null;
    anchor._requests = [];
    anchor._last_entity_id = null;

    // Intentions, whether one wants their actions to be communicated
    // to the outside world ('action' vs 'query') are now silently
    // handled withint the request_set framework. The default is the
    // weakest, unles less (almost always) a creative operation is
    // attempted.
    anchor._intention = 'query';

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
     *  intention - *[optional]* 'action' or 'query' ('action' default)
     * 
     * Returns:
     *  <bbopx.minerva.request_set>
     */
    anchor.add = function(req, intention){

	// We always want the "strongest" intention for the batch.
	// If no explicit intention is mentioned, assume that this is
	// a custom op (outside of the API) and is there for an
	// 'action'.
	if( ! intention ){
	    anchor._intention = 'action';
	}else if( intention == 'action' ){
	    anchor._intention = intention;
	}else if( intention == 'query' ){
	    // Skip as it is at least weaker than a possibly set
	    // 'action'.
	}

	anchor._requests.push(req);
	return anchor;
    };

    /*
     * Method: add_individual
     * 
     * Requests necessary to add an instance of with type class to the
     * model.
     * 
     * Expect: "success" and "merge".
     * 
     * Arguments:
     *  class_expr - anything that can be taken by <bbopx.minerva.class_expression> constructor
     *  model_id - *[optional]* string
     * 
     * Returns:
     *  id of individual added, as string
     */
    anchor.add_individual = function(class_expr, model_id){

	var retval = null;
	if( class_expr ){

	    var ind_req = new bbopx.minerva.request('individual', 'add');
	    if( model_id ){ ind_req.model(model_id); } // optionally add

	    ind_req.add_class_expression(class_expr);

	    anchor.add(ind_req, 'action');

	    retval = ind_req.individual();
	}

	//return anchor;
	return retval;
    };

    /*
     * Method: remove_individual
     * 
     * Requests necessary to remove an individual.
     * 
     * Expect: "success" and "rebuild".
     * 
     * Arguments:
     *  individual_id - string
     *  model_id - *[optional]* string
     * 
     * Returns:
     *  <bbopx.minerva.request_set>
     */
    anchor.remove_individual = function(individual_id, model_id){

	if( individual_id ){

	    var ind_req = new bbopx.minerva.request('individual', 'remove');
	    if( model_id ){ ind_req.model(model_id); } // optionally add

	    ind_req.individual(individual_id); 

	    anchor.add(ind_req, 'action');
	}

	return anchor;
    };

    //  value - string
    //  model_id - (optional with fact and individual) string
    anchor._op_type_to_individual = function(op, class_expr, individual_id,
					     model_id){

	if( op && class_expr && individual_id ){
	    if( op != 'add' && op != 'remove' ){
		throw new Error('unknown type operation');
	    }else{
		var type_req =
			new bbopx.minerva.request('individual', op + '-type');

		if( model_id ){ type_req.model(model_id); } // optionally add

		// 
		type_req.add_class_expression(class_expr);

		anchor.add(type_req, 'action');
	    }
	}

	return anchor;
    };

    /*
     * Method: add_type_to_individual
     * 
     * Add the identified type to the individual. Multiple calls are
     * logicially treated as an "intersection", but not processed and
     * displayed as such.
     * 
     * Arguments:
     *  class_expr - anything that can be taken by <bbopx.minerva.class_expression> constructor
     *  individual_id - string
     *  model_id - *[optional]* string
     * 
     * Returns:
     *  <bbopx.minerva.request_set>
     */
    anchor.add_type_to_individual = function(class_expr, individual_id,
					     model_id){
	return anchor._op_type_to_individual('add', class_expr, individual_id,
					     model_id);
    };

    /*
     * Method: remove_type_from_individual
     * 
     * Remove the identified type from the individual.
     * 
     * Arguments:
     *  class_expr - anything that can be taken by <bbopx.minerva.class_expression> constructor
     *  individual_id - string
     *  model_id - *[optional]* string
     * 
     * Returns:
     *  <bbopx.minerva.request_set>
     */
    anchor.remove_type_from_individual = function(class_expr, individual_id,
						  model_id){
	return anchor._op_type_to_individual('remove', class_expr, individual_id,
					     model_id);
    };

    // Throw an error if no subject, object, predicate triple as
    // argument.
    anchor._ensure_fact = function(triple){
	if( triple && triple[0] && triple[1] && triple[2] ){
	    // Okay.
	}else{
	    throw new Error('triple did not look like a proper fact');
	}
    };

    /*
     * Method: add_fact
     * 
     * Requests necessary to add an edge between two instances in a
     * model.
     *
     * Expect: "success" and "merge".
     * 
     * Arguments:
     *  triple - list of three strings: [SUBJECT_ID, OBJECT_ID, PREDICATE_ID]
     *  model_id - *[optional]* string
     * 
     * Returns:
     *  <bbopx.minerva.request_set>
     */
    anchor.add_fact = function(triple, model_id){
	anchor._ensure_fact(triple);

	var edge_req = new bbopx.minerva.request('edge', 'add');
	if( model_id ){ edge_req.model(model_id); } // optionally add

	edge_req.fact(triple[0], triple[1], triple[2]);

	anchor.add(edge_req, 'action');

	return triple;
    };

    /*
     * Method: remove_fact
     * 
     * Requests necessary to remove an edge between two instances in a
     * model.
     *
     * Expect: "success" and "rebuild".
     * 
     * Arguments:
     *  triple - list of three strings: [SUBJECT_ID, OBJECT_ID, PREDICATE_ID]
     *  model_id - *[optional]* string
     * 
     * Returns:
     *  <bbopx.minerva.request_set>
     */
    anchor.remove_fact = function(triple, model_id){
	anchor._ensure_fact(triple);

	var edge_req = new bbopx.minerva.request('edge', 'remove');
	if( model_id ){ edge_req.model(model_id); } // optionally add
	
	edge_req.fact(triple[0], triple[1], triple[2]);
	
	anchor.add(edge_req, 'action');

	return anchor;
    };

    /*
     * Method: add_evidence_to_fact
     * 
     * Adds "anonymous" evidence individual that is referenced in the
     * fact's annotations to the batch.
     * 
     * Arguments:
     *  evidence_id - string
     *  source_id - string
     *  triple - list of three strings: [SUBJECT_ID, OBJECT_ID, PREDICATE_ID]
     *  model_id - *[optional]* string
     * 
     * Returns:
     *  <bbopx.minerva.request_set>
     */
    anchor.add_evidence_to_fact = function(evidence_id, source_id,
					   triple, model_id){
	anchor._ensure_fact(triple);

	// Quick check.
	if( evidence_id && source_id && triple ){

	    // Create floating evidence instance...
	    var ev_ind_req = new bbopx.minerva.request('individual', 'add');
	    if( model_id ){ ev_ind_req.model(model_id); } // optional
	    ev_ind_req.add_class_expression(evidence_id);
	    anchor.add(ev_ind_req, 'action');

	    // Add each source as an annotation to the floating
	    // evidence instance.
	    var ev_ind_ann_req =
		    new bbopx.minerva.request('individual', 'add-annotation');
	    if( model_id ){ ev_ind_ann_req.model(model_id); } // optional
	    ev_ind_ann_req.individual(ev_ind_req.individual());
	    ev_ind_ann_req.add_annotation('source', source_id);
	    anchor.add(ev_ind_ann_req, 'action');
	    
	    // Tie the floating evidence to the edge with an
	    // annotation to the edge.
	    var ev_edge_ann_req =
		    new bbopx.minerva.request('edge', 'add-annotation');
	    if( model_id ){ ev_edge_ann_req.model(model_id); } // optional
	    ev_edge_ann_req.fact(triple[0], triple[1], triple[2]);
	    ev_edge_ann_req.add_annotation('evidence', ev_ind_req.individual());
	    anchor.add(ev_edge_ann_req, 'action');
	}

	return anchor;
    };

    /*
     * Method: add_evidence_to_last_fact
     * 
     * Adds "anonymous" evidence individual that is referenced in the
     * fact's annotations, as well as a fact of it's own to the batch.
     * 
     * *[WARNING: Should only be used once, probably not at all!]*
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

	    anchor.add_evidence_to_fact(evidence_id, source_ids, tmp_triple,
					model_id);
	}

	return anchor;
    };

    /*
     * Method: remove_evidence_from_fact
     * 
     * Remove the evidence annotation from a fact.
     * 
     * Do not need to worry about the "floating" evidence instance
     * made by evidence creation--clean-up will be taken care of by
     * Minerva.
     * 
     * Arguments:
     *  evidence_individual_id - string
     *  triple - list of three strings: [SUBJECT_ID, OBJECT_ID, PREDICATE_ID]
     *  model_id - *[optional]* string
     * 
     * Returns:
     *  <bbopx.minerva.request_set>
     */
    anchor.remove_evidence_from_fact = function(evidence_individual_id,
    						triple, model_id){
	anchor._ensure_fact(triple);
	
    	if( evidence_individual_id && triple ){

	    // In our simplified world, evidence deletion just becomes
	    // a specific case of annotation deletion.
	    anchor.remove_annotation_from_fact(
		'evidence', evidence_individual_id, triple, model_id);
	}

    	return anchor;
    };

    // A helper function to sort out all of the different annotation
    // operations and targets in one function.
    //
    // Args:
    //  op - "add" | "remove"
    //  thing - "model" | "individual" | "fact" 
    //  thing_identifier - ind: id; fact: triple; model: implied
    //  key - string 
    //  value - string
    //  model_id - (optional with fact and individual) string
    anchor._op_annotation_to_target = function(op, target, target_identifier,
					       key, value, model_id){

	// First, decide the request.
	var req = null;
	if( op == 'add' || op == 'remove' ){
	    req = new bbopx.minerva.request(target, op + '-annotation');
	    if( model_id ){ req.model(model_id); } // optional
	}else{
	    throw new Error('unknown annotation operation');
	}

	// Add necessary arguments to identify the target.
	if( target == 'model' ){
	    // Already done.
	}else if( target == 'individual' ){
	    req.individual(target_identifier);
	}else if( target == 'fact' ){
	    anchor._ensure_fact(target_identifier);
	    req.fact(target_identifier[0],
		     target_identifier[1],
		     target_identifier[2]);
	}else{
	    throw new Error('unknown annotation target');
	}

	// Add the annotation.
	if( key && value ){	
	    req.add_annotation(key, value);
	    anchor.add(req, 'action');
	}
    };

    /*
     * Method: add_annotation_to_model
     * 
     * Adds unique key/value set to model.
     * 
     * Arguments:
     *  key - string
     *  value - string
     *  model_id - *[optional]* string
     * 
     * Returns:
     *  <bbopx.minerva.request_set>
     */
    anchor.add_annotation_to_model = function(key, value, model_id){
	anchor._op_annotation_to_target('add', 'model', null,
					key, value, model_id);
	return anchor;
    };

    /*
     * Method: remove_annotation_from_model
     * 
     * Adds unique key/value set to model.
     * 
     * Arguments:
     *  key - string
     *  value - string
     *  model_id - *[optional]* string
     * 
     * Returns:
     *  <bbopx.minerva.request_set>
     */
    anchor.remove_annotation_from_model = function(key, value, model_id){
	anchor._op_annotation_to_target('remove', 'model', null,
					key, value, model_id);
	return anchor;
    };

    /*
     * Method: add_annotation_to_individual
     * 
     * Adds unique key/value set to an individual.
     * 
     * Arguments:
     *  key - string
     *  value - string
     *  individual_id - string
     *  model_id - *[optional]* string
     * 
     * Returns:
     *  <bbopx.minerva.request_set>
     */
    anchor.add_annotation_to_individual = function(key, value, individual_id,
						   model_id){
	anchor._op_annotation_to_target('add', 'individual', individual_id,
					key, value, model_id);
	return anchor;
    };

    /*
     * Method: remove_annotation_from_individual
     * 
     * Removes unique key/value set from an individual.
     * 
     * Arguments:
     *  key - string
     *  value - string
     *  individual_id - string
     *  model_id - *[optional]* string
     * 
     * Returns:
     *  <bbopx.minerva.request_set>
     */
    anchor.remove_annotation_from_individual = function(key, value,
							individual_id, model_id){
	anchor._op_annotation_to_target('remove', 'individual', individual_id,
					key, value, model_id);
	return anchor;
    };

    /*
     * Method: add_annotation_to_fact
     * 
     * Adds unique key/value set to a fact.
     * 
     * Arguments:
     *  key - string
     *  value - string
     *  triple - list of three strings: [SUBJECT_ID, OBJECT_ID, PREDICATE_ID]
     *  model_id - *[optional]* string
     * 
     * Returns:
     *  <bbopx.minerva.request_set>
     */
    anchor.add_annotation_to_fact = function(key, value, triple, model_id){
	anchor._ensure_fact(triple);
	anchor._op_annotation_to_target('add', 'fact',
					triple,	key, value, model_id);
	return anchor;
    };

    /*
     * Method: remove_annotation_from_fact
     * 
     * Removes unique key/value set from a fact.
     * 
     * Arguments:
     *  key - string
     *  value - string
     *  triple - list of three strings: [SUBJECT_ID, OBJECT_ID, PREDICATE_ID]
     *  model_id - *[optional]* string
     * 
     * Returns:
     *  <bbopx.minerva.request_set>
     */
    anchor.remove_annotation_from_fact = function(key, value, triple, model_id){
	anchor._ensure_fact(triple);
	anchor._op_annotation_to_target('remove', 'fact', triple,
					key, value, model_id);
	return anchor;
    };

    /*
     * Method: undo_last_model_batch
     * 
     * Undo the last batch of operations performed on the model.
     * 
     * Arguments:
     *  model_id - *[optional]* string
     * 
     * Returns:
     *  <bbopx.minerva.request_set>
     */
    anchor.undo_last_model_batch = function(model_id){

	var mod_req = new bbopx.minerva.request('model', 'undo');
	if( model_id ){ mod_req.model(model_id); } // optionally add

	anchor.add(mod_req, 'action');

	return anchor;
    };

    /*
     * Method: redo_last_model_batch
     * 
     * Redo the last batch of operations performed on the model.
     * 
     * Arguments:
     *  model_id - *[optional]* string
     * 
     * Returns:
     *  <bbopx.minerva.request_set>
     */
    anchor.undo_last_model_batch = function(model_id){

	var mod_req = new bbopx.minerva.request('model', 'redo');
	if( model_id ){ mod_req.model(model_id); } // optionally add

	anchor.add(mod_req, 'action');

	return anchor;
    };

    /*
     * Method: add_model
     * 
     * Essentially a wrapper for the "generate" class of model
     * methods. The possible seeding arguments fir the argument hash
     * are:
     *  class_id - *[optional]* string; an initial class to build around
     *  database_id - *[optional]* string; the background database
     *  taxon_id - *[optional]* string; the background species
     * 
     * Arguments:
     *  argument_hash - string (see above for properties)
     * 
     * Returns:
     *  <bbopx.minerva.request_set>
     */
    anchor.add_model = function(argument_hash){

	// Work out all incoming arguments to testable state.
	var request_argument = null;
	var cls_id = null;
	var db_id = null;
	var tax_id = null;
	if( ! argument_hash ){
	    request_argument = 'generate-blank';
	    argument_hash = {};
	}else{
	    
	    if( argument_hash['class-id'] ){
		cls_id = argument_hash['class-id'];
	    }
	    if( argument_hash['database-id'] ){
		db_id = argument_hash['database-id'];
	    }
	    if( argument_hash['taxon-id'] ){
		tax_id = argument_hash['taxon-id'];
	    }

	    // Special historical case.
	    if( cls_id && db_id ){
		request_argument = 'generate';
	    }else{
		request_argument = 'generate-blank';
	    }
	}

	// Now that all arguments are defined, build up the request.
	var model_req = new bbopx.minerva.request('model', request_argument);
	if( cls_id ){ model_req.special('subject', cls_id); }
	if( db_id ){ model_req.special('db', db_id); }
	if( tax_id ){ model_req.special('taxon-id', db_id); }
	// Unlikely to have any listeners though...
	anchor.add(model_req, 'action');

	return anchor;
    };

    /*
     * Method: store_model
     * 
     * Store the model to the model store (file on disk as of this
     * writing, but may change soon).
     * 
     * Arguments:
     *  model_id - *[optional]* string
     * 
     * Returns:
     *  <bbopx.minerva.request_set>
     */
    anchor.store_model = function(model_id){

	var store_req = new bbopx.minerva.request('model', 'store');
	if( model_id ){ store_req.model(model_id); } // optionally add

	// No need to broadcast and disrupt to others on the model if
	// it's just this.
	anchor.add(store_req, 'query');

	return anchor;
    };

    /*
     * Method: model_query
     * 
     * The is a catch-all for various non-operating (meta) queries to
     * Minerva about the state of a model.
     * 
     * These *[CANNOT]* be used with any other request.
     * 
     * Code defensively: this is likely to be *[DEPRECATED]* in the
     * near future (once the Minerva meta API is cleaned). TODO.
     * 
     * Arguments:
     *  operation - 'get' and 'get-undo-redo'
     *  model_id - string
     * 
     * Returns:
     *  <bbopx.minerva.request_set>
     */
    anchor.model_query = function(operation, model_id){

	if( operation && model_id ){

	    var req = null;
	    if( operation == 'get' ){
		req = new bbopx.minerva.request('model', 'get');
	    }else if( operation == 'get-undo-redo' ){
		req = new bbopx.minerva.request('model', 'get-undo-redo');
	    }
	}

	if( req ){
	    req.model(model_id);
	    // Just personal question.
	    anchor.add(req, 'query');
	}

	return anchor;
    };

    /*
     * Method: models_query
     * 
     * The is a catch-all for various non-operating (meta) queries to
     * Minerva about the state of all of the known models.
     * 
     * These *[CANNOT]* be used with any other request.
     * 
     * Code defensively: this is likely to be *[DEPRECATED]* in the
     * near future (once the Minerva meta API is cleaned). TODO.
     * 
     * Arguments:
     *  operation - 'all-model-ids' and 'all-model-meta'
     *  model_id - string
     * 
     * Returns:
     *  <bbopx.minerva.request_set>
     */
    anchor.models_query = function(operation, model_id){

	if( operation && model_id ){
	    if( operation == 'all-model-ids' || operation == 'all-model-meta' ){
		var req = new bbopx.minerva.request('model', operation);
		// Just personal question.
		anchor.add(req, 'query');
	    }
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
