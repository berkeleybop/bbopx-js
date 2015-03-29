/*
 * Package: location-store.js
 *
 * Namespace: bbopx.noctua.location-store
 *
 * Simple abstraction to take care of operating on stored locations.
 */

if ( typeof bbopx == "undefined" ){ var bbopx = {}; }
if ( typeof bbopx.noctua == "undefined" ){ bbopx.noctua = {}; }

/*
 * Constructor: location_store
 *
 * Object to track object locations.
 */
bbopx.noctua.location_store = function(){

    var anchor = this;

    var logger = new bbop.logger('lcstr');
    logger.DEBUG = true;
    //logger.DEBUG = false;
    function ll(str){ logger.kvetch(str); }

    // 
    var lstore = {};

    /*
     * Function: add
     *
     * True if new, false if update. 
     *
     * Parameters: 
     *  id - string
     *  x - number 
     *  y - number 
     *
     * Returns: 
     *  true (new id) or false (known id)
     */
    anchor.add = function(id, x, y){
	var ret = true;

	if( lstore[id] ){
	    ret = false;
	}
	lstore[id] = {'x': x, 'y': y};

	return ret;
    };

    /*
     * Function: remove
     *
     * True is removal, false if wasn't there.
     *
     * Parameters: 
     *  id - string
     *
     * Returns: 
     *  boolean
     */
    anchor.remove = function(id){
	var ret = false;

	if( lstore[id] ){
	    ret = true;
	}
	delete lstore[id];

	return ret;
    };

    /*
     * Function: get
     *
     * Get x/y coord of id.
     *
     * Parameters: 
     *  id - string
     *
     * Returns: 
     *  x/y object pair
     */
    anchor.get = function(id){
	var ret = null;

	if( lstore[id] ){
	    ret = lstore[id];
	}

	return ret;
    };

};
