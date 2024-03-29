import { AttributeType, Entity, EquipmentType, LivingEntity, Player, Projectile } from "../Internal";
import Enum from "../util/Enum";
import { ItemPreset, Option, AttributeModifier, Utils } from "../Internal";
import { AttackOptions, ExtraObject, ItemPresetObject, NullableString } from "../../types";
import { ComponentBuilder } from "../server/chat/ComponentBuilder";

export class ItemStack {

    item: Item;
    count: number;

    constructor(item: Item, count = 1) {
        this.item = item.clone();
        this.count = count;
    }

    asCount(count: number) {
        return new ItemStack(this.item, count);
    }

    toDataObj() {
        return {
            item: this.item.toDataObj(),
            count: this.count
        };
    }

    toString() {
        return this.item.getName();
    }

    static fromDataObj(obj: ExtraObject) {
        if(!obj) return null;
        return new ItemStack(Item.fromDataObj(obj.item), obj.count);
    }

    get maxCount() {
        return this.item.maxCount;
    }

    static fromName(name: string, count = 1) {
        let item = Item.fromName(name);
        return new ItemStack(item, count);
    }
}

export class Item {
    
    name: string;
    displayName: string;
    type: string;
    durability: number | null;
    maxDurability: number | null;
    attributeModifiers: AttributeModifier[];
    options: Option[];
    extras: ExtraObject;
    createdBy: NullableString;
    requiredLevel: number | null;
    
    constructor(preset: ItemPresetObject) {
        this.name = preset.name ?? 'unnamed';
        this.displayName = this.name;
        this.type = preset.type ?? '잡화';
        this.durability = preset.durability ?? preset.maxDurability ?? null;
        this.maxDurability = preset.maxDurability ?? this.durability;
        this.attributeModifiers = (preset.attributeModifiers ?? []).map(m => m.clone());
        this.options = (preset.options ?? []).map(o => o.clone());
        this.extras = JSON.parse(JSON.stringify(preset.extras ?? {}));
        this.createdBy = null;
        this.requiredLevel = preset.requiredLevel ?? null;
    }

    toString() {
        return this.getName();
    }

    toDataObj() {
        return {
            ...this,
            options: this.options.map(option => option.toDataObj()),
            attributeModifiers: this.attributeModifiers.map(modifier => modifier.toDataObj())
        }
    }

    static fromDataObj(obj: ExtraObject) {
        if(!obj) return null;
        let preset = ItemPreset.getItemPreset(obj.name);
        if(!preset) return null;
        let newItem: any = new Item(preset);
        for(let key in obj) newItem[key] = obj[key];
        newItem.options = obj.options.map((optionObj: ExtraObject) => Option.fromDataObj(optionObj));
        newItem.attributeModifiers = obj.attributeModifiers
            .map((attrObj: AttributeModifier) => AttributeModifier.fromDataObj(attrObj));

        return newItem;
    }

    equals(other: Item) {
        return JSON.stringify(this.toDataObj()) === JSON.stringify(other.toDataObj());
    }

    clone() {
        if(!this.preset) return this;

        let result = new Item(this.preset);
        result.displayName = this.displayName;
        result.type = this.type;
        result.durability = this.durability;
        result.maxDurability = this.maxDurability;
        result.attributeModifiers = this.attributeModifiers.map(modifier => modifier.clone());
        result.options = this.options.map(option => option.clone());
        result.extras = JSON.parse(JSON.stringify(this.extras));
        result.createdBy = this.createdBy;
        result.requiredLevel = this.requiredLevel;

        return result;
    }

    getInfo() {
        let desc = this.description;
        let attributes: { [key: string]: [number, number] } = {};

        this.attributeModifiers.forEach(modifier => {
            if(!(modifier.type.displayName in attributes))
                attributes[modifier.type.displayName] = [0, 1];
            
            if(modifier.isMultiplier)
                attributes[modifier.type.displayName][1] *= modifier.value;
            else
                attributes[modifier.type.displayName][0] += modifier.value;
        });

        return ComponentBuilder.message([
            ComponentBuilder.text(`[ ${this.getName()}의 아이템 정보 ]`),
            ComponentBuilder.embed([ComponentBuilder.hidden([
                ComponentBuilder.text('\n'),
                ComponentBuilder.text(`  종류 ‣ ${this.type}\n` +
                    (this.creator ? `  제작자 ‣ ${this.creator.getName()}\n` : '') +
                    (this.durability && this.maxDurability ? `  내구도 ‣ [${this.durability.toFixed(0)}/${this.maxDurability.toFixed(0)}]\n` : '') +
                    (this.requiredLevel ? `  필요 레벨 ‣ ${this.requiredLevel}레벨\n` : '') + '\n' +
                    (Object.keys(attributes).length ?
                        '  ► 능력치\n' +
                        Object.keys(attributes).map(displayName => {
                            return `  │  ${displayName} ‣ ` +
                                (Utils.equalsNumber(attributes[displayName][0], 0) ? '' : `+${Utils.toFixed(attributes[displayName][0], 2)}`) +
                                (Utils.equalsNumber(attributes[displayName][1], 1) ? '' : `+${Utils.toFixed(attributes[displayName][1] * 100 - 100, 2)}%`);
                        }).join('\n') + '\n\n' : ''
                    ) +
                    (this.options.length ?
                        '  ► 옵션\n' +
                        this.options.map(option => {
                            return `  │  [${option.name}] ${option.description}`;
                        }).join('\n') + '\n\n' : ''
                    ) +
                    (desc ? '  ► 설명\n' +
                        `    ${desc}` : ''))
            ])])
        ])
    }

