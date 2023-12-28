import { Attribute, ChatManager, ChatRoomManager, LivingEntity, Monster, Player, PlayerLog, Projectile, Resource, Trigger, ZoneType } from "../Internal";
import { AttributeType, Item } from "../Internal";
import Enum from "../util/Enum";
import { Time } from "../Internal";
import { World, Effect, Utils } from "../Internal";
import { AttackOptions, ExtraObject, MessageComponent } from "../../types";
import { ComponentBuilder } from "../server/chat/ComponentBuilder";


export abstract class Entity {

    name: string;
    
    level = 1;
    exp = 0;
    deadTime = 0;
    latestAttack = 0;
    latestHitted = 0;
    latestAttackedEntity: Entity | null = null;
    latestAbuser: LivingEntity | null = null;
    latestAbused = 0;
    location = '';

    stat = new Stat();
    shields: { [key: string]: Shield } = {};
    attribute = new Attribute();
    slot = new EquipmentSlot();
    lateTasks: (() => void)[] = [];

    life = this.maxLife;
    mana = this.maxMana;
    air = this.maxAir;
    water = this.maxWater;
    food = this.maxFood;
    
    constructor(name: string) {
        this.name = name;
    }

    registerLateTask(task: () => void) {
        this.lateTasks.push(task);
    }

    get isAttackEnded() {
        let now = Date.now();
        return !((now - this.latestAttack) < (1 / this.attribute.getValue(AttributeType.ATTACK_SPEED)) * 1000);
    }

    get maxLife() {
        return this.attribute.getValue(AttributeType.MAX_LIFE);
    }

    get maxMana() {
        return this.attribute.getValue(AttributeType.MAX_MANA);
    }

    get maxFood() {
        return this.attribute.getValue(AttributeType.MAX_FOOD);
    }

    get maxWater() {
        return this.attribute.getValue(AttributeType.MAX_WATER);
    }

    get maxAir() {
        return this.attribute.getValue(AttributeType.MAX_AIR);
    }

    static getMaxExp(level: number) {
        return Math.floor(10 + Math.pow(level, 3) + (level < 50 ? level * 10 : level * 100));
    }

    get maxExp() {
        return Entity.getMaxExp(this.level);
    }

    breakEquipItem(type: EquipmentType) {
        let item = this.slot.getItem(type);
        this.slot.setItem(type, null);
        return item;
    }

