import { Socket } from "socket.io"
import { Entity, LivingEntity, AttributeModifier, Option, Player, Material, Item, Npc, Terrain, Lootable, FishDrops, Location, ZoneType, RegionType, MonsterTendency, Monster, DropItem, MonsterType, Trigger, Resource, Skill, Quest, ShopPreset, ShopSellItem, ShopBuyItem } from "./modules/Internal"

interface ExtraObject {
    [key: string]: any
}

interface EmailAuthInfo {
    code: string;
    expirationDate: number;
}

interface EmailAuthCodeMap {
    [key: string]: EmailAuthInfo;
}

interface User {
    uid: string;
    salt: string;
    passwordHash: string;
    email: string;
    token: NullableString;
    tokenExpirationDate: number;
    profilePic?: string;
}

interface UserMap {
    [key: string]: User;
}

interface NumberMap {
    [key: string]: number;
}

interface StringMap {
    [key: string]: string;
}

interface ChatData {
    room: string;
    message: string;
}

interface SendChatData extends ChatData {
    date: number;
    senderName: string;
    profilePic?: string;
    chatId: string;
    extras: ExtraObject;
}

interface HandleChatData extends SendChatData {
    user: User;
    client: Socket;
}

interface Room {
    chatList: SendChatData[];
}

interface RoomMap {
    [key: string]: Room;
}

interface AttackOptions {
    applyAttackSpeed?: boolean;
    absoluteHit?: boolean;
    useAbuserCritical?: boolean;
    isMagicAttack?: boolean;
    isOptionedAttack?: boolean;
    onHit?: (attacker: Entity, victim: Entity) => void;
    additionalMessage?: string;
}

interface ItemPresetObject {
    name: string;
    type: string;
    durability?: number;
    maxDurability?: number;
    attributeModifiers?: AttributeModifier[];
    options?: Option[];
    extras?: ExtraObject;
    createdBy?: NullableString;
    requiredLevel?: number;
    maxCount?: number;
    materials?: Material[];
    smeltResult?: string;
    forgePrefix?: string;
    onForge?: (item: Item, efficiency: number) => void;
    getDescription?: (item: Item) => string;
    onUse?: (player: Player, index: number) => void;
    attack?: (player: Player, victim: Entity, options: AttackOptions) => void;
}

interface LocationPresetObject {
    npcs?: Npc[];
    terrains?: Terrain[];
    objects?: (Entity & Lootable)[];
    fishDrops?: FishDrops;
    getMovable?: (location: Location) => string[];
    onUpdate?: (location: Location) => void;
    zoneType?: ZoneType;
    regionType?: RegionType;
}

interface EventMap {
    onUpdate?: (p: Player) => void;
    onHit?: (p: Player, victim: Entity) => void;
    onHitted?: (p: Player, attacker: Entity) => void;
}

interface ShopPresetObject {
    name: string;
    buyList: ShopBuyItemPresetObject[];
    sellList: ShopSellItemPresetObject[];
    regenTime: number;
}


type CommandHanlder = (chatData: HandleChatData, 
    player: Player, 
    label: string, 
    args: string[]) => void;

interface ClientChatOptions {
    fullMessage?: string;
    isRich?: boolean;
    title?: string;
    richColor?: string;
    isFullRich?: boolean;
    fullTitle?: string;
    fullRichColor?: string;
}

interface ClientChatData {
    room: string;
    senderName: string;
    date: number;
    message: string;
    profilePic?: string;
    chatId: string;
    extras: ClientChatOptions
}

interface QuestPresetObject {
    name: string;
    conditionMessage: string;
    giveReward: (quest: Quest, player: Player) => void;
    canComplete: (quest: Quest, player: Player) => boolean;
    trigger: Trigger;
    rewardMessage: string;
}

interface ResourcePresetObject {
    name: string;
    displayName?: string;
    level?: number;
    regenTime?: number;
    onUpdate?: ((resource: Resource) => void) | null;
    onDestroy?: ((resource: Resource, p: Player) => void) | null;
    drops: DropItem[];
    attributes: { [key: string]: number };
    stat?: { [key: string]: number };
    destroyableTypes?: string[];
}

interface ShopBuyItemPresetObject {
    name: string;
    cost: number;
    count: number;
    createItem: (preset: ShopBuyItem) => Item;
}

interface ShopSellItemPresetObject {
    name: string;
    cost: number;
    checkItem: (item: Item, preset: ShopSellItem) => boolean; 
}

type Lootable = Monster | Resource;

interface OptionPresetObject {
    name: string;
    getDescription: (option: Option) => string;
    onHit?: (option: Option, self: Entity, victim: Entity) => void;
    onHitted?: (option: Option, self: Entity, attacker: Entity) => void;
    onUpdate?: (option: Option, self: Entity) => void;
}

interface ProjectilePresetObject {
    name: string;
    owner: LivingEntity;
    onHit?: (projectile: Projectile, victim: LivingEntity) => void;
    attributes: { [key: string]: number };
}

interface MonsterPresetObject {
    name: string;
    level: number;
    isUnrevivable?: boolean;
    regenTime?: number;
    tendency?: MonsterTendency;
    onUpdate?: (monster: Monster) => void;
    onHitted?: (monster: Monster, attacker: Entity) => void;
    onDeath?: (monster: Monster) => void;
    gold?: number;
    drops?: DropItem[];
    attributes?: ExtraObject;
    stat?: { [key: string]: number };
    types?: MonsterType[];
}

interface SkillPresetObject {
    name: string;
    isPassive: boolean;
    maxLevel: number;
    checkRealizeCondition?: (p: Player) => boolean;
    getCooldown?: (skill: Skill, p: Player) => number;
    calcValues?: (skill: Skill, p: Player) => number[];
    getCostMessage?: (skill: Skill, p: Player) => string;
    canTakeCost?: (skill: Skill, p: Player) => boolean;
    takeCost?: (skill: Skill, p: Player) => void;
    getCostFailMessage?: (skill: Skill, p: Player) => string;
    getConditionMessage?: (skill: Skill, p: Player) => string;
    checkCondition?: (skill: Skill, p: Player) => boolean;
    getDescription: (skill: Skill, p: Player) => string;
    onStart?: (skill: Skill, p: Player) => void;
    onEarlyUpdate?: (skill: Skill, p: Player) => void;
    onUpdate?: (skill: Skill, p: Player) => void;
    onLateUpdate?: (skill: Skill, p: Player) => void;
    onFinish?: (skill: Skill, p: Player) => void;
}

type NpcAct = (npc: Npc) => void;

type NullableString = string | null;

type DisplayType = 'percent'|'float-percent'|'int-value'|'float-value'|'none';