    get preset() {
        return ItemPreset.getItemPreset(this.name);
    }

    get materials() {
        return this.preset?.materials ?? [];
    }

    get creator() {
        if(!this.createdBy) return null;
        return Player.getPlayerByUid(this.createdBy);
    }

    get description() {
        let getDescription = this.preset?.getDescription;
        if(!getDescription) return null;
        return getDescription(this) ?? null;
    }

    includesMaterial(material: Material) {
        return this.materials.some(s => s === material);
    }

    getName() {
        return `[${this.type}] ${(this.createdBy ? '*' : '') + (this.displayName ?? this.name)}`;
    }

    getDisplayName(hideDurability = false) {
        return ComponentBuilder.message([
            ComponentBuilder.text(this.getName()),
            (!hideDurability && this.durability && this.maxDurability && this.durability > 0 ?
                ComponentBuilder.message([
                    ComponentBuilder.text('  '),
                    ComponentBuilder.progressBar(this.durability, this.maxDurability, 'int-value', 'white', '40px')
                ]):
                ComponentBuilder.empty())
        ]);
    }

    onUse(player: Player, index: number) {
        this.preset?.onUse?.call(this, player, index);
    }

    get maxCount() {
        return this.preset?.maxCount ?? 1;
    }

    get canUse() {
        return !!this.preset?.onUse;
    }

    static fromName(name: string) {
        let preset = ItemPreset.getItemPreset(name);
        if(!preset) throw new Error('Invalid Item Name');
        return new Item(preset);
    }
    
    static BOW_ATTACK_EVENT = (player: Player, victim: Entity, options: AttackOptions) => {
        let arrowItem = player.inventory.findItem(item => item.type === '화살');
        if (arrowItem !== null) {
            player.inventory.removeItem(item => item.type === '화살', 1);
            let arrow = new Projectile({
                name: arrowItem.getName(),
                owner: player,
                attributes: {
                    moveSpeed: player.attribute.getValue(AttributeType.PROJECTILE_SPEED),
                    attack: player.attribute.getValue(AttributeType.RANGE_ATTACK),
                    defendPenetrate: player.attribute.getValue(AttributeType.DEFEND_PENETRATE),
                }
            });
            arrowItem.attributeModifiers.forEach(modifier => {
                arrow.attribute.addModifier(modifier);
            });
            arrow.attribute.setCurrentToDefault();
            options.applyAttackSpeed = true;
            options.useAbuserCritical = true;
            if (player.slot.hand?.durability) player.slot.hand.durability--;
            arrow.attack(victim, options);
        }
        else player.attack(victim, options);
    };

    static MAGIC_ATTACK_EVENT = (player: Player, victim: Entity, options: AttackOptions) => {
        options.isMagicAttack = true;
        player.attack(victim, options);
    };

    static CLASS_CHANCE_USE_EVENT = (className: string, condition: (p: Player) => boolean, cannotUseReason: string) => 
        (player: Player, index: number) => {
            if(!condition(player)) {
                player.sendRawMessage(cannotUseReason);
                return;
            }
            player.inventory.addItemCount(index, -1);
            player.sendMessage(ComponentBuilder.text('[ 신체를 재구성 하는 중... ]', { color: 'yellow' }))
            player.inventory.delayTask(() => {
                player.changeClass(className, true);
            }, 1000);
        }

    static EQUIP_USE_EVENT = (type: EquipmentType) => 
        (player: Player, index: number) => {
            let origin = player.slot.getItem(type);
            if (player.inventory.getItemStack(index) != null)
                player.slot.setItem(type, player.inventory.getItemStack(index)?.item ?? null);
            player.inventory.addItemCount(index, -1);
            if(origin) player.inventory.addItem(origin, 1);
        };