    earlyUpdate() {
        if (!this.latestAttackedEntity?.isAlive)
            this.latestAttackedEntity = null;

        if(this.deadTime > 0) {
            this.deadTime -= Time.deltaTime;
            this.life = this.maxLife;
            this.mana = this.maxMana;
            this.air = this.maxAir;
            this.water = this.maxWater;
            this.food = this.maxFood;
        }

        EquipmentType.getAll().forEach(type => {
            let item = this.slot.getItem(type);
            if (item != null) {
                if (item.durability != null && item.durability <= 0) {
                    this.breakEquipItem(type);
                }
                else {
                    item.attributeModifiers?.forEach(modifier => {
                        this.attribute.addModifier(modifier)
                    });
                }
            }
        });

        this.attribute.addValue(AttributeType.ATTACK, 
            Utils.clamp(this.stat.getStat(StatType.STRENGTH), 0, 75) * 6.5);
        this.attribute.addValue(AttributeType.ATTACK, 
            Utils.clamp(this.stat.getStat(StatType.STRENGTH) - 75, 0, 170 - 75) * 12.5);
        this.attribute.addValue(AttributeType.ATTACK, 
            Utils.clamp(this.stat.getStat(StatType.STRENGTH) - 170, 0, 1000 - 170) * 14.5);
        this.attribute.addValue(AttributeType.ATTACK, 
            Math.pow(Math.max(this.stat.getStat(StatType.STRENGTH) - 1000, 0), 1.1) * 34);
        this.attribute.addValue(AttributeType.ATTACK, this.level * 10.5);

        this.attribute.addValue(AttributeType.RANGE_ATTACK, 
            Utils.clamp(this.stat.getStat(StatType.STRENGTH), 0, 75) * 7.5);
        this.attribute.addValue(AttributeType.RANGE_ATTACK, 
            Utils.clamp(this.stat.getStat(StatType.STRENGTH) - 75, 0, 170 - 75) * 13.1);
        this.attribute.addValue(AttributeType.RANGE_ATTACK, 
            Utils.clamp(this.stat.getStat(StatType.STRENGTH) - 170, 0, 1000 - 170) * 14.1);
        this.attribute.addValue(AttributeType.RANGE_ATTACK, 
            Math.pow(Math.max(this.stat.getStat(StatType.STRENGTH) - 1000, 0), 1.1) * 25.5);
        this.attribute.addValue(AttributeType.RANGE_ATTACK, this.level * 3);

        this.attribute.addValue(AttributeType.LIFE_REGEN, 
            Math.pow(this.stat.getStat(StatType.VITALITY), 1.2) * 0.33 + this.level * 0.07);
        this.attribute.addValue(AttributeType.MAX_LIFE,
            Utils.clamp(this.stat.getStat(StatType.VITALITY), 0, 100) * 31.5);
        this.attribute.addValue(AttributeType.MAX_LIFE,
            Utils.clamp(this.stat.getStat(StatType.VITALITY) - 100, 0, 250 - 100) * 49.5);
        this.attribute.addValue(AttributeType.MAX_LIFE, 
            Utils.clamp(this.stat.getStat(StatType.VITALITY) - 250, 0, 550 - 250) * 75.5);
        this.attribute.addValue(AttributeType.MAX_LIFE, 
            Utils.clamp(this.stat.getStat(StatType.VITALITY) - 550, 0, 1000 - 550) * 235.5);
        this.attribute.addValue(AttributeType.MAX_LIFE, 
            Utils.clamp(this.stat.getStat(StatType.VITALITY) - 1000, 0, 2000 - 1000) * 315.5);
        this.attribute.addValue(AttributeType.MAX_LIFE, 
            Math.pow(Math.max(this.stat.getStat(StatType.VITALITY) - 2000, 0) * 425.5, 1.05));
        this.attribute.addValue(AttributeType.MAX_LIFE, this.level * 40);
        this.attribute.multiplyValue(AttributeType.MAX_LIFE, 1 + this.level * 0.001);

        this.attribute.addValue(AttributeType.MOVE_SPEED, 
            this.stat.getStat(StatType.AGILITY) * 0.8 + this.level * 0.1);
        this.attribute.multiplyValue(AttributeType.MOVE_SPEED, 
            1 + this.stat.getStat(StatType.STRENGTH) * 0.0025);
        this.attribute.multiplyValue(AttributeType.ATTACK_SPEED,
            1 + this.stat.getStat(StatType.AGILITY) * 0.002);

        this.attribute.addValue(AttributeType.MAGIC_ATTACK,
            Utils.clamp(this.stat.getStat(StatType.SPELL), 0, 75) * 6.5);
        this.attribute.addValue(AttributeType.MAGIC_ATTACK,
            Utils.clamp(this.stat.getStat(StatType.SPELL) - 75, 0, 170 - 75) * 13.5);
        this.attribute.addValue(AttributeType.MAGIC_ATTACK,
            Utils.clamp(this.stat.getStat(StatType.SPELL) - 170, 0, 1000 - 170) * 21.5);
        this.attribute.addValue(AttributeType.MAGIC_ATTACK,
            Math.max(this.stat.getStat(StatType.SPELL) - 1000, 0) * 35);
        this.attribute.addValue(AttributeType.MAGIC_PENETRATE, 
            this.stat.getStat(StatType.SPELL) * 5.1);
        this.attribute.addValue(AttributeType.MAX_MANA, 
            this.stat.getStat(StatType.SPELL) * 28.5 + this.level * 6);
        this.attribute.addValue(AttributeType.MANA_REGEN, 
            this.stat.getStat(StatType.SPELL) * 0.25);

        this.attribute.addValue(AttributeType.DEFEND, 
            this.stat.getStat(StatType.VITALITY) * 1.7);
        this.attribute.addValue(AttributeType.DEFEND_PENETRATE, 
            Utils.clamp(this.stat.getStat(StatType.STRENGTH), 0, 300) * 1.7);
        this.attribute.addValue(AttributeType.DEFEND_PENETRATE, 
            Utils.clamp(this.stat.getStat(StatType.STRENGTH) - 300, 0, 1000 - 300) * 5);
        this.attribute.addValue(AttributeType.DEFEND_PENETRATE, 
            Math.max(0, this.stat.getStat(StatType.STRENGTH) - 1000) * 30.3);

        this.attribute.addValue(AttributeType.CRITICAL_DAMAGE, 
            Utils.clamp(this.stat.getStat(StatType.SENSE), 0, 80) * 0.6);
        this.attribute.addValue(AttributeType.CRITICAL_DAMAGE, 
            Utils.clamp(this.stat.getStat(StatType.SENSE) - 80, 0, 150 - 80) * 0.3);
        this.attribute.addValue(AttributeType.CRITICAL_DAMAGE, 
            Math.max(this.stat.getStat(StatType.SENSE) - 150, 0) * 0.06);
        this.attribute.addValue(AttributeType.CRITICAL_CHANCE, 
            Math.min(this.stat.getStat(StatType.SENSE) * 0.07533, 25));

        this.attribute.addValue(AttributeType.PROJECTILE_SPEED, 
            this.stat.getStat(StatType.AGILITY) * 1.9);
        this.attribute.addValue(AttributeType.PROJECTILE_SPEED, 
            this.stat.getStat(StatType.STRENGTH) * 1.3);
 
        this.attribute.addValue(AttributeType.DEXTERITY, 
            Utils.clamp(this.stat.getStat(StatType.SENSE), 0, 75) * 0.7);
        this.attribute.addValue(AttributeType.DEXTERITY, 
            Utils.clamp(this.stat.getStat(StatType.SENSE) - 75, 0, 170 - 75) * 1.6);
        this.attribute.addValue(AttributeType.DEXTERITY, 
            Utils.clamp(this.stat.getStat(StatType.SENSE) - 170, 0, 250 - 170) * 2);
        this.attribute.addValue(AttributeType.DEXTERITY, 
            Math.max(this.stat.getStat(StatType.SENSE) - 250, 0) * 2.8);
    }

