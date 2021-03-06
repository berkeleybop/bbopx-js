/*
 * Package: edit.js
*
* Core edit model.
*
* Unlike the first versions of this, which were very loose, we have
* a good idea of where we want to go now that we have some
* experience. Essentially, this will be a subclass of the bbop graph
* model, but retaining all of the nice mapping and ordering
* functionality that we've gotten used to.
*
 */

if ( typeof bbopx == "undefined" ){ var bbopx = {}; }
if ( typeof bbopx.noctua == "undefined" ){ bbopx.noctua = {}; }
if ( typeof bbopx.noctua.edit == "undefined" ){ bbopx.noctua.edit = {}; }

/*
 * Namespace: bbopx.noctua.edit.annotation
 * 
 * Object for keeping track of our annotations.
 */

/*
 * Constructor: annotation
 *
 * Edit annotations.
 * Everything can take annotations.
 * 
 * This structure of the raw key-value set has been updated in the
 * wire protocol. It now looks like:
 * 
 * : {"key": "contributor", "value": "GOC:kltm" }
 * 
 * Arguments:
 *  kv_set - *[optional]* a set of keys and values; a simple object
 *
 * Returns:
 *  new instance
 */
bbopx.noctua.edit.annotation = function(kv_set){
    this._id = bbop.core.uuid();

    this._properties = {};

    if( kv_set && bbop.core.what_is(kv_set) == 'object' ){

	// Attempt to convert
	if( kv_set['key'] && kv_set['value'] ){
	    var key = kv_set['key'];
	    var val = kv_set['value'];
	    var adj_set = {};
	    adj_set[key] = val;
	    this._properties = bbop.core.clone(adj_set);
	}else{
	    console.log('bad annoatation k/v set: ', kv_set);
	}
    }
};

/*
 * Function: id
 *
 * The unique id of this annotation.
 *
 * Parameters: 
 *  n/a 
 *
 * Returns: 
 *  string
 */
bbopx.noctua.edit.annotation.prototype.id = function(){ return this._id; };

/*
 * Function: property
 *
 * 
 *
 * Parameters: 
 *  key - string
 *  value - string
 *
 * Returns: 
 *  n/a
 */
bbopx.noctua.edit.annotation.prototype.property = function(key, value){

    var anchor = this;
    var ret = null;

    // Set if the key and value are there.
    if( key ){
	if( typeof(value) !== 'undefined' ){
	    anchor._properties[key] = value;
	}
	ret = anchor._properties[key];
    }

    return ret;
};

bbopx.noctua.edit.annotation.prototype.delete_property = function(key){

    var anchor = this;
    var ret = null;

    if( key ){
	ret = delete anchor._properties[key];
    }

    return ret;
};

///
/// Generic annotation operations
///

bbopx.noctua.edit._annotations = function(in_ann){
    if( in_ann && bbop.core.what_is(in_ann) == 'array' ){
	this._annotations = in_ann;
    }
    return this._annotations;
};
bbopx.noctua.edit._add_annotation = function(in_ann){
    if( in_ann && bbop.core.what_is(in_ann) != 'array' ){
	this._annotations.push(in_ann);
    }
    return this._annotations;
};
bbopx.noctua.edit._get_annotations_by_filter = function(filter){

    var anchor = this;
    var ret = [];
    bbop.core.each(anchor._annotations, function(ann){
	var res = filter(ann);
	if( res && res == true ){
	    ret.push(ann);
	}
    });
    return ret;
};
bbopx.noctua.edit._get_annotation_by_id = function(aid){

    var anchor = this;
    var ret = null;
    bbop.core.each(anchor._annotations, function(ann){
	if( ann.id() == aid ){
	    ret = ann;
	}
    });
    return ret;
};

/*
 *  Edit control.
 * 
 * Parameters:
 *  n/a
 */
bbopx.noctua.edit.core = function(){
    this.core = {
	//'id': [], // currently optional
	'id': null, // currently optional
	'nodes': {}, // map of id to edit_node
	'edges': {}, // map of id to edit_edge
	'node_order': [], // initial table order on redraws
	'node2elt': {}, // map of id to physical object id
	'elt2node': {},  // map of physical object id to id
	// Remeber that edge ids and elts ids are the same, so no map
	// is needed.
	'edge2connector': {}, // map of edge id to virtual connector id
	'connector2edge': {}  // map of virtual connector id to edge id 
    };

    this._annotations = [];
};

bbopx.noctua.edit.core.prototype.add_id = function(id){
    // TODO: make this smarter/useful
    //this.core['id'].push(id);
    this.core['id'] = id;
    return this.core['id'];
};

bbopx.noctua.edit.core.prototype.get_id = function(){
    return this.core['id'];
};

