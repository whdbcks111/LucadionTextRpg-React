import Attribute from "./Attribute.mjs";
import AttributeType from "./AttributeType.mjs";
import Enum from "./Enum.mjs";
import LivingEntity from "./LivingEntity.mjs";
import Player from "./Player.mjs";
import Projectile from "./Projectile.mjs";
import Resource from "./Resource.mjs";
import Time from "./Time.mjs";
import Utils from "./Utils.mjs";

export default class Entity {
    
    constructor(name) {
        this.name = name;
        
        this.level = 1;
        this.exp = 0;
        this.stat = new Stat();
        this.deadTime = 0;
        this.latestAttack = 0;
        this.latestHitted = 0;
        this.latestAttackedEntity = null;
        this.latestAbuser = null;
        this.latestAbused = 0;
        this.location = '';

        this.shields = {};
        this.attribute = new Attribute();
        this.latestAttributes = Utils.deepClone(this.attributes);
        this.slot = new EquipmentSlot();

        this.life = this.maxLife;
        this.mana = this.maxMana;
        this.air = this.maxAir;
        this.water = this.maxWater;
        this.food = this.maxFood;
    }

    addEffect(eff) {
        //nothing to work, for child class
    }

    isAttackEnded() {
        let now = Date.now();
        return !((now - this.latestAttack) < (1 / this.latestAttributes.attackSpeed) * 1000);
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

    static getMaxExp(level) {
        return parseInt(10 + Math.pow(level, 3) + (level < 50 ? level * 10 : level * 100));
    }

    get maxExp() {
        return Entity.getMaxExp(this.level);
    }

    breakEquipItem(slotName) {
        let item = this.slot[slotName];
        this.slot[slotName] = null;
        return item;
    }

    earlyUpdate(delta = Time.deltaTime) {
        if (!this.latestAttackedEntity?.isAlive)
            this.latestAttackedEntity = null;
        if (!this.currentTarget?.isAlive || !this.isAlive)
            this.currentTarget = null;

        if(this.life <= 0 && this.deadTime <= 0) {
            this.onDeath();
        }
        else if(this.deadTime > 0) {
            this.deadTime -= delta;
            this.life = this.maxLife;
            this.mana = this.maxMana;
            this.air = this.maxAir;
            this.water = this.maxWater;
            this.food = this.maxFood;
        }

        EquipmentSlot.slotNames.forEach(slotName => {
            let item = this.slot[slotName];
            if (item) {
                if (item.durability <= 0) {
                    this.breakEquipItem(slotName);
                }
                else {
                    item.attributeModifiers?.forEach(modifier => {
                        this.attribute.addModifier(modifier)
                    });
                }
            }
        });

        this.attribute.addValue(AttributeType.ATTACK, Math.min(this.stat.strength, 75) * 6.5 + (this.level - 1) * 2);
        this.attribute.addValue(AttributeType.ATTACK, Math.min(Math.max(this.stat.strength - 75, 0), 170) * 10.5);
        this.attribute.addValue(AttributeType.ATTACK, Math.max(this.stat.strength - 170, 0) * 13);

        this.attribute.addValue(AttributeType.RANGE_ATTACK, Math.min(this.stat.strength, 75) * 7.5 + (this.level - 1) * 2);
        this.attribute.addValue(AttributeType.RANGE_ATTACK, Math.min(Math.max(this.stat.strength - 75, 0), 170) * 11.1);
        this.attribute.addValue(AttributeType.RANGE_ATTACK, Math.max(this.stat.strength - 170, 0) * 13.5);

        this.attribute.addValue(AttributeType.LIFE_REGEN, this.stat.vitality * 0.23);
        this.attribute.addValue(AttributeType.MAX_LIFE, Math.min(this.stat.vitality, 100) * 31.5);
        this.attribute.addValue(AttributeType.MAX_LIFE,
            Math.min(Math.max(this.stat.vitality - 100, 0), 250) * 45.5 + (this.level - 1) * 5);
        this.attribute.addValue(AttributeType.MAX_LIFE, Math.min(Math.max(this.stat.vitality - 250, 0), 550) * 65.5);
        this.attribute.addValue(AttributeType.MAX_LIFE, Math.max(this.stat.vitality - 550, 0) * 125.5);
        this.attribute.addValue(AttributeType.MAX_LIFE, this.level * 40);

        this.attribute.addValue(AttributeType.MOVE_SPEED, this.stat.agility * 0.8 + (this.level - 1) * 0.1);
        this.attribute.multiplyValue(AttributeType.MOVE_SPEED, 1 + this.stat.strength * 0.003);
        this.attribute.multiplyValue(AttributeType.ATTACK_SPEED, 1 + this.stat.agility * 0.004);

        this.attribute.addValue(AttributeType.MAGIC_ATTACK, Math.min(this.stat.spell, 75) * 7.5 + (this.level - 1) * 2);
        this.attribute.addValue(AttributeType.MAGIC_ATTACK, Math.min(Math.max(this.stat.spell - 75, 0), 170) * 15.5);
        this.attribute.addValue(AttributeType.MAGIC_ATTACK, Math.max(this.stat.spell - 170, 0) * 19);
        this.attribute.addValue(AttributeType.MAGIC_PENETRATE, this.stat.spell * 3.1);
        this.attribute.addValue(AttributeType.MAX_MANA, this.stat.spell * 28.5 + (this.level - 1) * 6);
        this.attribute.addValue(AttributeType.MANA_REGEN, this.stat.spell * 0.15);

        this.attribute.addValue(AttributeType.DEFEND, this.stat.vitality * 1.7);
        this.attribute.addValue(AttributeType.DEFEND_PENETRATE, Math.min(this.stat.strength, 300) * 1.7);
        this.attribute.addValue(AttributeType.DEFEND_PENETRATE, Math.max(0, Math.min(this.stat.strength - 300, 1000)) * 3);
        this.attribute.addValue(AttributeType.DEFEND_PENETRATE, Math.max(0, this.stat.strength - 1000) * 5.3);

        this.attribute.addValue(AttributeType.CRITICAL_DAMAGE, Math.min(this.stat.sense, 80) * 0.9);
        this.attribute.addValue(AttributeType.CRITICAL_DAMAGE, Math.min(Math.max(this.stat.sense - 80, 0), 150) * 0.5);
        this.attribute.addValue(AttributeType.CRITICAL_DAMAGE, Math.max(this.stat.sense - 150, 0) * 0.1);
        this.attribute.addValue(AttributeType.CRITICAL_CHANCE, Math.min(this.stat.sense * 0.234, 30));

        this.attribute.addValue(AttributeType.PROJECTILE_SPEED, this.stat.agility * 1.5);
        this.attribute.addValue(AttributeType.PROJECTILE_SPEED, this.stat.strength * 1.5);

        this.attribute.addValue(AttributeType.DEXTERITY, Math.min(this.stat.sense, 75) * 0.7);
        this.attribute.addValue(AttributeType.DEXTERITY, Math.min(Math.max(this.stat.sense - 75, 0), 170) * 1.4);
        this.attribute.addValue(AttributeType.DEXTERITY, Math.min(Math.max(this.stat.sense - 170, 0), 250) * 1.8);
        this.attribute.addValue(AttributeType.DEXTERITY, Math.max(this.stat.sense - 250, 0) * 2.5);
    }

    update(delta = Time.deltaTime) {
        EquipmentSlot.slotNames.forEach(slotName => {
            let item = this.slot[slotName];
            item?.options?.slice(0)?.forEach(option => {
                option.onUpdate(this, delta);
                if (option.time > 0) {
                    option.time -= delta;
                    if (option.time <= 0) item.options.splice(item.options.indexOf(option), 1);
                }
            });
        });
    }

    getLocation() {
        return World.getLocation(this.location);
    }

    lateUpdate(delta = Time.deltaTime) {
        this.attribute.updateValues();

        for (let shield of this.shields) {
            if ((shield.duration -= delta) <= 0) delete this.shields[k];
        };

        if (this.food <= this.maxFood * 0.2)
            this.attribute.multiplyValue(AttributeType.MOVE_SPEED, 0.6);
        if (this.food <= this.maxFood * 0.05) {
            this.life -= delta * this.maxLife * 0.01;
            this.attribute.multiplyValue(AttributeType.LIFE_REGEN, 0);
        }
        if (this.water <= this.maxWater * 0.2)
            this.attribute.multiplyValue(AttributeType.ATTACK_SPEED, 0.6);
        if (attr.water <= attr.maxWater * 0.05) {
            this.life -= delta * this.maxLife * 0.02;
            this.attribute.multiplyValue(AttributeType.LIFE_REGEN, 0);
        }

        this.heal(this.attribute.getValue(AttributeType.LIFE_REGEN) * delta);
        this.mana += this.attribute.getValue(AttributeType.MANA_REGEN) * delta;
        this.food -= this.attribute.getValue(AttributeType.FOOD_DEPLETE) * delta;
        this.water -= this.attribute.getValue(AttributeType.WATER_DEPLETE) * delta;
    }

    /** 
     * @param {object} options 
     * options 객체 속성
     * - applyAttackSpeed(bool) 간접적인 공격(투사체 등)일 때 간접 공격자에게 공격 속도를 적용할 것인지 여부
     * - absoluteHit(bool) 회피를 무시하고 절대적으로 공격할 것인지 여부
     * - useAbuserCritical(bool) 간접 공격자의 크리티컬을 사용할 지의 여부
     * - isMagicAttack(bool) 마법 공격 여부
     * - onHit(func(victim)) 피격 시 실행되는 콜백함수 
     */
    attack(victim, options = {}) {
        if (!victim) return false;
        if(!victim.isAlive) return false;

        if (!args.isOptionedAttack) {
            let item = this.slot.hand;
            if (item?.preset?.attack) {
                args.isOptionedAttack = true;
                item.preset.attack.call(this, victim, options);
                return;
            }
        }

        let now = Date.now();
        let abuser = this instanceof Projectile ? this.owner : this;
        let location = this.getLocation();
        if(location === null) return;

        if(abuser instanceof LivingEntity) {
            abuser.currentTarget = victim;
            if(victim instanceof LivingEntity && !victim.currentTarget?.isAlive)
                victim.currentTarget = abuser;
            if(abuser instanceof Monster) abuser.tryAddTarget();
        }

        if(abuser instanceof Player && victim instanceof Resource) {
            if(!victim.canDestroy(abuser)) {
                abuser.sendMessage('[ ' + victim.destroyableCondition + ' ]');
                return;
            }
        }

        if ((abuser instanceof Player && !this.isAttackEnded()) ||
            (args.applyAttackSpeed && abuser instanceof Player && !abuser.isAttackEnded())) {
            abuser.sendMessage('[ 공격이 끝나지 않았습니다. ]');
            return;
        }

        if(location.zoneType === 'safe' && 
            victim instanceof Player && abuser instanceof Player && abuser !== victim) {
            abuser.sendMessage('[ 평화지역에서는 싸울 수 없습니다. ]');
            return;
        }

        if(abuser instanceof LivingEntity && !abuser.canAttack) {
            if(abuser instanceof Player)
              abuser.sendMessage('[ ' + (abuser.cannotAttackMessage ?? '공격할 수 없는 상태입니다.') + ' ]');
            return;
        }

        if(victim instanceof Monster) {
            if(abuser instanceof Player && !victim.fightingParty)
                victim.fightingParty = abuser.getPartyOwner();
            victim.currentTarget = abuser;
            victim.targets.add(abuser);
        }

        this.latestAttack = now;
        if (options.applyAttackSpeed) abuser.latestAttack = now;

        abuser.latestAttackedEntity = victim;
        victim.latestAbuser = abuser;

        let avoidChance = Math.min(
            Math.max(
                (victim.attributes.moveSpeed - this.attributes.moveSpeed) / Math.max(this.attributes.moveSpeed, 0) * (1 / (3 - 1)),
                Math.min(0.002 * victim.attributes.moveSpeed / 100, 0.12)
            ),
            victim.attributes.moveSpeed > 10 && this.attributes.moveSpeed > 0 ? 0.9 : 1
        );

        if (!options.absoluteHit) {
            let isAvoided = Math.random() < avoidChance && victim.canMove && victim.canAvoid;
            if (isAvoided) {
                if (abuser instanceof Player) {
                    abuser.sendMessage('[ 상대가 피했습니다. ]');
                    if (victim instanceof Player && victim.latestRoomName !== abuser.latestRoomName) {
                        victim.sendMessage('[ ' + abuser.getName() + '님이 공격했지만, 피했습니다. ]');
                    }
                }
                else if (victim instanceof Player) {
                    victim.sendMessage('[ ' + victim.getName() + '님이 피했습니다. ]');
                }
                return;
            }
            else if (victim instanceof LivingEntity && !victim.isVisible && Math.random() < 0.95) {
                if (abuser instanceof Player) {
                    abuser.sendMessage('[ 상대가 보이지 않습니다. ]');
                    if (victim instanceof Player && victim.latestRoomName !== abuser.latestRoomName) {
                        victim.sendMessage('[ ' + abuser.getName() + '님이 공격했지만, 투명 상태로 피했습니다. ]');
                    }
                }
                else if (victim instanceof Player) {
                    victim.sendMessage('[ ' + victim.getName() + '님이 투명 상태로 피했습니다. ]');
                }
                return;
            }
        }

        let critChance = this.attribute.getValue(AttributeType.CRITICAL_CHANCE);
        let critIncrease = this.attribute.getValue(AttributeType.CRITICAL_DAMAGE);

        if(args.useAbuserCritical) {
            critChance = abuser.attribute.getValue(AttributeType.CRITICAL_CHANCE);
            critIncrease = abuser.attribute.getValue(AttributeType.CRITICAL_DAMAGE);
        }

        let finalAttack = this.attribute.getValue(options.isMagicAttack ? 
            AttributeType.MAGIC_ATTACK : AttributeType.ATTACK);
        let finalPenetrate = this.attribute.getValue(options.isMagicAttack ? 
            AttributeType.MAGIC_PENETRATE : AttributeType.DEFEND_PENETRATE);
        let finalDefend = Math.max(0, this.attribute.getValue(options.isMagicAttack ? 
            AttributeType.MAGIC_RESISTANCE : AttributeType.DEFEND) - finalPenetrate);

        let normalDamage = Math.max(0, finalAttack - finalDefend) * (1 - Attribute.getDefendRatio(finalDefend));
        let critDamage = Math.random() < critChance / 100 ? normalDamage * critIncrease / 100 : 0;
        let finalDamage = normalDamage + critDamage;

        victim.damage(finalDamage, abuser);
        this.onHit(victim);
        options.onHit?.call(this, victim);
        victim.onHitted(this);

        this.slot.hand?.durability--;
        victim.slot.head?.durability--;
        victim.slot.body?.durability--;
        victim.slot.legs?.durability--;
        victim.slot.feet?.durability--;
        victim.slot.accessory?.durability--;

        if(abuser instanceof Player) {
            if(critDamage > 0) abuser.log.addLog(Player.Log.CRITICAL_COUNT);
            abuser.log.addLog(Player.Log.ATTACK_COUNT);
            abuser.log.addLog(Player.Log.TYPED_ATTACK_COUNT(
                this.slot.hand?.type ?? (this instanceof Projectile ? 'projectile': 'none')));
        }

        let abuserName = this !== abuser ? this.getName() + (abuser ? '(' + abuser.getName() + ')': '') : abuser.getName();
        let abuserNumber = (location.objects.indexOf(o => o === abuser) + 1) || location.getPlayers().indexOf(abuser) + 1;

        let attackMessage = `[ ${abuserName + (abuserNumber ? '(' + abuserNumber + ')': '')} ▶ ${victim.getName()} ]\n` +
        `${options.additionalMessage ? options.additionalMessage + '\n' : ''}` +
        `${finalDamage.toFixed(1) + (critDamage > 0 ? '(+' + critDamage.toFixed(1) + ')' : '')}만큼 피해를 주었습니다!\n` +
        `${Utils.progressBar(7, victim.life, victim.maxLife, 'percent')}`;

        let sendTargets = [];
        if(abuser instanceof Player) sendTargets.push(abuser);
        if(victim instanceof Player) sendTargets.push(victim);
        Player.sendGroupMessage(sendTargets, attackMessage);
    }

    onDeath() {
        //nothing to run, for child class
    }

    damage(damage, abuser) {
        if (abuser) {
            this.latestAbuser = abuser;
            this.latestAbused = Date.now();
        }
        for (k in this.shields) {
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
        return true;
    }

    addShield(key, amount, duration) {
        this.shields[key] = new Shield(amount, duration);
    }

    heal(healAmount, healer) {
        healAmount *= this.attribute.getValue(AttributeType.HEAL_EFFICIENCY) / 100;
        this.life += healAmount;

        if(healer instanceof LivingEntity && this instanceof LivingEntity) {
            this.getLocation()?.objects?.forEach(m => {
                if(m instanceof Monster && m.targets.has(this) && !m.targets.has(healer))
                    m.targets.add(healer);
            });
        }

        return healAmount;
    }

    get isDead() {
        return this.attributes.life <= 0 || this.deadTime > 0;
    }

    get isAlive() {
        if(this.isDead) return false;
        return true;
    }

    getName() {
        return this.name;
    }

    onHit(victim) {
        EquipmentSlot.slotNames.forEach(slotName => {
            const item = this.slot[slotName];
            item?.options?.forEach(option => {
                option.onHit(this, victim);
            });
        })
    }

    onHitted(attacker) {
        this.latestHitted = Date.now();
        EquipmentSlot.slotNames.forEach(slotName => {
            const item = this.slot[slotName];
            item?.options?.forEach(option => {
                option.onHitted(this, victim);
            });
        })
    }

    toString() {
        return this.name;
    }
}

export class Stat {

    values = {};

    constructor() {
        StatType.getAll().forEach(type => {
            this.values[type] = 0;
        });
    }

    getStat(type) {
        return values[type];
    }
}

export class EquipmentSlot {
    hand = null;
    head = null;
    body = null;
    legs = null;
    feet = null;
    accessory = null;
    backpack = null;

    static slotNames = ['hand', 'head', 'body', 'legs', 'feet', 'accessory', 'backpack'];
    static slotDisplayNames = ['손', '머리', '상체', '하체', '발', '장신구', '가방'];
}

export class StatType extends Enum {

    displayName = '';
    affectAction = null;

    constructor(name, displayName, affectAction) {
        super(name);
        this.displayName = displayName;
        this.affectAction = affectAction;
    }

    affect(entity, value) {
        if (this.affectAction instanceof Function)
            this.affectAction(entity, value);
    }

    static getAll() {
        return Enum.getAll(StatType);
    }

    static STRENGTH = new StatType('strength', '근력', (entity, value) => {
        entity.attribute.addValue(AttributeType.ATTACK, value * 3);
    });
    static VITALITY = new StatType('strength', '체력', (entity, value) => {
    });
    static AGILITY = new StatType('strength', '민첩', (entity, value) => {
    });
    static SPELL = new StatType('strength', '마법', (entity, value) => {
    });
    static SENSE = new StatType('strength', '감각', (entity, value) => {
    });
}

export class Shield {

    amount = 0;
    duration = 0;

    constructor(amount, duration) {
        this.amount = amount;
        this.duration = duration;
    }
}