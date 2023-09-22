import { AttributeType } from "../attribute/AttributeType";
import { StatType } from "../entity/Entity";
import { Player } from "../entity/living/player/Player";
import { Trigger } from "../trigger/Trigger";
import { Utils } from "../util/Utils";

const cache: { [key: string]: CharacterClass | undefined } = {};

export class CharacterClass {

    name: string;
    description: string;
    trigger: Trigger | null = null;
    canChangeClass: ((p: Player) => boolean) | null = null;
    onChangeClass: (p: Player) => void;
    enhancedClassName: string | null = null;

    private constructor(name: string,
        description: string,
        onChangeClass: (p: Player) => void) {
        this.name = name;
        this.description = description;
        this.onChangeClass = onChangeClass;
    }

    setTrigger(trigger: Trigger) {
        this.trigger = trigger;
        return this;
    }

    setCanChangeClass(canChangeClass: (p: Player) => boolean) {
        this.canChangeClass = canChangeClass;
        return this;
    }

    setEnhancedClassName(name: string) {
        this.enhancedClassName = name;
        return this;
    }

    get hasEnhancedClass() {
        return this.enhancedClassName != null;
    }

    get enhancedClass(): CharacterClass | null {
        if(this.enhancedClassName == null) return null;
        return CharacterClass.getCharacterClass(this.enhancedClassName) ?? null;
    }

