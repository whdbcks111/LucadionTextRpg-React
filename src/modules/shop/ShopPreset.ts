import { ShopPresetObject } from "../../types";
import { Item } from "../Internal";

const cache: { [key: string]: ShopPresetObject | undefined } = {};

export class ShopPreset {
    static list: ShopPresetObject[] = [

        {
            name: '바볼 광산 상점',
            regenTime: 60 * 30,
            buyList: [
                {
                    name: '철제 곡괭이',
                    cost: 999,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 5
                },
                {
                    name: '중급 곡괭이',
                    cost: 1509,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 5
                },
                {
                    name: '날카로운 곡괭이',
                    cost: 1999,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 5
                }
            ],
            sellList: [
                {
                    name: '돌덩이',
                    cost: 11,
                    checkItem: (item, sellItem) => {
                        return item.name === sellItem.name;
                    }
                },
                {
                    name: '철 원석',
                    cost: 31,
                    checkItem: (item, sellItem) => {
                        return item.name === sellItem.name;
                    }
                },
                {
                    name: '금 원석',
                    cost: 101,
                    checkItem: (item, sellItem) => {
                        return item.name === sellItem.name;
                    }
                },
                {
                    name: '석탄',
                    cost: 15,
                    checkItem: (item, sellItem) => {
                        return item.name === sellItem.name;
                    }
                },
                {
                    name: '티타늄 원석',
                    cost: 300,
                    checkItem: (item, sellItem) => {
                        return item.name === sellItem.name;
                    }
                }
            ]
        },
        {
            name: '해턴의 잡화상점',
            regenTime: 60 * 30,
            buyList: [
                {
                    name: '철제 단검',
                    cost: 800,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 10
                },
                {
                    name: '벌목용 도끼',
                    cost: 1150,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 10
                },
                {
                    name: '철제 곡괭이',
                    cost: 1105,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 10
                },
                {
                    name: '모험가의 활',
                    cost: 1588,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 10
                },
                {
                    name: '부싯돌 화살',
                    cost: 5,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 1000
                },
                {
                    name: '낡은 낚싯대',
                    cost: 500,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 10
                },
                {
                    name: '초급 회복 물약',
                    cost: 240,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 400
                },
                {
                    name: '맛있는 사과',
                    cost: 53,
                    createItem: buyItem => {
                        return Item.fromName('사과');
                    },
                    count: 300
                },
                {
                    name: '맛있는 빵',
                    cost: 43,
                    createItem: buyItem => {
                        return Item.fromName('딱딱한 빵');
                    },
                    count: 550
                },
                {
                    name: '헐거운 가죽 갑옷',
                    cost: 1989,
                    createItem: buyItem => {
                        let item = Item.fromName('가죽 갑옷');
                        if(item.durability) item.durability = Math.floor(item.durability * 0.9);
                        return item;
                    },
                    count: 10
                },
                {
                    name: '청동 갑옷',
                    cost: 2389,
                    createItem: buyItem => {
                        let item = Item.fromName(buyItem.name);
                        if(item.durability) item.durability = Math.floor(item.durability * 0.95);
                        return item;
                    },
                    count: 5
                },
                {
                    name: '마력검',
                    cost: 5689,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 3
                }
            ],
            sellList: [
                {
                    name: '생 토끼고기',
                    cost: 35,
                    checkItem: (item, sellItem) => {
                        return item.name === sellItem.name;
                    }
                },
                {
                    name: '생 늑대고기',
                    cost: 91,
                    checkItem: (item, sellItem) => {
                        return item.name === sellItem.name;
                    }
                },
                {
                    name: '생 돼지고기',
                    cost: 39,
                    checkItem: (item, sellItem) => {
                        return item.name === sellItem.name;
                    }
                },
                {
                    name: '토끼의 발톱',
                    cost: 12,
                    checkItem: (item, sellItem) => {
                        return item.name === sellItem.name;
                    }
                },
                {
                    name: '불의 정수',
                    cost: 7,
                    checkItem: (item, sellItem) => {
                        return item.name === sellItem.name;
                    }
                },
                {
                    name: '멧돼지 송곳니',
                    cost: 88,
                    checkItem: (item, sellItem) => {
                        return item.name === sellItem.name;
                    }
                }
            ]
        },
        {
            name: '우로드 잡화점',
            regenTime: 60 * 30,
            buyList: [
                {
                    name: '철제 단검',
                    cost: 900,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 10
                },
                {
                    name: '벌목용 도끼',
                    cost: 1250,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 10
                },
                {
                    name: '철제 곡괭이',
                    cost: 1205,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 10
                },
                {
                    name: '코이니스 보우',
                    cost: 888,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 10
                },
                {
                    name: '철제 화살',
                    cost: 6,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 2000
                },
                {
                    name: '초급 회복 물약',
                    cost: 140,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 500
                },
                {
                    name: '부드러운 육포',
                    cost: 33,
                    createItem: buyItem => {
                        return Item.fromName('말라붙은 육포');
                    },
                    count: 1000
                },
                {
                    name: '맛있는 빵',
                    cost: 45,
                    createItem: buyItem => {
                        return Item.fromName('딱딱한 빵');
                    },
                    count: 250
                },
                {
                    name: '물통',
                    cost: 200,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 25
                },
                {
                    name: '중형 용광로',
                    cost: 21500,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 5
                },
                {
                    name: '가죽 갑옷',
                    cost: 1989,
                    createItem: buyItem => {
                        let item = Item.fromName('가죽 갑옷');
                        if(item.durability) item.durability = Math.floor(item.durability * 0.5);
                        return item;
                    },
                    count: 5
                },
                {
                    name: '빙결 저항 갑옷',
                    cost: 3377,
                    createItem: buyItem => {
                        let item = Item.fromName('빙결 저항 갑옷');
                        return item;
                    },
                    count: 3
                },
                {
                    name: '서리검',
                    cost: 4600,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 3
                }
            ],
            sellList: [
                {
                    name: '생 토끼고기',
                    cost: 35,
                    checkItem: (item, sellItem) => {
                        return item.name === sellItem.name;
                    }
                },
                {
                    name: '토끼의 발톱',
                    cost: 12,
                    checkItem: (item, sellItem) => {
                        return item.name === sellItem.name;
                    }
                },
                {
                    name: '얼음 정수',
                    cost: 10,
                    checkItem: (item, sellItem) => {
                        return item.name === sellItem.name;
                    }
                }
            ]
        },
        {
            name: '론테 대장간',
            regenTime: 60 * 10,
            buyList: [
                {
                    name: '강철 망치',
                    cost: 2800,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 5
                },
                {
                    name: '강철 모루',
                    cost: 7380,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 3
                },
                {
                    name: '작은 용광로',
                    cost: 4911,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 3
                },
                {
                    name: '블러디 소드',
                    cost: 2150,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 10
                },
                {
                    name: '철제 투구',
                    cost: 2105,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 2
                },
                {
                    name: '철제 갑옷',
                    cost: 2811,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 2
                },
                {
                    name: '철제 레깅스',
                    cost: 2799,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 2
                },
                {
                    name: '철제 부츠',
                    cost: 1999,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 2
                },
                {
                    name: '플레니르 소드',
                    cost: 5750,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 10
                },
                {
                    name: '샤프 애로우',
                    cost: 11,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 2000
                },
                {
                    name: '루메니컬 보우',
                    cost: 3999,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 5
                }
            ],
            sellList: [
                {
                    name: '철 원석',
                    cost: 239,
                    checkItem: (item, sellItem) => {
                        return item.name === sellItem.name;
                    }
                },
                {
                    name: '금 원석',
                    cost: 211,
                    checkItem: (item, sellItem) => {
                        return item.name === sellItem.name;
                    }
                },
                {
                    name: '석탄',
                    cost: 150,
                    checkItem: (item, sellItem) => {
                        return item.name === sellItem.name;
                    }
                }
            ]
        },
        {
            name: '포샤르의 물약 상점',
            regenTime: 30 * 60,
            buyList: [
                {
                    name: '초급 재생 물약',
                    cost: 500,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 100
                },
                {
                    name: '중급 회복 물약',
                    cost: 1300,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 100
                },
                {
                    name: '상급 회복 물약',
                    cost: 6150,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 100
                },
                {
                    name: '중급 마나 물약',
                    cost: 1500,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 100
                },
            ],
            sellList: [
                {
                    name: '불의 정수',
                    cost: 12,
                    checkItem: (item, sellItem) => {
                        return item.name === sellItem.name;
                    }
                },
                {
                    name: '거미 눈',
                    cost: 32,
                    checkItem: (item, sellItem) => {
                        return item.name === sellItem.name;
                    }
                },
                {
                    name: '토끼의 발톱',
                    cost: 50,
                    checkItem: (item, sellItem) => {
                        return item.name === sellItem.name;
                    }
                },
            ]
        },
        {
            name: '폴루토스 던전 - 수상한 상점',
            regenTime: 24 * 60 * 60,
            buyList: [
                {
                    name: '피니에르의 서',
                    cost: 100000,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 5
                },
                {
                    name: '메가도니우슈즈',
                    cost: 200000,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 2
                },
                {
                    name: '비센틱 메카코닉스',
                    cost: 300000,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 3
                },
                {
                    name: '엔드 오브 어비스',
                    cost: 400000,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 2
                },
            ],
            sellList: [
                {
                    name: '얼음 정수',
                    cost: 50,
                    checkItem: (item, sellItem) => {
                        return item.name === sellItem.name;
                    }
                },
            ]
        },
        {
            name: '피산의 낚시상점',
            regenTime: 30 * 60,
            buyList: [
                {
                    name: '낡은 낚싯대',
                    cost: 550,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 30
                },
                {
                    name: '고급 낚싯대',
                    cost: 1550,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 30
                },
            ],
            sellList: [
                {
                    name: '떡붕어',
                    cost: 200,
                    checkItem: (item, sellItem) => {
                        return item.name === sellItem.name;
                    }
                },
                {
                    name: '붕어',
                    cost: 150,
                    checkItem: (item, sellItem) => {
                        return item.name === sellItem.name;
                    }
                },
                {
                    name: '송사리',
                    cost: 70,
                    checkItem: (item, sellItem) => {
                        return item.name === sellItem.name;
                    }
                },
                {
                    name: '뱀장어',
                    cost: 350,
                    checkItem: (item, sellItem) => {
                        return item.name === sellItem.name;
                    }
                }
            ]
        },
        {
            name: '스펜의 마법 상점',
            regenTime: 30 * 60,
            buyList: [
                {
                    name: '무접점 마도 공학 지팡이',
                    cost: 10000,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 30
                },
                {
                    name: '경량형 마력 대검',
                    cost: 15000,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 10
                },
                {
                    name: '고위 헤이스트 주문서',
                    cost: 2000,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 100
                },
                {
                    name: '대 마법사용 안티매직 망토',
                    cost: 17000,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 10
                },
                {
                    name: '대미지셀프 링',
                    cost: 43000,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 10
                },
                {
                    name: '마공학 Vol.3 매지컬 보우',
                    cost: 63000,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 5
                },
            ],
            sellList: [
                {
                    name: '제련된 금',
                    cost: 500,
                    checkItem: (item, sellItem) => {
                        return item.name === sellItem.name;
                    }
                },
                {
                    name: '제련된 티타늄',
                    cost: 1000,
                    checkItem: (item, sellItem) => {
                        return item.name === sellItem.name;
                    }
                },
                {
                    name: '푸른 심장',
                    cost: 3000,
                    checkItem: (item, sellItem) => {
                        return item.name === sellItem.name;
                    }
                },
                {
                    name: '얼음 정수',
                    cost: 20,
                    checkItem: (item, sellItem) => {
                        return item.name === sellItem.name;
                    }
                },
                {
                    name: '불의 정수',
                    cost: 15,
                    checkItem: (item, sellItem) => {
                        return item.name === sellItem.name;
                    }
                },
            ]
        },
        {
            name: '레플린의 마법 상점',
            regenTime: 30 * 60,
            buyList: [
                {
                    name: '지오닉 순환마력 지팡이',
                    cost: 12000,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 30
                },
                {
                    name: '입자가속 마공제 활',
                    cost: 86000,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 10
                },
                {
                    name: '고위 헤이스트 주문서',
                    cost: 1850,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 100
                },
                {
                    name: '마그네틱 쉴드 망토',
                    cost: 17000,
                    createItem: buyItem => {
                        return Item.fromName(buyItem.name);
                    },
                    count: 10
                },
            ],
            sellList: [
                {
                    name: '제련된 금',
                    cost: 500,
                    checkItem: (item, sellItem) => {
                        return item.name === sellItem.name;
                    }
                },
                {
                    name: '제련된 티타늄',
                    cost: 1000,
                    checkItem: (item, sellItem) => {
                        return item.name === sellItem.name;
                    }
                },
                {
                    name: '검은 심장',
                    cost: 10000,
                    checkItem: (item, sellItem) => {
                        return item.name === sellItem.name;
                    }
                },
                {
                    name: '독의 정수',
                    cost: 50,
                    checkItem: (item, sellItem) => {
                        return item.name === sellItem.name;
                    }
                },
                {
                    name: '점액질',
                    cost: 25,
                    checkItem: (item, sellItem) => {
                        return item.name === sellItem.name;
                    }
                },
            ]
        }
    ];

    static getShopPreset(name: string) {
        return cache[name] ?? (cache[name] = ShopPreset.list.find(preset => preset.name === name));
    }
}