import { Attribute, AttributeModifier, DropItem, Entity, StatType, PlayerLog } from "../Internal";
import { AttributeType } from "../Internal";
import Enum from "../util/Enum";
import { MonsterPreset, LivingEntity } from "../Internal";
import { ResourcePreset } from "../Internal";
import { Time, Utils, Player } from "../Internal";
import { ExtraObject, MonsterPresetObject, NullableString } from "../../types";

export class Monster extends LivingEntity {
    
    isUnrevivable: boolean;
    regenTime: number;
    tendency: MonsterTendency;
    onUpdate: ((monster: Monster) => void) | null;
    onHittedCallback: ((monster: Monster, attacker: Entity) => void) | null;
    onDeathCallback: ((monster: Monster) => void) | null;
    gold: number;
    targets = new Set<LivingEntity>();
    fightingParty: Player | null = null;
    drops: DropItem[];
    extras: ExtraObject = {};
    attributeModifiers: AttributeModifier[] = [];

    constructor(preset: MonsterPresetObject) {
        super(preset.name ?? 'unnamed');

        this.level = preset.level ?? this.level;
        this.isUnrevivable = preset.isUnrevivable ?? false;
        this.regenTime = preset.regenTime ?? 60 * 3;
        this.tendency = preset.tendency ?? MonsterTendency.NEUTRAL;
        this.onUpdate = preset.onUpdate ?? null;
        this.onHittedCallback = preset.onHitted ?? null;
        this.onDeathCallback = preset.onDeath ?? null;
        this.gold = preset.gold ?? 0;
        this.fightingParty = null;
        this.drops = preset.drops ?? [];

        if (preset.attributes) {
            this.attributeModifiers = Attribute.parseModifiers(preset.attributes);
        }

        const stat = preset.stat;
        if (stat) {
            Object.keys(stat).forEach(statName => {
                let type = StatType.getByName(statName);
                if(!(type instanceof StatType)) return;
                this.stat.setStat(type, stat[statName] ?? 0);
            });
        }

        this.registerLateTask(() => {
            this.life = this.maxLife;
        });
    }

    override onHitted(attacker: Entity) {
        super.onHitted(attacker);
        if(this.onHittedCallback) this.onHittedCallback(this, attacker);
    }

    override damage(damage: number, abuser: LivingEntity | null = null) {
        super.damage(damage, abuser);
        
        if(abuser instanceof Player && !this.fightingParty)
            this.fightingParty = abuser.getPartyOwner();
        this.currentTarget = abuser ?? null;
        if(abuser) this.targets.add(abuser);
    }

    get preset(): MonsterPresetObject | null {
        return MonsterPreset.getMonsterPreset(this.name) ?? null;
    }

    hasType(type: MonsterType) {
        return this.preset?.types?.some(s => s.name === type.name) ?? false;
    }

    get types() {
        return this.preset?.types ?? [];
    }