bbopx.noctua.edit.core.prototype.add_node = function(enode){

    // Add/update node.
    var enid = enode.id();
    this.core['nodes'][enid] = enode; // add to nodes

    // Only create a new elt ID and order if one isn't already in
    // there (or reuse things to keep GUI working smoothly).
    var elt_id = this.core['node2elt'][enid];
    if( ! elt_id ){ // first time
	this.core['node_order'].unshift(enid); // add to default order
	elt_id = bbop.core.uuid(); // generate the elt id we'll use from now on
	this.core['node2elt'][enid] = elt_id; // map it
	this.core['elt2node'][elt_id] = enid; // map it	
    }
};

// Convert the JSON-LD lite model into the edit core.
// Creates or adds as necessary.
bbopx.noctua.edit.core.prototype.add_node_from_individual = function(indv){
    var anchor = this;

    var ret = null;

    // Add individual to edit core if properly structured.
    var iid = indv['id'];
    if( iid ){
	//var nn = new bbop.model.node(indv['id']);
	//var meta = {};
	//ll('indv');
	
	// See if there is type info that we want to add.
	var itypes = indv['type'] || [];
	if( bbop.core.what_is(itypes) != 'array' ){
	    throw new Error('types is wrong');
	}

	// Create the node.
	var ne = new bbopx.noctua.edit.node(iid, itypes, ianns);

	// See if there is type info that we want to add.
	var ianns = indv['annotations'] || [];
	if( bbop.core.what_is(ianns) != 'array' ){
	    throw new Error('annotations is wrong');
	}else{
	    // Add the annotations individually.
	    bbop.core.each(ianns, function(ann_kv_set){
		var na = new bbopx.noctua.edit.annotation(ann_kv_set);
		ne.add_annotation(na);
	    });
	}

	anchor.add_node(ne);
	ret = ne;
    }
    
    return ne;
};

bbopx.noctua.edit.core.prototype.edit_node_order = function(){
    return this.core['node_order'] || [];
};

bbopx.noctua.edit.core.prototype.get_node = function(enid){
    return this.core['nodes'][enid] || null;
};

bbopx.noctua.edit.core.prototype.get_node_elt_id = function(enid){
    return this.core['node2elt'][enid] || null;
};

bbopx.noctua.edit.core.prototype.get_node_by_elt_id = function(elt_id){
    var ret = null;
    var enid = this.core['elt2node'][elt_id] || null;
    if( enid ){
	ret = this.core['nodes'][enid] || null;
    }
    return ret;
};

bbopx.noctua.edit.core.prototype.get_node_by_individual = function(indv){
    var anchor = this;

    var ret = null;

    // Add individual to edit core if properly structured.
    var iid = indv['id'];
    if( iid ){	
	ret = this.core['nodes'][iid] || null;
    }
    
    return ret;
};

bbopx.noctua.edit.core.prototype.get_nodes = function(){
    return this.core['nodes'] || {};
};

bbopx.noctua.edit.core.prototype.remove_node = function(enid){

    var anchor = this;

    if( this.core['nodes'][enid] ){
	var enode = this.core['nodes'][enid];

	// Removing node removes all related edges.
	// TODO: Dumb scan right now.
	bbop.core.each(this.core['edges'], function(edge_id, edge){
	    if( edge.source() == enid || edge.target() == enid ){
		var eeid = edge.id();
		anchor.remove_edge(eeid);
	    }
	});
	
	// Also remove the node from the order list.
	// TODO: Is this a dumb scan?
	var ni = this.core['node_order'].indexOf(enid);
	if( ni != -1 ){
	    this.core['node_order'].splice(ni, 1);
	}

	// Clean the maps.
	var elt_id = this.core['node2elt'][enid];
	delete this.core['node2elt'][enid];
	delete this.core['elt2node'][elt_id];

	// Finally, remove the node itself.
	delete this.core['nodes'][enid];
    }
};

bbopx.noctua.edit.core.prototype.add_edge = function(eedge){
    var eeid = eedge.id();
    this.core['edges'][eeid] = eedge;
    var elt_id = bbop.core.uuid(); // generate the elt id we'll use
    //this.core['edge2elt'][eeid] = elt_id; // map it
    //this.core['elt2edge'][elt_id] = eeid; // map it
};

// 
bbopx.noctua.edit.core.prototype.add_edge_from_fact = function(fact, aid){

    var anchor = this;
    var each = bbop.core.each;

    var ret_fact = null;
    
    // Add individual to edit core if properly structured.
    var sid = fact['subject'];
    var oid = fact['object'];
    var pid = fact['property'];
    var anns = fact['annotations'] || [];
    if( sid && oid && pid ){

	var en = new bbopx.noctua.edit.edge(sid, pid, oid, anns);
	if( bbop.core.what_is(anns) != 'array' ){
	    throw new Error('annotations is wrong');
	}else{
	    // Add the annotations individually.
	    bbop.core.each(anns, function(ann_kv_set){
		var na = new bbopx.noctua.edit.annotation(ann_kv_set);
		en.add_annotation(na);
	    });
	}

	// Add and ready to return edge.
	anchor.add_edge(en);
	ret_fact = en;
    }
    
    return ret_fact;
};

