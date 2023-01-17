import { Lootable } from "../types";
import { CharacterClass, Location, RegionType } from "./Internal"
import { Npc, NpcChoice, FishDrops, Monster, Terrain, Resource, ShopPreset, Item, ItemStack, ZoneType } from "./Internal"
import Utils from "./Utils";

const cache: { [key: string]: Location | undefined } = {};

export class World {

    
    static FIRST_CLASS_CHANGE = new Location('??', 0, 0, 0, {
        regionType: RegionType.FIRST_CLASS_CHANGE,
        getMovable: loc => ['전사의 길', '마법사의 길', '궁수의 길', '암살자의 길', '성기사의 길', '대장장이의 길'],
        objects: []
    });
    
    static SECOND_CLASS_CHANGE = new Location('???', 0, 0, 0, {
        regionType: RegionType.SECOND_CLASS_CHANGE,
        getMovable: loc => ['?????'],
        objects: [],
    });

    static WORLD_SPAWN = new Location('새터스 마을', 0, 0, 0, {
        getMovable: loc => ['레스토 포레스트 - 1', '레스토 포레스트 - 2', '레스토 포레스트 - 3',
            '해턴의 잡화상점', '대련장', '바볼 광산 - 1', '론테 대장간', '하이튼 평원 - 1', '시스틴 여관', '새터스 낚시터'],
        npcs: [
            new Npc('배고픈 거지', [
                npc => {
                    if(!npc.target) return;
                    if (npc.target.extras.breadHappy) return;
                    npc.say('ㅂ..꼬르륵... 배고파... 누가.. ㅃ..ㅏㅇ좀..');
                    if (npc.target.inventory.hasItem(it => it.name === '딱딱한 빵', 1))
                        npc.choices = [new NpcChoice('(빵을 건네준다.)', 1)];
                },
                npc => {
                    if(!npc.target) return;
                    npc.target.inventory.removeItem(it => it.name === '딱딱한 빵', 1);
                    npc.say('헉.. 가..감사합니다.. 흑');
                    npc.target.extras.breadHappy = true;
                    npc.target.sendMessage('[ (그것은 누군가에겐 \'맛있는 빵\'이었다.) ]');
                    npc.target.exp += 600;
                }
            ])
        ],
        regionType: RegionType.WORLD_SPAWN
    }); 

    static CLASS_CHANGE_LOCATIONS = [
        new Location('전사의 길', 0, 0, 0, {
            getMovable: loc => [],
            objects: [],
            onUpdate: loc => {
                loc.getPlayers(true).forEach(p => {
                    if (p.characterClass === null) p.changeClass('전사');
                    p.location = p.spawn;
                });
            }
        }),
        new Location('성기사의 길', 0, 0, 0, {
            getMovable: loc => [],
            objects: [],
            onUpdate: loc => {
                loc.getPlayers(true).forEach(p => {
                    if (p.characterClass === null) p.changeClass('성기사');
                    p.location = p.spawn;
                });
            }
        }),
        new Location('암살자의 길', 0, 0, 0, {
            getMovable: loc => [],
            objects: [],
            onUpdate: loc => {
                loc.getPlayers(true).forEach(p => {
                    if (p.characterClass === null) p.changeClass('암살자');
                    p.location = p.spawn;
                });
            }
        }),
        new Location('궁수의 길', 0, 0, 0, {
            getMovable: loc => [],
            objects: [],
            onUpdate: loc => {
                loc.getPlayers(true).forEach(p => {
                    if (p.characterClass === null) p.changeClass('궁수');
                    p.location = p.spawn;
                });
            }
        }),
        new Location('마법사의 길', 0, 0, 0, {
            getMovable: loc => [],
            objects: [],
            onUpdate: loc => {
                loc.getPlayers(true).forEach(p => {
                    if (p.characterClass === null) p.changeClass('마법사');
                    p.location = p.spawn;
                });
            }
        }),
        new Location('대장장이의 길', 0, 0, 0, {
            getMovable: loc => [],
            objects: [],
            onUpdate: loc => {
                loc.getPlayers(true).forEach(p => {
                    if (p.characterClass === null) p.changeClass('대장장이');
                    p.location = p.spawn;
                });
            }
        }),
        new Location('?????', 0, 0, 0, {
            getMovable: loc => [],
            objects: [],
            onUpdate: loc => {
                loc.getPlayers(true).forEach(p => {
                    let enhancedClassName = p.getCharacterClass()?.enhancedClassName;
                    if (enhancedClassName) p.changeClass(enhancedClassName);
                    p.location = p.spawn;
                });
            }
        })
    ];

