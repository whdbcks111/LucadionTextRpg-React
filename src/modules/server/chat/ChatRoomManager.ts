import { ExtraObject } from '../../../types';
import { ChatManager, ChatRoom } from '../../Internal';
import { Utils } from '../../util/Utils';
import fs from 'graceful-fs';

const cache: { [key: string]: ChatRoom | undefined } = {};

export class ChatRoomManager {

    static rooms: ChatRoom[] = [];

    static getRoom(id: string) {
        return cache[id] ?? (cache[id] = ChatRoomManager.rooms.find(r => r.id === id));
    }

    static registerRoom(room: ChatRoom) {
        if(ChatRoomManager.getRoom(room.id)) return;
        ChatRoomManager.rooms.push(room);
        room.chatList.forEach(chat => ChatManager.chatExistanceSet.add(chat.chatId));
    }

    static toDataObj(): ExtraObject {
        return ChatRoomManager.rooms.map(r => r.toDataObj());
    }

    static loadAll() {
        let files = fs.readdirSync(Utils.SAVE_PATH + Utils.ROOMS_PATH);
        for(let file of files) {
            ChatRoom.loadRoom(file.split('.')[0]);
        }
        return true;
    }

    static async saveAll() {
        for(const r of ChatRoomManager.rooms) {
            await r.saveData();
        }
    }
}