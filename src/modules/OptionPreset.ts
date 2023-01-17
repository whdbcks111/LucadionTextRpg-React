import { OptionPresetObject } from "../types";
import { Effect, EffectType, LivingEntity, Player } from "./Internal";
import Utils from "./Utils";

const cache: { [key: string]: OptionPresetObject | undefined } = {};

export class OptionPreset {
    static list: OptionPresetObject[] = [
        {
            name: '독날',
            getDescription: option => {
                return `대상을 공격하면 ${option.extras.level ?? 1}레벨의 ${EffectType.POISON.displayName} 효과를 ` +
                    `${option.extras.time ?? 10}초간 부여합니다.`;
            },
            onHit: (option, self, victim) => {
                if (victim instanceof LivingEntity && victim.isAlive) {
                    victim.addEffect(new Effect(EffectType.POISON, option.extras.level ?? 1, option.extras.time ?? 10,
                        self instanceof Player ? self as Player : null));
                }
            }
        },
        {
            name: '발화',
            getDescription: option => {
                return `대상을 공격하면 ${option.extras.level ?? 1}레벨의 ${EffectType.FIRE.displayName} 효과를 ` +
                    `${option.extras.time ?? 10}초간 부여합니다.`;
            },
            onHit: (option, self, victim) => {
                if (victim instanceof LivingEntity && victim.isAlive) {
                    victim.addEffect(new Effect(EffectType.FIRE, option.extras.level ?? 1, option.extras.time ?? 10,
                        self instanceof Player ? self as Player : null));
                }
            }
        },
        {
            name: '흑염',
            getDescription: option => {
                return `대상을 공격하면 ${Utils.toFixed((option.extras.chance ?? 1) * 100, 2)}%의 확률로 ${option.extras.level ?? 1}레벨의 ` +
                    `${EffectType.FIRE.displayName} 및 ${EffectType.DECAY.displayName} 효과를 ` +
                    `${option.extras.time ?? 10}초간 부여합니다.`;
            },
            onHit: (option, self, victim) => {
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