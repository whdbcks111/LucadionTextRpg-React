import { Entity, FishDrops, ItemStack, Monster, Npc, Player, Resource, Terrain, DateFormat } from "../Internal";
import Enum from "../util/Enum";
import { ItemContainer } from "../Internal";
import { Shop } from "../Internal";
import { ShopPreset, Utils } from "../Internal";
import { LocationPresetObject, Lootable, MessageComponent } from "../../types";
import { StringifyOptions } from "querystring";
import { ComponentBuilder } from "../server/chat/ComponentBuilder";

export class Location {

    name: string;
    x: number;
    y: number;
    z: number;
    droppedItems = new ItemContainer();
    private _npcs: Npc[];
    private _terrains: Terrain[];
    private _objects: Lootable[];
    fishDrops: FishDrops | null;
    getMovable: (location: Location) => string[];
    onUpdate: ((location: Location) => void) | null;
    shop: Shop | null;
    zoneType: ZoneType;
    regionType: RegionType;

    get npcs() {
        return this._npcs.slice();
    }

    set npcs(v) {
        v.forEach(v => v.location = this);
        this._npcs = v;
    }

    get objects() {
        return this._objects.slice();
    }

    set objects(v) {
        v.forEach(v => v.location = this.name);
        this._objects = v;
    }

    get terrains() {
        return this._terrains.slice();
    }

    set terrains(v) {
        v.forEach(v => v.location = this);
        this._terrains = v;
    }

    constructor(name: string, x: number, y: number, z: number, preset: LocationPresetObject) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.z = z;
        this._npcs = preset.npcs ?? [];
        this._terrains = preset.terrains ?? [];
        this._objects = preset.objects ?? [];
        this.fishDrops = preset.fishDrops ?? null;
        this.getMovable = preset.getMovable ?? (loc => []);
        this.onUpdate = preset.onUpdate ?? null;
        let shopPreset = ShopPreset.getShopPreset(this.name);
        this.shop = shopPreset ? new Shop(shopPreset) : null;
        this.zoneType = preset.zoneType ?? ZoneType.PEACEFUL;
        this.regionType = preset.regionType ?? RegionType.NORMAL;

