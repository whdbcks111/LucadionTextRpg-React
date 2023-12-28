import { HandleChatData, MessageComponent } from "../../../types";
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

    getCommandsInfo(isDev = false): MessageComponent {
        let commands = [];
        let devCommands = [];

        for(let cmd of this.getCommands()) {
            if(!cmd.isDevOnly) commands.push(cmd);
            else devCommands.push(cmd);
        }

        if(isDev) commands = commands.concat(devCommands);

        return ComponentBuilder.embed([
            ComponentBuilder.texts([
                `- 모든 명령어는 앞에 ${Utils.PREFIX}를 붙여야 하며, 단축키의 경우에는 안 붙이고 사용 가능합니다.\n`,
                `예시) ${Utils.PREFIX}이동 5 또는 v 5\n`,
                `- 명령어의 인자 중 <>로 감싸진 것은 필수 인자, []로 감싸진 것은 선택적 인자입니다.\n\n`
            ]),
            ComponentBuilder.join(
                commands
                    .filter(cmd => !cmd.isDevOnly || isDev)
                    .map(cmd => ComponentBuilder.texts([

                        (cmd.isDevOnly ? ComponentBuilder.text('[DevOnly] ', { color: 'red' }) : ''),
                        ComponentBuilder.text(`${Utils.PREFIX + cmd.labels[0]}\n`, { color: Utils.MAIN_COLOR }),
                        (cmd.labels.length > 2 ? 
                            ComponentBuilder.texts([
                                `다음으로 대체 가능  `,
                                ComponentBuilder.text(cmd.labels.slice(1).map(l => Utils.PREFIX + l).join(' '), { color: 'lightgray' }),
                                `\n`
                            ])
                            : ''),
                        (cmd.keyBinds.length > 0 ?
                            ComponentBuilder.texts([
                                `단축키  `,
                                ComponentBuilder.join(cmd.keyBinds.map(bind =>
                                    ComponentBuilder.blockText(bind, {
                                        color: 'lightgray',
                                        border: '1px solid white',
                                        borderRadius: '3px',
                                        padding: '1px 4px',
                                        margin: '2px'
                                    })
                                ), ComponentBuilder.text(' ')),
                                `\n`
                            ])
                            : ''),
                        `사용법  `,
                        ComponentBuilder.text(`${Utils.PREFIX + cmd.labels[0]} `, { color: 'lightgray' }),
                        ComponentBuilder.join(
                            cmd.argFormats.map((f, i) => {
                                let content = `${f[1]}:${f[0].formatStr}`;
                                let isEssential = i < cmd.argFormats.length - cmd.defaultArgs.length;
                                return ComponentBuilder.texts([
                                    ComponentBuilder.text(isEssential ? '<' : '[', { color: 'white' }),
                                    ComponentBuilder.text(content, { color: 'gray' }),
                                    ComponentBuilder.text(isEssential ? '>' : ']', { color: 'white' }),
                                ]);
                            })
                        , ComponentBuilder.text(' ')),
                        `\n설명  `,
                        ComponentBuilder.text(cmd.description, { color: 'lightgray' })

                    ]))
                , ComponentBuilder.text('\n\n'))
        ]);
    }

    getKeyBindsInfo(isDev: boolean = false) {
        let commands = [];
        let devCommands = [];

        for(let cmd of this.getCommands()) {
            if(!cmd.isDevOnly) commands.push(cmd);
            else devCommands.push(cmd);
        }

        if(isDev) commands = commands.concat(devCommands);

        const duplicated = new Set<string>();

        return ComponentBuilder.embed([ComponentBuilder.join(
            commands
                .filter(cmd => {
                    const labels = cmd.labels.join('/');
                    const out = !duplicated.has(labels);
                    duplicated.add(labels);
                    return out;
                })
                .filter(cmd => !cmd.isDevOnly || isDev)
                .map(cmd => ComponentBuilder.message([
                    (cmd.isDevOnly ? ComponentBuilder.text('[DevOnly] ', { color: 'red' }) : ComponentBuilder.message([])),
                    ComponentBuilder.text(` ${cmd.labels.map(l => Utils.PREFIX + l).join(' ')}\n`),
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