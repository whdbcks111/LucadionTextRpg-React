import { AttributeType, Effect, EffectType, LivingEntity, 
    Monster, MonsterType, Player, PlayerLog, StatType, Trigger, Utils } from "../../../Internal"

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
        new Title(`늑대 학살자`,
            `늑대를 상대할 때 ${AttributeType.CRITICAL_CHANCE.asSubjective()} 10%p 증가합니다.`,
            new Trigger({
                onUpdate(p) {
                    if (p.currentTarget instanceof Monster && p.currentTarget.hasType(MonsterType.WOLF)) {
                        p.attribute.addValue(AttributeType.CRITICAL_CHANCE, 10);
                    }
                },
            }),
            p => p.log.getLog(PlayerLog.KILLED_TYPED_MONSTER_COUNT(MonsterType.WOLF)) >= 100
        ),
        new Title(`과거의 영광`,
            `레벨이 100 이하일 때 ${AttributeType.EXP_EFFCIENECY.asSubjective()} 5%p 증가합니다.`,
            new Trigger({
                onUpdate(p) {
                    if(p.level <= 100) {
                        p.attribute.addValue(AttributeType.EXP_EFFCIENECY, 5);
                    }
                },
            }),
            p => false
        ),
        new Title(`언데드 킬러`,
            `언데드 타입 몬스터를 상대할 때 ${AttributeType.CRITICAL_CHANCE.asSubjective()} 5%p 증가합니다.`,
            new Trigger({
                onUpdate(p) {
                    if (p.currentTarget instanceof Monster && p.currentTarget.hasType(MonsterType.UNDEAD)) {
                        p.attribute.addValue(AttributeType.CRITICAL_CHANCE, 5);
                    }
                },
            }),
            p => p.log.getLog(PlayerLog.KILLED_TYPED_MONSTER_COUNT(MonsterType.UNDEAD)) >= 200
        ),
        new Title(`언데드 슬레이어`,
            `언데드 타입 몬스터를 상대할 때 ${AttributeType.CRITICAL_CHANCE.asSubjective()} 10%p 증가합니다.`,
            new Trigger({
                onUpdate(p) {
                    if (p.currentTarget instanceof Monster && p.currentTarget.hasType(MonsterType.UNDEAD)) {
                        p.attribute.addValue(AttributeType.CRITICAL_CHANCE, 10);
                    }
                },
            }),
            p => p.log.getLog(PlayerLog.KILLED_TYPED_MONSTER_COUNT(MonsterType.UNDEAD)) >= 1000
        ),
        new Title(`벌레 사냥꾼`,
            `벌레 타입 몬스터를 상대할 때 ${AttributeType.CRITICAL_DAMAGE.asSubjective()} 10% 증가합니다.`,
            new Trigger({
                onUpdate(p) {
                    if (p.currentTarget instanceof Monster && p.currentTarget.hasType(MonsterType.WORM)) {
                        p.attribute.multiplyValue(AttributeType.CRITICAL_DAMAGE, 1.1);
                    }
                },
            }),
            p => p.log.getLog(PlayerLog.KILLED_TYPED_MONSTER_COUNT(MonsterType.WORM)) >= 500
        ),
        new Title(`불꽃 수집가`,
            `불 타입 몬스터를 상대할 때 ${AttributeType.CRITICAL_DAMAGE.asSubjective()} 10% 증가합니다.`,
            new Trigger({
                onUpdate(p) {
                    if (p.currentTarget instanceof Monster && p.currentTarget.hasType(MonsterType.FIRE)) {
                        p.attribute.multiplyValue(AttributeType.CRITICAL_DAMAGE, 1.1);
                    }
                },
            }),
            p => p.log.getLog(PlayerLog.KILLED_TYPED_MONSTER_COUNT(MonsterType.FIRE)) >= 200
        ),
        new Title(`곡괭이 살해자`,
            `곡괭이로 적을 공격하면 10% 확률로 적에게 1초 동안 ${EffectType.STUN.displayName} 효과를 부여합니다.`,
            new Trigger({
                onHit(p, victim) {
                    if(p.slot.hand?.type === '곡괭이' && 
                        victim instanceof LivingEntity && Math.random() < 0.1) {
                        victim.addEffect(new Effect(EffectType.STUN, 1, 1, p));
                    }
                },
            }),
            p => p.log.getLog(PlayerLog.TYPED_ATTACK_COUNT('곡괭이')) >= 200
        ),
        new Title(`액스 파이터`,
            `도끼로 적을 공격하면 30% 확률로 적에게 5초 동안 ${EffectType.BLOOD.displayName} 효과를 부여합니다.`,
            new Trigger({
                onHit(p, victim) {
                    if(p.slot.hand?.type === '도끼' && 
                        victim instanceof LivingEntity && Math.random() < 0.3) {
                        victim.addEffect(new Effect(EffectType.BLOOD, 10, 5, p));
                    }
                },
            }),
            p => p.log.getLog(PlayerLog.TYPED_ATTACK_COUNT('도끼')) >= 500 && p.level < 200
        ),
        new Title(`격투가`,
            `맨손 상태일 때 ${AttributeType.ATTACK.asSubjective()} 30% 증가합니다.`,
            new Trigger({
                onUpdate(p) {
                    if(!p.slot.hand) {
                        p.attribute.multiplyValue(AttributeType.ATTACK, 1.3);
                    }
                },
            }),
            p => p.log.getLog(PlayerLog.TYPED_ATTACK_COUNT('none')) >= 100 && p.level < 70
        ),
        new Title(`광부의 길`,
            `곡괭이를 들면 ${AttributeType.EXP_EFFCIENECY.asSubjective()} 5% 증가합니다.`,
            new Trigger({
                onUpdate(p) {
                    if(p.slot.hand?.type === '곡괭이') {
                        p.attribute.multiplyValue(AttributeType.EXP_EFFCIENECY, 1.05);
                    }
                },
            }),
            p => p.log.getLog(PlayerLog.TYPED_ATTACK_COUNT('곡괭이')) >= 200 && p.level < 60
        ),
        new Title(`학살자`,
            `플레이어를 상대할 때 ${AttributeType.CRITICAL_DAMAGE.asSubjective()} 5% 증가합니다.`,
            new Trigger({
                onUpdate(p) {
                    if (p.currentTarget instanceof Player) {
                        p.attribute.multiplyValue(AttributeType.CRITICAL_DAMAGE, 1.05);
                    }
                },
            }),
            p => p.log.getLog(PlayerLog.KILLED_PLAYER_COUNT) >= 100
        ),
        new Title(`몰살자`,
            `플레이어를 상대할 때 ${AttributeType.CRITICAL_CHANCE.asSubjective()} 5% 증가합니다.`,
            new Trigger({
                onUpdate(p) {
                    if (p.currentTarget instanceof Player) {
                        p.attribute.multiplyValue(AttributeType.CRITICAL_CHANCE, 1.05);
                    }
                },
            }),
            p => p.log.getLog(PlayerLog.KILLED_PLAYER_COUNT) >= 100
        ),
        new Title(`아크스펠`,
            `대상의 ${Utils.asSubjective(AttributeType.MAGIC_RESISTANCE.displayName)} ` +
            `${AttributeType.DEFEND.displayName}보다 클 경우 ${AttributeType.MAGIC_ATTACK.asSubjective()} 15% 상승합니다.`,
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
        new Title(`마도사`,
            `${AttributeType.MAGIC_ATTACK.asSubjective()} 3% 상승합니다.`,
            new Trigger({
                onUpdate(p) {
                    p.attribute.multiplyValue(AttributeType.MAGIC_ATTACK, 1.03);
                },
            }),
            p => p.stat.getStat(StatType.SPELL) > 1000
        ),
        new Title(`속사`,
            `${AttributeType.DEFEND_PENETRATE.asSubjective()} 5000 만큼 상승합니다.`,
            new Trigger({
                onUpdate(p) {
                    p.attribute.addValue(AttributeType.DEFEND_PENETRATE, 5000);
                },
            }),
            p => p.stat.getStat(StatType.AGILITY) > 1000
        ),
        new Title(`페이탈디드`,
            `${AttributeType.CRITICAL_CHANCE.asSubjective()} 3%p 만큼 상승합니다.`,
            new Trigger({
                onUpdate(p) {
                    p.attribute.addValue(AttributeType.CRITICAL_CHANCE, 3);
                },
            }),
            p => p.stat.getStat(StatType.SENSE) > 500 && (p.hadClass(`암살자`) || p.hadClass(`궁수`))
        ),
        new Title(`초감각`,
            `${AttributeType.DEXTERITY.asSubjective()} 7% 만큼 상승합니다.`,
            new Trigger({
                onUpdate(p) {
                    p.attribute.multiplyValue(AttributeType.DEXTERITY, 1.05);
                },
            }),
            p => p.stat.getStat(StatType.SENSE) > 1000 && p.hadClass(`대장장이`)
        )
    ];

    static getTitle(name: string) {
        return cache[name] ?? (cache[name] = Title.list.find(title => title.name === name));
    }
}