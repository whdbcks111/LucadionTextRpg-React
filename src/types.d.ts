import { Projectile } from './modules/Internal';

type CSSProperties = import('react').CSSProperties;
type Entity = import('./modules/Internal').Entity;
type LivingEntity = import('./modules/Internal').LivingEntity;
type AttributeModifier = import('./modules/Internal').AttributeModifier;
type Option = import('./modules/Internal').Option;
type Player = import('./modules/Internal').Player;
type Material = import('./modules/Internal').Material;
type Item = import('./modules/Internal').Item;
type Npc = import('./modules/Internal').Npc;
type Terrain = import('./modules/Internal').Terrain;
type FishDrops = import('./modules/Internal').FishDrops;
type Location = import('./modules/Internal').Location;
type ZoneType = import('./modules/Internal').ZoneType;
type RegionType = import('./modules/Internal').RegionType;
type MonsterTendency = import('./modules/Internal').MonsterTendency;
type Monster = import('./modules/Internal').Monster;
type DropItem = import('./modules/Internal').DropItem;
type MonsterType = import('./modules/Internal').MonsterType;
type Trigger = import('./modules/Internal').Trigger;
type Resource = import('./modules/Internal').Resource;
type Skill = import('./modules/Internal').Skill;
type Quest = import('./modules/Internal').Quest;
type ShopPreset = import('./modules/Internal').ShopPreset;
type ShopSellItem = import('./modules/Internal').ShopSellItem;
type ShopBuyItem = import('./modules/Internal').ShopBuyItem;
type Socket = import('socket.io').Socket;

export interface ExtraObject {
    [key: string]: any
}

export interface EmailAuthInfo {
    code: string;
    expirationDate: number;
}

export interface EmailAuthCodeMap {
    [key: string]: EmailAuthInfo;
}

export interface NumberMap {
    [key: string]: number;
}

export interface StringMap {
    [key: string]: string;
}

export interface MessageComponent {
    children: MessageComponent[];
}

export interface TextComponent extends MessageComponent {
    content: string;
    style: CSSProperties;
}

export interface BlockTextComponent extends TextComponent {
    block: true;
}

export interface ImageComponent extends MessageComponent {
    imageSource: string;
    width: number;
    height: number;
}

export interface EmbedTextComponent extends MessageComponent {
    embedColor: string;
}

export interface ButtonComponent extends MessageComponent {
    command: string;
    buttonColor?: string;
}

export interface ProgressComponent extends MessageComponent {
    progressColor: string;
    width: string;
    height: string;
    progress: number;
}

export interface HiddenComponent extends MessageComponent {
    hidden: true;
}

export interface ChatData {
    room: string;
    message: MessageComponent;
}

export interface SendChatData extends ChatData {
    date: number;
    senderName: string;
    chatId: string;
}

export interface HandleChatData extends SendChatData {
    user: User;
    client: Socket;
}

export interface ClientChatData extends SendChatData {
    profilePic?: string;
    userId: string;
    flags?: ChatFlag[];
}

export type ChatFlag = 'dev' | 'bot' | '#1'

export interface AttackOptions {
    applyAttackSpeed?: boolean;
    absoluteHit?: boolean;
    useAbuserCritical?: boolean;
    isMagicAttack?: boolean;
    isFixedAttack?: boolean;
    isOptionedAttack?: boolean;
    onHit?: (attacker: Entity, victim: Entity) => void;
    additionalMessage?: MessageComponent;
}

