import AttributeType from "./AttributeType.mjs";
import Entity from "./Entity.mjs";
import Player from "./Player.mjs";
import Time from "./Time.mjs";
import Utils from "./Utils.mjs";

export default class Resource extends Entity {

    /**
     * @param {object} preset 
     * preset 객체 속성
     * - name(string) 고유 이름
     * - displayName(string) 표시 이름
     * - level(number) 자원 레벨
     * - regenTime(number) 재생성 시간
     * - drops(DropItem[]) 드롭 아이템들
     * - onUpdate(func()) 업데이트 이벤트 콜백
     * - onDestroy(func(abuser)) 
     */
    constructor(preset = {}) {
        super(preset.name ?? 'unnamed');

        this.displayName = preset.displayName ?? null;
        this.level = preset.level ?? this.level;
        this.regenTime = preset.regenTime ?? 60 * 3;
        this.drops = Utils.deepClone(preset.drops) || [];
        this.onUpdate = preset.onUpdate || null;
        this.onDestroy = preset.onDestroy || null;

        this.attribute.setDefault(AttributeType.LIFE_REGEN, 0);

        if (preset.attributes) {
            for(let key in preset.attributes) {
                let type = AttributeType.getByName(key);
                if(type) this.attribute.setDefault(type, preset.attributes[key]);
            }
        }

        if (preset.stat) {
            Object.keys(preset.stat).forEach(statName => {
                if (statName in this.stat)
                    this.stat[statName] = preset.stat[statName];
            })
        }
    }

    getName() {
        return this.displayName ?? super.getName();
    }

    update(delta = Time.deltaTime) {
        super.update(delta);

        this.onUpdate?.call(this, delta);
    }

    onDeath() {
        super.onDeath();
        this.onDestroy?.call(this);

        let abuser = this.latestAbuser;

        if(abuser instanceof Player) {
            abuser.log.addLog(Player.Log.DESTROY_OBJECT_COUNT, 1);
            abuser.log.addLog(Player.Log.DESTROY_NAMED_OBJECT_COUNT(this.name), 1);

            let rewards = [];
            let gettingExp = abuser.calcGettingExp(this);

            this.drops.forEach(dropItem => {
                let itemStack = dropitem.createItemStack();
                if(!itemStack) return;
                abuser.inventory.addItem(itemStack.item, itemStack.count);
                rewards.push(`${itemStack.item.getName()} x${itemStack.count}`);
            });
            abuser.exp += gettingExp;
            rewards.push(`${gettingExp.toFixed(0)} Exp`);
            abuser.sendMessage(`[ ${this.getName()}(을)를 파괴하셨습니다! ]\n` +
                `▌ 보상\n` +
                rewards.map(r => '   ▸ ' + r).join('\n')
            );
        }
    }

    canDestroy(p) {
        let type = p.slot.hand?.type ?? '맨손';
        return this.preset?.destroyableTypes?.includes(type) ?? false;
    }

    get destroyableCondition() {
        return `${this.preset?.destroyableTypes?.join(', ') ?? '모든 형태'}(으)로만 파괴할 수 있습니다.`;
    }

    get preset() {
        return ResourcePreset.getResourcePreset(this.name);
    }

    static fromName(name) {
        return new Resource(ResourcePreset.getResourcePreset(name));
    }
}