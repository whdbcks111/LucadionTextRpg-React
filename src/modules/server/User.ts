import { ExtraObject, NullableString } from "../../types";
import { ChatRoomManager } from "./chat/ChatRoomManager";
import { Player, Utils } from "../Internal";
import { saveJson } from '../util/JsonDataBase';
import fs from 'graceful-fs';

const cache: { [key: string]: User | undefined } = {};
const tokenCache: { [key: string]: User | undefined } = {};

export class User {

    static users: User[] = [];

    readonly uid: string;
    salt: string;
    passwordHash: string;
    email: string;
    token: NullableString;
    tokenExpirationDate: number;
    profilePic: NullableString;
    currentRoom: string;
    muteExpirationDate = 0;

    constructor(uid: string, email: string, passwordHash: string, salt: string, 
        token: NullableString, tokenExpirationDate: number, profilePic: NullableString = null, currentRoom: NullableString = null) {
        this.uid = uid;
        this.salt = salt;
        this.email = email;
        this.passwordHash = passwordHash;
        this.token = token;
        this.tokenExpirationDate = tokenExpirationDate;
        this.profilePic = profilePic;
        this.currentRoom = currentRoom ?? uid;
    }

    mute(time: number) {
        this.muteExpirationDate = Date.now() + time * 1000;
    }

    joinRoom(id: string) {
        let room = ChatRoomManager.getRoom(id);
        if(room) room.users.add(this);
    }

    get rooms() {
        return ChatRoomManager.rooms.filter(r => r.isOpenRoom || r.users.has(this));
    }

    get room() {
        return ChatRoomManager.getRoom(this.currentRoom);
    }

    get player() {
        return Player.getPlayerByUid(this.uid);
    }

    toDataObj(): ExtraObject {
        return {
            ...this
        };
    }

    async saveData() {
        await saveJson(`${Utils.SAVE_PATH + Utils.USERS_PATH}${this.uid}.json`, 
            this.toDataObj());
    }

    static getUserByToken(token: string) {
        let cached = tokenCache[token];
        if(!cached || cached.token != token) 
            return tokenCache[token] = User.users.find(u => u.token === token);
        return cached;
    }

    static getUser(uid: string) {
        return cache[uid] ?? (cache[uid] = User.users.find(u => u.uid === uid));
    }

    static registerUser(user: User) {
        if(User.getUser(user.uid)) return;
        User.users.push(user);
    }

    static fromDataObj(data: ExtraObject) {
        if(!data) return null;
        return new User(data.uid, data.email, data.passwordHash, data.salt, 
            data.token, data.tokenExpirationDate, data.profilePic, data.currentRoom);
    }
    
    static loadUser(uid: string) {
        let data = fs.readFileSync(`${Utils.SAVE_PATH + Utils.USERS_PATH}${uid}.json`).toString();
        try {
            let newUser = User.fromDataObj(JSON.parse(data));
            if(newUser) User.registerUser(newUser);
        } catch(e) {
            console.log(data);
        }
    }

    static loadAll() {
        let files = fs.readdirSync(Utils.SAVE_PATH + Utils.USERS_PATH);
        for(let file of files) {
            User.loadUser(file.split('.')[0]);
        }
        return true;
    }

    static async saveAll() {
        for(const u of User.users) {
            await u.saveData();
        }
    }
}