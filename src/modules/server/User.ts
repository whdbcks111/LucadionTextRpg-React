import { ExtraObject, NullableString } from "../../types";
import fs from 'graceful-fs';
import { ChatRoomManager } from "./chat/ChatRoomManager";
import { Utils } from "../Internal";

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

    joinRoom(id: string) {
        let room = ChatRoomManager.getRoom(id);
        if(room) room.users.add(this);
    }

    get rooms() {
        return ChatRoomManager.rooms.filter(r => r.isOpenRoom || r.users.has(this));
    }

    toDataObj(): ExtraObject {
        return {
            ...this
        };
    }

    saveData() {
        fs.writeFile(`${Utils.SAVE_PATH}users/${this.uid}.json`, JSON.stringify(this.toDataObj(), null, 4), () => {});
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
        let data = fs.readFileSync(`${Utils.SAVE_PATH}users/${uid}.json`).toString();
        let newUser = User.fromDataObj(JSON.parse(data));
        if(newUser) User.registerUser(newUser);
    }

    static loadAll() {
        if(!fs.existsSync(Utils.SAVE_PATH + 'users/')) fs.mkdirSync(Utils.SAVE_PATH + 'users/', { recursive: true });
        let files = fs.readdirSync(Utils.SAVE_PATH + 'users/');
        for(let file of files) {
            User.loadUser(file.split('.')[0]);
        }
    }

    static saveAll() {
        const save = () => {
            if(!fs.existsSync(Utils.SAVE_PATH + 'users/')) fs.mkdirSync(Utils.SAVE_PATH + 'users/', { recursive: true });
            User.users.forEach(u => {
                u.saveData();
            })
        };

        if(!fs.existsSync(Utils.TMP_PATH)) fs.mkdirSync(Utils.TMP_PATH, { recursive: true });
        if(fs.existsSync(Utils.SAVE_PATH + 'users/')) fs.rename(Utils.SAVE_PATH + 'users/', Utils.TMP_PATH + 'users', err => {
            if(err) console.log(err);
            save();
        });
        else save();
    }
}