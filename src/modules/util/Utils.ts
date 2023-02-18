import { DisplayType, ExtraObject } from "../../types";
import { ComponentBuilder } from "../server/chat/ComponentBuilder";

export class Utils {

    static readonly DATA_PATH = 'C:/ProgramData/Lucadion/';
    static readonly TMP_PATH = Utils.DATA_PATH + 'tmp/';
    static readonly SAVE_PATH = Utils.DATA_PATH + 'save/';
    static readonly BACKUP_PATH = Utils.DATA_PATH + 'backup/';

    static readonly MAIN_COLOR = '#00ffb7';
    static readonly NUMBER_COLOR = '#ff99aa';
    static readonly PHYSICAL_COLOR = '#ff6600';
    static readonly MAGIC_COLOR = '#7755ff';
    static readonly PREFIX = '::';

    static pick(arr: any[]) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    static replaceMessageFormat(message: (string | JSX.Element)[], regex: RegExp,
        replacer: (str: string, idx: number) => (string | JSX.Element)): (string | JSX.Element)[] {
        regex = new RegExp(regex.source, regex.flags.replace('g', '') + 'g');

        message = message.map(e => {
            if (typeof e === 'string' && regex.test(e)) {
                let matchResult = e.match(regex) ?? [];
                return e
                    .split(regex)
                    .map((str, i, arr) => (
                        i === arr.length - 1 ? str : [str, matchResult[i] ? replacer(matchResult[i], i) : '']
                    ))
                    .flat();
            }
            else return e;
        }).flat();

        return message;
    }

    static shuffle(arr: any[]) {
        let newArr = [];
        while (arr.length) {
            let idx = this.randomRangeInt(0, arr.length - 1);
            newArr.push(arr[idx]);
            arr.splice(idx, 1);
        }
        return newArr;
    }

    static randomRangeInt(minNum: number, maxNum: number) {
        return minNum + Math.floor(Math.random() * (maxNum - minNum + 1));
    }

    static randomRange(minNum: number, maxExclude: number) {
        return minNum + Math.random() * (maxExclude - minNum);
    }

    static clamp(num: number, minNum: number, maxNum: number) {
        return Math.max(minNum, Math.min(maxNum, num));
    }

    static clamp01(num: number) {
        return this.clamp(num, 0, 1);
    }

    static repeat<T>(factory: () => T, cnt: number) {
        let newArr: T[] = [];
        while(newArr.length < cnt) newArr.push(factory());
        return newArr;
    }

    static equalsNumber(num1: number, num2: number) {
        return Math.abs(num1 - num2) < Number.EPSILON;
    }

    static randomString(length: number) {
        return Array(length).fill('').map(_ => Utils.randomRangeInt(0, 35).toString(36).toUpperCase()).join('');
    }

    static CHAR_CODE_GA = '가'.charCodeAt(0);
    static LAST_CONSONANT_INTERVAL = 28;

    static hasLastConsonantLetter(ch: string) {
        let lastCharCode = ch.charCodeAt(0);
        return (lastCharCode - Utils.CHAR_CODE_GA) % Utils.LAST_CONSONANT_INTERVAL > 0;
    }

    static getSubjective(str: string) {
        return Utils.hasLastConsonantLetter(str.slice(-1)) ? '이': '가';
    }

    static asSubjective(str: string) {
        return str + Utils.getSubjective(str); 
    }

    static getObjective(str: string) {
        return Utils.hasLastConsonantLetter(str.slice(-1)) ? '을': '를';
    }

    static asObjective(str: string) {
        return str + Utils.getObjective(str);
    }

    static formatStr(str: string, ...args: any[]) {
        args.forEach((arg, i) => {
            str = str.replace(new RegExp(`\\{${i}\\}`, 'g'), arg);
        });
        return str;
    }

    static toFixed(n: number, pos: number) {
        return n.toFixed(pos).replace(/\.?0+$/, '');
    }

    static importAll(module: ExtraObject, global: ExtraObject) {
        for(let name in module) {
            global[name] = module[name];
        }
        global['Utils'] = Utils;
    }
}