import Utils from "./Utils.mjs";

export default class DropItem {

    constructor(name, minCount, maxCount, dropChance) {
        this.itemName = name;
        this.minCount = minCount;
        this.maxCount = maxCount;
        this.dropChance = dropChance;
    }

    createItemStack() {
        if(Math.random() >= this.dropChance) return null;
        return ItemStack.fromName(this.itemName, Utils.randomRangeInt(this.minCount, this.maxCount));
    }
}