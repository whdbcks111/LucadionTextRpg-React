import AttributeType from "./AttributeType.mjs";
import Enum from "./Enum.mjs";
import LivingEntity from "./LivingEntity.mjs";
import Player from "./Player.mjs";
import Time from "./Time.mjs";
import Utils from "./Utils.mjs";

export default class Monster extends LivingEntity {

    constructor(preset = {}) {
        super(preset.name ?? 'unnamed');

        this.level = preset.level ?? this.level;
        this.isUnreviveable = preset.isUnreviveable ?? false;
        this.regenTime = preset.regenTime ?? 60 * 3;
        this.tendency = preset.tendency ?? 'neutral';
        this.onUpdate = preset.onUpdate ?? null;
        this.onHittedCallback = preset.onHitted ?? null;
        this.onDeathCallback = preset.onDeath ?? null;
        this.gold = preset.gold ?? 0;
        this.targets = new Set();
        this.fightingParty = null;
        this.drops = deepClone(preset.drops) ?? [];
        this.extras = {};

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

    onHitted(attacker) {
        super.onHitted(attacker);
        this.onHittedCallback?.call(this, attacker);
    }

    damage(damage, abuser) {
        super.damage(damage, abuser);
        if(abuser instanceof Player && !this.fightingParty)
            this.fightingParty = abuser.getPartyOwner();
        this.currentTarget = abuser;
        this.targets.add(abuser);
    }

    get preset() {
        return ResourcePreset.getResourcePreset(this.name);
    }

    hasType(type) {
        return this.preset?.types?.some(s => s.name === type.name) ?? false;
    }

    get types() {
        return this.preset?.types ?? [];
    }

    get target() {
        let loc = this.getLocation();
        let target = this.currentTarget;
        while(!target?.isAlive() || target.getLocation() !== loc) {
            this.currentTarget = null;
            this.targets.delete(target);
            if(this.targets.size === 0) return null;
            target = Utils.pick(Array.from(this.targets));
        }
        return target ?? null;
    }

    tryAttack() {
        let target = this.target;
        if(target) return this.attack(target);
        return false;
    }

    tryAddTarget() {
        if(this.tendency === 'hostile' && this.targets.size <= 0) {
            let loc = this.getLocation();
            let players = loc.getPlayers();
            if(players.length > 0) this.targets.add(Utils.pick(players));
        }
        if(this.tendency === 'neutral' && this.currentTarget && !this.targets.has(this.currentTarget))
            this.targets.add(this.currentTarget);
    }

    earlyUpdate(delta = Time.deltaTime) {
        super.earlyUpdate(delta);

        if(this.deadTime > 0) {
            this.currentTarget = null;
            this.targets.clear();
        }
    }

    update(delta = Time.deltaTime) {
        super.update(delta);
        let loc = this.getLocation();

        if(this.isAlive()) {
            if(this.currentTarget?.isDead()) this.currentTarget = null;
            if(this.latestAbuser) this.currentTarget = this.latestAbuser;
            
            this.tryAddTarget();
            this.targets = new Set(Array.from(this.targets).filter(target => 
                target.isAlive() && target.location === this.location));
            
            this.onUpdate?.call(this, delta);
        }

        if(this.fightingParty && loc.getPlayers(true).every(p => p.getPartyOwner() !== this.fightingParty))
            this.fightingParty = null;
    }

    lateUpdate(delta = Time.deltaTime) {
        super.lateUpdate(delta);

        if(this.deadTime > 0) {
            this.deadTime -= delta;
            this.targets.clear();
            this.currentTarget = null;
            this.attributes.life = this.attributes.maxLife;
            this.attributes.mana = this.attributes.maxMana;
            this.attributes.food = this.attributes.maxFood;
            this.attributes.water = this.attributes.maxWater;
        }

        let as = this.attribute.getValue(AttributeType.ATTACK_SPEED);
        if (as > 1.5) {
            this.attribute.multiplyValue(AttributeType.ATTACK_SPEED, 1.5 / as);
            if (this.stat.spell > this.stat.strength)
                this.attribute.multiplyValue(AttributeType.MAGIC_ATTACK, as / 1.5);
            else {
                this.attribute.multiplyValue(AttributeType.ATTACK, as / 1.5);
                this.attribute.multiplyValue(AttributeType.RANGE_ATTACK, as / 1.5);
            }
        }
    }

    onDeath() {
        super.onDeath();

        this.deadTime = this.regenTime;
        this.onDeathCallback?.call(this);

        let abuser = this.latestAbuser;
        if(abuser instanceof Player) {
            abuser.log.addLog(Player.Log.KILLED_MONSTER_COUNT);
            this.types.forEach(type => {
                abuser.log.addLog(Player.Log.KILLED_TYPED_MONSTER_COUNT(type.name));
            });
            abuser.log.addLog(Player.Log.KILLED_NAMED_MONSTER_COUNT(this.name));

            let rewards = [];
            let gettingExp = abuser.calcGettingExp(this);

            this.drops.forEach(dropItem => {
                let itemStack = dropItem.createItemStack();
                if (!itemStack) return;
                abuser.inventory.addItem(itemStack.item, itemStack.count);
                rewards.push(`${itemStack.item.getName()} x${itemStack.count}`);
            });

            let partyPlayers = Array.from(this.targets).filter(p => p.getPartyOwner() === this.fightingParty);
            if (partyPlayers.length <= 1) {
                abuser.exp += gettingExp;
                rewards.push(`${gettingExp.toFixed(0)} Exp`);
            }
            else {
                gettingExp *= Math.pow(0.9, partyPlayers.length - 1);
                let maxLv = partyPlayers.map(p => p.level).reduce((a, b) => Math.max(a, b), 1);
                partyPlayers.forEach(p => {
                    let addition = gettingExp * Math.min(1, p.level / maxLv + 0.2);
                    p.exp += addition;
                    rewards.push(`${p.getName()} > ${addition.toFixed(0)} Exp`);
                });
            }
            if (this.gold > 0) {
                abuser.gold += this.gold;
                rewards.push(`${this.gold} 골드`);
            }
            abuser.sendMessage(`[ ${this.name}(을)를 처치하셨습니다! ]\n\n` +
                '▌ 보상\n' +
                rewards.map(r => '   ▸ ' + r).join('\n')
            );
        }

        this.extras = {};
        this.targets.clear();
        this.latestAbuser = null;
        this.currentTarget = null;
    }

    static fromName(name) {
        return new Monster(MonsterPreset.getMonsterPreset(name));
    }

}

export class MonsterType extends Enum {

    constructor(name, displayName) {
        super(name);
        
        this.displayName = displayName;
    }

    getAll() {
        return Enum.getAll(MonsterType);
    }

    static WOLF = new MonsterType('wolf', '늑대');
    static BEAST = new MonsterType('beast', '짐승');
    static UNDEAD = new MonsterType('undead', '언데드');
    static GOLEM = new MonsterType('golem', '골렘');
    static WORM = new MonsterType('worm', '벌레');
    static FIRE = new MonsterType('fire', '불');
    static ICE = new MonsterType('ice', '얼음');
    static NATURAL = new MonsterType('natural', '자연');
    static STONE = new MonsterType('stone', '돌');
    static BACK_WORLD = new MonsterType('backWorld', '마계');
    static SPIDER = new MonsterType('spider', '골렘');
    static HUMANOID = new MonsterType('humanoid', '인간형');
    static POISON = new MonsterType('poison', '독');
    static METAL = new MonsterType('metal', '금속');
}