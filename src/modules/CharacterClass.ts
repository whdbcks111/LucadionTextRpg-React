import { on } from "events";
import { StatType } from "./Entity";
import { Player } from "./Player";
import { Trigger } from "./Trigger";

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
        new CharacterClass('전사', '', p => {
            
        })
            .setTrigger(new Trigger({

            }))
            .setEnhancedClassName('광전사'),
        new CharacterClass('광전사', '', p => {})
            .setCanChangeClass(p => (
                p.stat.getStat(StatType.STRENGTH) > 100
            ))
    ];

    static getCharacterClass(name: string): CharacterClass | undefined {
        return cache[name] ?? (cache[name] = CharacterClass.list
            .find(characterClass => characterClass.name === name));
    }
}