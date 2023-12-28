import { ExtraObject, NullableString } from "../../types";
import Enum from "../util/Enum";
import { Time, Player, AttributeType, LivingEntity, World, TimeFormat } from "../Internal";
import { ComponentBuilder } from "../server/chat/ComponentBuilder";

export class Effect {

    type: EffectType;
    level: number;
    duration: number;
    maxDuration: number;
    casterUid: NullableString;
    extras: ExtraObject;

    constructor(type: EffectType, level = 1, duration = 10, caster: LivingEntity | null = null, extras = {}) {
        this.type = type;
        this.level = level;
        this.duration = duration;
        this.maxDuration = duration;
        this.casterUid = caster instanceof Player ? caster.uid : null;
        this.extras = extras;
    }

    toDataObj() {
        return {
            ...this,
            type: this.type.name
        }
    }

    static fromDataObj(obj: ExtraObject) {
        if (!obj) return null;
        let newEffect = new Effect(EffectType.getByName(obj.type), obj.level, obj.duration, null, obj.extras);
        newEffect.casterUid = obj.casterUid;

        return newEffect;
    }

    static getDescriptionMessage(type: EffectType, level: number) {
        return ComponentBuilder.text(`Lv.${level} ${type.displayName}`, { 
            color: type.isDebuff ? '#C836CB' : '#5EC1FA' 
        });
    }

    toString() {
        return `Lv.${this.level} ${this.type.displayName} [${new TimeFormat(this.duration * 1000).useUntilHours().format('hh:mm:ss', )}]`
    }

    get priority() {
        return this.type.priority;
    }

    get isDebuff() {
        return this.type.isDebuff;
    }

    get caster() {
        if (!this.casterUid) return null;
        return Player.getPlayerByUid(this.casterUid);
    }

    update(living: LivingEntity) {
        this.type.onUpdate(this, living);
    }

    start(living: LivingEntity) {
        if(this.type.onStart) this.type.onStart(this, living);
    }

    finish(living: LivingEntity) {
        if(this.type.onFinish) this.type.onFinish(this, living);
    }
}

export class EffectType extends Enum {

    displayName: string;
    onUpdate: (effect: Effect, living: LivingEntity) => void;
    onStart: ((effect: Effect, living: LivingEntity) => void) | null = null;
    onFinish: ((effect: Effect, living: LivingEntity) => void) | null = null;
    isDebuff: boolean = false;
    priority: number = 0;

    constructor(name: string, displayName: string,
        onUpdate: (effect: Effect, living: LivingEntity) => void = () => { }) {
        super(name);
        this.displayName = displayName;
        this.onUpdate = onUpdate;
    }

    private setOnStart(event: (effect: Effect, living: LivingEntity) => void) {
        this.onStart = event;
        return this;
    }

    private setOnFinish(event: (effect: Effect, living: LivingEntity) => void) {
        this.onFinish = event;
        return this;
    }

    private setDebuff(flag: boolean = true) {
        this.isDebuff = flag;
        return this;
    }

    private setPriority(priority: number) {
        this.priority = priority;
        return this;
    }

    static getAll() {
        return Enum.getAll(EffectType);
    }

    static getByName(name: string) {
        return this.getAll().find(type => type.name === name) ?? null;
    }

    static POISON =
        new EffectType('poison', '독', (effect, living) => {
            living.damage(Time.deltaTime * effect.level * 20, effect.caster);
            living.attribute.multiplyValue(AttributeType.ATTACK, Math.max(0.5, Math.pow(0.96, effect.level)));
            living.attribute.multiplyValue(AttributeType.RANGE_ATTACK, Math.max(0.5, Math.pow(0.96, effect.level)));
            living.attribute.multiplyValue(AttributeType.MAGIC_ATTACK, Math.max(0.5, Math.pow(0.96, effect.level)));

            let now = Date.now();
            if (living instanceof Player && now - (effect.extras.latestSend ?? 0) > 1000 * 5) {
                living.sendRawMessage(`[ ${living.getName()}님, 독에 중독되고 있습니다. ]`);
                effect.extras.latestSend = now;
            }
        }).setDebuff();