    update() {
        EquipmentType.getAll().forEach(type => {
            let item = this.slot.getItem(type);
            item?.options?.forEach(option => {
                option.onUpdate(this);
                if (option.time > 0) {
                    option.time -= Time.deltaTime;
                    if (option.time <= 0) item?.options?.splice(item.options.indexOf(option), 1);
                }
            });
        });
    }

    getLocation() {
        return World.getLocation(this.location);
    }

    lateUpdate() {
        this.attribute.updateValues();

        for (let k of Object.keys(this.shields)) {
            let shield = this.shields[k];
            if ((shield.duration -= Time.deltaTime) <= 0) delete this.shields[k];
        };

        this.heal(this.attribute.getValue(AttributeType.LIFE_REGEN) * Time.deltaTime, this);
        this.mana += this.attribute.getValue(AttributeType.MANA_REGEN) * Time.deltaTime;
        this.food -= this.attribute.getValue(AttributeType.FOOD_DEPLETE) * Time.deltaTime;
        this.water -= this.attribute.getValue(AttributeType.WATER_DEPLETE) * Time.deltaTime;

        if(this.life > this.maxLife) this.life = this.maxLife;
        if(this.mana > this.maxMana) this.mana = this.maxMana;
        if(this.water > this.maxWater) this.water = this.maxWater;
        if(this.air > this.maxAir) this.air = this.maxAir;
        if(this.food > this.maxFood) this.food = this.maxFood;

        this.lateTasks.forEach(task => task());
        this.lateTasks = [];

        if(this.life <= 0 && this.deadTime <= 0) {
            this.onDeath();
        }
    }

