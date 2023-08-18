const Interp = {
    quintic: n => Math.pow(n - 1, 5) + 1
};

export default class SmoothValue {
    constructor(value, speed = 2) {
        this.start = this.end = this._value = value;
        this.speed = speed;
        this.timer = 0;
    }

    set value(value) {
        this.start = this._value;
        this.end = value;
        this.timer = 0;
    }

    get value() {
        return this.end;
    }

    update(dt) {
        this.timer = Math.min(1.0, this.timer + dt * this.speed);
        const t = Interp.quintic(this.timer);
        this._value = this.start * (1 - t) + this.end * t;
        return this._value;
    }
}