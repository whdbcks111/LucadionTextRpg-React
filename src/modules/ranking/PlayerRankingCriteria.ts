import { AttributeType, Player } from "../Internal"
import { StatType, Utils } from "../Internal"

export class PlayerRankingCriteria {
    
    name: string;
    scoreGetter: (p: Player) => number;
    messageGetter: (p: Player, score: number) => string;

    constructor(name: string, 
        scoreGetter: (p: Player) => number, 
        messageGetter: (p: Player, score: number) => string) {
        this.name = name;
        this.scoreGetter = scoreGetter;
        this.messageGetter = messageGetter;
    }

    getScore(player: Player) {
        return this.scoreGetter(player);
    }

    getMessage(player: Player) {
        return this.messageGetter(player, this.getScore(player));
    }

    static getCriteria(name: string) {
        let criteria = PlayerRankingCriteria.list.find(c => c.name === name) ?? null;
        if(criteria == null) throw new Error('Invalied Criteria Name');
        return criteria;
    }

    static list = [
        new PlayerRankingCriteria('레벨',
            p => p.level + Utils.clamp01(p.exp / p.maxExp),
            (p, score) => '레벨 ‣ Lv.' + Math.floor(score)
        ),
        new PlayerRankingCriteria('근력',
            p => p.stat.getStat(StatType.STRENGTH),
            (p, score) => '근력 ‣ ' + score
        ),
        new PlayerRankingCriteria('체력',
            p => p.stat.getStat(StatType.VITALITY),
            (p, score) => '체력 ‣ ' + score
        ),
        new PlayerRankingCriteria('민첩',
            p => p.stat.getStat(StatType.AGILITY),
            (p, score) => '민첩 ‣ ' + score
        ),
        new PlayerRankingCriteria('감각',
            p => p.stat.getStat(StatType.SENSE),
            (p, score) => '감각 ‣ ' + score
        ),
        new PlayerRankingCriteria('마법',
            p => p.stat.getStat(StatType.SPELL),
            (p, score) => '마법 ‣ ' + score
        ),
        new PlayerRankingCriteria('악명',
            p => p.notorious,
            (p, score) => '악명 ‣ ' + score.toFixed(1)
        ),
        new PlayerRankingCriteria('물리 공격력',
            p => p.attribute.getValue(AttributeType.ATTACK),
            (p, score) => '물리 공격력 ‣ ' + score.toFixed(1)
        ),
        new PlayerRankingCriteria('마법 공격력',
            p => p.attribute.getValue(AttributeType.MAGIC_ATTACK),
            (p, score) => '마법 공격력 ‣ ' + score.toFixed(1)
        ),
        new PlayerRankingCriteria('원거리 공격력',
            p => p.attribute.getValue(AttributeType.RANGE_ATTACK),
            (p, score) => '원거리 공격력 ‣ ' + score.toFixed(1)
        ),
        new PlayerRankingCriteria('물리 방어력',
            p => p.attribute.getValue(AttributeType.DEFEND),
            (p, score) => '물리 방어력 ‣ ' + score.toFixed(1)
        ),
        new PlayerRankingCriteria('마법 저항력',
            p => p.attribute.getValue(AttributeType.MAGIC_RESISTANCE),
            (p, score) => '마법 저항력 ‣ ' + score.toFixed(1)
        ),
        new PlayerRankingCriteria('골드',
            p => p.gold,
            (p, score) => '골드 ‣ ' + score
        )
    ]
}