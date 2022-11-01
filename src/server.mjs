import express from 'express';
import http from 'http';
import crypto from 'crypto';
import { Server } from 'socket.io';

const app = express();
const httpServer = http.createServer(app);
const PORT = 5555;

const socketServer = new Server(httpServer, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"]
	}
});

const chat = socketServer.of('/chat');
const chatExistance = new Set();
const chatList = [];
const clientMap = new Map();

httpServer.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});

chat.on('connection', client => {
    client.on('disconnect', () => {
        Object.keys(clientMap).forEach(uid => {
            if(clientMap[uid] === client) delete clientMap[uid];
        });
    });

    client.on('init', data => {
        if(!data?.user || clientMap[data.user.uid]) return;
        
        clientMap[data.user.uid] = client;
        client.emit('previous-chats', chatList.slice(-50));
        
        console.log(`client init! (${data.user.uid})`);
    });

    client.on('ping', data => {
        client.emit('pong', data);
    });

    client.on('chat', data => {
        if((data?.message?.trim()?.length ?? 0) === 0) return;

        let uid;
        do {
            uid = crypto.randomUUID();
        } while(chatExistance.has(uid));

        let chatData = {
            senderName: data.user?.name ?? (data.user?.email?.split('@') ?? [])[0],
            date: Date.now(),
            message: data.message.trimRight(),
            profilePic: data.user?.picture,
            uid: uid
        };
        chatList.push(chatData);
        chatExistance.add(uid);
        chat.emit('chat', chatData);
    });
});