        this._objects.forEach(object => {
            object.location = this.name;
        });
        this._terrains.forEach(terrain => {
            terrain.location = this;
        });
        this._npcs.forEach(npc => {
            npc.location = this;
        });
        if (this.shop) this.shop.location = this;
    }

    get movables() {
        return this.getMovable(this);
    }

    spawnObjects(objects: Lootable[]) {
        objects.forEach(o => o.location = this.name);
        this._objects = this._objects.concat(objects);
    }

    spawnTerrains(terrains: Terrain[]) {
        terrains.forEach(o => o.location = this);
        this._terrains = this._terrains.concat(terrains);
    }

    update() {
        let remove = new WeakSet();
        this._objects.forEach(object => {
            object.earlyUpdate();
            object.update();
            object.lateUpdate();

            if (object instanceof Monster && object.isUnrevivable && object.isDead)
                remove.add(object);
        });
        this._objects = this._objects.filter(object => !remove.has(object));
        this._npcs.forEach(npc => npc.update());

        if (this.shop) {
            if (Date.now() - this.shop.latestRegen >= this.shop.regenTime * 1000) {
                this.shop.buyList.forEach(item => {
                    item.count = item.maxCount;
                });
                this.shop.latestRegen = Date.now();
            }
        }
        if (this.onUpdate instanceof Function) this.onUpdate(this);
    }

    getPlayersInfo() {
        return ComponentBuilder.message([
            ComponentBuilder.text('▌ 플레이어\n'),
            ComponentBuilder.join(this.getPlayers(false)
                .map((p, idx) => {
                    return ComponentBuilder.message([
                        ComponentBuilder.text(`   ${idx + 1} > ${p.getName()}  `),
                        ComponentBuilder.progressBar(p.life, p.maxLife, 'percent', 'white', '100px')
                    ])
                }),
                ComponentBuilder.text('\n'))
        ]);
    }

    getMovableInfo() {
        return '▌ 갈 수 있는 장소\n' +
            this.movables
                .map((name, idx) =>
                    `   ${idx + 1} > ${name}`)
                .join('\n');
    }

    getLocationInfo() {
        return ComponentBuilder.message([
            ComponentBuilder.text(`[ ${this.name}의 지형 정보 | ${this.zoneType.displayName} 지역` +
                (this.shop ? ' | 상점' : '') +
                (this.regionType === RegionType.WATER ? ' | 수중 지역' : '') +
                (this.fishDrops ? ' | 낚시 가능' : '') + ' ]\n\n'),
            ComponentBuilder.embed([
                ComponentBuilder.text(this.getMovableInfo()),
                ComponentBuilder.hidden([
                    ComponentBuilder.text('\n\n' +
                        '▌ 오브젝트\n'),
                    ComponentBuilder.join(
                        this._objects.map((obj, idx) => {
                            let out: MessageComponent[] = [];

                            if (obj instanceof Monster) {
                                out = [
                                    ComponentBuilder.text(`[Lv.${obj.level}] ${obj.getName()}  `),
                                    (obj.isAlive ?
                                        ComponentBuilder.progressBar(obj.life, obj.maxLife, 'percent', 'white', '100px') :
                                        ComponentBuilder.text('(죽음)' + (
                                            obj.regenTime > 60 * 10 ?
                                                new DateFormat(new Date(obj.regenTime * 1000)).format(' [mm:ss]') : ''
                                        ))
                                    )
                                ];
                            }
                            else if (obj instanceof Resource) {
                                out = [
                                    ComponentBuilder.text(`[자원] ${obj.getName()}  `),
                                    (obj.isAlive ?
                                        ComponentBuilder.progressBar(obj.life, obj.maxLife, 'percent', 'white', '100px') :
                                        ComponentBuilder.text('(파괴됨)')
                                    )
                                ]
                            }
                            return ComponentBuilder.message([
                                ComponentBuilder.text(`   ${idx + 1} > `),
                                ...out
                            ])
                        }), ComponentBuilder.newLine()),
                    ComponentBuilder.text('\n\n' +
                        '▌ NPC\n' +
                        this._npcs.map((npc, idx) => `   ${idx + 1} > ` +
                            `${npc.name}  ${npc.isTalking ? '(대화중)' : ''}`).join('\n') + '\n\n' +
                        '▌ 지형\n' +
                        this._terrains.map((terrain, idx) => `   ${idx + 1} > ` +
                            `${terrain.name}  ${terrain.isAlreadyChecked ? '(확인됨)' : ''}`).join('\n') + '\n\n'),
                    this.getPlayersInfo(),
                    ComponentBuilder.text('\n\n' +
                        '▌ 떨어진 아이템\n'),
                    ComponentBuilder.join(
                        this.droppedItems.contents.map((itemStack, idx) => itemStack ? ComponentBuilder.message([
                            ComponentBuilder.text(`   ${idx + 1} > `),
                            itemStack.item.getDisplayName(),
                            ComponentBuilder.text(`x${itemStack?.count}`)
                        ]) : ComponentBuilder.empty()),
                        ComponentBuilder.newLine()
                    )
                ])
            ])
        ]);
    }

    getDistance(other: Location) {
        return Math.sqrt(Math.pow(this.x - other.x, 2) +
            Math.pow(this.y - other.y, 2) +
            Math.pow(this.z - other.z, 2));
    }

    getMoveTime(other: Location, speed: number) {
        let r = this.getDistance(other) / (speed / 15);
        if (isNaN(r)) r = 0;
        return r;
    }

    addToDropped(itemStack: ItemStack) {
        this.droppedItems.addItem(itemStack.item, itemStack.count);
    }

    getPlayers(force = false) {
        return Player.players.filter(player => player.location == this.name && player.isAlive && (player.isVisible || force));
    }
}

export class ZoneType extends Enum {

    displayName: string;

    constructor(name: string, displayName: string) {
        super(name);
        this.displayName = displayName;
    }

    static PEACEFUL = new ZoneType('peaceful', '평화');
    static NEUTRAL = new ZoneType('neutral', '중립');
    static NORMAL = new ZoneType('normal', '일반');
}

export class RegionType extends Enum {

    displayName: string;

    constructor(name: string, displayName: string) {
        super(name);
        this.displayName = displayName;
    }

    static NORMAL = new RegionType('normal', '일반');
    static WATER = new RegionType('water', '수중');
    static WORLD_SPAWN = new RegionType('worldSpawn', '월드스폰');
    static FIRST_CLASS_CHANGE = new RegionType('firstClassChange', '첫번째 전직');
    static SECOND_CLASS_CHANGE = new RegionType('secondClassChange', '두번째 전직');
    static DEVILDOM = new RegionType('devildom', '마계');
}