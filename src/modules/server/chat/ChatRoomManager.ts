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
        if(!fs.existsSync(Utils.SAVE_PATH + 'rooms/')) fs.mkdirSync(Utils.SAVE_PATH + 'rooms/', { recursive: true });
        let files = fs.readdirSync(Utils.SAVE_PATH + 'rooms/');
        for(let file of files) {
            ChatRoom.loadRoom(file.split('.')[0]);
        }
    }

    static saveAll() {
        const save = () => {
            if(!fs.existsSync(Utils.SAVE_PATH + 'rooms/')) fs.mkdirSync(Utils.SAVE_PATH + 'rooms/', { recursive: true });
            ChatRoomManager.rooms.forEach(r => {
                r.saveData();
            });
        }
        
        if(!fs.existsSync(Utils.TMP_PATH)) fs.mkdirSync(Utils.TMP_PATH, { recursive: true });
        if(fs.existsSync(Utils.SAVE_PATH + 'rooms/')) fs.rename(Utils.SAVE_PATH + 'rooms/', Utils.TMP_PATH + 'rooms', err => {
            if(err) console.log(err);
            save();
        });
        else save();
    }
}