    attack(victim: Entity, options: AttackOptions = {}): boolean {
        if (!victim) return false;
        if(!victim.isAlive) return false;

        const now = Date.now();
        const abuser = this instanceof Projectile ? this.owner : this;
        const location = this.getLocation();
        if(location === null) return false;

        if(abuser instanceof LivingEntity) {
            abuser.currentTarget = victim;
            if(victim instanceof Player && !victim.currentTarget?.isAlive)
                victim.currentTarget = abuser;
        }

        if(abuser instanceof Player) {
            if(victim instanceof Resource) {
                if(!victim.canDestroy(abuser)) {
                    abuser.sendRawMessage('[ ' + victim.destroyableCondition + ' ]');
                    return false;
                }
            }
            if (victim instanceof Monster && 
                !Array.from(victim.targets)
                    .some(p => p instanceof Player && p.getPartyOwner() === abuser.getPartyOwner()) &&
                victim.targets.size > 0) {
                    abuser.sendRawMessage('[ 다른 파티가 이미 싸우고 있습니다. ]');
                return false;
            }
            if (victim instanceof Resource && 
                victim.latestAbuser instanceof Player && 
                victim.latestAbuser.getPartyOwner() !== abuser.getPartyOwner() &&
                Date.now() - victim.latestAbused < 1000 * 10) {
                    abuser.sendRawMessage('[ 다른 파티가 이미 파괴하고 있습니다. ]');
                return false;
            }
            let location = this.getLocation();
            if (victim instanceof Player && location.zoneType === ZoneType.PEACEFUL && abuser !== victim) {
                abuser.sendRawMessage('[ 평화지역에서는 싸울 수 없습니다. ]');
                return false;
            }

            if ((!this.isAttackEnded) ||
                (options.applyAttackSpeed && !abuser.isAttackEnded)) {
                abuser.showActionBar(ComponentBuilder.text(
                    '[ 공격이 끝나지 않았습니다. ]',
                    { color: 'yellow' }));
                if(abuser.tickMessageId) 
                    abuser.user.room?.removeChat(abuser.tickMessageId);
                return false;
            }
        }

        if(abuser instanceof LivingEntity) {
            if(!abuser.canAttack) {
                if(abuser instanceof Player)
                    abuser.sendRawMessage('[ ' + (abuser.cannotAttackMessage ?? '공격할 수 없는 상태입니다.') + ' ]');
                else abuser.latestAttack = now;
                return false;
            }

            victim.latestAbuser = abuser;
        }

        this.latestAttack = now;
        if (options.applyAttackSpeed) abuser.latestAttack = now;

        abuser.latestAttackedEntity = victim;

        let avoidChance = Math.min(
            Math.max(
                (victim.attribute.getValue(AttributeType.MOVE_SPEED) - this.attribute.getValue(AttributeType.MOVE_SPEED)) / 
                    Math.max(this.attribute.getValue(AttributeType.MOVE_SPEED), 0) * (1 / (1.8 - 1)),
                Math.min(0.002 * victim.attribute.getValue(AttributeType.MOVE_SPEED) / 100, 0.12)
            ),
            victim.attribute.getValue(AttributeType.MOVE_SPEED) > 10 && this.attribute.getValue(AttributeType.MOVE_SPEED) > 0 ? 
                0.95 : 1
        );


        if (!options.absoluteHit) {
            let isAvoided = Math.random() < avoidChance && 
                victim instanceof LivingEntity && 
                victim.canMove && victim.canAvoid;
            if (isAvoided) {
                if (abuser instanceof Player) {
                    abuser.sendRawMessage('[ 상대가 피했습니다. ]');
                    if (victim instanceof Player && victim.user.currentRoom !== abuser.user.currentRoom) {
                        victim.sendRawMessage('[ ' + abuser.getName() + '님이 공격했지만, 피했습니다. ]');
                    }
                }
                else if (victim instanceof Player) {
                    victim.sendRawMessage('[ ' + victim.getName() + '님이 피했습니다. ]');
                }
                return false;
            }
            else if (victim instanceof LivingEntity && !victim.isVisible && Math.random() < 0.95) {
                if (abuser instanceof Player) {
                    abuser.sendRawMessage('[ 상대가 보이지 않습니다. ]');
                    if (victim instanceof Player && victim.user.currentRoom !== abuser.user.currentRoom) {
                        victim.sendRawMessage('[ ' + abuser.getName() + '님이 공격했지만, 투명 상태로 피했습니다. ]');
                    }
                }
                else if (victim instanceof Player) {
                    victim.sendRawMessage('[ ' + victim.getName() + '님이 투명 상태로 피했습니다. ]');
                }
                return false;
            }
        }

        let critChance = this.attribute.getValue(AttributeType.CRITICAL_CHANCE);
        let critIncrease = this.attribute.getValue(AttributeType.CRITICAL_DAMAGE);

        if(options.useAbuserCritical) {
            critChance = abuser.attribute.getValue(AttributeType.CRITICAL_CHANCE);
            critIncrease = abuser.attribute.getValue(AttributeType.CRITICAL_DAMAGE);
        }

        let finalAttack = this.attribute.getValue(options.isMagicAttack ? 
            AttributeType.MAGIC_ATTACK : AttributeType.ATTACK);
        let finalPenetrate = this.attribute.getValue(options.isMagicAttack ? 
            AttributeType.MAGIC_PENETRATE : AttributeType.DEFEND_PENETRATE);
        let finalDefend = Math.max(0, victim.attribute.getValue(options.isMagicAttack ? 
            AttributeType.MAGIC_RESISTANCE : AttributeType.DEFEND) - finalPenetrate);

        if(options.isFixedAttack) {
            finalDefend = 0;
        }

        let normalDamage = Math.max(0, finalAttack - finalDefend) * (1 - Attribute.getDefendRatio(finalDefend));
        let critDamage = Math.random() < critChance / 100 ? normalDamage * critIncrease / 100 : 0;
        let finalDamage = normalDamage + critDamage;

        victim.damage(finalDamage, abuser instanceof LivingEntity ? abuser: null);
        this.onHit(victim);
        if(this instanceof Projectile) abuser.onProjectileHit(this, victim);
        if(options.onHit) options.onHit(this, victim);
        victim.onHitted(this);

        [
            this.slot.hand,
            victim.slot.head,
            victim.slot.body,
            victim.slot.legs,
            victim.slot.feet,
            victim.slot.accessory
        ].forEach(item => {
            if (item && item.durability) item.durability--;
        });

        if(abuser instanceof Player) {
            if(critDamage > 0) abuser.log.addLog(PlayerLog.CRITICAL_COUNT);
            abuser.log.addLog(PlayerLog.ATTACK_COUNT);
            abuser.log.addLog(PlayerLog.TYPED_ATTACK_COUNT(
                this.slot.hand?.type ?? (this instanceof Projectile ? 'projectile': 'none')));
        }
/*
        const abuserName = this !== abuser ? this.getName() + (abuser ? '(' + abuser.getName() + ')': '') : abuser.getName();
        let abuserNumber = 0;
        if(abuser instanceof Entity) {
            abuserNumber = location.objects.findIndex(o => o === abuser) + 1;
        }

        let attackMessage = ComponentBuilder.embed([
            ComponentBuilder.text(`[ ${abuserName + (abuserNumber > 0 ? '(' + abuserNumber + ')': '')} ▶ ${victim.getName()} ]\n`),
            options.additionalMessage ? 
                ComponentBuilder.message([options.additionalMessage, ComponentBuilder.text('\n')]) : 
                ComponentBuilder.empty(),
            ComponentBuilder.text(`${finalDamage.toFixed(1) + (critDamage > 0 ? '(+' + critDamage.toFixed(1) + ')' : '')}만큼 피해를 주었습니다!\n`),
            ComponentBuilder.progressBar(victim.life, victim.maxLife, 'percent')
        ], abuser instanceof Player ? Utils.MAIN_COLOR : 'red');*/

        let attackMessage = Entity.createAttackMessage(abuser, this, victim, finalDamage, critDamage, options.additionalMessage);

        let sendTargets: Player[] = [];
        if(abuser instanceof Player) sendTargets.push(abuser);
        if(victim instanceof Player) sendTargets.push(victim);

        Player.sendGroupMessage(sendTargets, attackMessage);

        return true;
    }