    get target() {
        let loc = this.getLocation();
        let target = this.currentTarget;
        while(!target?.isAlive || target.getLocation() !== loc) {
            this.currentTarget = null;
            if(target instanceof LivingEntity) this.targets.delete(target);
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
        if (this.tendency === MonsterTendency.HOSTILE && this.targets.size <= 0) {
            let loc = this.getLocation();
            let players = loc.getPlayers();
            if (players.length > 0) this.targets.add(Utils.pick(players));
        }
        else if (this.tendency === MonsterTendency.NEUTRAL && 
            this.currentTarget instanceof LivingEntity &&
            !this.targets.has(this.currentTarget)) {
            this.targets.add(this.currentTarget);
        }
    }

    earlyUpdate() {
        super.earlyUpdate();

        this.attributeModifiers.forEach(modifier => this.attribute.addModifier(modifier));
        
        if(this.deadTime > 0) {
            this.currentTarget = null;
            this.targets.clear();
        }
    }

    update() {
        super.update();
        let loc = this.getLocation();

        if(this.isAlive) {
            if(this.latestAbuser) this.currentTarget = this.latestAbuser;

            this.tryAddTarget();
            this.targets = new Set(Array.from(this.targets).filter(target => 
                target.isAlive && target.location === this.location));

            if(this.currentTarget instanceof LivingEntity && !this.targets.has(this.currentTarget))
                this.currentTarget = null;
            if(this.latestAbuser instanceof LivingEntity && !this.targets.has(this.latestAbuser))
                this.latestAbuser = null;
            
            if(this.onUpdate) this.onUpdate(this);
        }
        else if(this.deadTime > 0) {
            this.latestAbuser = null;
        }

        if (this.fightingParty && loc.getPlayers(true)
            .every(p => p.getPartyOwner() !== this.fightingParty))
            this.fightingParty = null;
    }

    lateUpdate() {
        super.lateUpdate();

        if(this.deadTime > 0) {
            this.targets.clear();
        }

        let as = this.attribute.getValue(AttributeType.ATTACK_SPEED);
        if (as > 1.5) {
            this.attribute.multiplyValue(AttributeType.ATTACK_SPEED, 1.5 / as);
            if (this.stat.getStat(StatType.SPELL) > this.stat.getStat(StatType.STRENGTH))
                this.attribute.multiplyValue(AttributeType.MAGIC_ATTACK, as / 1.5);
            else {
                this.attribute.multiplyValue(AttributeType.ATTACK, as / 1.5);
                this.attribute.multiplyValue(AttributeType.RANGE_ATTACK, as / 1.5);
            }
        }
    }
    
    rewardPlayer(player: Player): void {
        let rewards = [];
        let gettingExp = player.getGettingExp(this);

        this.drops.forEach(dropItem => {
            let itemStack = dropItem.createItemStack();
            if (!itemStack) return;
            player.inventory.addItem(itemStack.item, itemStack.count);
            rewards.push(`${itemStack.item.getName()} x${itemStack.count}`);
        });

        let partyPlayers = Array.from(this.targets)
            .filter(p => p instanceof Player && p.getPartyOwner() === this.fightingParty);
        if (partyPlayers.length <= 1) {
            player.exp += gettingExp;
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
            player.gold += this.gold;
            rewards.push(`${this.gold} 골드`);
        }
        player.sendRawMessage(`[ ${this.name}(을)를 처치하셨습니다! ]\n\n` +
            '▌ 보상\n' +
            rewards.map(r => '   ▸ ' + r).join('\n')
        );
    }

    onDeath() {
        this.deadTime = this.regenTime;
        if(this.onDeathCallback) this.onDeathCallback(this);

        const abuser = this.latestAbuser;
        if(abuser instanceof Player) {
            abuser.log.addLog(PlayerLog.KILLED_MONSTER_COUNT);
            this.types.forEach(type => {
                abuser.log.addLog(PlayerLog.KILLED_TYPED_MONSTER_COUNT(type));
            });
            abuser.log.addLog(PlayerLog.KILLED_NAMED_MONSTER_COUNT(this.name));

            this.rewardPlayer(abuser);
        }

        this.extras = {};
        this.targets.clear();
        this.latestAbuser = null;
        this.currentTarget = null;
    }

    static fromName(name: string) {
        let preset = MonsterPreset.getMonsterPreset(name);
        if(!preset) throw new Error('Invalied Monster Name');
        return new Monster(preset);
    }

}

export class MonsterType extends Enum {

    displayName: string;

    private constructor(name: string, displayName: string) {
        super(name);
        
        this.displayName = displayName;
    }

    getAll() {
        return Enum.getAll(MonsterType);
    }

    toString(): string {
        return this.name;
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
    static DEVILDOM = new MonsterType('devildom', '마계');
    static SPIDER = new MonsterType('spider', '골렘');
    static HUMANOID = new MonsterType('humanoid', '인간형');
    static POISON = new MonsterType('poison', '독');
    static METAL = new MonsterType('metal', '금속');
}

export class MonsterTendency extends Enum {

    displayName: string;

    private constructor(name: string, displayName: string) {
        super(name);
        
        this.displayName = displayName;
    }

    getAll() {
        return Enum.getAll(MonsterType);
    }

    static PEACEFUL = new MonsterTendency('peaceful', '평화');
    static NEUTRAL = new MonsterTendency('neutral', '중립');
    static HOSTILE = new MonsterTendency('hostile', '적대');

}