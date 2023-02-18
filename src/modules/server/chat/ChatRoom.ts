import { ClientChatData, ExtraObject } from '../../../types';
import { chat, ChatManager, ChatRoomManager, User } from '../../Internal';
import { Utils } from '../../util/Utils';
import fs from 'graceful-fs';
 
export class ChatRoom {
    readonly id: string;
    name: string;
    chatList: ClientChatData[] = [];
    users: Set<User> = new Set();
    isOpenRoom = false;

    constructor(id: string, name: string, users: User[] = []) {
        this.id = id;
        this.name = name;
        users.forEach(u => this.users.add(u));
    }

    setOpenRoom() {
        this.isOpenRoom = true;
        return this;
    }

    addChat(chat: ClientChatData) {
        chat = { ...chat };
        if(!chat.userId.startsWith('{')) delete chat.profilePic;
        this.chatList.push(chat);
        ChatManager.chatExistanceSet.add(chat.chatId);

        if(this.chatList.length > 50) this.chatList = this.chatList.slice(-50);
    }

    removeChat(chatId: string) {
        this.removeChats([chatId]);
    }

    removeChats(chatIds: string[]) {
        let set = new Set(chatIds);
        this.chatList = this.chatList.filter(c => !set.has(c.chatId));
        chatIds.forEach(chatId => ChatManager.chatExistanceSet.delete(chatId));
        chat.in(this.id).emit('remove-chats', chatIds);
    }

    toDataObj(): ExtraObject {
        return {
            ...this,
            users: Array.from(this.users).map(u => u.uid)
        };
    }

    saveData() {
        fs.writeFile(`${Utils.SAVE_PATH}rooms/${this.id}.json`, JSON.stringify(this.toDataObj(), null, 4), () => {});
    }

    static fromDataObj(data: ExtraObject) {
        if(!data) return null;
        let newRoom = new ChatRoom(data.id ?? Utils.randomString(20), data.name ?? '');

        if(data.users) newRoom.users = new Set(data.users.map((uid: string) => User.getUser(uid)));
        if(data.chatList) newRoom.chatList = data.chatList;
        if(data.isOpenRoom) newRoom.isOpenRoom = data.isOpenRoom;

        return newRoom;
    }
    
    static loadRoom(id: string) {
        let data = fs.readFileSync(`${Utils.SAVE_PATH}rooms/${id}.json`).toString();
        let newRoom = ChatRoom.fromDataObj(JSON.parse(data));
        if(newRoom) ChatRoomManager.registerRoom(newRoom);
    }
}