export interface ItemPresetObject {
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

export interface LocationPresetObject {
    npcs?: Npc[];
    terrains?: Terrain[];
    objects?: (Entity & Lootable)[];
    fishDrops?: FishDrops;
    getMovable?: (location: Location) => string[];
    onUpdate?: (location: Location) => void;
    zoneType?: ZoneType;
    regionType?: RegionType;
}

export interface EventMap {
    onUpdate?: (p: Player) => void;
    onHit?: (p: Player, victim: Entity) => void;
    onProjectileHit?: (p: Player, projectile: Projectile, victim: Entity) => void;
    onHitted?: (p: Player, attacker: Entity) => void;
}

export interface ShopPresetObject {
    name: string;
    buyList: ShopBuyItemPresetObject[];
    sellList: ShopSellItemPresetObject[];
    regenTime: number;
}

export interface LoginInfo {
    email: string;
    password: string;
}

export interface PingRoomData {
    id: string;
    name: string;
    userCount: number;
}

export interface ServerPingData {
    playerLife?: number;
    playerMana?: number;
    targetLife?: number;
    level?: number;
    currentRoom?: string;
    currentRoomName?: string;
    rooms?: PingRoomData[];
    profilePic?: NullableString;
    mapLocNames?: string[];
    mapPlayerNames?: string[];
    roomUserCount?: number;
    totalUserCount?: number;
    cooldowns?: [string, number][];
    currentActionBar?: MessageComponent | null;
    attackSpeedProgress?: number;
    isHotTime?: boolean;
}

export type LoginMessage = 
    'user-not-exists' | 
    'password-not-match' | 
    'success';

export interface RegisterInfo {
    email: string;
    nickname: string;
    password: string;
    emailAuthCode: string;
}

export type RegisterMessage = 
    'success' |
    'auth-code-doesnt-sent' | 
    'auth-code-not-match' |
    'auth-code-expired' |
    'email-already-registered' |
    'nickname-cannot-use';

export type CommandHanlder = (
    chatData: HandleChatData, 
    player: Player, 
    label: string, 
    args: string[]) => void;

export interface QuestPresetObject {
    name: string;
    conditionMessage: string;
    giveReward: (quest: Quest, player: Player) => void;
    canComplete: (quest: Quest, player: Player) => boolean;
    trigger: Trigger;
    rewardMessage: string;
}

export interface ResourcePresetObject {
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

export interface ShopBuyItemPresetObject {
    name: string;
    cost: number;
    count: number;
    createItem: (preset: ShopBuyItem) => Item;
}

export interface ShopSellItemPresetObject {
    name: string;
    cost: number;
    checkItem: (item: Item, preset: ShopSellItem) => boolean; 
}

export type Lootable = Monster | Resource;

export interface OptionPresetObject {
    name: string;
    getDescription: (option: Option) => string;
    onHit?: (option: Option, self: Entity, victim: Entity) => void;
    onProjectileHit?: (option: Option, projectile: Projectile, victim: Entity) => void;
    onHitted?: (option: Option, self: Entity, attacker: Entity) => void;
    onUpdate?: (option: Option, self: Entity) => void;
}

export interface ProjectilePresetObject {
    name: string;
    owner: LivingEntity;
    onHit?: (projectile: Projectile, victim: LivingEntity) => void;
    attributes: { [key: string]: number };
}

export type SpellMap = {
    [key: string]: SpellMap | SpellAction
}
export type SpellAction = (p: Player) => boolean;

export interface MonsterPresetObject {
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

export interface SkillPresetObject {
    name: string;
    isPassive: boolean;
    maxLevel: number;
    constants?: ExtraObject;
    checkRealizeCondition?: (p: Player) => boolean;
    getCooldown?: (skill: Skill, p: Player) => number;
    calcValues?: (skill: Skill, p: Player) => NumberMap;
    getCostMessage?: (skill: Skill, p: Player) => string;
    canTakeCost?: (skill: Skill, p: Player) => boolean;
    takeCost?: (skill: Skill, p: Player) => void;
    getCostFailMessage?: (skill: Skill, p: Player) => string;
    getConditionMessage?: (skill: Skill, p: Player) => string;
    checkCondition?: (skill: Skill, p: Player) => boolean;
    getDescription: (skill: Skill, p: Player) => MessageComponent;
    onStart?: (skill: Skill, p: Player) => void;
    onEarlyUpdate?: (skill: Skill, p: Player) => void;
    onUpdate?: (skill: Skill, p: Player) => void;
    onLateUpdate?: (skill: Skill, p: Player) => void;
    onFinish?: (skill: Skill, p: Player) => void;
}

export type NpcAct = (npc: Npc) => void;

export type NullableString = string | null;

export type DisplayType = 'percent'|'float-percent'|'int-value'|'float-value'|'none';