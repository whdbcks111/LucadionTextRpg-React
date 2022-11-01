import { MonsterType } from "./Monster.mjs";
import Player from "./Player.mjs";

export default class Title {

    constructor(name, option = null, obtainCondition = null) {
        this.name = name;
        this.option = option;
        this.obtainCondition = obtainCondition;
    }

    canObtain(player) {
        return this.obtainCondition?.call(this, player) ?? false;
    }

    static list = [
        new Title('늑대 학살자', new Option('늑대 학살자', { inc: 10 }), p => {
            return p.log.getLog(Player.Log.KILLED_TYPED_MONSTER_COUNT(MonsterType.WOLF)) >= 100;
        })
    ];
}