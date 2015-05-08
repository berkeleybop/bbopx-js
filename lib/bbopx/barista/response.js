/* 
 * Package: response.js
 * 
 * Namespace: bbopx.barista.response
 * 
 * Generic BBOP handler for dealing with the gross parsing of
 * responses from the GO Molecular Model Manager REST server JSON
 * responses.
 * 
 * It will detect if the incoming response is structured correctly and
 * give safe access to fields and properties.
 * 
 * It is not meant to be a model for the parts in the data section.
 */

// if ( typeof bbop == "undefined" ){ var bbop = {}; }
// if ( typeof bbop.rest == "undefined" ){ bbop.rest = {}; }
// if ( typeof bbop.rest.response == "undefined" ){ bbop.rest.response = {}; }
// TODO/BUG: workaround until I get this properly folded into bbop-js.
if ( typeof bbopx == "undefined" ){ var bbopx = {}; }
if ( typeof bbopx.barista == "undefined" ){ bbopx.barista = {}; }

/*
 * Constructor: response
 * 
 * Contructor for a Minerva REST JSON response object.
 * 
 * The constructor argument is an object or a string.
 * 
 * Arguments:
 *  raw - the JSON object as a string or object
 * 
 * Returns:
 *  response object
 */
bbopx.barista.response = function(raw){
    bbop.rest.response.call(this);
    this._is_a = 'bbopx.barista.response';

    // Required top-level strings in the response.
    // message and message_type are defined in the superclass.
    this._uid = null; // initiating user
    this._packet_id = null; // identify the packet
    this._intention = null; // what the user wanted to do ('query', 'action')
    this._signal = null; // 'merge', 'rebuild', 'meta', etc.

    // Optional top-level strings in the response.
    this._commentary = null;

    // Optional top-level objects.
    // Data contains model_id, inconsistency, etc.
    this._data = null;

    // Start with the assumption that the response is bad, try and
    // prove otherwise.
    this.okay(false);

    // Raw will only be provided in that cases that it makes sense.
    this._raw = null;
    
    // If we have no data coming in, there is a problem...
    if( ! raw ){
	
	this.message('empty response in handler');
	this.message_type('error');

    }else{

	// If we do have something coming in, And it looks like
	// something we might be able to deal with, do our best to
	// decode it.
	var itsa = bbop.core.what_is(raw);
	if( itsa != 'string' && itsa != 'object' ){
	    
	    // No idea what this thing is...
	    this.message('bad argument type in handler');
	    this.message_type('error');

	}else{
	    
	    // Try to make the string an object.
	    if( itsa == 'string' ){
		try {
		    this._raw = bbop.json.parse(raw);
		}catch(e){
		    // Didn't make it--chuck it to create a signal.
		    this._raw = null;
		    this.message('handler could not parse string response');
		    this.message_type('error');
		}
	    }else{
		// Looks like somebody else got here first.
		this._raw = raw;
	    }

	    // If we managed to define some kind of raw incoming data
	    // that is (or has been parsed to) a model, start probing
	    // it out to see if it is structured correctly.
	    if( this._raw ){

		// Check required fields.
		var jresp = this._raw;
		// These must always be defined.
		if( ! jresp['message-type'] || ! jresp['message'] ){
		    // Core info.
		    this.message_type('error');
		    this.message('message and message_type must always exist');
		}else{

		    // Take out the individual optional bits for
		    // examination.
		    var cdata = jresp['commentary'] || null;
		    var odata = jresp['data'] || null;

		    // If data, object.
		    if( odata && bbop.core.what_is(odata) != 'object' ){
		    // if( odata && bbop.core.what_is(odata) != 'object' &&
		    // 	bbop.core.what_is(odata) != 'array' ){
			this.message('data not object');
			this.message_type('error');
		    }else{
			// If commentary, string.
			if( cdata && bbop.core.what_is(cdata) != 'string' ){
			    this.message('commentary not string');
			    this.message_type('error');
			}else{
			    // Looks fine then I guess.
			    this.okay(true);

			    // Super-class.
			    this.message_type(jresp['message-type']);
			    this.message(jresp['message']);

			    // Plug in the other required fields.
			    this._uid = jresp['uid'] || 'unknown';
			    this._intention = jresp['intention'] || 'unknown';
			    this._signal = jresp['signal'] || 'unknown';
			    this._packet_id = jresp['packet-id'] || 'unknown';

			    // Add any additional fields.
			    if( cdata ){ this._commentary = cdata; }
			    if( odata ){ this._data = odata; }
			}
		    }
		}
	    }
	}
    }
};
bbop.core.extend(bbopx.barista.response, bbop.rest.response);

