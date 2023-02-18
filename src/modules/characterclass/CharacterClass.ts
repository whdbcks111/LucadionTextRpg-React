import { AttributeType } from "../attribute/AttributeType";
import { StatType } from "../entity/Entity";
import { Player } from "../entity/Player";
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
            `${Utils.asSubjective(AttributeType.MAX_LIFE.displayName)} 15% 증가합니다.\n` +
            `또한 잃은 생명력에 비례해서 ${
                Utils.asSubjective(AttributeType.ATTACK.displayName)} 최소 20% ~ 최대 50%까지 증가합니다.`, p => {})
            .setCanChangeClass(p => (
                p.stat.getStat(StatType.STRENGTH) >= 200 && p.stat.getStat(StatType.VITALITY) >= 200
            ))
            .setTrigger(new Trigger({
                onUpdate(p) {
                    p.attribute.multiplyValue(AttributeType.MAX_LIFE, 1.15);
                    p.attribute.multiplyValue(AttributeType.ATTACK, 1.2 + 0.3 * ((p.maxLife - p.life) / p.maxLife));
                }
            })),
        new CharacterClass('암살자', 
            `${AttributeType.MOVE_SPEED}`, p => {
            
        })
            .setTrigger(new Trigger({

            }))
            .setEnhancedClassName('나이트 세이드'),
        new CharacterClass('나이트 세이드', '', p => {})
            .setCanChangeClass(p => (
                p.stat.getStat(StatType.STRENGTH) >= 200 && p.stat.getStat(StatType.AGILITY) >= 200
            )),
        new CharacterClass('궁수', '', p => {
            
        })
            .setTrigger(new Trigger({

            }))
            .setEnhancedClassName('래피딕 아처'),
        new CharacterClass('래피딕 아처', '', p => {})
            .setCanChangeClass(p => (
                p.stat.getStat(StatType.STRENGTH) >= 200 && p.stat.getStat(StatType.SENSE) >= 200
            )),
        new CharacterClass('마법사', '', p => {
            
        })
            .setTrigger(new Trigger({

            }))
            .setEnhancedClassName('그랜드 메이지'),
        new CharacterClass('그랜드 메이지', '', p => {})
            .setCanChangeClass(p => (
                p.stat.getStat(StatType.SPELL) >= 200 && p.stat.getStat(StatType.SENSE) >= 200
            )),
        new CharacterClass('성기사', '', p => {
            
        })
            .setTrigger(new Trigger({

            }))
            .setEnhancedClassName('세인티스 팔라딘'),
        new CharacterClass('세인티스 팔라딘', '', p => {})
            .setCanChangeClass(p => (
                p.stat.getStat(StatType.SPELL) >= 200 && p.stat.getStat(StatType.VITALITY) >= 200
            )),
        new CharacterClass('대장장이', '', p => {
            
        })
            .setTrigger(new Trigger({

            }))
    ];

    static getCharacterClass(name: string): CharacterClass | undefined {
        return cache[name] ?? (cache[name] = CharacterClass.list
            .find(characterClass => characterClass.name === name));
    }
}