import { ChatFlag, ClientChatData, MessageComponent } from "../../../types";
import { chat, ChatRoomManager } from "../../Internal";
import crypto from 'crypto';
import { ComponentBuilder, getRawText, isBlockTextComponent, isTextComponent } from "./ComponentBuilder";

export class ChatManager {
    static readonly chatExistanceSet = new Set<string>();

    static createChatId() {
        let uid;
        do {
            uid = crypto.randomUUID();
        } while (ChatManager.chatExistanceSet.has(uid));
        return uid;
    }

    static sendRawMessage(roomId: string, userId: string, name = 'Unknown', message = '',
        profile: string, flags?: ChatFlag[]) {
        const text = message.trimEnd();
        const comp = ComponentBuilder.message([ ComponentBuilder.text(text.slice(0, 500)) ]);
        if(text.length > 500) comp.children.push(ComponentBuilder.hidden([ 
            ComponentBuilder.text(text.slice(500)) 
        ]));

        return ChatManager.sendMessage(roomId, userId, name, comp, profile, flags);
    }

    static sendBotRawMessage(roomId: string, message: string) {
        return ChatManager.sendRawMessage(roomId, '{bot}', 'Lucadion', message, '/logo.png', ['bot']);
    }

    static sendBotMessage(roomId: string, message: MessageComponent) {
        return ChatManager.sendMessage(roomId, '{bot}', 'Lucadion', message, '/logo.png', ['bot']);
    }

    static sendMessage(roomId: string, userId: string, name: string, 
        message: MessageComponent,
        profile: string, flags?: ChatFlag[]): ClientChatData | null {
        const rawMessage = getRawText(message);
        if ((rawMessage.trim()?.length ?? 0) === 0 && isTextComponent(message) && !isBlockTextComponent(message)) return null;

        const uid = ChatManager.createChatId();
        const room = ChatRoomManager.getRoom(roomId);

        if (!room) return null;

        let chatData: ClientChatData = {
            room: roomId,
            senderName: name,
            date: Date.now(),
            message: message,
            profilePic: profile,
            chatId: uid,
            userId: userId,
            flags
        };
        room.addChat(chatData);
        if(chat.adapter.rooms.has(roomId)) chat.in(roomId).emit('chat', chatData);

        return chatData;
    }
}