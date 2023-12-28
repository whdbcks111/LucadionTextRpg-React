
import { SpellAction, SpellMap } from "../../types";
import { AttributeType, Effect, EffectType, LivingEntity, Player, Projectile, Utils } from "../Internal";
import { ComponentBuilder } from "../server/chat/ComponentBuilder";

export class SpellCombination {

    static spells = ['플렌느', '아르', '레람', '쿠아르', '테라', 
        '디스파르', '스피아', '볼테', '루멘즈', '아피아도', 
        '데스마이아', '셀펜토'];

    static runSpellWithCost(p: Player, cost: number, action: () => boolean) {
        if(p.mana >= cost) p.mana -= cost;
        else {
            SpellCombination.exhaust(p);
            return true;
        }
        return action();
    }
    
    static runProjectileSpell(p: Player, cost: number, projectile: Projectile): boolean {
        const target = p.currentTarget;
        if(!target) return false;
        return SpellCombination.runSpellWithCost(p, cost, () => {
            projectile.attack(target, { isMagicAttack: true, useAbuserCritical: true });
            return true;
        });
    }

    static runBoltSpell(p: Player, name: string, effect: Effect, cost = p.level * 4): boolean {
        const projectile = new Projectile({
            name,
            owner: p,
            attributes: {
                magicAttack: Math.max(0, (p.level - 200) * 80) + 
                    p.attribute.getValue(AttributeType.MAGIC_ATTACK) * 1.35,
                moveSpeed: 2000 + p.level
            },
            onHit(_, victim) {
                if(victim instanceof LivingEntity) victim.addEffect(effect);
            }
        });

        return SpellCombination.runProjectileSpell(p, cost, projectile);
    }

    static spellMap: SpellMap | SpellAction = { //역순
        '셀펜토': {
            '테라': {
                '테라': p => SpellCombination.runSpellWithCost(p, p.level * 20, () => {
                    p.sendRawMessage('[ 대지의 방어막이 당신을 보호합니다! ]');
                    p.addShield('terra_shield', p.attribute.getValue(AttributeType.MAGIC_ATTACK), 10);
                    return true;
                })
            }
        },
        '디스파르': {
            '아피아도': {
                '아르': {
                    '플렌느': p => SpellCombination.runProjectileSpell(p, p.level * 7, new Projectile({
                        name: '염화포',
                        owner: p,
                        attributes: {
                            magicAttack: Math.max(0, (p.level - 200) * 100) + 
                                p.attribute.getValue(AttributeType.MAGIC_ATTACK) * 1.5,
                            moveSpeed: 3000 + p.level
                        },
                        onHit(_, victim) {
                            if(victim instanceof LivingEntity) 
                                victim.addEffect(new Effect(EffectType.FIRE, 30, 10, p));
                        }
                    }))
                }
            },
            '볼테': {
                '플렌느': p => SpellCombination.runBoltSpell(p, '파이어 볼트', 
                        new Effect(EffectType.FIRE, 10 + Math.floor(p.level / 50), 30, p)),
                '아르': p => SpellCombination.runBoltSpell(p, '에어 볼트', 
                        new Effect(EffectType.NAUSEA, 1, 2, p)),
                '쿠아르': p => SpellCombination.runBoltSpell(p, '아쿠아 볼트', 
                        new Effect(EffectType.SLOWNESS, 6 + Math.floor(p.level / 200), 6, p)),
                '레람': p => SpellCombination.runBoltSpell(p, '일렉트릭 볼트', 
                    new Effect(EffectType.STUN, 1, 1.5, p), p.level * 7)
            },
            '데스마이아': {
                '아르': {
                    '아르': {
                        '아르': p => SpellCombination.runProjectileSpell(p, p.level * 40, new Projectile({
                            name: '스토닉 윈드 스톰',
                            owner: p,
                            attributes: {
                                magicAttack: Math.max(0, (p.level - 200) * 150) + 
                                    p.attribute.getValue(AttributeType.MAGIC_ATTACK) * 2.5,
                                moveSpeed: 3000 + p.level * 2
                            },
                            onHit(_, victim) {
                                if(victim instanceof LivingEntity) 
                                    victim.addEffect(new Effect(EffectType.AIRBORNE, 1, 2, p));
                            }
                        }))
                    }
                }
            },
            '루멘즈': {
                '루멘즈': p => SpellCombination.runProjectileSpell(p, p.level * 20, new Projectile({
                    name: '샤이닝 임팩트',
                    owner: p,
                    attributes: {
                        magicAttack: 0,
                        moveSpeed: 1000000000
                    },
                    onHit(_, victim) {
                        if(victim instanceof LivingEntity) 
                            victim.addEffect(new Effect(EffectType.BLINDNESS, 1, 3, p));
                    }
                }))
            },
            '스피아': {
                '스피아': {
                    '테라': {
                        '플렌느': {
                            '플렌느': p => SpellCombination.runProjectileSpell(p, p.level * 55, new Projectile({
                                name: '메테오',
                                owner: p,
                                attributes: {
                                    magicAttack: Math.max(0, (p.level - 100) * 250) + 
                                        p.attribute.getValue(AttributeType.MAGIC_ATTACK) * 3.3,
                                    moveSpeed: 4000 + p.level * 4
                                },
                                onHit(_, victim) {
                                    if(victim instanceof LivingEntity) {
                                        victim.addEffect(new Effect(EffectType.FIRE, 
                                            50 + Math.floor(p.level / 50), 15, p));
                                        victim.addEffect(new Effect(EffectType.STUN, 1, 1, p));
                                    }
                                }
                            }))
                        }
                    }
                }
            }
        }
    }

    static exhaust(p: Player) {
        p.mana = 0;
        p.sendMessage(ComponentBuilder.embed([
            ComponentBuilder.text('[ ...! 몸에 힘이 빠진다.. ]')
        ], 'lightgray'));
        p.addEffect(new Effect(EffectType.STUN, 1, 5));
    }
    
    static complete(p: Player, spellLog: [string, string][], depth: number) {
        spellLog.slice(-depth).forEach(pair => {
            const [spell, id] = pair;
            p.user.room?.editChat(id,
                ComponentBuilder.embed([
                    ComponentBuilder.text(spell, {
                        color: 'gold',
                    })
                ], Utils.MAGIC_COLOR)
            );
        });
    }

    static getSpell(spellLog: [string, string][]) {
        let cur: SpellMap | SpellAction | undefined = SpellCombination.spellMap;
        let depth = 0;
        while(cur) {
            if(typeof cur === 'function') {
                return spellLog.slice(-depth).map(e => e[0]).join(' ');
            }
            else {
                const next = spellLog.at(-(depth + 1));
                if(!next) return null;
                const nextSpell = next[0];
                cur = cur[nextSpell];
                depth++;
            }
        }
        return null;
    }

    static runSpell(p: Player, spellLog: [string, string][]): false | number {
        let cur: SpellMap | SpellAction | undefined = SpellCombination.spellMap;
        let depth = 0;
        while(cur) {
            if(typeof cur === 'function') {
                if(cur(p)) {
                    SpellCombination.complete(p, spellLog, depth);
                    return depth;
                }
                else return false;
            }
            else {
                const next = spellLog.at(-(depth + 1));
                if(!next) return false;
                const nextSpell = next[0];
                cur = cur[nextSpell];
                depth++;
            }
        }
        return false;
    }
}