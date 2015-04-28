/*
 * Package: context.js
 *
 * A handful of functions for drawing entities in different contexts.
 */

if ( typeof bbopx == "undefined" ){ var bbopx = {}; }
if ( typeof bbopx.noctua == "undefined" ){ bbopx.noctua = {}; }

/*
 * Function: type_to_minimal
 *
 * Return a single-line text-only one-level representation of a type.
 */
bbopx.noctua.type_to_minimal = function(in_type, aid){

    var ret = '[???]';
    
    var t = in_type.type();
    var f = in_type.frame();

    if( t == 'class' ){
	ret = in_type.class_label();
    }else if( t == 'union' || t == 'intersection' ){
	ret = t + '[' + f.length + ']';
    }else{
	// SVF a little harder.
	var ctype = in_type.category();
	var ctype_r = aid.readable(ctype);

	// Probe it a bit.
	var ce = in_type.svf_class_expression();
	var cetype = ce.type();

	var inner_lbl = '???';
	if( cetype == 'class' ){
	    inner_lbl = ce.class_label();
	}else if( cetype == 'union' || cetype == 'intersection' ){
	    var cef = ce.frame();
	    inner_lbl = cetype + '[' + cef.length + ']';
	}else{
	    inner_lbl = '[SVF]';
	}

	//var cr = aid.readable(cat);
	ret = ctype_r + '(' + inner_lbl + ')';
    }

    // A little special "hi" for inferred types.
    if( in_type.inferred_p() ){
	ret = '[' + ret + ']';
    }

    return ret;
};

/*
 * Function: type_to_span
 *
 * Essentially, minimal rendered as a usable span, with a color
 * option.
 */
bbopx.noctua.type_to_span = function(in_type, aid, color_p){

    var min = bbopx.noctua.type_to_minimal(in_type, aid);

    var text = null;
    if( color_p ){
	text = '<span ' +
	    'style="background-color: ' + aid.color(in_type.category()) + ';" ' +
	    'alt="' + min + '" ' +
	    'title="' + min +'">' +
	    min + '</span>';
    }else{
	text = '<span alt="' + min + '" title="' + min +'">' + min + '</span>';
    }

    return text;
};

/*
 * Function: type_to_full
 *
 * A recursive writer for when we no longer care--a table that goes on
 * and on...
 */
bbopx.noctua.type_to_full = function(in_type, aid){
    var anchor = this;
    var each = bbop.core.each;

    var text = '[???]';

    var t = in_type.type();
    if( t == 'class' ){ // if simple, the easy way out
	text = bbopx.noctua.type_to_minimal(in_type, aid);
    }else{
	// For everything else, we're gunna hafta do a little
	// lifting...
	var cache = [];
	if( t == 'union' || t == 'intersection' ){
	    
	    // Some kind of recursion on a frame then.
	    cache = [
		'<table width="80%" class="table table-bordered table-hover table-condensed mme-type-table" ' +
		    'style="background-color: ' +
	     	    aid.color(in_type.category()) + ';">',
		'<caption>' + t + '</caption>',
		//'<thead style="background-color: white;">',
		'<thead style="">',
		'</thead>',
		'<tbody>'
	    ];
	    // cache.push('<tr>'),
	    var frame = in_type.frame();
	    each(frame,
		 function(ftype){
		     cache.push('<tr style="background-color: ' +
		     		aid.color(ftype.category()) + ';">'),
		     cache.push('<td>');
		     // cache.push('<td style="background-color: ' +
	     	     // 		aid.color(ftype.category()) + ';">'),
		     cache.push(bbopx.noctua.type_to_full(ftype, aid));
		     cache.push('</td>');
		     cache.push('</tr>');
		 });	
	    // cache.push('</tr>');
	    cache.push('</tbody>');
	    cache.push('</table>');
	    
	    text = cache.join('');	    

	}else{

	    // A little harder: need to a an SVF wrap before I recur.
	    var pid = in_type.property_id();
	    var plabel = in_type.property_label();
	    var svfce = in_type.svf_class_expression();
	    cache = [
		'<table width="80%" class="table table-bordered table-hover table-condensed mme-type-table">',
		'<thead style="background-color: ' + aid.color(pid) + ';">',
		plabel,
		'</thead>',
		'<tbody>'
	    ];
	    cache.push('<tr style="background-color: ' +
		       aid.color(svfce.category()) + ';"><td>'),
	    cache.push(bbopx.noctua.type_to_full(svfce, aid));
	    cache.push('</td></tr>');
	    cache.push('</tbody>');
	    cache.push('</table>');
	    
	    text = cache.join('');
	}
    }


    // var min = bbopx.noctua.type_to_minimal(in_type, aid);
    // var exp = bbopx.noctua.type_to_expanded(in_type, aid);
    // var text = '<span alt="' + exp + '" title="' + exp +'">' + min + '</span>';

    return text;
};
