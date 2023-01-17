import { ItemStack } from "./Internal";
import Utils from "./Utils";

export class DropItem {

    itemName: string;
    minCount: number;
    maxCount: number;
    dropChance: number;

    constructor(name: string, minCount: number, maxCount: number, dropChance: number) {
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