/*
 * Function: user_id
 * 
 * Returns the user id (uid) for a call if it was generated my a known
 * user.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  string or null
 */
bbopx.barista.response.prototype.user_id = function(){
    var ret = null;
    if( this._uid ){ ret = this._uid; }
    return ret;
};

/*
 * Function: intention
 * 
 * Returns the user intention for a call.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  string or null
 */
bbopx.barista.response.prototype.intention = function(){
    var ret = null;
    if( this._intention ){ ret = this._intention; }
    return ret;
};

/*
 * Function: signal
 * 
 * Returns the server's action signal, if there was one.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  string or null
 */
bbopx.barista.response.prototype.signal = function(){
    var ret = null;
    if( this._signal ){ ret = this._signal; }
    return ret;
};

/*
 * Function: packet_id
 * 
 * Returns the response's unique id. Usful to make sure you're not
 * talking to yourself in some cases.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  string or null
 */
bbopx.barista.response.prototype.packet_id = function(){
    var ret = null;
    if( this._packet_id ){ ret = this._packet_id; }
    return ret;
};

/*
 * Function: commentary
 * 
 * Returns the commentary object (whatever that might be in any given
 * case).
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  copy of commentary object or null
 */
bbopx.barista.response.prototype.commentary = function(){
    var ret = null;
    if( this._commentary ){
	ret = bbop.core.clone(this._commentary);
    }
    return ret;
};

/*
 * Function: data
 * 
 * Returns the data object (whatever that might be in any given
 * case). This grossly returns all response data, if any.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  copy of data object or null
 */
bbopx.barista.response.prototype.data = function(){
    var ret = null;
    if( this._data ){
	ret = bbop.core.clone(this._data);
    }
    return ret;
};

/*
 * Function: model_id
 * 
 * Returns the model id of the response.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  string or null
 */
bbopx.barista.response.prototype.model_id = function(){
    var ret = null;
    if( this._data && this._data['id'] ){
	ret = this._data['id'];
    }
    return ret;
};

/*
 * Function: inconsistent_p
 * 
 * Returns true or false on whether or not the returned model is
 * thought to be inconsistent. Starting assumption is that it is not.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  true or false
 */
bbopx.barista.response.prototype.inconsistent_p = function(){
    var ret = false;
    if( this._data &&
	typeof(this._data['inconsistent-p']) !== 'undefined' &&
	this._data['inconsistent-p'] == true ){
	ret = true;
    }
    return ret;
};

/*
 * Function: has_undo_p
 * 
 * Returns a true or false depending on the existence an undo list.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  boolean
 */
bbopx.barista.response.prototype.has_undo_p = function(){
    var ret = false;
    if( this._data && this._data['undo'] && 
	bbop.core.is_array(this._data['undo']) &&
	this._data['undo'].length > 0 ){
	ret = true;
    }
    return ret;
};

/*
 * Function: has_redo_p
 * 
 * Returns a true or false depending on the existence a redo list.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  boolean
 */
bbopx.barista.response.prototype.has_redo_p = function(){
    var ret = false;
    if( this._data && this._data['redo'] && 
	bbop.core.is_array(this._data['redo']) &&
	this._data['redo'].length > 0 ){
	ret = true;
    }
    return ret;
};

/*
 * Function: facts
 * 
 * Returns a list of the facts in the response. Empty list if none.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  list
 */
bbopx.barista.response.prototype.facts = function(){
    var ret = [];
    if( this._data && this._data['facts'] && 
	bbop.core.is_array(this._data['facts']) ){
	ret = this._data['facts'];
    }
    return ret;
};

