import { ExtraObject, NullableString } from "../../types";
import { Item, ItemStack, Location, Player, Utils } from "../Internal";
import { ComponentBuilder } from "../server/chat/ComponentBuilder";

const cache: { [key: string]: Terrain | undefined } = {};

export class Terrain {

    id: string;
    name: string;
    onCheck: ((terrain: Terrain, player: Player) => void) | null;
    regenTime: number;
    latestCheck: number;
    location: Location | null;
    extras: ExtraObject;

    constructor(id: string, name: string, 
            onCheck: ((terrain: Terrain, player: Player) => void) | null = null,
            regenTime = 0, extras: ExtraObject = {}) {
        this.id = id;
        this.name = name;
        this.onCheck = onCheck;
        this.regenTime = regenTime;
        this.latestCheck = 0;
        this.location = null;
        this.extras = extras;
    }

    clone() {
        return new Terrain(this.id, this.name, this.onCheck, this.regenTime);
    }

    get isAlreadyChecked() {
        return Date.now() - this.latestCheck < this.regenTime * 1000;
    }

    check(player: Player) {
        if(this.isAlreadyChecked) return false;
        if(this.onCheck) {
           this.onCheck(this, player);
           this.latestCheck = Date.now();
           return true;
        }
        player.sendMessage(ComponentBuilder.embed([
            ComponentBuilder.text('[ 확인할 수 없는 지형입니다. ]')
        ], 'red'));
        return false;
    }

    static fromId(id: string) {
        let original = cache[id] ?? (cache[id] = Terrain.list.find(t => t.id === id));
        if(!original) throw new Error('Invalid Terrain Id');
        return original.clone();
    }

    static ITEM_PICK_CHECK = (items: (ItemStack | null)[]) => (terrain: Terrain, p: Player) => {
        let item = items[Math.floor(Math.random() * items.length)];
        if(!item) return;
        p.sendRawMessage('[ ' + item.item + ' (을)를 ' + item.count + '개 획득했다! ]');
        p.inventory.addItem(item.item, item.count);
    };

    static GOLD_REWARD_CHECK = (min: number, max: number) => (terrain: Terrain, p: Player) => {
        let gold = Utils.randomRangeInt(min, max);
        p.gold += gold;
        p.sendRawMessage(`[ ${gold} 골드를 획득하였다! ]`);
    }

    static list: Terrain[] = [
        new Terrain('gold_box_1', '수수께끼 보물상자', Terrain.GOLD_REWARD_CHECK(50, 300), 60 * 30),
        new Terrain('gold_box_2', '수수께끼 검은상자', Terrain.GOLD_REWARD_CHECK(100, 1000), 60 * 30),
        new Terrain('gold_box_3', '암흑 보물상자', (() => {
            let goldReward = Terrain.GOLD_REWARD_CHECK(300, 800);
            let itemReward = Terrain.ITEM_PICK_CHECK([
                ItemStack.fromName('다크 서멀 링')
            ]);

            return (terrain, p) => {
                if (Math.random() < 0.9) 
                    goldReward(terrain, p);
                else
                    itemReward(terrain, p);
            }
        })(), 1200),
        new Terrain('well_of_oblivion', '망각의 우물', (terrain, p) => {
            p.sendRawMessage('[ 당?신은 ?망?각 ?다, ]');
            setTimeout(() => {
                p.location = p.spawn
            }, 500);
        }),
        new Terrain('purple_box', '보라색 상자', Terrain.ITEM_PICK_CHECK([
            ItemStack.fromName('상급 회복 물약'), 
            ItemStack.fromName('볼테딘 숏소드'), 
            ItemStack.fromName('레어 곡괭이')
        ]), 1800),
        new Terrain('black_characters', '검은색 문자들', (terrain, p) => {
            p.sendRawMessage('[ 죽음이 두려운 자 중심에 서지 마라. 그렇지 않으면 용기를 보이되, 광휘의 힘으로 옳은 길로 가라. ]');
        }),
        new Terrain('thorn_of_despair', '절망의 가시', (terrain, p) => {
            p.sendRawMessage('[ 생명력을 10% 잃었습니다. ]');
            p.damage(p.life * 0.1, p);
        }, 30),
        new Terrain('life_shard', '라이프 샤드 (○)', (terrain, p) => {
            let loc = terrain.location;
            if(!loc) return;
            if (loc.movables.includes('인모르투 던전 - 2')) {
                p.sendRawMessage('[ 문은 이미 열렸다. ]');
                return;
            }
            let power = terrain.extras.power;
            if (!power) {
                p.sendRawMessage('[ 라이프 샤드가 켜졌습니다. 현재 생명력의 5%가 소멸했습니다. ]');
                p.life *= 0.95;
                terrain.name = '라이프 샤드 (●)';
            }
            else {
                p.sendRawMessage('[ 라이프 샤드가 꺼졌습니다. ]');
                terrain.name = '라이프 샤드 (○)';
            }
            terrain.extras.power = !terrain.extras.power;
            let shards = loc.terrains.filter(o => o instanceof Terrain && o.id === terrain.id);
            let answer = [false, false, false, true, false];
            let isCorrect = true;
            for (let i = 0; i < shards.length; i++) {
                let power = !!shards[i].extras.power;
                if (power !== answer[i]) {
                    isCorrect = false;
                    break;
                }
            }
            if (isCorrect) {
                p.sendRawMessage('[ ..! (어딘가 열린 것 같다.) ]');
                p.sendRawMessage('[ 용기있는 자여, 앞으로 나아가거라. ]');
                setTimeout(() => {
                    shards.forEach(shard => {
                        shard.name = '라이프 샤드 (○)';
                        shard.extras.power = false;
                    });
                }, 30 * 1000);
            }
        }, 0, { power: false }),
        new Terrain('black_box', '검은 보물상자', Terrain.GOLD_REWARD_CHECK(1000, 11000), 1800),
        new Terrain('scarlet_box', '주홍색 상자', Terrain.ITEM_PICK_CHECK([
            ItemStack.fromName('르호크 투핸디드 소드'), 
            ItemStack.fromName('어둠의 목걸이'), 
            ItemStack.fromName('비센틱 픽액스'), 
            ItemStack.fromName('로스트 이어링')
        ]), 1800),
        new Terrain('dark_blue_box_1', '검푸른색 상자', Terrain.ITEM_PICK_CHECK([
            ItemStack.fromName('최상급 마나 물약'), 
            ItemStack.fromName('크산디르 소드'), 
            ItemStack.fromName('그레만스 보우'), 
            ItemStack.fromName('로스트 이어링')
        ]), 1800),
        new Terrain('dark_blue_box_2', '검푸른색 상자', Terrain.ITEM_PICK_CHECK([
            ItemStack.fromName('어둠의 목걸이'), 
            ItemStack.fromName('몬크라스 대거'), 
            ItemStack.fromName('그레만스 보우'), 
            ItemStack.fromName('다크닉 그랜드 완드')
        ]), 3600),
        new Terrain('plant_1', '풀'),
        new Terrain('plant_2', '풀', Terrain.ITEM_PICK_CHECK([
            ItemStack.fromName('파이어리지 플라워', 3)
        ]), 600),
        new Terrain('plant_3', '풀', Terrain.ITEM_PICK_CHECK([
            ItemStack.fromName('메이키 링'),
            ItemStack.fromName('작은 배낭'),
            ItemStack.fromName('금속 마법 지팡이'),
            ItemStack.fromName('뱀장어'),
            ItemStack.fromName('초급 마나 물약', 6)
        ]), 3000)
    ];

}