export default class CanvasKeyboardHandlers{
    // #region MAIN
    keys       = new Map(); // Keep track of which keys are currently being pressed out
    _canvas    = null;
    _isFocused = false;
    onKeyDown  = null;
    onKeyUp    = null;

    constructor( canvas ){
        this._canvas = canvas;
        return this;
    }
    // #endregion

    // #region METHODS
    isShift(){ return !!this.keys.get( 'Shift' ); }

    isControl(){ return !!this.keys.get( 'Control' ); }

    isDown( key ){ return !!this.keys.get( key ); }

    // Return "3D Joystick" like data using the keyboards WASD for XY and QE for Z
    getWASDAxes(){
        // Add up each axis, so if the user holds opposite buttons at the same time
        // the operation will cancel out the movement.
        return [
            (this.keys.get('a') ? -1 : 0) + (this.keys.get('d') ? 1 : 0),
            (this.keys.get('s') ? -1 : 0) + (this.keys.get('w') ? 1 : 0),
            (this.keys.get('q') ? -1 : 0) + (this.keys.get('e') ? 1 : 0),
        ];
    }

    // Return "Joystick" data using the keyboard arrow keys. [ X, Y ]
    getArrowAxes(){
        return [
            (this.keys.get('ArrowLeft')  ? -1 : 0) +
            (this.keys.get('ArrowRight') ?  1 : 0),
            (this.keys.get('ArrowDown')  ? -1 : 0) +
            (this.keys.get('ArrowUp')    ?  1 : 0),
        ];
    }
    // #endregion

    // #region EVENT HANDLERS
    _onPointerDown = e => { this._isFocused = ( e.target === this._canvas ); };

    _onKeyDown = e => {
        if (this._isFocused) {
            this.keys.set( e.key, true );
            if( this.onKeyDown ) this.onKeyDown( e, this );
        }
    };

    _onKeyUp = e => {
        if( this._isFocused ){
            this.keys.set( e.key, false );
            if( this.onKeyUp ) this.onKeyUp( e, this );
        }
    };
    // #endregion

    // #region CONTROL LISTENERS
    enable(){
        window.addEventListener( 'pointerdown', this._onPointerDown, true );
        window.addEventListener( 'keydown',     this._onKeyDown, true );
        window.addEventListener( 'keyup',       this._onKeyUp, true );
        this._isFocused = false;
        return this;
    }

    disable(){
        window.removeEventListener( 'pointerdown', this._onPointerDown, true );
        window.removeEventListener( 'keydown',     this._onKeyDown, true );
        window.removeEventListener( 'keyup',       this._onKeyUp, true );
        this._isFocused = false;
        return this;
    }
    // #endregion
}