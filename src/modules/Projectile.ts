import { ProjectilePresetObject } from "../types";
import { Entity, AttributeType, LivingEntity } from "./Internal"

export class Projectile extends Entity {

    owner: LivingEntity;
    location: string;
    onHitTarget: ((projectile: Projectile, victim: LivingEntity) => void) | null;

    constructor(preset: ProjectilePresetObject) {
        super(preset.name ?? 'unnamed');

        this.owner = preset.owner ?? null;
        this.location = this.owner?.location;
        this.onHitTarget = preset.onHit ?? null;
        
        if(preset.attributes) {
            for(let key in preset.attributes) {
                let type = AttributeType.getByName(key);
                if(type) this.attribute.setDefault(type, preset.attributes[key]);
            }
        }
    }

    onHit(victim: LivingEntity) {
        super.onHit(victim);
        if(this.onHitTarget) this.onHitTarget(this, victim);
    }
    
    onDeath(): void {
    }
}