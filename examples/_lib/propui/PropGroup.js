import { CollapseContent } from './PropUtil.js';

class PropGroup extends HTMLElement{
    // #region MAIN
    _isOpen         = true;
    _contentCont    = null;
    _contentArea    = null;
    _header         = null;
    _lblHeading     = null;
    _btnToggle      = null;
    constructor(){
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        super();
        this.attachShadow( { mode: 'open' } );
        
        this.shadowRoot.appendChild( PropGroup.Template.content.cloneNode( true ) );
        const sroot = this.shadowRoot;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this._contentCont   = sroot.querySelector( 'main' );
        this._contentArea   = sroot.querySelector( 'main > div' );
        this._header        = sroot.querySelector( 'header' );
        this._lblHeading    = sroot.querySelector( 'header > span' );
        this._btnToggle     = sroot.querySelector( 'header > button' );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this._header.addEventListener( 'click', this.toggle.bind( this ) );   
    }
    // #endregion

    // #region METHODS
    close(){
        CollapseContent.close( this._contentCont, this._contentArea );
        this._isOpen = false;
        this.classList.remove( 'open' );
    }

    open(){
        CollapseContent.open( this._contentCont, this._contentArea );
        this._isOpen = true;
        this.classList.add( 'open' );
    }

    toggle(){
        if( this._isOpen )  this.close();
        else                this.open();
    }

    fixedTopRight( x=10, y=10 ){
        this.style.position = 'fixed';
        this.style.top      = y + 'px';
        this.style.right    = x + 'px';
        return this;
    }

    setWidth( v ){ this.style.width = v+'px'; return this }
    setHeading( v ){ this._lblHeading.innerText = v; return this; }
    // #endregion

    // #region WEB COMPONENT 
    connectedCallback(){
        if( !this.hasAttribute( 'open' ) ){
            this.classList.add( 'open' );
            this._isOpen = true;
        }
    }
    // #endregion

    // #region ATTRIBUTES
    static get observedAttributes(){
        return [ 'open', 'heading' ];
    }

    attributeChangedCallback( name, oldval, newval ){
        //console.log( name, 'old', oldval, 'new', newval );
        switch( name ){
            case 'open':
                if( newval == true || newval == 'true') this.open();
                else                                    this.close();
                break;
            case 'heading': this.setHeading( newval ); break;
        }
    }
    // #endregion
}

// #region TEMPLATE
PropGroup.Template = document.createElement( 'template' );
PropGroup.Template.innerHTML = `
<style>
:host{
    background-color        : silver;
    display                 : grid;
    grid-template-columns   : 1fr;
    grid-template-rows      : fit-content(40px) 1fr;
    
}

::slotted(*){
    flex    : 1 1 auto;
}

header{
    display                 : grid;
    grid-template-columns   : 1fr fit-content(40px);
    grid-template-rows      : 1fr;
    cursor                  : pointer;
}

header > span{ align-self: center; }

header > button{
    align-self      : stretch;
    justify-self    : stretch;
    padding         : 0px;
    margin          : 0px;
}

main{
    display                 : grid;
    grid-template-columns   : auto;
    grid-template-rows      : auto;
    transition              : height 0.3s ease-out;
}

#contentArea{
    align-self      : stretch;
    justify-self    : stretch;
    display         : flex;
    flex-direction  : column;
    box-sizing      : border-box;
}
</style>
<header part="header">
    <span part="headerLbl">Heading</span>
    <button part="headerBtn">
        <svg part="ico" class="ico" width="9" height="5" viewBox="0 0 9 5" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.8 4.4c.4.3 1 .3 1.4 0L8 1.7A1 1 0 007.4 0H1.6a1 1 0 00-.7 1.7l3 2.7z"></path>
        </svg>
    </button>
</header>
<main>
    <div part="content" id="contentArea">
        <slot></slot>
    </div>
</main>`;

window.customElements.define( "prop-group", PropGroup );
// #endregion


export default PropGroup;