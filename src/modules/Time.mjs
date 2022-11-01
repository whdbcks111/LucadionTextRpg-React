export default class Time {
    static deltaTime = 0;
    static latestUpdate = -1;

    static update() {
        let now = Date.now();

        if(this.latestUpdate !== -1) 
            this.deltaTime = (now - this.latestUpdate) / 1000;
        this.latestUpdate = now;

        //update entirely
        
    }
}