bbopx.noctua.edit.core.prototype.get_edge_id_by_connector_id = function(cid){
    return this.core['connector2edge'][cid] || null;
};

bbopx.noctua.edit.core.prototype.get_connector_id_by_edge_id = function(eid){
    return this.core['edge2connector'][eid] || null;
};

bbopx.noctua.edit.core.prototype.get_edge = function(eeid){
    return this.core['edges'][eeid] || null;
};

bbopx.noctua.edit.core.prototype.get_edges = function(){
    return this.core['edges'] || [];
};

/*
 * Function: 
 * 
 * Return a list of edges that are concerned with the nodes as source.
 */
bbopx.noctua.edit.core.prototype.get_edges_by_source = function(srcid){

    var rete = [];
    bbop.core.each(this.core['edges'], function(edge_id, edge){
	var src = edge.source();
	if( src == srcid ){
	    rete.push(edge);
	}
    });

    return rete;
};

/*
 * Function: 
 * 
 * Return a list of edges that are concerned with the nodes as target.
 */
bbopx.noctua.edit.core.prototype.get_edges_by_target = function(tgtid){

    var rete = [];
    bbop.core.each(this.core['edges'], function(edge_id, edge){
	var tgt = edge.target();
	if( tgt == tgtid ){
	    rete.push(edge);
	}
    });

    return rete;
};

bbopx.noctua.edit.core.prototype.remove_edge = function(eeid){
    if( this.core['edges'][eeid] ){

	// Main bit out.
	delete this.core['edges'][eeid];

	// And clean the maps.
	var cid = this.core['edge2connector'][eeid];
	delete this.core['edge2connector'][eeid];
	delete this.core['connector2edge'][cid];
    }
};

bbopx.noctua.edit.core.prototype.create_edge_mapping = function(eedge, connector){
    var eid = eedge.id();
    var cid = connector.id;
    this.core['edge2connector'][eid] = cid;
    this.core['connector2edge'][cid] = eid;
};

// Debugging text output function.
bbopx.noctua.edit.core.prototype.dump = function(){

    //
    var dcache = [];
    
    bbop.core.each(this.core['nodes'], function(node_id, node){

	var ncache = ['node'];
	ncache.push(node.id());
	// ncache.push(node.enabled_by());
	// ncache.push(node.activity());
	// ncache.push(node.unknown().join('|'));
	// ncache.push(node.process());
	// ncache.push(node.location().join('|'));
	dcache.push(ncache.join("\t"));
    });
    
    bbop.core.each(this.core['edges'], function(edge_id, edge){
	var ecache = ['edge'];
	ecache.push(edge.source());
	ecache.push(edge.relation());
	ecache.push(edge.target());
	dcache.push(ecache.join("\t"));
    });
    
    return dcache.join("\n");
};

// Return gross high-level topology.
bbopx.noctua.edit.core.prototype.to_graph = function(){

    // 
    var ex_graph = new bbop.model.graph();
    
    // Add nodes.
    bbop.core.each(this.core['nodes'], function(node_id, node){

	// Create node.
	var ex_node = new bbop.model.node(node_id);
	//ex_node.metadata(ex_meta);
	
	// Add to export graph.
	ex_graph.add_node(ex_node);
    });
    
    // Add edges to the export graph.
    bbop.core.each(this.core['edges'], function(edge_id, edge){
	//
	var ex_edge =
	    new bbop.model.edge(edge.source(), edge.target(), edge.relation());
	ex_graph.add_edge(ex_edge);
    });
    
    return ex_graph;
};

// Add annotation operations to prototype.
bbopx.noctua.edit.core.prototype.annotations =
    bbopx.noctua.edit._annotations;
bbopx.noctua.edit.core.prototype.add_annotation =
    bbopx.noctua.edit._add_annotation;
bbopx.noctua.edit.core.prototype.get_annotations_by_filter =
    bbopx.noctua.edit._get_annotations_by_filter;
bbopx.noctua.edit.core.prototype.get_annotation_by_id =
    bbopx.noctua.edit._get_annotation_by_id;

/**
 * Edit nodes.
 * 
 * Parameters:
 *  in_id - *[optional]* generated if not given
 *  in_types - *[serially optional]*
 */