    static BLOOD =
        new EffectType('blood', '출혈', (effect, living) => {
            living.damage(Time.deltaTime * effect.level * Math.min(0.005 * living.maxLife, 50), effect.caster);

            let now = Date.now();
            if (living instanceof Player && now - (effect.extras.latestSend ?? 0) > 1000 * 5) {
                living.sendRawMessage(`[ ${living.getName()}님, 출혈되고 있습니다. ]`);
                effect.extras.latestSend = now;
            }
        }).setDebuff();

    static DECAY =
        new EffectType('decay', '부패', (effect, living) => {
            living.damage(Time.deltaTime * effect.level * (10 + 55 * (1 - effect.duration / effect.maxDuration)), effect.caster);
            living.attribute.multiplyValue(AttributeType.MAX_LIFE, Math.max(0.3, Math.pow(0.985, effect.level)));

            let now = Date.now();
            if (living instanceof Player && now - (effect.extras.latestSend ?? 0) > 1000 * 5) {
                living.sendRawMessage(`[ ${living.getName()}님, 부패되고 있습니다. ]`);
                effect.extras.latestSend = now;
            }
        }).setDebuff();

    static DECREASE_HEAL_EFFICIENCY =
        new EffectType('decreaseHealEfficiency', '회복 효율 감소', (effect, living) => {
            living.attribute.multiplyValue(AttributeType.HEAL_EFFICIENCY, Math.pow(0.9, effect.level));
        }).setDebuff();

    static DECREASE_DEFEND =
        new EffectType('decreaseDefend', '방어력 감소', (effect, living) => {
            living.attribute.multiplyValue(AttributeType.DEFEND, Math.pow(0.95, effect.level));
        }).setDebuff();

    static DECREASE_MAGIC_RESISTANCE =
        new EffectType('decreaseMagicResistance', '마법 저항력 감소', (effect, living) => {
            living.attribute.multiplyValue(AttributeType.MAGIC_RESISTANCE, Math.pow(0.95, effect.level));
        }).setDebuff();

    static ENHANCE_MAGIC =
        new EffectType('enhanceMagic', '마법 강화', (effect, living) => {
            living.attribute.multiplyValue(AttributeType.MAGIC_ATTACK, 1 + effect.level * 0.05);
        });

    static AMPLIFY_EXPERIENCE =
        new EffectType('amplifyExperience', '경험 증폭', (effect, living) => {
            living.attribute.multiplyValue(AttributeType.EXP_EFFCIENECY, 1 + effect.level * 0.05);
        });

    static ENHANCE_STRENGTH =
        new EffectType('enhanceStrength', '근력 강화', (effect, living) => {
            living.attribute.multiplyValue(AttributeType.ATTACK, 1 + effect.level * 0.05);
        });

    static ENHANCE_RANGE =
        new EffectType('enhanceRange', '원거리 강화', (effect, living) => {
            living.attribute.multiplyValue(AttributeType.RANGE_ATTACK, 1 + effect.level * 0.05);
        });

    static MANA_REGENERATION =
        new EffectType('manaRegeneration', '마나 재생', (effect, living) => {
            living.attribute.multiplyValue(AttributeType.MANA_REGEN, 1 + effect.level * 0.05);
        });

    static REGENERATION =
        new EffectType('regeneration', '재생', (effect, living) => {
            living.attribute.multiplyValue(AttributeType.LIFE_REGEN, 1 + effect.level * 0.05);
        });

    static SLOWNESS =
        new EffectType('slowness', '둔화', (effect, living) => {
            living.attribute.multiplyValue(AttributeType.MOVE_SPEED, Math.pow(0.95, effect.level));
        }).setDebuff();

