import { SkillPresetObject } from "../types";
import { AttributeType } from "./AttributeType";
import { PlayerLog } from "./Player";

const cache: { [key: string]: SkillPresetObject | undefined } = {};

export class SkillPreset {
    static list: SkillPresetObject[] = [
        {
            name: '강타',
            isPassive: false,
            maxLevel: 10,
            checkRealizeCondition: p => p.log.getLog(PlayerLog.CRITICAL_COUNT) >= 2,
            calcValues: (skill, p) => [ 
                Math.max(55 - skill.level * 2, 10), //mana cost
                skill.level * 50 + 100 + (skill.level === skill.maxLevel ? 400: 0), //damage
                Math.max(5.1 - skill.level * .1, 1), //prof addition
            ],
            getCooldown: (skill, p) => Math.max(5, 10 - skill.level * 0.5),
            getCostMessage: (skill, p) => skill.getValue(p, 0) + '마나',
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= skill.getValue(p, 0),
            takeCost: (skill, p) => p.mana -= skill.getValue(p, 0),
            getConditionMessage: (skill, p) => '목표물이 있을 때, 강타! 라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.currentTarget !== null && p.tickMessage === '강타!',
            getDescription: (skill, p) => `${AttributeType.ATTACK.displayName}과 ${AttributeType.RANGE_ATTACK.displayName}이 ` + 
                `${skill.getValue(p, 1).toFixed(1)}만큼 증가한 채로 목표를 공격합니다.`,
            onUpdate(skill, p) {
                if(!p.currentTarget || !p.currentTarget.isAlive) {
                    skill.finish(p);
                    return;
                }
                if(!p.isAttackEnded) return;

                let damage = skill.getValue(p, 1);
                let target = p.currentTarget;

                p.attribute.addValue(AttributeType.ATTACK, damage);
                p.attribute.addValue(AttributeType.RANGE_ATTACK, damage);

                p.registerLateTask(() => {
                    p.attack(target);
                });

                skill.prof += skill.getValue(p, 2);
                skill.finish(p);
            },
        },
        {
            name: '초급 검술',
            isPassive: true,
            maxLevel: 1,
            checkRealizeCondition: p => p.log.getLog(PlayerLog.TYPED_ATTACK_COUNT('장검')) >= 350,
            calcValues: (skill, p) => [ 
                100, //penetrate
                30 //move speed
            ],
            getDescription: (skill, p) => `장검 종류 아이템을 들었을 때, ` + 
                `${AttributeType.DEFEND_PENETRATE.displayName}과 ${AttributeType.MOVE_SPEED.displayName}가 각각 ` + 
                `${skill.getValues(p).join(', ')}만큼 증가합니다.`,
            onUpdate(skill, p) {
                if(p.isAlive && p.slot.hand?.type === '장검') {
                    p.attribute.addValue(AttributeType.DEFEND_PENETRATE, skill.getValue(p, 0));
                    p.attribute.addValue(AttributeType.MOVE_SPEED, skill.getValue(p, 1));
                }
            },
        }
    ];

    static getSkillPreset(name: string) {
        return cache[name] ?? (cache[name] = SkillPreset.list.find(preset => preset.name === name));
    }
}