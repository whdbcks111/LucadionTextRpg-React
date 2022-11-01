class DateFormat {
    
    constructor(date) {
        this.date = date ?? new Date();
    }

    format(formatStr) {
        let date = this.date ?? new Date();
        return formatStr
            .replace(/YYYY/gm, date.getFullYear())
            .replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2))
            .replace(/ma/gm, date.getHours() >= 12 ? '오후': '오전')
            .replace(/DD/gm, ('0' + date.getDate()).slice(-2))
            .replace(/hh/gm, ('0' + date.getHours()).slice(-2))
            .replace(/h/gm, ('0' + (date.getHours() % 12 || 12)).slice(-2))
            .replace(/mm/g, ('0' + date.getMinutes()).slice(-2))
            .replace(/ss/gm, ('0' + date.getSeconds()).slice(-2))
            .replace(/ms/gm, ('0' + date.getMilliseconds()).slice(-3));
    }
}
export default DateFormat;