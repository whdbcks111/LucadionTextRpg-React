import { Utils } from "../Internal";
import Enum from "../util/Enum";

export class AttributeType extends Enum {

    displayName: string;
    defaultValue: number;
    minValue: number;
    maxValue: number;
    fixPosition: number;
    suffix: string;

    private constructor(name: string, displayName: string, fixPos = 1, suffix = '', defaultValue = 0, 
        minValue = Number.MIN_VALUE, maxValue = Number.MAX_VALUE) {
        super(name);

        this.displayName = displayName;
        this.defaultValue = defaultValue;
        this.minValue = minValue;
        this.maxValue = maxValue;
        this.fixPosition = fixPos;
        this.suffix = suffix;
    }

    asSubjective(): string {
        return Utils.asSubjective(this.displayName);
    } 

    asObjective(): string {
        return Utils.asObjective(this.displayName);
    }

    asWith(): string {
        return Utils.asWith(this.displayName);
    }

    static getAll(): AttributeType[] {
        return Enum.getAll(AttributeType);
    }

    static getByName(name: string) {
        return this.getAll().find(type => type.name === name) ?? null;
    }

    static ATTACK = new AttributeType('attack', '물리 공격력', 1, '', 30, 0);
    static RANGE_ATTACK = new AttributeType('rangeAttack', '원거리 공격력', 1, '', 50, 0);
    static MAGIC_ATTACK = new AttributeType('magicAttack', '마법 공격력', 1, '', 0, 0);
    static DEFEND_PENETRATE = new AttributeType('defendPenetrate', '방어력 관통력', 1, '', 0, 0);
    static MAGIC_PENETRATE = new AttributeType('magicPenetrate', '마법 관통력', 1, '', 0, 0);
    static DEFEND = new AttributeType('defend', '물리 방어력', 1, '', 20, 0);
    static MAGIC_RESISTANCE = new AttributeType('magicResistance', '마법 저항력', 1, '', 0, 0);
    static MAX_LIFE = new AttributeType('maxLife', '최대 생명력', 1, '', 500, 0);
    static MAX_MANA = new AttributeType('maxMana', '최대 마나', 1, '', 500, 0);
    static MAX_FOOD = new AttributeType('maxFood', '최대 포만감', 1, '', 500, 0);
    static MAX_AIR = new AttributeType('maxAir', '최대 산소', 1, '', 100, 0);
    static MAX_WATER = new AttributeType('maxWater', '최대 수분', 1, '', 500, 0);
    static PROJECTILE_SPEED = new AttributeType('projectileSpeed', '투사체 속도', 1, '', 300, 0);
    static MOVE_SPEED = new AttributeType('moveSpeed', '이동 속도', 1, '', 100, 0);
    static ATTACK_SPEED = new AttributeType('attackSpeed', '공격 속도', 2, '', 0.8, 0);
    static CRITICAL_CHANCE = new AttributeType('criticalChance', '치명타 확률', 1, '%', 5, 0, 100);
    static CRITICAL_DAMAGE = new AttributeType('criticalDamage', '치명타 공격력', 1, '%', 50, 0);
    static HEAL_EFFICIENCY = new AttributeType('healEfficiency', '회복 효율', 1, '%', 100, 0);
    static EXP_EFFCIENECY = new AttributeType('expEfficiency', '경험치 효율', 1, '%', 80, 0, 100);
    static DEXTERITY = new AttributeType('dexterity', '손재주', 1, '', 0, 0);
    static LUCK = new AttributeType('luck', '행운', 1, '', 0, 0);
    static INVENTORY_SPACE = new AttributeType('inventorySpace', '인벤토리 공간', 1, '', 30, 0);
    static LIFE_REGEN = new AttributeType('lifeRegen', '생명력 재생', 1, '', 3, 0);
    static MANA_REGEN = new AttributeType('manaRegen', '마나 재생', 1, '', 2, 0);
    static FOOD_DEPLETE = new AttributeType('foodDeplete', '포만감 감소', 1, '', 0.05, 0);
    static WATER_DEPLETE = new AttributeType('waterDeplete', '수분 감소', 1, '', 0.03, 0);
}