    static createAttackMessage(abuser: Entity, attacker: Entity, victim: Entity, 
        finalDamage: number, critDamage: number, additionalMessage?: MessageComponent) {

        const abuserName = attacker !== abuser ? 
        attacker.getName() + (abuser ? '(' + abuser.getName() + ')': '') : 
        abuser.getName();
        let abuserNumber = 0;
        if(abuser instanceof Monster) {
            abuserNumber = (abuser as Monster).getLocation().objects.findIndex(o => o === abuser) + 1;
        }

        return ComponentBuilder.embed([
            ComponentBuilder.text(`[ ${abuserName + (abuserNumber > 0 ? '(' + abuserNumber + ')': '')} ▶ ${victim.getName()} ]\n`),
            additionalMessage ? 
                ComponentBuilder.message([additionalMessage!!, ComponentBuilder.text('\n')]) : 
                ComponentBuilder.empty(),
            ComponentBuilder.text(`${finalDamage.toFixed(1) + (critDamage > 0 ? '(+' + critDamage.toFixed(1) + ')' : '')}만큼 피해를 주었습니다!\n`),
            ComponentBuilder.progressBar(victim.life, victim.maxLife, 'percent')
        ], abuser instanceof Player ? Utils.MAIN_COLOR : 'red')
    }

