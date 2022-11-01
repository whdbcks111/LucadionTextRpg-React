const progresses = ['', '▏', '▎', '▍', '▌', '▋', '▊', '▉', '█', '　'];

export default class Utils {

    static blank = '\u200b'.repeat(500);
    static prefix = '::';

    static pick(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    static shuffle(arr) {
        let newArr = [];
        while (arr.length) newArr.push(this.pick(arr));
        return newArr;
    }

    static randomRangeInt(minNum, maxNum) {
        return minNum + Math.floor(Math.random() * (maxNum - minNum + 1));
    }

    static randomRange(minNum, maxExclude) {
        return minNum + Math.random() * (maxExclude - minNum);
    }

    static deepClone(obj, seen) {
        seen = seen || new WeakMap();
        if (seen.has(obj)) return seen.get(obj);
        if (obj instanceof Object) {
            let result = {};
            seen.set(obj, result);
            Object.setPrototypeOf(result, Object.getPrototypeOf(obj));
            Object.keys(obj).forEach(k => {
                result[k] = deepClone(obj[k], seen);
            })
            return result;
        }
        else if (obj instanceof Array) {
            let result = [];
            seen.set(obj, result);
            obj.forEach(element => result.push(deepClone(element, seen)));
            return result;
        }
        else if (obj instanceof Set) {
            let result = new Set();
            seen.set(obj, result);
            obj.forEach(element => result.add(deepClone(element, seen)));
            return result;
        }
        else if (obj instanceof Map) {
            let result = new Map();
            seen.set(obj, result);
            for (let item of obj.entries()) {
                result.set(item[0], deepClone(item[1], seen));
            }
            return result;
        }
        else return obj;
    }

    static repeat(obj, cnt) {
        let newArr = [obj];
        while(newArr.length >= cnt) newArr.push(this.deepClone(obj));
    }

    /**
     * @param {'percent'|'float-percent'|'int-value'|'float-value'} displayType 
     * @returns 
     */
    static progressBar(length = 5, value = 0, maxValue = 100, displayType = 'none') {
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
}