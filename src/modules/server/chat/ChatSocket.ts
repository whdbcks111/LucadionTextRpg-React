import express from 'express';
import { Server } from 'socket.io';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import session, { Session, SessionData } from 'express-session';
import sharedSession from 'express-socket.io-session';
import { Utils } from '../../Internal';
import fs from 'graceful-fs';
import https from 'https';

export const SERVER_PORT = 5555;

const app = express();
const sessionMiddleware = session({
    secret: Utils.randomString(20),
    resave: false,
    saveUninitialized: true
});

const httpsOptions = {
    key: fs.readFileSync('./ssl/private.key'),
    cert: fs.readFileSync('./ssl/certificate.crt')
};

app.use((req, res, next) => {
    if(!req.secure) res.redirect('https://lucadion.mcv.kr' + req.url);
    else next();
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(sessionMiddleware);
app.use(cors({
    origin: 'https://lucadion.mcv.kr',
    credentials: true
}));

declare module 'express-session' {
    export interface SessionData {
        'auth-token': string
    }
}

declare module 'socket.io/dist/socket.js' {
    export interface Handshake {
        session: Session & Partial<SessionData>;
    }
}

const httpServer = app.listen(80, () => {
    console.log('[lucadion] Redirect server is running on 80');
});
const httpsServer = https.createServer(httpsOptions, app).listen(SERVER_PORT, () => {
    console.log(`[lucadion] Server is running on ${SERVER_PORT}`);
});

export const socketServer = new Server(httpsServer, {
	cors: {
		origin: 'https://lucadion.mcv.kr',
		methods: ['GET', 'POST']
	}
});

export const chat = socketServer.of('/chat');
chat.use(sharedSession(sessionMiddleware, { autoSave: true }));
