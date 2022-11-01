import AttributeType from "./AttributeType.mjs";
import Entity from "./Entity.mjs";

export default class Projectile extends Entity {

    /**
     * @param {object} preset
     * preset 객체 속성
     * - owner(LivingEntity) 투사체를 발사한 엔티티
     * - onHit(func(victim)) 피격 시 이벤트 콜백
     */
    constructor(preset) {
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

    onHit(victim) {
        super.onHit(victim);
        this.onHitTarget?.call(this, victim);
    }
}