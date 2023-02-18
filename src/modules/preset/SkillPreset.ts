import { SkillPresetObject } from "../../types";
import { AttributeModifier, AttributeType, Effect, EffectType, LivingEntity, Player, Projectile, Time, Trigger, Utils } from "../Internal";
import { PlayerLog } from "../Internal";
import { ComponentBuilder } from "../server/chat/ComponentBuilder";

const cache: { [key: string]: SkillPresetObject | undefined } = {};

export class SkillPreset {
    static list: SkillPresetObject[] = [
        {
            name: '강타',
            isPassive: false,
            maxLevel: 10,
            checkRealizeCondition: p => p.log.getLog(PlayerLog.CRITICAL_COUNT) >= 2,
            calcValues: (skill, p) => ({
                manaCost: Math.max(55 - skill.level * 2, 10),
                damage: skill.level * 50 + 100 + (skill.level === skill.maxLevel ? 400: 0),
                profAddition: Math.max(5.1 - skill.level * .1, 1),
            }),
            getCooldown: (skill, p) => Math.max(5, 10 - skill.level * 0.5),
            getCostMessage: (skill, p) => skill.getValue(p, 'manaCost') + '마나',
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= skill.getValue(p, 'manaCost'),
            takeCost: (skill, p) => p.mana -= skill.getValue(p, 'manaCost'),
            getConditionMessage: (skill, p) => '목표물이 있을 때, 강타! 라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.currentTarget !== null && p.tickMessage === '강타!',
            getDescription: (skill, p) => ComponentBuilder.message([
                ComponentBuilder.text(`${AttributeType.ATTACK.displayName}과 ${AttributeType.RANGE_ATTACK.displayName}이 `),
                ComponentBuilder.text(skill.getValue(p, 'damage').toFixed(1), { color: Utils.PHYSICAL_COLOR }),
                ComponentBuilder.text(`만큼 증가한 채로 목표를 공격합니다.`)
            ]),
            onUpdate(skill, p) {
                if(!p.currentTarget || !p.currentTarget.isAlive) {
                    skill.finish(p);
                    return;
                }
                if(!p.isAttackEnded) return;

                let damage = skill.getValue(p, 'damage');
                let target = p.currentTarget;

                p.attribute.addValue(AttributeType.ATTACK, damage);
                p.attribute.addValue(AttributeType.RANGE_ATTACK, damage);

                p.registerLateTask(() => {
                    p.attack(target);
                });

                skill.prof += skill.getValue(p, 'profAddition');
                skill.finish(p);
            },
        },
        {
            name: '초급 검술',
            isPassive: true,
            maxLevel: 1,
            checkRealizeCondition: p => p.log.getLog(PlayerLog.TYPED_ATTACK_COUNT('장검')) >= 350,
            calcValues: (skill, p) => ({ 
                penetrate: 100, //penetrate
                moveSpeed: 30 //move speed
            }),
            getDescription: (skill, p) => ComponentBuilder.empty()/*`장검 종류 아이템을 들었을 때, ` + 
                `${AttributeType.DEFEND_PENETRATE.displayName}과 ${AttributeType.MOVE_SPEED.displayName}가 각각 ` + 
                `${Utils.numberText(skill.getValue(p, 'penetrate'))}, ${Utils.numberText(skill.getValue(p, 'moveSpeed'))}만큼 증가합니다.`*/,
            onUpdate(skill, p) {
                if(p.isAlive && p.slot.hand?.type === '장검') {
                    p.attribute.addValue(AttributeType.DEFEND_PENETRATE, skill.getValue(p, 'penetrate'));
                    p.attribute.addValue(AttributeType.MOVE_SPEED, skill.getValue(p, 'moveSpeed'));
                }
            },
        },
        {
            name: '독살',
            isPassive: false,
            maxLevel: 20,
            checkRealizeCondition: p => p.hadClass('암살자'),
            calcValues: (skill, p) => ({ 
                manaCost: skill.level * 10 + 55, //mana cost
                penetrateIncrease: skill.level * 10 + 100, //penetrate increase
                poisonLevel: Math.floor(skill.level * 2.5 + 5), //poison level
                poisonTime: 20, //poison time
                profAddition: Math.max(6.1 - skill.level * .25, .25), //prof addition
            }),
            getCooldown: (skill, p) => Math.max(5, 22 - skill.level * 0.5),
            getCostMessage: (skill, p) => skill.getValue(p, 'manaCost') + '마나',
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= skill.getValue(p, 'manaCost'),
            takeCost: (skill, p) => p.mana -= skill.getValue(p, 'manaCost'),
            getConditionMessage: (skill, p) => '목표물이 있을 때, 독살! 이라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.currentTarget !== null && p.tickMessage === '독살!',
            getDescription: (skill, p) => ComponentBuilder.empty()/*`${AttributeType.DEFEND_PENETRATE.displayName}이 ` + 
                `${Utils.numberText(skill.getValue(p, 'penetrateIncrease')) + '%'}만큼 증가한 채로 목표를 공격합니다.\n` +
                `공격받은 대상에게 ${Effect.getDescriptionMessage(EffectType.POISON, skill.getValue(p, 'poisonLevel'))} ` + 
                `효과를 ${skill.getValue(p, 'poisonTime')}초간 부여합니다.`*/,
            onUpdate(skill, p) {
                if(!p.currentTarget || !p.currentTarget.isAlive) {
                    skill.finish(p);
                    return;
                }
                if(!p.isAttackEnded) return;

                let amount = skill.getValue(p, 'penetrateIncrease');
                let target = p.currentTarget;

                p.attribute.addValue(AttributeType.DEFEND_PENETRATE, amount);

                p.registerLateTask(() => {
                    p.attack(target, {
                        onHit(attacker, victim) {
                            if(victim instanceof LivingEntity) 
                                victim.addEffect(new Effect(EffectType.POISON, skill.getValue(p, 'poisonLevel'), skill.getValue(p, 'poisonTime'), p));
                        },
                    });
                });

                skill.prof += skill.getValue(p, 'profAddition');
                skill.finish(p);
            },
        },
        {
            name: '슬래시',
            isPassive: false,
            maxLevel: 16,
            checkRealizeCondition: p => p.hadClass('전사'),
            calcValues: (skill, p) => ({ 
                manaCost: skill.level * 11 + 30, //mana cost
                attackIncrease: skill.level * 1.5 + 30, //attack increase
                effectLevel: Math.floor(skill.level * 2 + 1), //effect level
                effectTime: 5, //effect time
                profAddition: Math.max(3.1 - skill.level * .1, .5), //prof addition
            }),
            getCooldown: (skill, p) => Math.max(5, 10 - skill.level * 0.15),
            getCostMessage: (skill, p) => skill.getValue(p, 'manaCost') + '마나',
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= skill.getValue(p, 'manaCost'),
            takeCost: (skill, p) => p.mana -= skill.getValue(p, 'manaCost'),
            getConditionMessage: (skill, p) => '목표물이 있고, 장검, 대검 또는 도끼를 들었을 때, 슬래시! 라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.currentTarget !== null && 
                p.tickMessage === '슬래시!' && ['장검', '대검', '도끼'].includes(p.slot.hand?.type ?? ''),
            getDescription: (skill, p) => ComponentBuilder.empty()/*`${AttributeType.ATTACK.displayName}이 ` + 
                `${Utils.numberText(skill.getValue(p, 'attackIncrease')) + '%'}만큼 증가한 채로 목표를 공격합니다.\n` +
                `공격받은 대상에게 ${Effect.getDescriptionMessage(EffectType.BLOOD, skill.getValue(p, 'effectLevel'))}, ` + 
                `${Effect.getDescriptionMessage(EffectType.SLOWNESS, skill.getValue(p, 'effectLevel'))} ` + 
                `효과를 ${skill.getValue(p, 'effectTime')}초간 부여합니다.`*/,
            onUpdate(skill, p) {
                if(!p.currentTarget || !p.currentTarget.isAlive) {
                    skill.finish(p);
                    return;
                }
                if(!p.isAttackEnded) return;

                let amount = skill.getValue(p, 'attackIncrease') / 100 + 1;
                let target = p.currentTarget;

                p.attribute.multiplyValue(AttributeType.ATTACK, amount);

                p.registerLateTask(() => {
                    p.attack(target, {
                        onHit(attacker, victim) {
                            if (victim instanceof LivingEntity) {
                                [EffectType.BLOOD, EffectType.SLOWNESS]
                                    .forEach(type =>
                                        victim.addEffect(new Effect(type, skill.getValue(p, 'effectLevel'), skill.getValue(p, 'effectTime'), p)));
                            }
                        },
                    });
                });

                skill.prof += skill.getValue(p, 'profAddition');
                skill.finish(p);
            },
        },
        {
            name: '크로스 슬래시',
            isPassive: false,
            maxLevel: 16,
            checkRealizeCondition: p => p.hasSkill('슬래시', skill => skill.level >= skill.maxLevel),
            calcValues: (skill, p) => ({ 
                manaCost: skill.level * 12 + 70, //mana cost
                attackIncrease: skill.level * 0.6 + 20, //attack increase
                effectLevel: Math.floor(skill.level * 1.5 + 10), //effect level
                effectTime: 4, //effect time
                profAddition: Math.max(2.1 - skill.level * .1, .1), //prof addition
            }),
            getCooldown: (skill, p) => Math.max(5, 20 - skill.level * 0.25),
            getCostMessage: (skill, p) => skill.getValue(p, 'manaCost') + '마나',
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= skill.getValue(p, 'manaCost'),
            takeCost: (skill, p) => p.mana -= skill.getValue(p, 'manaCost'),
            getConditionMessage: (skill, p) => '목표물이 있고, 장검, 대검 또는 도끼를 들었을 때, 크로스 슬래시! 라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.currentTarget !== null && 
                p.tickMessage === '크로스 슬래시!' && ['장검', '대검', '도끼'].includes(p.slot.hand?.type ?? ''),
            getDescription: (skill, p) => ComponentBuilder.empty()/*`${AttributeType.ATTACK.displayName}이 ` + 
                `${Utils.numberText(skill.getValue(p, 'attackIncrease')) + '%'}만큼 증가한 채로 목표를 2회 공격합니다.\n` +
                `공격받은 대상에게 ${Effect.getDescriptionMessage(EffectType.BLOOD, skill.getValue(p, 'effectLevel'))}, ` + 
                `${Effect.getDescriptionMessage(EffectType.SLOWNESS, skill.getValue(p, 'effectLevel'))} ` + 
                `효과를 ${skill.getValue(p, 'effectTime')}초간 부여합니다.`*/,
            onUpdate(skill, p) {
                if(!p.currentTarget || !p.currentTarget.isAlive) {
                    skill.finish(p);
                    return;
                }
                if(!p.isAttackEnded) return;

                let amount = skill.getValue(p, 'attackIncrease') / 100 + 1;
                let target = p.currentTarget;
                const count = 2;

                p.attribute.multiplyValue(AttributeType.ATTACK, amount);

                p.registerLateTask(() => {
                    for(let i = 0; i < count; i++) {
                        p.attack(target, {
                            onHit(attacker, victim) {
                                if (victim instanceof LivingEntity) {
                                    [EffectType.BLOOD, EffectType.SLOWNESS]
                                        .forEach(type =>
                                            victim.addEffect(new Effect(type, skill.getValue(p, 'effectLevel'), skill.getValue(p, 'effectTime'), p)));
                                }
                            },
                        });
                        if(i < count - 1) p.latestAttack = 0;
                    }
                });

                skill.prof += skill.getValue(p, 'profAddition');
                skill.finish(p);
            },
        },
        {
            name: '난도',
            isPassive: false,
            maxLevel: 15,
            checkRealizeCondition: p => p.hadClass('나이트 세이드'),
            calcValues: (skill, p) => ({ 
                manaCost: skill.level * 22 + 70, //mana cost
                minEffectLevel: 10, //effect min level
                maxEffectLevel: 10 + Math.floor(skill.level * 0.7 * 3), //effect max level
                effectTime: 10, //effect time
                profAddition: Math.max(4.1 - skill.level * .1, .1), //prof addition
            }),
            getCooldown: (skill, p) => Math.max(5, 50 - skill.level * 0.55),
            getCostMessage: (skill, p) => skill.getValue(p, 'manaCost') + '마나',
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= skill.getValue(p, 'manaCost'),
            takeCost: (skill, p) => p.mana -= skill.getValue(p, 'manaCost'),
            getConditionMessage: (skill, p) => '목표물이 있고, 단검을 들었을 때, 난도! 라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.currentTarget !== null && 
                p.tickMessage === '난도!' && ['단검'].includes(p.slot.hand?.type ?? ''),
            getDescription: (skill, p) => ComponentBuilder.empty()/*`목표물을 빠르게 3번 타격합니다. 타격에 성공한 횟수만큼 중첩이 쌓이고, ` + 
                `중첩 개수에 비례해서 최소 ${Effect.getDescriptionMessage(EffectType.BLOOD, skill.getValue(p, 'minEffectLevel'))} ~ 최대 ` + 
                `${Effect.getDescriptionMessage(EffectType.BLOOD, skill.getValue(p, 'maxEffectLevel'))}의 효과를 ${skill.getValue(p, 'effectTime')}초간 부여하고 큰 고정 피해를 입힙니다.`*/,
            onUpdate(skill, p) {
                if(!p.currentTarget || !p.currentTarget.isAlive) {
                    skill.finish(p);
                    return;
                }
                if(!p.isAttackEnded) return;

                let target = p.currentTarget;
                const maxCount = 3;

                p.registerLateTask(() => {
                    let count = 0;
                    for(let i = 0; i < maxCount; i++) {
                        p.attack(target, {
                            onHit(attacker, victim) {
                                count++;
                            },
                        });
                        if(i < maxCount - 1) p.latestAttack = 0;
                    }
                    
                    let level = skill.getValue(p, 'minEffectLevel') + (skill.getValue(p, 'maxEffectLevel') - skill.getValue(p, 'minEffectLevel')) * (count / maxCount);
                    let damage = p.attribute.getValue(AttributeType.ATTACK) * (1 + skill.level * 0.04 + count * 0.1);

                    target.damage(damage, p);
                    if(target instanceof LivingEntity) target.addEffect(new Effect(EffectType.BLOOD, level, skill.getValue(p, 'effectTime'), p));

                    const sendTargets = [p];
                    if(target instanceof Player) sendTargets.push(target);
                    Player.sendGroupMessage(sendTargets, ComponentBuilder.embed([
                        ComponentBuilder.text(`[ 푸슉! 출혈이 터졌습니다..! (-${damage.toFixed(1)}) ]\n`),
                        ComponentBuilder.progressBar(target.life, target.maxLife, 'percent', 'red')
                    ]));
                });

                skill.prof += skill.getValue(p, 'profAddition');
                skill.finish(p);
            },
        },
        {
            name: '암격',
            isPassive: false,
            maxLevel: 16,
            checkRealizeCondition: p => p.hadClass('암살자'),
            calcValues: (skill, p) => ({
                attackAddition: p.attribute.getValue(AttributeType.MOVE_SPEED) * (skill.level * 0.8 + 10) + 2500,
                criticalChanceAddition: 20,
                slownessLevel: Math.floor(skill.level * 1.3 + 6),
                slownessTime: 3,
                profAddition: Math.max(0.1, 5.1 - skill.level * 0.2)
            }),
            getCooldown: (skill, p) => Math.max(5, 25 - skill.level * 0.35),
            getCostMessage: (skill, p) => skill.getValue(p, 'manaCost') + '마나',
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= skill.getValue(p, 'manaCost'),
            takeCost: (skill, p) => p.mana -= skill.getValue(p, 'manaCost'),
            getConditionMessage: (skill, p) => '목표물이 있고, 단검을 들었을 때, 암격! 라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.currentTarget !== null && 
                p.tickMessage === '암격!' && ['단검'].includes(p.slot.hand?.type ?? ''),
            getDescription: (skill, p) => 
                ComponentBuilder.empty()/*`${Utils.asSubjective(AttributeType.ATTACK.displayName)} ` + 
                `${Utils.numberText(skill.getValue(p, 'attackAddition'))} ` + 
                `${Utils.coloredText('lightgray', `(${AttributeType.MOVE_SPEED.displayName} 비례)`)} 만큼 추가되고, ` +
                `${Utils.asSubjective(AttributeType.CRITICAL_CHANCE.displayName)} ` + 
                `${Utils.numberText(skill.getValue(p, 'criticalChanceAddition'))}%p 증가된 채로 목표물을 공격합니다.\n` +
                `공격이 적중하면 ${Effect.getDescriptionMessage(EffectType.SLOWNESS, skill.getValue(p, 'slownessLevel'))} 효과를 ` + 
                `${Utils.toFixed(skill.getValue(p, 'slownessTime'), 1)}초 동안 부여합니다.`*/,
            onUpdate(skill, p) {
                if(!p.currentTarget || !p.currentTarget.isAlive) {
                    skill.finish(p);
                    return;
                }
                if(!p.isAttackEnded) return;

                let target = p.currentTarget;
                p.attribute.addValue(AttributeType.ATTACK, skill.getValue(p, 'attackAddition'));
                p.attribute.addValue(AttributeType.CRITICAL_CHANCE, skill.getValue(p, 'criticalChanceAddition'));

                p.registerLateTask(() => {
                    p.attack(target, {
                        onHit(attacker, victim) {
                            if(victim instanceof LivingEntity)
                                victim.addEffect(new Effect(EffectType.SLOWNESS, skill.getValue(p, 'slownessLevel'), skill.getValue(p, 'slownessLevel')));
                        },
                    });
                });

                skill.prof += skill.getValue(p, 'profAddition');
                skill.finish(p);
            },
        },
        {
            name: '심판의 불꽃',
            isPassive: false,
            maxLevel: 20,
            checkRealizeCondition: p => p.hadClass('성기사'),
            calcValues: (skill, p) => ({
                effectLevel: 8 + skill.level, //effect level
                magicAttack: p.life * 0.07 + 500, //magic attack
                effectTime: 15, //effect time
                conditionalAttackIncrease: 1.5, //base attack increase
                profAddition: Math.max(0.3, 4.1 - skill.level * 0.15), //prof addition
                manaCost: skill.level * 11 + 60 //mana cost
            }),
            getCooldown: (skill, p) => Math.max(5, 15 - skill.level * 0.5),
            getCostMessage: (skill, p) => skill.getValue(p, 'manaCost') + '마나',
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= skill.getValue(p, 'manaCost'),
            takeCost: (skill, p) => p.mana -= skill.getValue(p, 'manaCost'),
            getConditionMessage: (skill, p) => '목표물이 있을 때, 심판의 불꽃! 이라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.currentTarget !== null && 
                p.tickMessage === '심판의 불꽃!',
            getDescription: (skill, p) => 
               ComponentBuilder.empty()/* `목표물을 성스러운 불꽃으로 심판하여 ${Effect.getDescriptionMessage(EffectType.FIRE, skill.getValue(p, 'effectLevel'))} ` + 
                `효과를 ${skill.getValue(p, 'effectTime')}초동안 부여하고, ${Utils.magicDamageText(skill.getValue(p, 'magicAttack'))}의 마법 피해를 입힙니다.` +
                `${Utils.coloredText('lightgray', '(현재 체력 비례)')}\n` + 
                `목표물이 언데드 또는 마계 타입일 시, 피해가 ${skill.getValue(p, 'conditionalAttackIncrease')}배 증가합니다.`*/,
            onStart(skill, p) {
                const target = p.currentTarget;
                if(!target) return;
                const projectile = new Projectile({
                    name: '성스러운 불꽃',
                    owner: p,
                    attributes: {
                        magicAttack: skill.getValue(p, 'magicAttack')
                    }
                });
                projectile.attack(target, {
                    isMagicAttack: true,
                    absoluteHit: true,
                    additionalMessage:ComponentBuilder.text('성스러운 불꽃이 당신을 심판합니다!', { color: 'yellow' })
                });
                if(target instanceof LivingEntity) 
                    target.addEffect(new Effect(EffectType.FIRE, skill.getValue(p, 'effectLevel'), skill.getValue(p, 'effectTime')));
                skill.prof += skill.getValue(p, 'profAddition');
            },
        },
        {
            name: '광기',
            isPassive: false,
            maxLevel: 20,
            checkRealizeCondition: p => p.hadClass('광전사'),
            calcValues: (skill, p) => ({
                lifeCost: 25 + skill.level * 0.3,
                attackIncrease: 15 + skill.level * 0.6,
                attackSpeedIncrease: 30 + skill.level * 0.4,
                profAddition: Math.max(1, 7 - skill.level * 0.2)
            }),
            getCooldown: (skill, p) => Math.max(5, 15 - skill.level * 0.5),
            getCostMessage: (skill, p) => `현재 생명력의 ${skill.getValue(p, 'lifeCost').toFixed(0)}%`,
            getCostFailMessage: (skill, p) => '생명력이 부족합니다.',
            canTakeCost: (skill, p) => p.life >= p.maxLife * skill.getValue(p, 'lifeCost') / 100,
            takeCost: (skill, p) => p.life -= p.maxLife * skill.getValue(p, 'lifeCost') / 100,
            getConditionMessage: (skill, p) => '광기! 라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.tickMessage === '광기!',
            getDescription: (skill, p) => ComponentBuilder.empty()/*
                `1분 동안 ${Utils.asSubjective(AttributeType.ATTACK.displayName)} ${Utils.numberText(skill.getValue(p, 'attackIncrease'))}%, ` + 
                `${Utils.asSubjective(AttributeType.ATTACK_SPEED.displayName)} ${Utils.numberText(skill.getValue(p, 'attackSpeedIncrease'))}% 증가합니다.`*/,
            onStart(skill, p) {
                p.sendMessage(ComponentBuilder.embed([
                    ComponentBuilder.text('[ 전투에 대한 광기로 인해 일시적으로 각성합니다! ]')
                ], 'red'));
            },
            onEarlyUpdate(skill, p) {
                p.attribute.multiplyValue(AttributeType.ATTACK, skill.getValue(p, 'attackIncrease') / 100 + 1);
                p.attribute.multiplyValue(AttributeType.ATTACK_SPEED, skill.getValue(p, 'attackSpeedIncrease') / 100 + 1);
                if(Date.now() - skill.latestStart > 1000 * 60) {
                    p.sendRawMessage('[ 각성이 풀렸습니다.. ]');
                    skill.prof += skill.getValue(p, 'profAddition');
                    skill.finish(p);
                }
            },
        },
        {
            name: '사격 준비',
            isPassive: false,
            maxLevel: 20,
            checkRealizeCondition: p => p.hadClass('래피딕 아처'),
            calcValues: (skill, p) => ({
                manaCost: 25 + skill.level * 0.3,
                defendPenetrateIncrease: 5000 + skill.level * 500,
                rangeAttackIncrease: 10 + skill.level * 0.8,
                profAddition: Math.max(1, 7 - skill.level * 0.2)
            }),
            getCooldown: (skill, p) => Math.max(5, 15 - skill.level * 0.5),
            getCostMessage: (skill, p) => `최대 마나의 ${skill.getValue(p, 'manaCost').toFixed(0)}%`,
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= p.maxMana * skill.getValue(p, 'manaCost') / 100,
            takeCost: (skill, p) => p.mana -= p.maxMana * skill.getValue(p, 'manaCost') / 100,
            getConditionMessage: (skill, p) => '사격 준비! 라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.tickMessage === '사격 준비!',
            getDescription: (skill, p) => ComponentBuilder.empty()/*Utils.formatStr(
                '3초 동안의 정신 집중 후, 1분 동안 {0} {1}, {2} {3}% 만큼 증가합니다.\n' +
                '정신 집중 동안 말을 하면 정신 집중이 풀리고 재사용 대기시간의 50%를 돌려받습니다.',
                Utils.asSubjective(AttributeType.DEFEND_PENETRATE.displayName),
                Utils.numberText(skill.getValue(p, 'defendPenetrateIncrease')),
                Utils.asSubjective(AttributeType.RANGE_ATTACK.displayName),
                Utils.numberText(skill.getValue(p, 'rangeAttackIncrease'))
            )*/,
            onStart(skill, p) {
                p.sendMessage(ComponentBuilder.embed([
                    ComponentBuilder.text('[ 정신 집중 중... ]')
                ], 'lightgray'));
                skill.extras.waitTimer = 3;
                skill.extras.timer = 60;
            },
            onEarlyUpdate(skill, p) {
                if (skill.extras.waitTimer > 0) {
                    if((skill.extras.waitTimer -= Time.deltaTime) <= 0) {
                        p.sendMessage(ComponentBuilder.embed([
                            ComponentBuilder.text('[ 사격 준비! ]')
                        ], 'orange'));
                        skill.prof += skill.getValue(p, 'profAddition');
                    }
                }
                else if(skill.extras.timer > 0) {
                    p.attribute.addValue(AttributeType.DEFEND_PENETRATE, skill.getValue(p, 'defendPenetrateIncrease'));
                    p.attribute.multiplyValue(AttributeType.RANGE_ATTACK, skill.getValue(p, 'rangeAttackIncrease') / 100 + 1);
                    skill.extras.timer -= Time.deltaTime;
                }
                else {
                    p.sendRawMessage('[ 사격 준비 지속시간이 끝났습니다. ]');
                    skill.finish(p);
                }
            },
        },
        {
            name: '그림자 쇄도',
            isPassive: false,
            maxLevel: 15,
            checkRealizeCondition: p => p.hadClass('나이트 세이드'),
            getCooldown: (skill, p) => Math.max(5, 70 - skill.level * 1.85),
            calcValues: (skill, p) => ({ 
                manaCost: skill.level * 42 + 200, //mana cost
                attackSpeedIncrease: 29 + skill.level, //attack speed increase
                maxStunTime: 3.9 + skill.level * 0.3, //stun max time
                maxHealDecreaseTime: 10, //heal decrease time
                healDecreaseLevel: 10, //heal decrease level
                profAddtion: Math.max(6.1 - skill.level * .2, .5), //prof addition
            }),
            getCostMessage: (skill, p) => skill.getValue(p, 'manaCost') + '마나',
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= skill.getValue(p, 'manaCost'),
            takeCost: (skill, p) => p.mana -= skill.getValue(p, 'manaCost'),
            getConditionMessage: (skill, p) => '단검을 들었을 때, 그림자 쇄도! 라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.tickMessage === '그림자 쇄도!' && ['단검'].includes(p.slot.hand?.type ?? ''),
            getDescription: (skill, p) => ComponentBuilder.empty()/*`5초 동안 ${Utils.asSubjective(AttributeType.ATTACK_SPEED.displayName)} ${skill.getValue(p, 'attackSpeedIncrease').toFixed(1)}% 빨라지며,\n` +
                `그동안 대상을 공격한 횟수에 비례해서 최대 ${skill.getValue(p, 'maxStunTime').toFixed(1)}초의 ${Effect.getDescriptionMessage(EffectType.STUN, 1)} 효과와 ` + 
                `최대 ${skill.getValue(p, 'maxHealDecreaseTime').toFixed(1)}초의 ${
                    Effect.getDescriptionMessage(EffectType.DECREASE_HEAL_EFFICIENCY, skill.getValue(p, 'healDecreaseLevel'))} 효과가 마지막 대상에게 부여됩니다.`*/,
            onStart(skill, p) {
                p.sendMessage(ComponentBuilder.embed([
                    ComponentBuilder.text('[ 주위에서 그림자가 휘몰아친다..! ]')
                ], '#555599'));
            },
            onUpdate(skill, p) {
                if(typeof skill.extras.count !== 'number')
                    skill.extras.count = 0;

                p.registerTrigger(new Trigger({
                    onHit(p, victim) {
                        skill.extras.count++;
                    },
                }));

                p.attribute.multiplyValue(AttributeType.ATTACK_SPEED, skill.getValue(p, 'attackSpeedIncrease') / 100 + 1);

                if(Date.now() - skill.latestStart >= 1000 * 5) {
                    let maxStunTime = skill.getValue(p, 'maxStunTime');
                    let healDecreaseLevel = skill.getValue(p, 'healDecreaseLevel');
                    let maxHealDecreaseTime = skill.getValue(p, 'maxHealDecreaseTime');

                    let stunTime = Math.floor(Math.min(maxStunTime, maxStunTime * skill.extras.count / 8 + 1));
                    let healDecreaseTime = Math.floor(Math.min(maxHealDecreaseTime, maxHealDecreaseTime * skill.extras.count / 8 + 1));

                    if (p.currentTarget instanceof LivingEntity) {
                        p.currentTarget.addEffect(new Effect(EffectType.STUN, 1, stunTime, p));
                        p.currentTarget.addEffect(new Effect(EffectType.DECREASE_HEAL_EFFICIENCY, healDecreaseLevel, healDecreaseTime, p));

                        Player.sendGroupMessage(p.currentTarget instanceof Player ? [p, p.currentTarget] : [p],
                            ComponentBuilder.embed([
                                ComponentBuilder.text(`[ 그림자 쇄도! ]\n` +
                                    `${stunTime.toFixed(1)}초의 `),
                                Effect.getDescriptionMessage(EffectType.STUN, 1),
                                ComponentBuilder.text(` 효과와 ` +
                                    `${healDecreaseTime.toFixed(1)}초의 `),
                                Effect.getDescriptionMessage(EffectType.DECREASE_HEAL_EFFICIENCY, healDecreaseLevel),
                                ComponentBuilder.text(` 효과가 부여됩니다.`)
                            ], '#555599'));
                    }
                    else {
                        p.sendRawMessage('[ 그림자가 사라졌다.. ]');
                    }

                    skill.prof += skill.getValue(p, 'profAddition');
                    skill.finish(p);
                }
            },
        },
        {
            name: '단검 쇄도',
            isPassive: false,
            maxLevel: 10,
            checkRealizeCondition: p => p.hadClass('나이트 세이드') && 
                p.hasSkill('단검 투척', s => s.level >= s.maxLevel) &&
                p.hasSkill('난도', s => s.level >= s.maxLevel),
            calcValues: (skill, p) => ({ 
                manaCost: skill.level * 32 + 400, //mana cost
                count: Math.floor(skill.level * 0.3 + 4), //count
                speed: 2500 + skill.level * 250, //speed
                profAddition: Math.max(6.3 - skill.level * .45, .1), //prof addition
            }),
            getCooldown: (skill, p) => Math.max(5, 100 - skill.level * 4.9),
            getCostMessage: (skill, p) => skill.getValue(p, 'manaCost') + '마나',
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= skill.getValue(p, 'manaCost'),
            takeCost: (skill, p) => p.mana -= skill.getValue(p, 'manaCost'),
            getConditionMessage: (skill, p) => '목표물이 있고, 단검을 들었을 때, 단검 쇄도! 라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.tickMessage === '단검 쇄도!' && ['단검'].includes(p.slot.hand?.type ?? ''),
            getDescription: (skill, p) => ComponentBuilder.empty()/*`들고 있는 단검과 능력치가 동일한 단검을 ${skill.getValue(p, 'count')}개 소환하여 ` + 
            `${Utils.coloredText('orange', skill.getValue(p, 'speed').toFixed(1))}의 속도로 목표물에게 날립니다.\n` + 
            `단검의 공격력은 ${AttributeType.MOVE_SPEED.displayName}에 비례해서 증가합니다.`*/,
            onUpdate(skill, p) {
                if(!p.currentTarget || !p.currentTarget.isAlive) {
                    skill.finish(p);
                    return;
                }
                if(!p.isAttackEnded || !p.slot.hand) return;

                const count = skill.getValue(p, 'count');
                const speed = skill.getValue(p, 'speed');
                const target = p.currentTarget;
                const item = p.slot.hand;
                const addModifiers: AttributeModifier[] = [];
                const multiplyModifiers: AttributeModifier[] = [];
                const attributes: { [key: string]: number } = {};

                item.attributeModifiers.forEach(modifier => {
                    if(modifier.isMultiplier) multiplyModifiers.push(modifier);
                    else addModifiers.push(modifier);
                });

                addModifiers.forEach(modifier => {
                    if(!(modifier.type.name in attributes)) attributes[modifier.type.name] = 0;
                    attributes[modifier.type.name] += modifier.value;
                });

                multiplyModifiers.forEach(modifier => {
                    if(modifier.type.name in attributes)
                        attributes[modifier.type.name] *= modifier.value;
                });
                
                for(let i = 1; i <= count; i++) {
                    const projectile = new Projectile({
                        name: `${item.getName()} (${i})`,
                        attributes,
                        owner: p
                    });
                    projectile.attribute.setDefault(AttributeType.ATTACK, 
                        projectile.attribute.getDefault(AttributeType.ATTACK) * (1 + p.attribute.getValue(AttributeType.MOVE_SPEED) / 1000));
                    projectile.attribute.setDefault(AttributeType.MOVE_SPEED, speed);
                    projectile.attack(target);
                }

                skill.prof += skill.getValue(p, 'profAddition');
                skill.finish(p);
            },
        },
        {
            name: '프레싱',
            isPassive: false,
            maxLevel: 20,
            checkRealizeCondition: p => p.hadClass('광전사') && p.hasSkill('오버마스팅', skill => skill.level >= skill.maxLevel),
            calcValues: (skill, p) => ({
                manaCost: 200 + skill.level * 180,
                bindTime: 3,
                lifeAbsorb: 8 + skill.level,
                profAddition: Math.max(1, 7 - skill.level * 0.2)
            }),
            getCooldown: (skill, p) => Math.max(5, 15 - skill.level * 0.5),
            getCostMessage: (skill, p) => `${skill.getValue(p, 'manaCost')}마나`,
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= skill.getValue(p, 'manaCost'),
            takeCost: (skill, p) => p.mana -= skill.getValue(p, 'manaCost'),
            getConditionMessage: (skill, p) => '목표물이 있을 때, 프레싱! 라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.tickMessage === '프레싱!' && p.currentTarget !== null,
            getDescription: (skill, p) => ComponentBuilder.empty()/*Utils.formatStr(
                '목표물을 {0}초 동안 속박합니다. 속박이 지속 되는 매 초 마다 자신의 현재 생명력의 {1}% 만큼 상대에게서 탈취합니다. ',
                skill.getValue(p, 'bindTime').toFixed(1),
                skill.getValue(p, 'lifeAbsorb').toFixed(1)
            )*/,
            onStart(skill, p) {
                skill.extras.timer = skill.getValue(p, 'bindTime');
                skill.extras.absorbTimer = 0;
                skill.prof += skill.getValue(p, 'profAddition');
            },
            onEarlyUpdate(skill, p) {
                const target = p.currentTarget;
                if(!target) {
                    skill.finish(p);
                }
                else if(skill.extras.timer > 0) {
                    skill.extras.absorbTimer -= Time.deltaTime;
                    if(skill.extras.absorbTimer <= 0) {
                        skill.extras.absorbTimer = 1;
                        const amount = p.life * skill.getValue(p, 'lifeAbsorb') / 100;
                        target.damage(amount, p);
                        const healed = p.heal(amount, p);
                        p.sendMessage(ComponentBuilder.message([
                            ComponentBuilder.text(`[ 생명력을 탈취했다! `),
                            ComponentBuilder.text(`(+${healed.toFixed(1)})`),
                            ComponentBuilder.text(` ]`)
                        ]));
                    }
                    skill.extras.timer -= Time.deltaTime;
                }
                else skill.finish(p);
            },
        },
    ];

    static getSkillPreset(name: string) {
        return cache[name] ?? (cache[name] = SkillPreset.list.find(preset => preset.name === name));
    }
}