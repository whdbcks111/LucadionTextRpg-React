import { ExtraObject, ShopBuyItemPresetObject, ShopPresetObject, ShopSellItemPresetObject } from "../types";
import Enum from "./Enum";
import { Item } from "./Internal";
import { Location } from "./Location";
import { Player } from "./Player";
import Utils from "./Utils";

export class Shop {

    location: Location | null;
    buyList: ShopBuyItem[];
    sellList: ShopSellItem[];
    regenTime: number;
    latestRegen = Date.now();

    constructor(preset: ShopPresetObject) {
        this.location = null;
        this.buyList = (preset.buyList ?? [])
            .map(item => new ShopBuyItem(item));
        this.sellList = (preset.sellList ?? [])
            .map(item => new ShopSellItem(item));
        this.regenTime = preset.regenTime ?? (60 * 30);
    }

    getShopInfo() {
        return `[ ${this.location?.name}의 물품 목록 ]${Utils.blank}\n\n` +
            '▌ 구매 가능한 아이템\n' +
            '─────────────────\n' +
            this.buyList.map((item, idx) => {
                return `   [${idx + 1}][ ${item.name} ]\n` +
                    `   가격  ${item.cost}G\n` +
                    `   남은 재고  ${item.count}개`;
            }).join('\n─────────────────\n') +
            '\n─────────────────\n\n' +
            '▌ 판매 가능한 아이템\n' +
            '─────────────────\n' +
            this.sellList.map((item, idx) => {
                return `   [${idx + 1}][ ${item.name} ]\n` +
                    `   가격  ${item.cost}G`;
            }).join('\n─────────────────\n') +
            '\n─────────────────';
    }

    buyItem(player: Player, index: number, count = 1) {
        let buyItem = this.buyList[index];
        if(!buyItem) return new ShopState(ShopStateType.ITEM_NOT_FOUND);
        if(buyItem.count <= 0) return new ShopState(ShopStateType.OUT_OF_STOCK);

        count = Math.min(buyItem.count, count);
        let item = buyItem.createItem(buyItem);
        if(buyItem.cost * count > player.gold) return new ShopState(ShopStateType.GOLD_NOT_ENOUGH);
        if(!player.inventory.hasSpace(item, count)) return new ShopState(ShopStateType.FULL_INVENTORY_SPACE);

        buyItem.count -= count;
        player.gold -= buyItem.cost * count;
        player.inventory.addItem(item, count);

        return new ShopState(ShopStateType.SUCCESS, {
            boughtCount: count,
            item: item
        });
    }

    sellItem(player: Player, index: number, count = 1) {

        let sellItem = this.sellList[index];
        if(!sellItem?.checkItem) return new ShopState(ShopStateType.ITEM_NOT_FOUND);
        
        let removedCount = player.inventory.removeItem(item => sellItem.checkItem(item, sellItem), count);
        player.gold += sellItem.cost * removedCount;

        return new ShopState(ShopStateType.SUCCESS, {
            soldCount: removedCount,
            earnedGold: sellItem.cost * removedCount
        });
    }

    sellAllItem(player: Player) {
        let earnedGold = 0;
        this.sellList.forEach((item, idx) => {
            let state = this.sellItem(player, idx, Infinity);
            earnedGold += state.extras.earnedGold || 0;
        });
        return earnedGold;
    }

}

export class ShopState {

    state: ShopStateType;
    extras: ExtraObject;

    constructor(state = ShopStateType.SUCCESS, extras = {}) {
        this.state = state;
        this.extras = extras;
    }
}

export class ShopStateType extends Enum {

    constructor(name: string) {
        super(name);
    }
    
    static SUCCESS = new ShopStateType('success');
    static ITEM_NOT_FOUND = new ShopStateType('itemNotFound');
    static GOLD_NOT_ENOUGH = new ShopStateType('goldNotEnough');
    static FULL_INVENTORY_SPACE = new ShopStateType('fullInventorySpace');
    static OUT_OF_STOCK = new ShopStateType('outOfStock');
}

export class ShopBuyItem {

    name: string;
    cost: number;
    count: number;
    maxCount: number;
    createItem: (preset: ShopBuyItem) => Item;

    constructor(preset: ShopBuyItemPresetObject) {
        this.name = preset.name ?? 'unnamed';
        this.cost = preset.cost ?? 0;
        this.createItem = preset.createItem ?? null;
        this.maxCount = preset.count ?? 0;
        this.count = this.maxCount;
    }
}

export class ShopSellItem {
    
    name: string;
    cost: number;
    checkItem: (item: Item, preset: ShopSellItem) => boolean; 
    
    constructor(preset: ShopSellItemPresetObject) {
        this.name = preset.name ?? 'unnamed';
        this.cost = preset.cost ?? 0;
        this.checkItem = preset.checkItem ?? null;
    }
}