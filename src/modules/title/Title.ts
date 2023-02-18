import { AttributeType, Monster, MonsterType, Option, Player, PlayerLog, StatType, Trigger, Utils } from "../Internal"

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
        new Title('늑대 학살자',
            '늑대를 상대할 때 치명타 확률이 10%p 증가합니다.',
            new Trigger({
                onUpdate(p) {
                    if (p.currentTarget instanceof Monster && p.currentTarget.hasType(MonsterType.WOLF)) {
                        p.attribute.addValue(AttributeType.CRITICAL_CHANCE, 10);
                    }
                },
            }),
            p => p.log.getLog(PlayerLog.KILLED_TYPED_MONSTER_COUNT(MonsterType.WOLF)) >= 100
        ),
        new Title('아크스펠',
            `대상의 ${Utils.asSubjective(AttributeType.MAGIC_RESISTANCE.displayName)} ` +
            `${AttributeType.DEFEND.displayName}보다 클 경우 마법 공격력이 15% 상승합니다.`,
            new Trigger({
                onUpdate(p) {
                    if (p.currentTarget &&
                        p.currentTarget.attribute.getValue(AttributeType.MAGIC_RESISTANCE) >
                        p.currentTarget.attribute.getValue(AttributeType.DEFEND)) {
                        p.attribute.multiplyValue(AttributeType.MAGIC_ATTACK, 1.15);
                    }
                },
            }),
            p => p.stat.getStat(StatType.SPELL) > 2000
        ),
        new Title('마도사',
            `마법 공격력이 3% 상승합니다.`,
            new Trigger({
                onUpdate(p) {
                    p.attribute.multiplyValue(AttributeType.MAGIC_ATTACK, 1.03);
                },
            }),
            p => p.stat.getStat(StatType.SPELL) > 1000
        )
    ];

    static getTitle(name: string) {
        return cache[name] ?? (cache[name] = Title.list.find(title => title.name === name));
    }
}