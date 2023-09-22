import { Player, ItemStack, Material, Item, MetalForgeForm } from "../../../Internal";

const cache: { [key: string]: CraftRecipe | undefined } = {};

export class CraftRecipe {

    name: string;
    recipe: string;
    canCraft: (p: Player) => boolean;
    craftTrigger: (p: Player) => ItemStack[];

    private constructor(name: string, recipe: string, canCraft: (p: Player) => boolean, 
        onCraft: (p: Player) => ItemStack[]) {
        this.name = name;
        this.recipe = recipe;
        this.canCraft = canCraft;
        this.craftTrigger = onCraft;
    }

    getRecipeInfo() {
        return `[ ${this.name} ]\n`
            + '제작 조건 > ' + this.recipe;
    }

    canUnlock(p: Player) {
        return this.canCraft(p) && !p.unlockedRecipes.includes(this.name);
    }

    craft(p: Player, cnt = 1) {
        for(let i = 0; i < cnt; i++) {
            if(this.canCraft(p))
                this.craftTrigger(p).forEach((itemStack: ItemStack) => {
                    itemStack.item.createdBy = p.uid;
                    p.inventory.addItem(itemStack.item, itemStack.count);
                });
            else return i;
        }
        return cnt;
    }

    static convertForgedItem(form: MetalForgeForm, itemName: string, postprocess: (p: Player) => void): (p: Player) => ItemStack[] {
      return p => {
        let result = [];
        let baseItem = p.inventory.contents.find(s => s && s.item.name === form.itemName)?.item;
        let item = Item.fromName(itemName);
        item.durability = baseItem?.durability ?? null;
        item.maxDurability = baseItem?.maxDurability ?? null;
        item.attributeModifiers = baseItem?.attributeModifiers?.slice() ?? [];
        item.options = baseItem?.options ?? [];
        item.extras = baseItem?.extras ?? {};
        item.requiredLevel = baseItem?.requiredLevel ?? null;
        p.inventory.removeItem(i => i.name === form.itemName, 1);
        result.push(new ItemStack(item, 1));

        postprocess(p);

        return result;
      }
    }

