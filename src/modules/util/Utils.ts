import { ExtraObject } from "../../types";

export class Utils {

    static readonly DATA_PATH = '/home/ubuntu/Lucadion/';
    static readonly IMG_PATH = Utils.DATA_PATH + 'images/'
    static readonly SAVE_PATH = Utils.DATA_PATH + 'save/';
    static readonly BACKUP_PATH = Utils.DATA_PATH + 'backup/';
    static readonly USERS_PATH = 'users/';
    static readonly PLAYERS_PATH = 'players/';
    static readonly ROOMS_PATH = 'rooms/';

    static readonly MAIN_COLOR = '#00ffb7';
    static readonly NUMBER_COLOR = '#4AC3A3';
    static readonly PHYSICAL_COLOR = '#FF9B2C';
    static readonly MAGIC_COLOR = '#773AFF';
    static readonly PREFIX = '::';

    static pick<T>(arr: T[]) {
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

    static lerp(n1: number, n2: number, rate: number) {
        return n1 + (n2 - n1) * rate;
    }

    static colorLerp(col1: number, col2: number, ratio: number) {
        ratio = Utils.clamp01(ratio);
        let rgb1 = [(col1 >> 16) & 0xff, (col1 >> 8) & 0xff, col1 & 0xff].map(n => n * (1 - ratio));
        let rgb2 = [(col2 >> 16) & 0xff, (col2 >> 8) & 0xff, col2 & 0xff].map(n => n * ratio);

        const res = (Math.floor(rgb1[0] + rgb2[0]) << 16) + 
            (Math.floor(rgb1[1] + rgb2[1]) << 8) + 
            Math.floor(rgb1[2] + rgb2[2]);
        let hex = res.toString(16);
        if(hex.length < 6) hex = '0'.repeat(6 - hex.length) + hex;

        return '#' + hex;
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

    static getToSuffix(str: string) {
        return Utils.hasLastConsonantLetter(str.slice(-1)) ? '으로': '로';
    }

    static asTo(str: string) {
        return str + Utils.getToSuffix(str);
    }

    static getWithSuffix(str: string) {
        return Utils.hasLastConsonantLetter(str.slice(-1)) ? '과': '와';
    }

    static asWith(str: string) {
        return str + Utils.getWithSuffix(str);
    }

    static formatStr(str: string, ...args: any[]) {
        args.forEach((arg, i) => {
            str = str.replace(new RegExp(`\\{${i}\\}`, 'g'), arg);
        });
        return str;
    }

    static toFixed(n: number, pos: number) {
        return pos > 0 ? n.toFixed(pos).replace(/\.?0+$/, '') : Math.floor(n).toString();
    }

    static importAll(module: ExtraObject, global: ExtraObject) {
        for(let name in module) {
            global[name] = module[name];
        }
        global['Utils'] = Utils;
    }
}