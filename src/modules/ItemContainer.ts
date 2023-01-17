import { ExtraObject } from "../types";
import { AttributeType, Item, Player } from "./Internal";
import { ItemStack } from "./Internal";
import { Time } from "./Internal";
import Utils from "./Utils";

export class ItemContainer {

    contents: (ItemStack | null)[];

    constructor() {
        this.contents = [];
    }

    addItem(item: Item, count = 1) {
        for(let i = 0; i < this.contents.length; i++) {
            let itemStack = this.contents[i];
            if(itemStack?.item.equals(item)) {
                itemStack.count += count;
                return true;
            }
        }
        this.contents.push(new ItemStack(item, count));
        return true;
    }

    setItemCount(index: number, count: number) {
        let itemStack = this.contents[index];
        if(!(index in this.contents)) return false;
        if(count <= 0) this.contents.splice(index, 1);
        else if(itemStack) itemStack.count = count;
    }

    getItemCount(index: number) {
        return this.contents[index]?.count ?? 0;
    }

    hasContents(index: number) {
        return index in this.contents && !!this.contents[index];
    }

    getItemStack(index: number) {
        return this.contents[index] ?? null;
    }

    setItemStack(index: number, itemStack: ItemStack) {
        if(!(index in this.contents)) return;
        this.contents[index] = itemStack;
    } 

    addItemCount(index: number, count: number) {
        this.setItemCount(index, this.getItemCount(index) + count);
    }
}

export class Inventory extends ItemContainer {

    ownerUid: string;
    delayedTasks: ([() => void, number])[]
    latestDelayed: number;

    constructor(player: Player) {
        super();
        this.ownerUid = player.uid;
        this.delayedTasks = [];
        this.latestDelayed = 0;
        this.contents = Array(player.attribute.getValue(AttributeType.INVENTORY_SPACE)).fill(null);

        this.update();
    }

    get owner() {
        return Player.getPlayerByUid(this.ownerUid);
    }

    toDataObj() {
        return {
            ownerUid: this.ownerUid,
            contents: this.contents.map(itemStack => itemStack?.toDataObj() ?? null)
        };
    }

    static fromDataObj(obj: ExtraObject, player: Player) {
        if(!obj) return null;
        let newInventory = new Inventory(player);
        newInventory.contents = obj.contents.map(
            (itemStackObj: ExtraObject) => ItemStack.fromDataObj(itemStackObj)
        );

        return newInventory;
    }

    delayTask(task: () => void, ms: number) {
        if(this.delayedTasks.length === 0) this.latestDelayed = 0;
        this.delayedTasks.push([task, ms]);
    }

    update() {
        let space = this.owner?.attribute?.getValue(AttributeType.INVENTORY_SPACE) ?? this.contents.length;

        if(this.contents.length < space) {
            this.contents = this.contents.concat(Array(space - this.contents.length).fill(null));
        }
        else if(this.contents.length > space) {
            let drops = this.contents.slice(space);
            let loc = this.owner?.getLocation();
            this.contents = this.contents.slice(0, space);
            
            drops.forEach(itemStack => {
                if(!itemStack) return;
                loc?.droppedItems.addItem(itemStack.item, itemStack.count);
            });
        }

        if(this.delayedTasks.length > 0) {
            let [task, ms] = this.delayedTasks[0];
            if(Date.now() - this.latestDelayed >= ms) {
                task();
                this.latestDelayed = Date.now();
                this.delayedTasks.shift();
            }
        }
    }

    arrangeContents() {
        this.contents.sort((a, b) => {
            if(!a) return 1;
            if(!b) return -1;
            return a.item.name.localeCompare(b.item.name);
        });
    }

    useItem(index: number) {
        if(!this.owner) return;
        if(!this.owner.canUseItem || this.delayedTasks.length > 0) return false;
        
        let itemStack = this.contents[index];
        if(!itemStack) return false;
        if(this.owner.level < (itemStack.item.requiredLevel ?? 0)) return false;

        itemStack.item.onUse(this.owner, index);
    }

    getContentsInfo() {
        let numLength = Math.floor(Math.log10(this.contents.length) + 1);
        return `[ ${this.owner?.name} 님의 인벤토리 ]\n` +
            `공간 [${this.contents.filter(is => is).length}/${this.contents.length}]${Utils.rich}${Utils.blank}` +
            this.contents.map((itemStack, index) => {
                let curLength = Math.floor(Math.log10(index + 1) + 1);
                return `${('0'.repeat(numLength - curLength) + (index + 1))
                    .replace(/[0-9]/g, n => '０１２３４５６７８９'[parseInt(n)])}   ` + 
                        (itemStack ? `${itemStack.item}  x${itemStack.count}`: '')
            }).join('\n');
    }

    addItem(item: Item, count = 1) {
        for(let i = 0; i < this.contents.length; i++) {
            let itemStack = this.contents[i];
            if(!itemStack) {
                let addCount = Math.min(count, item.maxCount);
                this.contents[i] = new ItemStack(item, addCount);
                count -= addCount;
            }
            else if(itemStack.item.equals(item) && itemStack.count < itemStack.maxCount) {
                let addCount = Math.min(count, itemStack.maxCount - itemStack.count);
                itemStack.count += addCount;
                count -= addCount;
            }
            if(count <= 0) return true;
        }

        this.owner?.getLocation()?.droppedItems?.addItem(item, count);
        return false;
    }

    hasSpace(item: Item, count = 1) {
        for (let i = 0; i < this.contents.length; i++) {
            let itemStack = this.contents[i];
            if (!itemStack) {
                count -= item.maxCount;
            }
            else if (itemStack.item.equals(item) && itemStack.count < itemStack.maxCount) {
                count -= itemStack.maxCount - itemStack.count;
            }
            if (count <= 0) return true;
        }
        return false;
    }

    hasItem(filter: (item: Item) => boolean, count = 1) {
        this.contents.forEach(itemStack => {
            if (itemStack && itemStack.item && filter(itemStack.item)) {
                count -= itemStack.count;
            }
        });
        return count <= 0;
    }

    findItem(filter: (item: Item) => boolean) {
        return this.contents
            .map(itemStack => itemStack?.item)
            .find(item => item && filter(item)) ?? null;
    }

    findItemStack(filter: (item: Item) => boolean) {
        return this.contents
            .find(itemStack => itemStack && filter(itemStack.item)) ?? null;
    }

    removeItem(filter: (item: Item) => boolean, count = 1) {
        let removed = 0;
        for(let i = 0; i < this.contents.length; i++) {
            let itemStack = this.contents[i];
            if (itemStack && filter(itemStack.item)) {
                if (count >= itemStack.count) {
                    count -= itemStack.count;
                    removed += itemStack.count;
                    this.contents[i] = null;
                }
                else {
                    itemStack.count -= count;
                    removed += count;
                    count = 0;
                }
                if(count <= 0) break;
            }
        }
        return removed;
    }

    setItemCount(index: number, count: number) {
        let itemStack = this.contents[index];
        if(!(index in this.contents)) return false;
        if(count <= 0) this.contents[index] = null;
        else if(itemStack) itemStack.count = count;
    }

}