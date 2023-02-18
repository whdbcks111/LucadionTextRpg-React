import { NullableString } from "../../types";
import { ResourcePreset, AttributeType, Entity, StatType } from "../Internal"
import { Player, PlayerLog } from "./Player";

export class Resource extends Entity {

    displayName: NullableString;
    regenTime: number;

    constructor(name: string) {
        super(name);

        let preset = ResourcePreset.getResourcePreset(name);
        if(!preset) throw new Error('Invalid Resource Name');

        this.displayName = preset.displayName ?? null;
        this.level = preset.level ?? this.level;
        this.regenTime = preset.regenTime ?? 60 * 3;

        this.attribute.setDefault(AttributeType.LIFE_REGEN, 0);

        if (preset.attributes) {
            for(let key in preset.attributes) {
                let type = AttributeType.getByName(key);
                if(type) this.attribute.setDefault(type, preset.attributes[key]);
            }
        }

        if (preset.stat) {
            for(let key in preset.stat) {
                let type = StatType.getByName(key);
                if(type) this.stat.setStat(type, preset.stat[key]);
            }
        }

        this.registerLateTask(() => {
            this.life = this.maxLife;
        });
    }

    rewardPlayer(player: Player): void {
        let rewards = [];
        let gettingExp = player.getGettingExp(this);

        this.drops.forEach(dropItem => {
            let itemStack = dropItem.createItemStack();
            if(!itemStack) return;
            player.inventory.addItem(itemStack.item, itemStack.count);
            rewards.push(`${itemStack.item.getName()} x${itemStack.count}`);
        });

        player.exp += gettingExp;
        rewards.push(`${gettingExp.toFixed(0)} Exp`);
        player.sendRawMessage(`[ ${this.getName()}(을)를 파괴하셨습니다! ]\n` +
            `▌ 보상\n` +
            rewards.map(r => '   ▸ ' + r).join('\n')
        );
    }

    get drops() {
        return this.preset?.drops ?? [];
    }

    getName() {
        return this.displayName ?? super.getName();
    }

    update() {
        super.update();

        if(this.preset?.onUpdate) this.preset.onUpdate(this);
    }

    onDeath() {
        this.deadTime = this.regenTime;
        let abuser = this.latestAbuser;

        if(abuser instanceof Player) {
            if(this.preset?.onDestroy) this.preset.onDestroy(this, abuser);
            abuser.log.addLog(PlayerLog.DESTROY_OBJECT_COUNT, 1);
            abuser.log.addLog(PlayerLog.DESTROY_NAMED_OBJECT_COUNT(this.name), 1);

            this.rewardPlayer(abuser);
        }
    }

    canDestroy(p: Player) {
        let type = p.slot.hand?.type ?? '맨손';
        return this.preset?.destroyableTypes?.includes(type) ?? true;
    }

    get destroyableCondition() {
        return `${this.preset?.destroyableTypes?.join(', ') ?? '모든 형태'}(으)로만 파괴할 수 있습니다.`;
    }

    get preset() {
        return ResourcePreset.getResourcePreset(this.name);
    }

    static fromName(name: string) {
        return new Resource(name);
    }
}