    static list: CharacterClass[] = [
        new CharacterClass('전사', 
            '기본 공격을 할 때마다 중첩이 쌓입니다. (최대 50)\n' +
            `중첩은 5초 동안 공격하지 않으면 초기화되며, 중첩 1개당 ${
                Utils.asSubjective(AttributeType.ATTACK.displayName)} 1% 증가합니다.`, p => {})
            .setTrigger(new Trigger({
                onHit(p, victim) {
                    if(typeof(p.extras.warriorStack) !== 'number')
                        p.extras.warriorStack = 0;
                    p.extras.warriorStack++;
                },
                onUpdate(p) {
                    if(typeof(p.extras.warriorStack) !== 'number' || Date.now() - p.latestAttack > 5 * 1000)
                        p.extras.warriorStack = 0;
                    p.attribute.multiplyValue(AttributeType.ATTACK, 1 + p.extras.warriorStack * 0.01);
                },
            }))
            .setEnhancedClassName('광전사'),

        new CharacterClass('광전사', 
            `${Utils.asSubjective(AttributeType.MAX_LIFE.displayName)} 45% 증가합니다.\n` +
            `또한 잃은 생명력에 비례해서 ${
                Utils.asSubjective(AttributeType.ATTACK.displayName)} 최소 20% ~ 최대 60%까지 증가합니다.`, p => {})
            .setCanChangeClass(p => (
                p.stat.getStat(StatType.STRENGTH) >= 200 && p.stat.getStat(StatType.VITALITY) >= 200
            ))
            .setTrigger(new Trigger({
                onUpdate(p) {
                    p.attribute.multiplyValue(AttributeType.MAX_LIFE, 1.45);
                    p.attribute.multiplyValue(AttributeType.ATTACK, 1.2 + 0.4 * ((p.maxLife - p.life) / p.maxLife));
                }
            })),

        new CharacterClass('암살자', 
            `${AttributeType.MOVE_SPEED.asSubjective()} 10% 증가합니다. 또한 민첩 스탯에 비례해서 ` + 
            `${AttributeType.DEFEND_PENETRATE.asSubjective()} 증가합니다.`, p => {})
            .setTrigger(new Trigger({
                onUpdate(p) {
                    p.attribute.multiplyValue(AttributeType.MOVE_SPEED, 1.1);
                    p.attribute.addValue(AttributeType.DEFEND_PENETRATE, p.stat.getStat(StatType.AGILITY) * 5);
                },
            }))
            .setEnhancedClassName('나이트 세이드'),

        new CharacterClass('나이트 세이드', 
            `${AttributeType.MOVE_SPEED.asSubjective()} 16% 증가합니다. 또한 민첩 스탯에 비례해서 ` + 
            `${AttributeType.DEFEND_PENETRATE.asSubjective()} 증가합니다.`, p => {})
            .setTrigger(new Trigger({
                onUpdate(p) {
                    p.attribute.multiplyValue(AttributeType.MOVE_SPEED, 1.16);
                    p.attribute.addValue(AttributeType.DEFEND_PENETRATE, p.stat.getStat(StatType.AGILITY) * 8);
                },
            }))
            .setCanChangeClass(p => (
                p.stat.getStat(StatType.STRENGTH) >= 200 && p.stat.getStat(StatType.AGILITY) >= 200
            )),

        new CharacterClass('궁수', `${AttributeType.RANGE_ATTACK.asSubjective()} 15% 증가합니다.`, p => {})
            .setTrigger(new Trigger({
                onUpdate(p) {
                    p.attribute.multiplyValue(AttributeType.RANGE_ATTACK, 1.15);
                },
            }))
            .setEnhancedClassName('래피딕 아처'),

        new CharacterClass('래피딕 아처', `${AttributeType.PROJECTILE_SPEED.asSubjective()} 10% 증가합니다. ` + 
            `또한 ${StatType.AGILITY.displayName} 스탯에 비례해서 ${AttributeType.RANGE_ATTACK.asSubjective()} 증가합니다.`, p => {})
            .setCanChangeClass(p => (
                p.stat.getStat(StatType.STRENGTH) >= 200 && p.stat.getStat(StatType.SENSE) >= 200
            ))
            .setTrigger(new Trigger({
                onUpdate(p) {
                    p.attribute.multiplyValue(AttributeType.PROJECTILE_SPEED, 1.1);
                    p.attribute.addValue(AttributeType.RANGE_ATTACK, p.stat.getStat(StatType.AGILITY) * 5);
                },
            })),

        new CharacterClass('마법사', `${AttributeType.MAGIC_ATTACK.asSubjective()} 15% 증가합니다.`, p => {})
            .setTrigger(new Trigger({
                onUpdate(p) {
                    p.attribute.multiplyValue(AttributeType.MAGIC_ATTACK, 1.15);
                },
            }))
            .setEnhancedClassName('그랜드 메이지'),

        new CharacterClass('주술사', `${AttributeType.MAGIC_ATTACK.asSubjective()} 35% 증가합니다.`, p => {
            p.removeSkill('주문 조합');
            p.removeSkill('명상');
        })
            .setTrigger(new Trigger({
                onUpdate(p) {
                    p.attribute.multiplyValue(AttributeType.MAGIC_ATTACK, 1.35);
                },
            })),

        new CharacterClass('그랜드 메이지', `${AttributeType.MAGIC_ATTACK.asSubjective()} 19% 증가합니다.\n` + 
            `또한 ${AttributeType.MAGIC_PENETRATE.asSubjective()} 30% 증가합니다.`, p => {})
            .setTrigger(new Trigger({
                onUpdate(p) {
                    p.attribute.multiplyValue(AttributeType.MAGIC_ATTACK, 1.19);
                    p.attribute.multiplyValue(AttributeType.MAGIC_PENETRATE, 1.3);
                },
            }))
            .setCanChangeClass(p => (
                p.stat.getStat(StatType.SPELL) >= 200 && p.stat.getStat(StatType.SENSE) >= 200
            )),
        new CharacterClass('성기사', `${StatType.VITALITY.displayName} 스탯에 비례해서 ${AttributeType.MAGIC_ATTACK.asSubjective()} 증가합니다.`, p => {})
            .setTrigger(new Trigger({
                onUpdate(p) {
                    p.attribute.addValue(AttributeType.MAGIC_ATTACK, p.stat.getStat(StatType.VITALITY) * 5);
                },
            }))
            .setEnhancedClassName('세인티스 팔라딘'),

        new CharacterClass('세인티스 팔라딘', `${StatType.VITALITY.displayName} 스탯에 비례해서 ${
            AttributeType.MAGIC_ATTACK.asSubjective()} 증가합니다. 또한 ${AttributeType.MAX_LIFE.asSubjective()} 25% 증가합니다.`, p => {})
            .setTrigger(new Trigger({
                onUpdate(p) {
                    p.attribute.addValue(AttributeType.MAGIC_ATTACK, Math.pow(p.stat.getStat(StatType.VITALITY), 1.05) * 8);
                    p.attribute.multiplyValue(AttributeType.MAX_LIFE, 1.25);
                },
            }))
            .setCanChangeClass(p => (
                p.stat.getStat(StatType.SPELL) >= 200 && p.stat.getStat(StatType.VITALITY) >= 200
            )),

        new CharacterClass('대장장이', `${AttributeType.DEXTERITY.asSubjective()} 4% 증가합니다.`, p => {})
            .setTrigger(new Trigger({
                onUpdate(p) {
                    p.attribute.multiplyValue(AttributeType.DEXTERITY, 1.04);
                },
            }))
            .setEnhancedClassName('스펠릭 스미스'),

        new CharacterClass('스펠릭 스미스', `${AttributeType.DEXTERITY.asSubjective()} 10% 증가합니다.`, p => {})
            .setTrigger(new Trigger({
                onUpdate(p) {
                    p.attribute.multiplyValue(AttributeType.DEXTERITY, 1.1);
                },
            }))
            .setCanChangeClass(p => (
                p.stat.getStat(StatType.SENSE) >= 600 && p.stat.getStat(StatType.SPELL) >= 50
            ))
    ];

    static getCharacterClass(name: string): CharacterClass | undefined {
        return cache[name] ?? (cache[name] = CharacterClass.list
            .find(characterClass => characterClass.name === name));
    }
}