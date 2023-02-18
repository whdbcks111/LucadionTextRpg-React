import { Player, Trade, TradeRequest } from "../Internal"

export class TradeManager {
    static trades: Trade[] = [];
    static requests: TradeRequest[] = [];

    static getTrade(player: Player) {
        return TradeManager.trades.find(t => t.player1.player === player || t.player2.player === player);
    }

    static requestTrade(player: Player, targetPlayer: Player) {
        TradeManager.removeRequest(player);
        TradeManager.removeRequest(targetPlayer);
        TradeManager.requests.push(new TradeRequest(player, targetPlayer));
    }

    static getRequest(player: Player) {
        return TradeManager.requests.find(r => r.player === player || r.target === player) ?? null;
    }

    static getRequestTo(target: Player) {
        return TradeManager.requests.find(r => r.target === target) ?? null;
    }

    static getRequestFrom(player: Player) {
        return TradeManager.requests.find(r => r.player === player) ?? null;
    }

    static removeRequest(player: Player) {
        TradeManager.requests = TradeManager.requests.filter(r => r.player !== player && r.target !== player);
    }

    static createTrade(trade: Trade) {
        if(TradeManager.getTrade(trade.player1.player) || TradeManager.getTrade(trade.player2.player)) return false;
        TradeManager.trades.push(trade);
    }

    static removeTrade(trade: Trade) {
        TradeManager.trades = TradeManager.trades.filter(t => t !== trade);
    }

    static cancelAllTrades() {
        TradeManager.trades.forEach(t => t.cancel());
    }
}