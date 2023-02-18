import Enum from "../util/Enum";
import { Item } from "../Internal";

export class MetalForgeForm extends Enum {


    static DAGGER = new MetalForgeForm('dagger', '단검 날', 1);
    static LONG_SWORD = new MetalForgeForm('longSword', '장검 날', 2);
    static AXE = new MetalForgeForm('axe', '도끼 날', 4);
    static GREAT_SWORD = new MetalForgeForm('greatSword', '대검 날', 3);
    static ARMOR = new MetalForgeForm('armor', '갑옷', 10);
    static HELMET = new MetalForgeForm('helmet', '투구', 5);
    static LEGGINGS = new MetalForgeForm('leggings', '레깅스', 13);
    static BOOTS = new MetalForgeForm('boots', '부츠', 6);

    itemName: string;
    neededCount: number;

    private constructor(name: string, itemName: string, neededCount: number) {
        super(name);
        this.itemName = itemName;
        this.neededCount = neededCount;
    }
    
}

export class MetalForge {

    static forge(form: MetalForgeForm, material: Item, efficiency = 1) {
        if(efficiency < 0.1) efficiency = 0.1;
        
        let result = Item.fromName(form.itemName);
        if(!result) return null;
        result.displayName = `${material.preset?.forgePrefix ?? '평범한'} ${result.name}`;
        
        if(result.preset?.onForge instanceof Function) result.preset.onForge(result, efficiency);
        if(material.preset?.onForge instanceof Function) material.preset.onForge(result, efficiency);
        
        return result;
    }

}