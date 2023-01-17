
import { NullableString } from "../types";
import { Effect, EffectType, Entity, Time } from "./Internal";


export abstract class LivingEntity extends Entity {

    canMove = true;
    cannotMoveMessage: NullableString = null;
    canWorldMove = true;
    cannotWorldMoveMessage: NullableString = null;
    canUseSkill = true;
    cannotUseSkillMessage: NullableString = null;
    canAttack = true;
    cannotAttackMessage: NullableString = null;
    canAvoid = true;
    canUseItem = true;
    cannotUseItemMessage: NullableString = null;
    isVisible = true;
    effects: Effect[] = [];
    currentTarget: Entity | null = null;

    constructor(name: string) {
        super(name);

        this.effects = [];
        this.currentTarget = null;
        
    }

    addEffect(newEffect: Effect) {
        for (let i = 0; i < this.effects.length; i++) {
            let effect = this.effects[i];
            if (effect.type === newEffect.type) {
                if (effect.level > newEffect.level) return false;
                if (effect.level === newEffect.level && effect.duration >= newEffect.duration) return false;
                this.effects[i] = newEffect;
                return true;
            }
        }
        this.effects.push(newEffect);
        return true;
    }

    hasEffect(type: EffectType) {
        return this.effects.some(e => e.type === type);
    }

    getEffect(type: EffectType) {
        return this.effects.find(e => e.type === type);
    }

    removeEffect(type: EffectType) {
        this.effects = this.effects.filter(e => e.type !== type);
    }

    updateEffects() {
        this.effects.sort((a, b) => a.type.priority - b.type.priority);
        this.effects.slice()
            .forEach(effect => {
                effect.affect(this);
                effect.duration -= Time.deltaTime;
            });
        this.effects = this.effects.filter(eff => eff.duration > 0);

        if (this.deadTime > 0) {
            this.effects = [];
        }
    }

    earlyUpdate() {
        super.earlyUpdate();
        this.resetStates();

        if(this.life <= 0 && this.deadTime <= 0) {
            this.onDeath();
        }
        
        if (!this.currentTarget?.isAlive || !this.isAlive)
            this.currentTarget = null;
    }

    update() {
        super.update();
        
        this.updateEffects();
        if(this.air <= 0) this.life -= this.maxLife * Time.deltaTime;
    }

    resetStates() {
        this.canMove = true;
        this.cannotMoveMessage = null;
        this.canWorldMove = true;
        this.cannotWorldMoveMessage = null;
        this.canUseSkill = true;
        this.cannotUseSkillMessage = null;
        this.canAttack = true;
        this.cannotAttackMessage = null;
        this.canAvoid = true;
        this.canUseItem = true;
        this.cannotUseItemMessage = null;
        this.isVisible = true;
    }
}