import { ClientChatData, MessageComponent, NullableString } from "../../types";
import { ChatRoomManager, Item, ItemContainer, ItemStack, Player, Time, Utils } from "../Internal";
import { ComponentBuilder } from "../server/chat/ComponentBuilder";

export class MineralSmelting {

    static dataMap: WeakMap<Item, BlastFurnaceData> = new WeakMap();

    static getData(item: Item) {
        if(!MineralSmelting.dataMap.has(item))
            MineralSmelting.dataMap.set(item, new BlastFurnaceData(item));
        return MineralSmelting.dataMap.get(item);
    }

}

export class BlastFurnaceData {

    static readonly REMAIN_TIME_CALCULATION = 9.14;

    container = new ItemContainer();
    space: number;
    isSmelting = false;
    remainTime = 0;
    initialRemainTime = 0;
    smeltingInfo: ClientChatData | null = null;
    smeltingInfoTimer = 0;

    constructor(item: Item) {
        if(item.extras.space) this.space = item.extras.space;
        else this.space = 10;
    }

    getInfo(): MessageComponent {
        return ComponentBuilder.texts([
            `[ 용광로 정보 ]\n`,
            `공간 (${this.container.usingSpace}/${this.space})\n\n`,
            ComponentBuilder.embed([
                ComponentBuilder.join(this.container.contents.map((itemStack, i) => ComponentBuilder.texts([
                    ComponentBuilder.blockText(`${i + 1}`, { minWidth: '2em', marginRight: '5px' }),
                    itemStack ? `${itemStack.item.getName()} x${itemStack.count}` : ''
                ])), ComponentBuilder.newLine())
            ], this.isSmelting ? 'orange' : Utils.MAIN_COLOR)
        ]);
    }

    isMaterial(itemStack: ItemStack) {
        return ['연료', '제련'].includes(itemStack.item.type);
    }

    isOutOfSpace(count: number) {
        return this.space - this.container.usingSpace < count;
    }

    addMaterial(p: Player, idx: number, count = 1) {
        if(this.isSmelting) {
            p.sendRawMessage('[ 제련 중일 때는 재료 추가가 불가능합니다. ]');
            return;
        }
        
        const itemStack = p.inventory.getItemStack(idx);
        if(!itemStack) {
            p.sendRawMessage('[ 빈 슬롯입니다. ]');
            return;
        }
        if(!this.isMaterial(itemStack)) {
            p.sendRawMessage('[ 재료 아이템은 연료 또는 제련 종류여야 합니다. ]');
            return;
        }

        if(itemStack.count < count) count = itemStack.count;
        if(this.isOutOfSpace(count)) count = this.space - this.container.usingSpace;
        if(count <= 0) {
            p.sendRawMessage(`[ 공간이 부족합니다. ]`);
            return;
        }

        this.container.addItem(itemStack.item, count);
        p.inventory.setItemCount(idx, itemStack.count - count);

        p.sendRawMessage(`[ ${Utils.asSubjective(itemStack.item.getName())} ${count}개 만큼 추가되었습니다. ]`);
    }

    withdrawMaterial(p: Player, idx: number, count = 1) {
        if(this.isSmelting) {
            p.sendRawMessage('[ 제련 중일 때는 재료 회수가 불가능합니다. ]');
            return false;
        }

        const itemStack = this.container.getItemStack(idx);
        if(!itemStack) {
            p.sendRawMessage('[ 빈 슬롯입니다. ]');
            return false;
        }
        
        if(itemStack.count < count) count = itemStack.count;

        this.container.setItemCount(idx, itemStack.count - count);
        p.inventory.addItem(itemStack.item, count);

        p.sendRawMessage(`[ ${Utils.asSubjective(itemStack.item.getName())} ${count}개 만큼 회수되었습니다. ]`);
    }

    getTypedItemCount(type: string) {
        return this.container.contents
            .filter(itemStack => itemStack?.item?.type === type)
            .map(itemStack => itemStack?.count ?? 0)
            .reduce((a, b) => a + b, 0);
    }

    get isOutOfFuel() {
        const fuelCount = this.getTypedItemCount('연료');
        const mineralCount = this.getTypedItemCount('제련');

        return fuelCount < mineralCount;
    }

    enable(p: Player) {
        if(p.mana < 100) {
            p.sendRawMessage('[ 마나가 부족합니다. ]');
            return false;
        }
        p.mana -= 100;

        if(this.isOutOfFuel) {
            p.sendRawMessage('[ 연료가 부족합니다. 연료는 광물보다 많거나 같은 양이어야 합니다. ]');
            return false;
        }
        if(this.container.usingSpace <= 0) {
            p.sendRawMessage('[ 재료가 최소 1개는 있어야 합니다. ]');
            return false;
        }

        this.isSmelting = true;
        this.initialRemainTime = this.remainTime = 
            this.getTypedItemCount('연료') * BlastFurnaceData.REMAIN_TIME_CALCULATION;
        
        const chatData = p.sendRawMessage('[ 용광로가 활성화 되었습니다. ]');
        if(chatData) this.smeltingInfo = chatData;
    }

    update(p: Player) {
        if(this.remainTime > 0 && this.isSmelting) {
            this.remainTime -= Time.deltaTime;

            if(this.smeltingInfo && (this.smeltingInfoTimer -= Time.deltaTime) <= 0) {
                this.smeltingInfoTimer = 0.2;

                ChatRoomManager.getRoom(this.smeltingInfo.room)
                    ?.editChat(this.smeltingInfo.chatId, ComponentBuilder.texts([
                    `[ 용광로가 활성화 되었습니다. ]\n`,
                    ComponentBuilder.progressBar(this.initialRemainTime - this.remainTime, this.initialRemainTime, 'percent', 
                        Utils.colorLerp(0xcccccc, 0xff9900, 1 - this.remainTime / this.initialRemainTime),
                        '110px')
                ]))
            }

            if(this.remainTime <= 0) {
                const results: ItemStack[] = [];
                this.container.contents.forEach(itemStack => {
                    if(itemStack?.item?.type === '제련' && itemStack.item.preset?.smeltResult) {
                        const result = ItemStack.fromName(itemStack.item.preset.smeltResult, itemStack.count);
                        p.inventory.addItem(result.item, result.count);
                        results.push(result);
                    }
                });

                p.sendRawMessage(`[ 제련이 완료되었습니다. ]\n` + 
                    results.map(itemStack => `   ${itemStack.item.getName()} x${itemStack.count}`).join('\n'));
                this.container.contents = [];
                this.isSmelting = false;
            }
        }
        else if(this.isSmelting) this.isSmelting = false;
    }

}