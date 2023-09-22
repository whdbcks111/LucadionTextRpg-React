import { OptionPresetObject } from "../../types";
import { AttributeType, Effect, EffectType, LivingEntity, Player, Utils } from "../Internal";

const cache: { [key: string]: OptionPresetObject | undefined } = {};

export class OptionPreset {
    static list: OptionPresetObject[] = [
        {
            name: '독날',
            getDescription: option => (
                `대상을 공격하면 ${option.extras.level ?? 1}레벨의 ${EffectType.POISON.displayName} 효과를 ` +
                `${option.extras.time ?? 10}초간 부여합니다.`
            ),
            onHit(option, self, victim) {
                if (victim instanceof LivingEntity && victim.isAlive) {
                    victim.addEffect(new Effect(EffectType.POISON, option.extras.level ?? 1, option.extras.time ?? 10,
                        self instanceof Player ? self as Player : null));
                }
            }
        },
        {
            name: '발화',
            getDescription: option => (
                `대상을 공격하면 ${option.extras.level ?? 1}레벨의 ${EffectType.FIRE.displayName} 효과를 ` +
                `${option.extras.time ?? 10}초간 부여합니다.`
            ),
            onHit(option, self, victim) {
                if (victim instanceof LivingEntity && victim.isAlive) {
                    victim.addEffect(new Effect(EffectType.FIRE, option.extras.level ?? 1, option.extras.time ?? 10,
                        self instanceof Player ? self as Player : null));
                }
            }
        },
        {
            name: '프로즌',
            getDescription: option => (
                `대상을 공격하면 ${option.extras.level ?? 1}레벨의 ${EffectType.FROZEN.displayName} 효과를 ` +
                `${option.extras.time ?? 10}초간 부여합니다.`
            ),
            onHit(option, self, victim) {
                if (victim instanceof LivingEntity && victim.isAlive) {
                    victim.addEffect(new Effect(EffectType.FROZEN, option.extras.level ?? 1, option.extras.time ?? 10,
                        self instanceof Player ? self as Player : null));
                }
            }
        },
        {
            name: '출혈',
            getDescription: option => (
                `대상을 공격하면 ${option.extras.level ?? 1}레벨의 ${EffectType.BLOOD.displayName} 효과를 ` +
                `${option.extras.time ?? 10}초간 부여합니다.`
            ),
            onHit(option, self, victim) {
                if (victim instanceof LivingEntity && victim.isAlive) {
                    victim.addEffect(new Effect(EffectType.BLOOD, option.extras.level ?? 1, option.extras.time ?? 10,
                        self instanceof Player ? self as Player : null));
                }
            }
        },
        {
            name: '부패',
            getDescription: option => (
                `대상을 공격하면 ${option.extras.level ?? 1}레벨의 ${EffectType.DECAY.displayName} 효과를 ` +
                `${option.extras.time ?? 10}초간 부여합니다.`
            ),
            onHit(option, self, victim) {
                if (victim instanceof LivingEntity && victim.isAlive) {
                    victim.addEffect(new Effect(EffectType.DECAY, option.extras.level ?? 1, option.extras.time ?? 10,
                        self instanceof Player ? self as Player : null));
                }
            }
        },
        {
            name: '둔화',
            getDescription: option => (
                `대상을 공격하면 ${option.extras.level ?? 1}레벨의 ${EffectType.SLOWNESS.displayName} 효과를 ` +
                `${option.extras.time ?? 10}초간 부여합니다.`
            ),
            onHit(option, self, victim) {
                if (victim instanceof LivingEntity && victim.isAlive) {
                    victim.addEffect(new Effect(EffectType.SLOWNESS, option.extras.level ?? 1, option.extras.time ?? 10,
                        self instanceof Player ? self as Player : null));
                }
            }
        },
        {
            name: '구속',
            getDescription: option => (
                `대상을 공격하면 ${option.extras.chance ?? 10}%의 확률로 ${EffectType.BIND.displayName} 효과를 ` +
                `${option.extras.time ?? 1}초간 부여합니다.`
            ),
            onHit(option, self, victim) {
                if (victim instanceof LivingEntity && victim.isAlive && Math.random() * 100 < (option.extras.chance ?? 10)) {
                    victim.addEffect(new Effect(EffectType.BIND, 1, option.extras.time ?? 1,
                        self instanceof Player ? self as Player : null));
                }
            }
        },
        {
            name: '빙결 저항',
            getDescription: option => (
                `${option.extras.level ?? 1}레벨 이하의 ${EffectType.FROZEN.displayName} 효과를 제거합니다.`
            ),
            onUpdate(option, self) {
                if(self instanceof LivingEntity) self.removeEffect(EffectType.FROZEN);
            },
        },
        {
            name: '라이프배리어',
            getDescription: option => (
                `체력이 ${Utils.toFixed(option.extras.life * 100, 1)}% 이하가 되면, ` +
                `${Utils.toFixed(option.extras.time ?? 5, 1)}초 동안 ${Utils.toFixed(option.extras.shield ?? 0, 0)}만큼의 ` +
                `모든 피해를 막는 방어막을 생성합니다. (재사용 대기시간 10분)`
            ),
            onUpdate(option, self) {
                if(!option.extras.latestUsed) option.extras.latestUsed = 0;
                let now = Date.now();

                if(self.life <= self.maxLife * option.extras.life && now - option.extras.latestUsed >= 1000 * 60 * 10) {
                    self.addShield('life_barrier_' + now, option.extras.shield ?? 0, option.extras.time ?? 5);
                    option.extras.latestUsed = now;
                }
            },
        },
        {
            name: '자연 재생',
            getDescription: option => (
                `10초간 피격받거나 공격하지 않으면, ${Utils.asSubjective(AttributeType.LIFE_REGEN.displayName)} ` +
                `${option.extras.lifeRegen ?? 1}만큼 늘어납니다.`
            ),
            onUpdate(option, self) {
                let now = Date.now();
                if(now - self.latestAttack > 1000 * 10 && now - self.latestHitted > 1000 * 10) {
                    self.attribute.addValue(AttributeType.LIFE_REGEN, option.extras.lifeRegen ?? 1);
                }
            },
        },
        {
            name: '잠재적 정신력',
            getDescription: option => (
                `10초간 피격받거나 공격하지 않으면, ${Utils.asSubjective(AttributeType.MANA_REGEN.displayName)} ` +
                `${option.extras.manaRegen ?? 1}만큼 늘어납니다.`
            ),
            onUpdate(option, self) {
                let now = Date.now();
                if(now - self.latestAttack > 1000 * 10 && now - self.latestHitted > 1000 * 10) {
                    self.attribute.addValue(AttributeType.MANA_REGEN, option.extras.manaRegen ?? 1);
                }
            },
        },
        {
            name: '흑염',
            getDescription: option => (
                `대상을 공격하면 ${Utils.toFixed((option.extras.chance ?? 1) * 100, 2)}%의 확률로 ${option.extras.level ?? 1}레벨의 ` +
                `${EffectType.FIRE.displayName} 및 ${EffectType.DECAY.displayName} 효과를 ` +
                `${option.extras.time ?? 10}초간 부여합니다.`
            ),
            onHit(option, self, victim) {
                if (victim instanceof LivingEntity && victim.isAlive) {
                    const level = (option.extras.level ?? 1) as number;
                    const time = (option.extras.time ?? 10) as number;
                    const caster = self instanceof Player ? self as Player : null;

                    [EffectType.FIRE, EffectType.DECAY].forEach(type => {
                        victim.addEffect(new Effect(type, level, time, caster));
                    });
                }
            }
        },
    ];

    static getOptionPreset(name: string) {
        return cache[name] ?? (cache[name] = OptionPreset.list.find(preset => preset.name === name));
    }
}