bbopx.noctua.edit.node = function(in_id, in_types){

    var anchor = this;

    this._types = [];
    this._id2type = {};
    this._annotations = [];

    if( typeof(in_id) === 'undefined' ){
	this._id = bbop.core.uuid();
    }else{
	//this._id = in_id;
	this._id = in_id;
    }
    if( typeof(in_types) !== 'undefined' ){
	bbop.core.each(in_types, function(in_type){
	    var new_type = new bbopx.minerva.class_expression(in_type);
	    anchor._id2type[new_type.id()] = new_type;
	    anchor._types.push(new bbopx.minerva.class_expression(in_type));
	});
    }
    
    // Optional layout hints.
    this._x_init = null; // initial layout hint
    this._y_init = null;
    // this.xlast = null; // last known location
    // this.ylast = null;
};

// (possibly generated) ID is RO
bbopx.noctua.edit.node.prototype.id = function(value){
    return this._id;
};

/**
 * Function: types
 * 
 * Get current types; replace current types.
 * 
 * Parameters:
 *  in_types - *[optional]* raw JSON type objects
 * 
 * Returns:
 *  array
 */
bbopx.noctua.edit.node.prototype.types = function(in_types){
    var anchor = this;    

    if( in_types && bbop.core.what_is(in_types) == 'array' ){

	// Wipe previous type set.
	anchor._id2type = {};
	anchor._types = [];

	bbop.core.each(in_types, function(in_type){
	    var new_type = new bbopx.minerva.class_expression(in_type);
	    anchor._id2type[new_type.id()] = new_type;
	    anchor._types.push(new_type);
	});
    }
    return this._types;
};

/**
 * Function: add_types
 * 
 * Add types to current types.
 * 
 * Parameters:
 *  in_types - raw JSON type objects
 *  inferred_p - whether or not the argument types are inferred
 * 
 * Returns:
 *  boolean
 */
bbopx.noctua.edit.node.prototype.add_types = function(in_types, inferred_p){
    var anchor = this;    
    var inf_p = inferred_p || false;

    var ret = false;

    if( in_types && bbop.core.what_is(in_types) == 'array' ){
	bbop.core.each(in_types, function(in_type){
	    var new_type = new bbopx.minerva.class_expression(in_type, inf_p);
	    anchor._id2type[new_type.id()] = new_type;
	    anchor._types.push(new_type);
	    
	    ret = true; // return true if did something
	});
    }
    return ret;
};

/**
 * Function: get_type_by_id
 * 
 * Get the 
 * 
 * Parameters:
 *  type_id - type id
 * 
 * Returns:
 *  type or null
 */
bbopx.noctua.edit.node.prototype.get_type_by_id = function(type_id){
    var anchor = this;

    var ret = null;
    ret = anchor._id2type[type_id];

    return ret;
};

bbopx.noctua.edit.node.prototype.x_init = function(value){
    if(value) this._x_init = value; return this._x_init; };

bbopx.noctua.edit.node.prototype.y_init = function(value){
    if(value) this._y_init = value; return this._y_init; };

// Add annotation operations to prototype.
bbopx.noctua.edit.node.prototype.annotations =
    bbopx.noctua.edit._annotations;
bbopx.noctua.edit.node.prototype.add_annotation =
    bbopx.noctua.edit._add_annotation;
bbopx.noctua.edit.node.prototype.get_annotations_by_filter =
    bbopx.noctua.edit._get_annotations_by_filter;
bbopx.noctua.edit.node.prototype.get_annotation_by_id =
    bbopx.noctua.edit._get_annotation_by_id;

/*
 * Edit edges.
 * 
 * Parameters:
 *  src_id - source id
 *  rel_id - relation id
 *  tgt_id - target/object id
 */
bbopx.noctua.edit.edge = function(src_id, rel_id, tgt_id){
    this._id = bbop.core.uuid();
    // this._source_id = src_id;
    // this._relation_id = rel_id;
    // this._target_id = tgt_id;
    this._source_id = src_id;
    this._relation_id = rel_id;
    this._target_id = tgt_id;

    this._annotations = [];
};
bbopx.noctua.edit.edge.prototype.id = function(){ // ID is RO
    return this._id; };
bbopx.noctua.edit.edge.prototype.source = function(value){
    if(value) this._source_id = value; return this._source_id; };
bbopx.noctua.edit.edge.prototype.relation = function(value){
    if(value) this._relation_id = value; return this._relation_id; };
bbopx.noctua.edit.edge.prototype.target = function(value){
    if(value) this._target_id = value; return this._target_id; };

// Add annotation operations to prototype.
bbopx.noctua.edit.edge.prototype.annotations =
    bbopx.noctua.edit._annotations;
bbopx.noctua.edit.edge.prototype.add_annotation =
    bbopx.noctua.edit._add_annotation;
bbopx.noctua.edit.edge.prototype.get_annotations_by_filter =
    bbopx.noctua.edit._get_annotations_by_filter;
bbopx.noctua.edit.edge.prototype.get_annotation_by_id =
    bbopx.noctua.edit._get_annotation_by_id;