    static locations = [
        World.WORLD_SPAWN,
        World.FIRST_CLASS_CHANGE,
        World.SECOND_CLASS_CHANGE,
        ...World.CLASS_CHANGE_LOCATIONS,
        new Location('새터스 낚시터', -200, 0, 10, {
            getMovable: loc => ['새터스 마을'],
            fishDrops: FishDrops.NORMAL_FRESH
        }),
        new Location('시스틴 여관', -23, 1, 16, {
            getMovable: loc => ['새터스 마을'],
            npcs: [new Npc('여관주인 시스틴', [
                npc => {
                    if(!npc.target) return;
                    npc.say('숙박비는 300골드다.');
                    npc.choices = [
                        new NpcChoice('잠시 구경하러 왔어요..', 1)
                    ];
                    if (npc.target.gold >= 300)
                        npc.choices.push(new NpcChoice('네 여기요.. (골드 소모)', 2));
                },
                npc => {
                    npc.say('참나, 안 묵을거면 꺼져!');
                },
                npc => {
                    if(!npc.target) return;
                    if (npc.target.gold < 300) return npc.act(1);
                    npc.target.gold -= 300;
                    npc.target.spawn = '새터스 마을';
                    npc.say('(방을 가리키며) 여기다.');
                    npc.say('(... 잠시후)');
                    npc.target.heal(500);
                    npc.delayTask(() => {  
                        npc.say('(....몰래 여관을 나왔다)');
                    }, 1300);
                }
            ])]
        }),
        new Location('하이튼 평원 - 1', -150, 5, 50, {
            getMovable: loc => ['새터스 마을', '하이튼 평원 - 2', '하이튼 평원 - 3'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('라임 슬라임'), 2)
                .concat(Utils.repeat(() => Monster.fromName('빅 슬라임'), 2)))
        }),
        new Location('하이튼 평원 - 2', -250, 5, 150, {
            getMovable: loc => ['하이튼 평원 - 1', '하이튼 평원 - 3'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('라임 슬라임'), 2)
            .concat(Utils.repeat(() => Monster.fromName('빅 슬라임'), 2)))
        }),
        new Location('하이튼 평원 - 3', -250, 5, 50, {
            getMovable: loc => ['하이튼 평원 - 2', '하이튼 평원 - 4'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('라임 슬라임'), 2)
            .concat(Utils.repeat(() => Monster.fromName('빅 슬라임'), 5)))
        }),
        new Location('하이튼 평원 - 4', -400, 5, 50, {
            getMovable: loc => ['하이튼 평원 - 3', '하이튼 평원 - 5', '하이튼 평원 - 6'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('야생 멧돼지'), 2)
            .concat(Utils.repeat(() => Monster.fromName('빅 슬라임'), 2)))
        }),
        new Location('하이튼 평원 - 5', -500, 5, 0, {
            getMovable: loc => ['하이튼 평원 - 4', '하이튼 평원 - 6'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('야생 멧돼지'), 2)
            .concat(Utils.repeat(() => Monster.fromName('빅 슬라임'), 2)))
        }),
        new Location('하이튼 평원 - 6', -550, 5, 150, {
            getMovable: loc => ['하이튼 평원 - 4', '하이튼 평원 - 5', '하이튼 평원 - 7'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('야생 멧돼지'), 3)
            .concat(Utils.repeat(() => Monster.fromName('빅 슬라임'), 2)))
        }),
        new Location('하이튼 평원 - 7', -650, 5, 150, {
            getMovable: loc => ['하이튼 평원 - 6', '하이튼 평원 - 8', '다크닉 케이브 - 1'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('거미'), 3))
        }),
        new Location('하이튼 평원 - 8', -750, 5, 150, {
            getMovable: loc => ['하이튼 평원 - 7', '포샤르의 물약 상점', '스펜의 마법 상점', '프로즌 포레스트 - 15'],
            objects: []
        }),
        new Location('프로즌 포레스트 - 15', -950, 7, 150, {
            getMovable: loc => ['하이튼 평원 - 8', '프로즌 포레스트 - 14', '프로즌 포레스트 - 13'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('얼음 뿔 괴물'), 4))
        }),
        new Location('프로즌 포레스트 - 13', -1050, 7, 250, {
            getMovable: loc => ['프로즌 포레스트 - 15', '프로즌 포레스트 - 14'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('얼음 뿔 괴물'), 4))
        }),
        new Location('프로즌 포레스트 - 14', -1050, 7, 100, {
            getMovable: loc => ['프로즌 포레스트 - 15', '프로즌 포레스트 - 13', '프로즌 포레스트 - 12'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('아이스 트롤'), 2))
        }),
        new Location('프로즌 포레스트 - 12', -1250, 7, 100, {
            getMovable: loc => ['프로즌 포레스트 - 14', '프로즌 포레스트 - 11'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('아이스 트롤'), 2))
        }),
        new Location('프로즌 포레스트 - 11', -1350, 7, 100, {
            getMovable: loc => ['프로즌 포레스트 - 12', '프로즌 포레스트 - 10', '프로즌 포레스트 - 9'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('스노우 골렘'), 2))
        }),
        new Location('프로즌 포레스트 - 10', -1450, 7, 100, {
            getMovable: loc => ['프로즌 포레스트 - 11', '프로즌 포레스트 - 8'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('아이스 트롤'), 3))
        }),
        new Location('프로즌 포레스트 - 8', -1550, 7, 100, {
            getMovable: loc => ['프로즌 포레스트 - 10'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('아이스 트롤'), 4)),
            terrains: [Terrain.fromId('purple_box')]
        }),
        new Location('프로즌 포레스트 - 9', -1350, 7, 300, {
            getMovable: loc => ['프로즌 포레스트 - 11', '프로즌 포레스트 - 7'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('스노우 골렘'), 3))
        }),
        new Location('프로즌 포레스트 - 7', -1450, 7, 400, {
            getMovable: loc => ['프로즌 포레스트 - 9', '프로즌 포레스트 - 6'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('스노우 베어'), 2))
        }),
        new Location('프로즌 포레스트 - 6', -1550, 7, 500, {
            getMovable: loc => ['프로즌 포레스트 - 7', '프로즌 포레스트 - 얼음 궁전 입구', '프로즌 포레스트 - 5'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('스노우 베어'), 3))
        }),
        new Location('프로즌 포레스트 - 5', -1650, 7, 600, {
            getMovable: loc => ['프로즌 포레스트 - 6', '프로즌 포레스트 - 얼음 궁전 입구', '프로즌 포레스트 - 4'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('스노우 베어'), 1))
        }),
        new Location('프로즌 포레스트 - 4', -1750, 7, 700, {
            getMovable: loc => ['프로즌 포레스트 - 5', '프로즌 포레스트 - 3'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('아이스 트롤'), 2))
        }),
        new Location('프로즌 포레스트 - 3', -1850, 7, 800, {
            getMovable: loc => ['프로즌 포레스트 - 4', '프로즌 포레스트 - 2'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('얼음 뿔 괴물'), 5))
        }),
        new Location('프로즌 포레스트 - 2', -1950, 7, 900, {
            getMovable: loc => ['프로즌 포레스트 - 3', '프로즌 포레스트 - 1'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('얼음 뿔 괴물'), 2))
        }),
        new Location('프로즌 포레스트 - 1', -2050, 7, 1000, {
            getMovable: loc => ['프로즌 포레스트 - 2', '눈이 덮인 언덕 - 3'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('스노우 웜'), 10))
        }),
        new Location('눈이 덮인 언덕 - 3', -2200, 7, 1000, {
            getMovable: loc => ['프로즌 포레스트 - 1', '눈이 덮인 언덕 - 2'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('스노우 웜'), 10))
        }),
        new Location('눈이 덮인 언덕 - 2', -2200, 7, 1200, {
            getMovable: loc => ['눈이 덮인 언덕 - 1', '눈이 덮인 언덕 - 3'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('스노우 웜'), 10))
        }),
        new Location('눈이 덮인 언덕 - 1', -2200, 7, 1400, {
            getMovable: loc => ['보르스트 마을', '눈이 덮인 언덕 - 2'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('스노우 웜'), 10))
        }),
        new Location('코르코르 늪 - 1', -2000, 7, 1700, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['보르스트 마을', '코르코르 늪 - 2'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('실코라 웜'), 3))
        }),
        new Location('코르코르 늪 - 2', -1800, 7, 1800, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['코르코르 늪 - 1', '코르코르 늪 - 3', '코르코르 늪 - 4'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('실코라 웜'), 5))
        }),
        new Location('코르코르 늪 - 3', -1600, 7, 1900, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['코르코르 늪 - 2', '코르코르 늪 - 5'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('실코라 웜'), 5))
        }),
        new Location('코르코르 늪 - 5', -1400, 7, 2000, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['코르코르 늪 - 3'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('실코라 웜'), 2).concat(Utils.repeat(() => Monster.fromName('포즈네 플라워'), 3)))
        }),
        new Location('코르코르 늪 - 4', -1800, 7, 2100, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['코르코르 늪 - 2', '코르코르 늪 - 6', '코르코르 늪 - 7'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('포즈네 플라워'), 5))
        }),
        new Location('코르코르 늪 - 6', -1800, 7, 2350, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['코르코르 늪 - 4', '코르코르 늪 - 썩음지역'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('포즈네 플라워'), 3))
        }),
        new Location('코르코르 늪 - 썩음지역', -1700, 7, 2600, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['코르코르 늪 - 6'],
            objects: [Monster.fromName('시듦과 부패의 군주, 아닐레트')]
        }),
        new Location('코르코르 늪 - 7', -2000, 7, 2300, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['코르코르 늪 - 4'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('포즈네 플라워'), 7))
        }),
        new Location('마계 - 망자의 골짜기 - 1', 0, 0, 0, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 망자의 골짜기 - 2'],
            objects: [Monster.fromName('지옥의 문지기, 케르베로스')]
        }),
        new Location('마계 - 망자의 골짜기 - 2', 100, -10, 0, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 망자의 골짜기 - 1', '마계 - 망자의 골짜기 - 3'],
            objects: Utils.repeat(() => Monster.fromName('마수 굴탄'), 3)
        }),
        new Location('마계 - 망자의 골짜기 - 3', 200, -20, 0, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 망자의 골짜기 - 2', '마계 - 망자의 골짜기 - 4', '마계 - 망자의 골짜기 - 5'],
            objects: Utils.repeat(() => Monster.fromName('마수 굴탄'), 3)
        }),
        new Location('마계 - 망자의 골짜기 - 4', 300, -30, 0, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 망자의 골짜기 - 3', '마계 - 망자의 골짜기 - 6'],
            objects: Utils.repeat(() => Monster.fromName('마수 레비오스'), 3)
        }),
        new Location('마계 - 망자의 골짜기 - 5', 200, -30, 200, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 망자의 골짜기 - 3', '마계 - 망자의 골짜기 - 6'],
            objects: Utils.repeat(() => Monster.fromName('마수 레비오스'), 5)
        }),
        new Location('마계 - 망자의 골짜기 - 6', 200, -30, 400, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 망자의 골짜기 - 5', '마계 - 망자의 골짜기 - 7'],
            objects: Utils.repeat(() => Monster.fromName('견습 마족'), 10)
        }),
        new Location('마계 - 망자의 골짜기 - 7', 200, -40, 600, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 망자의 골짜기 - 6', '마계 - 망자의 골짜기 - 8'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('마수 만티코어'), 3)
            .concat(Utils.repeat(() => Monster.fromName('견습 마족'), 3)))
        }),
        new Location('마계 - 망자의 골짜기 - 8', 200, -50, 800, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 망자의 골짜기 - 7', '마계 - 망자의 골짜기 - 9', '마계 - 망자의 골짜기 - 10'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('마수 만티코어'), 3)
                .concat(Utils.repeat(() => Monster.fromName('암살자 마족'), 1)))
        }),
        new Location('마계 - 망자의 골짜기 - 9', 100, -50, 1000, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 망자의 골짜기 - 8'],
            objects: Utils.repeat(() => Monster.fromName('마족 전사'), 2)
        }),
        new Location('마계 - 망자의 골짜기 - 10', 0, -50, 1200, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 망자의 골짜기 - 8', '마계 - 심연의 중심'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('마족 전사'), 1)
                .concat(Utils.repeat(() => Monster.fromName('암살자 마족'), 1)))
        }),
        new Location('마계 - 심연의 중심', 0, -50, 1500, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 망자의 골짜기 - 10', '마계 - 흑염의 미로 - 1'],
            objects: [Monster.fromName('서큐버스')]
        }),
        new Location('마계 - 흑염의 미로 - 1', 0, -100, 2000, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.PEACEFUL,
            getMovable: loc => ['마계 - 심연의 중심', '마계 - 흑염의 미로 - 2', '마계 - 흑염의 미로 - 3', '마계 - 흑염의 미로 - 4'],
            objects: []
        }),
        new Location('마계 - 흑염의 미로 - 2', -100, -100, 2000, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.PEACEFUL,
            getMovable: loc => ['마계 - 흑염의 미로 - 1', '마계 - 흑염의 미로 - 5', '마계 - 흑염의 미로 - 7'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('마족 암흑전사'), 1)
                .concat(Utils.repeat(() => Monster.fromName('마족 주술사'), 5)))
        }),
        new Location('마계 - 흑염의 미로 - 3', 0, -100, 2100, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.PEACEFUL,
            getMovable: loc => ['마계 - 흑염의 미로 - 1', '마계 - 흑염의 미로 - 8'],
            objects: []
        }),
        new Location('마계 - 흑염의 미로 - 4', 100, -100, 2000, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.PEACEFUL,
            getMovable: loc => ['마계 - 흑염의 미로 - 1', '마계 - 흑염의 미로 - 11'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('마족 암흑전사'), 5).concat(Utils.repeat(() => Monster.fromName('마족 주술사'), 1)))
        }),
        new Location('마계 - 흑염의 미로 - 5', -200, -100, 2000, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 2', '마계 - 흑염의 미로 - 12'],
            objects: []
        }),
        new Location('마계 - 흑염의 미로 - 6', -200, -100, 2100, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 7', '마계 - 흑염의 미로 - 13'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('마족 주술사'), 10).concat(Utils.repeat(() => Monster.fromName('마수 만티코어'), 1)))
        }),
        new Location('마계 - 흑염의 미로 - 7', -100, -100, 2100, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 2', '마계 - 흑염의 미로 - 6'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('마족 전사'), 1).concat(Utils.repeat(() => Monster.fromName('암살자 마족'), 1)))
        }),
        new Location('마계 - 흑염의 미로 - 8', 0, -100, 2200, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.PEACEFUL,
            getMovable: loc => ['마계 - 흑염의 미로 - 3', '마계 - 흑염의 미로 - 16', '마계 - 흑염의 미로 - 17', '마계 - 흑염의 미로 - 25'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('마족 암흑전사'), 2).concat(Utils.repeat(() => Monster.fromName('암살자 마족'), 1)))
        }),
        new Location('마계 - 흑염의 미로 - 9', 100, -100, 2100, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 10'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('마수 만티코어'), 1).concat(Utils.repeat(() => Monster.fromName('마족 주술사'), 1)))
        }),
        new Location('마계 - 흑염의 미로 - 10', 200, -100, 2100, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 9', '마계 - 흑염의 미로 - 20'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('마수 만티코어'), 1).concat(Utils.repeat(() => Monster.fromName('마족 전사'), 1)))
        }),
        new Location('마계 - 흑염의 미로 - 11', 200, -100, 2000, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 4', '마계 - 흑염의 미로 - 21'],
            objects: []
        }),
        new Location('마계 - 흑염의 미로 - 12', -300, -100, 2000, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 5', '마계 - 흑염의 미로 - 13'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('마수 레비오스'), 1).concat(Utils.repeat(() => Monster.fromName('마족 주술사'), 1)))
        }),
        new Location('마계 - 흑염의 미로 - 13', -300, -100, 2100, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 6', '마계 - 흑염의 미로 - 12'],
            objects: []
        }),
        new Location('마계 - 흑염의 미로 - 14', -300, -100, 2200, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 15', '마계 - 흑염의 미로 - 22'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('마족 전사'), 1).concat(Utils.repeat(() => Monster.fromName('암살자 마족'), 1)))
        }),
        new Location('마계 - 흑염의 미로 - 15', -200, -100, 2200, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 14', '마계 - 흑염의 미로 - 16'],
            objects: []
        }),
        new Location('마계 - 흑염의 미로 - 16', -100, -100, 2200, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 8', '마계 - 흑염의 미로 - 15'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('마족 암흑전사'), 1).concat(Utils.repeat(() => Monster.fromName('마족 주술사'), 1)))
        }),
        new Location('마계 - 흑염의 미로 - 17', 100, -100, 2200, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 8', '마계 - 흑염의 미로 - 18'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('마수 만티코어'), 10).concat(Utils.repeat(() => Monster.fromName('마족 암흑전사'), 1)))
        }),
        new Location('마계 - 흑염의 미로 - 18', 200, -100, 2200, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 17', '마계 - 흑염의 미로 - 19'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('마족 전사'), 1).concat(Utils.repeat(() => Monster.fromName('마족 대장군'), 2)))
        }),
        new Location('마계 - 흑염의 미로 - 19', 300, -100, 2200, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 18'],
            terrains: [Terrain.fromId('black_box')],
            objects: []
        }),
        new Location('마계 - 흑염의 미로 - 20', 300, -100, 2100, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 10', '마계 - 흑염의 미로 - 21'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('마족 전사'), 1).concat(Utils.repeat(() => Monster.fromName('암살자 마족'), 1)))
        }),
        new Location('마계 - 흑염의 미로 - 21', 300, -100, 2000, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 11', '마계 - 흑염의 미로 - 20'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('마족 암흑전사'), 1).concat(Utils.repeat(() => Monster.fromName('마족 주술사'), 1)))
        }),
        new Location('마계 - 흑염의 미로 - 22', -300, -100, 2300, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 14', '마계 - 흑염의 미로 - 23'],
            terrains: [Terrain.fromId('scarlet_box')],
            objects: []
        }),
        new Location('마계 - 흑염의 미로 - 23', -200, -100, 2300, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 22', '마계 - 흑염의 미로 - 24'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('마족 전사'), 1).concat(Utils.repeat(() => Monster.fromName('암살자 마족'), 1)))
        }),
        new Location('마계 - 흑염의 미로 - 24', -100, -100, 2300, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 23', '마계 - 흑염의 미로 - 31'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('마족 암흑전사'), 1).concat(Utils.repeat(() => Monster.fromName('마수 만티코어'), 1)))
        }),
        new Location('마계 - 흑염의 미로 - 25', 0, -100, 2300, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 8', '마계 - 흑염의 미로 - 26'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('마족 주술사'), 3).concat(Utils.repeat(() => Monster.fromName('마족 암흑전사'), 1)))
        }),
        new Location('마계 - 흑염의 미로 - 26', 100, -100, 2300, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 25', '마계 - 흑염의 미로 - 27', '마계 - 흑염의 미로 - 33'],
            objects: []
        }),
        new Location('마계 - 흑염의 미로 - 27', 200, -100, 2300, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 26', '마계 - 흑염의 미로 - 28'],
            objects: []
        }),
        new Location('마계 - 흑염의 미로 - 28', 300, -100, 2300, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 27'],
            objects: []
        }),
        new Location('마계 - 흑염의 미로 - 29', -300, -100, 2400, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 30'],
            objects: []
        }),
        new Location('마계 - 흑염의 미로 - 30', -200, -100, 2400, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 29', '마계 - 흑염의 미로 - 31'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('마족 주술사'), 10).concat(Utils.repeat(() => Monster.fromName('마족 대장군'), 3)))
        }),
        new Location('마계 - 흑염의 미로 - 31', -100, -100, 2400, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 24', '마계 - 흑염의 미로 - 30', '마계 - 흑염의 미로 - 32', '마계 - 흑염의 미로 - 38'],
            terrains: [Terrain.fromId('dark_blue_box_1')],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('마족 전사'), 1).concat(Utils.repeat(() => Monster.fromName('암살자 마족'), 2)))
        }),
        new Location('마계 - 흑염의 미로 - 32', 0, -100, 2400, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.PEACEFUL,
            getMovable: loc => ['마계 - 흑염의 미로 - 31', '마계 - 흑염의 미로 - 33'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('마족 암흑전사'), 1).concat(Utils.repeat(() => Monster.fromName('마족 주술사'), 1)))
        }),
        new Location('마계 - 흑염의 미로 - 33', 100, -100, 2400, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.PEACEFUL,
            getMovable: loc => ['마계 - 흑염의 미로 - 26', '마계 - 흑염의 미로 - 32', '마계 - 흑염의 미로 - 34'],
            objects: []
        }),
        new Location('마계 - 흑염의 미로 - 34', 200, -100, 2400, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 33', '마계 - 흑염의 미로 - 35'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('마족 전사'), 1).concat(Utils.repeat(() => Monster.fromName('암살자 마족'), 1)))
        }),
        new Location('마계 - 흑염의 미로 - 35', 300, -100, 2400, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 34'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('마족 전사'), 1).concat(Utils.repeat(() => Monster.fromName('암살자 마족'), 1)))
        }),
        new Location('마계 - 흑염의 미로 - 36', -300, -100, 2500, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 37', '마계 - 흑염의 미로 - 38', '마계 - 흑염의 미로 - 43'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('마족 주술사'), 1).concat(Utils.repeat(() => Monster.fromName('마족 대장군'), 1)))
        }),
        new Location('마계 - 흑염의 미로 - 37', -200, -100, 2500, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 36', '마계 - 흑염의 미로 - 44'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('마족 대장군'), 1).concat(Utils.repeat(() => Monster.fromName('암살자 마족'), 1)))
        }),
        new Location('마계 - 흑염의 미로 - 38', -100, -100, 2500, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 31', '마계 - 흑염의 미로 - 37', '마계 - 흑염의 미로 - 39'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('마족 암흑전사'), 5).concat(Utils.repeat(() => Monster.fromName('마수 만티코어'), 4)))
        }),
        new Location('마계 - 흑염의 미로 - 39', 0, -100, 2500, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 38', '마계 - 흑염의 미로 - 40'],
            objects: []
        }),
        new Location('마계 - 흑염의 미로 - 40', 100, -100, 2500, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 39', '마계 - 흑염의 미로 - 41', '마계 - 흑염의 미로 - 47'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('마족 암흑전사'), 2).concat(Utils.repeat(() => Monster.fromName('암살자 마족'), 1)))
        }),
        new Location('마계 - 흑염의 미로 - 41', 200, -100, 2500, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 40', '마계 - 흑염의 미로 - 42'],
            terrains: [Terrain.fromId('dark_blue_box_2')],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('마족 전사'), 1).concat(Utils.repeat(() => Monster.fromName('암살자 마족'), 2)))
        }),
        new Location('마계 - 흑염의 미로 - 42', 300, -100, 2500, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 41', '마계 - 흑염의 미로 - 49'],
            objects: []
        }),
        new Location('마계 - 흑염의 미로 - 43', -300, -100, 2600, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 36', '마계 - 흑염의 미로 - 44'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('마족 암흑전사'), 1).concat(Utils.repeat(() => Monster.fromName('마족 주술사'), 1)))
        }),
        new Location('마계 - 흑염의 미로 - 44', -200, -100, 2600, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 37', '마계 - 흑염의 미로 - 43', '마계 - 흑염의 미로 - 45'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('마족 전사'), 1).concat(Utils.repeat(() => Monster.fromName('암살자 마족'), 1)))
        }),
        new Location('마계 - 흑염의 미로 - 45', -100, -100, 2600, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 44', '마계 - 흑염의 미로 - 46'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('마족 전사'), 1).concat(Utils.repeat(() => Monster.fromName('암살자 마족'), 1)))
        }),
        new Location('마계 - 흑염의 미로 - 46', 0, -100, 2600, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 45', '마계 - 흑염의 미로 - 50'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('마족 전사'), 1).concat(Utils.repeat(() => Monster.fromName('암살자 마족'), 1)))
        }),
        new Location('마계 - 흑염의 미로 - 47', 100, -100, 2600, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 40', '마계 - 흑염의 미로 - 48'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('마족 암흑전사'), 1).concat(Utils.repeat(() => Monster.fromName('마족 대장군'), 1)))
        }),
        new Location('마계 - 흑염의 미로 - 48', 200, -100, 2600, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 47', '마계 - 흑염의 미로 - 49'],
            objects: []
        }),
        new Location('마계 - 흑염의 미로 - 49', 300, -100, 2600, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 42', '마계 - 흑염의 미로 - 48'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('마족 대장군'), 1).concat(Utils.repeat(() => Monster.fromName('마족 주술사'), 5)))
        }),
        new Location('마계 - 흑염의 미로 - 50', 0, -100, 2700, {
            regionType: RegionType.DEVILDOM,
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['마계 - 흑염의 미로 - 46'],
            objects: ([Monster.fromName('더 다크나이트 로드')] as Lootable[]).concat(Utils.repeat(() => Resource.fromName('블러드 크리스탈'), 3))
        }),
        new Location('보르스트 마을', -2200, 7, 1600, {
            getMovable: loc => ['눈이 덮인 언덕 - 1', '레플린의 마법 상점', '볼렌 여관', '우로드 잡화점', '피산의 낚시상점', '코르코르 늪 - 1', '얼어붙은 낚시터'],
            npcs: []
        }),
        new Location('얼어붙은 낚시터', -2000, 0, 1600, {
            getMovable: loc => ['보르스트 마을', '피산의 낚시상점'],
            fishDrops: FishDrops.FROZEN_FRESH,
            npcs: []
        }),
        new Location('피산의 낚시상점', -2050, 1, 1600, {
            getMovable: loc => ['보르스트 마을', '얼어붙은 낚시터'],
            npcs: [new Npc('낚시상인 피산', [
                npc => {
                    npc.say('껄껄. 요즘 낚시하는 젊은이는 보기 힘든데. 어서오게나.');
                },
            ])]
        }),
        new Location('우로드 잡화점', -2250, 6, 1650, {
            getMovable: loc => ['보르스트 마을'],
            npcs: [new Npc('잡화상인 우로드', [
                npc => {
                    npc.say('환영한다네! 새터스 마을에서 오셨나?');
                    npc.choices = [new NpcChoice('맞아요. 안녕하세요.', 1), new NpcChoice('아니요, 다른 마을에서 왔어요.', 2)];
                },
                npc => {
                    npc.say('허허. 저쪽 언덕을 지나서 미치광이 여왕이 있는 탓에 그짝 모험가들이 많이 오곤 한다네. 천천히 둘러보시게나.');
                },
                npc => {
                    npc.say('음, 그렇군. 다른 마을에선 오는게 드문 편인데, 워낙 춥기도 하고 말이야. 여튼 천천히 둘러보시게나.');
                }
            ])]
        }),
        new Location('레플린의 마법 상점', -2200, 6, 1550, {
            getMovable: loc => ['보르스트 마을'],
            npcs: [new Npc('마법상인 레플린', [
                npc => {
                    npc.say('안녕! 여기 짱 좋은거 많으니까 한 번 보면 사지 못해서 안달일껄!?');
                }
            ])]
        }),
        new Location('볼렌 여관', -2300, 6, 1600, {
            getMovable: loc => ['보르스트 마을'],
            npcs: [new Npc('여관주인 볼렌', [
                npc => {
                    npc.say('안녕! 뭐하러 왔니?');
                    npc.choices = [
                        new NpcChoice('잠시 묵을 곳이 필요해서요.', 1),
                        new NpcChoice('그냥 한번 들려봤어요.', 2)
                    ];
                },
                npc => {
                    if(!npc.target) return;
                    npc.say('그래? 숙박비는 500골드야. 어떻게 할래?');
                    npc.choices = [
                        new NpcChoice('나중에 다시 올게요.', 2),
                    ];
                    if (npc.target.gold >= 500)
                        npc.choices.push(new NpcChoice('네 여기요. (500골드 소모)', 3));
                },
                npc => {
                    npc.say('뭐, 그래. 천천히 구경해.');
                },
                npc => {
                    if(!npc.target) return;
                    if (npc.target.gold < 300)
                        return npc.act(4);
                    npc.target.gold -= 500;
                    npc.target.spawn = '보르스트 마을';
                    npc.say('자, 이 방이야.');
                    npc.say('(... 잠시후)');
                    npc.target.heal(1000);
                    npc.delayTask(() => {
                        npc.say('뭐야, 너 묵은지 10분도 안됐는데? 뭐, 됐어.');
                    }, 1000);
                },
                npc => {
                    npc.say('뭐야, 너 돈이 없잖아? 나중에 다시 와..');
                }
            ])]
        }),
        new Location('프로즌 포레스트 - 얼음 궁전 입구', -1600, 10, 500, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['프로즌 포레스트 - 6', '얼음 궁전 - 1층', '프로즌 포레스트 - 5'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('서리칼날 늑대'), 1))
        }),
        new Location('얼음 궁전 - 1층', -1600, 12, 500, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['프로즌 포레스트 - 얼음 궁전 입구', '얼음 궁전 - 2층'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('포스 스노우 베어'), 1))
        }),
        new Location('얼음 궁전 - 2층', -1600, 16, 500, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['얼음 궁전 - 1층', '얼음 궁전 - 3층'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('프로즌 골렘'), 2))
        }),
        new Location('얼음 궁전 - 3층', -1600, 20, 500, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['얼음 궁전 - 2층', '얼음 궁전 - 4층'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('얼음 궁수 석상'), 3))
        }),
        new Location('얼음 궁전 - 4층', -1600, 24, 500, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['얼음 궁전 - 3층', '얼음 궁전 - 꼭대기'],
            objects: []
        }),
        new Location('얼음 궁전 - 꼭대기', -1600, 30, 500, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['얼음 궁전 - 4층'],
            objects: [Monster.fromName('얼어붙은 밤의 여제, 카르쉬')]
        }),
        new Location('포샤르의 물약 상점', -750, 5, 100, {
            getMovable: loc => ['하이튼 평원 - 8'],
            npcs: [new Npc('연금술사 포샤르', [
                npc => {
                    npc.say('무슨 물약이 필요하니?');
                }
            ])]
        }),
        new Location('스펜의 마법 상점', -750, 5, 100, {
            getMovable: loc => ['하이튼 평원 - 8'],
            npcs: [new Npc('마법 상인 스펜', [
                npc => {
                    if(!npc.target) return;
                    if (npc.target.gold < 10000)
                        npc.say('돈없으면 나가라;');
                    else npc.say('어머! 어서오세요 손님! ㅎㅎ');
                }
            ])]
        }),
        new Location('다크닉 케이브 - 1', -650, 5, 250, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['하이튼 평원 - 7', '다크닉 케이브 - 2'],
            objects: Utils.shuffle(Utils.repeat(() => Monster.fromName('거미'), 4))
        }),
        new Location('다크닉 케이브 - 2', -650, 5, 350, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['다크닉 케이브 - 1', '다크닉 케이브 - 어둠의 안식처'],
            objects: [Monster.fromName('맹독 거미')]
        }),
        new Location('다크닉 케이브 - 어둠의 안식처', -650, 5, 500, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['다크닉 케이브 - 2', '다크닉 케이브 - 3'],
            objects: [Monster.fromName('퀸 스파이더')]
        }),
        new Location('다크닉 케이브 - 3', -650, 0, 650, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['다크닉 케이브 - 어둠의 안식처', '다크닉 케이브 - 4'],
            objects: [Monster.fromName('마도 공학 골렘')]
        }),
        new Location('다크닉 케이브 - 4', -650, -5, 750, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['다크닉 케이브 - 3', '다크닉 케이브 - 5'],
            objects: [Monster.fromName('마도 공학 골렘')]
        }),
        new Location('다크닉 케이브 - 5', -650, -15, 850, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['다크닉 케이브 - 4', '다크닉 케이브 - 저주받은 마법사의 은신처'],
            objects: Utils.repeat(() => Monster.fromName('마도 공학 골렘'), 3)
        }),
        new Location('다크닉 케이브 - 저주받은 마법사의 은신처', -650, -25, 1050, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['다크닉 케이브 - 5'],
            objects: [Monster.fromName('디 아크 커스드 메이지')]
        }),
        new Location('바볼 광산 - 1', -100, -30, 0, {
            getMovable: loc => ['새터스 마을', '바볼 광산 상점', '바볼 광산 - 2'],
            objects: Utils.shuffle(Utils.repeat(() => Resource.fromName('바위1'), 3).concat(Utils.repeat(() => Resource.fromName('바위2'), 3)).concat(Utils.repeat(() => Resource.fromName('바위0'), 12))),
            zoneType: ZoneType.PEACEFUL
        }),
        new Location('바볼 광산 상점', -120, -35, -30, {
            getMovable: loc => ['바볼 광산 - 1', '바볼 광산 - 2'],
            zoneType: ZoneType.PEACEFUL,
            npcs: [new Npc('광물상인 메이즈', [
                npc => {
                    npc.say('무슨 광물을 캐오셨나요? 아니면 뭔가 사실것이 있나요?');
                }
            ])]
        }),
        new Location('바볼 광산 - 2', -200, -60, 0, {
            getMovable: loc => ['바볼 광산 - 1', '바볼 광산 - 3', '바볼 광산 - 4'],
            objects: Utils.shuffle(Utils.repeat(() => Resource.fromName('바위2'), 6).concat(Utils.repeat(() => Resource.fromName('바위0'), 3)).concat(Utils.repeat(() => Resource.fromName('바위1'), 8))),
            zoneType: ZoneType.PEACEFUL
        }),
        new Location('바볼 광산 - 3', -250, -90, -50, {
            getMovable: loc => ['바볼 광산 - 2', '바볼 광산 - 4'],
            objects: Utils.shuffle(Utils.repeat(() => Resource.fromName('바위2'), 10).concat(Utils.repeat(() => Resource.fromName('바위3'), 1)).concat(Utils.repeat(() => Resource.fromName('바위1'), 5))),
            zoneType: ZoneType.PEACEFUL
        }),
        new Location('바볼 광산 - 4', -350, -120, 50, {
            getMovable: loc => ['바볼 광산 - 3', '바볼 광산 - 5', '바볼 광산 - 6'],
            objects: Utils.shuffle(Utils.repeat(() => Resource.fromName('바위2'), 5).concat(Utils.repeat(() => Resource.fromName('바위1'), 2)).concat(Utils.repeat(() => Resource.fromName('바위3'), 10))),
            zoneType: ZoneType.PEACEFUL
        }),
        new Location('바볼 광산 - 5', -450, -160, 50, {
            getMovable: loc => ['바볼 광산 - 4'],
            objects: Utils.shuffle(Utils.repeat(() => Resource.fromName('바위2'), 1).concat(Utils.repeat(() => Resource.fromName('바위1'), 2)).concat(Utils.repeat(() => Resource.fromName('바위3'), 17))),
            zoneType: ZoneType.PEACEFUL
        }),
        new Location('바볼 광산 - 6', -350, -170, 150, {
            getMovable: loc => ['바볼 광산 - 4'],
            objects: Utils.shuffle(Utils.repeat(() => Resource.fromName('바위2'), 4).concat(Utils.repeat(() => Resource.fromName('바위1'), 2)).concat(Utils.repeat(() => Resource.fromName('바위3'), 15))),
            zoneType: ZoneType.PEACEFUL
        }),
        new Location('대련장', 0, 0, 0, {
            getMovable: loc => ['새터스 마을'],
            objects: Utils.repeat(() => Monster.fromName('허수아비'), 10),
            zoneType: ZoneType.NORMAL
        }),
        new Location('해턴의 잡화상점', 35, 5, 35, {
            getMovable: loc => ['새터스 마을', '레스토 포레스트 - 2'],
            npcs: [new Npc('잡화상인 해턴', [
                npc => {
                    npc.say('안녕하신가! 모험가양반이 말을 걸어주는건 오랜만이구려! 껄껄.');
                    npc.choices = [new NpcChoice('안녕하세요. 대화해주는 사람이 많이 없는 편인가요?', 1)];
                },
                npc => {
                    npc.say('아무래도 그렇지. 이 늙은이에게 물건이나 팔러 올 뿐이지.. 누가 말을 걸어주겠나?');
                }
            ])]
        }),
        new Location('론테 대장간', 40, 2, -25, {
            getMovable: loc => ['새터스 마을'],
            npcs: [new Npc('대장장이 론테', [
                npc => {
                    npc.say('...');
                }
            ])]
        }),
        new Location('레스토 포레스트 - 1', 85, 5, 0, {
            getMovable: loc => ['새터스 마을', '레스토 포레스트 - 2', '레스토 포레스트 - 5'],
            objects: (Utils.repeat(() => Monster.fromName('라토 래빗'), 5) as Lootable[])
                .concat(Utils.repeat(() => Resource.fromName('마른 나무'), 2)),
        }),
        new Location('레스토 포레스트 - 5', 175, 5, 0, {
            getMovable: loc => ['레스토 포레스트 - 1'],
            objects: (Utils.repeat(() => Monster.fromName('야생 멧돼지'), 3) as Lootable[])
                .concat(Utils.repeat(() => Resource.fromName('마른 나무'), 2)),
        }),
        new Location('레스토 포레스트 - 2', 85, 5, 85, {
            getMovable: loc => ['새터스 마을', '해턴의 잡화상점', '레스토 포레스트 - 1', '레스토 포레스트 - 3', '레스토 포레스트 - 11'],
            objects: (Utils.repeat(() => Monster.fromName('라토 래빗'), 6) as Lootable[])
                .concat(Utils.repeat(() => Resource.fromName('마른 나무'), 2)),
        }),
        new Location('레스토 포레스트 - 3', 0, 5, 85, {
            getMovable: loc => ['새터스 마을', '레스토 포레스트 - 2', '레스토 포레스트 - 4'],
            objects: (Utils.repeat(() => Monster.fromName('라토 래빗'), 7) as Lootable[])
                .concat(Utils.repeat(() => Resource.fromName('마른 나무'), 2)),
        }),
        new Location('레스토 포레스트 - 4', 0, 8, 160, {
            getMovable: loc => ['레스토 포레스트 - 3', '레스토 포레스트 - 6'],
            objects: (Utils.repeat(() => Monster.fromName('야생 멧돼지'), 2) as Lootable[])
                .concat(Utils.repeat(() => Resource.fromName('마른 나무'), 2)),
            terrains: [Terrain.fromId('gold_box_1')]
        }),
        new Location('레스토 포레스트 - 6', 0, 8, 220, {
            getMovable: loc => ['레스토 포레스트 - 4', '레스토 포레스트 - 7'],
            objects: (Utils.repeat(() => Monster.fromName('레드테일 울프'), 1) as Lootable[])
                .concat(Utils.repeat(() => Resource.fromName('마른 나무'), 2))
        }),
        new Location('레스토 포레스트 - 7', 0, 8, 270, {
            getMovable: loc => ['레스토 포레스트 - 6', '레스토 포레스트 - 8'],
            objects: (Utils.repeat(() => Monster.fromName('레드테일 울프'), 1) as Lootable[])
                .concat(Utils.repeat(() => Resource.fromName('마른 나무'), 2))
        }),
        new Location('레스토 포레스트 - 8', 0, 8, 320, {
            getMovable: loc => ['레스토 포레스트 - 7', '레스토 포레스트 - 9'],
            objects: (Utils.repeat(() => Monster.fromName('레드테일 울프'), 2) as Lootable[])
                .concat(Utils.repeat(() => Resource.fromName('마른 나무'), 2))
        }),
        new Location('레스토 포레스트 - 9', 80, 8, 320, {
            getMovable: loc => ['레스토 포레스트 - 8', '레스토 포레스트 - 10', '레스토 포레스트 - 11'],
            objects: (Utils.repeat(() => Monster.fromName('흰 꼬리 늑대'), 1) as Lootable[])
                .concat(Utils.repeat(() => Resource.fromName('마른 나무'), 2))
        }),
        new Location('레스토 포레스트 - 10', 80, 8, 380, {
            getMovable: loc => ['레스토 포레스트 - 9', '레스토 포레스트 - 늑대들의 안식처'],
            objects: (Utils.repeat(() => Monster.fromName('흰 꼬리 늑대'), 2) as Lootable[])
                .concat(Utils.repeat(() => Resource.fromName('마른 나무'), 2))
        }),
        new Location('레스토 포레스트 - 늑대들의 안식처', 81, 6, 510, {
            getMovable: loc => ['레스토 포레스트 - 10'],
            objects: (Utils.repeat(() => Monster.fromName('흰 꼬리 거대 늑대'), 1) as Lootable[])
                .concat(Utils.repeat(() => Resource.fromName('마른 나무'), 2))
        }),
        new Location('레스토 포레스트 - 11', 80, 8, 160, {
            getMovable: loc => ['레스토 포레스트 - 9', '레스토 포레스트 - 2', '산토스 바위 지역 - 1'],
            objects: (Utils.repeat(() => Monster.fromName('야생 멧돼지'), 5) as Lootable[])
                .concat(Utils.repeat(() => Resource.fromName('마른 나무'), 2))
        }),
        new Location('산토스 바위 지역 - 1', 200, 8, 190, {
            getMovable: loc => ['레스토 포레스트 - 11', '산토스 바위 지역 - 2', '산토스 바위 지역 - 3'],
            objects: Utils.repeat(() => Monster.fromName('바위 거북'), 5)
        }),
        new Location('산토스 바위 지역 - 2', 300, 8, 190, {
            getMovable: loc => ['산토스 바위 지역 - 1', '산토스 바위 지역 - 3'],
            objects: Utils.repeat(() => Monster.fromName('바위 거북'), 4)
        }),
        new Location('산토스 바위 지역 - 3', 270, 8, 220, {
            getMovable: loc => ['산토스 바위 지역 - 1', '산토스 바위 지역 - 2', '산토스 바위 지역 - 4'],
            objects: Utils.repeat(() => Monster.fromName('바위 거북'), 5)
        }),
        new Location('산토스 바위 지역 - 4', 330, 9, 250, {
            getMovable: loc => ['산토스 바위 지역 - 3', '산토스 바위 지역 - 5'],
            objects: Utils.repeat(() => Monster.fromName('바위 골렘'), 1).concat(Utils.repeat(() => Monster.fromName('바위 거북'), 3))
        }),
        new Location('산토스 바위 지역 - 5', 400, 9, 280, {
            getMovable: loc => ['산토스 바위 지역 - 4', '산토스 바위 지역 - 6'],
            objects: Utils.repeat(() => Monster.fromName('바위 골렘'), 3)
        }),
        new Location('산토스 바위 지역 - 6', 480, 10, 300, {
            getMovable: loc => ['산토스 바위 지역 - 5', '산토스 바위 지역 - 7', '산토스 바위 지역 - 8'],
            objects: Utils.repeat(() => Monster.fromName('청크 바위 골렘'), 1)
        }),
        new Location('산토스 바위 지역 - 7', 560, 10, 320, {
            getMovable: loc => ['산토스 바위 지역 - 6', '산토스 바위 지역 - 8', '옴페니 화산 지역 - 1'],
            objects: Utils.repeat(() => Monster.fromName('플레임 리자드'), 2)
        }),
        new Location('산토스 바위 지역 - 8', 580, 10, 250, {
            getMovable: loc => ['산토스 바위 지역 - 6', '산토스 바위 지역 - 7'],
            objects: Utils.repeat(() => Monster.fromName('청크 바위 골렘'), 2)
        }),
        new Location('옴페니 화산 지역 - 1', 540, 10, 400, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['산토스 바위 지역 - 7', '옴페니 화산 지역 - 2', '옴페니 화산 지역 - 3'],
            objects: Utils.repeat(() => Monster.fromName('라바 리자드'), 5)
        }),
        new Location('옴페니 화산 지역 - 2', 600, 10, 500, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['옴페니 화산 지역 - 1', '옴페니 화산 지역 - 3'],
            objects: Utils.repeat(() => Monster.fromName('불거북'), 3)
        }),
        new Location('옴페니 화산 지역 - 3', 440, 10, 500, {
            zoneType: ZoneType.NEUTRAL,
            terrains: Utils.shuffle(Utils.repeat(() => Terrain.fromId('plant_1'), 4).concat([
                Terrain.fromId('plant_2'), Terrain.fromId('plant_3')
            ])),
            getMovable: loc => ['옴페니 화산 지역 - 1', '옴페니 화산 지역 - 2', '옴페니 화산 지역 - 코어'],
            objects: Utils.repeat(() => Monster.fromName('불거북'), 2)
        }),
        new Location('옴페니 화산 지역 - 코어', 330, 10, 550, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['옴페니 화산 지역 - 3', '옴페니 화산 지역 - 4'],
            objects: Utils.repeat(() => Monster.fromName('마그마 큐빅'), 1)
        }),
        new Location('옴페니 화산 지역 - 4', 200, 10, 630, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: function () {
                let list = ['옴페니 화산 지역 - 코어', '옴페니 화산 지역 - 5'];
                let door = this.objects?.find(o => o instanceof Resource && o.name === '오염된 강철문');
                if (door && !door.isAlive) list.push('인모르투 던전 - 1');
                return list;
            },
            objects: (Utils.repeat(() => Monster.fromName('불거북'), 3) as Lootable[])
                .concat([Resource.fromName('오염된 강철문')])
        }),
        new Location('옴페니 화산 지역 - 5', 100, 10, 730, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['옴페니 화산 지역 - 4', '옴페니 화산 지역 - 6'],
            objects: Utils.repeat(() => Monster.fromName('불거북'), 6)
        }),
        new Location('옴페니 화산 지역 - 6', 200, 15, 830, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['옴페니 화산 지역 - 5'],
            objects: Utils.repeat(() => Monster.fromName('불거북'), 10)
        }),
        new Location('인모르투 던전 - 1', 200, -50, 630, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => {
                let list = [];
                let shards = loc.terrains.filter(o => o instanceof Terrain && o.name.includes('라이프 샤드'));
                let answer = [false, false, false, true, false];
                let isCorrect = true;
                for (let i = 0; i < shards.length; i++) {
                    let isOn = shards[i].name.includes('●');
                    if (isOn !== answer[i]) {
                        isCorrect = false;
                        break;
                    }
                }
                if (isCorrect) list.push('인모르투 던전 - 2');
                return list;
            },
            terrains: Utils.repeat(() => Terrain.fromId('life_shard'), 5).concat([Terrain.fromId('black_characters')])
        }),
        new Location('인모르투 던전 - 2', 200, -55, 580, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['인모르투 던전 - 3', '인모르투 던전 - 4'],
            objects: [
                Monster.fromName('망령 기사')
            ]
        }),
        new Location('인모르투 던전 - 3', 250, -55, 500, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['인모르투 던전 - 2', '인모르투 던전 - 5', '인모르투 던전 - 6'],
            objects: Utils.repeat(() => Monster.fromName('망령 기사'), 2)
        }),
        new Location('인모르투 던전 - 5', 300, -55, 500, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['인모르투 던전 - 3', '인모르투 던전 - 7', '인모르투 던전 - 8', '인모르투 던전 - 9'],
            objects: Utils.repeat(() => Monster.fromName('망령 기사'), 2)
        }),
        new Location('인모르투 던전 - 7', 350, -65, 500, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['인모르투 던전 - 5'],
            objects: Utils.repeat(() => Monster.fromName('망령 기사'), 2)
        }),
        new Location('인모르투 던전 - 8', 400, -75, 500, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['인모르투 던전 - 5'],
            objects: Utils.repeat(() => Monster.fromName('해골 궁수'), 3)
        }),
        new Location('인모르투 던전 - 9', 450, -85, 500, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['인모르투 던전 - 5'],
            objects: Utils.repeat(() => Monster.fromName('망령 기사'), 4)
        }),
        new Location('인모르투 던전 - 6', 250, -65, 600, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['인모르투 던전 - 3', '인모르투 던전 - 10', '인모르투 던전 - 11'],
            terrains: [
                Terrain.fromId('gold_box_3')
            ],
            objects: Utils.repeat(() => Monster.fromName('망령 기사'), 3)
        }),
        new Location('인모르투 던전 - 10', 250, -55, 700, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['인모르투 던전 - 6'],
            objects: Utils.repeat(() => Monster.fromName('해골 궁수'), 2)
        }),
        new Location('인모르투 던전 - 11', 250, -75, 700, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['인모르투 던전 - 6', '인모르투 던전 - 12', '인모르투 던전 - 13'],
            objects: Utils.repeat(() => Monster.fromName('망령 기사'), 2)
        }),
        new Location('인모르투 던전 - 12', 300, -85, 760, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['인모르투 던전 - 11', '인모르투 던전 - 14'],
            objects: Utils.repeat(() => Monster.fromName('망령 기사'), 2)
        }),
        new Location('인모르투 던전 - 14', 300, -85, 840, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['인모르투 던전 - 12'],
            objects: Utils.repeat(() => Monster.fromName('해골 궁수'), 2).concat(Utils.repeat(() => Monster.fromName('망령 기사'), 2))
        }),
        new Location('인모르투 던전 - 13', 200, -85, 760, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['인모르투 던전 - 11', '인모르투 던전 - 15'],
            objects: Utils.repeat(() => Monster.fromName('망령 기사'), 2)
        }),
        new Location('인모르투 던전 - 15', 200, -85, 850, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['인모르투 던전 - 13', '인모르투 던전 - 16', '인모르투 던전 - 17'],
            objects: Utils.repeat(() => Monster.fromName('망령 기사'), 2)
        }),
        new Location('인모르투 던전 - 16', 250, -95, 900, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['인모르투 던전 - 15', '인모르투 던전 - 18', '인모르투 던전 - 망각의 우물'],
            objects: Utils.repeat(() => Monster.fromName('망령 기사'), 2)
        }),
        new Location('인모르투 던전 - 망각의 우물', 350, -95, 900, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['인모르투 던전 - 16'],
            terrains: [Terrain.fromId('well_of_oblivion')]
        }),
        new Location('인모르투 던전 - 18', 250, -100, 1000, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['인모르투 던전 - 16', '인모르투 던전 - 19'],
            objects: Utils.repeat(() => Monster.fromName('망령 기사'), 2)
        }),
        new Location('인모르투 던전 - 19', 250, -100, 1100, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['인모르투 던전 - 18', '인모르투 던전 - 망자의 공간'],
            objects: Utils.repeat(() => Monster.fromName('망령 기사'), 2)
        }),
        new Location('인모르투 던전 - 망자의 공간', 400, -100, 1000, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['인모르투 던전 - 19'],
            objects: Utils.repeat(() => Monster.fromName('푸른 갑주의 망령, 아를렌'), 1)
        }),
        new Location('인모르투 던전 - 17', 250, -85, 900, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['인모르투 던전 - 15'],
            objects: Utils.repeat(() => Monster.fromName('해골 궁수'), 5)
        }),
        new Location('인모르투 던전 - 11', 250, -75, 700, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['인모르투 던전 - 6', '인모르투 던전 - 12', '인모르투 던전 - 13'],
            objects: Utils.repeat(() => Monster.fromName('망령 기사'), 2)
        }),
        new Location('인모르투 던전 - 4', 150, -55, 500, {
            zoneType: ZoneType.NEUTRAL,
            getMovable: loc => ['인모르투 던전 - 2'],
            objects: [Monster.fromName('해골 궁수')]
        })
    ];

    static getLocation(name: string): Location {
        let loc = cache[name] ?? (cache[name] = World.locations.find(loc => loc.name === name));
        if(!loc) throw new Error('Invalid Location Name : ' + name);
        return loc;
    }
}