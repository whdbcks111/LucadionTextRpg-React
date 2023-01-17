import { EventMap, ExtraObject } from "../types";
import { Entity, LivingEntity, OptionPreset, Player, Time } from "./Internal"

export class Trigger {

    events: EventMap;

    constructor(events: EventMap) {
        this.events = events;
    }

    onUpdate(self: Player) {
        if(this.events.onUpdate) this.events.onUpdate(self);
    }

    onHit(self: Player, victim: Entity) {
        if(this.events.onHit) this.events.onHit(self, victim);
    }

    onHitted(self: Player, attacker: Entity) {
        if(this.events.onHitted) this.events.onHitted(self, attacker);
    }
}

export class Option {

    name: string;
    extras: ExtraObject;
    time: number;

    constructor(name: string, extras: ExtraObject, time = 0) {
        this.name = name;
        this.extras = extras;
        this.time = time;
    }

    toDataObj() {
        return {
            ...this
        };
    }
    
    static fromDataObj(obj: ExtraObject) {
        if(!obj) return null;
        return new Option(obj.name, obj.extras, obj.time);
    }

    get preset() {
        return OptionPreset.getOptionPreset(this.name);
    }

    get description() {
        return this.preset?.getDescription ? this.preset.getDescription(this) : null;
    }

    onHit(self: Entity, victim: Entity) {
        if(this.preset?.onHit) this.preset.onHit(this, self, victim);
    }

    onHitted(self: Entity, attacker: Entity) {
        if(this.preset?.onHitted) this.preset.onHitted(this, self, attacker);
    }

    onUpdate(self: Entity) {
        if(this.preset?.onUpdate) this.preset.onUpdate(this, self);
    }

    equals(other: Option) {
        return JSON.stringify(this.toDataObj) === JSON.stringify(other.toDataObj);
    }

    clone() {
        return new Option(this.name, JSON.parse(JSON.stringify(this.extras)), this.time);
    }
}