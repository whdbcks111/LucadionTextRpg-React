import { MonsterType, Option, Player, PlayerLog, Trigger } from "./Internal"

const cache: { [key: string]: Title | undefined } = {};

export class Title {

    name: string;
    description: string;
    trigger: Trigger | null;
    obtainCondition: ((player: Player) => boolean) | null;

    constructor(name: string, desc: string, trigger: Trigger | null = null, 
        obtainCondition: ((player: Player) => boolean) | null = null) {
        this.name = name;
        this.description = desc;
        this.trigger = trigger;
        this.obtainCondition = obtainCondition;
    }

    canObtain(player: Player) {
        return this.obtainCondition ? this.obtainCondition(player) : false;
    }

    static list = [
        new Title('늑대 학살자', '', new Trigger({

        }), p => (
            p.log.getLog(PlayerLog.KILLED_TYPED_MONSTER_COUNT(MonsterType.WOLF)) >= 100
        ))
    ];

    static getTitle(name: string) {
        return cache[name] ?? (cache[name] = Title.list.find(title => title.name === name));
    }
}