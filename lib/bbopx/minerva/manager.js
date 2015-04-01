/* 
 * Package: manager.js
 *
 * Namespace: bbopx.minerva.manager
 *
 * jQuery manager for communication with Minerva (via Barista).
 *
 * See also:
 *  <bbopx.barista.response>
 */

if ( typeof bbopx == "undefined" ){ var bbopx = {}; }
if ( typeof bbopx.minerva == "undefined" ){ bbopx.minerva = {}; }

/*
 * Constructor: manager
 * 
 * A manager for handling the AJAX and registry.
 * Initial take from bbop.golr.manager.
 * 
 * Arguments:
 *  barista_location - string for invariant part of API
 *  namespace - string for namespace of API to use
 *  app_blob - JSON object that defines targets
 *  user_token - identifying string for the user of the manager (Barista token)
 *  engine - *[optional]* AJAX manager client to use (default: jquery)
 *  use_jsonp - *[optional]* wrap requests in JSONP (only usable w/jquery, default: true)
 * 
 * Returns:
 *  a classic manager
 */
bbopx.minerva.manager = function(barista_location, namespace, user_token, 
				 engine, use_jsonp){
    bbop.registry.call(this, ['prerun', // internal; anchor only
			      'postrun', // internal
			      'manager_error', // internal/external...odd
			      //'success', // uninformative
			      'merge',
			      'rebuild',
			      'meta',
			      'warning', // trump
			      'error' //trump
			     ]);
    this._is_a = 'bbopx.minerva.manager';
    var anchor = this;

    //var url = barista_location + '/api/' + namespace + '/m3Batch';
    anchor._url = null;
    // 
    anchor._user_token = user_token;

    // Will use this one other spot, where the user can change the
    // token.
    function _set_url_from_token(in_token){	
	var url = null;
	if( in_token ){
	    url = barista_location + '/api/' + namespace + '/m3BatchPrivileged';
	}else{
	    url = barista_location + '/api/' + namespace + '/m3Batch';
	}
	anchor._url = url;
	return url;
    }
    _set_url_from_token(user_token);

    // // Helper function to add get_undo_redo when the user token
    // // (hopefully good) is defined.
    // function _add_undo_redo_req(req_set, model_id){
    // 	if( anchor._user_token ){
    // 	    var req = new bbopx.minerva.request('model', 'get-undo-redo');
    // 	    req.model(model_id);
    // 	    req_set.add(req);
    // 	}
    // }

    // Select an internal manager for handling the unhappiness of AJAX
    // callbacks.
    var jqm = null;
    if( ! engine ){ engine = 'jquery'; } // default to jquery
    if( engine.toLowerCase() == 'jquery' ){
	jqm = new bbop.rest.manager.jquery(bbopx.barista.response);
    }else if( engine.toLowerCase() == 'node' ){
	jqm = new bbop.rest.manager.node(bbopx.barista.response);
    }else{
	// Default to jQuery.
	engine = 'jquery';
	jqm = new bbop.rest.manager.jquery(bbopx.barista.response);
    }

    // Should JSONP be used for these calls, only for jQuery.
    if( engine.toLowerCase() == 'jquery' ){
	var jsonp_p = true;
	if( typeof(use_jsonp) !== 'undefined' && ! use_jsonp ){
	    jsonp_p = false;
	}
	jqm.use_jsonp(true); // we are definitely doing this remotely
    }

    // How to deal with failure.
    function _on_fail(resp, man){
	// See if we got any traction.
	if( ! resp || ! resp.message_type() || ! resp.message() ){
	    // Something dark has happened, try to put something
	    // together.
	    // console.log('bad resp!?: ', resp);
	    var resp_seed = {
		'message_type': 'error',
		'message': 'deep manager error'
	    };
	    resp = new bbopx.barista.response(resp_seed);
	}
	anchor.apply_callbacks('manager_error', [resp, anchor]);
    }
    jqm.register('error', 'foo', _on_fail);

    // When we have nominal success, we still need to do some kind of
    // dispatch to the proper functionality.
    function _on_nominal_success(resp, man){
	
	// Switch on message type when there isn't a complete failure.
	var m = resp.message_type();
	if( m == 'error' ){
	    // Errors trump everything.
	    anchor.apply_callbacks('error', [resp, anchor]);
	}else if( m == 'warning' ){
	    // Don't really have anything for warning yet...remove?
	    anchor.apply_callbacks('warning', [resp, anchor]);
	}else if( m == 'success' ){
	    var sig = resp.signal();
	    if( sig == 'merge' || sig == 'rebuild' || sig == 'meta' ){
		anchor.apply_callbacks(sig, [resp, anchor]);		
	    }else{
		alert('unknown signal: very bad');
	    }
	}else{
	    alert('unimplemented message_type');	    
	}

	// Postrun goes no matter what.
	anchor.apply_callbacks('postrun', [resp, anchor]);
    }
    jqm.register('success', 'bar', _on_nominal_success);

    ///
    /// Control our identity.
    ///

    /*
     * Method: user_id
     * 
     * DEPRECATED: use user_token()
     * 
     * Arguments:
     *  user_id - string
     * 
     * Returns:
     *  user token
     */
    anchor.user_id = function(user_token){
	return anchor.user_token(user_token);
    };

    /*
     * Method: user_token
     * 
     * Get/set the user token.
     * 
     * Arguments:
     *  user_token - string
     * 
     * Returns:
     *  current user token
     */
    anchor.user_token = function(user_token){

	// Adjust the internal token.
	if( user_token ){
	    anchor._user_token = user_token;
	}

	// Make sure we're using the right URL considering how we're
	// identified.
	_set_url_from_token(anchor._user_token);

	return anchor._user_token;
    };

    ///
    /// Actual mechanism.
    ///

    /*
     * Method: get_model
     * 
     * Trigger a rebuild <bbopx.barista.response> with a model.
     * 
     * Intent: "query".
     * Expect: "success" and "rebuild".
     * 
     * Arguments:
     *  model_id - string
     * 
     * Returns:
     *  n/a
     */
    anchor.get_model = function(model_id){

	// 
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'query');
	var req = new bbopx.minerva.request('model', 'get');
	req.model(model_id);
	reqs.add(req);

	var args = reqs.callable();	
	anchor.apply_callbacks('prerun', [anchor]);
	//console.log('get_model anchor._url: ' + anchor._url);
	//console.log('get_model args: ', args);
	//console.log('get_model ass: ' + jqm.assemble());
	jqm.action(anchor._url, args, 'GET');
    };
    
    /*
     * Method: get_model_ids
     * 
     * Trigger meta <bbopx.barista.response> with a list of all model
     * ids.
     * 
     * Intent: "query".
     * Expect: "success" and "meta".
     * 
     * Arguments:
     *  n/a
     * 
     * Returns:
     *  n/a
     */
    anchor.get_model_ids = function(){

	// 
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'query');
	var req = new bbopx.minerva.request('model', 'all-model-ids');
	reqs.add(req);

	var args = reqs.callable();	
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    /*
     * Method: get_models_meta
     * 
     * Trigger meta <bbopx.barista.response> with a list of all model
     * meta-information.
     * 
     * Intent: "query".
     * Expect: "success" and "meta".
     * 
     * Arguments:
     *  n/a
     * 
     * Returns:
     *  n/a
     */
    anchor.get_models_meta = function(){

	// 
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'query');
	var req = new bbopx.minerva.request('model', 'all-model-meta');
	reqs.add(req);

	var args = reqs.callable();	
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };

    /*
     * Method: get_model_undo_redo
     * 
     * Trigger meta <bbopx.barista.response> of requested model's
     * undo/redo information.
     * 
     * This will make the request whether or not the user has an okay
     * token defined (as opposed to the helper function
     * _add_undo_redo()).
     *
     * Intent: "query".
     * Expect: "success" and "meta".
     * 
     * Arguments:
     *  model_id - string
     * 
     * Returns:
     *  n/a
     */
    anchor.get_model_undo_redo = function(model_id){

	// 
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'query');
	var req = new bbopx.minerva.request('model', 'get-undo-redo');
	req.model(model_id);
	reqs.add(req);

	var args = reqs.callable();	
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    /*
     * Method: perform_undo
     * 
     * Trigger rebuild <bbopx.barista.response> after an attempt to
     * roll back the model to "last" state.
     *
     * Intent: "action".
     * Expect: "success" and "rebuild".
     * 
     * Arguments:
     *  model_id - string
     * 
     * Returns:
     *  n/a
     */
    anchor.perform_undo = function(model_id){

	// 
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('model', 'undo');
	req.model(model_id);
	reqs.add(req);

	var args = reqs.callable();	
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    /*
     * Method: perform_redo
     * 
     * Trigger rebuild <bbopx.barista.response> after an attempt to
     * roll forward the model to "next" state.
     *
     * Intent: "action".
     * Expect: "success" and "rebuild".
     * 
     * Arguments:
     *  model_id - string
     * 
     * Returns:
     *  n/a
     */
    anchor.perform_redo = function(model_id){

	// 
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('model', 'redo');
	req.model(model_id);
	reqs.add(req);

	var args = reqs.callable();	
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    /*
     * Method: add_fact
     * 
     * Trigger merge (or possibly a rebuild) <bbopx.barista.response>
     * on attempt to add a single fact to a model.
     *
     * Intent: "action".
     * Expect: "success" and "merge".
     * 
     * Arguments:
     *  model_id - string
     *  source_id - string
     *  target_id - string
     *  rel_id - string
     * 
     * Returns:
     *  n/a
     */
    anchor.add_fact = function(model_id, source_id, target_id, rel_id){

	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('edge', 'add');
	req.model(model_id);
	req.fact(source_id, target_id, rel_id);
	reqs.add(req);

	var args = reqs.callable();
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    /*
     * Method: remove_fact
     * 
     * Trigger merge (or possibly a rebuild) <bbopx.barista.response>
     * on attempt to remove a single fact to a model.
     *
     * Intent: "action".
     * Expect: "success" and "merge".
     * 
     * Arguments:
     *  model_id - string
     *  source_id - string
     *  target_id - string
     *  rel_id - string
     * 
     * Returns:
     *  n/a
     */
    anchor.remove_fact = function(model_id, source_id, target_id, rel_id){

	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('edge', 'remove');
	req.model(model_id);
	req.fact(source_id, target_id, rel_id);
	reqs.add(req);

	var args = reqs.callable();
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    // // Intent: "action".
    // // Expect: "success" and "merge".
    // anchor.add_individual = function(model_id, class_id){
    // 	// 
    // 	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
    // 	var req = new bbopx.minerva.request('individual', 'add');
    // 	req.model(model_id);
    // 	req.add_class_expression(class_id);
    // 	reqs.add(req);
    // 	var args = reqs.callable();
    // 	anchor.apply_callbacks('prerun', [anchor]);
    // 	jqm.action(anchor._url, args, 'GET');
    // };
    
    /*
     * Method: add_simple_composite
     * 
     * Trigger merge (or possibly a rebuild) <bbopx.barista.response>
     * on attempt to add a simple composite unit (class, enabled_by,
     * and occurs_in) to a model.
     *
     * Intent: "action".
     * Expect: "success" and "merge".
     * 
     * Arguments:
     *  model_id - string
     *  class_id - string
     *  enabled_by_id - string
     *  occurs_in_id - string
     * 
     * Returns:
     *  n/a
     */
    anchor.add_simple_composite = function(model_id, class_id,
    					   enabled_by_id, occurs_in_id){

	// Minimal requirements.
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('individual', 'add');
	req.model(model_id);
     	req.add_class_expression(class_id);

	// Optional set expressions.
	if( enabled_by_id ){
	    //req.add_svf_expression(enabled_by_id, 'enabled_by');
	    req.add_svf_expression(enabled_by_id, 'RO:0002333');
	}
	if( occurs_in_id ){
	    req.add_svf_expression(occurs_in_id, 'occurs_in');	    
	}
	reqs.add(req);

	var args = reqs.callable();
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    /*
     * Method: add_class
     * 
     * Trigger merge (or possibly a rebuild) <bbopx.barista.response>
     * on attempt to add just a class (instance of a class) to an
     * individual in a model.
     *
     * Intent: "action".
     * Expect: "success" and "merge".
     * 
     * Arguments:
     *  model_id - string
     *  individual_id - string
     *  class_id - string
     * 
     * Returns:
     *  n/a
     */
    anchor.add_class = function(model_id, individual_id, class_id){

	// 
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('individual', 'add-type');
	req.model(model_id);
	req.individual(individual_id);
	req.add_class_expression(class_id);

	reqs.add(req);

	var args = reqs.callable();
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    /*
     * Method: add_svf
     * 
     * Trigger merge (or possibly a rebuild) <bbopx.barista.response>
     * on attempt to add an SVF expression to an individual in a
     * model.
     *
     * Intent: "action".
     * Expect: "success" and "merge".
     * 
     * Arguments:
     *  model_id - string
     *  individual_id - string
     *  class_id - string
     *  property_id - string
     * 
     * Returns:
     *  n/a
     */
    anchor.add_svf = function(model_id, individual_id, class_id, property_id){

	// 
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('individual', 'add-type');
	req.model(model_id);
	req.individual(individual_id);
	req.add_svf_expression(class_id, property_id);

	reqs.add(req);

	var args = reqs.callable();
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    /*
     * Method: remove_class
     * 
     * Trigger merge (or possibly a rebuild) <bbopx.barista.response>
     * on attempt to remove a class from an individual in a model.
     *
     * Intent: "action".
     * Expect: "success" and "merge".
     * 
     * Arguments:
     *  model_id - string
     *  individual_id - string
     *  class_id - string
     * 
     * Returns:
     *  n/a
     */
    anchor.remove_class = function(model_id, individual_id, class_id){

	// 
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('individual', 'remove-type');
	req.model(model_id);
	req.individual(individual_id);
	req.add_class_expression(class_id);

	reqs.add(req);

	var args = reqs.callable();
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    /*
     * Method: remove_class_expression
     * 
     * Trigger merge (or possibly a rebuild) <bbopx.barista.response>
     * on attempt to remove a complex class expression from an
     * individual in a model.
     *
     * Intent: "action".
     * Expect: "success" and "merge".
     * 
     * Arguments:
     *  model_id - string
     *  individual_id - string
     *  class_id - string
     *  type - JSON object
     * 
     * Returns:
     *  n/a
     */
    anchor.remove_class_expression = function(model_id, individual_id,
					      class_id, type){

	// 
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('individual', 'remove-type');
	req.model(model_id);
	req.individual(individual_id);
	req.add_complex_class_expression(class_id, type);

	reqs.add(req);

	var args = reqs.callable();
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    /*
     * Method: remove_individual
     * 
     * Trigger a rebuild <bbopx.barista.response> on attempt to remove
     * an individual from a model.
     *
     * Intent: "action".
     * Expect: "success" and "rebuild".
     * 
     * Arguments:
     *  model_id - string
     *  individual_id - string
     * 
     * Returns:
     *  n/a
     */
    anchor.remove_individual = function(model_id, indv_id){

	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('individual', 'remove');
	req.model(model_id);
	req.individual(indv_id);
	reqs.add(req);

	var args = reqs.callable();
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    /*
     * Method: export_model
     * 
     * Trigger a meta <bbopx.barista.response> containing model export
     * text.
     *
     * Intent: "action".
     * Expect: "success" and "meta".
     * 
     * Arguments:
     *  model_id - string
     *  format - *[optional]* string (for legacy, "gaf" or "gpad")
     * 
     * Returns:
     *  n/a
     */
    anchor.export_model = function(model_id, format){

	if( typeof(format) === 'undefined' ){ format = 'default'; }

	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'query');
	var req = null;
	if( format == 'gaf' ){
	    req = new bbopx.minerva.request('model', 'export-legacy');
	    req.special('format', 'gaf');
	}else if( format == 'gpad' ){
	    req = new bbopx.minerva.request('model', 'export-legacy');
	    req.special('format', 'gpad');
	}else{
	    // Default (non-legacy) case is simpler.
	    req = new bbopx.minerva.request('model', 'export');
	}

	// Add the model to the request.
	req.model(model_id);
	reqs.add(req);

	var args = reqs.callable();	
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    /*
     * Method: import_model
     * 
     * Trigger a rebuild response <bbopx.barista.response> for a new
     * model seeded/created from the argument string.
     *
     * Intent: "action".
     * Expect: "success" and "rebuild".
     * 
     * Arguments:
     *  model_string - string representation of a model
     * 
     * Returns:
     *  n/a
     */
    anchor.import_model = function(model_string){

	// 
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('model', 'import');
	req.special('importModel', model_string);
	reqs.add(req);

	var args = reqs.callable();	
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    /*
     * Method: store_model
     * 
     * Trigger a rebuild response <bbopx.barista.response> on a
     * "permanent" store operation on a model.
     *
     * NOTE: I'm actually unsure if this is a rebuild--meta makes more
     * sense, right?
     *
     * Intent: "action".
     * Expect: "success" and "rebuild".
     * 
     * Arguments:
     *  model_id - string
     * 
     * Returns:
     *  n/a
     */
    anchor.store_model = function(model_id){

	// 
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'query');
	var req = new bbopx.minerva.request('model', 'store');
	req.model(model_id);
	reqs.add(req);

	var args = reqs.callable();	
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    /*
     * Method: add_individual_annotation
     * 
     * Trigger a rebuild response <bbopx.barista.response> on an
     * annotation addition to an individual in a model.
     *
     * Intent: "action".
     * Expect: "success" and "rebuild".
     * 
     * Arguments:
     *  model_id - string
     *  indv_id - string
     *  key - string
     *  value - string
     * 
     * Returns:
     *  n/a
     */
    anchor.add_individual_annotation = function(model_id, indv_id, key, value){

	// 
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('individual', 'add-annotation');
	req.model(model_id);
	req.individual(indv_id);
	req.add_annotation(key, value);
	reqs.add(req);

	var args = reqs.callable();	
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    /*
     * Method: add_fact_annotation
     * 
     * Trigger a rebuild response <bbopx.barista.response> on an
     * annotation addition to a referenced fact (edge) in a model.
     *
     * Intent: "action".
     * Expect: "success" and "rebuild".
     * 
     * Arguments:
     *  model_id - string
     *  source_id - string
     *  target_id - string
     *  rel_id - string
     *  key - string
     *  value - string
     * 
     * Returns:
     *  n/a
     */
    anchor.add_fact_annotation = function(model_id,
					  source_id, target_id, rel_id,
					  key, value){

	//
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('edge', 'add-annotation');
	req.model(model_id);
	req.fact(source_id, target_id, rel_id);
	req.add_annotation(key, value);
	reqs.add(req);

	var args = reqs.callable();
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    /*
     * Method: add_model_annotation
     * 
     * Trigger a rebuild response <bbopx.barista.response> on an
     * annotation addition to a model.
     *
     * Intent: "action".
     * Expect: "success" and "rebuild".
     * 
     * Arguments:
     *  model_id - string
     *  key - string
     *  value - string
     * 
     * Returns:
     *  n/a
     */
    anchor.add_model_annotation = function(model_id, key, value){

	// 
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('model', 'add-annotation');
	req.model(model_id);
	req.add_annotation(key, value);
	reqs.add(req);

	var args = reqs.callable();	
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    /*
     * Method: remove_individual_annotation
     * 
     * Trigger a rebuild response <bbopx.barista.response> on an
     * annotation removeal from an individual in a model.
     *
     * Intent: "action".
     * Expect: "success" and "rebuild".
     * 
     * Arguments:
     *  model_id - string
     *  indv_id - string
     *  key - string
     *  value - string
     * 
     * Returns:
     *  n/a
     */
    anchor.remove_individual_annotation =function(model_id, indv_id, key, value){

	// 
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('individual', 'remove-annotation');
	req.model(model_id);
	req.individual(indv_id);
	req.add_annotation(key, value);
	reqs.add(req);

	var args = reqs.callable();	
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    /*
     * Method: remove_fact_annotation
     * 
     * Trigger a rebuild response <bbopx.barista.response> on an
     * annotation removeal from a referenced fact (edge) in a model.
     *
     * Intent: "action".
     * Expect: "success" and "rebuild".
     * 
     * Arguments:
     *  model_id - string
     *  source_id - string
     *  target_id - string
     *  rel_id - string
     *  key - string
     *  value - string
     * 
     * Returns:
     *  n/a
     */
    anchor.remove_fact_annotation = function(model_id,
					     source_id, target_id, rel_id,
					     key, value){

	//
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('edge', 'remove-annotation');
	req.model(model_id);
	req.fact(source_id, target_id, rel_id);
	req.add_annotation(key, value);
	reqs.add(req);

	var args = reqs.callable();	
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    /*
     * Method: remove_model_annotation
     * 
     * Trigger a rebuild response <bbopx.barista.response> on an
     * annotation removal from a model.
     *
     * Intent: "action".
     * Expect: "success" and "rebuild".
     * 
     * Arguments:
     *  model_id - string
     *  key - string
     *  value - string
     * 
     * Returns:
     *  n/a
     */
    anchor.remove_model_annotation =function(model_id, key, value){

	// 
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('model', 'remove-annotation');
	req.model(model_id);
	req.add_annotation(key, value);
	reqs.add(req);

	var args = reqs.callable();	
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    /*
     * Method: generate_model_by_class_and_db
     * 
     * Trigger a rebuild response <bbopx.barista.response> on
     * attempting to create a new model by providing a starting class
     * and a database identifier (see GAF extensions).
     *
     * Intent: "action".
     * Expect: "success" and "rebuild".
     * 
     * Arguments:
     *  class_id - string
     *  db_id - string (hope you guess right--as GAF extension)
     * 
     * Returns:
     *  n/a
     */
    anchor.generate_model_by_class_and_db = function(class_id, db_id){

	//
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('model', 'generate');
	req.special('db', db_id);
	req.special('subject', class_id);
	reqs.add(req);

	var args = reqs.callable();	
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    /*
     * Method: generate_model_by_db
     * 
     * Trigger a rebuild response <bbopx.barista.response> on
     * attempting to create a new model by providing a database
     * identifier (see GAF extensions).
     *
     * Intent: "action".
     * Expect: "success" and "rebuild".
     * 
     * Arguments:
     *  db_id - string (hope you guess right--as GAF extension)
     * 
     * Returns:
     *  n/a
     */
    anchor.generate_model_by_db = function(db_id){

	//
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('model', 'generate-blank');
	req.special('db', db_id);
	reqs.add(req);
	
	var args = reqs.callable();	
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    /*
     * Method: generate_model_by_taxon
     * 
     * Trigger a rebuild response <bbopx.barista.response> on
     * attempting to create a new model by providing a database
     * identifier (see GAF extensions).
     *
     * Intent: "action".
     * Expect: "success" and "rebuild".
     * 
     * Arguments:
     *  taxon_id - string (full ncbi)
     * 
     * Returns:
     *  n/a
     */
    anchor.generate_model_by_taxon = function(taxon_id){

	//
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('model', 'generate-blank');
	req.special('taxonId', taxon_id);
	reqs.add(req);
	
	var args = reqs.callable();	
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    /*
     * Method: generate_model
     * 
     * Trigger a rebuild response <bbopx.barista.response> on
     * attempting to create a new model...from nothing.
     *
     * Intent: "action".
     * Expect: "success" and "rebuild".
     * 
     * Arguments:
     *  n/a
     * 
     * Returns:
     *  n/a
     */
    anchor.generate_model = function(){

	//
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('model', 'generate-blank');
	reqs.add(req);
	
	var args = reqs.callable();	
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    /*
     * Method: capella_bootstrap_model
     * 
     * Trigger a rebuild response <bbopx.barista.response> on
     * attempting to create a new model with information provided by
     * Capella.
     *
     * If you're attempting to use this, you probably want to revisit
     * everything and everbody first...
     *
     * Intent: "action".
     * Expect: "success" and "rebuild".
     * 
     * Arguments:
     *  bootstrap_obj - JSON object ???
     *  term2aspect - ???
     * 
     * Returns:
     *  n/a
     */
    anchor.capella_bootstrap_model = function(bootstrap_obj, term2aspect){

	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');

	// Just get a new model going.
	var req = new bbopx.minerva.request('model', 'generate-blank');
	//req.special('db', db_id); // unecessary
	reqs.add(req);

	var each = bbop.core.each;
	each(bootstrap_obj, function(ob){

	    // Now, for each of these, we are going to be adding
	    // stuff to MF instances. If there is no MF coming
	    // in, we are just going to use GO:0003674.
	    var mfs = [];
	    var bps = [];
	    var ccs = [];
	    each(ob['terms'], function(tid){
		if( term2aspect[tid] == 'molecular_function' ){
		    mfs.push(tid);
		}else if( term2aspect[tid] == 'biological_process' ){
		    bps.push(tid);
		}else if( term2aspect[tid] == 'cellular_component' ){
		    ccs.push(tid);
		}
	    });
	    // There must be this no matter what.
	    if( bbop.core.is_empty(mfs) ){
 		mfs.push('GO:0003674');
	    }

	    // We are going to be creating instances off of the
	    // MFs.
	    each(mfs, function(mf){
		var req = new bbopx.minerva.request('individual', 'add');
			  
		// Add in the occurs_in from CC.
		each(ccs, function(cc){
		    req.add_svf_expression(cc, 'occurs_in');
		});

		// Add in the enabled_by from entities.
		each(ob['entities'], function(ent){
		    req.add_svf_expression(ent, 'RO:0002333');
		});
	    });
	});

	// Final send-off.
	var args = reqs.callable();	
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    /*
     * Method: DO_NOT_USE_THIS
     * 
     * WARNING: Apparently you feel that this needs more
     * explanation. Please read the method name again and
     * ponder. Seriously, this will mess you up. This is just a hook
     * for very alpha manager experiments.
     *
     * Intent: "action".
     * Expect: "success" and "rebuild".
     * 
     * Arguments:
     *  model_id - string
     * 
     * Returns:
     *  n/a
     */
    anchor.DO_NOT_USE_THIS = function(model_id){
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');

	// New process individual.
	var ind1_req = new bbopx.minerva.request('individual', 'add');
	ind1_req.model(model_id);
	ind1_req.add_class_expression('GO:0022008'); // neurogenesis
	reqs.add(ind1_req);
	
	// New component (location) individual.
	var ind2_req = new bbopx.minerva.request('individual', 'add');
	ind2_req.model(model_id);
	ind2_req.add_class_expression('GO:0004464'); // cell part
	reqs.add(ind2_req);	

	// ind1 occurs_in ind2.
	var e2_req = new bbopx.minerva.request('edge', 'add');
	e2_req.model(model_id);
	e2_req.fact(ind1_req.individual(), ind2_req.individual(), 'occurs_in');
	reqs.add(e2_req);

	// // Drd3.
	// var ind3_req = new bbopx.minerva.request('individual', 'add');
	// ind3_req.model(model_id);
	// ind3_req.add_class_expression('MGI:MGI:94925'); // Drd3
	// reqs.add(ind3_req);
	
	// // ind1 enabled_by ind3.
	// var e1_req = new bbopx.minerva.request('edge', 'add');
	// e1_req.model(model_id);
	// e1_req.fact(ind1_req.individual(), ind3_req.individual(), 'RO:0002333');
	// reqs.add(e1_req);

	var args = reqs.callable();	
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
};
bbop.core.extend(bbopx.minerva.manager, bbop.registry);