    static SWIFTNESS =
        new EffectType('switftness', '신속', (effect, living) => {
            living.attribute.multiplyValue(AttributeType.MOVE_SPEED, 1 + effect.level * 0.05);
        });

    static SILENCE =
        new EffectType('silence', '침묵', (effect, living) => {
            living.setCannotUseSkill(effect.type.displayName + '에 걸린 상태입니다.');
        }).setDebuff();

    static BIND =
        new EffectType('bind', '속박', (effect, living) => {
            living.setCannotMove(effect.type.displayName + '에 걸린 상태입니다.');
        }).setDebuff();

    static INVULNERABLE =
        new EffectType('invulnerable', '무적', (effect, living) => {
            if(living.life < 1) living.life = 1;
        }).setPriority(Infinity);

    static INVISIBLE =
        new EffectType('invisible', '투명화', (effect, living) => {
            living.setInvisible();
        });

    static EXPOSE =
        new EffectType('expose', '발각됨', (effect, living) => {
            let invisible = living.getEffect(EffectType.INVISIBLE);
            if(invisible && invisible.level <= effect.level) {
                living.removeEffect(EffectType.INVISIBLE);
                if(living instanceof Player) living.sendRawMessage('[ 발각되었다! ]');
            }
        }).setDebuff().setPriority(1);

    static ABYSS =
        new EffectType('abyss', '심연', (effect, living) => {
            living.setCannotAttack('심연에 중독된 상태입니다.');
            if(!effect.extras.originalLife) effect.extras.originalLife = living.life;
            living.life = Math.max(1, effect.extras.originalLife * (effect.duration / effect.maxDuration));
        }).setOnFinish((effect, living) => {
            if(!(living instanceof Player)) return;
            living.life = living.maxLife;
            living.teleport(World.FIRST_CLASS_CHANGE.name ?? living.location);
            living.sendRawMessage(`[ ${living.getName()}님, 사망하셨습니다. \n` +
                '... 하지만 곧 깊은 심연에서 눈을 뜹니다. ]');
        }).setPriority(Infinity);

    static SECOND_ABYSS =
        new EffectType('secondAbyss', '2번째 심연', (effect, living) => {
            living.setCannotAttack('심연에 심취한 상태입니다.');
            if(!effect.extras.originalLife) effect.extras.originalLife = living.life;
            living.life = Math.max(1, effect.extras.originalLife * (effect.duration / effect.maxDuration));
        }).setOnFinish((effect, living) => {
            if(!(living instanceof Player)) return;
            living.life = living.maxLife;
            living.teleport(World.SECOND_CLASS_CHANGE.name ?? living.location);
            living.sendRawMessage(`[ ${living.getName()}님, 사망하셨습니다. \n` +
                '.... 그렇기에.. 곧 깊은 심연에서 눈을 뜹니다 . ]');
        }).setPriority(Infinity);

    static STUN =
        new EffectType('stun', '기절', (effect, living) => {
            let message = effect.type.displayName + '한 상태입니다.';
            living.setCannotMove(message);
            living.setCannotAttack(message);
            living.setCannotUseItem(message);
            living.setCannotUseSkill(message);
        }).setDebuff();

    static OVERMASTER =
        new EffectType('overmaster', '제압', (effect, living) => {
            let message = effect.type.displayName + '된 상태입니다.';
            living.setCannotMove(message);
            living.setCannotAttack(message);
            living.setCannotUseItem(message);
            living.setCannotUseSkill(message);
        }).setDebuff();

    static NAUSEA =
        new EffectType('nausea', '멀미', (effect, living) => {
            let message = effect.type.displayName + '에 걸린 상태입니다.';
            if(Math.random() < 0.5 + 0.05 * effect.level) {
                living.setCannotAttack(message);
            }
            living.setCannotUseItem(message);
            living.setCannotUseSkill(message);
        }).setDebuff();

