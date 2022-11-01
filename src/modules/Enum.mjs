export default class Enum {

    constructor(name) {
        this.name = name;
    }

    valueOf() {
        return this.name;
    }

    toString() {
        return this.valueOf();
    }

    static getAll(classType) {
        return Object.keys(classType)
            .map(key => classType[key])
            .filter(type => type instanceof classType);
    }
}