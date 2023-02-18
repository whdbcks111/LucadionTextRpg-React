import { TimeFormat } from "./TimeFormat";

export class DateFormat {
    
    date: Date;

    constructor(date: Date) {
        this.date = date ?? new Date();
    }

    format(formatStr: string) {
        let date = this.date ?? new Date();
        return new TimeFormat(
            date.getMilliseconds() +
            date.getSeconds() * 1000 +
            date.getMinutes() * 1000 * 60 +
            date.getHours() * 1000 * 3600 +
            date.getDate() * 1000 * 3600 * 24
        )
            .useUntilDays()
            .format(
                formatStr
                    .replace(/YYYY/gi, date.getFullYear().toString())
                    .replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2))
                    .replace(/DD/gi, ('0' + date.getDate()).slice(-2))
                    .replace(/HH/gi, ('0' + date.getHours()).slice(-2))
                    .replace(/ma/gi, date.getHours() >= 12 ? '오후' : '오전')
                    .replace(/h/gi, ('0' + (date.getHours() % 12 || 12)).slice(-2))
            );
    }
}