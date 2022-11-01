import Entity from "./Entity.mjs";
import Time from "./Time.mjs";

export default class LivingEntity extends Entity {

    constructor(name) {
        super(name);

        this.effects = [];
        this.currentTarget = null;
        this.resetStates();
        
    }

    addEffect(newEffect) {
        for (let i = 0; i < this.effects.length; i++) {
            let effect = this.effects[i];
            if (effect.name === newEffect.type.name) {
                if (effect.level > newEffect.level) return false;
                if (effect.level === newEffect.level && effect.duration >= newEffect.duration) return false;
                this.effects[i] = newEffect;
                return true;
            }
        }
        this.effects.push(newEffect);
        return true;
    }

    hasEffect(type) {
        return this.effects.some(e => e.type === type);
    }

    getEffect(type) {
        return this.effects.find(e => e.type === type);
    }

    removeEffect(type) {
        return this.effects = this.effects.filter(e => e.type !== type);
    }

    updateEffects(delta = Time.deltaTime) {
        this.effects.sort((a, b) => a.type.priority - b.type.priority)
            .forEach(effect => {
                effect.affect(this, delta);
                effect.duration -= delta;
            });
        this.effects = this.effects.filter(eff => eff.duration > 0);

        if (this.deadTime > 0) {
            this.effects = [];
        }
    }

    earlyUpdate(delta = Time.deltaTime) {
        super.earlyUpdate(delta);
        this.resetStates();
    }

    update(delta = Time.deltaTime) {
        super.update(delta);
        
        this.updateEffects(delta);
        if(this.air <= 0) this.life -= this.maxLife * delta;
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