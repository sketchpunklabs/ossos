class PropSelect extends HTMLElement{
    // #region MAIN
    _input      = null;
    _isInt      = false;
    _isFloat    = false;

    constructor(){
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        super();

        // Find any options that may exist in the dom
        const opts = this.querySelectorAll( ':scope > option' );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.attachShadow( { mode: 'open' } );
        
        this.shadowRoot.appendChild( PropSelect.Template.content.cloneNode( true ) );
        const sroot = this.shadowRoot;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this._input = sroot.querySelector( 'select' );
        this._label = sroot.querySelector( 'div' );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this._input.addEventListener( 'change', e=>{
            e.stopPropagation();
            const elm  = e.target;
            const opt  = elm.options[ elm.selectedIndex ];
            this._label.innerHTML = opt.text

            const detail = {
                text: opt.text,
                value: this.value,
            };
            this.dispatchEvent( new CustomEvent( 'change', { detail, composed: true, bubbles: true }) );
        });
        
        // Insert Options that may exist 
        for( const o of opts ){
            this._input.appendChild( o );
        }
    }
    // #endregion

    // #region WEB COMPONENT 
    connectedCallback(){
        const elm = this._input;
        if( elm.options.length > 0 ){
            const opt = elm.options[ elm.selectedIndex ];
            this._label.innerHTML = opt.text;
        }
    }
    // #endregion

    // #region ATTRIBUTES
    static get observedAttributes(){
        return [ 'isint', 'isfloat' ];
    }

    attributeChangedCallback( name, oldval, newval ){
        //console.log( name, 'old', oldval, 'new', newval );
        switch( name ){
            case 'isint'        : this._isInt       = ( newval == 'true' ); break;
            case 'isfloat'      : this._isFloat     = ( newval == 'true' ); break;
        }
    }

    get value(){
        const elm  = this._input;
        const opt  = elm.options[ elm.selectedIndex ];
        if( this._isInt )   return parseInt( opt.value );
        if( this._isFloat ) return parseFloat( opt.value );
        return opt.value;
    }

    set isInt( v ){ this._isInt = v; }
    set isFLoat( v ){ this._isFloat = v; }
    // #endregion

    // #region METHODS
    addOption( txt, val ){
        const opt   = document.createElement( 'option' );
        opt.text    = txt;
        opt.value   = val;
        this._input.add( opt );
        return this;
    }

    fromFlatArray( ary ){
        for( let i=0; i < ary.length; i+=2 ) this.addOption( ary[i], ary[i+1] );
        return this;
    }

    setIndex( i ){
        this._input.selectedIndex   = i;
        this._label.innerHTML       = this._input.options[ i ].text;
        return this;
    }
    // #endregion

    // #region EVENTS
    onChange( fn, doRemove=false ){
        if( !doRemove ) this.addEventListener( 'change', fn );
        else            this.removeEventListener( 'change', fn );
        return this;
    }
    // #endregion

}

// #region TEMPLATE
PropSelect.Template = document.createElement( 'template' );
PropSelect.Template.innerHTML = `
<style type="text/css">
:host{
    display                 : grid;
    grid-template-columns   : 1fr;
    grid-template-rows      : 1fr;
    position:relative;
    grid-template-columns   : 1fr;
    grid-template-rows      : 1fr;
}

.input{
    position    : absolute;
    top         : 0px;
    left        : 0px;
    width       : 100%;
    height      : 100%;
    opacity     : 0;
}

.label{
    user-select     : none;
    align-self      : stretch;
    justify-self    : stretch;
    cursor          : pointer;
}

.ico{
    position        : absolute;
    right           : 10px;
    top             : 50%;
    transform       : translate( 0%, -50% );
    pointer-events  : none;
}
</style>

<select class="input"></select>

<div part="label" class="label">&nbsp;</div>

<svg part="ico" class="ico" width="9" height="5" viewBox="0 0 9 5" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.8 4.4c.4.3 1 .3 1.4 0L8 1.7A1 1 0 007.4 0H1.6a1 1 0 00-.7 1.7l3 2.7z"></path>
</svg>
`;
globalThis.customElements.define( 'prop-select', PropSelect );
// #endregion

export default PropSelect;