/*
 * Package: context.js
 *
 * A handful of functions for drawing entities in different contexts.
 */

if ( typeof bbopx == "undefined" ){ var bbopx = {}; }
if ( typeof bbopx.noctua == "undefined" ){ bbopx.noctua = {}; }

/*
 * Function: type_to_span
 *
 * Essentially, minimal rendered as a usable span, with a color
 * option.
 */
bbopx.noctua.type_to_span = function(in_type, color){

    var text = null;

    var min = in_type.to_string();
    if( color ){
	text = '<span ' + 'style="background-color: ' + color + ';" ' +
	    'alt="' + min + '" ' + 'title="' + min +'">' + min + '</span>';
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
	text = in_type.to_string();
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

    return text;
};