    damage(damage: number, abuser: LivingEntity | null = null) {
        if (abuser) {
            this.latestAbuser = abuser;
            this.latestAbused = Date.now();
        }
        for (let k in this.shields) {
            let shield = this.shields[k];
            if (shield.amount > damage) {
                shield.amount -= damage;
                damage = 0;
            }
            else {
                damage -= shield.amount;
                delete this.shields[k];
            }
        }
        this.life -= damage;
    }

    addShield(key: string, amount: number, duration: number) {
        this.shields[key] = new Shield(amount, duration);
    }

    heal(healAmount: number, healer: Entity | null = null) {
        healAmount *= this.attribute.getValue(AttributeType.HEAL_EFFICIENCY) / 100;
        this.life += healAmount;

        if(healer instanceof LivingEntity && this instanceof LivingEntity) {
            this.getLocation()?.objects?.forEach(m => {
                if(m instanceof Monster && this instanceof LivingEntity && 
                    m.targets.has(this) && !m.targets.has(healer))
                    m.targets.add(healer);
            });
        }

        return healAmount;
    }

    abstract onDeath(): void;

    get isDead() {
        return this.life <= 0 || this.deadTime > 0;
    }

    get isAlive() {
        if(this.isDead) return false;
        return true;
    }

    getName() {
        return this.name;
    }

    onHit(victim: Entity) {
        EquipmentType.getAll().forEach(type => {
            const item = this.slot.getItem(type);
            item?.options?.forEach(option => {
                option.onHit(this, victim);
            });
        });
    }

    onProjectileHit(projectile: Projectile, victim: Entity) {
        EquipmentType.getAll().forEach(type => {
            const item = this.slot.getItem(type);
            item?.options?.forEach(option => {
                option.onProjectileHit(projectile, victim);
            });
        });
    }

    onHitted(attacker: Entity) {
        this.latestHitted = Date.now();
        EquipmentType.getAll().forEach(type => {
            const item = this.slot.getItem(type);
            item?.options?.forEach(option => {
                option.onHitted(this, attacker);
            });
        });
    }

    toString() {
        return this.name;
    }
}

export class Stat {

    values = new WeakMap<StatType, number>();

    constructor() {
        StatType.getAll().forEach(type => {
            this.values.set(type, 0);
        });
    }

    getStat(type: StatType): number {
        return this.values.get(type) ?? 0;
    }

    setStat(type: StatType, value: number) {
        this.values.set(type, value);
    }

    addStat(type: StatType, value: number) {
        this.setStat(type, this.getStat(type) + value);
    }

    toDataObj() {
        let values: ExtraObject = {};
        for(let type of StatType.getAll()) {
            values[type.name] = this.getStat(type);
        }
        return values;
    }

    static fromDataObj(obj: ExtraObject) {
        if(!obj) return null;
        let newStat = new Stat();

        for(let typeName in obj) {
            let type = StatType.getByName(typeName);
            if(type) newStat.setStat(type, obj[typeName]);
        }

        return newStat;
    }
}

export class EquipmentType extends Enum {

    displayName: string;

    private constructor(name: string, displayName: string) {
        super(name);
        this.displayName = displayName;
    }

