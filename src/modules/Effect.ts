import { ExtraObject, NullableString } from "../types";
import DateFormat from "./DateFormat";
import Enum from "./Enum";
import { Time, Player, AttributeType, LivingEntity } from "./Internal";
import Utils from "./Utils";

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

    toString() {
        return `Lv.${this.level} ${this.type.name} [${Utils.formatTime('d:hh:mm:ss', this.duration * 1000)}]`
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

    affect(living: LivingEntity) {
        this.type.affect(this, living);
    }
}

export class EffectType extends Enum {

    displayName: string;
    affect: (effect: Effect, living: LivingEntity) => void;
    isDebuff: boolean;
    priority: number;

    constructor(name: string, displayName: string,
        affect: (effect: Effect, living: LivingEntity) => void = () => { }, isDebuff = false, priority = 0) {
        super(name);
        this.displayName = displayName;
        this.affect = affect;
        this.isDebuff = isDebuff;
        this.priority = priority;
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
                living.sendMessage(`[ ${living.getName()}님, 독에 중독되고 있습니다. ]\n` +
                    `생명 ${Utils.progressBar(6, living.life, living.maxLife, 'percent')}`);
                effect.extras.latestSend = now;
            }
        }, true);

    static BLOOD =
        new EffectType('blood', '출혈', (effect, living) => {
            living.damage(Time.deltaTime * effect.level * Math.min(0.005 * living.maxLife, 50), effect.caster);

            let now = Date.now();
            if (living instanceof Player && now - (effect.extras.latestSend ?? 0) > 1000 * 5) {
                living.sendMessage(`[ ${living.getName()}님, 출혈되고 있습니다. ]\n` +
                    `생명 ${Utils.progressBar(6, living.life, living.maxLife, 'percent')}`);
                effect.extras.latestSend = now;
            }
        }, true);

    static DECAY =
        new EffectType('decay', '부패', (effect, living) => {
            living.damage(Time.deltaTime * effect.level * (10 + 55 * (1 - effect.duration / effect.maxDuration)), effect.caster);
            living.attribute.multiplyValue(AttributeType.MAX_LIFE, Math.max(0.3, Math.pow(0.985, effect.level)));

            let now = Date.now();
            if (living instanceof Player && now - (effect.extras.latestSend ?? 0) > 1000 * 5) {
                living.sendMessage(`[ ${living.getName()}님, 부패되고 있습니다. ]\n` +
                    `생명 ${Utils.progressBar(6, living.life, living.maxLife, 'percent')}`);
                effect.extras.latestSend = now;
            }
        }, true);

    static DECREASE_HEAL_EFFICIENCY =
        new EffectType('decreaseHealEfficiency', '회복 효율 감소', (effect, living) => {
            living.attribute.multiplyValue(AttributeType.HEAL_EFFICIENCY, Math.pow(0.9, effect.level));
        }, true);

    static DECREASE_DEFEND =
        new EffectType('decreaseDefend', '방어력 감소', (effect, living) => {
            living.attribute.multiplyValue(AttributeType.DEFEND, Math.pow(0.95, effect.level));
        }, true);

    static DECREASE_MAGIC_RESISTANCE =
        new EffectType('decreaseMagicResistance', '마법 저항력 감소', (effect, living) => {
            living.attribute.multiplyValue(AttributeType.MAGIC_RESISTANCE, Math.pow(0.95, effect.level));
        }, true);

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
        }, true);

    static SWIFTNESS =
        new EffectType('switftness', '신속', (effect, living) => {
            living.attribute.multiplyValue(AttributeType.MOVE_SPEED, 1 + effect.level * 0.05);
        });

    static SILENCE =
        new EffectType('silence', '침묵', (effect, living) => {
            living.canUseSkill = false;
            living.cannotUseSkillMessage = effect.type.displayName + '에 걸린 상태입니다.';
        }, true);

    static BIND =
        new EffectType('bind', '속박', (effect, living) => {
            living.canMove = false;
            living.cannotUseSkillMessage = effect.type.displayName + '에 걸린 상태입니다.';
        }, true);

    static INVULNERABLE =
        new EffectType('invulnerable', '무적', (effect, living) => {
            if(living.life < 1) living.life = 1;
        }, false, Infinity);

    static INVISIBLE =
        new EffectType('invisible', '투명화', (effect, living) => {
            living.isVisible = false;
        });

    static EXPOSE =
        new EffectType('expose', '발각됨', (effect, living) => {
            let invisible = living.getEffect(EffectType.INVISIBLE);
            if(invisible && invisible.level <= effect.level) living.removeEffect(EffectType.INVISIBLE);
        }, true);

    static ABYSS =
        new EffectType('abyss', '심연', (effect, living) => {
            living.canAttack = false;
            living.cannotAttackMessage = '심연에 중독된 상태입니다.';
            if(!effect.extras.originalLife) effect.extras.originalLife = living.life;
            living.life = effect.extras.originalLife * (effect.duration / effect.maxDuration);
        });

    static SECOND_ABYSS =
        new EffectType('secondAbyss', '2번째 심연', (effect, living) => {
            living.canAttack = false;
            living.cannotAttackMessage = '심연에 심취한 상태입니다.';
            if(!effect.extras.originalLife) effect.extras.originalLife = living.life;
            living.life = effect.extras.originalLife * (effect.duration / effect.maxDuration);
        });

    static STUN =
        new EffectType('stun', '기절', (effect, living) => {
            let message = effect.type.displayName + '한 상태입니다.';
            living.canMove = false;
            living.cannotMoveMessage = message;
            living.canAttack = false;
            living.cannotAttackMessage = message;
            living.canUseItem = false;
            living.cannotUseItemMessage = message;
            living.canUseSkill = false;
            living.cannotUseSkillMessage = message;
        }, true);

    static OVERMASTER =
        new EffectType('overmaster', '제압', (effect, living) => {
            let message = effect.type.displayName + '된 상태입니다.';
            living.canMove = false;
            living.cannotMoveMessage = message;
            living.canAttack = false;
            living.cannotAttackMessage = message;
            living.canUseItem = false;
            living.cannotUseItemMessage = message;
            living.canUseSkill = false;
            living.cannotUseSkillMessage = message;
        }, true);

    static NAUSEA =
        new EffectType('nausea', '멀미', (effect, living) => {
            let message = effect.type.displayName + '에 걸린 상태입니다.';
            if(Math.random() < 0.5 + 0.05 * effect.level) {
                living.canAttack = false;
                living.cannotAttackMessage = message;
            }
            living.canUseItem = false;
            living.cannotUseItemMessage = message;
            living.canUseSkill = false;
            living.cannotUseSkillMessage = message;
        }, true);

    static BLINDNESS =
        new EffectType('blindness', '실명', (effect, living) => {
            let message = effect.type.displayName + '에 걸린 상태입니다.';
            living.canAttack = false;
            living.cannotAttackMessage = message;
            living.canAvoid = false;
        }, true);

    static AIRBORNE =
        new EffectType('airborne', '공중에 뜸', (effect, living) => {
            let message = '공중에 뜬 상태입니다.';
            living.canMove = false;
            living.cannotMoveMessage = message;
            living.canAttack = false;
            living.cannotAttackMessage = message;
            living.canUseItem = false;
            living.cannotUseItemMessage = message;
        }, true);

    static CHARM =
        new EffectType('charm', '매혹', (effect, living) => {
            let message = '매혹된 상태입니다.';
            living.canAvoid = false;
            living.canAttack = false;
            living.cannotAttackMessage = message;
            living.canUseItem = false;
            living.cannotUseItemMessage = message;
            living.canUseSkill = false;
            living.cannotUseSkillMessage = message;
        }, true);

    static FEAR =
        new EffectType('fear', '공포', (effect, living) => {
            let message = effect.type.displayName + '에 걸린 상태입니다.';
            living.canAttack = false;
            living.cannotAttackMessage = message;
            living.canUseSkill = false;
            living.cannotUseSkillMessage = message;
            living.canAvoid = false;
            living.attribute.multiplyValue(AttributeType.MOVE_SPEED, Math.pow(0.9, effect.level));
        }, true);

    static SLEEP =
        new EffectType('sleep', '수면', (effect, living) => {
            let message = effect.type.displayName + '에 걸린 상태입니다.';
            living.canMove = false;
            living.cannotMoveMessage = message;
            living.canAttack = false;
            living.cannotAttackMessage = message;
            living.canUseItem = false;
            living.cannotUseItemMessage = message;
            living.canUseSkill = false;
            living.cannotUseSkillMessage = message;
        }, true);

    static FIRE =
        new EffectType('fire', '화염', (effect, living) => {
            living.damage(Time.deltaTime * effect.level * Math.min(0.005 * living.maxLife, 50), effect.caster);

            let now = Date.now();
            if (living instanceof Player && now - (effect.extras.latestSend ?? 0) > 1000 * 5) {
                living.sendMessage(`[ ${living.getName()}님, 출혈되고 있습니다. ]\n` +
                    `생명 ${Utils.progressBar(6, living.life, living.maxLife, 'percent')}`);
                effect.extras.latestSend = now;
            }
        }, true);

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
                living.sendMessage(`[ ${living.getName()}님, 얼어붙고 있습니다. ]\n` +
                    `생명 ${Utils.progressBar(6, living.life, living.maxLife, 'percent')}`);
                effect.extras.latestSend = now;
            }
        }, true);
}