import { CommandHanlder, HandleChatData } from "../../../types";
import Enum from "../../util/Enum";
import { Player, TimeFormat, Utils } from "../../Internal";
import { ComponentBuilder, getRawText, isTextComponent } from "../chat/ComponentBuilder";

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
            player.sendMessage(ComponentBuilder.embed([
                ComponentBuilder.text('개발자만 사용 가능한 명령어입니다.')
            ], 'red'));
            return false;
        }

        if ((this.isAliveOnly && !player.isAlive)) {
            player.sendMessage(ComponentBuilder.embed([
                ComponentBuilder.text(player.isLoggedIn ?
                    '사망한 상태에선 사용할 수 없는 명령어입니다.\n' +
                    `부활까지 ${new TimeFormat(player.deadTime * 1000)
                        .useUntilDays()
                        .format('d일 h시간 m분 s초')
                        .replace(/^0일 /, '')
                        .replace(/^0시간 /, '')
                        .replace(/^0분/, '')
                    } 남았습니다.` :
                    '로그아웃된 상태에선 사용할 수 없는 명령어입니다.')
            ], 'red'));
            return false;
        }

        return true;
    }

    onMessage(chatData: HandleChatData, player: Player) {
        let msg = getRawText(chatData.message);

        for(let keyBind of this.keyBinds) {
            if(msg.toLowerCase().startsWith(keyBind.toLowerCase() + ' ') || msg.toLowerCase() === keyBind.toLowerCase()) {
                msg = Utils.PREFIX + this.labels[0] + msg.slice(keyBind.length);
                break;
            }
        }

        let label = this.labels
            .filter(label => {
                let l = Utils.PREFIX + label;
                return msg.startsWith(l + ' ') || msg === l;
            })
            .reduce((a, b) => a.length > b.length ? a : b, '');
        if(label.length === 0) return;
        
        let argStr = msg.slice((Utils.PREFIX + label).length + 1);

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