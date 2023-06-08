
import { NullableString } from "../../../types";
import { Effect, EffectType, Entity, Player, Time } from "../../Internal";


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
    private _effects: Effect[] = [];
    currentTarget: Entity | null = null;

    constructor(name: string) {
        super(name);

        this._effects = [];
        this.currentTarget = null;
    }

    get effects() {
        return this._effects.slice();
    }

    set effects(v) {
        this.clearEffects();
        v.forEach(eff => this.addEffect(eff));
    }

    clearEffects() {
        this._effects.forEach(eff => eff.finish(this));
        this._effects = [];
    }

    filterEffects(check: (eff: Effect) => boolean) {
        this._effects = this._effects.filter(eff => {
            if(check(eff)) return true;
            eff.finish(this);
            return false;
        })
    }

    addEffect(newEffect: Effect) {
        for (let i = 0; i < this._effects.length; i++) {
            let effect = this._effects[i];
            if (effect.type === newEffect.type) {
                if (effect.level > newEffect.level) return false;
                if (effect.level === newEffect.level && effect.duration >= newEffect.duration) return false;
                this._effects[i] = newEffect;
                newEffect.start(this);
                return true;
            }
        }
        this._effects.push(newEffect);
        newEffect.start(this);
        return true;
    }

    hasEffect(type: EffectType) {
        return this._effects.some(e => e.type === type);
    }

    getEffect(type: EffectType) {
        return this._effects.find(e => e.type === type);
    }

    removeEffect(type: EffectType) {
        let idx = this._effects.findIndex(e => e.type === type);
        if(idx === -1) return;

        this._effects[idx].finish(this);
        this._effects.splice(idx, 1);
    }

    updateEffects() {
        this._effects.sort((a, b) => a.type.priority - b.type.priority);
        this.effects
            .forEach(effect => {
                effect.update(this);
                effect.duration -= Time.deltaTime;
            });
        this.filterEffects(eff => eff.duration > 0 && 
            (!eff.casterUid !== null || 
                (eff.caster?.isAlive ?? false) || 
                !(eff.caster instanceof Player)));

        if (this.deadTime > 0) {
            this.clearEffects();
        }
    }

    earlyUpdate() {
        super.earlyUpdate();
        
        if (!this.currentTarget?.isAlive || !this.isAlive)
            this.currentTarget = null;
    }

    update() {
        super.update();
        
        if(this.air <= 0) this.life -= this.maxLife * Time.deltaTime;
    }

    lateUpdate() {
        this.updateEffects();
        this.resetStates();
        super.lateUpdate();
    }

    setCannotMove(msg: string) {
        this.registerLateTask(() => {
            this.canMove = false;
            this.cannotMoveMessage = msg;
        });
    }

    setCannotUseSkill(msg: string) {
        this.registerLateTask(() => {
            this.canUseSkill = false;
            this.cannotUseSkillMessage = msg;
        });
    }

    setCannotAttack(msg: string) {
        this.registerLateTask(() => {
            this.canAttack = false;
            this.cannotAttackMessage = msg;
        });
    }

    setCannotAvoid() {
        this.registerLateTask(() => {
            this.canAvoid = false;
        });
    }

    setCannotUseItem(msg: string) {
        this.registerLateTask(() => {
            this.canUseItem = false;
            this.cannotUseItemMessage = msg;
        });
    }

    setInvisible() {
        this.registerLateTask(() => {
            this.isVisible = false;
        });
    }

    setCannotWorldMove(msg: string) {
        this.registerLateTask(() => {
            this.canWorldMove = false;
            this.cannotWorldMoveMessage = msg;
        });
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