    static HAND = new EquipmentType('hand', '손');
    static HEAD = new EquipmentType('head', '머리');
    static BODY = new EquipmentType('body', '상체');
    static LEGS = new EquipmentType('legs', '하체');
    static FEET = new EquipmentType('feet', '발');
    static ACCESSORY = new EquipmentType('accessory', '장신구');
    static BACKPACK = new EquipmentType('backpack', '가방');

    static getAll(): EquipmentType[] {
        return Enum.getAll(EquipmentType);
    }

    static getByDisplayName(displayName: string): EquipmentType | null {
        return this.getAll().find(type => type.displayName === displayName) ?? null;
    }
}

export class EquipmentSlot {

    items: { [key: string]: Item | null } = {};

    constructor() {
        EquipmentType.getAll().forEach(type => {
            this.items[type.name] = null;
        })
    }

    getItem(type: EquipmentType) {
        return this.items[type.name];
    }

    setItem(type: EquipmentType, item: Item | null) {
        this.items[type.name] = item;
    }

    get hand() { return this.getItem(EquipmentType.HAND); }
    get head() { return this.getItem(EquipmentType.HEAD); }
    get body() { return this.getItem(EquipmentType.BODY); }
    get legs() { return this.getItem(EquipmentType.LEGS); }
    get feet() { return this.getItem(EquipmentType.FEET); }
    get accessory() { return this.getItem(EquipmentType.ACCESSORY); }
    get backpack() { return this.getItem(EquipmentType.BACKPACK); }

    set hand(item: Item | null) { this.setItem(EquipmentType.HAND, item); }
    set head(item: Item | null) { this.setItem(EquipmentType.HEAD, item); }
    set body(item: Item | null) { this.setItem(EquipmentType.BODY, item); }
    set legs(item: Item | null) { this.setItem(EquipmentType.LEGS, item); }
    set feet(item: Item | null) { this.setItem(EquipmentType.FEET, item); }
    set accessory(item: Item | null) { this.setItem(EquipmentType.ACCESSORY, item); }
    set backpack(item: Item | null) { this.setItem(EquipmentType.BACKPACK, item); }

    toDataObj() {
        return {
            hand: this.hand?.toDataObj(),
            head: this.head?.toDataObj(),
            body: this.body?.toDataObj(),
            legs: this.legs?.toDataObj(),
            feet: this.feet?.toDataObj(),
            accessory: this.accessory?.toDataObj(),
            backpack: this.backpack?.toDataObj()
        };
    }

    static fromDataObj(obj: ExtraObject) {
        if(!obj) return null;
        let newSlot = new EquipmentSlot();

        newSlot.hand = Item.fromDataObj(obj.hand);
        newSlot.head = Item.fromDataObj(obj.head);
        newSlot.body = Item.fromDataObj(obj.body);
        newSlot.legs = Item.fromDataObj(obj.legs);
        newSlot.feet = Item.fromDataObj(obj.feet);
        newSlot.accessory = Item.fromDataObj(obj.accessory);
        newSlot.backpack = Item.fromDataObj(obj.backpack);

        return newSlot;
    }
}

export class StatType extends Enum {

    displayName: string;

    constructor(name: string, displayName: string) {
        super(name);
        this.displayName = displayName;
    }

    static getAll(): StatType[] {
        return Enum.getAll(StatType);
    }

    static getByName(name: string) {
        return StatType.getAll().find(type => type.name === name);
    }

    static getByDisplayName(displayName: string): StatType | null {
        return StatType.getAll().find(type => type.displayName === displayName) ?? null;
    }

    static STRENGTH = new StatType('strength', '근력');
    static VITALITY = new StatType('vitality', '체력');
    static AGILITY = new StatType('agility', '민첩');
    static SPELL = new StatType('spell', '마법');
    static SENSE = new StatType('sense', '감각');
}

export class Shield {

    amount = 0;
    duration = 0;

    constructor(amount: number, duration: number) {
        this.amount = amount;
        this.duration = duration;
    }

    toDataObj() {
        return {
            ...this
        }
    }

    static fromDataObj(obj: ExtraObject) {
        if(!obj) return null;
        return new Shield(obj.amount, obj.duration);
    }
}