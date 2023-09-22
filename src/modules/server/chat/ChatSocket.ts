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
import multer from 'multer';
import sharp from 'sharp'; 
import { createHash } from 'crypto';
import path from 'path';

export const SERVER_PORT = 5555;

const app = express();
const sessionMiddleware = session({
    secret: Utils.randomString(20),
    resave: false,
    saveUninitialized: true
});

const multerMiddleware = multer({
    dest: Utils.IMG_PATH
});

const httpsOptions = {
    key: fs.readFileSync('/etc/letsencrypt/live/lucadion.mcv.kr/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/lucadion.mcv.kr/fullchain.pem')
};

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(sessionMiddleware);
app.use(cors({
    origin: 'https://lucadion.mcv.kr',
    credentials: true
}));

app.use('/image', express.static(Utils.IMG_PATH));

app.use((req, res, next) => {
    if(!req.secure) res.redirect('https://lucadion.mcv.kr' + req.url);
    else next();
});

// app.get('/.well-known/pki-validation/D550874495D89E1F91429996335DCE64.txt', (req, res) => {
//     res.send(`80BEF2EAC0C5614E8260B9DF94C255A457E0C189A5BEB9DB6256CEB073FE3C42\ncomodoca.com\ndbea2c93e3c327d`);
// });

app.post('/upload_image', multerMiddleware.single('file'), (req, res) => {
    if(!req.file) return;
    let { fieldname, originalname, mimetype, destination, filename, path: oldPath, size } = req.file;

    const hash = createHash('md5');
    const readStream = fs.createReadStream(oldPath);
    const sendResult = (path: string) => {
        sharp(path).metadata().then(data => {
            res.json({
                data: filename,
                width: data.width,
                height: data.height
            });
        });
    }

    readStream.on('data', chunk => hash.update(chunk));
    readStream.on('end', () => {
        const newFileName = `${hash.digest('hex')}.${mimetype.split('/')[1] ?? 'png'}`;
        const newPath = path.join(destination, newFileName);
        if(fs.existsSync(newPath)) {
            fs.unlink(oldPath, () => {});
        }
        else {
            fs.renameSync(oldPath, newPath);
        }
        filename = newFileName;
        sendResult(newPath);
    })
});

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

app.listen(80, () => {
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
