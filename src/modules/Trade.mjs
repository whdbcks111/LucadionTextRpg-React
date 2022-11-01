import Time from "./Time.mjs";

export default class Trade {
    constructor(p1, p2) {
        this.player1 = new TradePlayer(p1);
        this.player2 = new TradePlayer(p2);
    }

    getTradeInfo() {
        return `[ ${this.player1.player.getName()}님과 ${this.player2.player.getName()}님의 거래 ]\n\n` +
            `▌ ${this.player1.player.getName()}\n` +
            '  [아이템]\n' +
            this.player1.items.contents.map((itemStack, idx) => {
                return `    [${idx + 1}] ${itemStack.item} ×${itemStack.count}`;
            }).join('\n') + '\n' +
            `[ 골드 ] ${this.player1.gold}G\n\n` +
            `▌ ${this.player2.player.getName()}\n` +
            `  [아이템]\n` +
            this.player2.items.contents.map((itemStack, idx) => {
                return `    [${idx + 1}] ${itemStack.item} ×${itemStack.count}`;
            }).join('\n') + '\n' +
            `[ 골드 ] ${this.player2.gold}G`;
    }

    update(delta = Time.deltaTime) {
        if (!this.player1.player.isAlive() || !this.player2.player.isAlive()) {
            this.cancel();
            Player.sendGroupMessage([this.player1.player, this.player2.player], '[ 거래가 취소되었습니다. ]');
        }
        else if (this.player1.player.loc !== this.player2.player.loc) {
            this.cancel();
            Player.sendGroupMessage([this.player1.player, this.player2.player], '[ 거래가 취소되었습니다. ]');
        }
        else if (this.player1.hasConfirmed && this.player2.hasConfirmed) {
            this.complete();
            Player.sendGroupMessage([this.player1.player, this.player2.player], '[ 거래가 성사되었습니다. ]');
        }
    }

    complete() {
        if (!this.player1.hasConfirmed || !this.player2.hasConfirmed) return false;

        this.player1.items.contents.forEach(itemStack => {
            this.player2.player.inventory.addItem(itemStack.item, itemStack.count);
        });
        this.player1.player.gold += this.player2.gold;

        this.player2.items.contents.forEach(itemStack => {
            this.player1.player.inventory.addItem(itemStack.item, itemStack.count);
        });
        this.player2.player.gold += this.player1.gold;

        this.player1.items.contents = this.player2.items.contents = [];
        this.player1.gold = this.player2.gold = 0;
        Trades.removeTrade(this);
        return true;
    }

    cancel() {
        this.player2.items.contents.forEach(itemStack => {
            this.player2.player.inventory.addItem(itemStack.item, itemStack.count);
        });
        this.player2.player.gold += this.player2.gold;

        this.player1.items.contents.forEach(itemStack => {
            this.player1.player.inventory.addItem(itemStack.item, itemStack.count);
        });
        this.player1.player.gold += this.player1.gold;

        this.player1.items = this.player2.items = [];
        this.player1.gold = this.player2.gold = 0;
        Trade.removeTrade(this);
        return true;
    }

    static removeTrade(trade) {

    }
}

export class TradePlayer {
    constructor(player) {
        this.player = player;
        this.items = new ItemContainer();
        this.gold = 0;
        this.hasConfirmed = false;
    }

    addGold(amount) {
        if (this.player.gold < amount) return false;
        this.player.gold -= amount;
        this.gold += amount;
        return true;
    }

    subtractGold(amount) {
        if (this.gold === 0) return false;
        if (this.gold < amount) amount = this.gold;
        this.player.gold += amount;
        this.gold -= amount;
        return true;
    }

    addItem(index, count) {
        let itemStack = this.player.inventory.getItemStack(index);
        if (!itemStack) return false;
        this.items.addItem(itemStack.item, Math.min(count, itemStack.count));
        this.player.inventory.setItemCount(index, this.player.inventory.getItemCount(index) - count);
        return true;
    }

    subtractItem(index, count) {
        let itemStack = this.items.contents[index];
        if (!itemStack) return false;
        this.player.inventory.addItem(itemStack.item, Math.min(count, itemStack.count));
        this.items.setItemCount(index, this.items.getItemCount(index) - count);
        return true;
    }
}

export class TradeRequest {

    static DEFAULT_REMAIN_TIME = 30;

    constructor(ployer, target) {
        this.player = ployer;
        this.target = target;
        this.remainTime = TradeRequest.DEFAULT_REMAIN_TIME;
    }

    update(delta = Time.deltaTime) {
        this.remainTime -= delta;
        if (this.remainTime <= 0 || !this.player.isAlive() ||
            !this.target.isAlive() || this.player.location !== this.target.location) {
            this.deny();
            Player.sendGroupMessage([this.player, this.target], `[ ${this.player.getName()}님의 거래 요청이 만료되었습니다. ]`);
        }
    }

    deny = function () {
        Trade.removeRequest(this.player);
    }

    accept = function () {
        let trade = new Trade(this.player, this.target);
        Trade.removeRequest(this.player);
        Trade.createTrade(trade);
        return trade;
    }
}