    static list: CraftRecipe[] = [
        new CraftRecipe('하이퍼 마나 물약', '초급 마나 물약 1개, 푸른 심장 1개',
          p => p.inventory.hasItem(i => i.name === '초급 마나 물약', 1) && 
            p.inventory.hasItem(i => i.name === '푸른 심장', 1),
          p => {
            let result = [];
            p.inventory.removeItem(i => i.name === '초급 마나 물약', 1);
            p.inventory.removeItem(i => i.name === '푸른 심장', 1);
            result.push(new ItemStack(Item.fromName('하이퍼 마나 물약'), 1));
            return result;
          }
        ),
        new CraftRecipe('그레모리스 하트', '검은 심장 1개, 푸른 심장 1개, 불의 정수 100개',
          p => p.inventory.hasItem(i => i.name === '검은 심장', 1) && 
            p.inventory.hasItem(i => i.name === '푸른 심장', 1) && 
            p.inventory.hasItem(i => i.name === '불의 정수', 100) && 
            p.level >= 500,
          p => {
            let result = [];
            p.inventory.removeItem(i => i.name === '검은 심장', 1);
            p.inventory.removeItem(i => i.name === '푸른 심장', 1);
            p.inventory.removeItem(i => i.name === '불의 정수', 100);
            result.push(new ItemStack(Item.fromName('그레모리스 하트'), 1));
            return result;
          }
        ),
        new CraftRecipe('마스터키', '치트 엔진 1개, 푸른 심장 1개, 제련된 아다만티움 5개',
          p => p.inventory.hasItem(i => i.name === '치트 엔진', 1) && 
            p.inventory.hasItem(i => i.name === '푸른 심장', 1) && 
            p.inventory.hasItem(i => i.name === '제련된 아다만티움', 5),
          p => {
            let result = [];
            p.inventory.removeItem(i => i.name === '치트 엔진', 1);
            p.inventory.removeItem(i => i.name === '푸른 심장', 1);
            p.inventory.removeItem(i => i.name === '제련된 아다만티움', 5);
            result.push(new ItemStack(Item.fromName('마스터키'), 1));
            return result;
          }
        ),
        new CraftRecipe('주술사 전직서', '마스터키 1개, 거미 눈 10개, 버려진 설계도 5개',
          p => p.inventory.hasItem(i => i.name === '마스터키', 1) && 
            p.inventory.hasItem(i => i.name === '거미 눈', 10) && 
            p.inventory.hasItem(i => i.name === '버려진 설계도', 5),
          p => {
            let result = [];
            p.inventory.removeItem(i => i.name === '마스터키', 1);
            p.inventory.removeItem(i => i.name === '거미 눈', 10);
            p.inventory.removeItem(i => i.name === '버려진 설계도', 5);
            result.push(new ItemStack(Item.fromName('주술사 전직서'), 1));
            return result;
          }
        ),
        new CraftRecipe('나무 막대기', '목재 재질 아이템 1개',
          p => p.inventory.hasItem(i => i.includesMaterial(Material.WOOD), 1),
          p => {
            let result = [];
            p.inventory.removeItem(i => i.includesMaterial(Material.WOOD), 1);
            result.push(new ItemStack(Item.fromName('나무 막대기'), 5));
            return result;
          }
        ),
        new CraftRecipe('장검', '나무 막대기 1개, 접착제 재질 아이템 1개, 장검 날 1개',
          p => p.inventory.hasItem(i => i.includesMaterial(Material.GLUE), 1) && p.inventory.hasItem(i => i.name === '나무 막대기', 1) && p.inventory.hasItem(i => i.name === '장검 날', 1),
          CraftRecipe.convertForgedItem(MetalForgeForm.LONG_SWORD, '장검', p => {
            p.inventory.removeItem(i => i.name === '나무 막대기', 1);
            p.inventory.removeItem(i => i.includesMaterial(Material.GLUE), 1);
          })
        ),
        new CraftRecipe('대검', '나무 막대기 1개, 접착제 재질 아이템 1개, 대검 날 1개',
          p => p.inventory.hasItem(i => i.includesMaterial(Material.GLUE), 1) && p.inventory.hasItem(i => i.name === '나무 막대기', 1) && p.inventory.hasItem(i => i.name === '대검 날', 1),
          CraftRecipe.convertForgedItem(MetalForgeForm.GREAT_SWORD, '대검', p => {
            p.inventory.removeItem(i => i.name === '나무 막대기', 1);
            p.inventory.removeItem(i => i.includesMaterial(Material.GLUE), 1);
          })
        ),
        new CraftRecipe('도끼', '나무 막대기 1개, 접착제 재질 아이템 1개, 도끼 날 1개',
          p => p.inventory.hasItem(i => i.includesMaterial(Material.GLUE), 1) && p.inventory.hasItem(i => i.name === '나무 막대기', 1) && p.inventory.hasItem(i => i.name === '도끼 날', 1),
          CraftRecipe.convertForgedItem(MetalForgeForm.AXE, '도끼', p => {
            p.inventory.removeItem(i => i.name === '나무 막대기', 1);
            p.inventory.removeItem(i => i.includesMaterial(Material.GLUE), 1);
          })
        ),
        new CraftRecipe('단검', '나무 막대기 1개, 접착제 재질 아이템 1개, 단검 날 1개',
          p => p.inventory.hasItem(i => i.includesMaterial(Material.GLUE), 1) && p.inventory.hasItem(i => i.name === '나무 막대기', 1) && p.inventory.hasItem(i => i.name === '단검 날', 1),
          CraftRecipe.convertForgedItem(MetalForgeForm.DAGGER, '단검', p => {
            p.inventory.removeItem(i => i.name === '나무 막대기', 1);
            p.inventory.removeItem(i => i.includesMaterial(Material.GLUE), 1);
          })
        ),
        new CraftRecipe('목재', '원목 재질 아이템 1개',
          p => p.inventory.hasItem(i => i.includesMaterial(Material.LOG), 1),
          p => {
            let result = [];
            p.inventory.removeItem(i => i.includesMaterial(Material.LOG), 1);
            result.push(new ItemStack(Item.fromName('목재'), 2));
            return result;
          }
        ),
        new CraftRecipe('돌 곡괭이', '돌 재질 아이템 2개, 접착제 재질 아이템 1개, 막대기 1개',
          p => p.inventory.hasItem(i => i.includesMaterial(Material.GLUE), 1) && p.inventory.hasItem(i => i.includesMaterial(Material.STONE), 2) && p.inventory.hasItem(i => i.name === '나무 막대기', 1),
          p => {
            let result = [];
            p.inventory.removeItem(i => i.includesMaterial(Material.STONE), 2);
            p.inventory.removeItem(i => i.includesMaterial(Material.GLUE), 1);
            p.inventory.removeItem(i => i.name === '나무 막대기', 1);
            result.push(new ItemStack(Item.fromName('돌 곡괭이'), 1));
            return result;
          }
        )
    ];

    static getRecipe(name: string) {
        return cache[name] ?? (cache[name] = CraftRecipe.list.find(recipe => recipe.name === name));
    }
}