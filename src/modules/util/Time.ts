import { Player, World, TradeManager, Entity } from '../Internal';

export class Time {
    static deltaTime = 0;
    static latestUpdate = -1n;
    static updateCount = 0;
    static totalExecuteTime = 0;

    static update() {
        
        let start = process.hrtime.bigint();

        if(this.latestUpdate !== -1n) 
            this.deltaTime = Number(start - this.latestUpdate) / 1e9;
        this.latestUpdate = start;

        //update entirely

        Player.players.forEach(player => {
            player.loggedFreeUpdate();
            if(player.isLoggedIn) {
                player.earlyUpdate();
                player.update();
                player.lateUpdate();
            }
        });

        World.locations.forEach(location => {
            location.update();
        });

        TradeManager.trades.forEach(trade => {
            trade.update();
        });

        TradeManager.requests.forEach(request => {
            request.update();
        })
        
        let executeTime = Number(process.hrtime.bigint() - start) / 1e9;
        this.totalExecuteTime += executeTime;

        this.updateCount++;
    }
}