    static FOOD_USE_EVENT = (args: { food: number, delay?: number, delayMessage?: string }) => 
        (player: Player, index: number) => {
            if (args.delayMessage) player.sendRawMessage(args.delayMessage);
            player.inventory.addItemCount(index, -1);
            player.inventory.delayTask(() => {
                player.food += args.food;
                player.sendMessage(ComponentBuilder.message([
                    ComponentBuilder.text(`[ 포만감이 ${args.food.toFixed(1)}만큼 차올랐습니다. ]\n`),
                    ComponentBuilder.text('포만감 '),
                    ComponentBuilder.progressBar(player.food, player.maxFood, 'int-value')
                ]));
            }, (args.delay ?? 0) * 1000);
        };

    static CUSTOM_USE_EVENT = (args: { run: (player: Player, index: number) => void, delay?: number, delayMessage?: string }) => 
        (player: Player, index: number) => {
            if (args.delayMessage) player.sendRawMessage(args.delayMessage);
            player.inventory.addItemCount(index, -1);
            player.inventory.delayTask(() => {
                if(args.run) args.run(player, index);
            }, (args.delay ?? 0) * 1000);
        };

    static WATER_USE_EVENT = (args: { water: number, delay?: number, delayMessage?: string }) => 
        (player: Player, index: number) => {
            if (args.delayMessage) player.sendRawMessage(args.delayMessage);
            player.inventory.addItemCount(index, -1);
            player.inventory.delayTask(() => {
                player.water += args.water;
                player.sendMessage(ComponentBuilder.message([
                    ComponentBuilder.text(`[ 수분이 ${args.water.toFixed(1)}만큼 차올랐습니다. ]\n`),
                    ComponentBuilder.text('수분 '),
                    ComponentBuilder.progressBar(player.water, player.maxWater, 'int-value')
                ]));
            }, (args.delay ?? 0) * 1000);
        };

    static MANA_USE_EVENT = (args: { mana: number, delay?: number, delayMessage?: string }) => 
        (player: Player, index: number) => {
            if (args.delayMessage) player.sendRawMessage(args.delayMessage);
            player.inventory.addItemCount(index, -1);
            player.inventory.delayTask(() => {
                player.mana += args.mana;
                player.sendMessage(ComponentBuilder.message([
                    ComponentBuilder.text(`[ 마나가 ${args.mana.toFixed(1)}만큼 차올랐습니다. ]\n`),
                    ComponentBuilder.text('마나 '),
                    ComponentBuilder.progressBar(player.mana, player.maxMana, 'int-value')
                ]));
            }, (args.delay ?? 0) * 1000);
        };

    static LIFE_USE_EVENT = (args: { life: number, delay?: number, delayMessage?: string }) => 
        (player: Player, index: number) => {
            if (args.delayMessage) player.sendRawMessage(args.delayMessage);
            player.inventory.addItemCount(index, -1);
            player.inventory.delayTask(() => {
                player.life += args.life;
                player.sendMessage(ComponentBuilder.message([
                    ComponentBuilder.text(`[ 생명력이 ${args.life.toFixed(1)}만큼 차올랐습니다. ]\n`),
                    ComponentBuilder.text('생명력 '),
                    ComponentBuilder.progressBar(player.life, player.maxLife, 'int-value')
                ]));
            }, (args.delay ?? 0) * 1000);
        };

    static FOOD_AND_WATER_USE_EVENT = (args: { food: number, water: number, delay?: number, delayMessage?: string }) => 
        (player: Player, index: number) => {
            if (args.delayMessage) player.sendRawMessage(args.delayMessage);
            player.inventory.addItemCount(index, -1);
            player.inventory.delayTask(() => {
                player.food += args.food;
                player.water += args.water;
                player.sendMessage(ComponentBuilder.message([
                    ComponentBuilder.text(`[ 포만감이 ${args.food.toFixed(1)}, 수분이 ${args.water.toFixed(1)}만큼 차올랐습니다. ]\n`),
                    ComponentBuilder.text('포만감 '),
                    ComponentBuilder.progressBar(player.food, player.maxFood, 'int-value'),
                    ComponentBuilder.text('\n수분 '),
                    ComponentBuilder.progressBar(player.water, player.maxWater, 'int-value')
                ]));
            }, (args.delay ?? 0) * 1000);
        }
}

export class Material extends Enum {

    displayName: string;

    constructor(name: string, displayName: string) {
        super(name);
        this.displayName = displayName;
    }

    static getAll() {
        return Enum.getAll(Material);
    }

    static GLUE = new Material('glue', '접착제');
    static WOOD = new Material('wood', '목재');
    static LOG = new Material('log', '원목');
    static IRON = new Material('iron', '철');
    static STONE = new Material('stone', '돌');
    static GOLD = new Material('gold', '금');
    static SILVER = new Material('silver', '은');
    static COPPER = new Material('copper', '구리');
    static GLASS = new Material('glass', '유리');
}