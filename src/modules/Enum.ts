export default abstract class Enum {

    name: string

    protected constructor(name: string) {
        this.name = name;
    }

    valueOf() {
        return this.name;
    }

    toString() {
        return this.valueOf();
    }

    static getAll(classType: any) {
        return Object.keys(classType)
            .map(key => classType[key])
            .filter(type => type instanceof classType);
    }
}