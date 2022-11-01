import DateFormat from "./DateFormat.mjs";
import Enum from "./Enum.mjs";
import Player from "./Player.mjs";

export default class Effect {

    constructor(type, level = 1, duration = 10, caster, extras = {}) {
        this.type = type;
        this.level = level;
        this.duration = duration;
        this.maxDuration = duration;
        this.casterUid = caster instanceof Player ? caster.uid : null;
        this.extras = extras;
    }

    toString() {
        return `Lv.${this.level} ${this.name} [${ new DateFormat(new Date(Math.floor(this.duration * 1000))).format('hh:mm:ss')}]`
    }

    get priority() {
        return this.type.priority;
    }

    get isDebuff() {
        return this.type.isDebuff;
    }

    get caster() {
        if(!this.caster) return null;
        return Player.getPlayer(this.casterUid);
    }
}

export class EffectType extends Enum {

    constructor(name, displayName, affect = () => {}, isDebuff = false, priority = 0) {
        super(name);
        this.displayName = displayName;
        this.affect = affect;
        this.isDebuff = isDebuff;
        this.priority = priority;
    }

    getAll() {
        return Enum.getAll(EffectType);
    }
}