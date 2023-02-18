import { HandleChatData } from "../../../types";
import { Command, Player, Utils } from "../../Internal";
import { ComponentBuilder } from "../chat/ComponentBuilder";

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

        const duplicated = new Set<string>();

        return ComponentBuilder.embed([ComponentBuilder.join(
            this.getCommands()
            .filter(cmd => {
                const labels = cmd.labels.join('/');
                const out = !duplicated.has(labels);
                duplicated.add(labels);
                return out;
            })
            .filter(cmd => !cmd.isDevOnly || isDev)
            .sort((a, b) => a.isDevOnly ? 1 : -1)
            .map(cmd => ComponentBuilder.message([
                (cmd.isDevOnly ? ComponentBuilder.text('[DevOnly] ', { color: 'red' }) : ComponentBuilder.message([])),
                ComponentBuilder.text(` ${Utils.PREFIX}${cmd.labels.join(' / ')}\n`),
                ComponentBuilder.join(cmd.keyBinds.map(bind => 
                        ComponentBuilder.blockText(bind, { 
                            color: 'lightgray', 
                            border: '1px solid white', 
                            borderRadius: '3px',
                            padding: '1px 4px',
                            margin: '2px'
                        })
                ), ComponentBuilder.text(' '))
            ]))
        , ComponentBuilder.text('\n\n'))]);
    }
}