    static BLINDNESS =
        new EffectType('blindness', '실명', (effect, living) => {
            let message = effect.type.displayName + '에 걸린 상태입니다.';
            living.setCannotAvoid();
            living.setCannotAttack(message);
        }).setDebuff();

    static AIRBORNE =
        new EffectType('airborne', '공중에 뜸', (effect, living) => {
            let message = '공중에 뜬 상태입니다.';
            living.setCannotMove(message);
            living.setCannotAttack(message);
            living.setCannotUseItem(message);
        }).setDebuff();

    static CHARM =
        new EffectType('charm', '매혹', (effect, living) => {
            let message = '매혹된 상태입니다.';
            living.setCannotAvoid();
            living.setCannotAttack(message);
            living.setCannotUseItem(message);
            living.setCannotUseSkill(message);
        }).setDebuff();

    static FEAR =
        new EffectType('fear', '공포', (effect, living) => {
            let message = effect.type.displayName + '에 걸린 상태입니다.';
            living.setCannotAvoid();
            living.setCannotAttack(message);
            living.setCannotUseSkill(message);
            living.attribute.multiplyValue(AttributeType.MOVE_SPEED, Math.pow(0.9, effect.level));
        }).setDebuff();

    static SLEEP =
        new EffectType('sleep', '수면', (effect, living) => {
            let message = effect.type.displayName + '에 걸린 상태입니다.';
            living.setCannotMove(message);
            living.setCannotAttack(message);
            living.setCannotUseItem(message);
            living.setCannotUseSkill(message);
        }).setDebuff();

    static FIRE =
        new EffectType('fire', '화염', (effect, living) => {
            living.damage(Time.deltaTime * Math.pow(effect.level, 1.05) * Math.min(0.005 * living.maxLife, 50), effect.caster);

            let now = Date.now();
            if (living instanceof Player && now - (effect.extras.latestSend ?? 0) > 1000 * 5) {
                living.sendRawMessage(`[ ${living.getName()}님, 불타고 있습니다. ]`);
                effect.extras.latestSend = now;
            }
        }).setDebuff();

    static FIRE_RESISTANCE =
        new EffectType('fireResistance', '화염 저항', (effect, living) => {
            let fire = living.getEffect(EffectType.FIRE);
            if(fire?.level && fire.level <= effect.level) {
                living.removeEffect(EffectType.FIRE);
            }
        });

    static FROZEN_RESISTANCE =
        new EffectType('frozenResistance', '빙결 저항', (effect, living) => {
            let frozen = living.getEffect(EffectType.FROZEN);
            if(frozen?.level && frozen.level <= effect.level) {
                living.removeEffect(EffectType.FROZEN);
            }
        });

    static DETOXIFICATION =
        new EffectType('detoxification', '해독', (effect, living) => {
            let poison = living.getEffect(EffectType.POISON);
            if(poison?.level && poison.level <= effect.level) {
                living.removeEffect(EffectType.POISON);
            }
        });

    static PRESERVATION =
        new EffectType('preservation', '보존', (effect, living) => {
            let decay = living.getEffect(EffectType.DECAY);
            if(decay?.level && decay.level <= effect.level) {
                living.removeEffect(EffectType.DECAY);
            }
        });

    static FROZEN = 
        new EffectType('frozen', '빙결', (effect, living) => {
            living.damage(Time.deltaTime * effect.level * 15, effect.caster);
            living.attribute.multiplyValue(AttributeType.MOVE_SPEED, Math.pow(0.94, effect.level));
            living.attribute.multiplyValue(AttributeType.ATTACK_SPEED, Math.pow(0.93, effect.level));

            let now = Date.now();
            if (living instanceof Player && now - (effect.extras.latestSend ?? 0) > 1000 * 5) {
                living.sendRawMessage(`[ ${living.getName()}님, 얼어붙고 있습니다. ]`);
                effect.extras.latestSend = now;
            }
        }).setDebuff();
}