/*
 * Function: properties
 * 
 * Returns a list of the properties in the response. Empty list if none.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  list
 */
bbopx.barista.response.prototype.properties = function(){
    var ret = [];
    if( this._data && this._data['properties'] && 
	bbop.core.is_array(this._data['properties']) ){
	ret = this._data['properties'];
    }
    return ret;
};

/*
 * Function: individuals
 * 
 * Returns a list of the individuals in the response. Empty list if none.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  list
 */
bbopx.barista.response.prototype.individuals = function(){
    var ret = [];
    if( this._data && this._data['individuals'] && 
	bbop.core.is_array(this._data['individuals']) ){
	ret = this._data['individuals'];
    }
    return ret;
};

/*
 * Function: inferred_individuals
 * 
 * Returns a list of the inferred_individuals in the response. Empty
 * list if none.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  list
 */
bbopx.barista.response.prototype.inferred_individuals = function(){
    var ret = [];
    if( this._data && this._data['individuals-i'] && 
	bbop.core.is_array(this._data['individuals-i']) ){
	ret = this._data['individuals-i'];
    }
    return ret;
};

/*
 * Function: annotations
 * 
 * Returns a list of the (complex) annotations found in the
 * response. Sometimes not there, so check the return.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  list
 */
bbopx.barista.response.prototype.annotations = function(){
    var ret = [];
    if( this._data && this._data['annotations'] && 
	bbop.core.is_array(this._data['annotations']) ){
	ret = this._data['annotations'];
    }
    return ret;
};

/*
 * Function: export
 * 
 * Returns the string of the export found in the return.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  string
 */
bbopx.barista.response.prototype.export_model = function(){
    var ret = '';
    if( this._data && this._data['export'] ){
	ret = this._data['export'];
    }
    return ret;
};

/*
 * Function: relations
 * 
 * Returns a list of the relations found in the response. Sometimes not
 * there, so check the return.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  list
 */
bbopx.barista.response.prototype.relations = function(){
    var ret = [];
    if( this._data && this._data['meta'] && this._data['meta']['relations'] && 
	bbop.core.is_array(this._data['meta']['relations']) ){
	ret = this._data['meta']['relations'];
    }
    return ret;
};

/*
 * Function: evidence
 * 
 * Returns a list of the evidence found in the response. Sometimes not
 * there, so check the return.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  list
 */
bbopx.barista.response.prototype.evidence = function(){
    var ret = [];
    if( this._data && this._data['meta'] && this._data['meta']['evidence'] && 
	bbop.core.is_array(this._data['meta']['evidence']) ){
	ret = this._data['meta']['evidence'];
    }
    return ret;
};

/*
 * Function: model_ids
 * 
 * Returns a list the model ids found in the response. Sometimes not
 * there, so check the return.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  list
 *
 * See Also:
 *  <models_meta>
 */
bbopx.barista.response.prototype.model_ids = function(){
    var ret = [];
    if( this._data && this._data['meta'] && this._data['meta']['model-ids'] && 
	bbop.core.is_array(this._data['meta']['model-ids']) ){
	ret = this._data['meta']['model-ids'];
    }
    return ret;
};

/*
 * Function: models_meta
 * 
 * Returns a hash of the model ids to models properties found in the
 * response.
 *
 * Sometimes not there, so check the return.
 *
 * WARNING: A work in progress, but this is intended as an eventual
 * replacement to model_ids.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  hash
 *
 * See Also:
 *  <model_ids>
 */
bbopx.barista.response.prototype.models_meta = function(){
    var ret = {};
    if( this._data && this._data['meta'] && this._data['meta']['models-meta'] && 
	bbop.core.is_hash(this._data['meta']['models-meta']) ){
	ret = this._data['meta']['models-meta'];
    }
    return ret;
};

///
/// TODO: Experiment done: move all below into the bbopx.noctua.edit
///

