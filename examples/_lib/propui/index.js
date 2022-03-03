import PropGroup        from './PropGroup.js';

import PropSelect       from './PropSelect.js';


// #region STARTUP
const mod_path = import.meta.url.substring( 0, import.meta.url.lastIndexOf("/") + 1 );
const css_path = mod_path + "PropUI.css";

(function(){
    let link    = document.createElement( "link" );
    link.rel	= "stylesheet";
    link.type	= "text/css";
    link.media	= "all";
    link.href	= css_path;
    document.getElementsByTagName( "head" )[0].appendChild( link );
})();
// #endregion /////////////////////////////////////////////////////////////////////////


export { 
    PropGroup, 
    PropSelect
};