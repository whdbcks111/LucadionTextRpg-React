import { CommandHanlder, HandleChatData } from "../types";
import Enum from "./Enum";
import { Player } from "./Internal";
import Utils from "./Utils";

export class Command {
    labels: string[];
    argFormats: CommandArg[];
    handler: CommandHanlder;
    isDevOnly = false;
    isAliveOnly = true;
    keyBinds: string[];
    defaultArgs: string[] = [];

    constructor(labels: string[], argFormats: CommandArg[], keyBinds: string[], 
        handler: (chatData: HandleChatData, player: Player, label: string, args: string[]) => void) {
        this.labels = labels;
        this.handler = handler;
        this.argFormats = argFormats;
        this.keyBinds = keyBinds;
    }

    handle(chat: HandleChatData, p: Player, label: string, args: string[]) {
        if(this.checkAvailable(p)) this.handler(chat, p, label, args);
    }

    setDevOnly(flag: boolean) {
        this.isDevOnly = flag;
        return this;
    }

    setDefaultArgs(values: string[]) {
        this.defaultArgs = values;
        return this;
    }

    setAliveOnly(flag: boolean) {
        this.isAliveOnly = flag;
        return this;
    }

    checkAvailable(player: Player) {

        if((this.isDevOnly && !player.isDev)) {
            player.sendMessage(Utils.coloredRich('red') + '개발자만 사용 가능한 명령어입니다.');
            return false;
        }

        if((this.isAliveOnly && !player.isAlive)) {
            player.sendMessage(Utils.coloredRich('red') + (
                player.isLoggedIn ?
                    '사망한 상태에선 사용할 수 없는 명령어입니다.': 
                    '로그아웃된 상태에선 사용할 수 없는 명령어입니다.'
            ));
            return false;
        }

        return true;
    }

    onMessage(chatData: HandleChatData, player: Player) {
        let msg = chatData.message;

        for(let keyBind of this.keyBinds) {
            if(msg.toLowerCase().startsWith(keyBind.toLowerCase() + ' ') || msg.toLowerCase() === keyBind.toLowerCase()) {
                msg = Utils.prefix + this.labels[0] + msg.slice(keyBind.length);
                break;
            }
        }

        let label = this.labels
            .filter(label => {
                let l = Utils.prefix + label;
                return msg.startsWith(l + ' ') || msg === l;
            })
            .reduce((a, b) => a.length > b.length ? a : b, '');
        if(label.length === 0) return;
        
        let argStr = msg.slice((Utils.prefix + label).length + 1);

        if(argStr.length === 0) {
            if(this.argFormats.length === 0) 
                this.handle(chatData, player, label, []);
        }
        else {
            let args = argStr.split(' ');
            let handleArgs: string[] = [];
            if(args.length < this.argFormats.length) {
                let needed = this.argFormats.length - args.length;
                if(this.defaultArgs.length >= needed)
                    args = args.concat(this.defaultArgs.slice(-needed));
                else return;
            }
            else if(args.length > this.argFormats.length && !this.argFormats.includes(CommandArg.STRING)) return;

            let pointer = 0;
            let invalidArg = false;

            this.argFormats.forEach((format, idx) => {
                if(invalidArg) return;
                switch(format) {
                    case CommandArg.INTEGER:
                        if(!/^-?[0-9]+$/.test(args[pointer])) {
                            invalidArg = true
                            return;
                        }
                        handleArgs.push(args[pointer]);
                        break;
                    case CommandArg.POSITIVE_INTEGER:
                        if(!/^[0-9]+$/.test(args[pointer])) {
                            invalidArg = true
                            return;
                        }
                        handleArgs.push(args[pointer]);
                        break;
                    case CommandArg.NUMBER:
                        if(!/^-?[0-9]+(.[0-9]+)?$/.test(args[pointer])) {
                            invalidArg = true
                            return;
                        }
                        handleArgs.push(args[pointer]);
                        break;
                    case CommandArg.WORD:
                        handleArgs.push(args[pointer]);
                        break;
                    case CommandArg.STRING:
                        let endIdx = pointer + args.length - this.argFormats.length + 1;
                        handleArgs.push(args.slice(pointer, endIdx).join(' '));
                        pointer = endIdx;
                        return;
                }
                ++pointer;
            });

            if(invalidArg) return;

            this.handle(chatData, player, label, handleArgs);
        }
    }
}

export class CommandArg extends Enum {

    static INTEGER = new CommandArg('integer', '[정수]');
    static POSITIVE_INTEGER = new CommandArg('positiveInteger', '[자연수]');
    static NUMBER = new CommandArg('number', '[수]');
    static WORD = new CommandArg('word', '[값]');
    static STRING = new CommandArg('string', '[문장]');

    formatStr: string;

    private constructor(name: string, formatStr: string) {
        super(name);
        this.formatStr = formatStr;
    }
}

export class CommandManager {
    
    private commandList: Command[];

    constructor(commandList: Command[]) {
        this.commandList = commandList;
    }

    registerCommand(command: Command) {
        this.commandList.push(command);
    }

    getCommands() {
        return this.commandList;
    }

    onMessage(chatData: HandleChatData, player: Player) {
        this.getCommands().forEach(cmd => {
            cmd.onMessage(chatData, player);
        })
    }

    getKeyBindsInfo(isDev: boolean = false) {
        return this.getCommands()
            .filter(cmd => !cmd.isDevOnly || isDev)
            .sort((a, b) => a.isDevOnly ? 1 : -1)
            .map(cmd => (
                `${cmd.isDevOnly ? '[DevOnly] ' : ''} ${Utils.prefix}${cmd.labels.join(' / ')}\n` +
                ` - ${cmd.keyBinds.map(bind => `[${bind}]`).join(' ')}`
            )).join('\n')
    }
}