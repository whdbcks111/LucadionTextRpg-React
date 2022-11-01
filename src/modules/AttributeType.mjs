import Enum from "./Enum.mjs";

export default class AttributeType extends Enum {

    constructor(name, displayName, defaultValue = 0, 
        minValue = Number.MIN_VALUE, maxValue = Number.MAX_VALUE) {
        super(name);

        this.displayName = displayName;
        this.defaultValue = defaultValue;
        this.minValue = minValue;
        this.maxValue = maxValue;
    }

    static getAll() {
        return Enum.getAll(AttributeType);
    }

    static getByName(name) {
        return this.getAll().find(type => type.name === name) ?? null;
    }

    static EXP_EFFCIENECY = new AttributeType('expEfficiency', '경험치 효율', 80, 0, 100);
    static MAX_LIFE = new AttributeType('maxLife', '최대 생명력', 0, 0);
    static MAX_MANA = new AttributeType('maxMana', '최대 마나', 0, 0);
    static MAX_FOOD = new AttributeType('maxFood', '최대 포만감', 0, 0);
    static MAX_AIR = new AttributeType('maxAir', '최대 산소', 0, 0);
    static MAX_WATER = new AttributeType('maxWater', '최대 수분', 0, 0);
    static LIFE_REGEN = new AttributeType('lifeRegen', '생명력 재생', 0, 0);
    static MANA_REGEN = new AttributeType('manaRegen', '마나 재생', 0, 0);
    static FOOD_DEPLETE = new AttributeType('foodDeplete', '포만감 감소', 0, 0);
    static WATER_DEPLETE = new AttributeType('waterDeplete', '수분 감소', 0, 0);
    static LUCK = new AttributeType('luck', '행운', 0, 0);
    static PROJECTILE_SPEED = new AttributeType('projectileSpeed', '투사체 속도', 0, 0);
    static MOVE_SPEED = new AttributeType('moveSpeed', '이동 속도', 0, 0);
    static ATTACK_SPEED = new AttributeType('attackSpeed', '공격 속도', 0, 0);
    static ATTACK = new AttributeType('attack', '물리 공격력', 0, 0);
    static RANGE_ATTACK = new AttributeType('rangeAttack', '원거리 공격력', 0, 0);
    static MAGIC_ATTACK = new AttributeType('magicAttack', '마법 공격력', 0, 0);
    static DEFEND_PENETRATE = new AttributeType('defendPenetrate', '방어력 관통력', 0, 0);
    static MAGIC_PENETRATE = new AttributeType('magicPenetrate', '마법 관통력', 0, 0);
    static DEFEND = new AttributeType('defend', '물리 방어력', 0, 0);
    static MAGIC_RESISTANCE = new AttributeType('magicResistance', '마법 저항력', 0, 0);
    static CRITICAL_CHANCE = new AttributeType('criticalChance', '치명타 확률', 0, 0);
    static CRITICAL_DAMAGE = new AttributeType('criticalDamage', '치명타 공격력', 0, 0);
    static HEAL_EFFICIENCY = new AttributeType('healEfficiency', '회복 효율', 0, 0);
    static DEXTERITY = new AttributeType('dexterity', '손재주', 0, 0);
    static INVENTORY_SPACE = new AttributeType('inventorySpace', '인벤토리 공간', 30, 0);
}