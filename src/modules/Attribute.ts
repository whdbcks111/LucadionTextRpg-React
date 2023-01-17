import { ExtraObject, NumberMap } from "../types";
import { AttributeType } from "./Internal";
import Utils from "./Utils";

export class Attribute {

    private defaults = new WeakMap<AttributeType, number>();
    private modifiers: AttributeModifier[] = [];
    private additions = new WeakMap<AttributeType, number>();
    private multiplies = new WeakMap<AttributeType, number>();

    constructor() {
        for(let type of AttributeType.getAll()) {
            this.defaults.set(type, type.defaultValue);
        }
        this.resetValues();
    }

    toDataObj() {
        let result: NumberMap = {};
        for(let type of AttributeType.getAll()) {
            result[type.name] = this.defaults.get(type) ?? 0;
        }
        return result;
    }

    static fromDataObj(obj: NumberMap) {
        if(!obj) return null;
        let newAttr = new Attribute();
        
        for(let typeName in obj) {
            let type = AttributeType.getByName(typeName);
            if(!type) continue;
            newAttr.setDefault(type, obj[typeName]);
        }

        return newAttr;
    }

    resetValues() {
        for(let type of AttributeType.getAll()) {
            this.additions.set(type, 0);
            this.multiplies.set(type, 1);
        }
    }

    getDefault(type: AttributeType) {
        return this.defaults.get(type) ?? 0;
    }

    setDefault(type: AttributeType, value: number) {
        this.defaults.set(type, value);
    }

    addValue(type: AttributeType, value: number) {
        this.modifiers.push(new AttributeModifier(false, type, value));
    }

    multiplyValue(type: AttributeType, value: number) {
        this.modifiers.push(new AttributeModifier(true, type, value));
    }

    addModifier(modifier: AttributeModifier) {
        this.modifiers.push(modifier);
    }

    getValue(type: AttributeType) {
        return Utils.clamp(
            (this.getDefault(type) + (this.additions.get(type) ?? 0)) * (this.multiplies.get(type) ?? 1), 
            type.minValue, type.maxValue);
    }

    updateValues() {
        this.resetValues();
        for(let modifier of this.modifiers) {
            if(modifier.isMultiplier) {
                this.multiplies.set(modifier.type,
                    (this.multiplies.get(modifier.type) ?? 1) * modifier.value);
            }
            else {
                this.additions.set(modifier.type, 
                    (this.additions.get(modifier.type) ?? 0) + modifier.value);
            }
        }
        this.modifiers = [];
    }

    static getDefendRatio(def: number) {
        if(def < 0) return 0;
        return (def / (def + 20000)) * 0.8;
    }

    static parseModifiers(attributes: { [key: string]: string }): AttributeModifier[] {
        let result: AttributeModifier[] = [];

        for(let key in attributes) {
            const type = AttributeType.getByName(key);
            if(!type) continue;

            let format = attributes[key];
            let matchResult = format.match('[+-]?[0-9]+(?:\\.[0-9]+)?%?');
            if(matchResult) matchResult.forEach(str => {
                let isMultiplier = str.endsWith('%');
                let value = parseFloat(str.replace('%', ''));
    
                result.push(new AttributeModifier(isMultiplier, type, 
                    isMultiplier ? 1 + value / 100 : value));
            });
        }

        return result;
    }
}

export class AttributeModifier {

    isMultiplier: boolean;
    value: number;
    type: AttributeType;

    constructor(isMultiplier: boolean, type: AttributeType, value: number) {
        this.isMultiplier = isMultiplier;
        this.value = value;
        this.type = type;
    }

    clone() {
        return new AttributeModifier(this.isMultiplier, this.type, this.value);
    }

    equals(other: AttributeModifier) {
        return this.isMultiplier === other.isMultiplier 
            && this.value === other.value 
            && this.type === other.type;
    }

    toDataObj(): ExtraObject {
        return {
            ...this,
            type: this.type.name
        }
    }

    static fromDataObj(obj: ExtraObject) {
        if(!obj) return null;
        let type = AttributeType.getByName(obj.type);
        if(!type) return null;
        return new AttributeModifier(obj.isMultiplier, type, obj.value);
    }
}