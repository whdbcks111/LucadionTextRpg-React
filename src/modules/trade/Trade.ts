import { ItemContainer, Player, Time, TradeManager } from "../Internal"

export class Trade {

    player1: TradePlayer;
    player2: TradePlayer;

    constructor(p1: Player, p2: Player) {
        this.player1 = new TradePlayer(p1);
        this.player2 = new TradePlayer(p2);
    }

    getTradePlayer(p: Player) {
        return this.player1.player === p ? this.player1 : this.player2;
    }

    getTradeInfo() {
        return `[ ${this.player1.player.getName()}님과 ${this.player2.player.getName()}님의 거래 ]\n\n` +
            `▌ ${this.player1.player.getName()}\n` +
            '  [아이템]\n' +
            this.player1.items.contents.map((itemStack, idx) => {
                return `    [${idx + 1}] ${itemStack?.item} x${itemStack?.count}`;
            }).join('\n') + '\n' +
            `[ 골드 ] ${this.player1.gold}G\n\n` +
            `▌ ${this.player2.player.getName()}\n` +
            `  [아이템]\n` +
            this.player2.items.contents.map((itemStack, idx) => {
                return `    [${idx + 1}] ${itemStack?.item} x${itemStack?.count}`;
            }).join('\n') + '\n' +
            `[ 골드 ] ${this.player2.gold}G`;
    }

    update() {
        if (!this.player1.player.isAlive || !this.player2.player.isAlive) {
            this.cancel();
            Player.sendGroupRawMessage([this.player1.player, this.player2.player], '[ 거래가 취소되었습니다. ]');
        }
        else if (this.player1.player.location !== this.player2.player.location) {
            this.cancel();
            Player.sendGroupRawMessage([this.player1.player, this.player2.player], '[ 거래가 취소되었습니다. ]');
        }
        else if (this.player1.hasConfirmed && this.player2.hasConfirmed) {
            this.complete();
            Player.sendGroupRawMessage([this.player1.player, this.player2.player], '[ 거래가 성사되었습니다. ]');
        }
    }

    complete() {
        if (!this.player1.hasConfirmed || !this.player2.hasConfirmed) return false;

        this.player1.items.contents.forEach(itemStack => {
            if(!itemStack) return;
            this.player2.player.inventory.addItem(itemStack.item, itemStack.count);
        });
        this.player1.player.gold += this.player2.gold;

        this.player2.items.contents.forEach(itemStack => {
            if(!itemStack) return;
            this.player1.player.inventory.addItem(itemStack.item, itemStack.count);
        });
        this.player2.player.gold += this.player1.gold;

        this.player1.items.contents = this.player2.items.contents = [];
        this.player1.gold = this.player2.gold = 0;
        TradeManager.removeTrade(this);
        return true;
    }

    cancel() {
        this.player2.items.contents.forEach(itemStack => {
            if(!itemStack) return;
            this.player2.player.inventory.addItem(itemStack.item, itemStack.count);
        });
        this.player2.player.gold += this.player2.gold;

        this.player1.items.contents.forEach(itemStack => {
            if(!itemStack) return;
            this.player1.player.inventory.addItem(itemStack.item, itemStack.count);
        });
        this.player1.player.gold += this.player1.gold;

        this.player1.items.contents = this.player2.items.contents = [];
        this.player1.gold = this.player2.gold = 0;
        TradeManager.removeTrade(this);
        return true;
    }
}

export class TradePlayer {

    player: Player;
    items: ItemContainer;
    gold = 0;
    hasConfirmed = false;

    constructor(player: Player) {
        this.player = player;
        this.items = new ItemContainer();
    }

    addGold(amount: number) {
        if (this.player.gold < amount || amount <= 0) return false;
        this.player.gold -= amount;
        this.gold += amount;
        return true;
    }

    subtractGold(amount: number) {
        if (this.gold === 0 || amount <= 0) return false;
        if (this.gold < amount) amount = this.gold;
        this.player.gold += amount;
        this.gold -= amount;
        return true;
    }

    addItem(index: number, count = 1) {
        let itemStack = this.player.inventory.getItemStack(index);
        if (!itemStack || count <= 0) return false;
        this.items.addItem(itemStack.item, Math.min(count, itemStack.count));
        this.player.inventory.addItemCount(index, -count);
        return true;
    }

    subtractItem(index: number, count = 1) {
        let itemStack = this.items.contents[index];
        if (!itemStack) return false;
        this.player.inventory.addItem(itemStack.item, Math.min(count, itemStack.count));
        this.player.inventory.addItemCount(index, -count);
        return true;
    }
}

export class TradeRequest {

    static DEFAULT_REMAIN_TIME = 30;

    player: Player;
    target: Player;
    remainTime = TradeRequest.DEFAULT_REMAIN_TIME;

    constructor(ployer: Player, target: Player) {
        this.player = ployer;
        this.target = target;
    }

    update() {
        this.remainTime -= Time.deltaTime;
        if (this.remainTime <= 0 || !this.player.isAlive ||
            !this.target.isAlive || this.player.location !== this.target.location) {
            this.deny();
            Player.sendGroupRawMessage([this.player, this.target], `[ ${this.player.getName()}님의 거래 요청이 만료되었습니다. ]`);
        }
    }

    deny () {
        TradeManager.removeRequest(this.player);
    }

    accept () {
        let trade = new Trade(this.player, this.target);
        TradeManager.removeRequest(this.player);
        TradeManager.createTrade(trade);
        return trade;
    }
}