// /*
//  * Function: graph
//  * 
//  * *[This is a work in progress.]*
//  * 
//  * Returns a <bbop.model.graph> that represents the graph structure of
//  * the returned data.
//  *
//  * This is essentially an attempt at rolling individual, facts,
//  * (model) annotations, and inferred individuals into a single
//  * coherent object that can then be used to create different editorial
//  * views.
//  *
//  * This graph represents a few things in non-obvious ways. For
//  * example, there is heavy use of the meta property of the edges,
//  * nodes, and graph:
//  *
//  * : {
//  * :  annotations: {comment: [], ...},
//  * :  inferred_types: [], // nodes only
//  * :  evidence: [], // depending on compression type
//  * :  subgraphs: [], // depending on compression type
//  * :  ...
//  * : }
//  *
//  * Also there (will be) different versions of the graph created
//  * depending on the compression type.
//  *
//  * *[none]* the graph is rendered as given, with no attempts to fold away irritating or confusing abstractions; the only addition is to add inferred types (for nodes) to the metadata
//  *
//  * *[evidence]* is similar to 'none', except that the implied evidence is folded into the metadata of the ; no singleton evidence individuals should be present
//  *
//  * *[go-editor]* this is the version for the GO graph editor; it has enabled_by and occurs_in relations folded into the "nested" section (model TBD)
//  *
//  * Arguments:
//  *  comppression_type - *[optional]* 'none', 'evidence', 'go-editor'  (default 'none')
//  * 
//  * Returns:
//  *  <bbop.model.graph> or null
//  */
// bbopx.barista.response.prototype.graph = function(){

//     var anchor = this;

//     // All the information that we'll need; could maybe be passed as
//     // arguments to a separate graph system in the future (think a
//     // noctua subclass of bbop-graph).
//     var mid = resp.model_id();
//     var mindividuals = resp.individuals();
//     var mindividuals_i = resp.inferred_individuals();
//     var mfacts = resp.facts();
//     var mannotations = resp.annotations();

//     // // Okay, connectons 
//     // var _connecton = function(){
	
//     // }

//     // Create a metadata model to work with for the time being.
//     var _metadata = function(){
// 	var anchor = this;

// 	// Defaults.
// 	anchor._annotations = [];
// 	//anchor._inferred_types = [];
// 	anchor._evidence = [];
// 	//anchor._subgraphs = [];

// 	//
// 	anchor.add_annotation = function(key, value){
// 	    anchor._annotations.push({
// 		'key': key,
// 		'value': value
// 	    });
// 	};

// 	// Return list or null.
// 	anchor.get_annotations = function(key, value){
// 	    var ret = null

// 	    // Collect all the annotations that fit the profile.
// 	    var anns = [];
// 	    bbop.core.each(anchor._annotations, function(a){
// 		if( key && value ){
// 		    // Must match key and value.
// 		    if( a['key'] == key && a['value'] == value ){
// 			anns.push(a);
// 		    }
// 		}else if( key ){
// 		    // Must match key.
// 		    if( a['key'] == key ){
// 			anns.push(a);
// 		    }
// 		}else{
// 		    // Any annotation.
// 		    anns.push(a);
// 		}
// 	    });

// 	    // Only switch if we got anns.
// 	    if( anns.length > 0 ){ ret = anns; }

// 	    return ret;
// 	};

// 	//
// 	anchor.add_evidence = function(source_id, evidence_id, evidence_lbl){
// 	    anchor._evidence.push({
// 		'source_id': source_id,
// 		'evidence_id': evidence_id,
// 		'evidence_label': (evidence_lbl || evidence_id)
// 	    });
// 	};

// 	//
// 	anchor.get_evidence = function(){
// 	    return anchor._evidence;
// 	};
//     };

//     // First, create the graph and add id and annotation metadata to
//     // it.
//     var graph = new bbop.model.graph();
//     graph.id(mid);
//     var graph_metadata = new _metadata();
//     bbop.core.each(mannotations, function(a){
// 	graph_metadata.add_annotation(a);
//     });
//     // _rebuild_meta(model_id, annotations);
//     graph.metadata(graph_metadata);

//     // Assemble the nodes one of three ways (with some overlap): 'none', 'evidence', and 
//     // _squeeze_inferred

//     return graph;
// };
