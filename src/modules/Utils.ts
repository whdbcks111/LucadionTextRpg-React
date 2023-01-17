import { DisplayType, ExtraObject } from "../types";

const progress = ['', '▏', '▎', '▍', '▌', '▋', '▊', '▉', '█', '　'];

export default class Utils {

    static blank = '{{blank}}';
    static rich = '{{rich}}';
    static coloredRich = (color: string) => `{{rich:${color}}}`;
    static richRegex = /\{\{rich(:[#\w]+)?\}\}/;
    static prefix = '::';

    static parseRichColor(rich: string) {
        if(!rich.includes(':')) return null;
        return rich.split(':')[1].split('}}')[0];
    }

    static pick(arr: any[]) {
        return arr[Math.floor(Math.random() * arr.length)];
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

    static formatTime(formatStr: string, time: number) {

        time = Math.floor(time);

        let milliseconds = time % 1000;
        let seconds = Math.floor(time / 1000);
        let minutes = Math.floor(seconds / 60);
        let hours = Math.floor(minutes / 60);
        let days = Math.floor(hours / 24);

        hours %= 24;
        minutes %= 60;
        seconds %= 60;

        return formatStr
            .replace(/DD/gm, (days < 10 ? '0' + days : days.toString()))
            .replace(/hh/gm, ('0' + hours).slice(-2))
            .replace(/mm/g, ('0' + minutes).slice(-2))
            .replace(/ss/gm, ('0' + seconds).slice(-2))
            .replace(/ms/gm, ('00' + milliseconds).slice(-3));
    }

    static CHAR_CODE_GA = '가'.charCodeAt(0);
    static CHAR_CODE_GYA = '갸'.charCodeAt(0);

    static hasLastConsonantLetter(ch: string) {
        let lastCharCode = ch.charCodeAt(0);
        return (lastCharCode - Utils.CHAR_CODE_GA) % (Utils.CHAR_CODE_GYA - Utils.CHAR_CODE_GA) > 0;
    }

    static addSubjectiveParticle(str: string) {
        return str + (Utils.hasLastConsonantLetter(str.slice(-1)) ? '이': '가'); 
    }

    static toFixed(n: number, pos: number) {
        return n.toFixed(pos).replace(/\.?0+$/, '');
    }

    static addObjectiveParticle(str: string) {
        return str + (Utils.hasLastConsonantLetter(str.slice(-1)) ? '을': '를'); 
    }

    static progressBar(length = 5, value = 0, maxValue = 100, displayType: DisplayType = 'none') {
        if(value < 0) value = 0;
        if(maxValue <= 0) maxValue = 100;
        if(value > maxValue) value = maxValue;
        const fillLength = value / maxValue * length;

        let result = '';
        result += progress[8].repeat(Math.floor(fillLength));
        result += progress[Math.ceil((fillLength % 1) * 8)];
        result += progress[9].repeat(Math.floor(length - fillLength));

        switch(displayType) {
            case 'percent': result += ' (' + (value / maxValue * 100).toFixed(0) + '%)'; break;
            case 'float-percent':  result += ' (' + (value / maxValue * 100).toFixed(2) + '%)'; break;
            case 'int-value':  result += ' (' + value.toFixed(0) + '/' + maxValue.toFixed(0) + ')'; break;
            case 'float-value':  result += ' (' + value.toFixed(2) + '/' + maxValue.toFixed(2) + ')'; break;
        }

        return result;
    }

    static importAll(module: ExtraObject, global: ExtraObject) {
        for(let name in module) {
            global[name] = module[name];
        }
        global['Utils'] = Utils;
    }
}