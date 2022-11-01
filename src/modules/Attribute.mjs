import AttributeType from "./AttributeType.mjs";

export default class Attribute {

    constructor() {
        this.defaults = new Map();
        this.modifiers = [];
        this.additions = new Map();
        this.multiplies = new Map();

        for(let type of AttributeType.getAll()) {
            this.defaults[type] = type.defaultValue;
        }
        resetValues();
    }

    resetValues() {
        for(let type of AttributeType.getAll()) {
            this.additions[type] = 0;
            this.multiplies[type] = 1;
        }
    }

    getValue(type) {
        return (this.getDefault(type) + this.additions[type]) * this.multiplies[type];
    }

    getDefault(type) {
        return this.defaults[type];
    }

    setDefault(type, value) {
        this.defaults[type] = value;
    }

    addValue(type, value) {
        this.modifiers.push(new AttributeModifier(false, type, value));
    }

    multiplyValue(type, value) {
        this.modifiers.push(new AttributeModifier(true, type, value));
    }

    addModifier(modifier) {
        this.modifiers.push(modifier);
    }

    updateValues() {
        this.resetValues();
        for(let modifier in this.modifiers) {
            if(modifier.isMultiplier) {
                this.multiplies[modifier.type] *= modifier.value;
                this.additions[modifier.type] += modifier.value;
            }
        }
        this.modifiers = [];
    }
}

class AttributeModifier {

    type = AttributeType.ATTACK;
    isMultiplier = false;
    value = 0;

    constructor(isMultiplier, type, value) {
        this.isMultiplier = isMultiplier;
        this.value = value;
    }
}