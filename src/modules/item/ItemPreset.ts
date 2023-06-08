import { ItemPresetObject } from "../../types";
import { AttributeModifier, EquipmentType, StatType, Utils } from "../Internal";
import { AttributeType } from "../Internal";
import { Item, Material, Effect, EffectType, Option } from "../Internal";

const cache: { [key: string]: ItemPresetObject | undefined} = {};

export class ItemPreset {

    static list: ItemPresetObject[] = [
        {
            name: '낡은 목검',
            type: '장검',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 60),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 0.95),
                new AttributeModifier(true, AttributeType.ATTACK_SPEED, 0.9)
            ],
            durability: 100
        },
        {
            name: '딱딱한 빵',
            type: '식료',
            maxCount: 15,
            onUse: Item.FOOD_USE_EVENT({ food: 117.5 })
        },
        {
            name: '말라붙은 육포',
            type: '식료',
            maxCount: 50,
            onUse: Item.FOOD_USE_EVENT({ food: 77.5 })
        },
        {
            name: '사과',
            type: '식료',
            maxCount: 15,
            onUse: Item.FOOD_AND_WATER_USE_EVENT({ food: 77.3, water: 45.8 })
        },
        {
            name: '낡은 낚싯대',
            type: '낚싯대',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 30),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 0.94),
                new AttributeModifier(true, AttributeType.ATTACK_SPEED, 0.9)
            ],
            durability: 500,
        },
        {
            name: '고급 낚싯대',
            type: '낚싯대',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 30),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 0.97),
                new AttributeModifier(true, AttributeType.ATTACK_SPEED, 0.9),
                new AttributeModifier(false, AttributeType.LUCK, 10)
            ],
            durability: 500,
        },
        {
            name: '부싯돌 화살',
            type: '화살',
            maxCount: 100,
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 30),
                new AttributeModifier(false, AttributeType.DEFEND_PENETRATE, 80),
            ]
        },
        {
            name: '철제 화살',
            type: '화살',
            maxCount: 100,
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 550),
                new AttributeModifier(false, AttributeType.DEFEND_PENETRATE, 100),
            ]
        },
        {
            name: '샤프 애로우',
            type: '화살',
            maxCount: 70,
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 450),
                new AttributeModifier(false, AttributeType.DEFEND_PENETRATE, 250),
            ]
        },
        {
            name: '모험가의 활',
            type: '활',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 30),
                new AttributeModifier(false, AttributeType.RANGE_ATTACK, 350),
                new AttributeModifier(true, AttributeType.ATTACK_SPEED, 1.1),
                new AttributeModifier(false, AttributeType.PROJECTILE_SPEED, 100),
            ],
            durability: 2000,
            attack: Item.BOW_ATTACK_EVENT
        },
        {
            name: '루메니컬 보우',
            type: '활',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 30),
                new AttributeModifier(false, AttributeType.RANGE_ATTACK, 550),
                new AttributeModifier(false, AttributeType.DEFEND_PENETRATE, 100),
                new AttributeModifier(true, AttributeType.DEFEND_PENETRATE, 1.1),
                new AttributeModifier(true, AttributeType.ATTACK_SPEED, 1.15),
                new AttributeModifier(false, AttributeType.PROJECTILE_SPEED, 600),
            ],
            durability: 2200,
            attack: Item.BOW_ATTACK_EVENT,
            options: [
                new Option('둔화', { level: 3, time: 2 })
            ]
        },
        {
            name: '코이니스 보우',
            type: '활',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 30),
                new AttributeModifier(false, AttributeType.RANGE_ATTACK, 650),
                new AttributeModifier(false, AttributeType.DEFEND_PENETRATE, 500),
                new AttributeModifier(true, AttributeType.ATTACK_SPEED, 1.1),
                new AttributeModifier(false, AttributeType.PROJECTILE_SPEED, 1000),
            ],
            durability: 1500,
            attack: Item.BOW_ATTACK_EVENT,
            options: [
                new Option('프로즌', { level: 3, time: 5 })
            ]
        },
        {
            name: '그레만스 보우',
            type: '활',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 100),
                new AttributeModifier(false, AttributeType.RANGE_ATTACK, 2500),
                new AttributeModifier(true, AttributeType.RANGE_ATTACK, 1.05),
                new AttributeModifier(false, AttributeType.DEFEND_PENETRATE, 30000),
                new AttributeModifier(true, AttributeType.ATTACK_SPEED, 1.05),
                new AttributeModifier(false, AttributeType.PROJECTILE_SPEED, 1000),
            ],
            durability: 700,
            attack: Item.BOW_ATTACK_EVENT,
            options: [
                new Option('출혈', { level: 100, time: 3 })
            ],
            requiredLevel: 600
        },
        {
            name: '마공학 Vol.3 매지컬 보우',
            type: '활',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 100),
                new AttributeModifier(false, AttributeType.RANGE_ATTACK, 700),
                new AttributeModifier(true, AttributeType.RANGE_ATTACK, 1.2),
                new AttributeModifier(false, AttributeType.DEFEND_PENETRATE, 1000),
                new AttributeModifier(true, AttributeType.DEFEND_PENETRATE, 1.15),
                new AttributeModifier(true, AttributeType.ATTACK_SPEED, 1.2),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 1.1),
                new AttributeModifier(false, AttributeType.PROJECTILE_SPEED, 2000),
            ],
            durability: 5200,
            attack: Item.BOW_ATTACK_EVENT,
            options: [
                new Option('출혈', { level: 10, time: 7 })
            ]
        },
        {
            name: '입자가속 마공제 활',
            type: '활',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 300),
                new AttributeModifier(false, AttributeType.RANGE_ATTACK, 1000),
                new AttributeModifier(true, AttributeType.RANGE_ATTACK, 1.25),
                new AttributeModifier(false, AttributeType.DEFEND_PENETRATE, 3000),
                new AttributeModifier(true, AttributeType.DEFEND_PENETRATE, 1.25),
                new AttributeModifier(true, AttributeType.ATTACK_SPEED, 1.2),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 1.4),
                new AttributeModifier(false, AttributeType.PROJECTILE_SPEED, 3000),
            ],
            durability: 5200,
            attack: Item.BOW_ATTACK_EVENT
        },
        {
            name: '철제 단검',
            type: '단검',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 160),
                new AttributeModifier(true, AttributeType.DEFEND_PENETRATE, 1.06),
                new AttributeModifier(true, AttributeType.ATTACK_SPEED, 1.05),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 0.98),
            ],
            durability: 300
        },
        {
            name: '돌 곡괭이',
            type: '곡괭이',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 260),
                new AttributeModifier(false, AttributeType.DEFEND_PENETRATE, 960),
                new AttributeModifier(true, AttributeType.ATTACK_SPEED, 0.6),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 0.9),
            ],
            durability: 190
        },
        {
            name: '철제 곡괭이',
            type: '곡괭이',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 356),
                new AttributeModifier(false, AttributeType.DEFEND_PENETRATE, 1260),
                new AttributeModifier(true, AttributeType.ATTACK_SPEED, 0.6),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 0.9),
            ],
            durability: 665
        },
        {
            name: '중급 곡괭이',
            type: '곡괭이',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 560),
                new AttributeModifier(false, AttributeType.DEFEND_PENETRATE, 1600),
                new AttributeModifier(true, AttributeType.ATTACK_SPEED, 0.7),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 0.8),
            ],
            durability: 695
        },
        {
            name: '날카로운 곡괭이',
            type: '곡괭이',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 756),
                new AttributeModifier(false, AttributeType.DEFEND_PENETRATE, 1800),
                new AttributeModifier(true, AttributeType.ATTACK_SPEED, 0.7),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 0.7),
            ],
            durability: 765
        },
        {
            name: '비센틱 픽액스',
            type: '곡괭이',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 1500),
                new AttributeModifier(false, AttributeType.DEFEND_PENETRATE, 5700),
                new AttributeModifier(true, AttributeType.ATTACK_SPEED, 1.1),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 0.7),
            ],
            durability: 500
        },
        {
            name: '레어 곡괭이',
            type: '곡괭이',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 1056),
                new AttributeModifier(false, AttributeType.DEFEND_PENETRATE, 4300),
                new AttributeModifier(true, AttributeType.ATTACK_SPEED, 0.7),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 0.9),
            ],
            durability: 200
        },
        {
            name: '철제 장검',
            type: '장검',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 260),
                new AttributeModifier(true, AttributeType.DEFEND_PENETRATE, 1.06),
                new AttributeModifier(true, AttributeType.ATTACK_SPEED, 0.94),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 0.98),
            ],
            durability: 700
        },
        {
            name: '강철 망치',
            type: '망치',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 230),
                new AttributeModifier(true, AttributeType.DEFEND_PENETRATE, 1.6),
                new AttributeModifier(true, AttributeType.ATTACK_SPEED, 0.8),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 0.93),
            ],
            durability: 1000
        },
        {
            name: '장검',
            type: '장검',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND)
        },
        {
            name: '대검',
            type: '대검',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND)
        },
        {
            name: '단검',
            type: '단검',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND)
        },
        {
            name: '도끼',
            type: '도끼',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND)
        },
        {
            name: '블러디 소드',
            type: '장검',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 300),
                new AttributeModifier(true, AttributeType.DEFEND_PENETRATE, 1.16),
                new AttributeModifier(true, AttributeType.ATTACK_SPEED, 0.93),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 0.97),
            ],
            options: [
                new Option('출혈', { level: 1, time: 10 })
            ],
            durability: 750
        },
        {
            name: '서리검',
            type: '장검',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 300),
                new AttributeModifier(true, AttributeType.DEFEND_PENETRATE, 0.9),
                new AttributeModifier(true, AttributeType.ATTACK_SPEED, 1.07),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 1.1),
            ],
            options: [
                new Option('둔화', { level: 2, time: 10 }),
                new Option('프로즌', { level: 3, time: 5 })
            ],
            durability: 500
        },
        {
            name: '볼테딘 숏소드',
            type: '단검',
            maxCount: 1,
            requiredLevel: 120,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 880),
                new AttributeModifier(true, AttributeType.DEFEND_PENETRATE, 1.36),
                new AttributeModifier(false, AttributeType.DEFEND_PENETRATE, 2000),
                new AttributeModifier(true, AttributeType.ATTACK_SPEED, 1.07),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 1.1),
            ],
            options: [
                new Option('출혈', { level: 5, time: 20 })
            ],
            durability: 450
        },
        {
            name: '파란색 전투용 도끼',
            type: '도끼',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 360),
                new AttributeModifier(true, AttributeType.DEFEND_PENETRATE, 1.2),
                new AttributeModifier(true, AttributeType.ATTACK_SPEED, 0.8),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 0.9),
            ],
            durability: 567
        },
        {
            name: '벌목용 도끼',
            type: '도끼',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 360),
                new AttributeModifier(true, AttributeType.DEFEND_PENETRATE, 1.25),
                new AttributeModifier(false, AttributeType.DEFEND_PENETRATE, 100),
                new AttributeModifier(true, AttributeType.ATTACK_SPEED, 0.7),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 0.8),
            ],
            durability: 567
        },
        {
            name: '블루 소울드 액스',
            type: '도끼',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 3100),
                new AttributeModifier(true, AttributeType.ATTACK, 1.2),
                new AttributeModifier(true, AttributeType.DEFEND_PENETRATE, 1.6),
                new AttributeModifier(false, AttributeType.DEFEND_PENETRATE, 500),
                new AttributeModifier(true, AttributeType.ATTACK_SPEED, 0.67),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 0.9),
            ],
            durability: 6670,
            options: [
                new Option('출혈', { level: 5, time: 5 }),
                new Option('둔화', { level: 7, time: 5 })
            ]
        },
        {
            name: '버려진 해방자의 도끼',
            type: '도끼',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 13100),
                new AttributeModifier(true, AttributeType.ATTACK, 1.1),
                new AttributeModifier(true, AttributeType.DEFEND_PENETRATE, 1.6),
                new AttributeModifier(false, AttributeType.DEFEND_PENETRATE, 20000),
                new AttributeModifier(true, AttributeType.ATTACK_SPEED, 0.67),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 0.7),
            ],
            durability: 6670,
            options: [
                new Option('프로즌', { level: 20, time: 3 }),
                new Option('둔화', { level: 10, time: 5 })
            ]
        },
        {
            name: '가죽 갑옷',
            type: '갑옷',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.BODY),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.DEFEND, 190),
                new AttributeModifier(false, AttributeType.MAGIC_RESISTANCE, 30),
                new AttributeModifier(true, AttributeType.ATTACK_SPEED, 0.98),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 0.96),
            ],
            durability: 450,
        },
        {
            name: '빙결 저항 갑옷',
            type: '갑옷',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.BODY),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.DEFEND, 190),
                new AttributeModifier(false, AttributeType.MAGIC_RESISTANCE, 150),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 0.9),
            ],
            durability: 1050,
            options: [
                new Option('빙결 저항', { level: 3 })
            ]
        },
        {
            name: '철제 갑옷',
            type: '갑옷',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.BODY),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.DEFEND, 339),
                new AttributeModifier(false, AttributeType.MAGIC_RESISTANCE, 160),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 0.85),
            ],
            durability: 1350
        },
        {
            name: '청동 갑옷',
            type: '갑옷',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.BODY),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.DEFEND, 239),
                new AttributeModifier(false, AttributeType.MAGIC_RESISTANCE, 260),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 0.95),
            ],
            durability: 1350
        },
        {
            name: '블랙체스트',
            type: '갑옷',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.BODY),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.DEFEND, 23899),
                new AttributeModifier(true, AttributeType.DEFEND, 1.1),
                new AttributeModifier(false, AttributeType.MAGIC_RESISTANCE, 15500),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 0.7),
            ],
            durability: 3050
        },
        {
            name: '대 마법사용 안티매직 망토',
            type: '망토',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.BODY),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.DEFEND, 190),
                new AttributeModifier(false, AttributeType.MAGIC_RESISTANCE, 2700),
                new AttributeModifier(true, AttributeType.MAGIC_RESISTANCE, 1.1),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 0.95),
                new AttributeModifier(true, AttributeType.MAX_MANA, 0.95),
            ],
            durability: 1350
        },
        {
            name: '마그네틱 쉴드 망토',
            type: '망토',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.BODY),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.DEFEND, 3000),
                new AttributeModifier(false, AttributeType.MAGIC_RESISTANCE, 1000),
                new AttributeModifier(true, AttributeType.MAGIC_RESISTANCE, 1.03),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 1.05),
                new AttributeModifier(true, AttributeType.MAX_MANA, 0.94),
            ],
            durability: 1050,
            options: [
                new Option('라이프배리어', { life: 0.2, shield: 50000 })
            ]
        },
        {
            name: '대미지셀프 링',
            type: '반지',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.ACCESSORY),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.DEFEND, 100),
                new AttributeModifier(true, AttributeType.ATTACK, 1.2),
                new AttributeModifier(true, AttributeType.MAX_LIFE, 0.9),
            ],
            durability: 1350
        },
        {
            name: '얼어붙은 수정구',
            type: '수정구',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.ACCESSORY),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.MAGIC_RESISTANCE, 750),
                new AttributeModifier(true, AttributeType.MAX_LIFE, 1.05),
            ],
            durability: 1350,
            options: [
                new Option('프로즌', { level: 7, time: 5 })
            ]
        },
        {
            name: '철제 레깅스',
            type: '레깅스',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.LEGS),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.DEFEND, 194),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 0.8),
                new AttributeModifier(false, AttributeType.MAGIC_RESISTANCE, 131),
            ],
            durability: 1250
        },
        {
            name: '철제 투구',
            type: '투구',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HEAD),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.DEFEND, 154),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 0.91),
                new AttributeModifier(false, AttributeType.MAGIC_RESISTANCE, 131),
            ],
            durability: 950
        },
        {
            name: '철제 부츠',
            type: '부츠',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.FEET),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.DEFEND, 154),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 1.09),
                new AttributeModifier(false, AttributeType.MAGIC_RESISTANCE, 131),
            ],
            durability: 950
        },
        {
            name: '메가도니우슈즈',
            type: '부츠',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.FEET),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.DEFEND, 10054),
                new AttributeModifier(true, AttributeType.HEAL_EFFICIENCY, 1.1),
                new AttributeModifier(true, AttributeType.MAGIC_RESISTANCE, 2),
            ],
            durability: 3950,
            requiredLevel: 1255
        },
        {
            name: '독을 묻힌 단검',
            type: '단검',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 170),
                new AttributeModifier(false, AttributeType.DEFEND_PENETRATE, 50),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 0.98),
                new AttributeModifier(true, AttributeType.ATTACK_SPEED, 1.05),
            ],
            durability: 300,
            options: [
                new Option('독날', { level: 1, time: 8 })
            ]
        },
        {
            name: '플레니르 소드',
            type: '장검',
            requiredLevel: 60,
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 400),
                new AttributeModifier(false, AttributeType.DEFEND_PENETRATE, 150),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 0.98),
                new AttributeModifier(true, AttributeType.ATTACK_SPEED, 0.97),
            ],
            durability: 4000,
            options: [
                new Option('발화', { level: 3, time: 10 })
            ]
        },
        {
            name: '마력검',
            type: '장검',
            maxCount: 1,
            getDescription: () => '마나로 이루어진 검날로, 마법 공격력만 적용된다.',
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.MAGIC_ATTACK, 360),
                new AttributeModifier(true, AttributeType.MAGIC_PENETRATE, 1.05),
                new AttributeModifier(true, AttributeType.ATTACK_SPEED, 0.99),
            ],
            durability: 1234,
            attack: Item.MAGIC_ATTACK_EVENT
        },
        {
            name: '오래된 반지',
            type: '장신구',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.ACCESSORY),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.MAGIC_ATTACK, 160),
                new AttributeModifier(false, AttributeType.MAX_MANA, 500),
                new AttributeModifier(true, AttributeType.MAGIC_PENETRATE, 1.05),
            ],
            durability: 834
        },
        {
            name: '로스트 이어링',
            type: '장신구',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.ACCESSORY),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.MAGIC_RESISTANCE, 100),
                new AttributeModifier(true, AttributeType.MAGIC_RESISTANCE, 1.2),
                new AttributeModifier(false, AttributeType.MAX_MANA, 5000),
                new AttributeModifier(false, AttributeType.DEFEND_PENETRATE, 1000),
            ],
            durability: 834
        },
        {
            name: '메이키 링',
            type: '장신구',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.ACCESSORY),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.MAGIC_ATTACK, 170),
                new AttributeModifier(true, AttributeType.MAGIC_RESISTANCE, 1.05),
                new AttributeModifier(false, AttributeType.MAX_MANA, 900),
            ],
            durability: 334
        },
        {
            name: '다크 서멀 링',
            type: '장신구',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.ACCESSORY),
            attributeModifiers: [
                new AttributeModifier(true, AttributeType.MAGIC_ATTACK, 1.05),
                new AttributeModifier(true, AttributeType.ATTACK, 1.05),
                new AttributeModifier(true, AttributeType.RANGE_ATTACK, 1.05),
                new AttributeModifier(false, AttributeType.MAX_LIFE, 500),
            ],
            requiredLevel: 60,
            durability: 334
        },
        {
            name: '어둠의 목걸이',
            type: '장신구',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.ACCESSORY),
            attributeModifiers: [
                new AttributeModifier(true, AttributeType.MAGIC_ATTACK, 1.15),
                new AttributeModifier(true, AttributeType.ATTACK, 1.15),
                new AttributeModifier(true, AttributeType.RANGE_ATTACK, 1.15),
                new AttributeModifier(true, AttributeType.MAX_LIFE, 0.9),
                new AttributeModifier(true, AttributeType.ATTACK_SPEED, 0.9),
            ],
            requiredLevel: 500,
            durability: 1034
        },
        {
            name: '작은 배낭',
            type: '가방',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.BACKPACK),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.INVENTORY_SPACE, 5),
            ],
            durability: 1334
        },
        {
            name: '금속 마법 지팡이',
            type: '지팡이',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.MAGIC_ATTACK, 700),
                new AttributeModifier(false, AttributeType.ATTACK, 100),
                new AttributeModifier(false, AttributeType.MAX_MANA, 1000),
                new AttributeModifier(true, AttributeType.MAGIC_PENETRATE, 1.3),
            ],
            durability: 1034
        },
        {
            name: '경량형 마력 대검',
            type: '대검',
            maxCount: 1,
            getDescription: () => '마나로 이루어진 검날로, 마법 공격력만 적용된다.',
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.MAGIC_ATTACK, 1100),
                new AttributeModifier(true, AttributeType.ATTACK_SPEED, 1.05),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 1.05),
                new AttributeModifier(true, AttributeType.MAGIC_PENETRATE, 1.1),
            ],
            durability: 2345,
            attack: Item.MAGIC_ATTACK_EVENT
        },
        {
            name: '검붉은 가시갈고리',
            type: '장검',
            maxCount: 1,
            getDescription: () => '마계의 기운이 서려있다..',
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 15600),
                new AttributeModifier(true, AttributeType.ATTACK, 1.1),
                new AttributeModifier(false, AttributeType.MAX_LIFE, 50000),
                new AttributeModifier(true, AttributeType.MAX_LIFE, 1.05),
                new AttributeModifier(false, AttributeType.MAGIC_PENETRATE, 3000),
                new AttributeModifier(true, AttributeType.MAGIC_PENETRATE, 1.15),
                new AttributeModifier(false, AttributeType.DEFEND_PENETRATE, 10000),
                new AttributeModifier(true, AttributeType.ATTACK_SPEED, 1.2),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 1.25),
            ],
            durability: 20345,
            options: [
                new Option('흑염', { level: 40, time: 10, chance: 0.3 })
            ],
            requiredLevel: 1400
        },
        {
            name: '몬크라스 대거',
            type: '단검',
            maxCount: 1,
            getDescription: () => '마계의 기운이 서려있다..',
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 20600),
                new AttributeModifier(false, AttributeType.MAGIC_RESISTANCE, 3000),
                new AttributeModifier(true, AttributeType.MAGIC_RESISTANCE, 1.15),
                new AttributeModifier(false, AttributeType.CRITICAL_DAMAGE, 100),
                new AttributeModifier(true, AttributeType.ATTACK, 0.8),
                new AttributeModifier(true, AttributeType.ATTACK_SPEED, 1.2),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 1.2),
                new AttributeModifier(true, AttributeType.CRITICAL_CHANCE, 1.07),
            ],
            durability: 20345,
            options: [
                new Option('라이프배리어', { life: 0.3, shield: 400000, time: 10 })
            ],
            requiredLevel: 700
        },
        {
            name: '비센틱 메카코닉스',
            type: '장신구',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.ACCESSORY),
            attributeModifiers: [
                new AttributeModifier(true, AttributeType.MAGIC_ATTACK, 0.9),
                new AttributeModifier(false, AttributeType.MAGIC_ATTACK, 20000),
                new AttributeModifier(false, AttributeType.INVENTORY_SPACE, 3),
                new AttributeModifier(false, AttributeType.PROJECTILE_SPEED, 5000),
            ],
            durability: 2000,
            options: [
                new Option('자연 재생', { lifeRegen: 1500 })
            ],
            requiredLevel: 1200
        },
        {
            name: '크산디르 소드',
            type: '장검',
            maxCount: 1,
            getDescription: () => '마계의 기운이 서려있다..',
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 3060),
                new AttributeModifier(true, AttributeType.ATTACK, 1.15),
                new AttributeModifier(false, AttributeType.MAGIC_RESISTANCE, 1000),
                new AttributeModifier(true, AttributeType.ATTACK_SPEED, 0.8),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 1.25),
            ],
            durability: 4345,
            options: [
                new Option('발화', { level: 20, time: 20 })
            ],
            requiredLevel: 500
        },
        {
            name: '르호크 투핸디드 소드',
            type: '대검',
            maxCount: 1,
            getDescription: () => '붉은 색의 오러가 둘러져 있다..',
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 12321),
                new AttributeModifier(true, AttributeType.ATTACK, 1.16),
                new AttributeModifier(false, AttributeType.LIFE_REGEN, 100),
                new AttributeModifier(true, AttributeType.DEFEND, 1.03),
            ],
            durability: 6345,
            options: [
                new Option('구속', { level: 20, time: 2 })
            ],
            requiredLevel: 1100
        },
        {
            name: '무접점 마도 공학 지팡이',
            type: '지팡이',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 100),
                new AttributeModifier(false, AttributeType.MAGIC_ATTACK, 2000),
                new AttributeModifier(false, AttributeType.MAX_MANA, 3000),
                new AttributeModifier(true, AttributeType.MAGIC_PENETRATE, 1.32),
                new AttributeModifier(false, AttributeType.MAGIC_PENETRATE, 500),
            ],
            durability: 2034
        },
        {
            name: '다크닉 그랜드 완드',
            type: '지팡이',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 100),
                new AttributeModifier(false, AttributeType.MAGIC_ATTACK, 35600),
                new AttributeModifier(true, AttributeType.MAGIC_ATTACK, 1.1),
                new AttributeModifier(false, AttributeType.MAX_MANA, 100000),
                new AttributeModifier(true, AttributeType.MAGIC_PENETRATE, 1.32),
                new AttributeModifier(false, AttributeType.MAGIC_PENETRATE, 500),
            ],
            durability: 2034,
            requiredLevel: 900
        },
        {
            name: '지오닉 순환마력 지팡이',
            type: '지팡이',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 100),
                new AttributeModifier(false, AttributeType.MAGIC_ATTACK, 2200),
                new AttributeModifier(false, AttributeType.MANA_REGEN, 50),
                new AttributeModifier(true, AttributeType.MAGIC_PENETRATE, 1.3),
                new AttributeModifier(false, AttributeType.MAGIC_PENETRATE, 500),
            ],
            durability: 2500
        },
        {
            name: '거미여왕의 날카로운 송곳니',
            type: '단검',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 300),
                new AttributeModifier(true, AttributeType.ATTACK, 1.06),
                new AttributeModifier(false, AttributeType.DEFEND_PENETRATE, 100),
                new AttributeModifier(true, AttributeType.DEFEND, 1.03),
            ],
            durability: 1000,
            options: [
                new Option('독날', { level: 2, time: 6 })
            ]
        },
        {
            name: '블리시 단검',
            type: '단검',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HAND),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 400),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 1.06),
                new AttributeModifier(true, AttributeType.CRITICAL_DAMAGE, 1.06),
                new AttributeModifier(false, AttributeType.DEFEND_PENETRATE, 100),
            ],
            durability: 2000
        },
        {
            name: '딱딱한 빵',
            type: '식료',
            maxCount: 15,
            onUse: Item.FOOD_USE_EVENT({ food: 117.5 })
        },
        {
            name: '말라붙은 육포',
            type: '식료',
            maxCount: 50,
            onUse: Item.FOOD_USE_EVENT({ food: 77.5 })
        },
        {
            name: '사과',
            type: '식료',
            maxCount: 15,
            onUse: Item.FOOD_AND_WATER_USE_EVENT({ food: 77.3, water: 45.8 })
        },
        {
            name: '물통',
            type: '음료',
            maxCount: 5,
            onUse: Item.WATER_USE_EVENT({ water: 105.8 })
        },
        {
            name: '생 토끼고기',
            type: '식료',
            maxCount: 5,
            onUse: Item.FOOD_AND_WATER_USE_EVENT({ food: 131.1, water: 6.7 })
        },
        {
            name: '강철 모루',
            type: '모루',
            maxCount: 1,
        },
        {
            name: '떡붕어',
            type: '식료',
            maxCount: 5,
            onUse: Item.FOOD_AND_WATER_USE_EVENT({ food: 51.5, water: 16.7 })
        },
        {
            name: '붕어',
            type: '식료',
            maxCount: 5,
            onUse: Item.FOOD_AND_WATER_USE_EVENT({ food: 51.5, water: 15.7 })
        },
        {
            name: '피라미',
            type: '식료',
            maxCount: 5,
            onUse: Item.FOOD_AND_WATER_USE_EVENT({ food: 51.5, water: 15.7 })
        },
        {
            name: '송어',
            type: '식료',
            maxCount: 5,
            onUse: Item.FOOD_AND_WATER_USE_EVENT({ food: 201.5, water: 15.7 })
        },
        {
            name: '빙어',
            type: '식료',
            maxCount: 5,
            onUse: Item.FOOD_AND_WATER_USE_EVENT({ food: 81.5, water: 15.7 })
        },
        {
            name: '산천어',
            type: '식료',
            maxCount: 5,
            onUse: Item.FOOD_AND_WATER_USE_EVENT({ food: 81.5, water: 15.7 })
        },
        {
            name: '프로즌피쉬',
            type: '식료',
            maxCount: 5,
            getDescription: () => '섭취시 30분동안 Lv.10 빙결 저항 효과가 생깁니다.',
            onUse: (player, index) => {
                Item.FOOD_AND_WATER_USE_EVENT({ food: 50.5, water: 25.7 })(player, index);
                player.inventory.delayTask(() => {
                    player.sendRawMessage('[ 추위가 거의 안 느껴진다.. ]');
                    player.addEffect(new Effect(EffectType.FROZEN_RESISTANCE, 10, 60 * 30, player));
                }, 0);
            }
        },
        {
            name: '뱀장어',
            type: '식료',
            maxCount: 5,
            getDescription: () => '섭취시 10분동안 Lv.2 재생 효과가 생깁니다.',
            onUse: (player, index) => {
                Item.FOOD_AND_WATER_USE_EVENT({ food: 250.5, water: 25.7 })(player, index);
                player.inventory.delayTask(() => {
                    player.sendRawMessage('[ 생명력이 좀 더 빨리 재생되는 느낌이다.. ]');
                    player.addEffect(new Effect(EffectType.REGENERATION, 2, 60 * 10, player));
                }, 0);
            }
        },
        {
            name: '파이어리지 플라워',
            type: '식료',
            maxCount: 5,
            getDescription: () => '섭취시 3분동안 Lv.5 화염 저항 효과가 생깁니다.',
            onUse: (player, index) => {
                player.sendRawMessage('[ 열이 안느껴지는 느낌이다.. ]');
                player.addEffect(new Effect(EffectType.FIRE_RESISTANCE, 5, 60 * 3, player));
                player.inventory.addItemCount(index, -1);
            }
        },
        {
            name: '축복의 열매',
            type: '영약',
            maxCount: 5,
            getDescription: () => '섭취시 1시간동안 Lv.5 경험 증폭 효과가 생깁니다.',
            onUse: (player, index) => {
                player.sendRawMessage('[ 축복받았다! ]');
                player.addEffect(new Effect(EffectType.AMPLIFY_EXPERIENCE, 5, 60 * 60, player));
                player.inventory.addItemCount(index, -1);
            }
        },
        {
            name: '피니에르의 서',
            type: '스킬북',
            maxCount: 1,
            getDescription: () => '소모할 시 스킬 [ 암전 ] 를 깨닫습니다.',
            onUse: (player, index) => {
                player.realizeSkill('암전', true);
                player.inventory.addItemCount(index, -1);
            }
        },
        {
            name: '베스',
            type: '식료',
            maxCount: 5,
            onUse: Item.FOOD_AND_WATER_USE_EVENT({ food: 90.5, water: 15.7 })
        },
        {
            name: '송사리',
            type: '식료',
            maxCount: 5,
            onUse: Item.FOOD_AND_WATER_USE_EVENT({ food: 2.5, water: 6.4 })
        },
        {
            name: '생 돼지고기',
            type: '식료',
            maxCount: 5,
            onUse: Item.FOOD_USE_EVENT({ food: 171.1 })
        },
        {
            name: '생 늑대고기',
            type: '식료',
            maxCount: 5,
            onUse: Item.FOOD_USE_EVENT({ food: 156.1 })
        },
        {
            name: '토끼의 발톱',
            type: '잡화',
            maxCount: 20
        },
        {
            name: '정화된 영혼조각',
            type: '잡화',
            maxCount: 20,
        },
        {
            name: '돌덩이',
            materials: [Material.STONE],
            type: '잡화',
            maxCount: 50,
        },
        {
            name: '점액질',
            materials: [Material.GLUE],
            type: '잡화',
            maxCount: 100,
        },
        {
            name: '철 원석',
            type: '제련',
            smeltResult: '제련된 철',
            maxCount: 10,
        },
        {
            name: '티타늄 원석',
            type: '제련',
            smeltResult: '제련된 티타늄',
            maxCount: 10,
        },
        {
            name: '굳은 티타늄',
            type: '제련',
            smeltResult: '제련된 티타늄',
            maxCount: 10,
        },
        {
            name: '빈 깡통',
            type: '제련',
            smeltResult: '제련된 철',
            maxCount: 10,
        },
        {
            name: '제련된 철',
            forgePrefix: '철제',
            type: '단조',
            maxCount: 10
        },
        {
            name: '제련된 티타늄',
            forgePrefix: '티타늄',
            onForge: (item, efficiency) => {
                if(item.maxDurability) item.maxDurability *= 1.2;
                if(item.durability) item.durability *= 1.2;
                if(item.attributeModifiers.some(m => m.type === AttributeType.ATTACK)) 
                    item.attributeModifiers.push(new AttributeModifier(true, AttributeType.ATTACK, 1.05));
                const moveSpeedModifiers = item.attributeModifiers.filter(m => m.type === AttributeType.MOVE_SPEED);
                for(let moveSpeedModifier of moveSpeedModifiers) {
                    if(moveSpeedModifier.isMultiplier) {
                        if(moveSpeedModifier.value < 1) 
                            moveSpeedModifier.value = Utils.lerp(moveSpeedModifier.value, 1, 0.3);
                    }
                    else {
                        if(moveSpeedModifier.value < 0) 
                            moveSpeedModifier.value = Utils.lerp(moveSpeedModifier.value, 0, 0.3);
                    }
                }
            },
            type: '단조',
            maxCount: 10
        },
        {
            name: '장검 날',
            type: '잡화',
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 350),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 0.98),
                new AttributeModifier(true, AttributeType.DEFEND_PENETRATE, 1.12),
                new AttributeModifier(true, AttributeType.ATTACK_SPEED, 0.94),
            ],
            onForge: (item, efficiency) => {
                item.attributeModifiers.push(new AttributeModifier(false, AttributeType.ATTACK, Math.max(0, efficiency - 1) * 360));
                item.attributeModifiers.push(new AttributeModifier(false, AttributeType.DEFEND_PENETRATE, Math.max(0, efficiency - 1) * 100));
            },
            durability: 700,
            maxCount: 1
        },
        {
            name: '대검 날',
            type: '잡화',
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 440),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 0.9),
                new AttributeModifier(true, AttributeType.DEFEND_PENETRATE, 1.1),
                new AttributeModifier(false, AttributeType.DEFEND_PENETRATE, 300),
                new AttributeModifier(true, AttributeType.ATTACK_SPEED, 0.8),
            ],
            onForge: (item, efficiency) => {
                item.attributeModifiers.push(new AttributeModifier(false, AttributeType.ATTACK, Math.max(0, efficiency - 1) * 420));
                item.attributeModifiers.push(new AttributeModifier(false, AttributeType.DEFEND_PENETRATE, Math.max(0, efficiency - 1) * 330));
            },
            durability: 950,
            maxCount: 1
        },
        {
            name: '단검 날',
            type: '잡화',
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 310),
                new AttributeModifier(false, AttributeType.MOVE_SPEED, 10),
                new AttributeModifier(true, AttributeType.CRITICAL_CHANCE, 1.05),
                new AttributeModifier(false, AttributeType.CRITICAL_DAMAGE, 8),
                new AttributeModifier(false, AttributeType.DEFEND_PENETRATE, 200),
                new AttributeModifier(true, AttributeType.ATTACK_SPEED, 0.97),
            ],
            onForge: (item, efficiency) => {
                item.attributeModifiers.push(new AttributeModifier(false, 
                    AttributeType.ATTACK, Math.max(0, efficiency - 1) * 250));
                item.attributeModifiers.push(new AttributeModifier(false, 
                    AttributeType.MOVE_SPEED, Math.max(0, efficiency - 1) * 11));
                item.attributeModifiers.push(new AttributeModifier(false, 
                    AttributeType.CRITICAL_DAMAGE, Math.max(0, efficiency - 1) * 4.3));
                item.attributeModifiers.push(new AttributeModifier(false, 
                    AttributeType.DEFEND_PENETRATE, Math.max(0, efficiency - 1) * 210));
                if(efficiency > 5) {
                    item.attributeModifiers.push(new AttributeModifier(true, 
                        AttributeType.DEFEND_PENETRATE, 1 + Math.max(0, efficiency - 4.5) * 0.03));
                }
            },
            durability: 650,
            maxCount: 1
        },
        {
            name: '도끼 날',
            type: '잡화',
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.ATTACK, 560),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 0.93),
                new AttributeModifier(false, AttributeType.CRITICAL_DAMAGE, 10),
                new AttributeModifier(true, AttributeType.DEFEND_PENETRATE, 1.08),
                new AttributeModifier(true, AttributeType.ATTACK_SPEED, 0.77),
            ],
            onForge: (item, efficiency) => {
                item.attributeModifiers.push(new AttributeModifier(false, AttributeType.ATTACK, Math.max(0, efficiency - 1) * 450));
                item.attributeModifiers.push(new AttributeModifier(false, AttributeType.CRITICAL_DAMAGE, Math.max(0, efficiency - 1) * 11));
            },
            durability: 900,
            maxCount: 1
        },
        {
            name: '갑옷',
            type: '갑옷',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.BODY),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.DEFEND, 340),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 0.82),
                new AttributeModifier(false, AttributeType.MAGIC_RESISTANCE, 30),
            ],
            onForge: (item, efficiency) => {
                item.attributeModifiers.push(new AttributeModifier(false, AttributeType.DEFEND, Math.max(0, efficiency - 1) * 350));
                item.attributeModifiers.push(new AttributeModifier(false, AttributeType.MAGIC_RESISTANCE, Math.max(0, efficiency - 1) * 40));
            },
            durability: 1250
        },
        {
            name: '부츠',
            type: '부츠',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.FEET),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.DEFEND, 230),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 0.96),
                new AttributeModifier(false, AttributeType.MAGIC_RESISTANCE, 30),
            ],
            onForge: (item, efficiency) => {
                item.attributeModifiers.push(new AttributeModifier(false, AttributeType.DEFEND, Math.max(0, efficiency - 1) * 100));
                item.attributeModifiers.push(new AttributeModifier(false, AttributeType.MAGIC_RESISTANCE, Math.max(0, efficiency - 1) * 40));
            },
            durability: 1250
        },
        {
            name: '레깅스',
            type: '레깅스',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.LEGS),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.DEFEND, 320),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 0.88),
                new AttributeModifier(false, AttributeType.MAGIC_RESISTANCE, 30),
            ],
            onForge: (item, efficiency) => {
                item.attributeModifiers.push(new AttributeModifier(false, AttributeType.DEFEND, Math.max(0, efficiency - 1) * 300));
                item.attributeModifiers.push(new AttributeModifier(false, AttributeType.MAGIC_RESISTANCE, Math.max(0, efficiency - 1) * 40));
            },
            durability: 1250
        },
        {
            name: '투구',
            type: '투구',
            maxCount: 1,
            onUse: Item.EQUIP_USE_EVENT(EquipmentType.HEAD),
            attributeModifiers: [
                new AttributeModifier(false, AttributeType.DEFEND, 200),
                new AttributeModifier(true, AttributeType.MOVE_SPEED, 0.92),
                new AttributeModifier(false, AttributeType.MAGIC_RESISTANCE, 100),
            ],
            onForge: (item, efficiency) => {
                item.attributeModifiers.push(new AttributeModifier(false, AttributeType.DEFEND, Math.max(0, efficiency - 1) * 200));
                item.attributeModifiers.push(new AttributeModifier(false, AttributeType.MAGIC_RESISTANCE, Math.max(0, efficiency - 1) * 50));
            },
            durability: 1250
        },
        {
            name: '제련된 금',
            forgePrefix: '황금',
            type: '단조',
            onForge: (item, efficiency) => {
                if(item.maxDurability) item.maxDurability *= 0.8;
                if(item.durability) item.durability *= 0.8;
                item.attributeModifiers.push(new AttributeModifier(false, AttributeType.ATTACK, -5 * efficiency));
                item.attributeModifiers.push(new AttributeModifier(true, AttributeType.ATTACK_SPEED, 1.2));
            },
            maxCount: 10
        },
        {
            name: '석탄',
            type: '연료',
            maxCount: 10,
        },
        {
            name: '금 원석',
            type: '제련',
            smeltResult: '제련된 금',
            maxCount: 10,
        },
        {
            name: '굳은 금',
            type: '제련',
            smeltResult: '제련된 금',
            maxCount: 10,
        },
        {
            name: '불의 정수',
            type: '잡화',
            maxCount: 20
        },
        {
            name: '얼음 정수',
            type: '잡화',
            maxCount: 20
        },
        {
            name: '독의 정수',
            type: '잡화',
            maxCount: 40
        },
        {
            name: '푸른 심장',
            type: '소모',
            getDescription: () => '섭취시 3분동안 Lv.10 마법 강화 효과와 Lv.20 마나 재생 효과가 생깁니다.',
            onUse: (player, index) => {
                player.addEffect(new Effect(EffectType.ENHANCE_MAGIC, 10, 3 * 60));
                player.addEffect(new Effect(EffectType.MANA_REGENERATION, 20, 3 * 60));
                player.inventory.addItemCount(index, -1);
                player.sendRawMessage('[ 3분동안 Lv.10 마법 강화 효과와 Lv.20 마나 재생 효과가 지속됩니다. ]');
            },
            maxCount: 20
        },
        {
            name: '검은 심장',
            type: '소모',
            getDescription: () => '섭취시 30분동안 15레벨 이하의 독과 부패에 면역이 되며, 영구적으로 체력 스탯이 5 증가합니다. 스탯 증가는 한 번만 적용됩니다.',
            onUse: (player, index) => {
                if (player.log.getLog('black_heart') == 0) {
                    player.stat.addStat(StatType.VITALITY, 5);
                }
                player.log.addLog('black_heart', 1);
                player.addEffect(new Effect(EffectType.DETOXIFICATION, 15, 30 * 60));
                player.addEffect(new Effect(EffectType.PRESERVATION, 15, 30 * 60));
                player.inventory.addItemCount(index, -1);
                player.sendRawMessage('[ ...! 검은 기운이 일어나 당신의 몸에 흡수되었다. ]');
            },
            maxCount: 20
        },
        {
            name: '붉은 뿔',
            type: '소모',
            getDescription: () => '섭취시 몸이 1분동안 불타오르며 영구적으로 근력과 마법 스탯이 각각 10 증가합니다. 스탯 증가는 한 번만 적용됩니다.',
            onUse: (player, index) => {
                if (player.log.getLog('red_horn') == 0) {
                    player.stat.addStat(StatType.STRENGTH, 10);
                    player.stat.addStat(StatType.SPELL, 10);
                }
                player.log.addLog('red_horn', 1);
                player.addEffect(new Effect(EffectType.FIRE, 5, 60, player));
                player.sendRawMessage('[ ...! 붉은 기운이 일어나 당신의 몸에 흡수되었다. ]');
                player.inventory.addItemCount(index, -1);
            },
            maxCount: 1
        },
        {
            name: '그레모리스 하트',
            type: '소모',
            requiredLevel: 500,
            getDescription: () => '힘을 흡수할 시 현실의 육체를 버리고 현실에서 처리할 수 없는 감정을 받아들여 생과 사의 경계를 깨닫게 된다. 그 후에는.',
            onUse: (player, index) => {
                if (player.log.getLog('gremory_heart') == 0) {
                    player.exp += player.maxExp * 5;
                    player.log.addLog('gremory_heart', 1);
                    player.inventory.addItemCount(index, -1);
                    player.sendRawMessage('[ ...! 검붉은 기운이 일어나 당신의 몸 주위를 돌아다닌다...! 어딘가에서 절규와 비명이 들리기 시작한다... ]');
                    setTimeout(() => player.sendRawMessage('[ ....... ]'), 1000);
                    setTimeout(() => {
                        player.sendRawMessage('[ ' + player.getName() + '님, 사망하셨, 하,. 지않으셨습니다. -1초 후에 부활합니다. ]');
                        player.realizeSkill('초에니 바르도', true);
                    }, 3000);
                }
                else player.sendRawMessage('[ 더 이상 필요 없다. ]');
            },
            maxCount: 20
        },
        {
            name: '검은 맹독 주머니',
            type: '소모',
            getDescription: () => '사용 시 들고 있는 무기에 5분간 유지되는 독날 효과를 부여합니다.',
            onUse: (player, index) => {
                if (!player.slot.hand) {
                    player.sendRawMessage('[ (들고 있는 무기가 없다...) ]');
                    return;
                }
                player.slot.hand.options.push(new Option('독날', { level: 10, time: 10 }, 60 * 5));
                player.inventory.addItemCount(index, -1);
                player.sendRawMessage('[ 검은 기운이 무기에 달라붙었다. ]');
            },
            maxCount: 20
        },
        {
            name: '초급 마나 물약',
            type: '소모',
            getDescription: () => '섭취시 마나가 410 증가합니다.',
            onUse: Item.MANA_USE_EVENT({ mana: 410, delay: 2, delayMessage: '[ 꿀꺽 꿀꺽... ]' }),
            maxCount: 50
        },
        {
            name: '초급 재생 물약',
            type: '소모',
            getDescription: () => '섭취시 1분동안의 Lv.2 재생이 부여됩니다.',
            onUse: Item.CUSTOM_USE_EVENT({
                delay: 2, delayMessage: '[ 꿀꺽 꿀꺽... ]', run: (player, index) => {
                    player.sendRawMessage('[ Lv.2 재생이 부여되었습니다. ]');
                    player.addEffect(new Effect(EffectType.REGENERATION, 2, 60, player));
                }
            }),
            maxCount: 50
        },
        {
            name: '고위 헤이스트 주문서',
            type: '소모',
            getDescription: () => '소모시 3분동안의 Lv.10 신속이 부여됩니다.',
            onUse: Item.CUSTOM_USE_EVENT({
                delay: 1, delayMessage: '[ 내재된 마력이 몸에 흡수되고 있다... ]', run: (player, index) => {
                    player.sendRawMessage('[ 셀프 헤이스트! ]');
                    player.addEffect(new Effect(EffectType.SWIFTNESS, 10, 60 * 3, player));
                }
            }),
            maxCount: 50
        },
        {
            name: '중급 마나 물약',
            type: '소모',
            getDescription: () => '섭취시 마나가 910 증가합니다.',
            onUse: Item.MANA_USE_EVENT({ mana: 910, delay: 3, delayMessage: '[ 꿀꺽 꿀꺽... ]' }),
            maxCount: 50
        },
        {
            name: '상급 마나 물약',
            type: '소모',
            getDescription: () => '섭취시 마나가 1710 증가합니다.',
            onUse: Item.MANA_USE_EVENT({ mana: 1710, delay: 7, delayMessage: '[ 꿀꺽 꿀꺽... ]' }),
            maxCount: 50
        },
        {
            name: '최상급 마나 물약',
            type: '소모',
            getDescription: () => '섭취시 마나가 4010 증가합니다.',
            onUse: Item.MANA_USE_EVENT({ mana: 4010, delay: 4, delayMessage: '[ 꿀꺽 꿀꺽... ]' }),
            maxCount: 50
        },
        {
            name: '하이퍼 마나 물약',
            type: '소모',
            getDescription: () => '섭취시 마나가 10000 증가하며, 3분동안 마법 공격력이 50% 증가합니다.',
            onUse: (player, index) => {
                Item.MANA_USE_EVENT({ mana: 10000, delay: 2, delayMessage: '[ 꿀꺽 꿀꺽... ]' }).call(this, player, index);
                player.addEffect(new Effect(EffectType.ENHANCE_MAGIC, 10, 3 * 60));
                player.sendRawMessage('[ 3분동안 마법 공격력이 50% 증가합니다. ]');
            },
            maxCount: 50
        },
        {
            name: '초급 회복 물약',
            type: '소모',
            getDescription: () => '섭취시 생명력이 390 증가합니다.',
            onUse: Item.LIFE_USE_EVENT({ life: 390, delay: 4, delayMessage: '[ 꿀꺽 꿀꺽... ]' }),
            maxCount: 50
        },
        {
            name: '중급 회복 물약',
            type: '소모',
            getDescription: () => '섭취시 생명력이 1250 증가합니다.',
            onUse: Item.LIFE_USE_EVENT({ life: 1250, delay: 2.5, delayMessage: '[ 꿀꺽 꿀꺽... ]' }),
            maxCount: 50
        },
        {
            name: '상급 회복 물약',
            type: '소모',
            getDescription: () => '섭취시 생명력이 4590 증가합니다.',
            onUse: Item.LIFE_USE_EVENT({ life: 4590, delay: 3, delayMessage: '[ 꿀꺽 꿀꺽... ]' }),
            maxCount: 50
        },
        {
            name: '최상급 회복 물약',
            type: '소모',
            getDescription: () => '섭취시 생명력이 9950 증가합니다.',
            onUse: Item.LIFE_USE_EVENT({ life: 9950, delay: 4, delayMessage: '[ 꿀꺽 꿀꺽... ]' }),
            maxCount: 50
        },
        {
            name: '강철같은 이빨',
            type: '잡화',
            maxCount: 35
        },
        {
            name: '거대 늑대 송곳니',
            type: '잡화',
            maxCount: 10
        },
        {
            name: '마른 나무 껍질',
            type: '잡화',
            maxCount: 10,
        },
        {
            name: '마른 나무 원목',
            type: '잡화',
            maxCount: 10,
            materials: [Material.LOG]
        },
        {
            name: '목재',
            type: '잡화',
            maxCount: 15,
            materials: [Material.WOOD]
        },
        {
            name: '나무 막대기',
            type: '잡화',
            maxCount: 15,
        },
        {
            name: '작은 용광로',
            type: '용광로',
            maxCount: 1,
            extras: {
                space: 10
            }
        },
        {
            name: '중형 용광로',
            type: '용광로',
            maxCount: 1,
            extras: {
                space: 20
            }
        },
        {
            name: '거미 눈',
            type: '잡화',
            maxCount: 50
        },
        {
            name: '멧돼지 송곳니',
            type: '잡화',
            maxCount: 20
        }
    ];

    static getItemPreset(name: string): ItemPresetObject | null {
        return cache[name] ?? (cache[name] = ItemPreset.list.find(preset => preset.name === name)) ?? null;
    }
}