import { MessageComponent, SkillPresetObject } from "../../types";
import { AttributeModifier, AttributeType, ChatManager, ChatRoomManager, Effect, EffectType, Entity, Item, ItemStack, LivingEntity, MetalForge, MetalForgeForm, MineralSmelting, Monster, MonsterType, Option, Player, Projectile, RegionType, SpellCombination, StatType, Time, Trigger, Utils, World } from "../Internal";
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
                ComponentBuilder.text(`${AttributeType.ATTACK.asWith()} ${AttributeType.RANGE_ATTACK.asSubjective()} `),
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
            getDescription: (skill, p) => ComponentBuilder.message([
                ComponentBuilder.text(`장검 종류 아이템을 들었을 때, ` + 
                    `${AttributeType.DEFEND_PENETRATE.asWith()} ${AttributeType.MOVE_SPEED.asSubjective()} 각각 `),
                ComponentBuilder.text(skill.getValue(p, 'penetrate').toFixed(1), { color: Utils.NUMBER_COLOR }),
                ComponentBuilder.text(', '),
                ComponentBuilder.text(skill.getValue(p, 'moveSpeed').toFixed(1), { color: Utils.NUMBER_COLOR }),
                ComponentBuilder.text('만큼 증가합니다.')
            ]),
            onUpdate(skill, p) {
                if(p.isAlive && p.slot.hand?.type === '장검') {
                    p.attribute.addValue(AttributeType.DEFEND_PENETRATE, skill.getValue(p, 'penetrate'));
                    p.attribute.addValue(AttributeType.MOVE_SPEED, skill.getValue(p, 'moveSpeed'));
                }
            },
        },
        {
            name: '거신 파괴자',
            isPassive: true,
            maxLevel: 1,
            checkRealizeCondition: p => p.hadClass('전사') && p.level > 500,
            calcValues: (skill, p) => ({ 
                steelDef: 50,
                lifeAddition: 25800 + p.attribute.getValue(AttributeType.ATTACK) * 6.7
            }),
            getDescription: (skill, p) => ComponentBuilder.texts([
                `전투하고 있는 상대의 ${AttributeType.DEFEND.asObjective()} `,
                ComponentBuilder.text(skill.getValue(p, 'steelDef').toFixed(1) + '%', { color: Utils.NUMBER_COLOR }),
                `만큼 빼앗습니다. 또한 최대 생명력이 `,
                ComponentBuilder.text(skill.getValue(p, 'lifeAddition').toFixed(1), { color: Utils.NUMBER_COLOR }),
                `만큼 증가합니다. `,
                ComponentBuilder.text(`(${AttributeType.ATTACK.displayName} 비례)`, { color: 'lightgray' })
            ]),
            onUpdate(skill, p) {
                if(p.currentTarget?.latestAbuser === p || p.currentTarget?.latestAttackedEntity === p) {
                    let originDef = p.currentTarget.attribute.getValue(AttributeType.DEFEND);
                    let steel = originDef * skill.getValue(p, 'steelDef') / 100;
                    p.currentTarget.attribute.addValue(AttributeType.DEFEND, -steel);
                    p.attribute.addValue(AttributeType.DEFEND, steel);
                }
                p.attribute.addValue(AttributeType.MAX_LIFE, skill.getValue(p, 'lifeAddition'));
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
                decreaseDefendLevel: Math.floor(skill.level * 0.5 + 5), //poison level
                effectTime: 20, //poison time
                profAddition: Math.max(6.1 - skill.level * .25, .25), //prof addition
            }),
            getCooldown: (skill, p) => Math.max(5, 22 - skill.level * 0.5),
            getCostMessage: (skill, p) => skill.getValue(p, 'manaCost') + '마나',
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= skill.getValue(p, 'manaCost'),
            takeCost: (skill, p) => p.mana -= skill.getValue(p, 'manaCost'),
            getConditionMessage: (skill, p) => '목표물이 있을 때, 독살! 이라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.currentTarget !== null && p.tickMessage === '독살!',
            getDescription: (skill, p) => ComponentBuilder.texts([
                ComponentBuilder.text(`${AttributeType.DEFEND_PENETRATE.asSubjective()} `),
                ComponentBuilder.text(skill.getValue(p, 'penetrateIncrease').toFixed(1) + '%', 
                    { color: Utils.NUMBER_COLOR }),
                '만큼 증가한 채로 목표를 공격합니다.\n' +
                    '공격받은 대상에게 ',
                Effect.getDescriptionMessage(EffectType.DECREASE_DEFEND, skill.getValue(p, 'decreaseDefendLevel')),
                `효과와 `,
                Effect.getDescriptionMessage(EffectType.POISON, skill.getValue(p, 'poisonLevel')),
                ` 효과를 ${skill.getValue(p, 'effectTime').toFixed(1)}초간 부여합니다.`
            ]),
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
                            if(victim instanceof LivingEntity) {
                                victim.addEffect(new Effect(EffectType.POISON, 
                                    skill.getValue(p, 'poisonLevel'), skill.getValue(p, 'effectTime'), p));   
                                victim.addEffect(new Effect(EffectType.DECREASE_DEFEND, 
                                    skill.getValue(p, 'decreaseDefendLevel'), skill.getValue(p, 'effectTime'), p));
                            }
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
            getDescription: (skill, p) => ComponentBuilder.message([
                ComponentBuilder.text(`${AttributeType.ATTACK.asSubjective()} `),
                ComponentBuilder.text(skill.getValue(p, 'attackIncrease').toFixed(1) + '%', { color: Utils.PHYSICAL_COLOR }),
                ComponentBuilder.text(`만큼 증가한 채로 목표를 공격합니다.\n` + 
                    `공격받은 대상에게 `),
                Effect.getDescriptionMessage(EffectType.BLOOD, skill.getValue(p, 'effectLevel')),
                ComponentBuilder.text(', '),
                Effect.getDescriptionMessage(EffectType.SLOWNESS, skill.getValue(p, 'effectLevel')),
                ComponentBuilder.text(` 효과를 ${skill.getValue(p, 'effectTime').toFixed(1)}초간 부여합니다.`)
            ]),
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
            getDescription: (skill, p) => ComponentBuilder.message([
                ComponentBuilder.text(`${AttributeType.ATTACK.asSubjective()} `),
                ComponentBuilder.text(skill.getValue(p, 'attackIncrease').toFixed(1) + '%', { color: Utils.PHYSICAL_COLOR }),
                ComponentBuilder.text(`만큼 증가한 채로 목표를 2회 공격합니다.\n` +
                    `공격받은 대상에게 `),
                Effect.getDescriptionMessage(EffectType.BLOOD, skill.getValue(p, 'effectLevel')),
                ComponentBuilder.text(', '),
                Effect.getDescriptionMessage(EffectType.SLOWNESS, skill.getValue(p, 'effectLevel')),
                ComponentBuilder.text(` 효과를 ${skill.getValue(p, 'effectTime').toFixed(1)}초간 부여합니다.`)
            ]),
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
                defendPenetrateIncrease: 3400 + skill.level * 543,
                effectTime: 10, //effect time
                profAddition: Math.max(4.1 - skill.level * .1, .1), //prof addition
            }),
            getCooldown: (skill, p) => Math.max(5, 40 - skill.level * 0.55),
            getCostMessage: (skill, p) => skill.getValue(p, 'manaCost') + '마나',
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= skill.getValue(p, 'manaCost'),
            takeCost: (skill, p) => p.mana -= skill.getValue(p, 'manaCost'),
            getConditionMessage: (skill, p) => '목표물이 있고, 단검을 들었을 때, 난도! 라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.currentTarget !== null && 
                p.tickMessage === '난도!' && ['단검'].includes(p.slot.hand?.type ?? ''),
            getDescription: (skill, p) => ComponentBuilder.texts([
                `${AttributeType.DEFEND_PENETRATE.asSubjective()} `,
                ComponentBuilder.text(skill.getValue(p, 'defendPenetrateIncrease').toFixed(1), { color: Utils.NUMBER_COLOR }),
                ` 만큼 증가된 채로 목표물을 빠르게 3번 타격합니다. 타격에 성공한 횟수만큼 중첩이 쌓이고, \n`,
                `중첩 개수에 비례해서 최소 `,
                Effect.getDescriptionMessage(EffectType.BLOOD, skill.getValue(p, 'minEffectLevel')),
                ' ~ 최대 ',
                Effect.getDescriptionMessage(EffectType.BLOOD, skill.getValue(p, 'maxEffectLevel')),
                `의 효과를 ${skill.getValue(p, 'effectTime').toFixed(1)}초간 부여하고 큰 고정 피해를 입힙니다.`
            ]),
            onUpdate(skill, p) {
                if(!p.currentTarget || !p.currentTarget.isAlive) {
                    skill.finish(p);
                    return;
                }
                if(!p.isAttackEnded) return;

                let target = p.currentTarget;
                const maxCount = 3;

                p.attribute.addValue(AttributeType.DEFEND_PENETRATE, skill.getValue(p, 'defendPenetrateIncrease'));

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
                    let damage = p.attribute.getValue(AttributeType.ATTACK) * (1 + skill.level * 0.06 + count * 0.2);

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
            maxLevel: 17,
            checkRealizeCondition: p => p.hadClass('암살자'),
            calcValues: (skill, p) => ({
                attackAddition: p.attribute.getValue(AttributeType.MOVE_SPEED) * 
                (skill.level * 0.1 + 15) + skill.level * 5000,
                criticalChanceAddition: 25,
                slownessLevel: Math.floor(skill.level * 2.3 + 6),
                slownessTime: 5,
                profAddition: Math.max(0.1, 5.1 - skill.level * 0.2)
            }),
            getCooldown: (skill, p) => Math.max(5, 30 - skill.level * 0.35),
            getConditionMessage: (skill, p) => '목표물이 있고, 단검을 들었을 때, 암격! 라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.currentTarget !== null && 
                p.tickMessage === '암격!' && ['단검'].includes(p.slot.hand?.type ?? ''),
            getDescription: (skill, p) => 
                ComponentBuilder.message([
                    ComponentBuilder.text(`${AttributeType.ATTACK.asSubjective()} `),
                    ComponentBuilder.text(skill.getValue(p, 'attackAddition').toFixed(1), { color: Utils.PHYSICAL_COLOR }),
                    ComponentBuilder.text(`(${AttributeType.MOVE_SPEED.displayName} 비례)`, { color: 'lightgray' }),
                    ComponentBuilder.text(` 만큼 추가되고, ${AttributeType.CRITICAL_CHANCE.asSubjective()} `),
                    ComponentBuilder.text(skill.getValue(p, 'criticalChanceAddition').toFixed(1) + '%p', { color: Utils.NUMBER_COLOR }),
                    ComponentBuilder.text(` 증가된 채로 목표물을 공격합니다.\n` + 
                        `공격이 적중하면 `),
                    Effect.getDescriptionMessage(EffectType.SLOWNESS, skill.getValue(p, 'slownessLevel')),
                    ComponentBuilder.text(` 효과를 ${Utils.toFixed(skill.getValue(p, 'slownessTime'), 1)}초 동안 부여합니다.`)
                ]),
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
                                victim.addEffect(new Effect(EffectType.SLOWNESS, skill.getValue(p, 'slownessLevel'), skill.getValue(p, 'slownessLevel'), p));
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
                ComponentBuilder.message([
                    ComponentBuilder.text(`목표물을 성스러운 불꽃으로 심판하여 `),
                    Effect.getDescriptionMessage(EffectType.FIRE, skill.getValue(p, 'effectLevel')),
                    ComponentBuilder.text(` 효과를 ${skill.getValue(p, 'effectTime').toFixed(1)}초동안 부여하고, `),
                    ComponentBuilder.text(skill.getValue(p, 'magicAttack').toFixed(1), { color: Utils.MAGIC_COLOR }),
                    ComponentBuilder.text(`의 마법 피해를 입힙니다. `),
                    ComponentBuilder.text(`(현재 생명력 비례)\n`, { color: 'lightgray' }),
                    ComponentBuilder.text(`목표물이 언데드 또는 마계 타입일 시, 피해가 `),
                    ComponentBuilder.text(skill.getValue(p, 'conditionalAttackIncrease').toFixed(1), { color: Utils.NUMBER_COLOR }),
                    ComponentBuilder.text(`배 증가합니다.`)
                ]),
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
                    target.addEffect(new Effect(EffectType.FIRE, skill.getValue(p, 'effectLevel'), skill.getValue(p, 'effectTime'), p));
                skill.prof += skill.getValue(p, 'profAddition');
            },
        },
        {
            name: '멸마의 불꽃',
            isPassive: false,
            maxLevel: 25,
            checkRealizeCondition: p => p.hasSkill('심판의 불꽃', sk => sk.level >= sk.maxLevel),
            calcValues: (skill, p) => ({
                effectLevel: 10 + skill.level * 2, 
                fixedAttack: p.life * 0.06 + 7000,
                effectTime: 9, //effect time
                conditionalAttackIncrease: 2.5, //base attack increase
                profAddition: Math.max(0.3, 4.1 - skill.level * 0.15), //prof addition
                manaCost: skill.level * 5 + 60 //mana cost
            }),
            getCooldown: (skill, p) => Math.max(5, 25 - skill.level * 0.5),
            getCostMessage: (skill, p) => skill.getValue(p, 'manaCost') + '마나',
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= skill.getValue(p, 'manaCost'),
            takeCost: (skill, p) => p.mana -= skill.getValue(p, 'manaCost'),
            getConditionMessage: (skill, p) => '목표물이 있을 때, 멸마의 불꽃! 이라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.currentTarget !== null && 
                p.tickMessage === '멸마의 불꽃!',
            getDescription: (skill, p) => 
                ComponentBuilder.message([
                    ComponentBuilder.text(`목표물을 3개의 멸마의 불꽃으로 심판하여 `),
                    Effect.getDescriptionMessage(EffectType.DECREASE_MAGIC_RESISTANCE, skill.getValue(p, 'effectLevel')),
                    ComponentBuilder.text(` 효과를 ${skill.getValue(p, 'effectTime').toFixed(1)}초동안 부여하고, `),
                    ComponentBuilder.text(skill.getValue(p, 'fixedAttack').toFixed(1), { color: Utils.MAGIC_COLOR }),
                    ComponentBuilder.text(`의 고정 피해를 입힙니다. `),
                    ComponentBuilder.text(`(현재 생명력 비례)\n`, { color: 'lightgray' }),
                    ComponentBuilder.text(`목표물이 언데드 또는 마계 타입일 시, 피해가 `),
                    ComponentBuilder.text(skill.getValue(p, 'conditionalAttackIncrease').toFixed(1), { color: Utils.NUMBER_COLOR }),
                    ComponentBuilder.text(`배 증가합니다.`)
                ]),
            onStart(skill, p) {
                const target = p.currentTarget;
                if(!target) return;
                for(let i = 0; i < 3; i++) {
                    const projectile = new Projectile({
                        name: '멸마의 불꽃',
                        owner: p,
                        attributes: {
                            magicAttack: skill.getValue(p, 'fixedAttack')
                        }
                    });
                    projectile.attack(target, {
                        isFixedAttack: true,
                        isMagicAttack: true,
                        absoluteHit: true,
                        additionalMessage:ComponentBuilder.text('멸마의 불꽃이 당신을 심판합니다!', { color: '#ff00ff' })
                    });
                    if(target instanceof LivingEntity) 
                        target.addEffect(new Effect(EffectType.FIRE, skill.getValue(p, 'effectLevel'), skill.getValue(p, 'effectTime'), p));
                }
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
            getDescription: (skill, p) => ComponentBuilder.texts([
                `1분 동안 ${AttributeType.ATTACK.asSubjective()} `,
                ComponentBuilder.text(skill.getValue(p, 'attackIncrease').toFixed(1) + '%', { color: Utils.PHYSICAL_COLOR }),
                `, ${AttributeType.ATTACK_SPEED.asSubjective()} `,
                ComponentBuilder.text(skill.getValue(p, 'attackSpeedIncrease').toFixed(1) + '%', { color: Utils.NUMBER_COLOR }),
                ` 증가합니다.`
            ]),
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
                speedIncrease: 50 + skill.level,
                profAddition: Math.max(1, 7 - skill.level * 0.2)
            }),
            getCooldown: (skill, p) => Math.max(5, 15 - skill.level * 0.5),
            getCostMessage: (skill, p) => `최대 마나의 ${skill.getValue(p, 'manaCost').toFixed(0)}%`,
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= p.maxMana * skill.getValue(p, 'manaCost') / 100,
            takeCost: (skill, p) => p.mana -= p.maxMana * skill.getValue(p, 'manaCost') / 100,
            getConditionMessage: (skill, p) => '사격 준비! 라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.tickMessage === '사격 준비!',
            getDescription: (skill, p) => ComponentBuilder.texts([
                `3초 동안의 정신 집중 후, 1분 동안 ${AttributeType.DEFEND_PENETRATE.asSubjective()} `,
                ComponentBuilder.text(skill.getValue(p, 'defendPenetrateIncrease').toFixed(1), { color: Utils.NUMBER_COLOR }),
                `, ${AttributeType.RANGE_ATTACK.asSubjective()} `,
                ComponentBuilder.text(skill.getValue(p, 'rangeAttackIncrease').toFixed(1) + '%', { color: Utils.PHYSICAL_COLOR }),
                `, ${AttributeType.PROJECTILE_SPEED.asSubjective()} `,
                ComponentBuilder.text(skill.getValue(p, 'speedIncrease').toFixed(1) + '%', { color: Utils.NUMBER_COLOR }),
                ` 만큼 증가합니다.\n`,
                `정신 집중 동안 말을 하면 정신 집중이 풀리고 재사용 대기시간의 50%를 돌려받습니다.`
            ]),
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
                    else if(p.tickMessage !== null) {
                        p.sendMessage(ComponentBuilder.embed([
                            ComponentBuilder.text('[ 정신 집중이 풀렸다.. ]')
                        ], 'lightgray'));
                        skill.finish(p);
                        skill.setRemainCooldown(p, skill.getCooldown(p) * 0.3);
                    }
                }
                else if(skill.extras.timer > 0) {
                    p.attribute.addValue(AttributeType.DEFEND_PENETRATE, skill.getValue(p, 'defendPenetrateIncrease'));
                    p.attribute.multiplyValue(AttributeType.RANGE_ATTACK, skill.getValue(p, 'rangeAttackIncrease') / 100 + 1);
                    p.attribute.multiplyValue(AttributeType.PROJECTILE_SPEED, skill.getValue(p, 'speedIncrease') / 100 + 1);
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
                profAddition: Math.max(6.1 - skill.level * .2, .5), //prof addition
            }),
            getCostMessage: (skill, p) => skill.getValue(p, 'manaCost') + '마나',
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= skill.getValue(p, 'manaCost'),
            takeCost: (skill, p) => p.mana -= skill.getValue(p, 'manaCost'),
            getConditionMessage: (skill, p) => '단검을 들었을 때, 그림자 쇄도! 라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.tickMessage === '그림자 쇄도!' && ['단검'].includes(p.slot.hand?.type ?? ''),
            getDescription: (skill, p) => ComponentBuilder.texts([
                `5초 동안 ${AttributeType.ATTACK_SPEED.asSubjective()} `,
                ComponentBuilder.text(skill.getValue(p, 'attackSpeedIncrease').toFixed(1) + '%', { color: Utils.NUMBER_COLOR }),
                ` 빨라지며,\n`,
                `그동안 대상을 공격한 횟수에 비례해서 최대 ${skill.getValue(p, 'maxStunTime').toFixed(1)}초의 `,
                Effect.getDescriptionMessage(EffectType.STUN, 1),
                ` 효과와 최대 ${skill.getValue(p, 'maxHealDecreaseTime').toFixed(1)}초의 `,
                Effect.getDescriptionMessage(EffectType.DECREASE_HEAL_EFFICIENCY, skill.getValue(p, 'healDecreaseLevel')),
                ` 효과가 마지막 대상에게 부여됩니다.`
            ]),
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
                        skill.prof += skill.getValue(p, 'profAddition');
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
            getDescription: (skill, p) => ComponentBuilder.texts([
                `들고 있는 단검과 능력치가 동일한 단검을 ${skill.getValue(p, 'count')}개 소환하여 `,
                ComponentBuilder.text(skill.getValue(p, 'speed').toFixed(1), { color: Utils.NUMBER_COLOR }),
                `의 속도로 목표물에게 날립니다.\n`,
                ComponentBuilder.text(`(단검의 공격력은 ${AttributeType.MOVE_SPEED.displayName}에 비례해서 증가합니다.)`, 
                    { color: 'lightgray' })
            ]),
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
                    projectile.attack(target, { useAbuserCritical: true });
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
            getCostMessage: (skill, p) => `${skill.getValue(p, 'manaCost').toFixed(1)}마나`,
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= skill.getValue(p, 'manaCost'),
            takeCost: (skill, p) => p.mana -= skill.getValue(p, 'manaCost'),
            getConditionMessage: (skill, p) => '목표물이 있을 때, 프레싱! 라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.tickMessage === '프레싱!' && p.currentTarget !== null,
            getDescription: (skill, p) => ComponentBuilder.texts([
                `목표물을 ${skill.getValue(p, 'bindTime').toFixed(1)}초 동안 속박합니다. 속박이 지속 되는 매 초 마다`,
                `자신의 현재 생명력의 `,
                ComponentBuilder.text(skill.getValue(p, 'lifeAbsorb').toFixed(1) + '%', { color: Utils.NUMBER_COLOR }),
                ` 만큼 상대에게서 탈취합니다. `
            ]),
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
        {
            name: '오버마스팅',
            isPassive: false,
            maxLevel: 20,
            checkRealizeCondition: p => p.hadClass('전사'),
            calcValues: (skill, p) => ({
                manaCost: 60 + skill.level * 20,
                overmasterTime: 2 + skill.level * 0.1,
                overmasterChance: Math.min(60 + skill.level * 2.5, 100),
                profAddition: Math.max(1, 7 - skill.level * 0.2)
            }),
            getCooldown: (skill, p) => Math.max(5, 60 - skill.level),
            getCostMessage: (skill, p) => `${skill.getValue(p, 'manaCost').toFixed(1)}마나`,
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= skill.getValue(p, 'manaCost'),
            takeCost: (skill, p) => p.mana -= skill.getValue(p, 'manaCost'),
            getConditionMessage: (skill, p) => '목표물이 있을 때, 오버마스팅! 라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.tickMessage === '오버마스팅!' && p.currentTarget !== null,
            getDescription: (skill, p) => ComponentBuilder.texts([
                `순간적으로 강렬한 살기를 내뿜어 목표물을 `,
                ComponentBuilder.text(skill.getValue(p, 'overmasterChance').toFixed(1) + '%', { color: Utils.NUMBER_COLOR }),
                `의 확률로 ${skill.getValue(p, 'overmasterTime').toFixed(1)}초간 제압합니다.\n`,
                `목표물의 레벨이 상대적으로 높을 경우 그에 비례해서 확률이 낮아집니다.`
            ]),
            onStart(skill, p) {
                const target = p.currentTarget;
                if(!target) return;

                const chance = skill.getValue(p, 'overmasterChance') - Math.max(0, (target.level / p.level - 1) * 200);

                if(Math.random() < chance / 100) {
                    const time = skill.getValue(p, 'overmasterTime');
                    p.sendRawMessage('[ 상대를 제압했습니다! ]');
                    if(target instanceof LivingEntity) target.addEffect(new Effect(EffectType.OVERMASTER, 1, time, p));
                }
                else p.sendRawMessage('[ 제압에 실패했습니다! ]');

                skill.prof += skill.getValue(p, 'profAddition');
            }
        },
        {
            name: '마력 동화',
            isPassive: false,
            maxLevel: 20,
            checkRealizeCondition: p => p.hadClass('그랜드 메이지'),
            calcValues: (skill, p) => ({
                cost: 35 + skill.level * .5,
                magicPenetrateIncrease: 3000 + skill.level * 800,
                magicAttackIncrease: 25 + skill.level * 1.4,
                profAddition: Math.max(1, 7 - skill.level * 0.2)
            }),
            getCooldown: (skill, p) => Math.max(5, 60 - skill.level),
            getCostMessage: (skill, p) => `최대 마나의 ${Utils.toFixed(skill.getValue(p, 'cost'), 1)}%`,
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= p.maxMana * skill.getValue(p, 'cost') / 100,
            takeCost: (skill, p) => p.mana -= p.maxMana * skill.getValue(p, 'cost') / 100,
            getConditionMessage: (skill, p) => '마력 동화! 라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.tickMessage === '마력 동화!',
            getDescription: (skill, p) => ComponentBuilder.texts([
                `7초 동안의 정신 집중 후, 1분 동안 ${AttributeType.MAGIC_PENETRATE.asSubjective()} `,
                ComponentBuilder.text(skill.getValue(p, 'magicPenetrateIncrease').toFixed(1), { color: Utils.MAGIC_COLOR }),
                ` 만큼 증가하며, ${AttributeType.MAGIC_ATTACK.asSubjective()} `,
                ComponentBuilder.text(skill.getValue(p, 'magicAttackIncrease').toFixed(1) + '%', { color: Utils.MAGIC_COLOR }),
                ` 만큼 증가합니다.\n`,
                `정신 집중 동안 말을 하면 정신 집중이 풀리고 재사용 대기시간의 70%를 돌려받습니다.`
            ]),
            onStart(skill, p) {
                p.sendMessage(ComponentBuilder.embed([
                    ComponentBuilder.text('[ 정신 집중 중... ]')
                ], 'lightgray'));
                skill.extras.waitTimer = 7;
                skill.extras.timer = 60;
            },
            onEarlyUpdate(skill, p) {
                if (skill.extras.waitTimer > 0) {
                    if((skill.extras.waitTimer -= Time.deltaTime) <= 0) {
                        p.sendMessage(ComponentBuilder.embed([
                            ComponentBuilder.text('[ 그 순간, 마력과 자신이 동화된다...! ]')
                        ], Utils.MAGIC_COLOR));
                        skill.prof += skill.getValue(p, 'profAddition');
                    }
                    else if(p.tickMessage !== null) {
                        p.sendMessage(ComponentBuilder.embed([
                            ComponentBuilder.text('[ 정신 집중이 풀렸다.. ]')
                        ], 'lightgray'));
                        skill.finish(p);
                        skill.setRemainCooldown(p, skill.getCooldown(p) * 0.3);
                    }
                }
                else if(skill.extras.timer > 0) {
                    p.attribute.addValue(AttributeType.MAGIC_PENETRATE, skill.getValue(p, 'magicPenetrateIncrease'));
                    p.attribute.multiplyValue(AttributeType.MAGIC_ATTACK, skill.getValue(p, 'magicAttackIncrease') / 100 + 1);
                    skill.extras.timer -= Time.deltaTime;
                }
                else {
                    p.sendRawMessage('[ 마력 동화 지속시간이 끝났습니다. ]');
                    skill.finish(p);
                }
            },
        },
        {
            name: '주문 조합',
            isPassive: true,
            maxLevel: 1,
            constants: {
                defaultSpell: '아르 볼테 디스파르',
                cooldown: 2.5
            },
            checkRealizeCondition: p => p.hadClass('그랜드 메이지'),
            getDescription: (skill, p) => ComponentBuilder.texts([
                `특별한 주문을 조합해서 의미있는 주문을 만들어내면 마법이 발동합니다.\n`,
                `주문은 한 메시지당 하나만 말할 수 있습니다.\n`,
                `주문을 완성하고 나면, ${skill.getConstant('cooldown', 5).toFixed(1)}초 뒤 재사용 가능합니다.\n`,
                `마법마다 필요한 마나량에 차이가 있으며, 만약 마나를 지불할 수 없다면 순간적으로 탈진해서, 마나를 모두 소모하고 5초 동안 `,
                Effect.getDescriptionMessage(EffectType.STUN, 1),
                ` 효과에 걸립니다.\n\n`,
                ` [ 사용 가능한 주문 ]\n`,
                ComponentBuilder.join(SpellCombination.spells
                    .map((spell: string) => ComponentBuilder.text(spell, { color: Utils.MAGIC_COLOR })), 
                    ComponentBuilder.text(', ')),
                `\n\n[ 발견한 주문 조합 (기본 1개 제공) ]\n`,
                ComponentBuilder.join((skill.extras.foundSpells ?? [skill.getConstant('defaultSpell')])
                    .map((spell: string) => ComponentBuilder.text(spell, { 
                        color: Utils.MAGIC_COLOR,
                        paddingLeft: '10px',
                        borderLeft: '3px solid lightgray'
                    })), 
                    ComponentBuilder.text('\n')),
            ]),
            onEarlyUpdate(skill, p) {
                if(!p.isAlive) return;
                if(!skill.extras.foundSpells) 
                    skill.extras.foundSpells = [skill.getConstant('defaultSpell')];
                if(!skill.extras.spellLog) 
                    skill.extras.spellLog = [];
                const spells = new Set<string>(SpellCombination.spells);
                const foundSpells: string[] = skill.extras.foundSpells;
                const spellLog: [string, string][] = skill.extras.spellLog;

                if(skill.extras.cooldown > 0) skill.extras.cooldown -= Time.deltaTime;

                if (p.tickMessage && p.tickMessageId && spells.has(p.tickMessage)) {
                    if(skill.extras.cooldown > 0) {
                        p.sendRawMessage('[ 주문 재사용 대기시간이 지나지 않았습니다. ]');
                    }
                    else {
                        p.user.room?.editChat(p.tickMessageId,
                            ComponentBuilder.embed([
                                ComponentBuilder.text(p.tickMessage, {
                                    color: Utils.MAGIC_COLOR,
                                })
                            ], 'white')
                        );
                        spellLog.push([p.tickMessage, p.tickMessageId]);
                        if(spellLog.length > 20) spellLog.shift();
                    }
                }

                const result = SpellCombination.runSpell(p, spellLog);
                if(result !== false) {
                    skill.extras.spellLog = [];
                    skill.extras.cooldown = skill.getConstant('cooldown', 0);
                    const spellName = spellLog.slice(-result).map(e => e[0]).join(' ');
                    if(!foundSpells.includes(spellName)) foundSpells.push(spellName);
                }
            },
        },
        {
            name: '명상',
            isPassive: false,
            maxLevel: 20,
            checkRealizeCondition: p => p.hadClass('그랜드 메이지'),
            calcValues: (skill, p) => ({
                healAmount: skill.level + 30,
                profAddition: Math.max(1, 7 - skill.level * 0.2)
            }),
            getCooldown: (skill, p) => Math.max(5, 600 - skill.level * 5),
            getConditionMessage: (skill, p) => '명상! 이라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.tickMessage === '명상!',
            getDescription: (skill, p) => ComponentBuilder.texts([
                `30초 동안의 정신 집중 후, 잃은 마나의 `,
                ComponentBuilder.text(skill.getValue(p, 'healAmount').toFixed(1) + '%', { color: Utils.NUMBER_COLOR }),
                `를 돌려받습니다.\n`,
                `정신 집중 동안 말을 하면 정신 집중이 풀리고 재사용 대기시간의 30%를 돌려받습니다.`
            ]),
            onStart(skill, p) {
                p.sendMessage(ComponentBuilder.embed([
                    ComponentBuilder.text('[ 정신 집중 중... ]')
                ], 'lightgray'));
                skill.extras.waitTimer = 30;
            },
            onEarlyUpdate(skill, p) {
                if (skill.extras.waitTimer > 0) {
                    if((skill.extras.waitTimer -= Time.deltaTime) <= 0) {
                        p.sendMessage(ComponentBuilder.embed([
                            ComponentBuilder.text('[ 마나가 회복되었다. ]')
                        ], Utils.MAGIC_COLOR));
                        p.mana += (p.maxMana - p.mana) * skill.getValue(p, 'healAmount') / 100;
                        skill.prof += skill.getValue(p, 'profAddition');
                        skill.finish(p);
                    }
                    else if(p.tickMessage !== null) {
                        p.sendMessage(ComponentBuilder.embed([
                            ComponentBuilder.text('[ 정신 집중이 풀렸다.. ]')
                        ], 'lightgray'));
                        skill.finish(p);
                        skill.setRemainCooldown(p, skill.getCooldown(p) * 0.7);
                    }
                }
            },
        },
        {
            name: '은신',
            isPassive: false,
            maxLevel: 30,
            checkRealizeCondition: p => p.hadClass('암살자'),
            calcValues: (skill, p) => ({
                effectLevel: skill.level,
                attackIncrease: skill.level * 0.5 + 30,
                profAddition: Math.max(1, 6 - skill.level * 0.2)
            }),
            getCooldown: (skill, p) => Math.max(5, 150 - skill.level),
            getConditionMessage: (skill, p) => '은신! 이라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.tickMessage === '은신!',
            getDescription: (skill, p) => ComponentBuilder.texts([
                `30초 동안 `,
                Effect.getDescriptionMessage(EffectType.INVISIBLE, skill.getValue(p, 'effectLevel')),
                ` 상태가 되며, 대상을 공격할 시 은신이 풀립니다.\n`,
                `은신 중에는 맵 플레이어 목록에 이름이 뜨지 않으며, 물리 공격력이 `,
                ComponentBuilder.text(skill.getValue(p, 'attackIncrease').toFixed(1) + '%', { color: Utils.PHYSICAL_COLOR }),
                ` 증가합니다.`
            ]),
            onStart(skill, p) {
                skill.extras.timer = 30;
                skill.extras.latestAttack = p.latestAttack;
                p.addEffect(new Effect(EffectType.INVISIBLE, skill.getValue(p, 'effectLevel'), 30, p));
                p.sendRawMessage('[ 30초 동안 은신 상태가 됩니다.. ]');
            },
            onEarlyUpdate(skill, p) {
                p.attribute.multiplyValue(AttributeType.ATTACK, skill.getValue(p, 'attackIncrease') / 100 + 1);
                if((skill.extras.timer -= Time.deltaTime) <= 0 || skill.extras.latestAttack !== p.latestAttack) {
                    p.sendRawMessage('[ 은신이 풀렸습니다... ]');
                    skill.prof += skill.getValue(p, 'profAddition');
                    skill.finish(p);
                }
            },
        },
        {
            name: '쉐도우 스텝',
            isPassive: false,
            maxLevel: 10,
            checkRealizeCondition: p => p.hadClass('나이트 세이드'),
            calcValues: (skill, p) => ({
                effectLevel: skill.level,
                moveSpeedIncrease: skill.level * 3.5 + 20,
                profAddition: Math.max(1, 3 - skill.level * 0.2)
            }),
            getCooldown: (skill, p) => Math.max(5, 35 - skill.level * 0.5),
            getConditionMessage: (skill, p) => '쉐도우 스텝! 이라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.tickMessage === '쉐도우 스텝!',
            getDescription: (skill, p) => ComponentBuilder.texts([
                `2초 동안 `,
                Effect.getDescriptionMessage(EffectType.INVISIBLE, skill.getValue(p, 'effectLevel')),
                ` 상태가 되며, ${AttributeType.MOVE_SPEED.asSubjective()} `,
                ComponentBuilder.text(skill.getValue(p, 'moveSpeedIncrease').toFixed(1) + '%', { color: Utils.NUMBER_COLOR }),
                ` 증가합니다.`
            ]),
            onStart(skill, p) {
                skill.extras.timer = 2;
                skill.extras.latestAttack = p.latestAttack;
                p.addEffect(new Effect(EffectType.INVISIBLE, skill.getValue(p, 'effectLevel'), 2, p));
                p.sendRawMessage('[ 2초 동안 그림자 상태가 됩니다.. ]');
            },
            onEarlyUpdate(skill, p) {
                p.attribute.multiplyValue(AttributeType.MOVE_SPEED, skill.getValue(p, 'moveSpeedIncrease') / 100 + 1);
                if((skill.extras.timer -= Time.deltaTime) <= 0) {
                    p.sendRawMessage('[ 쉐도우 스텝이 풀렸습니다... ]');
                    skill.prof += skill.getValue(p, 'profAddition');
                    skill.finish(p);
                }
            },
        },
        {
            name: '백스텝',
            isPassive: false,
            maxLevel: 10,
            checkRealizeCondition: p => p.hadClass('궁수'),
            calcValues: (skill, p) => ({
                effectLevel: skill.level,
                moveSpeedIncrease: skill.level * 12 + 120,
                defendPenetrateIncrease: skill.level * 120 + 220,
                profAddition: Math.max(1, 3 - skill.level * 0.2)
            }),
            getCooldown: (skill, p) => Math.max(5, 30 - skill.level * 0.5),
            getConditionMessage: (skill, p) => '백스텝! 이라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.tickMessage === '백스텝!',
            getDescription: (skill, p) => ComponentBuilder.texts([
                `4초 동안 ${AttributeType.MOVE_SPEED.asSubjective()} `,
                ComponentBuilder.text(skill.getValue(p, 'moveSpeedIncrease').toFixed(1) + '%', { color: Utils.NUMBER_COLOR }),
                `, ${AttributeType.DEFEND_PENETRATE.asSubjective()} `,
                ComponentBuilder.text(skill.getValue(p, 'defendPenetrateIncrease').toFixed(1), { color: Utils.NUMBER_COLOR }),
                ` 증가하며, 그 동안 공격받을 시 잃은 생명력의 5%를 회복합니다.`
            ]),
            onStart(skill, p) {
                skill.extras.timer = 4;
                skill.extras.latestAttack = p.latestAttack;
                p.sendRawMessage('[ 백스텝! ]');
            },
            onEarlyUpdate(skill, p) {
                p.attribute.multiplyValue(AttributeType.MOVE_SPEED, skill.getValue(p, 'moveSpeedIncrease') / 100 + 1);
                p.attribute.addValue(AttributeType.DEFEND_PENETRATE, skill.getValue(p, 'defendPenetrateIncrease'));
                p.registerTrigger(new Trigger({
                    onHitted(p, attacker) {
                        p.heal((p.maxLife - p.life) * 0.05);
                    },
                }))
                if((skill.extras.timer -= Time.deltaTime) <= 0) {
                    p.sendRawMessage('[ 백스텝이 풀렸습니다... ]');
                    skill.prof += skill.getValue(p, 'profAddition');
                    skill.finish(p);
                }
            },
        },
        {
            name: '광물 제련',
            isPassive: true,
            maxLevel: 1,
            checkRealizeCondition: p => p.hadClass('대장장이'),
            getDescription: (skill, p) => ComponentBuilder.texts([
                `광물을 제련해서 단조할 수 있는 상태로 만듭니다.\n`,
                `아래는 사용할 수 있는 명령어입니다.\n\n`, 
                `용광로 사용 [ 인벤토리 번호 ]\n`,
                ComponentBuilder.blockText('해당하는 번호에 있는 아이템이 용광로라면, 사용할 용광로로 지정합니다.', {
                    color: 'lightgray',
                    marginLeft: '20px'
                }),
                `\n\n용광로 정보\n`,
                ComponentBuilder.blockText('현재 사용중인 용광로의 정보를 보여줍니다.', {
                    color: 'lightgray',
                    marginLeft: '20px'
                }),
                `\n\n용광로 재료 추가 [ 인벤토리 번호 ] [ 개수 ]\n`,
                ComponentBuilder.blockText('현재 사용중인 용광로에 재료를 추가합니다. 개수는 생략 가능하며, 생략할 시 1개로 간주됩니다.\n' + 
                    '재료는 연료 또는 제련 종류의 아이템입니다.', {
                    color: 'lightgray',
                    marginLeft: '20px'
                }),
                `\n\n용광로 재료 회수 [ 용광로 슬롯 번호 ] [ 개수 ]\n`,
                ComponentBuilder.blockText('현재 사용중인 용광로에서 재료를 회수합니다. 개수는 생략 가능하며, 생략할 시 1개로 간주됩니다.', {
                    color: 'lightgray',
                    marginLeft: '20px'
                }),
                `\n\n용광로 활성화\n`,
                ComponentBuilder.blockText('마나를 100 소모하고 현재 사용중인 용광로를 활성화 시킵니다. 제련 중일 때는 재료를 추가하거나 회수하지 못합니다.', {
                    color: 'lightgray',
                    marginLeft: '20px'
                })
            ]),
            onUpdate(skill, p) {
                if(!p.isAlive) return;
                const usingBlastFurnace = skill.weakExtras.currentItem ? 
                    MineralSmelting.getData(skill.weakExtras.currentItem) : undefined;

                if(usingBlastFurnace) usingBlastFurnace.update(p);

                if(p.tickMessage && /^용광로 사용 \d+$/.test(p.tickMessage)) {
                    const idx = parseInt(p.tickMessage.split(' ')[2]) - 1;
                    const itemStack = p.inventory.getItemStack(idx);
                    if(!itemStack) {
                        p.sendRawMessage('[ 빈 슬롯입니다. ]');
                        return;
                    }
                    if(itemStack.item.type !== '용광로') {
                        p.sendRawMessage('[ 용광로가 아닌 아이템입니다. ]');
                        return;
                    }
                    skill.weakExtras.currentItem = itemStack.item;
                    p.sendRawMessage(`[ ${Utils.asObjective(itemStack.item.getName())} 사용하도록 지정했습니다. ]`);
                }
                
                else if(p.tickMessage && /^용광로 정보$/.test(p.tickMessage)) {
                    if(usingBlastFurnace) p.sendMessage(usingBlastFurnace.getInfo());
                    else p.sendRawMessage('[ 현재 사용하도록 지정된 용광로가 없습니다. ]');
                }
                
                else if(p.tickMessage && /^용광로 활성화$/.test(p.tickMessage)) {
                    if(usingBlastFurnace) usingBlastFurnace.enable(p);
                    else p.sendRawMessage('[ 현재 사용하도록 지정된 용광로가 없습니다. ]');
                }

                else if(p.tickMessage && /^용광로 재료 (추가|회수) \d+( \d+)?$/.test(p.tickMessage)) {
                    const args = p.tickMessage.split(' ');
                    const idx = parseInt(args[3]) - 1;
                    const count = args.length >= 5 ? parseInt(args[4]) : 1;
                    if(usingBlastFurnace) {
                        if(args[2] === '추가') usingBlastFurnace.addMaterial(p, idx, count);
                        else usingBlastFurnace.withdrawMaterial(p, idx, count);
                    }
                    else p.sendRawMessage('[ 현재 사용하도록 지정된 용광로가 없습니다. ]');
                }

            },
        },
        {
            name: '금속 단조',
            isPassive: true,
            maxLevel: 1,
            checkRealizeCondition: p => p.hadClass('대장장이'),
            getDescription: (skill, p) => ComponentBuilder.texts([
                `금속을 단조하여 원하는 형태로 만듭니다.\n`,
                `아래는 사용할 수 있는 명령어입니다.\n\n`, 
                `금속 단조\n`,
                ComponentBuilder.blockText('금속 단조를 시작합니다.\n' + 
                    '단조는 망치를 들고 있고, 모루를 소지하고 있을 때만 가능합니다.', {
                    color: 'lightgray',
                    marginLeft: '20px'
                }),
                `\n\n단조 취소\n`,
                ComponentBuilder.blockText('단조를 도중에 취소합니다.\n' + 
                    '모루를 소지하지 않거나 망치를 장착 해제하면 자동으로 취소됩니다.\n' + 
                    '단조가 취소되면 단조 중이던 아이템은 소멸합니다.', {
                    color: 'lightgray',
                    marginLeft: '20px'
                }),
                `\n\n단조 효율 제한 [ 제한치 ]%\n`,
                ComponentBuilder.blockText('단조될 아이템의 효율을 제한치(%) 로 제한합니다.\n' + 
                    `현재 단조 효율 제한 : ${skill.extras.limit ? skill.extras.limit + '%' : '없음'}`, {
                    color: 'lightgray',
                    marginLeft: '20px'
                }),
                `\n\n단조 효율 제한 해제\n`,
                ComponentBuilder.blockText('단조될 아이템의 효율 제한을 해제합니다.', {
                    color: 'lightgray',
                    marginLeft: '20px'
                })
            ]),
            constants: {
                hitScore: 200,
                hitCount: 8
            },
            onUpdate(skill, p) {
                if(!p.isAlive) return;
                if(!skill.extras.state) skill.extras.state = 'none';

                if(p.tickMessage === '단조 취소' && skill.extras.state !== 'none') {
                    skill.extras.state = 'none';
                    p.sendRawMessage('[ 단조가 취소되었습니다. ]');
                    if(skill.extras.forgeInfoId) p.user.room?.removeChat(skill.extras.forgeInfoId);
                    return;
                }

                if(p.tickMessage && /^단조 효율 제한 (\d+(\.\d+)?%|해제)$/.test(p.tickMessage)) {
                    const amountStr = p.tickMessage.split(' ')[3];
                    if(amountStr === '해제') {
                        delete skill.extras.limit;
                        p.sendRawMessage('[ 제한을 해제했습니다. ]');
                    }
                    else {
                        const limit = parseFloat(amountStr.slice(0, -1));
                        if(limit < 10) {
                            p.sendRawMessage('[ 효율 제한치는 최소 10%여야 합니다. ]');
                            return;
                        }
                        skill.extras.limit = limit;
                        p.sendRawMessage(`[ 단조 효율을 ${skill.extras.limit.toFixed(1)}% 로 제한합니다. ]`);
                    }
                }

                switch(skill.extras.state) {
                    case 'none':
                        if(p.tickMessage === '금속 단조') {
                            if(p.slot.hand?.type !== '망치' || !p.inventory.hasItem(item => item.type === '모루')) {
                                p.sendRawMessage('[ 단조를 하려면 망치를 착용한 상태로 모루가 있어야 합니다. ]');
                                return;
                            }
                            p.sendMessage(ComponentBuilder.texts([
                                '[ 단조할 형태를 선택하세요. ]\n',
                                ComponentBuilder.join(MetalForgeForm.getAll().map(form => ComponentBuilder.button([
                                    ComponentBuilder.text(form.itemName)
                                ], form.itemName))
                                 , ComponentBuilder.newLine())
                            ]));
                            skill.extras.state = 'form-select';
                        }
                        break;
                    case 'form-select':
                        if(p.tickMessage && p.tickMessageId && MetalForgeForm.getAll().some(f => f.itemName === p.tickMessage)) {
                            p.user.room?.editChat(p.tickMessageId, 
                                ComponentBuilder.text(p.tickMessage, { color: Utils.MAIN_COLOR }));
                            p.sendMessage(ComponentBuilder.texts([
                                '[ 단조할 금속을 선택하세요. ]\n',
                                ComponentBuilder.join(
                                    Array.from(new Set(p.inventory.contents
                                        .filter(itemStack => itemStack?.item?.type === '단조')
                                        .map(itemStack => itemStack?.item?.name)
                                    ))
                                    .map(name => ComponentBuilder.button([
                                        ComponentBuilder.text(name ?? '')
                                    ], name ?? ''))
                                , ComponentBuilder.newLine())
                            ]));
                            skill.extras.formName = p.tickMessage;
                            skill.extras.state = 'material-select';
                        }
                        break;
                    case 'material-select':
                        const materials = p.inventory.contents.filter(itemStack => itemStack?.item?.type === '단조');
                        if(p.tickMessageId && p.tickMessage && 
                            materials.some(itemStack => itemStack?.item?.name === p.tickMessage)) {
                            const form = MetalForgeForm.getAll().find(form => form.itemName === skill.extras.formName);
                            if(!form || !p.inventory.hasItem(item => item.name === p.tickMessage, form.neededCount)) {
                                p.sendRawMessage(`[ ${Utils.asObjective(form?.itemName ?? '')
                                    } 단조하기에 충분한 금속이 없습니다. (${form?.neededCount}개 필요) ]`);
                                return;
                            }
                            p.inventory.removeItem(item => item.name === p.tickMessage, form.neededCount)
                            p.user.room?.editChat(p.tickMessageId, 
                                ComponentBuilder.text(p.tickMessage, { color: Utils.MAIN_COLOR }));
                            p.sendMessage(ComponentBuilder.texts([
                                `[ 금속 단조를 시작합니다. 흰 막대가 붉은 선에 닿을 때 버튼을 누르세요! ]\n`
                            ]));
                            skill.extras.material = p.tickMessage;

                            skill.extras.remainHitCount = skill.getConstant('hitCount', 1);
                            skill.extras.waitTime = Utils.randomRange(3, 5);
                            skill.extras.timer = 0;
                            skill.extras.score = 0;
                            skill.extras.updateTimer = 0;
                            skill.extras.hitState = null;
                            
                            skill.extras.state = 'forge';
                            skill.extras.forgeInfoId = p.sendRawMessage('')?.chatId;
                        }
                        break;
                    case 'forge':
                        
                        if((skill.extras.updateTimer -= Time.deltaTime) <= 0) {
                            p.user.room?.editChat(skill.extras.forgeInfoId, ComponentBuilder.texts([
                                '[ 흰 막대가 붉은 선에 닿을 때 버튼을 누르세요! ]\n',
                                ` 점수 ${skill.extras.score.toFixed(0)}\n`,
                                ComponentBuilder.blockText('', { 
                                    backgroundColor: '#00000055', 
                                    width: '150px', height: '2em',
                                    margin: '4px',
                                    position: 'relative',
                                    overflow: 'hidden',
                                }, [
                                    ComponentBuilder.blockText('', { 
                                        borderLeft: '1px solid red', 
                                        position: 'absolute',
                                        height: '100%',
                                        width: 0,
                                        right: 0 
                                    }),
                                    ComponentBuilder.blockText('', { 
                                        borderLeft: '1px solid white', 
                                        position: 'absolute', 
                                        height: '100%',
                                        transition: skill.extras.timer > 0 ? 'left 0.1s ease' : '',
                                        width: 0,
                                        left: `${(Math.max(0, skill.extras.timer - 1) / (skill.extras.waitTime - 1) * 100).toFixed(0)}%`
                                    })
                                ]),
                                ComponentBuilder.button([ ComponentBuilder.text('망치') ], '!'),
                                skill.extras.hitState ? 
                                    ComponentBuilder.text('\n' + skill.extras.hitState[0], { color: skill.extras.hitState[1] }) : '',
                            ]));
                            skill.extras.updateTimer = 0.1;
                        }

                        skill.extras.timer += Time.deltaTime;
                        const timer = skill.extras.timer - (p.ping / 1000);
                        if(timer >= skill.extras.waitTime + 3 || p.tickMessage === '!') {
                            if(p.tickMessage === '!' && p.tickMessageId) {
                                p.user.room?.removeChat(p.tickMessageId);
                            }

                            const diff = Math.abs(timer - skill.extras.waitTime);
                            const limit = 1.5;
                            if(diff > limit) {
                                skill.extras.score -= skill.getConstant('hitScore') * 1.5;
                                skill.extras.hitState = ['Miss', 'gray'];
                            }
                            else {
                                const rate = 1 - diff / limit;
                                skill.extras.score += skill.getConstant('hitScore') * rate;
                                if(rate < 0.2) 
                                    skill.extras.hitState = ['Bad', 'red'];
                                else if(rate < 0.5) 
                                    skill.extras.hitState = ['SoSo', 'orange'];
                                else if(rate < 0.8) 
                                    skill.extras.hitState = ['Great', 'lime'];
                                else 
                                    skill.extras.hitState = ['Best!', 'cyan'];
                            }

                            skill.extras.remainHitCount--;
                            skill.extras.timer = 0;
                            skill.extras.waitTime = Utils.randomRange(1.6, 4);

                            if(skill.extras.remainHitCount <= 0) {
                                skill.extras.state = 'none';
                                if(skill.extras.forgeInfoId) p.user.room?.removeChat(skill.extras.forgeInfoId);
                                const rate = skill.extras.score / (skill.getConstant('hitScore', 0) * skill.getConstant('hitCount', 0));
                                const form = MetalForgeForm.getAll().find(f => f.itemName === skill.extras.formName);
                                if(!form) return;

                                let efficiency = Math.max(10, rate * 1.3 * (60 + 
                                    0.5 * Math.max(0, p.attribute.getValue(AttributeType.DEXTERITY) - 100)));
                                if(skill.extras.limit >= 0) efficiency = Math.min(skill.extras.limit, efficiency);

                                const materialItem = Item.fromName(skill.extras.material);
                                const item = MetalForge.forge(form, materialItem, efficiency / 100);
                                const exp = Math.pow(efficiency, 2.4) + p.maxExp * 0.05;

                                item.createdBy = p.uid;
                                if(efficiency > 200) item.requiredLevel = Math.floor(Math.pow(efficiency / 100 * 19, 1.03));

                                p.exp += exp;
                                p.inventory.addItem(item, 1);
                                p.sendMessage(ComponentBuilder.texts([
                                    `[ 단조가 완료되었습니다! (+${exp.toFixed(0)} EXP) ]\n`,
                                    ComponentBuilder.embed([
                                        ComponentBuilder.text(`${item?.getName()} (${efficiency.toFixed(1)}%)`)
                                    ])
                                ]));
                            }
                        }

                        break;
                    default:
                        skill.extras.state = 'none';
                }
            },
        },
        {
            name: '초에니 바르도',
            isPassive: false,
            maxLevel: 1,
            getCooldown: (skill, p) => 300,
            getConditionMessage: (skill, p) => '500레벨 이상일 때, 초에니 바르도 라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.level >= 500 && p.tickMessage === '초에니 바르도',
            getDescription: (skill, p) => ComponentBuilder.texts([
                `생과 사의 경계를 넘나든다.`
            ]),
            onStart(skill, p) {
                const loc = p.getLocation();
                switch(loc.regionType) {
                    case RegionType.DEVILDOM:
                        p.teleport(skill.extras.realLocation ?? p.spawn);
                        p.sendRawMessage('[ 돌아왔다. ]');
                        break;
                    default:
                        skill.extras.realLocation = p.location;
                        p.teleport('마계 - 망자의 골짜기 - 1');
                        p.sendRawMessage('[ 죽음의 기운이 넘실대는 곳. ]');
                }
            },
        },
        {
            name: '암전',
            isPassive: false,
            maxLevel: 1,
            calcValues: (skill, p) => ({
                time: 5
            }),
            getCooldown: (skill, p) => 3600,
            getConditionMessage: (skill, p) => '암전! 이라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.tickMessage === '암전!',
            getDescription: (skill, p) => ComponentBuilder.texts([
                `자신을 제외한, 현재 장소에 있는 모든 플레이어와 몬스터에게 `,
                Effect.getDescriptionMessage(EffectType.BLINDNESS, 1),
                ` 효과를 ${skill.getValue(p, 'time')}초 동안 부여합니다.`
            ]),
            onStart(skill, p) {
                p.sendMessage(ComponentBuilder.blockText('[ 암전 ]', { backgroundColor: 'black', height: '30px' }));
                const loc = p.getLocation();
                loc.objects.forEach(o => {
                    if(o instanceof LivingEntity) 
                        o.addEffect(new Effect(EffectType.BLINDNESS, 1, skill.getValue(p, 'time'), p));
                });
                loc.getPlayers(true).forEach(pl => {
                    if(pl !== p) pl.addEffect(new Effect(EffectType.BLINDNESS, 1, skill.getValue(p, 'time'), p));
                });
            },
        },
        {
            name: '무구 이름 부여',
            isPassive: false,
            maxLevel: 1,
            checkRealizeCondition: p => p.hadClass('대장장이'),
            getConditionMessage: (skill, p) => '무구 이름 부여 [ 인벤토리 번호 ] [ 부여할 이름 ] 라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.tickMessage !== null && 
                /^무구 이름 부여 \d+ .+$/i.test(p.tickMessage),
            getDescription: (skill, p) => ComponentBuilder.texts([
                `만든 무기구에 이름을 부여합니다. 한번 부여한 이름은 바꿀 수 없습니다.\n`,
                `한글, 숫자, 영어, 띄어쓰기로만 구성한 15자 이내의 이름만 가능합니다.`
            ]),
            onStart(skill, p) {
                if(!p.tickMessage) return;
                const spl = p.tickMessage.split(' ');
                const idx = parseInt(spl[3]) - 1;
                const name = spl.slice(4).join(' ');
                const itemStack = p.inventory.getItemStack(idx);

                if(name.trim() !== name) {
                    p.sendRawMessage('[ 이름에 앞 또는 뒤에 공백이 있으면 안됩니다. ]');
                    return;
                }

                if(!/^[가-힣a-z0-9 ]{1,15}$/i.test(name)) {
                    p.sendRawMessage('[ 한글, 숫자, 영어, 띄어쓰기로만 구성한 15자 이내의 이름만 가능합니다. ]');
                    return;
                }
                
                if(!itemStack) {
                    p.sendRawMessage('[ 빈 슬롯 번호입니다. ]');
                    return;
                }
                
                if(itemStack.item.extras.isNamed) {
                    p.sendRawMessage('[ 이미 이름이 부여된 아이템입니다. ]');
                    return;
                }
                
                if(!itemStack.item.extras.isForged) {
                    p.sendRawMessage('[ 단조해서 만든 아이템만 이름 부여 가능합니다. ]');
                    return;
                }
                
                if(itemStack.item.createdBy !== p.uid) {
                    p.sendRawMessage('[ 직접 만든 무기구만 이름 부여 가능합니다. ]');
                    return;
                }

                p.sendRawMessage('[ 이름을 부여했습니다. ]');
                p.inventory.addItemCount(idx, -1);

                const cloneItem = itemStack.item.clone();
                cloneItem.displayName = name;
                cloneItem.extras.isNamed = true;

                p.inventory.addItem(cloneItem, 1);
            },
        },
        {
            name: '리페어링',
            isPassive: false,
            maxLevel: 15,
            checkRealizeCondition: p => p.hadClass('스펠릭 스미스'),
            calcValues: (skill, p) => ({
                cost: 105 + skill.level * 30,
                profAddition: 2,
                minDurabilityRatio: 70 - skill.level * 3,
                maxDurabilityRatio: 80 + skill.level,
                repairAmount: skill.level * 5 + 20
            }),
            getCooldown: (skill, p) => Math.max(5, 25 - skill.level),
            getCostMessage: (skill, p) => `${Utils.toFixed(skill.getValue(p, 'cost'), 1)}마나`,
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= skill.getValue(p, 'cost'),
            takeCost: (skill, p) => p.mana -= skill.getValue(p, 'cost'),
            getConditionMessage: (skill, p) => '리페어 [ 인벤토리 번호 ] 라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.tickMessage !== null && 
                /^리페어 \d+$/i.test(p.tickMessage),
            getDescription: (skill, p) => ComponentBuilder.texts([
                `내구도가 ${skill.getValue(p, 'minDurabilityRatio').toFixed(1)}% 이상인 아이템을 내구도 `,
                ComponentBuilder.text(`${skill.getValue(p, 'repairAmount')}`, { color: Utils.NUMBER_COLOR }),
                `만큼 수리합니다.\n`,
                ComponentBuilder.text(`(최대 ${skill.getValue(p, 'maxDurabilityRatio').toFixed(1)}%)\n`, { color: 'lightgray' })
            ]),
            onStart(skill, p) {
                if(!p.tickMessage) return;
                const spl = p.tickMessage.split(' ');
                const idx = parseInt(spl[1]) - 1;
                const itemStack = p.inventory.getItemStack(idx);
                const minRatio = skill.getValue(p, 'minDurabilityRatio');
                const maxRatio = skill.getValue(p, 'maxDurabilityRatio');
                const amount = skill.getValue(p, 'repairAmount');

                if(!itemStack) {
                    p.sendRawMessage('[ 빈 슬롯 번호입니다. ]');
                    skill.finish(p);
                    skill.setRemainCooldown(p, 0);
                    return;
                }

                const targetItem = itemStack.count > 1 ? itemStack.item.clone() : itemStack.item;

                if(targetItem.durability === null || targetItem.maxDurability === null) {
                    p.sendRawMessage('[ 내구도가 존재하지 않는 아이템입니다. ]');
                    skill.finish(p);
                    skill.setRemainCooldown(p, 0);
                    return;
                }

                const durRatio = targetItem.durability / targetItem.maxDurability * 100;

                if(durRatio < minRatio) {
                    p.sendRawMessage('[ 수복 가능한 정도보다 너무 많이 손상되었습니다. ]');
                    skill.finish(p);
                    skill.setRemainCooldown(p, 0);
                    return;
                }

                if(durRatio > maxRatio) {
                    p.sendRawMessage('[ 이 이상은 수복 불가능합니다. ]');
                    skill.finish(p);
                    skill.setRemainCooldown(p, 0);
                    return;
                }

                const beforeDur = targetItem.durability;

                targetItem.durability += amount;
                targetItem.durability = Math.min(targetItem.durability, targetItem.maxDurability * maxRatio);

                p.sendRawMessage(`[ 아이템이 ${targetItem.durability - beforeDur}만큼 수복되었습니다. ]`);

                if(itemStack.count > 1) {
                    p.inventory.setItemCount(idx, itemStack.count - 1);
                    p.inventory.addItem(targetItem);
                }

                skill.prof += skill.getValue(p, 'profAddition');
            },
        },
        {
            name: '인핸스 웨폰',
            isPassive: false,
            maxLevel: 25,
            checkRealizeCondition: p => p.hadClass('스펠릭 스미스'),
            constants: {
                weaponTypes: ['장검', '대검', '단검', '도끼', '활'],
                optionGenerators: [
                    (level: number) => new Option('둔화', { level: level + 4, time: 6 }),
                    (level: number) => new Option('출혈', { level: level * 2 + 1, time: 10 }),
                    (level: number) => new Option('발화', { level: level + 2, time: 16 }),
                    (level: number) => new Option('독날', { level: level + 1, time: 26 + level }),
                ]
            },
            calcValues: (skill, p) => ({
                cost: 205 + skill.level * 50,
                profAddition: 4,
                maxLevel: 1 + skill.level,
                maxOptionCount: 1 + Math.floor(skill.level / 10)
            }),
            getCooldown: (skill, p) => Math.max(5, 525 - skill.level * 5),
            getCostMessage: (skill, p) => `${Utils.toFixed(skill.getValue(p, 'cost'), 1)}마나`,
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= skill.getValue(p, 'cost'),
            takeCost: (skill, p) => p.mana -= skill.getValue(p, 'cost'),
            getConditionMessage: (skill, p) => '인핸스 웨폰 [ 인벤토리 번호 ] 라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.tickMessage !== null && 
                /^인핸스 웨폰 \d+$/i.test(p.tickMessage),
            getDescription: (skill, p) => ComponentBuilder.texts([
                `옵션 개수가 ${skill.getValue(p, 'maxOptionCount')}개 미만인 무기`,
                ComponentBuilder.text(`(${skill.getConstant('weaponTypes', []).join(', ')})`, { color: 'lightgray' }),
                `에 무작위로 옵션을 부여합니다.`
            ]),
            onStart(skill, p) {
                if(!p.tickMessage) return;
                const spl = p.tickMessage.split(' ');
                const idx = parseInt(spl[2]) - 1;
                const itemStack = p.inventory.getItemStack(idx);
                const maxLevel = skill.getValue(p, 'maxLevel');
                const maxOptionCount = skill.getValue(p, 'maxOptionCount');
                const weaponTypes: string[] = skill.getConstant('weaponTypes', []);
                const generators: ((level: number) => Option)[] = skill.getConstant('optionGenerators', []);

                if(!itemStack) {
                    p.sendRawMessage('[ 빈 슬롯 번호입니다. ]');
                    skill.finish(p);
                    skill.setRemainCooldown(p, 0);
                    return;
                }

                const targetItem = itemStack.count > 1 ? itemStack.item.clone() : itemStack.item;

                if(!weaponTypes.includes(targetItem.type)) {
                    p.sendRawMessage('[ 옵션 부여 가능한 무기 종류가 아닙니다. ]');
                    skill.finish(p);
                    skill.setRemainCooldown(p, 0);
                    return;
                }

                if(targetItem.options.length >= maxOptionCount) {
                    p.sendRawMessage('[ 옵션 최대 개수를 초과했습니다. ]');
                    skill.finish(p);
                    skill.setRemainCooldown(p, 0);
                    return;
                }

                const option = generators[Utils.randomRangeInt(0, generators.length - 1)](skill.level);
                targetItem.options.push(option);

                p.sendMessage(ComponentBuilder.embed([
                    ComponentBuilder.texts([
                        `[ 아이템에 옵션 [ ${option.name} ] ${Utils.getSubjective(option.name)} 부여되었습니다. ]`
                    ])
                ]))

                if(itemStack.count > 1) {
                    p.inventory.setItemCount(idx, itemStack.count - 1);
                    p.inventory.addItem(targetItem);
                }

                skill.prof += skill.getValue(p, 'profAddition');
            },
        },
        {
            name: '갈취',
            isPassive: true,
            maxLevel: 1,
            checkRealizeCondition: p => p.hadClass('광전사'),
            getDescription: (skill, p) => ComponentBuilder.texts([
                `몬스터를 잡을 때 마다 잃은 생명력의 `,
                ComponentBuilder.text('10%', { color: Utils.NUMBER_COLOR }),
                `가 회복됩니다.`
            ]),
            onUpdate(skill, p) {
                const cnt = p.log.getLog(PlayerLog.KILLED_MONSTER_COUNT);
                if(!skill.extras.beforeCnt) 
                    skill.extras.beforeCnt = cnt;
                if(skill.extras.beforeCnt !== cnt) {
                    skill.extras.beforeCnt = cnt;
                    p.heal((p.maxLife - p.life) * .1);
                }
            },
        },
        {
            name: '약점 파괴',
            isPassive: true,
            maxLevel: 1,
            calcValues: (skill, p) => ({
                rangeAttackIncrease: Math.floor(70 + Math.sqrt(p.level * 10))
            }),
            checkRealizeCondition: p => p.hadClass('래피딕 아처'),
            getDescription: (skill, p) => ComponentBuilder.texts([
                `3번째 공격마다 ${AttributeType.RANGE_ATTACK.asSubjective()} `,
                ComponentBuilder.text(`${skill.getValue(p, 'rangeAttackIncrease').toFixed(1)}%`, { color: Utils.PHYSICAL_COLOR }),
                ` 증가합니다.`
            ]),
            onUpdate(skill, p) {
                if(p.log.getLog(PlayerLog.ATTACK_COUNT) % 3 === 0)
                    p.attribute.multiplyValue(AttributeType.RANGE_ATTACK, 1 + skill.getValue(p, 'rangeAttackIncrease') / 100);
            },
        },
        {
            name: '오러 블레이드',
            isPassive: false,
            maxLevel: 15,
            checkRealizeCondition: p => p.hadClass('광전사'),
            calcValues: (skill, p) => ({
                cost: 155 + skill.level * 20,
                increase: 150 + skill.level * 12,
                speed: 400 + skill.level * 200 + p.attribute.getValue(AttributeType.PROJECTILE_SPEED),
                effectLevel: Math.floor(6 + skill.level * 2.5),
                effectTime: 4 + skill.level * 0.5,
                profAddition: Math.max(1, 4 - skill.level * 0.2)
            }),
            getCooldown: (skill, p) => Math.max(5, 25 - skill.level),
            getCostMessage: (skill, p) => `${Utils.toFixed(skill.getValue(p, 'cost'), 1)}마나`,
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= skill.getValue(p, 'cost'),
            takeCost: (skill, p) => p.mana -= skill.getValue(p, 'cost'),
            getConditionMessage: (skill, p) => '목표물 또는 적대적인 몬스터가 있고, 장검 혹은 대검을 들었을 때, 오러 블레이드! 라고 말하기',
            checkCondition: (skill, p) => p.isAlive && 
                ['장검', '대검'].includes(p.slot.hand?.type ?? '') && p.tickMessage === '오러 블레이드!' && 
                (p.currentTarget !== null || p.getLocation().objects.some(o => o instanceof Monster && o.targets.has(p))),
            getDescription: (skill, p) => ComponentBuilder.texts([
                `목표물을 포함한 자신에게 적대적인 몬스터 또는 플레이어 최대 3개체에게 `,
                `${AttributeType.ATTACK.displayName}의 `,
                ComponentBuilder.text(`${skill.getValue(p, 'increase').toFixed(1)}%`, { color: Utils.MAGIC_COLOR }),
                `의 ${AttributeType.MAGIC_ATTACK.asObjective()} 가진 검기를 `,
                ComponentBuilder.text(`${skill.getValue(p, 'speed').toFixed(1)}`, { color: Utils.NUMBER_COLOR }),
                `의 속도로 날립니다.\n`,
                `타격된 적은 ${skill.getValue(p, 'effectTime').toFixed(1)}초간 `,
                Effect.getDescriptionMessage(EffectType.SLOWNESS, skill.getValue(p, 'effectLevel')),
                ` 효과를 부여합니다.`
            ]),
            onStart(skill, p) {
                const targets: Entity[] = [];
                if(p.currentTarget) targets.push(p.currentTarget);
                const hostileMonsters = p.getLocation().objects.filter(o => o !== p.currentTarget && o instanceof Monster && o.targets.has(p));
                targets.splice(targets.length, 0, ...hostileMonsters);
                const hostilePlayers = p.getLocation().getPlayers().filter(p => p.currentTarget === p);
                targets.splice(targets.length, 0, ...hostilePlayers);

                targets.slice(0, 3).forEach(target => {
                    const projectile = new Projectile({
                        name: '검기',
                        owner: p,
                        attributes: {
                            magicAttack: p.attribute.getValue(AttributeType.ATTACK) * skill.getValue(p, 'increase') / 100,
                            speed: skill.getValue(p, 'speed')
                        },
                        onHit(_, victim) {
                            if(victim instanceof LivingEntity) 
                                victim.addEffect(new Effect(EffectType.SLOWNESS, 
                                    skill.getValue(p, 'effectLevel'), skill.getValue(p, 'effectTime'), p));
                        },
                    });
                    projectile.attack(target, { isMagicAttack: true, useAbuserCritical: true });
                });

                skill.prof += skill.getValue(p, 'profAddition');
            },
        },
        {
            name: '세인티 크로스',
            isPassive: false,
            maxLevel: 15,
            checkRealizeCondition: p => p.hasSkill('진실의 성창', s => s.level >= s.maxLevel),
            calcValues: (skill, p) => ({
                cost: 355 + skill.level * 25,
                increase: 130 + skill.level * 8,
                effectTime: 3,
                profAddition: Math.max(1, 5 - skill.level * 0.2)
            }),
            getCooldown: (skill, p) => Math.max(5, 25 - skill.level),
            getCostMessage: (skill, p) => `${Utils.toFixed(skill.getValue(p, 'cost'), 1)}마나`,
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= skill.getValue(p, 'cost'),
            takeCost: (skill, p) => p.mana -= skill.getValue(p, 'cost'),
            getConditionMessage: (skill, p) => '목표물 또는 적대적인 몬스터가 있을 때, 세인티 크로스! 라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.tickMessage === '세인티 크로스!' && 
                (p.currentTarget !== null || p.getLocation().objects.some(o => o instanceof Monster && o.targets.has(p))),
            getDescription: (skill, p) => ComponentBuilder.texts([
                `목표물을 포함한 자신에게 적대적인 몬스터 또는 플레이어 최대 4개체에게 `,
                `${AttributeType.MAGIC_ATTACK.displayName}의 `,
                ComponentBuilder.text(`${skill.getValue(p, 'increase').toFixed(1)}%`, { color: Utils.MAGIC_COLOR }),
                `의 ${AttributeType.MAGIC_ATTACK.asObjective()} 가진 신성한 십자가를 적중시킵니다.\n`,
                `타격된 적은 ${skill.getValue(p, 'effectTime').toFixed(1)}초간 `,
                Effect.getDescriptionMessage(EffectType.BIND, 1),
                ` 효과를 부여합니다.`
            ]),
            onStart(skill, p) {
                const targets: Entity[] = [];
                if(p.currentTarget) targets.push(p.currentTarget);
                const hostileMonsters = p.getLocation().objects.filter(o => o !== p.currentTarget && o instanceof Monster && o.targets.has(p));
                targets.splice(targets.length, 0, ...hostileMonsters);
                const hostilePlayers = p.getLocation().getPlayers().filter(p => p.currentTarget === p);
                targets.splice(targets.length, 0, ...hostilePlayers);

                targets.slice(0, 4).forEach(target => {
                    const projectile = new Projectile({
                        name: '신성한 십자가',
                        owner: p,
                        attributes: {
                            magicAttack: p.attribute.getValue(AttributeType.ATTACK) * skill.getValue(p, 'increase') / 100
                        },
                        onHit(_, victim) {
                            if(victim instanceof LivingEntity) 
                                victim.addEffect(new Effect(EffectType.BIND, 1, skill.getValue(p, 'effectTime'), p));
                        },
                    });
                    projectile.attack(target, { isMagicAttack: true, useAbuserCritical: true, absoluteHit: true });
                });

                skill.prof += skill.getValue(p, 'profAddition');
            },
        },
        {
            name: '멀티샷',
            isPassive: false,
            maxLevel: 23,
            checkRealizeCondition: p => p.hadClass('궁수'),
            calcValues: (skill, p) => ({
                cost: 30 + skill.level * 5,
                increase: 75 + skill.level * 4,
                count: Math.floor(3 + skill.level * 0.07),
                effectLevel: skill.level * 2 + 4,
                profAddition: Math.max(1, 7 - skill.level * 0.2)
            }),
            getCooldown: (skill, p) => Math.max(5, 15 - skill.level * 1.5),
            getCostMessage: (skill, p) => `${Utils.toFixed(skill.getValue(p, 'cost'), 1)}마나`,
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= skill.getValue(p, 'cost'),
            takeCost: (skill, p) => p.mana -= skill.getValue(p, 'cost'),
            getConditionMessage: (skill, p) => `목표물이 있고, 화살이 ${skill.getValue(p, 'count')}개 이상 있고, 활을 들었을 때, 멀티샷! 라고 말하기`,
            checkCondition: (skill, p) => p.isAlive && p.currentTarget !== null && p.tickMessage === '멀티샷!' &&
                p.inventory.hasItem(item => item.type === '화살', skill.getValue(p, 'count')) &&
                p.slot.hand?.type === '활',
            getDescription: (skill, p) => ComponentBuilder.texts([
                `화살을 소모하여 목표물에게 ${AttributeType.RANGE_ATTACK.displayName}의 `,
                ComponentBuilder.text(`${skill.getValue(p, 'increase').toFixed(1)}%`, { color: Utils.PHYSICAL_COLOR }),
                `의 ${AttributeType.ATTACK.asObjective()} 가진 화살을 연속으로 ${skill.getValue(p, 'count')}개 발사합니다.\n`,
                `타격된 적에게 10초 동안 `,
                Effect.getDescriptionMessage(EffectType.BLOOD, skill.getValue(p, 'effectLevel')),
                ` 효과를 부여합니다.`
            ]),
            onStart(skill, p) {
                if(!p.currentTarget) return;
                const cnt = skill.getValue(p, 'count');
                p.inventory.removeItem(item => item.type === '화살', cnt);

                skill.weakExtras.target = p.currentTarget;
                skill.weakExtras.count = cnt;
            },
            onUpdate(skill, p) {
                if(skill.weakExtras.count > 0 && skill.weakExtras.target) {
                    skill.weakExtras.count--;
                    const projectile = new Projectile({ 
                        name: '다중 화살',
                        owner: p,
                        attributes: {
                            attack: p.attribute.getValue(AttributeType.RANGE_ATTACK) * skill.getValue(p, 'increase') / 100,
                            moveSpeed: p.attribute.getValue(AttributeType.PROJECTILE_SPEED)
                        },
                        onHit(_, victim) {
                            if(victim instanceof LivingEntity) 
                                victim.addEffect(new Effect(EffectType.BLOOD, skill.getValue(p, 'effectLevel'), 10, p));
                        },
                    });
                    projectile.attack(skill.weakExtras.target, { useAbuserCritical: true });
                    skill.prof += skill.getValue(p, 'profAddition');
                }
                else skill.finish(p);
            },
        },
        {
            name: '불화살',
            isPassive: false,
            maxLevel: 20,
            checkRealizeCondition: p => p.hadClass('궁수'),
            calcValues: (skill, p) => ({
                cost: 50 + skill.level * 5,
                increase: 150 + skill.level * 9,
                effectLevel: skill.level * 2 + 4,
                profAddition: Math.max(1, 7 - skill.level * 0.2)
            }),
            getCooldown: (skill, p) => Math.max(5, 15 - skill.level * 1.5),
            getCostMessage: (skill, p) => `${Utils.toFixed(skill.getValue(p, 'cost'), 1)}마나`,
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= skill.getValue(p, 'cost'),
            takeCost: (skill, p) => p.mana -= skill.getValue(p, 'cost'),
            getConditionMessage: (skill, p) => `목표물이 있고, 화살이 1개 이상 있고, 활을 들었을 때, 불화살! 이라고 말하기`,
            checkCondition: (skill, p) => p.isAlive && p.currentTarget !== null && p.tickMessage === '불화살!' &&
                p.inventory.hasItem(item => item.type === '화살', 1) &&
                p.slot.hand?.type === '활',
            getDescription: (skill, p) => ComponentBuilder.texts([
                `화살을 소모하여 목표물에게 ${AttributeType.RANGE_ATTACK.displayName}의 `,
                ComponentBuilder.text(`${skill.getValue(p, 'increase').toFixed(1)}%`, { color: Utils.PHYSICAL_COLOR }),
                `의 ${AttributeType.ATTACK.asObjective()} 가진 화살을 발사합니다.\n`,
                `타격된 적에게 30초 동안 `,
                Effect.getDescriptionMessage(EffectType.FIRE, skill.getValue(p, 'effectLevel')),
                ` 효과를 부여합니다.`
            ]),
            onStart(skill, p) {
                if(!p.currentTarget) return;
                p.inventory.removeItem(item => item.type === '화살', 1);

                const projectile = new Projectile({ 
                    name: '불화살',
                    owner: p,
                    attributes: {
                        attack: p.attribute.getValue(AttributeType.RANGE_ATTACK) * skill.getValue(p, 'increase') / 100,
                        moveSpeed: p.attribute.getValue(AttributeType.PROJECTILE_SPEED)
                    },
                    onHit(_, victim) {
                        if(victim instanceof LivingEntity) 
                            victim.addEffect(new Effect(EffectType.FIRE, skill.getValue(p, 'effectLevel'), 30, p));
                    },
                });
                projectile.attack(p.currentTarget, { useAbuserCritical: true });
                skill.prof += skill.getValue(p, 'profAddition');
            },
        },
        {
            name: '단검 투척',
            isPassive: false,
            maxLevel: 5,
            checkRealizeCondition: p => p.log.getLog(PlayerLog.TYPED_ATTACK_COUNT('단검')) >= 150,
            calcValues: (skill, p) => ({
                increase: 50 + skill.level * 5,
                count: 2,
                effectLevel: skill.level * 2 + 4,
                profAddition: Math.max(1, 7 - skill.level * 0.2)
            }),
            getCooldown: (skill, p) => Math.max(5, 15 - skill.level * 1.5),
            getConditionMessage: (skill, p) => `목표물이 있고, 단검을 들었을 때, 단검 투척! 이라고 말하기`,
            checkCondition: (skill, p) => p.isAlive && p.currentTarget !== null && p.tickMessage === '단검 투척!' &&
                p.slot.hand?.type === '단검',
            getDescription: (skill, p) => ComponentBuilder.texts([
                `목표물에게 ${AttributeType.ATTACK.displayName}의 `,
                ComponentBuilder.text(`${skill.getValue(p, 'increase').toFixed(1)}%`, { color: Utils.PHYSICAL_COLOR }),
                `의 ${AttributeType.ATTACK.asObjective()} 가진 단검을 ${skill.getValue(p, 'count')}번 투척합니다.`
            ]),
            onStart(skill, p) {
                if(!p.currentTarget) return;
                const cnt = skill.getValue(p, 'count');

                skill.weakExtras.target = p.currentTarget;
                skill.weakExtras.count = cnt;
            },
            onUpdate(skill, p) {
                if(skill.weakExtras.count > 0 && skill.weakExtras.target) {
                    skill.weakExtras.count--;
                    const projectile = new Projectile({ 
                        name: '투척된 단검',
                        owner: p,
                        attributes: {
                            attack: p.attribute.getValue(AttributeType.RANGE_ATTACK) * skill.getValue(p, 'increase') / 100,
                            moveSpeed: p.attribute.getValue(AttributeType.PROJECTILE_SPEED)
                        }
                    });
                    projectile.attack(skill.weakExtras.target, { useAbuserCritical: true });
                    skill.prof += skill.getValue(p, 'profAddition');
                }
                else skill.finish(p);
            },
        },
        {
            name: '스나이퍼 히트',
            isPassive: false,
            maxLevel: 25,
            checkRealizeCondition: p => p.hadClass('궁수'),
            calcValues: (skill, p) => ({
                cost: 30 + skill.level * 5,
                increase: 260 + skill.level * 16,
                effectLevel: skill.level * 2 + 4,
                profAddition: Math.max(1, 7 - skill.level * 0.2)
            }),
            getCooldown: (skill, p) => Math.max(5, 75 - skill.level * 1.5),
            getCostMessage: (skill, p) => `${Utils.toFixed(skill.getValue(p, 'cost'), 1)}마나`,
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= skill.getValue(p, 'cost'),
            takeCost: (skill, p) => p.mana -= skill.getValue(p, 'cost'),
            getConditionMessage: (skill, p) => `목표물이 있고, 화살이 1개 이상 있고, 활을 들었을 때, 스나이퍼 히트! 라고 말하기`,
            checkCondition: (skill, p) => p.isAlive && p.currentTarget !== null && p.tickMessage === '스나이퍼 히트!' &&
                p.inventory.hasItem(item => item.type === '화살', 1) &&
                p.slot.hand?.type === '활',
            getDescription: (skill, p) => ComponentBuilder.texts([
                `1초 동안의 정신 집중 후, ${AttributeType.RANGE_ATTACK.displayName}의 `,
                ComponentBuilder.text(`${skill.getValue(p, 'increase').toFixed(1)}%`, { color: Utils.PHYSICAL_COLOR }),
                `의 ${AttributeType.ATTACK.asObjective()} 가진 화살을 무조건 적중시킵니다.\n`,
                `타격된 적에게 3초 동안 `,
                Effect.getDescriptionMessage(EffectType.STUN, 1),
                ` 효과를 부여합니다.\n`,
                `정신 집중 동안 말을 하면 정신 집중이 풀리고 재사용 대기시간의 80%를 돌려받습니다.`
            ]),
            onStart(skill, p) {
                if(!p.currentTarget) return;
                p.inventory.removeItem(item => item.type === '화살', 1);

                skill.extras.timer = 1;
                skill.weakExtras.target = p.currentTarget;

                p.sendMessage(ComponentBuilder.embed([
                    ComponentBuilder.text('[ 정신 집중 중... ]')
                ], 'lightgray'));
            },
            onUpdate(skill, p) {
                if(skill.weakExtras.target) {
                    if(skill.extras.timer > 0) {
                        skill.extras.timer -= Time.deltaTime;
                        if(p.tickMessage) {
                            p.sendRawMessage('[ 정신 집중이 풀렸다... ]');
                            skill.finish(p);
                            skill.setRemainCooldown(p, skill.getCooldown(p) * 0.2);
                        }
                        return;
                    }

                    const projectile = new Projectile({ 
                        name: '저격 화살',
                        owner: p,
                        attributes: {
                            attack: p.attribute.getValue(AttributeType.RANGE_ATTACK) * skill.getValue(p, 'increase') / 100
                        },
                        onHit(_, victim) {
                            if(victim instanceof LivingEntity) 
                                victim.addEffect(new Effect(EffectType.STUN, 1, 3, p));
                        },
                    });
                    projectile.attack(skill.weakExtras.target, { useAbuserCritical: true, absoluteHit: true });
                    skill.prof += skill.getValue(p, 'profAddition');
                    skill.finish(p);
                }
                else skill.finish(p);
            },
        },
        {
            name: '신념의 방패',
            isPassive: false,
            maxLevel: 15,
            checkRealizeCondition: p => p.hadClass('성기사'),
            calcValues: (skill, p) => ({
                cost: 105 + skill.level * 8,
                time: 9 + skill.level * 0.2,
                defendIncrease: 25 + skill.level * 11,
                defendAddition: 100 + skill.level * 3,
                profAddition: Math.max(1, 4 - skill.level * 0.2)
            }),
            getCooldown: (skill, p) => Math.max(5, 30 - skill.level * 0.6),
            getCostMessage: (skill, p) => `${Utils.toFixed(skill.getValue(p, 'cost'), 1)}마나`,
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= skill.getValue(p, 'cost'),
            takeCost: (skill, p) => p.mana -= skill.getValue(p, 'cost'),
            getConditionMessage: (skill, p) => '신념의 방패! 라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.tickMessage === '신념의 방패!',
            getDescription: (skill, p) => ComponentBuilder.texts([
                `${skill.getValue(p, 'time').toFixed(1)}초 동안 `, 
                `${AttributeType.MAGIC_RESISTANCE.asWith()} ${AttributeType.DEFEND.asSubjective()} `,
                ComponentBuilder.text(`${skill.getValue(p, 'defendIncrease').toFixed(1)}% + ${skill.getValue(p, 'defendAddition').toFixed(1)}`, 
                    { color: Utils.NUMBER_COLOR }),
                ` 만큼 증가합니다.`
            ]),
            onStart(skill, p) {
                skill.extras.timer = skill.getValue(p, 'time');
                skill.prof += skill.getValue(p, 'profAddition');
                p.sendMessage(ComponentBuilder.embed([
                    ComponentBuilder.text('[ 신념이 만들어낸 방패가 잠시동안 당신을 지켜줍니다! ]')
                ], 'yellow'));
            },
            onUpdate(skill, p) {
                if((skill.extras.timer -= Time.deltaTime) <= 0) skill.finish(p);
                else {
                    const increase = skill.getValue(p, 'defendIncrease') / 100 + 1;
                    const addition = skill.getValue(p, 'defendAddition');

                    p.attribute.multiplyValue(AttributeType.DEFEND, increase);
                    p.attribute.multiplyValue(AttributeType.MAGIC_RESISTANCE, increase);
                    p.attribute.addValue(AttributeType.DEFEND, addition);
                    p.attribute.addValue(AttributeType.MAGIC_RESISTANCE, addition);
                }
            },
        },
        {
            name: '굳건한 의지',
            isPassive: false,
            maxLevel: 13,
            checkRealizeCondition: p => p.hadClass('전사'),
            calcValues: (skill, p) => ({
                time: 10 + skill.level * 0.1,
                shield: 5000 + p.level * 54 * (skill.level * 0.195 + 1),
                profAddition: Math.max(1, 4 - skill.level * 0.2)
            }),
            getCooldown: (skill, p) => Math.max(5, 35 - skill.level * 0.4),
            getConditionMessage: (skill, p) => '굳건한 의지! 라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.tickMessage === '굳건한 의지!',
            getDescription: (skill, p) => ComponentBuilder.texts([
                `${skill.getValue(p, 'time').toFixed(1)}초 동안 모든 피해를 방어하는 `,
                ComponentBuilder.text(`${skill.getValue(p, 'shield').toFixed(1)}`, 
                    { color: Utils.NUMBER_COLOR }),
                ` 만큼의 보호막을 생성합니다.`
            ]),
            onStart(skill, p) {
                p.addShield('determination', skill.getValue(p, 'shield'), skill.getValue(p, 'time'));
                skill.prof += skill.getValue(p, 'profAddition');
                p.sendMessage(ComponentBuilder.embed([
                    ComponentBuilder.text('[ 굳건한 의지로 공격을 버팁니다! ]')
                ], '#990000'));
            },
        },
        {
            name: '파이어 볼',
            isPassive: false,
            maxLevel: 18,
            checkRealizeCondition: p => p.hadClass('마법사'),
            calcValues: (skill, p) => ({
                cost: 200 + skill.level * 8,
                increase: 130,
                base: 753 + skill.level * 11,
                effectTime: 13 + skill.level * 0.3,
                effectLevel: 3 + skill.level * 2,
                profAddition: Math.max(1, 3.6 - skill.level * 0.1)
            }),
            getCooldown: (skill, p) => Math.max(5, 15 - skill.level * 0.6),
            getCostMessage: (skill, p) => `${Utils.toFixed(skill.getValue(p, 'cost'), 1)}마나`,
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= skill.getValue(p, 'cost'),
            takeCost: (skill, p) => p.mana -= skill.getValue(p, 'cost'),
            getConditionMessage: (skill, p) => '목표물이 있을 때, 파이어 볼! 이라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.currentTarget !== null && p.tickMessage === '파이어 볼!',
            getDescription: (skill, p) => ComponentBuilder.texts([
                `목표물에게 화염구를 날려 ${AttributeType.MAGIC_ATTACK.displayName}의 `,
                ComponentBuilder.text(`${skill.getValue(p, 'increase').toFixed(1)}% + ${skill.getValue(p, 'base').toFixed(1)}`, 
                    { color: Utils.MAGIC_COLOR }),
                ` 만큼의 마법 피해를 입힙니다.\n`,
                `적중한 대상에게는 ${skill.getValue(p, 'effectTime').toFixed(1)}초 동안 `,
                Effect.getDescriptionMessage(EffectType.FIRE, skill.getValue(p, 'effectLevel')),
                ` 효과를 부여합니다.`
            ]),
            onStart(skill, p) {
                if(!p.currentTarget) return;
                const projectile = new Projectile({
                    name: '화염구',
                    owner: p,
                    attributes: {
                        magicAttack: skill.getValue(p, 'base') + 
                            p.attribute.getValue(AttributeType.MAGIC_ATTACK) * skill.getValue(p, 'increase') / 100 ,
                        moveSpeed: 500 + p.level * 5
                    },
                    onHit(_, victim) {
                        if(victim instanceof LivingEntity) victim.addEffect(
                            new Effect(EffectType.FIRE, skill.getValue(p, 'effectLevel'), skill.getValue(p, 'effectTime'), p));
                    },
                });
                projectile.attack(p.currentTarget, { isMagicAttack: true, useAbuserCritical: true });
                skill.prof += skill.getValue(p, 'profAddition');
            }
        },
        {
            name: '파이어 랜스',
            isPassive: false,
            maxLevel: 25,
            checkRealizeCondition: p => p.hasSkill('파이어 볼', s => s.level >= s.maxLevel * 0.7),
            calcValues: (skill, p) => ({
                cost: 400 + skill.level * 17,
                increase: 150,
                base: 1753 + skill.level * 11,
                effectTime: 13 + skill.level * 0.3,
                effectLevel: 18 + skill.level * 2,
                profAddition: Math.max(1, 3.6 - skill.level * 0.1)
            }),
            getCooldown: (skill, p) => Math.max(5, 15 - skill.level * 0.6),
            getCostMessage: (skill, p) => `${Utils.toFixed(skill.getValue(p, 'cost'), 1)}마나`,
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= skill.getValue(p, 'cost'),
            takeCost: (skill, p) => p.mana -= skill.getValue(p, 'cost'),
            getConditionMessage: (skill, p) => '목표물이 있을 때, 파이어 랜스! 라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.currentTarget !== null && p.tickMessage === '파이어 랜스!',
            getDescription: (skill, p) => ComponentBuilder.texts([
                `목표물에게 화염창을 날려 ${AttributeType.MAGIC_ATTACK.displayName}의 `,
                ComponentBuilder.text(`${skill.getValue(p, 'increase').toFixed(1)}% + ${skill.getValue(p, 'base').toFixed(1)}`, 
                    { color: Utils.MAGIC_COLOR }),
                ` 만큼의 마법 피해를 입힙니다.\n`,
                `적중한 대상에게는 ${skill.getValue(p, 'effectTime').toFixed(1)}초 동안 `,
                Effect.getDescriptionMessage(EffectType.FIRE, skill.getValue(p, 'effectLevel')),
                ` 효과를 부여합니다.`
            ]),
            onStart(skill, p) {
                if(!p.currentTarget) return;
                const projectile = new Projectile({
                    name: '화염창',
                    owner: p,
                    attributes: {
                        magicAttack: skill.getValue(p, 'base') + 
                            p.attribute.getValue(AttributeType.MAGIC_ATTACK) * skill.getValue(p, 'increase') / 100 ,
                        moveSpeed: 500 + p.level * 10
                    },
                    onHit(_, victim) {
                        if(victim instanceof LivingEntity) victim.addEffect(
                            new Effect(EffectType.FIRE, skill.getValue(p, 'effectLevel'), skill.getValue(p, 'effectTime'), p));
                    },
                });
                projectile.attack(p.currentTarget, { isMagicAttack: true, useAbuserCritical: true });
                skill.prof += skill.getValue(p, 'profAddition');
            }
        },
        {
            name: '진실의 성창',
            isPassive: false,
            maxLevel: 20,
            checkRealizeCondition: p => p.hadClass('세인티스 팔라딘'),
            calcValues: (skill, p) => ({
                cost: skill.level * 107,
                increase: 150,
                maxLifeRate: 20,
                effectTime: 5 + skill.level * 0.3,
                effectLevel: 18 + skill.level * 2,
                profAddition: Math.max(1, 3.6 - skill.level * 0.1)
            }),
            getCooldown: (skill, p) => Math.max(5, 15 - skill.level * 0.6),
            getCostMessage: (skill, p) => `${Utils.toFixed(skill.getValue(p, 'cost'), 1)}마나`,
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= skill.getValue(p, 'cost'),
            takeCost: (skill, p) => p.mana -= skill.getValue(p, 'cost'),
            getConditionMessage: (skill, p) => '목표물이 있을 때, 진실의 성창! 라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.currentTarget !== null && p.tickMessage === '진실의 성창!',
            getDescription: (skill, p) => ComponentBuilder.texts([
                `목표물에게 신성한 성창을 날려 ${AttributeType.MAGIC_ATTACK.displayName}의 `,
                ComponentBuilder.text(`${skill.getValue(p, 'increase').toFixed(1)}%`, 
                    { color: Utils.MAGIC_COLOR }), 
                ` + ${AttributeType.MAX_LIFE.displayName}의 `,
                ComponentBuilder.text(`${skill.getValue(p, 'maxLifeRate').toFixed(1)}%`, 
                    { color: Utils.NUMBER_COLOR }),
                ` 만큼의 마법 피해를 입힙니다.\n`,
                `적중한 대상에게는 ${skill.getValue(p, 'effectTime').toFixed(1)}초 동안 `,
                Effect.getDescriptionMessage(EffectType.SLOWNESS, skill.getValue(p, 'effectLevel')),
                ` 효과를 부여합니다.`
            ]),
            onStart(skill, p) {
                if(!p.currentTarget) return;
                const projectile = new Projectile({
                    name: '신성한 성창',
                    owner: p,
                    attributes: {
                        magicAttack: p.attribute.getValue(AttributeType.MAX_LIFE) * skill.getValue(p, 'maxLifeRate') / 100 +
                            p.attribute.getValue(AttributeType.MAGIC_ATTACK) * skill.getValue(p, 'increase') / 100 ,
                        moveSpeed: 2500 + p.level * 10
                    },
                    onHit(_, victim) {
                        if(victim instanceof LivingEntity) victim.addEffect(
                            new Effect(EffectType.SLOWNESS, skill.getValue(p, 'effectLevel'), skill.getValue(p, 'effectTime'), p));
                    },
                });
                projectile.attack(p.currentTarget, { isMagicAttack: true, useAbuserCritical: true });
                skill.prof += skill.getValue(p, 'profAddition');
            }
        },
        {
            name: '윈드 커터',
            isPassive: false,
            maxLevel: 20,
            checkRealizeCondition: p => p.hadClass('마법사') && p.stat.getStat(StatType.SPELL) > 100,
            calcValues: (skill, p) => ({
                cost: 150 + skill.level * 8,
                increase: 130,
                base: 153 + skill.level * 110,
                effectTime: 13 + skill.level * 0.3,
                effectLevel: Math.floor(5 + skill.level * 0.6),
                profAddition: Math.max(1, 3.6 - skill.level * 0.1)
            }),
            getCooldown: (skill, p) => Math.max(5, 15 - skill.level * 0.6),
            getCostMessage: (skill, p) => `${Utils.toFixed(skill.getValue(p, 'cost'), 1)}마나`,
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= skill.getValue(p, 'cost'),
            takeCost: (skill, p) => p.mana -= skill.getValue(p, 'cost'),
            getConditionMessage: (skill, p) => '목표물이 있을 때, 윈드 커터! 라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.currentTarget !== null && p.tickMessage === '윈드 커터!',
            getDescription: (skill, p) => ComponentBuilder.texts([
                `목표물에게 바람 칼날을 날려 ${AttributeType.MAGIC_ATTACK.displayName}의 `,
                ComponentBuilder.text(`${skill.getValue(p, 'increase').toFixed(1)}% + ${skill.getValue(p, 'base').toFixed(1)}`, 
                    { color: Utils.MAGIC_COLOR }),
                ` 만큼의 마법 피해를 입힙니다.\n`,
                `적중한 대상에게는 ${skill.getValue(p, 'effectTime').toFixed(1)}초 동안 `,
                Effect.getDescriptionMessage(EffectType.BLOOD, skill.getValue(p, 'effectLevel')),
                ` 효과를 부여합니다.`
            ]),
            onStart(skill, p) {
                if(!p.currentTarget) return;
                const projectile = new Projectile({
                    name: '바람 칼날',
                    owner: p,
                    attributes: {
                        magicAttack: skill.getValue(p, 'base') + 
                            p.attribute.getValue(AttributeType.MAGIC_ATTACK) * skill.getValue(p, 'increase') / 100 ,
                        moveSpeed: 500 + p.level * 7
                    },
                    onHit(_, victim) {
                        if(victim instanceof LivingEntity) victim.addEffect(
                            new Effect(EffectType.BLOOD, skill.getValue(p, 'effectLevel'), skill.getValue(p, 'effectTime'), p));
                    },
                });
                projectile.attack(p.currentTarget, { isMagicAttack: true, useAbuserCritical: true });
                skill.prof += skill.getValue(p, 'profAddition');
            }
        },
        {
            name: '토네이도',
            isPassive: false,
            maxLevel: 20,
            checkRealizeCondition: p => p.hadClass('마법사') && p.hasSkill('윈드 커터', s => s.level >= s.maxLevel * 0.8),
            calcValues: (skill, p) => ({
                cost: 150 + skill.level * 8,
                increase: 100,
                base: 1353 + skill.level * 170,
                effectTime: 2,
                profAddition: Math.max(1, 3.6 - skill.level * 0.1)
            }),
            getCooldown: (skill, p) => Math.max(5, 25 - skill.level * 0.5),
            getCostMessage: (skill, p) => `${Utils.toFixed(skill.getValue(p, 'cost'), 1)}마나`,
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= skill.getValue(p, 'cost'),
            takeCost: (skill, p) => p.mana -= skill.getValue(p, 'cost'),
            getConditionMessage: (skill, p) => '목표물이 있을 때, 토네이도! 라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.currentTarget !== null && p.tickMessage === '토네이도!',
            getDescription: (skill, p) => ComponentBuilder.texts([
                `목표물에게 바람 폭풍을 날려 ${AttributeType.MAGIC_ATTACK.displayName}의 `,
                ComponentBuilder.text(`${skill.getValue(p, 'increase').toFixed(1)}% + ${skill.getValue(p, 'base').toFixed(1)}`, 
                    { color: Utils.MAGIC_COLOR }),
                ` 만큼의 마법 피해를 입힙니다.\n`,
                `적중한 대상에게는 ${skill.getValue(p, 'effectTime').toFixed(1)}초 동안 `,
                Effect.getDescriptionMessage(EffectType.AIRBORNE, skill.getValue(p, 'effectLevel')),
                ` 효과를 부여합니다.`
            ]),
            onStart(skill, p) {
                if(!p.currentTarget) return;
                const projectile = new Projectile({
                    name: '바람 폭풍',
                    owner: p,
                    attributes: {
                        magicAttack: skill.getValue(p, 'base') + 
                            p.attribute.getValue(AttributeType.MAGIC_ATTACK) * skill.getValue(p, 'increase') / 100 ,
                        moveSpeed: 500 + p.level * 7
                    },
                    onHit(_, victim) {
                        if(victim instanceof LivingEntity) victim.addEffect(
                            new Effect(EffectType.AIRBORNE, 1, skill.getValue(p, 'effectTime'), p));
                    },
                });
                projectile.attack(p.currentTarget, { isMagicAttack: true, useAbuserCritical: true });
                skill.prof += skill.getValue(p, 'profAddition');
            }
        },
        {
            name: '일렉트릭 쇼크',
            isPassive: false,
            maxLevel: 15,
            checkRealizeCondition: p => p.hadClass('마법사') && p.hasSkill('파이어 볼', s => s.level >= s.maxLevel),
            calcValues: (skill, p) => ({
                cost: 550 + skill.level * 18,
                increase: 150,
                base: 653 + skill.level * 30,
                effectTime: 2 + skill.level * 0.1,
                profAddition: Math.max(1, 3.6 - skill.level * 0.1)
            }),
            getCooldown: (skill, p) => Math.max(5, 45 - skill.level * 0.5),
            getCostMessage: (skill, p) => `${Utils.toFixed(skill.getValue(p, 'cost'), 1)}마나`,
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= skill.getValue(p, 'cost'),
            takeCost: (skill, p) => p.mana -= skill.getValue(p, 'cost'),
            getConditionMessage: (skill, p) => '목표물이 있을 때, 일렉트릭 쇼크! 라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.currentTarget !== null && p.tickMessage === '일렉트릭 쇼크!',
            getDescription: (skill, p) => ComponentBuilder.texts([
                `목표물에게 엄청나게 빠른 전기 충격파를 날려 ${AttributeType.MAGIC_ATTACK.displayName}의 `,
                ComponentBuilder.text(`${skill.getValue(p, 'increase').toFixed(1)}% + ${skill.getValue(p, 'base').toFixed(1)}`, 
                    { color: Utils.MAGIC_COLOR }),
                ` 만큼의 마법 피해를 입힙니다.\n`,
                `적중한 대상에게는 ${skill.getValue(p, 'effectTime').toFixed(1)}초 동안 `,
                Effect.getDescriptionMessage(EffectType.STUN, skill.getValue(p, 'effectLevel')),
                ` 효과를 부여합니다.`
            ]),
            onStart(skill, p) {
                if(!p.currentTarget) return;
                const projectile = new Projectile({
                    name: '전기 충격파',
                    owner: p,
                    attributes: {
                        magicAttack: skill.getValue(p, 'base') + 
                            p.attribute.getValue(AttributeType.MAGIC_ATTACK) * skill.getValue(p, 'increase') / 100 ,
                        moveSpeed: 10000000
                    },
                    onHit(_, victim) {
                        if(victim instanceof LivingEntity) victim.addEffect(
                            new Effect(EffectType.STUN, 1, skill.getValue(p, 'effectTime'), p));
                    },
                });
                projectile.attack(p.currentTarget, { isMagicAttack: true, useAbuserCritical: true });
                skill.prof += skill.getValue(p, 'profAddition');
            }
        },
        {
            name: '오버차지',
            isPassive: false,
            maxLevel: 15,
            checkRealizeCondition: p => p.hadClass('마법사') && p.hasSkill('일렉트릭 쇼크', s => s.level >= s.maxLevel * 0.5),
            calcValues: (skill, p) => ({
                cost: 550 + skill.level * 18,
                increase: 20,
                effectTime: 0.3 + skill.level * 0.05,
                chance: 40,
                profAddition: Math.max(1, 3.6 - skill.level * 0.1)
            }),
            getCooldown: (skill, p) => Math.max(5, 55 - skill.level * 0.5),
            getCostMessage: (skill, p) => `${Utils.toFixed(skill.getValue(p, 'cost'), 1)}마나`,
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= skill.getValue(p, 'cost'),
            takeCost: (skill, p) => p.mana -= skill.getValue(p, 'cost'),
            getConditionMessage: (skill, p) => '오버차지! 라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.tickMessage === '오버차지!',
            getDescription: (skill, p) => ComponentBuilder.texts([
                `15초 동안 몸이 과충전 상태가 되어서, ${AttributeType.MAGIC_ATTACK.asSubjective()} `,
                ComponentBuilder.text(skill.getValue(p, 'increase').toFixed(1) + '%', { color: Utils.MAGIC_COLOR }),
                ` 증가하며, 모든 투사체에 ${skill.getValue(p, 'chance').toFixed(1)}% 확률로 ` + 
                `${skill.getValue(p, 'effectTime').toFixed(1)}초의 `,
                Effect.getDescriptionMessage(EffectType.STUN, 1),
                ` 효과가 부여됩니다.`
            ]),
            onStart(skill, p) {
                p.sendMessage(ComponentBuilder.embed([
                    ComponentBuilder.text(`[ 오버차지! ]`)
                ], 'cyan'))
                skill.prof += skill.getValue(p, 'profAddition');
                skill.extras.timer = 15;
            },
            onUpdate(skill, p) {
                if((skill.extras.timer -= Time.deltaTime) <= 0) {
                    p.sendRawMessage('[ 과충전 상태가 끝났습니다.. ]');
                    skill.finish(p);
                }
                else {
                    p.attribute.multiplyValue(AttributeType.MAGIC_ATTACK, 1 + skill.getValue(p, 'increase') / 100);
                    p.registerTrigger(new Trigger({
                        onProjectileHit(_, __, victim) {
                            if(victim instanceof LivingEntity && 
                                Math.random() < skill.getValue(p, 'chance') / 100) {
                                victim.addEffect(new Effect(EffectType.STUN, 1, skill.getValue(p, 'effectTime'), p));
                            }
                        },
                    }))
                }
            },
        },
        {
            name: '매직 미사일',
            isPassive: false,
            maxLevel: 50,
            checkRealizeCondition: p => p.hadClass('마법사'),
            calcValues: (skill, p) => ({
                cost: 60 + skill.level * 1,
                increase: 120,
                base: 100 + skill.level * 50,
                profAddition: Math.max(1, 2.6 - skill.level * 0.1)
            }),
            getCooldown: (skill, p) => Math.max(0.5, 6 - skill.level * 0.1),
            getCostMessage: (skill, p) => `${Utils.toFixed(skill.getValue(p, 'cost'), 1)}마나`,
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= skill.getValue(p, 'cost'),
            takeCost: (skill, p) => p.mana -= skill.getValue(p, 'cost'),
            getConditionMessage: (skill, p) => '목표물이 있을 때, 매직 미사일! 이라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.currentTarget !== null && p.tickMessage === '매직 미사일!',
            getDescription: (skill, p) => ComponentBuilder.texts([
                `목표물에게 마법 탄환을 날려 ${AttributeType.MAGIC_ATTACK.displayName}의 `,
                ComponentBuilder.text(`${skill.getValue(p, 'increase').toFixed(1)}% + ${skill.getValue(p, 'base').toFixed(1)}`, 
                    { color: Utils.MAGIC_COLOR }),
                ` 만큼의 마법 피해를 입힙니다.`
            ]),
            onStart(skill, p) {
                if(!p.currentTarget) return;
                const projectile = new Projectile({
                    name: '마법 탄환',
                    owner: p,
                    attributes: {
                        magicAttack: skill.getValue(p, 'base') + 
                            p.attribute.getValue(AttributeType.MAGIC_ATTACK) * skill.getValue(p, 'increase') / 100 ,
                        moveSpeed: 500 + p.level * 5
                    },
                });
                projectile.attack(p.currentTarget, { isMagicAttack: true, useAbuserCritical: true });
                skill.prof += skill.getValue(p, 'profAddition');
            }
        },
        {
            name: '아이스 볼트',
            isPassive: false,
            maxLevel: 18,
            checkRealizeCondition: p => p.hadClass('마법사'),
            calcValues: (skill, p) => ({
                cost: 250 + skill.level * 5,
                increase: 120,
                base: 553 + skill.level * 35,
                effectTime: 16 + skill.level * 0.5,
                effectLevel: 5 + skill.level * 2,
                profAddition: Math.max(1, 4 - skill.level * 0.1)
            }),
            getCooldown: (skill, p) => Math.max(5, 15 - skill.level * 0.5),
            getCostMessage: (skill, p) => `${Utils.toFixed(skill.getValue(p, 'cost'), 1)}마나`,
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= skill.getValue(p, 'cost'),
            takeCost: (skill, p) => p.mana -= skill.getValue(p, 'cost'),
            getConditionMessage: (skill, p) => '목표물이 있을 때, 아이스 볼트! 이라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.currentTarget !== null && p.tickMessage === '아이스 볼트!',
            getDescription: (skill, p) => ComponentBuilder.texts([
                `목표물에게 얼음 구체를 날려 ${AttributeType.MAGIC_ATTACK.displayName}의 `,
                ComponentBuilder.text(`${skill.getValue(p, 'increase').toFixed(1)}% + ${skill.getValue(p, 'base').toFixed(1)}`, 
                    { color: Utils.MAGIC_COLOR }),
                ` 만큼의 마법 피해를 입힙니다.\n`,
                `적중한 대상에게는 ${skill.getValue(p, 'effectTime').toFixed(1)}초 동안 `,
                Effect.getDescriptionMessage(EffectType.FROZEN, skill.getValue(p, 'effectLevel')),
                ` 효과를 부여합니다.`
            ]),
            onStart(skill, p) {
                if(!p.currentTarget) return;
                const projectile = new Projectile({
                    name: '얼음 구체',
                    owner: p,
                    attributes: {
                        magicAttack: skill.getValue(p, 'base') + 
                            p.attribute.getValue(AttributeType.MAGIC_ATTACK) * skill.getValue(p, 'increase') / 100 ,
                        moveSpeed: 500 + p.level * 5
                    },
                    onHit(_, victim) {
                        if(victim instanceof LivingEntity) victim.addEffect(
                            new Effect(EffectType.FROZEN, skill.getValue(p, 'effectLevel'), skill.getValue(p, 'effectTime'), p));
                    },
                });
                projectile.attack(p.currentTarget, { isMagicAttack: true, useAbuserCritical: true });
                skill.prof += skill.getValue(p, 'profAddition');
            }
        },
        {
            name: '힐',
            isPassive: false,
            maxLevel: 30,
            checkRealizeCondition: p => p.hadClass('성기사'),
            calcValues: (skill, p) => ({
                cost: 60 + skill.level * 7,
                increase: 60,
                base: 403 + skill.level * 35,
                damageIncrease: 2,
                profAddition: Math.max(1, 4 - skill.level * 0.1)
            }),
            getCooldown: (skill, p) => Math.max(5, 20 - skill.level * 0.2),
            getCostMessage: (skill, p) => `${Utils.toFixed(skill.getValue(p, 'cost'), 1)}마나`,
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= skill.getValue(p, 'cost'),
            takeCost: (skill, p) => p.mana -= skill.getValue(p, 'cost'),
            getConditionMessage: (skill, p) => '힐! 또는 셀프힐! 이라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.tickMessage !== null && ['힐!', '셀프힐!'].includes(p.tickMessage),
            getDescription: (skill, p) => ComponentBuilder.texts([
                `목표물을 ${AttributeType.MAGIC_ATTACK.displayName}의 `,
                ComponentBuilder.text(`${skill.getValue(p, 'increase').toFixed(1)}% + ${skill.getValue(p, 'base').toFixed(1)}`, 
                    { color: Utils.MAGIC_COLOR }),
                `만큼 회복시킵니다.\n`,
                `목표물이 없거나, 셀프힐! 이라고 외쳤다면 목표물이 아닌 자기 자신을 치유시킵니다.\n`,
                `언데드 또는 마계 타입 몬스터에게 사용하면 ${skill.getValue(p, 'damageIncrease').toFixed(1)}배의 고정 피해를 입힙니다.`
            ]),
            onStart(skill, p) {
                let target = p.currentTarget;
                if(p.tickMessage === '셀프힐!' || !target) target = p;

                const amount = skill.getValue(p, 'base') + 
                    p.attribute.getValue(AttributeType.MAGIC_ATTACK) * skill.getValue(p, 'increase') / 100;

                if(target instanceof Monster && 
                    (target.hasType(MonsterType.DEVILDOM) || target.hasType(MonsterType.UNDEAD))) {
                    const increased = skill.getValue(p, 'damageIncrease') * amount;
                    target.damage(increased, p);
                    p.sendMessage(ComponentBuilder.texts([
                        `[ ${target.getName()}에게 ${increased.toFixed(1)}만큼 피해를 주었습니다! ]\n`,
                        ComponentBuilder.progressBar(target.life, target.maxLife, 'percent')
                    ]));
                }
                else {
                    const healed = target.heal(amount, p);
                    p.sendMessage(ComponentBuilder.texts([
                        `[ ${Utils.asObjective(target.getName() + 
                            (target instanceof Player ? '님': ''))} ${healed.toFixed(1)}만큼 회복시켰습니다! ]\n`,
                        ComponentBuilder.progressBar(target.life, target.maxLife, 'percent', Utils.MAIN_COLOR)
                    ]));
                }

                skill.prof += skill.getValue(p, 'profAddition');
            },
        },
        {
            name: '큐어',
            isPassive: false,
            maxLevel: 30,
            checkRealizeCondition: p => p.hasSkill('힐', s => s.level >= s.maxLevel),
            calcValues: (skill, p) => ({
                cost: 600 + skill.level * 30,
                removeMaxLevel: skill.level * 3 + 5,
                profAddition: Math.max(1, 10 - skill.level * 0.1)
            }),
            getCooldown: (skill, p) => Math.max(5, 500 - skill.level * 2),
            getCostMessage: (skill, p) => `${Utils.toFixed(skill.getValue(p, 'cost'), 1)}마나`,
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= skill.getValue(p, 'cost'),
            takeCost: (skill, p) => p.mana -= skill.getValue(p, 'cost'),
            getConditionMessage: (skill, p) => '큐어! 또는 셀프큐어! 이라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.tickMessage !== null && ['큐어!', '셀프큐어!'].includes(p.tickMessage),
            getDescription: (skill, p) => ComponentBuilder.texts([
                `목표물에게 걸린 `,
                ComponentBuilder.text(`${skill.getValue(p, 'removeMaxLevel').toFixed(0)}`, 
                    { color: Utils.NUMBER_COLOR }),
                `레벨 이하의 모든 디버프를 제거합니다.\n`,
                `목표물이 없거나, 셀프큐어! 라고 외쳤다면 목표물이 아닌 자기 자신에게 적용시킵니다.`
            ]),
            onStart(skill, p) {
                let target = p.currentTarget;
                const maxLevel = skill.getValue(p, 'removeMaxLevel');
                if(p.tickMessage === '셀프큐어!' || !target) target = p;

                if(target instanceof LivingEntity) {
                    target.filterEffects(eff => !(eff.isDebuff && eff.level < maxLevel));
                }
                p.sendMessage(ComponentBuilder.embed([
                    ComponentBuilder.text(`[ 정화시켰습니다! ]`)
                ], Utils.MAIN_COLOR));

                skill.prof += skill.getValue(p, 'profAddition');
            },
        },
        {
            name: '헤이스트',
            isPassive: false,
            maxLevel: 10,
            checkRealizeCondition: p => p.hasSkill('윈드 커터', s => s.level >= s.maxLevel * 0.3),
            calcValues: (skill, p) => ({
                cost: 560 + skill.level * 15,
                effectLevel: skill.level * 2 + 1,
                effectTime: 30 + skill.level,
                profAddition: Math.max(1, 4 - skill.level * 0.1)
            }),
            getCooldown: (skill, p) => Math.max(5, 30 - skill.level * 0.2),
            getCostMessage: (skill, p) => `${Utils.toFixed(skill.getValue(p, 'cost'), 1)}마나`,
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= skill.getValue(p, 'cost'),
            takeCost: (skill, p) => p.mana -= skill.getValue(p, 'cost'),
            getConditionMessage: (skill, p) => '헤이스트! 또는 셀프헤이스트! 이라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.tickMessage !== null && ['헤이스트!', '셀프헤이스트!'].includes(p.tickMessage),
            getDescription: (skill, p) => ComponentBuilder.texts([
                `목표물에게 ${skill.getValue(p, 'effectTime')}초 동안 `,
                Effect.getDescriptionMessage(EffectType.SWIFTNESS, skill.getValue(p, 'effectLevel')),
                ` 효과를 부여합니다.\n`,
                `목표물이 없거나, 셀프헤이스트! 라고 외쳤다면 목표물이 아닌 자기 자신에게 적용시킵니다.`
            ]),
            onStart(skill, p) {
                let target = p.currentTarget;
                if(p.tickMessage === '셀프헤이스트!' || !target) target = p;

                if(target instanceof LivingEntity) 
                    target.addEffect(new Effect(EffectType.SWIFTNESS, 
                        skill.getValue(p, 'effectLevel'), 
                        skill.getValue(p, 'effectTime'), p));
                p.sendMessage(ComponentBuilder.texts([
                    `[ ${Utils.asObjective(target.getName() + 
                        (target instanceof Player ? '님': ''))}에게 `,
                    Effect.getDescriptionMessage(EffectType.SWIFTNESS, skill.getValue(p, 'effectLevel')),
                    ` 효과를 부여했습니다! ]`
                ]));

                skill.prof += skill.getValue(p, 'profAddition');
            },
        },
        {
            name: '레인지 힐',
            isPassive: false,
            maxLevel: 30,
            checkRealizeCondition: p => p.hadClass('세인티스 팔라딘'),
            calcValues: (skill, p) => ({
                cost: 100 + skill.level * 8,
                increase: 90,
                base: 303 + skill.level * 55,
                damageIncrease: 2,
                profAddition: Math.max(1, 5 - skill.level * 0.1)
            }),
            getCooldown: (skill, p) => Math.max(5, 20 - skill.level * 0.2),
            getCostMessage: (skill, p) => `${Utils.toFixed(skill.getValue(p, 'cost'), 1)}마나`,
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= skill.getValue(p, 'cost'),
            takeCost: (skill, p) => p.mana -= skill.getValue(p, 'cost'),
            getConditionMessage: (skill, p) => '레인지 힐! 이라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.tickMessage === '레인지 힐!',
            getDescription: (skill, p) => ComponentBuilder.texts([
                `자신을 포함한 현재 장소에 있는 플레이어들 중 카르마가 10 미만인 모든 플레이어를 ${AttributeType.MAGIC_ATTACK.displayName}의 `,
                ComponentBuilder.text(`${skill.getValue(p, 'increase').toFixed(1)}% + ${skill.getValue(p, 'base').toFixed(1)}`, 
                    { color: Utils.MAGIC_COLOR }),
                `만큼 회복시킵니다.`
            ]),
            onStart(skill, p) {
                let targets = p.getLocation().getPlayers(true);

                const amount = skill.getValue(p, 'base') + 
                    p.attribute.getValue(AttributeType.MAGIC_ATTACK) * skill.getValue(p, 'increase') / 100;
                const result: MessageComponent[] = [];

                for(let target of targets) {
                    const healed = target.heal(amount, p);
                    result.push(ComponentBuilder.texts([
                        `[ ${Utils.asObjective(target.getName() + 
                            (target instanceof Player ? '님': ''))} ${healed.toFixed(1)}만큼 회복시켰습니다! ]\n`,
                        ComponentBuilder.progressBar(target.life, target.maxLife, 'percent', Utils.MAIN_COLOR)
                    ]));
                }
                p.sendMessage(ComponentBuilder.join(result, ComponentBuilder.newLine()));

                skill.prof += skill.getValue(p, 'profAddition');
            },
        },
        {
            name: '세인트 배리어',
            isPassive: false,
            maxLevel: 30,
            checkRealizeCondition: p => p.hasSkill('진실의 성창', s => s.level >= s.maxLevel),
            calcValues: (skill, p) => ({
                time: 15 + skill.level * 0.5,
                shield: 35,
                profAddition: Math.max(1, 6 - skill.level * 0.2)
            }),
            getCooldown: (skill, p) => Math.max(5, 105 - skill.level * 1.4),
            getConditionMessage: (skill, p) => '세인트 배리어! 라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.tickMessage === '세인트 배리어!',
            getDescription: (skill, p) => ComponentBuilder.texts([
                `자신을 포함한 현재 장소에 있는 플레이어들 중 카르마가 10 미만인 모든 플레이어에게\n`,
                `${skill.getValue(p, 'time').toFixed(1)}초 동안 현재 생명력의 `,
                ComponentBuilder.text(`${skill.getValue(p, 'shield').toFixed(1)}%`, 
                    { color: Utils.NUMBER_COLOR }),
                ` 만큼의 보호막을 생성합니다.`
            ]),
            onStart(skill, p) {
                let targets = p.getLocation().getPlayers(true);

                const amount = p.life * skill.getValue(p, 'shield') / 100;
                const time = skill.getValue(p, 'time');
                const result: string[] = [];

                for(let target of targets) {
                    target.addShield('saint_barrier', amount, time);
                    result.push(`[ ${target.getName()}님에게 ${amount.toFixed(1)} 만큼의 보호막이 생성되었습니다! ]`);
                }
                skill.prof += skill.getValue(p, 'profAddition');
                p.sendMessage(ComponentBuilder.embed([
                    ComponentBuilder.text(result.join('\n'))
                ], 'yellow'));
            },
        },
        
    ];

    /*
        {
            name: '',
            isPassive: false,
            maxLevel: 20,
            checkRealizeCondition: p => p.hadClass(''),
            calcValues: (skill, p) => ({
                cost: 60 + skill.level * 20,
                profAddition: Math.max(1, 7 - skill.level * 0.2)
            }),
            getCooldown: (skill, p) => Math.max(5, 60 - skill.level),
            getCostMessage: (skill, p) => `${Utils.toFixed(skill.getValue(p, 'cost'), 1)}마나`,
            getCostFailMessage: (skill, p) => '마나가 부족합니다.',
            canTakeCost: (skill, p) => p.mana >= skill.getValue(p, 'cost'),
            takeCost: (skill, p) => p.mana -= skill.getValue(p, 'cost'),
            getConditionMessage: (skill, p) => '! 라고 말하기',
            checkCondition: (skill, p) => p.isAlive && p.tickMessage === '!',
            getDescription: (skill, p) => ComponentBuilder.texts([
                
            ])
        },
    */

    static getSkillPreset(name: string) {
        return cache[name] ?? (cache[name] = SkillPreset.list.find(preset => preset.name === name));
    }
}