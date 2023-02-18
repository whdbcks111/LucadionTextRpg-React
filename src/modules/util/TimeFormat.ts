export class TimeFormat {

    time: number;
    milliseconds: number;
    days: number = 0;
    hours: number = 0;
    minutes: number = 0;
    seconds: number = 0;
    
    constructor(time: number) {
        this.time = Math.floor(time);
        this.milliseconds = this.time;
    }

    useUntilMilliseconds() {
        this.milliseconds = this.time;
        this.seconds = 0;
        this.minutes = 0;
        this.hours = 0;
        this.days = 0;
        return this;
    }

    useUntilSeconds() {
        this.useUntilMilliseconds();
        this.seconds = Math.floor(this.milliseconds / 1000);
        this.milliseconds %= 1000;
        return this;
    }

    useUntilMinutes() {
        this.useUntilSeconds();
        this.minutes = Math.floor(this.seconds / 60);
        this.seconds %= 60;
        return this;
    }

    useUntilHours() {
        this.useUntilMinutes();
        this.hours = Math.floor(this.minutes / 60);
        this.minutes %= 60;
        return this;
    }

    useUntilDays() {
        this.useUntilHours();
        this.days = Math.floor(this.hours / 24);
        this.hours %= 24;
        return this;
    }

    format(formatStr: string) {
        return formatStr
            .replace(/DD/gi, (this.days < 10 ? '0' + this.days : this.days.toString()))
            .replace(/hh/gi, ('0' + this.hours).slice(-2))
            .replace(/mm/g, ('0' + this.minutes).slice(-2))
            .replace(/ss/gi, ('0' + this.seconds).slice(-2))
            .replace(/ms/gi, ('00' + this.milliseconds).slice(-3))
            .replace(/D/gi, this.days.toString())
            .replace(/h/gi, this.hours.toString())
            .replace(/m/g, this.minutes.toString())
            .replace(/s/gi, this.seconds.toString())
            .replace(/t/gi, this.milliseconds.toString());
    }

}