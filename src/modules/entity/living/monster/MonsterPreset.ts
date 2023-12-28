import { AttackOptions, MonsterPresetObject } from "../../../../types";
import { AttributeType, ChatManager } from "../../../Internal";
import { DropItem } from "../../../Internal";
import { Effect, EffectType } from "../../../Internal";
import { StatType, Time, Utils } from "../../../Internal";
import { Item } from "../../../Internal";
import { LivingEntity } from "../../../Internal";
import { Monster, MonsterTendency, MonsterType } from "../../../Internal";
import { Player } from "../../../Internal";
import { Projectile } from "../../../Internal";
import { Option } from "../../../Internal";
import { ComponentBuilder } from "../../../server/chat/ComponentBuilder";

const cache: { [key: string]: MonsterPresetObject | undefined } = {};

export class MonsterPreset {
    static list: MonsterPresetObject[] = [
        {
            name: '라토 래빗',
            types: [MonsterType.BEAST, MonsterType.NATURAL],
            level: 2,
            attributes: {
                attack: '+60',
                attackSpeed: '-90%'
            },
            onUpdate: monster => {
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    monster.tryAttack();
                }
            },
            drops: [
                new DropItem('생 토끼고기', 3, 5, 1),
                new DropItem('토끼의 발톱', 1, 1, 0.2)
            ]
        },
        {
            name: '빅 슬라임',
            level: 3,
            types: [MonsterType.NATURAL],
            attributes: {
                attack: '+30',
                attackSpeed: '-20%'
            },
            onUpdate: monster => {
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    monster.tryAttack();
                }
            },
            drops: [
                new DropItem('점액질', 3, 9, 1)
            ]
        },
        {
            name: '라임 슬라임',
            level: 1,
            types: [MonsterType.NATURAL],
            regenTime: 100,
            attributes: {
                attack: '+10',
                attackSpeed: '-50%'
            },
            onUpdate: monster => {
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    monster.tryAttack();
                }
            },
            drops: [
                new DropItem('점액질', 1, 2, 1)
            ]
        },
        {
            name: '허수아비',
            level: 1,
            attributes: {
                maxLife: '+400000'
            },
            regenTime: 0,
            onUpdate: monster => {
                monster.canMove = false;
                monster.addEffect(new Effect(EffectType.INVULNERABLE, 1, 10));
                monster.heal(monster.maxLife * 0.1 * Time.deltaTime);
            }
        },
        {
            name: '강철 허수아비',
            level: 1,
            attributes: {
                maxLife: '+50000000'
            },
            regenTime: 0,
            onUpdate: monster => {
                monster.canMove = false;
                monster.addEffect(new Effect(EffectType.INVULNERABLE, 1, 10));
                monster.heal(monster.maxLife * 0.1 * Time.deltaTime);
            }
        },
        {
            name: '연습용 인형',
            level: 1,
            attributes: {
                maxLife: '+1000000',
                attackSpeed: '-60%'
            },
            regenTime: 0,
            onUpdate: monster => {
                monster.canMove = false;
                monster.addEffect(new Effect(EffectType.INVULNERABLE, 1, 10));
                monster.addEffect(new Effect(EffectType.ENHANCE_STRENGTH, -20, 10));
                monster.heal(monster.maxLife * 0.1 * Time.deltaTime);
                monster.tryAttack();
            }
        },
        {
            name: '야생 멧돼지',
            types: [MonsterType.BEAST, MonsterType.NATURAL],
            level: 5,
            attributes: {
                attack: '+200',
                attackSpeed: '-60%'
            },
            onUpdate: monster => {
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    monster.tryAttack();
                }
            },
            drops: [
                new DropItem('생 돼지고기', 3, 5, 1),
                new DropItem('멧돼지 송곳니', 1, 1, 0.3)
            ]
        },
        {
            name: '레드테일 울프',
            types: [MonsterType.BEAST, MonsterType.WOLF],
            level: 8,
            tendency: MonsterTendency.HOSTILE,
            attributes: {
                attack: '+200',
                defendPenetrate: '+150',
                defend: '+150',
                maxLife: '+700',
                attackSpeed: '-85%'
            },
            onUpdate: monster => {
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    monster.tryAttack();
                }
            },
            drops: [
                new DropItem('생 늑대고기', 1, 3, 1)
            ]
        },
        {
            name: '흰 꼬리 늑대',
            types: [MonsterType.BEAST, MonsterType.WOLF],
            level: 17,
            tendency: MonsterTendency.HOSTILE,
            attributes: {
                attack: '+200',
                defend: '+100',
                maxLife: '+300',
                attackSpeed: '-40%',
                moveSpeed: '+30%'
            },
            stat: {
                strength: 20,
                agility: 25
            },
            onUpdate: monster => {
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    if (target) monster.attack(target, {
                        onHit: victim => {
                            if (Math.random() < 0.3)
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.BLOOD, 1, 10));
                        }
                    });
                }
            },
            drops: [
                new DropItem('생 늑대고기', 1, 4, 0.5),
                new DropItem('생 늑대고기', 1, 2, 1)
            ]
        },
        {
            name: '흰 꼬리 거대 늑대',
            types: [MonsterType.BEAST, MonsterType.WOLF],
            level: 57,
            regenTime: 60 * 30,
            tendency: MonsterTendency.HOSTILE,
            attributes: {
                attack: '+450',
                defend: '+260',
                maxLife: '+2000',
                attackSpeed: '-80%',
                moveSpeed: '+20%'
            },
            stat: {
                strength: 30,
                agility: 70,
                vitality: 51
            },
            onUpdate: monster => {
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    if (target) monster.attack(target, {
                        onHit: victim => {
                            if (Math.random() < 0.3)
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.BLOOD, 1, 10));
                        }
                    });
                }
            },
            drops: [
                new DropItem('생 늑대고기', 1, 4, 0.5),
                new DropItem('생 늑대고기', 1, 2, 1)
            ]
        },
        {
            name: '서리칼날 늑대',
            types: [MonsterType.BEAST, MonsterType.WOLF],
            level: 237,
            regenTime: 60 * 10,
            tendency: MonsterTendency.HOSTILE,
            attributes: {
                attack: '+2000+10%',
                defend: '+2600',
                magicResistance: '+4000',
                maxLife: '+3000',
                attackSpeed: '-30%',
                moveSpeed: '+20%'
            },
            stat: {
                strength: 200,
                agility: 310,
                vitality: 191
            },
            onUpdate: monster => {
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    if (target) monster.attack(target, {
                        onHit: victim => {
                            if (Math.random() < 0.3)
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.BLOOD, 3, 10));
                            if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.FROZEN, 15, 5));
                        }
                    });
                }
            },
            drops: [
                new DropItem('생 늑대고기', 1, 4, 0.5),
                new DropItem('얼음 정수', 3, 5, 1)
            ]
        },
        {
            name: '바위 거북',
            level: 28,
            types: [MonsterType.STONE],
            attributes: {
                attack: '+400',
                defend: '+1000',
                maxLife: '+900',
                attackSpeed: '-60%',
                moveSpeed: '+30%'
            },
            stat: {
                strength: 20,
                agility: 25,
                vitality: 33
            },
            onUpdate: monster => {
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    if (target) monster.attack(target, {
                        onHit: victim => {
                            if (Math.random() < 0.9)
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.SLOWNESS, 2, 20));
                        }
                    });
                }
            },
            drops: [
                new DropItem('돌덩이', 1, 8, 0.5),
            ]
        },
        {
            name: '얼음 궁수 석상',
            level: 190,
            types: [MonsterType.ICE, MonsterType.STONE],
            tendency: MonsterTendency.HOSTILE,
            attributes: {
                rangeAttack: '+700+40%',
                defend: '+700',
                maxLife: '+3000',
                attackSpeed: '-70%'
            },
            stat: {
                strength: 270,
                agility: 232,
                vitality: 131
            },
            onUpdate: monster => {
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    let isSkill = Math.random() < 0.2;
                    let projectile = new Projectile({
                        name: isSkill ? '마법 빙결 화살' : '빙결 화살',
                        attributes: {
                            attack: monster.attribute.getValue(AttributeType.RANGE_ATTACK),
                            moveSpeed: 700
                        },
                        onHit: (projectile, victim) => {
                            if (victim instanceof LivingEntity) {
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.FROZEN, 6, 2));
                                if (isSkill) if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.SILENCE, 1, 2));
                            }
                        },
                        owner: monster
                    });
                    if (target) projectile.attack(target, {
                        applyAttackSpeed: true
                    });
                }
            },
            drops: [
                new DropItem('얼음 정수', 5, 10, 1)
            ]
        },
        {
            name: '해골 궁수',
            types: [MonsterType.UNDEAD],
            level: 161,
            gold: 225,
            tendency: MonsterTendency.HOSTILE,
            attributes: {
                rangeAttack: '+500+40%',
                defend: '+700',
                maxLife: '+3000',
                attackSpeed: '-70%'
            },
            stat: {
                strength: 200,
                agility: 202,
                vitality: 101
            },
            onUpdate: monster => {
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    let projectile = new Projectile({
                        name: '날카로운 화살',
                        attributes: {
                            attack: monster.attribute.getValue(AttributeType.RANGE_ATTACK),
                            moveSpeed: 700
                        },
                        owner: monster
                    });
                    if (target) projectile.attack(target, {
                        applyAttackSpeed: true
                    });
                }
            },
            drops: [
            ]
        },
        {
            name: '스노우 베어',
            types: [MonsterType.BEAST, MonsterType.ICE],
            level: 171,
            gold: 0,
            attributes: {
                attack: '+500+20%',
                defend: '+4000',
                defendPenetrate: '+7000',
                maxLife: '+20000',
                attackSpeed: '-30%'
            },
            stat: {
                strength: 170,
                agility: 132,
                vitality: 291
            },
            onUpdate: monster => {
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    let dash = Math.random() < 0.3;
                    let args: AttackOptions = {
                        onHit: victim => {
                            if (Math.random() < 0.3) if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.BLOOD, 7, 4.5));
                            if (dash) {
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.STUN, 10, 0.7));
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.FROZEN, 10, 4.5));
                            }
                        },
                    };
                    if (dash) {
                        args.additionalMessage = ComponentBuilder.text('스노우 베어가 돌진했다!');
                        monster.attribute.multiplyValue(AttributeType.MOVE_SPEED, 2);
                    }
                    if (target) monster.attack(target, args);
                }
            },
            drops: [
                new DropItem('얼음 정수', 1, 5, 0.5)
            ]
        },
        {
            name: '마수 굴탄',
            types: [MonsterType.BEAST, MonsterType.DEVILDOM],
            level: 771,
            gold: 0,
            attributes: {
                attack: '+500+20%',
                defend: '+4000',
                defendPenetrate: '+7000',
                maxLife: '+10000',
                attackSpeed: '-50%'
            },
            stat: {
                strength: 2000,
                agility: 232,
                vitality: 791
            },
            onUpdate: monster => {
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    let dash = Math.random() < 0.5;
                    let args: AttackOptions = {
                        onHit: victim => {
                            if (Math.random() < 0.5) if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.BLOOD, 70, 4.5));
                            if (dash) {
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.DECREASE_HEAL_EFFICIENCY, 10, 10));
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.FIRE, 100, 6.5));
                            }
                        },
                    };
                    if (dash) {
                        args.additionalMessage = ComponentBuilder.text('굴탄이 뛰어올랐다!');
                        monster.attribute.multiplyValue(AttributeType.MOVE_SPEED, 2);
                    }
                    if (target) monster.attack(target, args);
                }
            },
            drops: [
                new DropItem('불의 정수', 5, 10, 0.6)
            ]
        },
        {
            name: '마수 레비오스',
            types: [MonsterType.BEAST, MonsterType.DEVILDOM],
            level: 801,
            gold: 0,
            attributes: {
                attack: '+10000+20%',
                defend: '+4000',
                defendPenetrate: '+5000',
                maxLife: '+20000',
                attackSpeed: '-50%'
            },
            stat: {
                strength: 1000,
                agility: 132,
                vitality: 1491
            },
            onUpdate: monster => {
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    let args: AttackOptions = {
                        onHit: victim => {
                            if (Math.random() < 0.7) if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.BLOOD, 20, 4.5));
                            if (Math.random() < 0.4) {
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.DECREASE_HEAL_EFFICIENCY, 20, 10));
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.FIRE, 80, 7.5));
                            }
                        },
                    };
                    if (target) monster.attack(target, args);
                }
            },
            drops: [
                new DropItem('불의 정수', 5, 20, 0.6)
            ]
        },
        {
            name: '마수 만티코어',
            types: [MonsterType.BEAST, MonsterType.DEVILDOM],
            level: 861,
            gold: 0,
            attributes: {
                attack: '+20000+20%',
                defend: '+20000',
                defendPenetrate: '+30000',
                maxLife: '+50000',
                attackSpeed: '-75%'
            },
            stat: {
                strength: 1000,
                agility: 1000,
                vitality: 1500
            },
            onUpdate: monster => {
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    let args: AttackOptions = {
                        onHit: victim => {
                            if (Math.random() < 0.7) if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.BLOOD, 50, 4.5));
                            if (Math.random() < 0.4) {
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.DECREASE_HEAL_EFFICIENCY, 50, 10));
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.SLOWNESS, 30, 6.5));
                            }
                        },
                    };
                    if (target)
                        for (let i = 0; i < 2; i++)
                            monster.attack(target, args);
                }
            },
            drops: [
                new DropItem('불의 정수', 5, 20, 0.6)
            ]
        },
        {
            name: '견습 마족',
            level: 851,
            types: [MonsterType.DEVILDOM, MonsterType.HUMANOID],
            gold: 500,
            attributes: {
                attack: '+1000+20%',
                defend: '+10000',
                defendPenetrate: '+10000',
                maxLife: '+40000',
                attackSpeed: '-40%',
                moveSpeed: '+30%'
            },
            stat: {
                strength: 1000,
                agility: 1132,
                vitality: 791
            },
            onUpdate: monster => {
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    let args: AttackOptions = {
                        onHit: victim => {
                            if (Math.random() < 0.7) if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.BLOOD, 20, 4.5));
                            if (Math.random() < 0.4) {
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.BIND, 1, 0.5));
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.FIRE, 150, 7.5));
                            }
                        },
                    };
                    if (Math.random() < 0.3)
                        args.additionalMessage = ComponentBuilder.text(Utils.pick(['크윽... 죽어라!', '크앍!', '네 이놈!', '캬아아!']));
                    if (target) monster.attack(target, args);
                }
            },
            drops: [
                new DropItem('불의 정수', 5, 20, 0.6)
            ]
        },
        {
            name: '서큐버스',
            level: 1001,
            tendency: MonsterTendency.HOSTILE,
            types: [MonsterType.DEVILDOM, MonsterType.HUMANOID],
            gold: 1000,
            attributes: {
                magicAttack: '+2000+20%',
                magicResistance: '+10000',
                magicPenetrate: '+10000',
                maxLife: '+40000',
                attackSpeed: '-30%',
                moveSpeed: '+35%'
            },
            stat: {
                spell: 1600,
                agility: 1132,
                vitality: 591
            },
            onUpdate: monster => {
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    let isSkill = Math.random() < 0.3;
                    let self = monster;
                    let projectile = new Projectile({
                        name: isSkill ? '매혹의 갈고리' : '갈고리',
                        attributes: {
                            magicAttack: monster.attribute.getValue(AttributeType.MAGIC_ATTACK),
                            moveSpeed: monster.attribute.getValue(AttributeType.PROJECTILE_SPEED) + 1000
                        },
                        onHit: (projectile, victim) => {
                            if (victim instanceof LivingEntity) {
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.SLOWNESS, 6, 2, self));
                                if (isSkill) if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.CHARM, 1, 1, self));
                            }
                        },
                        owner: monster
                    });
                    if (target) projectile.attack(target, {
                        applyAttackSpeed: true,
                        isMagicAttack: true
                    });
                }
            },
            drops: [
                new DropItem('불의 정수', 5, 20, 0.6)
            ]
        },
        {
            name: '암살자 마족',
            level: 920,
            types: [MonsterType.DEVILDOM, MonsterType.HUMANOID],
            gold: 3000,
            tendency: MonsterTendency.HOSTILE,
            attributes: {
                attack: '+5000+40%',
                defend: '+4000',
                defendPenetrate: '+4000',
                maxLife: '+20000',
                attackSpeped: '-70%'
            },
            stat: {
                strength: 1200,
                agility: 1332,
                sense: 500
            },
            onUpdate: monster => {
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    let args: AttackOptions = {
                        onHit: victim => {
                            if (Math.random() < 0.7) if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.BLOOD, 20, 4.5));
                            if (Math.random() < 0.3) {
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.SLOWNESS, 1, 0.6));
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.FIRE, 70, 7.5));
                            }
                        },
                    };
                    if (Math.random() < 0.3) args.additionalMessage = ComponentBuilder.text(Utils.pick(['재로 돌아가라!', '쉬이이이!', '샤샤샤샥', '캬아아아아!']));
                    if (target) monster.attack(target, args);
                }
            },
            drops: [
                new DropItem('불의 정수', 5, 20, 0.6)
            ]
        },
        {
            name: '마족 전사',
            level: 940,
            types: [MonsterType.DEVILDOM, MonsterType.HUMANOID],
            gold: 3000,
            tendency: MonsterTendency.HOSTILE,
            attributes: {
                attack: '+10000+20%',
                defend: '+22000',
                moveSpeed: '-20%',
                attackSpeed: '-20%',
                defendPenetrate: '+20000',
                maxLife: '+30%'
            },
            stat: {
                strength: 1200,
                vitality: 1392,
                agility: 500
            },
            onUpdate: monster => {
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    let args: AttackOptions = {
                        onHit: victim => {
                            if (Math.random() < 0.7) if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.BLOOD, 20, 4.5));
                            if (Math.random() < 0.2) {
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.SLOWNESS, 10, 3.6));
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.FIRE, 100, 7.5));
                            }
                        },
                    };
                    if (target) monster.attack(target, args);
                }
            },
            drops: [
                new DropItem('불의 정수', 5, 20, 0.6)
            ]
        },
        {
            name: '광폭 마족 전사',
            level: 2500,
            types: [MonsterType.DEVILDOM, MonsterType.HUMANOID],
            gold: 5000,
            tendency: MonsterTendency.HOSTILE,
            attributes: {
                attack: '+305000+35%',
                defend: '+42000',
                moveSpeed: '+5000',
                defendPenetrate: '+20000',
                maxLife: '+5000000+50%'
            },
            stat: {
                strength: 3600,
                vitality: 3592,
                agility: 1200
            },
            onUpdate: monster => {
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    let args: AttackOptions = {
                        onHit: victim => {
                            if (Math.random() < 0.7) if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.BLOOD, 60, 4.5));
                            if (Math.random() < 0.2) {
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.STUN, 1, 1.6));
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.FIRE, 150, 7.5));
                            }
                        },
                    };
                    if (target) monster.attack(target, args);
                }
            },
            drops: [
                new DropItem('혼돈의 정수', 5, 20, 0.6)
            ]
        },
        {
            name: '마족 암흑전사',
            level: 1200,
            types: [MonsterType.DEVILDOM, MonsterType.HUMANOID],
            gold: 3000,
            tendency: MonsterTendency.NEUTRAL,
            attributes: {
                attack: '+15000+25%',
                defend: '+42000',
                moveSpeed: '-20%',
                attackSpeed: '-20%',
                defendPenetrate: '+20000',
                maxLife: '+30%'
            },
            stat: {
                strength: 1600,
                vitality: 1592,
                agility: 200
            },
            onUpdate: monster => {
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    let args: AttackOptions = {
                        onHit: victim => {
                            if (Math.random() < 0.7) if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.BLOOD, 60, 4.5));
                            if (Math.random() < 0.2) {
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.STUN, 1, 1.6));
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.FIRE, 150, 7.5));
                            }
                        },
                    };
                    if (target) monster.attack(target, args);
                }
            },
            drops: [
                new DropItem('불의 정수', 5, 20, 0.6)
            ]
        },
        {
            name: '마족 대장군',
            level: 1250,
            types: [MonsterType.DEVILDOM, MonsterType.HUMANOID],
            gold: 3000,
            tendency: MonsterTendency.NEUTRAL,
            attributes: {
                attack: '+15000+10%',
                defend: '+42000',
                moveSpeed: '-20%',
                attackSpeed: '-20%',
                defendPenetrate: '+10000',
                maxLife: '+100000+30%'
            },
            stat: {
                strength: 600,
                vitality: 2592,
                agility: 200
            },
            onUpdate: monster => {
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    let args: AttackOptions = {
                        onHit: victim => {
                            if (Math.random() < 0.7) if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.BLOOD, 60, 4.5));
                            if (Math.random() < 0.2) {
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.STUN, 1, 1.6));
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.FIRE, 150, 7.5));
                            }
                        },
                    };
                    if (target) monster.attack(target, args);
                }
            },
            drops: [
                new DropItem('불의 정수', 5, 20, 0.6)
            ]
        },
        {
            name: '암흑 방패단',
            level: 2250,
            types: [MonsterType.DEVILDOM, MonsterType.HUMANOID],
            gold: 3000,
            tendency: MonsterTendency.HOSTILE,
            attributes: {
                attack: '+15000+10%',
                defend: '+42000',
                moveSpeed: '-20%',
                attackSpeed: '-20%',
                defendPenetrate: '+10000',
                maxLife: '+10000000+20%'
            },
            stat: {
                strength: 600,
                vitality: 5592,
                agility: 500
            },
            onUpdate: monster => {
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    let args: AttackOptions = {
                        onHit: victim => {
                            if (Math.random() < 0.7) if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.BLOOD, 60, 4.5));
                            if (Math.random() < 0.2) {
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.STUN, 1, 1.6));
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.FIRE, 150, 7.5));
                            }
                        },
                    };
                    if (target) monster.attack(target, args);
                }
            },
            drops: [
                new DropItem('불의 정수', 5, 20, 0.6)
            ]
        },
        {
            name: '포스 스노우 베어',
            types: [MonsterType.BEAST, MonsterType.ICE],
            tendency: MonsterTendency.HOSTILE,
            level: 171,
            gold: 0,
            attributes: {
                attack: '+500+20%',
                defend: '+3000',
                defendPenetrate: '+2000',
                maxLife: '+15000',
                attackSpeed: '-30%'
            },
            stat: {
                strength: 170,
                agility: 132,
                vitality: 291
            },
            onUpdate: monster => {
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    let dash = Math.random() < 0.3;
                    let args: AttackOptions = {
                        onHit: victim => {
                            if (Math.random() < 0.3) if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.BLOOD, 7, 4.5));
                            if (dash) {
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.STUN, 10, 0.4));
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.FROZEN, 10, 2.5));
                            }
                        },
                    };
                    if (dash) {
                        args.additionalMessage = ComponentBuilder.text('포스 스노우 베어가 돌진했다!');
                        monster.attribute.multiplyValue(AttributeType.MOVE_SPEED, 3);
                    }
                    if (target) monster.attack(target, args);
                }
            },
            drops: [
                new DropItem('얼음 정수', 1, 5, 0.5)
            ]
        },
        {
            name: '망령 기사',
            types: [MonsterType.UNDEAD, MonsterType.HUMANOID],
            level: 145,
            gold: 160,
            tendency: MonsterTendency.HOSTILE,
            attributes: {
                attack: '+58%',
                defendPenetrate: '+1000',
                defend: '-180',
                attackSpeed: '-65%'
            },
            stat: {
                strength: 160,
                vitality: 245
            },
            onUpdate: monster => {
                if (!monster.slot.hand) {
                    monster.slot.hand = Item.fromName('철제 장검');
                    monster.slot.hand.options = [new Option('부패', { level: 1, time: 5 })];
                }
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    if (target) monster.attack(target, {
                        onHit: victim => {
                            if (Math.random() < 0.7 && victim instanceof LivingEntity)
                                victim.addEffect(new Effect(EffectType.SLOWNESS, 3, 7.5));
                        }
                    });
                }
            },
            drops: [
                new DropItem('정화된 영혼조각', 1, 1, 0.1),
                new DropItem('블러디 소드', 1, 1, 0.05)
            ]
        },
        {
            name: '청크 바위 골렘',
            types: [MonsterType.GOLEM, MonsterType.STONE],
            level: 75,
            regenTime: 60 * 15,
            tendency: MonsterTendency.HOSTILE,
            attributes: {
                attack: '+1200',
                defendPenetrate: '+1500',
                defend: '+880',
                magicResistance: '+900',
                attackSpeed: '-85%'
            },
            stat: {
                strength: 60,
                vitality: 205
            },
            onUpdate: monster => {
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    if (target) monster.attack(target, {
                        onHit: victim => {
                            if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.AIRBORNE, 1, 0.5));
                        }
                    });
                }
            },
            drops: [
                new DropItem('돌덩이', 4, 15, 1),
            ]
        },
        {
            name: '마도 공학 골렘',
            types: [MonsterType.GOLEM, MonsterType.METAL],
            level: 100,
            regenTime: 60 * 15,
            tendency: MonsterTendency.HOSTILE,
            attributes: {
                attack: '+1200',
                defendPenetrate: '+1500',
                defend: '+1880',
                magicResistance: '+900',
                attackSpeed: '-85%'
            },
            stat: {
                strength: 60,
                vitality: 205
            },
            onUpdate: monster => {
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    if (target) monster.attack(target, {
                        onHit: victim => {
                            if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.FROZEN, 3, 20));
                        }
                    });
                }
            },
            drops: [
                new DropItem('굳은 티타늄', 1, 2, 0.4),
                new DropItem('굳은 금', 1, 5, 0.5),
            ]
        },
        {
            name: '바위 골렘',
            types: [MonsterType.GOLEM, MonsterType.STONE],
            level: 55,
            attributes: {
                attack: '+500',
                defendPenetrate: '+150',
                defend: '+580',
                magicResistance: '+300',
                attackSpeed: '-76%'
            },
            stat: {
                strength: 60,
                vitality: 105
            },
            onUpdate: monster => {
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    if (target) monster.attack(target, {
                        onHit: victim => {
                            if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.STUN, 1, 0.5));
                        }
                    });
                }
            },
            drops: [
                new DropItem('돌덩이', 2, 10, 1),
            ]
        },
        {
            name: '스노우 골렘',
            types: [MonsterType.GOLEM, MonsterType.ICE],
            level: 125,
            attributes: {
                attack: '+500+30%',
                defendPenetrate: '+150',
                defend: '+2080',
                magicResistance: '+2000',
                attackSpeed: '-56%'
            },
            stat: {
                strength: 150,
                vitality: 205
            },
            onUpdate: monster => {
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    if (target) monster.attack(target, {
                        onHit: victim => {
                            if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.FROZEN, 10, 7.5));
                        }
                    });
                }
            },
            drops: [
                new DropItem('얼음 정수', 1, 3, 1),
            ]
        },
        {
            name: '프로즌 골렘',
            types: [MonsterType.GOLEM, MonsterType.ICE],
            level: 155,
            tendency: MonsterTendency.HOSTILE,
            attributes: {
                attack: '+500',
                defendPenetrate: '+1500',
                defend: '+580',
                magicResistance: '+1500',
                attackSpeed: '-76%'
            },
            stat: {
                strength: 130,
                vitality: 265
            },
            onUpdate: monster => {
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    if (target) monster.attack(target, {
                        onHit: victim => {
                            if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.FROZEN, 13, 7.5));
                        }
                    });
                }
            },
            drops: [
                new DropItem('얼음 정수', 2, 4, 1),
            ]
        },
        {
            name: '불거북',
            level: 97,
            types: [MonsterType.FIRE, MonsterType.BEAST],
            attributes: {
                attack: '+1000',
                defendPenetrate: '+5000',
                defend: '+2680',
                magicResistance: '+5600',
                attackSpeed: '-76%'
            },
            stat: {
                strength: 10,
                vitality: 281
            },
            onHitted: function (attacker) {
                attacker.addEffect(new Effect(EffectType.FIRE, 4, 40));
            },
            onUpdate: monster => {
                monster.filterEffects(eff => !(eff.type === EffectType.FIRE && eff.level <= 10));
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    if (target) monster.attack(target, {
                        onHit: victim => {
                            if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.NAUSEA, 1, 2.5));
                        }
                    });
                }
            },
            drops: [
                new DropItem('불의 정수', 2, 10, 0.4),
            ]
        },
        {
            name: '플레임 리자드',
            level: 35,
            types: [MonsterType.FIRE, MonsterType.BEAST],
            attributes: {
                defend: '+100',
                maxLife: '+2900',
                attackSpeed: '-30%',
                moveSpeed: '+150'
            },
            onUpdate: monster => {
                monster.filterEffects(eff => !(eff.type === EffectType.FIRE && eff.level <= 5));
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    let projectile = new Projectile({
                        name: '불덩이',
                        attributes: {
                            magicAttack: 400,
                            moveSpeed: 250
                        },
                        onHit: (projectile, victim) => {
                            if (victim instanceof LivingEntity)
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.FIRE, 1, 5));
                        },
                        owner: monster
                    });
                    if (target) projectile.attack(target, {
                        isMagicAttack: true,
                        applyAttackSpeed: true
                    });
                }
            },
            drops: [
                new DropItem('불의 정수', 1, 1, 0.5)
            ]
        },
        {
            name: '마족 주술사',
            level: 1350,
            types: [MonsterType.DEVILDOM, MonsterType.HUMANOID],
            attributes: {
                defend: '+40000',
                maxLife: '+50000',
                attackSpeed: '-30%',
                moveSpeed: '+1500'
            },
            stat: {
                spell: 3000,
                vitality: 1500
            },
            onUpdate: monster => {
                monster.filterEffects(eff => !(eff.type === EffectType.FIRE && eff.level <= 50));
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    let projectile = new Projectile({
                        name: '다크 플레어 쏜',
                        attributes: {
                            magicAttack: monster.attribute.getValue(AttributeType.MAGIC_ATTACK) * 1.3,
                            moveSpeed: 25000
                        },
                        onHit: (projectile, victim) => {
                            if (victim instanceof LivingEntity) {
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.FIRE, 100, 7));
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.DECAY, 50, 7));
                            }
                        },
                        owner: monster
                    });
                    if (target) projectile.attack(target, {
                        isMagicAttack: true,
                        applyAttackSpeed: true
                    });
                }
            },
            drops: [
                new DropItem('불의 정수', 1, 1, 0.5)
            ]
        },
        {
            name: '마족 고위 주술사',
            level: 2550,
            types: [MonsterType.DEVILDOM, MonsterType.HUMANOID],
            tendency: MonsterTendency.HOSTILE,
            attributes: {
                defend: '+100000',
                magicResistance: '+100000',
                maxLife: '+5000000',
                moveSpeed: '+1500',
                magicAttack: '+50%'
            },
            stat: {
                spell: 7000,
                vitality: 2100
            },
            onUpdate: monster => {
                monster.filterEffects(eff => !(eff.type === EffectType.FIRE && eff.level <= 50));
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    let projectile = new Projectile({
                        name: '더 커스드 스피어',
                        attributes: {
                            magicAttack: monster.attribute.getValue(AttributeType.MAGIC_ATTACK) * 3.3,
                            moveSpeed: 45000
                        },
                        onHit: (projectile, victim) => {
                            if (victim instanceof LivingEntity) {
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.FIRE, 100, 7));
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.DECAY, 50, 7));
                            }
                        },
                        owner: monster
                    });
                    if (target) projectile.attack(target, {
                        isMagicAttack: true,
                        applyAttackSpeed: true
                    });
                }
            },
            drops: [
                new DropItem('불의 정수', 1, 1, 0.5)
            ]
        },
        {
            name: '라바 리자드',
            level: 69,
            types: [MonsterType.FIRE, MonsterType.BEAST],
            attributes: {
                magicResistance: '+1500',
                maxLife: '+6900',
                attackSpeed: '-20%',
                moveSpeed: '+150'
            },
            onUpdate: monster => {
                monster.filterEffects(eff => !(eff.type === EffectType.FIRE && eff.level <= 5));
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    let projectile = new Projectile({
                        name: '용암 점액',
                        attributes: {
                            magicAttack: 1000,
                            moveSpeed: 350
                        },
                        onHit: (projectile, victim) => {
                            if (victim instanceof LivingEntity) {
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.FIRE, 3, 8));
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.SLOWNESS, 2, 10));
                            }
                        },
                        owner: monster
                    });
                    if (target) projectile.attack(target, {
                        isMagicAttack: true,
                        applyAttackSpeed: true
                    });
                }
            },
            drops: [
                new DropItem('불의 정수', 1, 3, 0.2)
            ]
        },
        {
            name: '얼음 뿔 괴물',
            level: 45,
            types: [MonsterType.ICE, MonsterType.BEAST],
            attributes: {
                magicResistance: '+100',
                maxLife: '+3000',
                attackSpeed: '-40%',
                moveSpeed: '+100'
            },
            onUpdate: monster => {
                monster.filterEffects(eff => !(eff.type === EffectType.FROZEN && eff.level <= 10));
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    let projectile = new Projectile({
                        name: '얼음 뿔',
                        attributes: {
                            magicAttack: 500,
                            moveSpeed: 400
                        },
                        onHit: (projectile, victim) => {
                            if (victim instanceof LivingEntity) {
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.FROZEN, 3, 10));
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.BLOOD, 1, 5));
                            }
                        },
                        owner: monster
                    });
                    if (target) projectile.attack(target, {
                        isMagicAttack: true,
                        applyAttackSpeed: true
                    });
                }
            },
            drops: [
                new DropItem('얼음 정수', 1, 3, 0.2)
            ]
        },
        {
            name: '스노우 웜',
            level: 5,
            types: [MonsterType.ICE, MonsterType.WORM],
            attributes: {
                magicResistance: '+100',
                maxLife: '+300',
                attackSpeed: '-60%',
                moveSpeed: '-10'
            },
            onUpdate: monster => {
                monster.filterEffects(eff => !(eff.type === EffectType.FROZEN && eff.level <= 3));
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    let projectile = new Projectile({
                        name: '얼음 가시',
                        attributes: {
                            magicAttack: 50,
                            moveSpeed: 200
                        },
                        onHit: (projectile, victim) => {
                            if (victim instanceof LivingEntity && Math.random() < 0.4) {
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.FROZEN, 1, 5));
                            }
                        },
                        owner: monster
                    });
                    if (target) projectile.attack(target, {
                        isMagicAttack: true,
                        applyAttackSpeed: true
                    });
                }
            },
            drops: [
                new DropItem('얼음 정수', 1, 10, 0.3)
            ]
        },
        {
            name: '실코라 웜',
            level: 350,
            types: [MonsterType.POISON, MonsterType.WORM],
            attributes: {
                magicResistance: '+300',
                maxLife: '+30%',
                attackSpeed: '-70%',
                moveSpeed: '-10'
            },
            stat: {
                spell: 500,
                vitality: 600,
                sense: 105
            },
            onUpdate: monster => {
                monster.filterEffects(eff => !(eff.type === EffectType.POISON && eff.level <= 30));
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    let projectile = new Projectile({
                        name: '맹독 가시',
                        attributes: {
                            magicAttack: monster.attribute.getValue(AttributeType.MAGIC_ATTACK) * ((target !== null && target.level < monster.level) ? 1.1 :  0.42),
                            moveSpeed: 700
                        },
                        onHit: (projectile, victim) => {
                            if (victim instanceof LivingEntity && Math.random() < 0.6) {
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.POISON, 20, 15));
                            }
                        },
                        owner: monster
                    });
                    for (let i = 0; i < 3; i++)
                        if (target) projectile.attack(target, {
                            isMagicAttack: true,
                            applyAttackSpeed: true,
                            useAbuserCritical: true
                        });
                }
            },
            drops: [
                new DropItem('실코라 껍질', 5, 10, 0.7)
            ]
        },
        {
            name: '포즈네 플라워',
            level: 450,
            types: [MonsterType.POISON],
            attributes: {
                magicAttack: '+4000',
                magicResistance: '+100',
                maxLife: '+30%',
                attackSpeed: '-40%',
                moveSpeed: '-10'
            },
            stat: {
                spell: 100,
                vitality: 900,
                sense: 305
            },
            onUpdate: monster => {
                monster.filterEffects(eff => !([EffectType.POISON, EffectType.DECAY].includes(eff.type) && eff.level <= 50));
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    let projectile = new Projectile({
                        name: '가시덤불',
                        attributes: {
                            magicAttack: monster.attribute.getValue(AttributeType.MAGIC_ATTACK) * 1.1,
                            moveSpeed: 900
                        },
                        onHit: (projectile, victim) => {
                            if (victim instanceof LivingEntity && Math.random() < 0.7) {
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.DECAY, 20, 15));
                            }
                        },
                        owner: monster
                    });
                    if (target) projectile.attack(target, {
                        isMagicAttack: true,
                        applyAttackSpeed: true,
                        useAbuserCritical: true
                    });
                }
            },
            drops: [
                new DropItem('독의 정수', 2, 15, 1)
            ]
        },
        {
            name: '로튼 플라워',
            level: 300,
            types: [MonsterType.POISON],
            tendency: MonsterTendency.HOSTILE,
            isUnrevivable: true,
            attributes: {
                magicResistance: '+1000',
                maxLife: '+300',
                attackSpeed: '-30%',
                moveSpeed: '+10%'
            },
            stat: {
                spell: 100,
                vitality: 450,
                sense: 305
            },
            onUpdate: monster => {
                monster.filterEffects(eff => !([EffectType.POISON, EffectType.DECAY].includes(eff.type) && eff.level <= 50));
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    let projectile = new Projectile({
                        name: '썩은덤불',
                        attributes: {
                            magicAttack: monster.attribute.getValue(AttributeType.MAGIC_ATTACK) * 1.1,
                            moveSpeed: 800
                        },
                        onHit: (projectile, victim) => {
                            if (victim instanceof LivingEntity && Math.random() < 0.7) {
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.POISON, 10, 50));
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.DECREASE_HEAL_EFFICIENCY, 5, 30));
                            }
                        },
                        owner: monster
                    });
                    if (target) projectile.attack(target, {
                        isMagicAttack: true,
                        applyAttackSpeed: true
                    });
                }
            },
            drops: [
                new DropItem('독의 정수', 1, 10, 1)
            ]
        },
        {
            name: '트롤',
            level: 89,
            attributes: {
                defend: '+500',
                maxLife: '+12500',
                attackSpeed: '-85%',
                lifeRegen: '+200',
                attack: '+3000'
            },
            onUpdate: monster => {
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    monster.tryAttack();
                }
            },
            drops: [
            ]
        },
        {
            name: '아이스 트롤',
            level: 99,
            types: [MonsterType.ICE],
            attributes: {
                defend: '+500',
                maxLife: '+18500',
                attackSpeed: '-85%',
                lifeRegen: '+500',
                attack: '+3000'
            },
            onUpdate: monster => {
                monster.filterEffects(eff => !(eff.type === EffectType.FROZEN && eff.level <= 10));
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    if (target) monster.attack(target, {
                        onHit: victim => {
                            if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.FROZEN, 5, 10));
                        }
                    });
                }
            },
            drops: [
            ]
        },
        {
            name: '퀸 스파이더',
            level: 70,
            types: [MonsterType.SPIDER, MonsterType.POISON],
            regenTime: 60 * 20,
            attributes: {
                attack: '+1700',
                defendPenetrate: '+100',
                attackSpeed: '-40%',
            },
            stat: {
                vitality: 300
            },
            onUpdate: monster => {
                if (!monster.extras.latestPoisonShot) monster.extras.latestPoisonShot = Date.now() - 1000 * 10;
                if (!monster.extras.latestSpawnSpider) monster.extras.latestSpawnSpider = 0;
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    monster.tryAttack();
                }
                if (monster.targets.size > 0 && Date.now() - monster.extras.latestPoisonShot > 1000 * 15) {
                    let target = monster.target;
                    let poison = new Projectile({
                        name: '맹독 타액',
                        owner: monster,
                        attributes: {
                            magicAttack: 100,
                            moveSpeed: 200
                        },
                        onHit: (projectile, victim) => {
                            if (victim instanceof LivingEntity)
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.POISON, 6, 15));
                        }
                    });
                    if (target) poison.attack(target, {
                        isMagicAttack: true
                    });
                    monster.extras.latestPoisonShot = Date.now();
                }
                if (monster.life < monster.maxLife * 0.3 && !monster.extras.usedCC) {
                    monster.extras.usedCC = true;
                    Array.from(monster.targets).forEach(le => {
                        le.addEffect(new Effect(EffectType.FEAR, 1, 6));
                    });
                    Player.sendGroupRawMessage(<Player[]>Array.from(monster.targets).filter(p => p instanceof Player), '[ 거미 여왕이 공포스러운 시선으로 바라봅니다! ]');
                }
                if (monster.targets.size > 0 && Date.now() - monster.extras.latestSpawnSpider > 1000 * 30
                    && monster.life < monster.maxLife * 0.6) {
                    if (monster.getLocation() && monster.getLocation().objects.filter(s => s.name === '새끼 거미').length < 3)
                        monster.getLocation().spawnObjects(Utils.repeat(() => Monster.fromName('새끼 거미'), 3));
                    monster.extras.latestSpawnSpider = Date.now();
                    let seen = new Set();
                    Player.sendGroupRawMessage(<Player[]>Array.from(monster.targets)
                        .filter(target => target instanceof Player),
                        '[ 거미여왕이 새끼거미들을 소환했다! ]');
                }
            },
            drops: [
                new DropItem('거미여왕의 날카로운 송곳니', 1, 1, 0.1),
                new DropItem('거미 눈', 1, 8, 0.85)
            ]
        },
        {
            name: '시듦과 부패의 군주, 아닐레트',
            level: 750,
            types: [MonsterType.POISON],
            regenTime: 60 * 40,
            tendency: MonsterTendency.HOSTILE,
            attributes: {
                attack: '+1700',
                defendPenetrate: '+25000',
                magicPenetrate: '+25000',
                maxLife: '+90%',
                attackSpeed: '-70%',
            },
            stat: {
                vitality: 1800,
                spell: 400,
                agility: 250
            },
            onUpdate: monster => {
                if (monster.getLocation() && monster.getLocation().getPlayers(true).length === 0) monster.extras.start = false;
                if (!monster.extras.start) {
                    monster.extras.start = true;
                    monster.life = monster.maxLife;
                    monster.extras.latestPoisonShot = Date.now() - 1000 * 5;
                    monster.extras.latestSpawn = 0;
                    monster.extras.usedCC = false;
                    monster.getLocation().objects = [monster];
                }
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    monster.tryAttack();
                }
                if (monster.targets.size > 0 && Date.now() - monster.extras.latestPoisonShot > 1000 * 8) {
                    let target = monster.target;
                    let poison = new Projectile({
                        name: '로튼 스파이크',
                        owner: monster,
                        attributes: {
                            magicAttack: monster.attribute.getValue(AttributeType.MAGIC_ATTACK) * 0.45,
                            magicPenerate: monster.attribute.getValue(AttributeType.MAGIC_PENETRATE),
                            moveSpeed: 3500
                        },
                        onHit: (projectile, victim) => {
                            if (victim instanceof LivingEntity)
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.POISON, 40, 9));
                        }
                    });

                    if (target)
                        for (let i = 0; i < 5; i++)
                            poison.attack(target, {
                                isMagicAttack: true
                            });

                    monster.extras.latestPoisonShot = Date.now();
                }
                if (monster.life < monster.maxLife * 0.3 && !monster.extras.usedCC) {
                    monster.extras.usedCC = true;
                    monster.life = monster.maxLife * 0.7;
                    Array.from(monster.targets).forEach(le => {
                        le.addEffect(new Effect(EffectType.FEAR, 1, 4));
                        le.addEffect(new Effect(EffectType.DECAY, 50, 100));
                    });
                    Player.sendGroupRawMessage(<Player[]>Array.from(monster.targets).filter(p => p instanceof Player), '[ 아닐레트가 탈피합니다..! 그 역겹고 공포스러운 모습에 모두 충격에 빠집니다! ]');
                }
                if (monster.extras.usedCC && monster.targets.size > 0 && Date.now() - monster.extras.latestSpawn > 1000 * 30) {
                    let flowerCnt = monster.getLocation().objects.filter(s => s.name === '로튼 플라워').length;
                    if (monster.getLocation() && flowerCnt < 3)
                        monster.getLocation().objects = monster.getLocation().objects.concat(Utils.repeat(() => Monster.fromName('로튼 플라워'), 3 - flowerCnt));
                    monster.extras.latestSpawn = Date.now();
                    let players = monster.getLocation().getPlayers(true);
                    Player.sendGroupRawMessage(players, '[ 아닐레트가 구역질을 하며 몸의 일부가 썩어들어가며 터집니다..! ]\n' +
                        '아닐레트가 로튼 플라워를 소환했습니다..!');
                }
            },
            drops: [
                new DropItem('검은 심장', 1, 1, 0.15),
                new DropItem('검은 맹독 주머니', 1, 3, 1),
                new DropItem('독의 정수', 10, 30, 1)
            ]
        },
        {
            name: '지옥의 문지기, 케르베로스',
            level: 666,
            regenTime: 60 * 5,
            types: [MonsterType.FIRE, MonsterType.BEAST, MonsterType.DEVILDOM],
            tendency: MonsterTendency.HOSTILE,
            attributes: {
                attack: '+40%',
                defendPenetrate: '+3000',
                magicPenetrate: '+3000',
                maxLife: '+50%',
                attackSpeed: '-70%',
            },
            stat: {
                vitality: 1100,
                strength: 400,
                agility: 550
            },
            onUpdate: monster => {
                if (monster.getLocation() && monster.getLocation().getPlayers(true).length === 0) monster.extras.start = false;
                if (!monster.extras.start) {
                    monster.extras.start = true;
                    monster.life = monster.maxLife;
                    monster.extras.latestShot = Date.now() - 1000 * 5;
                    monster.extras.latestSpawn = 0;
                }
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    if (target) monster.attack(target, {
                        onHit: victim => {
                            if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.BLOOD, 25, 5));
                        }
                    });
                }
                if (monster.targets.size > 0 && Date.now() - monster.extras.latestShot > 1000 * 9 && monster.canUseSkill) {
                    let target = monster.target;
                    let pr = new Projectile({
                        name: '홍염포',
                        owner: monster,
                        attributes: {
                            magicAttack: monster.attribute.getValue(AttributeType.ATTACK) * 0.65,
                            magicPenerate: monster.attribute.getValue(AttributeType.MAGIC_PENETRATE),
                            moveSpeed: 3000
                        },
                        onHit: (projectile, victim) => {
                            if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.FIRE, 40, 9));
                        }
                    });

                    if (target)
                        for (let i = 0; i < 3; i++)
                            pr.attack(target, {
                                isMagicAttack: true
                            });

                    monster.extras.latestShot = Date.now();
                }
            },
            drops: [
                new DropItem('붉은 뿔', 1, 1, 0.2)
            ]
        },
        {
            name: '폴루토스의 하수인, 기간티하스',
            level: 1500,
            regenTime: 60 * 5,
            types: [MonsterType.HUMANOID, MonsterType.ICE, MonsterType.POISON],
            tendency: MonsterTendency.NEUTRAL,
            attributes: {
                attack: '+40%',
                defendPenetrate: '+20000',
                magicResistance: '+20000',
                maxLife: '+20%',
                attackSpeed: '-60%',
            },
            stat: {
                vitality: 3100,
                strength: 950,
                agility: 550
            },
            onHitted(monster, attacker) {
                if(!monster.extras.usedShield) {
                    monster.extras.usedShield = true;
                }
            },
            onUpdate: monster => {
                if (monster.getLocation() && monster.getLocation().getPlayers(true).length === 0) 
                    monster.extras.start = false;
                if (!monster.extras.start) {
                    monster.extras.start = true;
                    monster.life = monster.maxLife;
                    monster.extras.latestShot = Date.now() - 1000 * 5;
                    monster.extras.latestSpawn = 0;
                    monster.extras.usedShield = false;
                }
                if(!monster.extras.usedShield) {
                    monster.addShield('shield', 5000000, 6);
                }
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    if (target) monster.attack(target, {
                        onHit: victim => {
                            if (victim instanceof LivingEntity) {
                                if(Math.random() < 0.7) {
                                    victim.addEffect(new Effect(EffectType.FROZEN, 25, 5));
                                }
                                else {
                                    victim.addEffect(new Effect(EffectType.POISON, 25, 3));
                                }
                            } 
                        }
                    });
                }
                if (monster.targets.size > 0 && Date.now() - monster.extras.latestShot > 1000 * 8 && monster.canUseSkill) {
                    let target = monster.target;
                    let pr = new Projectile({
                        name: '포즈네틱 아이스스파이크',
                        owner: monster,
                        attributes: {
                            magicAttack: monster.attribute.getValue(AttributeType.ATTACK) * 0.65,
                            magicPenerate: monster.attribute.getValue(AttributeType.MAGIC_PENETRATE),
                            moveSpeed: 3000
                        },
                        onHit: (projectile, victim) => {
                            if (victim instanceof LivingEntity){
                                victim.addEffect(new Effect(EffectType.POISON, 30, 9));
                                victim.addEffect(new Effect(EffectType.FROZEN, 30, 9));
                            } 
                        }
                    });

                    if (target)
                        for (let i = 0; i < 2; i++)
                            pr.attack(target, {
                                isMagicAttack: true
                            });

                    monster.extras.latestShot = Date.now();
                }
            },
            drops: [
                new DropItem('얼음 정수', 5, 10, 1),
                new DropItem('독의 정수', 5, 10, 1),
                new DropItem('버려진 해방자의 도끼', 1, 1, 0.3)
            ]
        },
        {
            name: '하이펜타닉 골렘',
            level: 1600,
            regenTime: 60 * 5,
            types: [MonsterType.HUMANOID, MonsterType.ICE, MonsterType.METAL],
            tendency: MonsterTendency.NEUTRAL,
            attributes: {
                attack: '+20%',
                defend: '+30000',
                defendPenetrate: '+30000',
                magicResistance: '+50000',
                maxLife: '+20%',
            },
            stat: {
                vitality: 3400,
                strength: 950,
                agility: 350
            },
            onHitted(monster, attacker) {
                if(!monster.extras.usedShield) {
                    monster.extras.usedShield = true;
                }
            },
            onUpdate: monster => {
                if (monster.getLocation() && monster.getLocation().getPlayers(true).length === 0) 
                    monster.extras.start = false;
                if (!monster.extras.start) {
                    monster.extras.start = true;
                    monster.life = monster.maxLife;
                    monster.extras.latestShot = Date.now() - 1000 * 12;
                    monster.extras.latestSpawn = 0;
                    monster.extras.usedShield = false;
                    monster.extras.latestAirborne = 0;
                }
                if(!monster.extras.usedShield) {
                    monster.addShield('shield', 500000, 2);
                }
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    if (target) monster.attack(target, {
                        onHit: victim => {
                            if (victim instanceof LivingEntity) {
                                victim.addEffect(new Effect(EffectType.DECREASE_DEFEND, 2, 3));
                                if(Date.now() - monster.extras.latestAirborne > 1000 * 2 && Math.random() < 0.6) {
                                    victim.addEffect(new Effect(EffectType.AIRBORNE, 1, 0.5));
                                } 
                            } 
                        }
                    });
                }
                if (monster.targets.size > 0 && Date.now() - monster.extras.latestShot > 1000 * 16 && monster.canUseSkill) {
                    let target = monster.target;
                    let pr = new Projectile({
                        name: '빙결포',
                        owner: monster,
                        attributes: {
                            magicAttack: monster.attribute.getValue(AttributeType.ATTACK) * 3.65,
                            magicPenerate: 40000,
                            moveSpeed: 10000
                        },
                        onHit: (projectile, victim) => {
                            if (victim instanceof LivingEntity){
                                victim.addEffect(new Effect(EffectType.FROZEN, 200, 4));
                            } 
                        }
                    });

                    if (target)
                        pr.attack(target, {
                            isMagicAttack: true
                        });

                    monster.extras.latestShot = Date.now();
                }
            },
            drops: [
                new DropItem('굳은 티타늄', 1, 2, 0.5),
                new DropItem('얼음 정수', 1, 10, 1),
            ]
        },
        {
            name: '메카닉 크로우',
            level: 1800,
            regenTime: 60 * 6,
            gold: 400,
            types: [MonsterType.HUMANOID, MonsterType.METAL],
            tendency: MonsterTendency.NEUTRAL,
            attributes: {
                attack: '+50%',
                moveSpeed: '+20000',
                defendPenetrate: '+90000',
                magicResistance: '-10000',
                maxLife: '+300000+50%',
            },
            stat: {
                vitality: 740,
                strength: 950,
                agility: 3600
            },
            onHitted(monster, attacker) {
                if(!monster.extras.usedShield) {
                    monster.extras.usedShield = true;
                }
            },
            onUpdate: monster => {
                if (monster.getLocation() && monster.getLocation().getPlayers(true).length === 0) 
                    monster.extras.start = false;
                if (!monster.extras.start) {
                    monster.extras.start = true;
                    monster.life = monster.maxLife;
                    monster.extras.latestShot = Date.now() - 1000 * 12;
                    monster.extras.latestSpawn = 0;
                    monster.extras.usedShield = false;
                    monster.extras.latestAirborne = 0;
                }
                if(!monster.extras.usedShield) {
                    monster.addShield('shield', 500000, 2);
                }
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    if (target) monster.attack(target, {
                        onHit: victim => {
                            if (victim instanceof LivingEntity) {
                                victim.addEffect(new Effect(EffectType.DECREASE_DEFEND, 2, 3));
                                if(Date.now() - monster.extras.latestAirborne > 1000 * 2 && Math.random() < 0.6) {
                                    victim.addEffect(new Effect(EffectType.AIRBORNE, 1, 0.5));
                                } 
                            } 
                        }
                    });
                }
                if (monster.targets.size > 0 && Date.now() - monster.extras.latestShot > 1000 * 16 && monster.canUseSkill) {
                    let target = monster.target;
                    let pr = new Projectile({
                        name: '포톤 레이저',
                        owner: monster,
                        attributes: {
                            magicAttack: monster.attribute.getValue(AttributeType.ATTACK) * 3.65,
                            magicPenerate: 40000,
                            moveSpeed: 1000000000
                        },
                        onHit: (projectile, victim) => {
                            if (victim instanceof LivingEntity){
                                victim.addEffect(new Effect(EffectType.BLOOD, 100, 4));
                            } 
                        }
                    });

                    if (target)
                        pr.attack(target, {
                            isMagicAttack: true
                        });

                    monster.extras.latestShot = Date.now();
                }
            },
            drops: [
                new DropItem('굳은 티타늄', 1, 2, 0.5),
            ]
        },
        {
            name: '하이퍼포포스',
            level: 1940,
            regenTime: 60 * 6,
            gold: 2570,
            types: [MonsterType.HUMANOID, MonsterType.METAL],
            tendency: MonsterTendency.NEUTRAL,
            attributes: {
                attack: '+50%',
                magicResistance: '-10000',
                maxLife: '+300000+20%',
            },
            stat: {
                vitality: 2740,
                strength: 950,
                agility: 1600
            },
            onHitted(monster, attacker) {
                if(!monster.extras.usedShield) {
                    monster.extras.usedShield = true;
                }
            },
            onUpdate: monster => {
                let players = monster.getLocation().getPlayers(true);
                if (players.length === 0) 
                    monster.extras.start = false;
                else {
                    players.forEach(p => p.addEffect(new Effect(EffectType.EXPOSE, 16, 1)));
                }
                if (!monster.extras.start) {
                    monster.extras.start = true;
                    monster.life = monster.maxLife;
                    monster.extras.latestShot = Date.now() - 1000 * 12;
                    monster.extras.latestSpawn = 0;
                    monster.extras.latestAirborne = 0;
                }
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    if (target) monster.attack(target, {
                        onHit: victim => {
                            if (victim instanceof LivingEntity) {
                                victim.addEffect(new Effect(EffectType.DECREASE_MAGIC_RESISTANCE, 20, 3));
                                if(Date.now() - monster.extras.latestAirborne > 1000 * 7 && Math.random() < 0.7) {
                                    victim.addEffect(new Effect(EffectType.AIRBORNE, 1, 2.5));
                                } 
                            } 
                        }
                    });
                }
                if (monster.targets.size > 0 && Date.now() - monster.extras.latestShot > 1000 * 16 && monster.canUseSkill) {
                    let target = monster.target;
                    let pr = new Projectile({
                        name: '포포스토스 빔',
                        owner: monster,
                        attributes: {
                            magicAttack: monster.attribute.getValue(AttributeType.ATTACK) * 5.65
                        },
                        onHit: (projectile, victim) => {
                            if (victim instanceof LivingEntity){
                                victim.addEffect(new Effect(EffectType.BLINDNESS, 1, 5));
                            } 
                        }
                    });

                    if (target)
                        pr.attack(target, {
                            isMagicAttack: true,
                            isFixedAttack: true,
                            absoluteHit: true
                        });

                    monster.extras.latestShot = Date.now();
                }
            },
            drops: [
                new DropItem('굳은 티타늄', 1, 2, 0.5),
            ]
        },
        {
            name: '디 엔드리스 프랙처',
            level: 2155,
            regenTime: 60 * 6,
            gold: 2570,
            types: [MonsterType.HUMANOID, MonsterType.METAL],
            tendency: MonsterTendency.NEUTRAL,
            attributes: {
                attack: '+50%',
                magicResistance: '-10000',
                maxLife: '+300000+20%',
            },
            stat: {
                vitality: 2740,
                strength: 950,
                agility: 1600,
                sense: 600
            },
            onHitted(monster, attacker) {
                if(!monster.extras.usedShield) {
                    monster.extras.usedShield = true;
                }
            },
            onUpdate: monster => {
                let players = monster.getLocation().getPlayers(true);
                if (players.length === 0) 
                    monster.extras.start = false;
                else {
                    players.forEach(p => p.addEffect(new Effect(EffectType.EXPOSE, 16, 1)));
                }
                if (!monster.extras.start) {
                    monster.extras.start = true;
                    monster.life = monster.maxLife;
                    monster.extras.latestShot = Date.now() - 1000 * 8;
                    monster.extras.latestSpawn = 0;
                    monster.extras.latestAirborne = 0;
                }
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    if (target) monster.attack(target, {
                        onHit: victim => {
                            if (victim instanceof LivingEntity) {
                                victim.addEffect(new Effect(EffectType.DECREASE_DEFEND, 20, 3));
                                if(Date.now() - monster.extras.latestAirborne > 1000 * 5 && Math.random() < 0.7) {
                                    victim.addEffect(new Effect(EffectType.BLOOD, 100, 4.5));
                                } 
                            } 
                        }
                    });
                }
                if (monster.targets.size > 0 && Date.now() - monster.extras.latestShot > 1000 * 10 && monster.canUseSkill) {
                    let target = monster.target;
                    let pr = new Projectile({
                        name: '트리플 나이핑',
                        owner: monster,
                        attributes: {
                            moveSpeed: 15000,
                            magicAttack: monster.attribute.getValue(AttributeType.ATTACK) * 2.65
                        },
                        onHit: (projectile, victim) => {
                            if (victim instanceof LivingEntity){
                                victim.addEffect(new Effect(EffectType.BLOOD, 150, 2));
                            } 
                        }
                    });

                    if (target) {
                        for(let i = 0; i < 3; i++)
                            pr.attack(target, {
                                isMagicAttack: true,
                                isFixedAttack: true
                            });
                    }
                        

                    monster.extras.latestShot = Date.now();
                }
            },
            drops: [
                new DropItem('굳은 아다만티움', 1, 1, 0.3),
            ]
        },
        {
            name: '역설의 꼭두각시, 폴루토스',
            types: [MonsterType.GOLEM, MonsterType.METAL, MonsterType.HUMANOID],
            tendency: MonsterTendency.HOSTILE,
            level: 4000,
            regenTime: 60 * 30,
            attributes: {
                defend: '+90000',
                magicResistance: '+90000',
                maxLife: '+20000000+130%'
            },
            stat: {
                vitality: 7000,
                agility: 5000,
                sense: 300,
                spell: 700
            },
            onUpdate: monster => {
                if (monster.getLocation() && monster.getLocation().getPlayers(true).length === 0) monster.extras.start = false;
                if (!monster.extras.start) {
                    monster.extras.start = true;
                    monster.extras.magicCount = 0;
                    monster.extras.phase = 0;
                    monster.extras.overmaster = false;
                }

                if (monster.getLocation() && !monster.extras.overmaster && monster.targets.size > 0 && monster.currentTarget) {
                    monster.extras.overmaster = true;
                    let players = monster.getLocation().getPlayers(true);
                    Player.sendGroupRawMessage(players, '[ 폴루토스가 스킬 [ 안티테제 ] 을 사용했다! ]\n' +
                        '이곳에 \'사용자\'가 오는건 오랜만이군요, 반갑습니다. 하지만 곧 떠나셔야겠습니다.');
                    players.forEach(p => {
                        p.addEffect(new Effect(EffectType.OVERMASTER, 400, 4.5, monster));
                    });
                }

                if (monster.getLocation() && monster.life < monster.maxLife * 0.5 && monster.extras.phase === 0) {
                    monster.life = monster.maxLife * 0.7;
                    monster.extras.phase = 1;
                    let players = monster.getLocation().getPlayers(true);
                    Player.sendGroupRawMessage(players, '[ <SYSTEM> [개체명: 폴루토스]가 \'오버클럭\'에 돌입했습니다. ]');
                    players.forEach(p => {
                        p.addEffect(new Effect(EffectType.STUN, 1, 3, monster));
                        p.addEffect(new Effect(EffectType.BLOOD, 500, 10, monster));
                        p.addEffect(new Effect(EffectType.DECREASE_HEAL_EFFICIENCY, 400, 50, monster));
                    });
                }

                if(monster.extras.phase > 0) {
                    monster.attribute.addValue(AttributeType.MAGIC_ATTACK, 4000 * 13);
                    monster.attribute.addValue(AttributeType.CRITICAL_DAMAGE, -2);
                }

                if (monster.getLocation() && monster.targets.size > 0
                    && Date.now() - monster.latestAttack >= 3 * 1000 && Date.now() - monster.extras.overmaster > 1000 * 3) {
                    let projectile: Projectile;
                    let players = monster.getLocation().getPlayers(true);
                    let target = monster.target;
                    switch (Math.floor(Math.random() * 3)) {
                        case 0:
                            projectile = new Projectile({
                                name: '미싱링커',
                                owner: monster,
                                attributes: {
                                    attack: 600000 + monster.attribute.getValue(AttributeType.MAGIC_ATTACK) * 0.8 + (target?.life ?? 0) * 0.1,
                                    moveSpeed: 70000
                                },
                                onHit: (projectile, victim) => {
                                    if (victim instanceof LivingEntity) {
                                        victim.addEffect(new Effect(EffectType.FEAR, 400, 1, monster));
                                        victim.addEffect(new Effect(EffectType.DECREASE_HEAL_EFFICIENCY, 40, 5, monster));
                                    }
                                }
                            });
                            if (target) projectile.attack(target, {
                                isFixedAttack: true,
                                applyAttackSpeed: true
                            });
                            break;
                        case 1:
                            projectile = new Projectile({
                                name: '세퍼레이터',
                                owner: monster,
                                attributes: {
                                    attack: 90000 + monster.attribute.getValue(AttributeType.MAGIC_ATTACK) * 1.4,
                                    moveSpeed: 70000
                                },
                                onHit: (projectile, victim) => {
                                    if (victim instanceof LivingEntity) {
                                        victim.addEffect(new Effect(EffectType.BLOOD, 400, 6, monster));
                                    }
                                }
                            });
                            players.forEach(p => {
                                projectile.attack(p, {
                                    isFixedAttack: true,
                                    applyAttackSpeed: true
                                });
                            });
                            break;
                        case 2:
                            projectile = new Projectile({
                                name: '샤이닝 오퍼레이션',
                                owner: monster,
                                attributes: {
                                    magicAttack: 700000 + monster.attribute.getValue(AttributeType.MAGIC_ATTACK) * 8.9,
                                    moveSpeed: 3000000000
                                },
                                onHit: (projectile, victim) => {
                                    if (victim instanceof LivingEntity) {
                                        if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.BLINDNESS, 400, 2, monster));
                                        if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.SLOWNESS, 5, 10, monster));
                                    }
                                }
                            });
                            players.forEach(p => {
                                if (target) projectile.attack(p, {
                                    isMagicAttack: true,
                                    applyAttackSpeed: true
                                });
                            });
                            break;
                    }
                }
            },
            drops: [
                new DropItem('치트 엔진', 1, 1, 0.1),
                new DropItem('오버플로우', 1, 1, 0.3),
                new DropItem('버려진 설계도', 1, 1, 0.4),
            ],
            gold: 44444
        },
        {
            name: '안티에고이스트',
            level: 2390,
            regenTime: 60 * 6,
            gold: 2570,
            types: [MonsterType.HUMANOID, MonsterType.METAL],
            tendency: MonsterTendency.HOSTILE,
            attributes: {
                attack: '+50%',
                defend: '+20000',
                magicResistance: '-20000',
                maxLife: '+300000+20%',
            },
            stat: {
                vitality: 3150,
                strength: 950,
                agility: 1600,
                sense: 600
            },
            onHitted(monster, attacker) {
                if(!monster.extras.usedShield) {
                    monster.extras.usedShield = true;
                }
            },
            onUpdate: monster => {
                let players = monster.getLocation().getPlayers(true);
                if (players.length === 0) 
                    monster.extras.start = false;
                else {
                    players.forEach(p => p.addEffect(new Effect(EffectType.EXPOSE, 16, 1)));
                }
                if (!monster.extras.start) {
                    monster.extras.start = true;
                    monster.life = monster.maxLife;
                    monster.extras.latestShot = Date.now() - 1000 * 8;
                    monster.extras.latestSpawn = 0;
                    monster.extras.latestAirborne = 0;
                }
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    if (target) monster.attack(target, {
                        onHit: victim => {
                            if (victim instanceof LivingEntity) {
                                victim.addEffect(new Effect(EffectType.DECREASE_DEFEND, 20, 3));
                                if(Date.now() - monster.extras.latestAirborne > 1000 * 5 && Math.random() < 0.7) {
                                    victim.addEffect(new Effect(EffectType.BLOOD, 100, 4.5));
                                } 
                            } 
                        }
                    });
                }
                if (monster.targets.size > 0 && Date.now() - monster.extras.latestShot > 1000 * 10 && monster.canUseSkill) {
                    let target = monster.target;
                    let pr = new Projectile({
                        name: '부정의 역십자',
                        owner: monster,
                        attributes: {
                            magicAttack: monster.attribute.getValue(AttributeType.ATTACK) * 3.25
                        },
                        onHit: (projectile, victim) => {
                            if (victim instanceof LivingEntity){
                                victim.addEffect(new Effect(EffectType.BLOOD, 550, 5));
                            } 
                        }
                    });

                    if (target) {
                        for(let i = 0; i < 2; i++)
                            pr.attack(target, {
                                isMagicAttack: true,
                                isFixedAttack: true,
                                absoluteHit: true
                            });
                    }
                        

                    monster.extras.latestShot = Date.now();
                }
            },
            drops: [
                new DropItem('굳은 아다만티움', 1, 1, 0.3),
            ]
        },
        {
            name: '더 다크나이트 로드',
            types: [MonsterType.DEVILDOM, MonsterType.HUMANOID],
            level: 2031,
            regenTime: 60 * 40,
            gold: 225,
            tendency: MonsterTendency.HOSTILE,
            attributes: {
                attack: '+20%',
                rangeAttack: '+6000+20%',
                defend: '+100000',
                maxLife: '+800000+30%',
                attackSpeed: '-50%'
            },
            stat: {
                strength: 2170,
                vitality: 3723,
                agility: 400,
                sense: 500
            },
            onUpdate: monster => {
                if (monster.getLocation() && monster.getLocation().getPlayers(true).length === 0) monster.extras.start = false;
                if (monster.getLocation() && !monster.extras.start) {
                    monster.extras.start = true;
                    monster.extras.incAtk = false;
                    monster.extras.phase = 1;
                    monster.extras.fire = 15;
                    monster.getLocation().objects.forEach(o => o.deadTime = 0);
                }

                if (monster.getLocation() && monster.hasEffect(EffectType.OVERMASTER)) {
                    monster.removeEffect(EffectType.OVERMASTER);
                    let players = monster.getLocation().getPlayers(true);
                    Player.sendGroupRawMessage(players, '[ 다크나이트 로드가 마에서 끌어온 힘에 의해 제압에서 풀려났습니다! ]\n' +
                        '자신을 속박한 것에 분노하여 잠시 동안 공격력이 20% 상승합니다!');
                    monster.extras.incAtk = true;
                }

                if (monster.getLocation() && monster.life < monster.maxLife * 0.5 && monster.extras.phase === 1 && monster.getLocation().objects.filter(s => s.name === '블러드 크리스탈').some(s => s.isAlive)) {
                    monster.extras.phase++;
                    let players = monster.getLocation().getPlayers(true);
                    Player.sendGroupRawMessage(players, '[ ㄴ..ㅏ는 죽...지 않는다...! ]\n' +
                        '로드가 블러드 크리스탈에게서 죽음의 기운을 불러옵니다...!');
                }

                if (monster.getLocation() && monster.extras.phase === 2 && monster.getLocation().objects.filter(s => s.name === '블러드 크리스탈').some(s => s.isAlive)) {
                    monster.life = Math.max(monster.maxLife * 0.35, monster.life);
                }

                if (monster.getLocation() && monster.extras.fire > 0) {
                    monster.extras.fire -= Time.deltaTime;
                    if (monster.extras.fire <= 0) {
                        let players = monster.getLocation().getPlayers(true);
                        Player.sendGroupRawMessage(players, '[ 이만 죽ㅇㅓ라..! ]\n' +
                            '로드가 검은 연기를 내뿜으며 흑색의 불을 소환했다!');
                        players.forEach(p => p.addEffect(new Effect(EffectType.FIRE, 50, 150, monster)));
                        players.forEach(p => p.addEffect(new Effect(EffectType.DECAY, 20, 10, monster)));
                        monster.extras.fire = 55;
                    }
                }

                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    if (Math.random() < 0.3) {
                        let isSkill = Math.random() < 0.25;
                        let projectile = new Projectile({
                            name: isSkill ? '검은 가시' : '가시',
                            attributes: {
                                attack: monster.attribute.getValue(AttributeType.RANGE_ATTACK) * (monster.extras.incAtk ? 1.2 : 1),
                                moveSpeed: 8000 + monster.attribute.getValue(AttributeType.PROJECTILE_SPEED)
                            },
                            onHit: (projectile, victim) => {
                                if (victim instanceof LivingEntity) {
                                    if (isSkill) {
                                        if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.SILENCE, 1, 3));
                                        if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.STUN, 1, 1));
                                    }
                                    if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.DECREASE_DEFEND, 7, 5));
                                }
                            },
                            owner: monster
                        });
                        if (target) projectile.attack(target, {
                            applyAttackSpeed: true
                        });
                        monster.extras.incAtk = false;
                    }
                    else monster.tryAttack();
                }
            },
            drops: [
                new DropItem('검붉은 가시갈고리', 1, 1, 0.1),
                new DropItem('불의 정수', 10, 100, 1),
                new DropItem('블랙체스트', 1, 1, 0.1)
            ]
        },
        {
            name: '메른베화스 더 데빌 로드',
            types: [MonsterType.DEVILDOM, MonsterType.HUMANOID],
            level: 6666,
            regenTime: 60 * 40,
            gold: 225,
            tendency: MonsterTendency.HOSTILE,
            attributes: {
                attack: '+40%',
                rangeAttack: '+60000+40%',
                defend: '+200000',
                magicResistance: '+200000',
                maxLife: '+20000000+30%'
            },
            stat: {
                strength: 6666,
                vitality: 10666,
                agility: 3666,
                sense: 500
            },
            onUpdate: monster => {
                if (monster.getLocation() && monster.getLocation().getPlayers(true).length === 0) monster.extras.start = false;
                if (monster.getLocation() && !monster.extras.start) {
                    monster.extras.start = true;
                    monster.extras.incAtk = false;
                    monster.extras.phase = 1;
                    monster.extras.fire = 10;
                    monster.getLocation().objects.forEach(o => o.deadTime = 0);
                }

                if (monster.getLocation() && monster.life < monster.maxLife * 0.3 && monster.extras.phase === 1 && 
                    monster.getLocation().objects.filter(s => s.name === '카오스 크리스탈').some(s => s.isAlive)) {
                    monster.extras.phase++;
                    monster.life = monster.maxLife;
                    let players = monster.getLocation().getPlayers(true);
                    Player.sendGroupRawMessage(players, '[ 정말 그게 통할 것이라고 생각했느냐? ]\n' +
                        '마왕이 크리스탈에게서 더 강력한 죽음의 기운을 불러옵니다...!');
                }

                if (monster.getLocation() && monster.extras.phase === 2 && monster.getLocation().objects.filter(s => s.name === '카오스 크리스탈').some(s => s.isAlive)) {
                    monster.life = Math.max(monster.maxLife * 0.2, monster.life);
                }

                if (monster.getLocation() && monster.extras.fire > 0) {
                    monster.extras.fire -= Time.deltaTime;
                    if (monster.extras.fire <= 0) {
                        let players = monster.getLocation().getPlayers(true);
                        Player.sendGroupRawMessage(players, '[ 영원히 불타올라라! ]\n' +
                            '마왕이 게헨나의 사슬로 모두를 속박했습니다!');
                        players.forEach(p => p.addEffect(new Effect(EffectType.FIRE, p.level < monster.level ? 1000 / (players.length * 2 - 1) : 100, 15, monster)));
                        players.forEach(p => p.addEffect(new Effect(EffectType.BIND, 100, 7, monster)));
                        monster.extras.fire = 25;
                    }
                }

                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    if (Math.random() < 0.5) {
                        let isSkill = Math.random() < 0.25;
                        let projectile = new Projectile({
                            name: isSkill ? '카오틱 플레임' : '비올레틱 대거',
                            attributes: {
                                attack: monster.attribute.getValue(AttributeType.RANGE_ATTACK) * (monster.extras.incAtk ? 1.3 : 1),
                                moveSpeed: 58000 + 2 * monster.attribute.getValue(AttributeType.PROJECTILE_SPEED)
                            },
                            onHit: (projectile, victim) => {
                                if (victim instanceof LivingEntity) {
                                    if (isSkill) {
                                        if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.SILENCE, 1, 10));
                                        if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.STUN, 1, 2));
                                    }
                                    if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.DECREASE_HEAL_EFFICIENCY, 10, 6));
                                }
                            },
                            owner: monster
                        });
                        if (target) projectile.attack(target, {
                            applyAttackSpeed: true
                        });
                        monster.extras.incAtk = false;
                    }
                    else monster.tryAttack();
                }
            },
            drops: [
                new DropItem('카오틱 데빌 소드', 1, 1, 0.1),
                new DropItem('카오틱 데빌 완드', 1, 1, 0.1),
                new DropItem('카오틱 데빌 대거', 1, 1, 0.1),
                new DropItem('혼돈의 정수', 10, 100, 1),
                new DropItem('데빌 로드 하트', 1, 1, 0.066)
            ]
        },
        {
            name: '디 아크 커스드 메이지',
            types: [MonsterType.UNDEAD, MonsterType.HUMANOID],
            tendency: MonsterTendency.HOSTILE,
            level: 196,
            regenTime: 60 * 20,
            attributes: {
                defend: '+5000',
                magicResistance: '+2000',
                maxLife: '+30000',
                magicAttack: '+2000'
            },
            stat: {
                vitality: 490,
                spell: 200
            },
            onUpdate: monster => {
                if (monster.getLocation() && monster.getLocation().getPlayers(true).length === 0) monster.extras.start = false;
                if (!monster.extras.start) {
                    monster.extras.start = true;
                    monster.extras.magicCount = 0;
                    monster.extras.phase = 0;
                    monster.extras.overmaster = 0;
                }

                if (monster.getLocation() && !monster.extras.overmaster && monster.targets.size > 0 && monster.currentTarget) {
                    monster.extras.overmaster = Date.now();
                    let players = monster.getLocation().getPlayers(true);
                    Player.sendGroupRawMessage(players, '[ 저주받은 마법사가 스킬 [ 지배자의 눈 ] 을 사용했다! ]\n' +
                        '거대한 눈이 공포스러운 기운으로 노려보며 모두를 제압했다.');
                    players.forEach(p => {
                        p.addEffect(new Effect(EffectType.OVERMASTER, 1, 4.5, monster));
                    });
                }

                if (monster.getLocation() && monster.life < monster.maxLife * 0.35 && monster.extras.phase === 0) {
                    monster.life = monster.maxLife * 0.7;
                    monster.extras.phase++;
                    monster.stat.addStat(StatType.SPELL, 50);
                    let players = monster.getLocation().getPlayers(true);
                    Player.sendGroupRawMessage(players, '[ 저주받은 마법사가 폭주하기 시작합니다! ]');
                    players.forEach(p => {
                        p.addEffect(new Effect(EffectType.FEAR, 1, 2.5, monster));
                    });
                }

                if (monster.getLocation() && monster.targets.size > 0
                    && Date.now() - monster.latestAttack >= 4 * 1000 && Date.now() - monster.extras.overmaster > 1000 * 3) {
                    let projectile: Projectile;
                    let players = monster.getLocation().getPlayers(true);
                    let target = monster.target;
                    switch (monster.extras.magicCount %= 3) {
                        case 0:
                            projectile = new Projectile({
                                name: '프로즌 스파이크',
                                owner: monster,
                                attributes: {
                                    magicAttack: 1000 + monster.attribute.getValue(AttributeType.MAGIC_ATTACK) * 0.8,
                                    moveSpeed: 400
                                },
                                onHit: (projectile, victim) => {
                                    if (victim instanceof LivingEntity)
                                        if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.FROZEN, 5, 5, monster));
                                }
                            });
                            if (target) projectile.attack(target, {
                                isMagicAttack: true,
                                applyAttackSpeed: true
                            });
                            break;
                        case 1:
                            projectile = new Projectile({
                                name: '커스드 쏜',
                                owner: monster,
                                attributes: {
                                    magicAttack: 700 + monster.attribute.getValue(AttributeType.MAGIC_ATTACK) * 0.7,
                                    moveSpeed: 1000
                                },
                                onHit: (projectile, victim) => {
                                    if (victim instanceof LivingEntity) {
                                        if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.BLOOD, 13, 7, monster));
                                        if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.SILENCE, 3, 6.5, monster));
                                    }
                                }
                            });
                            if (target) projectile.attack(target, {
                                isMagicAttack: true,
                                applyAttackSpeed: true
                            });
                            break;
                        case 2:
                            projectile = new Projectile({
                                name: '연쇄 벼락',
                                owner: monster,
                                attributes: {
                                    magicAttack: 700 + monster.attribute.getValue(AttributeType.MAGIC_ATTACK) * 0.9,
                                    moveSpeed: 3000000000
                                },
                                onHit: (projectile, victim) => {
                                    if (victim instanceof LivingEntity) {
                                        if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.FIRE, 5, 6, monster));
                                        if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.STUN, 3, 2, monster));
                                    }
                                }
                            });
                            players.forEach(p => {
                                if (target) projectile.attack(p, {
                                    isMagicAttack: true,
                                    applyAttackSpeed: true
                                });
                            });
                            break;
                    }
                    monster.extras.magicCount++;
                }
            },
            drops: [
                new DropItem('푸른 심장', 1, 1, 0.1),
            ],
            gold: 2600
        },
        {
            name: '얼어붙은 밤의 여제, 카르쉬',
            types: [MonsterType.UNDEAD, MonsterType.ICE, MonsterType.HUMANOID],
            tendency: MonsterTendency.HOSTILE,
            level: 406,
            regenTime: 60 * 20,
            attributes: {
                defend: '+6000',
                magicResistance: '+6000',
                maxLife: '+95000',
                magicAttack: '+2500'
            },
            stat: {
                vitality: 890,
                spell: 328
            },
            onUpdate: monster => {
                if (monster.getLocation() && monster.getLocation().getPlayers(true).length === 0) monster.extras.start = false;
                if (!monster.extras.start) {
                    monster.extras.start = true;
                    monster.extras.magicCount = 0;
                    monster.extras.phase = 0;
                    monster.extras.overmaster = 0;
                }

                if (monster.getLocation() && !monster.extras.overmaster && monster.targets.size > 0 && monster.currentTarget) {
                    monster.extras.overmaster = Date.now();
                    let players = monster.getLocation().getPlayers(true);
                    Player.sendGroupRawMessage(players, '[ 카르쉬가 스킬 [ 지배자의 눈 ] 을 사용했다! ]\n' +
                        '얼어붙은 거대한 눈이 공포스러운 기운으로 노려보며 모두를 제압했다.');
                    players.forEach(p => {
                        p.addEffect(new Effect(EffectType.OVERMASTER, 1, 4.5, monster));
                    });
                }

                if (monster.getLocation() && monster.life < monster.maxLife * 0.5 && monster.extras.phase === 0) {
                    monster.life = monster.maxLife * 0.65;
                    monster.extras.phase++;
                    monster.stat.addStat(StatType.SPELL, 30);
                    let players = monster.getLocation().getPlayers(true);
                    Player.sendGroupRawMessage(players, '[ 카르쉬가 점점 더 얼어붙기 시작합니다! ]');
                    players.forEach(p => {
                        p.addEffect(new Effect(EffectType.FROZEN, 10, 3, monster));
                    });
                }

                if (monster.getLocation() && monster.targets.size > 0
                    && Date.now() - monster.latestAttack >= 4 * 1000 && Date.now() - monster.extras.overmaster > 1000 * 3) {
                    let projectile: Projectile;
                    let players = monster.getLocation().getPlayers(true);
                    let target = monster.target;
                    switch (monster.extras.magicCount %= 3) {
                        case 0:
                            projectile = new Projectile({
                                name: '얼어붙은 가시덤불',
                                owner: monster,
                                attributes: {
                                    magicAttack: 1000 + monster.attribute.getValue(AttributeType.MAGIC_ATTACK) * 0.8,
                                    moveSpeed: 400
                                },
                                onHit: (projectile, victim) => {
                                    if (victim instanceof LivingEntity)
                                        if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.FROZEN, 10, 5, monster));
                                }
                            });
                            if (target) projectile.attack(target, {
                                isMagicAttack: true,
                                applyAttackSpeed: true
                            });
                            break;
                        case 1:
                            projectile = new Projectile({
                                name: '거대한 얼음 대검',
                                owner: monster,
                                attributes: {
                                    magicAttack: 300 + monster.attribute.getValue(AttributeType.MAGIC_ATTACK) * 1.2,
                                    moveSpeed: 1000
                                },
                                onHit: (projectile, victim) => {
                                    if (victim instanceof LivingEntity) {
                                        if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.FROZEN, 13, 7, monster));
                                        if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.STUN, 1, 2, monster));
                                    }
                                }
                            });
                            if (target) projectile.attack(target, {
                                isMagicAttack: true,
                                applyAttackSpeed: true
                            });
                            break;
                        case 2:
                            projectile = new Projectile({
                                name: '블리자드',
                                owner: monster,
                                attributes: {
                                    magicAttack: 700 + monster.attribute.getValue(AttributeType.MAGIC_ATTACK) * 0.9,
                                    moveSpeed: 3000000000
                                },
                                onHit: (projectile, victim) => {
                                    if (victim instanceof LivingEntity) {
                                        if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.FROZEN, 1, 100, monster));
                                        if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.SLOWNESS, 2, 10, monster));
                                    }
                                }
                            });
                            players.forEach(p => {
                                if (target) projectile.attack(p, {
                                    isMagicAttack: true,
                                    applyAttackSpeed: true
                                });
                            });
                            break;
                    }
                    monster.extras.magicCount++;
                }
            },
            drops: [
                new DropItem('푸른 심장', 1, 1, 0.1),
                new DropItem('얼어붙은 수정구', 1, 1, 0.2)
            ],
            gold: 5300
        },
        {
            name: '마그마 큐빅',
            level: 160,
            types: [MonsterType.FIRE],
            regenTime: 60 * 30,
            attributes: {
                defend: '+3000',
                magicResistance: '+3000',
                maxLife: '+20000',
                magicAttack: '+2000'
            },
            stat: {
                vitality: 350,
                spell: 200
            },
            onUpdate: monster => {
                if (monster.getLocation() && monster.getLocation().getPlayers(true).length === 0) monster.extras.start = false;
                if (!monster.extras.start) {
                    monster.extras.start = true;
                    monster.extras.magicCount = 0;
                    monster.extras.phase = 0;
                }

                if (monster.getLocation() && monster.life < monster.maxLife * 0.25 && monster.extras.phase === 0) {
                    monster.life = monster.maxLife * 0.5;
                    monster.extras.phase++;
                    monster.stat.addStat(StatType.SPELL, 50);
                    let players = monster.getLocation().getPlayers(true);
                    Player.sendGroupRawMessage(players, '[ 마그마 큐빅이 불을 뿜어대며 폭주하기 시작합니다! ]');
                    players.forEach(p => {
                        p.addEffect(new Effect(EffectType.FIRE, 20, 5.5, monster));
                    });
                }

                if (monster.getLocation() && monster.targets.size > 0
                    && Date.now() - monster.latestAttack >= 4 * 1000) {
                    let projectile: Projectile;
                    let players = monster.getLocation().getPlayers(true);
                    let target = monster.target;
                    switch (monster.extras.magicCount %= 3) {
                        case 0:
                            projectile = new Projectile({
                                name: '써멀 체인',
                                owner: monster,
                                attributes: {
                                    magicAttack: 1000 + monster.attribute.getValue(AttributeType.MAGIC_ATTACK) * 0.8,
                                    moveSpeed: 400
                                },
                                onHit: (projectile, victim) => {
                                    if (victim instanceof LivingEntity) {
                                        if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.BIND, 1, 3, monster));
                                        if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.FIRE, 5, 10, monster));
                                    }
                                }
                            });
                            if (target) projectile.attack(target, {
                                isMagicAttack: true,
                                applyAttackSpeed: true
                            });
                            break;
                        case 1:
                            projectile = new Projectile({
                                name: '플레임 링',
                                owner: monster,
                                attributes: {
                                    magicAttack: 700 + monster.attribute.getValue(AttributeType.MAGIC_ATTACK) * 0.7,
                                    moveSpeed: 1000
                                },
                                onHit: (projectile, victim) => {
                                    if (victim instanceof LivingEntity) {
                                        if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.SLOWNESS, 10, 6, monster));
                                        if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.FIRE, 5, 4.5, monster));
                                    }
                                }
                            });
                            if (target) projectile.attack(target, {
                                isMagicAttack: true,
                                applyAttackSpeed: true
                            });
                            break;
                        case 2:
                            projectile = new Projectile({
                                name: '써멀 에너지',
                                owner: monster,
                                attributes: {
                                    magicAttack: 700 + monster.attribute.getValue(AttributeType.MAGIC_ATTACK) * 0.9,
                                    moveSpeed: 3000000000
                                },
                                onHit: (projectile, victim) => {
                                    if (victim instanceof LivingEntity) {
                                        if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.FIRE, 2, 60, monster));
                                        if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.STUN, 3, 1.5, monster));
                                    }
                                }
                            });
                            players.forEach(p => {
                                projectile.attack(p, {
                                    isMagicAttack: true,
                                    applyAttackSpeed: true
                                });
                            });
                            break;
                    }
                    monster.extras.magicCount++;
                }
            },
            drops: [
                new DropItem('붉은 심장', 1, 1, 0.1),
                new DropItem('불의 정수', 3, 20, 1)
            ],
            gold: 2600
        },
        {
            name: '데빌 코어',
            level: 3600,
            types: [MonsterType.FIRE],
            regenTime: 60 * 30,
            attributes: {
                defend: '+30000',
                magicResistance: '+30000',
                maxLife: '+20000000',
                magicAttack: '+100000'
            },
            stat: {
                vitality: 9000,
                spell: 2000
            },
            onUpdate: monster => {
                if (monster.getLocation() && monster.getLocation().getPlayers(true).length === 0) monster.extras.start = false;
                if (!monster.extras.start) {
                    monster.extras.start = true;
                    monster.extras.magicCount = 0;
                    monster.extras.phase = 0;
                }

                if (monster.getLocation() && monster.life < monster.maxLife * 0.25 && monster.extras.phase === 0) {
                    monster.life = monster.maxLife * 0.5;
                    monster.extras.phase++;
                    monster.stat.addStat(StatType.SPELL, 50);
                    let players = monster.getLocation().getPlayers(true);
                    Player.sendGroupRawMessage(players, '[ 코어가 폭주합니다! ]');
                    players.forEach(p => {
                        p.addEffect(new Effect(EffectType.AIRBORNE, 1, 3.5, monster));
                    });
                }

                if (monster.getLocation() && monster.targets.size > 0
                    && Date.now() - monster.latestAttack >= 4 * 1000) {
                    let projectile: Projectile;
                    let players = monster.getLocation().getPlayers(true);
                    let target = monster.target;
                    switch (monster.extras.magicCount %= 3) {
                        case 0:
                            projectile = new Projectile({
                                name: '게헨나의 불',
                                owner: monster,
                                attributes: {
                                    magicAttack: 1000 + monster.attribute.getValue(AttributeType.MAGIC_ATTACK) * 0.8,
                                    moveSpeed: 40000
                                },
                                onHit: (projectile, victim) => {
                                    if (victim instanceof LivingEntity) {
                                        if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.BIND, 1, 3, monster));
                                        if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.FIRE, 50, 10, monster));
                                    }
                                }
                            });
                            if (target) projectile.attack(target, {
                                isMagicAttack: true,
                                applyAttackSpeed: true
                            });
                            break;
                        case 1:
                            projectile = new Projectile({
                                name: '카오스 소닉',
                                owner: monster,
                                attributes: {
                                    magicAttack: 700 + monster.attribute.getValue(AttributeType.MAGIC_ATTACK) * 0.7,
                                    moveSpeed: 100000
                                },
                                onHit: (projectile, victim) => {
                                    if (victim instanceof LivingEntity) {
                                        if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.SLOWNESS, 10, 6, monster));
                                        if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.DECREASE_DEFEND, 20, 4.5, monster));
                                    }
                                }
                            });
                            if (target) projectile.attack(target, {
                                isMagicAttack: true,
                                applyAttackSpeed: true
                            });
                            break;
                        case 2:
                            projectile = new Projectile({
                                name: '카오스 에너지',
                                owner: monster,
                                attributes: {
                                    magicAttack: 700 + monster.attribute.getValue(AttributeType.MAGIC_ATTACK) * 0.9,
                                    moveSpeed: 3000000000
                                },
                                onHit: (projectile, victim) => {
                                    if (victim instanceof LivingEntity) {
                                        if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.FIRE, 20, 60, monster));
                                        if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.STUN, 3, 1.5, monster));
                                    }
                                }
                            });
                            players.forEach(p => {
                                projectile.attack(p, {
                                    isMagicAttack: true,
                                    applyAttackSpeed: true
                                });
                            });
                            break;
                    }
                    monster.extras.magicCount++;
                }
            },
            drops: [
                new DropItem('불의 정수', 3, 20, 1)
            ],
            gold: 26000
        },
        {
            name: '푸른 갑주의 망령, 아를렌',
            types: [MonsterType.UNDEAD, MonsterType.HUMANOID],
            level: 270,
            regenTime: 60 * 20,
            attributes: {
                defend: '+33000',
                magicResistance: '+30000',
                maxLife: '+90000',
                attack: '+5000',
                attackSpeed: '-46%'
            },
            stat: {
                vitality: 390,
                agility: 120,
                strength: 300
            },
            onUpdate: monster => {
                if (monster.getLocation() && monster.getLocation().getPlayers(true).length === 0) monster.extras.start = false;
                if (!monster.extras.start) {
                    monster.extras.start = true;
                    monster.life = monster.maxLife;
                    monster.extras.phase = 0;
                    monster.extras.pattern = 0;
                    monster.extras.waitTime = 0;
                }

                if (monster.getLocation() && monster.hasEffect(EffectType.OVERMASTER)) {
                    monster.removeEffect(EffectType.OVERMASTER);
                    let players = monster.getLocation().getPlayers(true);
                    Player.sendGroupRawMessage(players, '[ 아를렌이 영혼화하여 제압에서 풀려났습니다! ]');
                    monster.extras.incAtk = true;
                }

                if (monster.extras.waitTime > 0) {
                    monster.extras.waitTime -= Time.deltaTime;
                    return;
                }

                switch (monster.extras.phase) {
                    case 0:
                        if (monster.getLocation() && monster.targets.size > 0) {
                            let target = monster.target;
                            let players = monster.getLocation().getPlayers(true);
                            switch (monster.extras.pattern %= 3) {
                                case 0:
                                    if (target) monster.attack(target, {
                                        onHit: victim => {
                                            if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.BLOOD, 15, 4));
                                            if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.SLOWNESS, 3, 4));
                                        },
                                        additionalMessage: ComponentBuilder.text('아를렌이 도끼를 가로로 휘둘렀다!')
                                    });
                                    monster.extras.waitTime = 2;
                                    break;
                                case 1:
                                    monster.attribute.multiplyValue(AttributeType.ATTACK, 0.7);
                                    if (players.length) players.forEach(p => {
                                        monster.attack(p, {
                                            onHit: victim => {
                                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.BLOOD, 1, 30));
                                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.SLOWNESS, 10, 5));
                                            },
                                            additionalMessage: ComponentBuilder.text('아를렌이 도끼를 회전하면서 주변을 베었다!')
                                        });
                                    });
                                    monster.extras.waitTime = 2;
                                    break;
                                case 2:
                                    if (target) {
                                        monster.attribute.multiplyValue(AttributeType.ATTACK, 1.3);
                                        monster.attack(target, {
                                            absoluteHit: true,
                                            onHit: victim => {
                                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.SLOWNESS, 11, 8));
                                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.FEAR, 8, 6));
                                            },
                                            additionalMessage: ComponentBuilder.text('아를렌이 도끼를 내려찍었다. 아를렌은 무방비 상태인것 같다!')
                                        });
                                        monster.addEffect(new Effect(EffectType.DECREASE_DEFEND, 26, 10));
                                        monster.addEffect(new Effect(EffectType.DECREASE_MAGIC_RESISTANCE, 25, 10));
                                        monster.extras.waitTime = 12;
                                    }
                                    break;
                            }
                            monster.extras.pattern++;
                        }
                        break;
                }
            },
            drops: [
                new DropItem('블루 소울드 액스', 1, 1, 0.05),
                new DropItem('정화된 영혼조각', 5, 10, 1),
            ],
            gold: 4673
        },
        {
            name: '새끼 거미',
            level: 5,
            types: [MonsterType.SPIDER],
            tendency: MonsterTendency.HOSTILE,
            isUnrevivable: true,
            attributes: {
                attack: '+100',
                defendPenetrate: '+3000',
                attackSpeed: '-60%'
            },
            onUpdate: monster => {
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    monster.tryAttack();
                }
            },
            drops: [
                new DropItem('거미 눈', 1, 8, 0.5)
            ]
        },
        {
            name: '거미',
            level: 10,
            types: [MonsterType.SPIDER],
            tendency: MonsterTendency.HOSTILE,
            attributes: {
                attack: '+300',
                defendPenetrate: '+3000',
                attackSpeed: '-40%'
            },
            onUpdate: monster => {
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    monster.tryAttack();
                }
            },
            drops: [
                new DropItem('거미 눈', 1, 8, 0.5),
                new DropItem('실', 1, 3, 0.8)
            ]
        },
        {
            name: '맹독 거미',
            level: 30,
            tendency: MonsterTendency.HOSTILE,
            isUnrevivable: true,
            attributes: {
                attack: '+200',
                defendPenetrate: '+300',
                attackSpeed: '-60%'
            },
            stat: {
                vitality: 50,
                agility: 40
            },
            onUpdate: monster => {
                if (monster.targets.size > 0
                    && monster.isAttackEnded) {
                    let target = monster.target;
                    let poison = new Projectile({
                        name: '맹독 타액',
                        owner: monster,
                        attributes: {
                            magicAttack: monster.attribute.getValue(AttributeType.ATTACK),
                            moveSpeed: 300
                        },
                        onHit: (projectile, victim) => {
                            if (victim instanceof LivingEntity)
                                if (victim instanceof LivingEntity) victim.addEffect(new Effect(EffectType.POISON, 3, 35));
                        }
                    });
                    if (target) poison.attack(target, {
                        isMagicAttack: true,
                        applyAttackSpeed: true
                    });
                }
            },
            drops: [
                new DropItem('거미 눈', 1, 8, 0.5)
            ]
        }
    ];

    static getMonsterPreset(name: string) {
        return cache[name] ??
            (cache[name] = MonsterPreset.list.find(preset => preset.name === name)) ?? null;
    }
}