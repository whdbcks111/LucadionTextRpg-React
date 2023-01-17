import Utils from "./Utils";

export default class DateFormat {
    
    date: Date;

    constructor(date: Date) {
        this.date = date ?? new Date();
    }

    format(formatStr: string) {
        let date = this.date ?? new Date();
        return Utils.formatTime(
            formatStr
                .replace(/YYYY/gm, date.getFullYear().toString())
                .replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2))
                .replace(/DD/gm, ('0' + date.getDate()).slice(-2))
                .replace(/ma/gm, date.getHours() >= 12 ? '오후' : '오전')
                .replace(/h/gm, ('0' + (date.getHours() % 12 || 12)).slice(-2)),
            date.getMilliseconds() +
            date.getSeconds() * 1000 +
            date.getMinutes() * 1000 * 60 +
            date.getHours() * 1000 * 3600 +
            date.getDate() * 1000 * 3600 * 24
        );
    }
}