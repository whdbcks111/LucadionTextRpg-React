import express from 'express';
import http from 'http';
import crypto from 'crypto';
import { Server, Socket } from 'socket.io';
import Utils from './modules/Utils';
import fs, { cp } from 'fs';
import * as Rpg from './modules/Internal';
import { AttributeType, Command, CommandArg, CommandManager, EquipmentType, Item, Monster, Player, ShopState, ShopStateType, StatType, Time, Trade, TradeManager, TradeRequest, World, ZoneType } from './modules/Internal';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import session, { Session, SessionData } from 'express-session';
import nodemailer from 'nodemailer';
import sharedSession from 'express-socket.io-session';
import { ChatData, EmailAuthCodeMap, ExtraObject, HandleChatData, RoomMap, SendChatData, UserMap, NullableString, ClientChatOptions, ClientChatData } from './types';

Utils.importAll(Rpg, globalThis);

const mailTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'lucadionrpg@gmail.com',
        pass: fs.readFileSync('./private/smtp_pass.txt').toString()
    }
});

const emailAuthHtml = fs.readFileSync('./private/emailAuth.html').toString();

const app = express();
const sessionMiddleware = session({
    secret: '@lucadion__server__SECRET_KEY__@@',
    resave: false,
    saveUninitialized: true
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(sessionMiddleware);
app.use(cors({
    origin: 'http://lucadion.mcv.kr',
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

const PORT = 5555;
const httpServer = app.listen(PORT, () => {
    console.log(`[lucadion] Server is running on ${PORT}`);
});

const socketServer = new Server(httpServer, {
	cors: {
		origin: 'http://lucadion.mcv.kr',
		methods: ['GET', 'POST']
	}
});

const chat = socketServer.of('/chat');
chat.use(sharedSession(sessionMiddleware, { autoSave: true }));

const chatExistance = new Set();
const rooms: RoomMap = {
    'main-room': {
        chatList: []
    }
};
const clientMap = new Map<string, Socket>();
const users: UserMap = JSON.parse(fs.readFileSync('./private/users.json').toString());
const emailAuthCodes: EmailAuthCodeMap = {};
let authCode: NullableString = null;

const commandManager = new CommandManager([

    new Command(['?', '도움말', '명령어'], [], [], (chat, player, label, args) => {
        player.sendMessage('[ 아직 도움말이 없습니다. ]');
    }).setAliveOnly(false),

    new Command(['개발자 인증'], [], [], (chat, player, label, args) => {
        player.sendMessage('[ 콘솔에 인증번호를 전송하였습니다. 그대로 복사해서 입력해주세요. ]');
        authCode = Utils.randomString(30);
        console.log(authCode);
    }).setAliveOnly(false),

    new Command(['실행'], [CommandArg.STRING], ['exec'], (chat, player, label, args) => {
        try {
            let result = String(eval(args[0]));
            player.sendMessage(result.trim().length > 0 ? result : '(void)');
        }
        catch (e) {
            if(e instanceof Error) player.sendMessage(String(e.stack));
        }
    }).setDevOnly(true).setAliveOnly(false),

    new Command(['스테이터스'], [], ['s'], (chat, player, label, args) => {
        player.sendMessage(player.getStatusInfo());
    }),

    new Command(['로그인'], [], ['li', 'in'], (chat, player, label, args) => {
        if (player.isLoggedIn) {
            player.sendMessage('[ 이미 로그인 되어 있습니다. ]');
        }
        else {
            player.login();
            player.sendMessage('[ 로그인 되셨습니다. ]');
        }
    }).setAliveOnly(false),

    new Command(['로그아웃'], [], ['lo', 'ou'], (chat, player, label, args) => {
        if (!player.isLoggedIn) {
            player.sendMessage('[ 이미 로그아웃 되어 있습니다. ]');
        }
        else if (Date.now() - player.latestLoggedInTime < 1000 * 60) {
            player.sendMessage('[ 마지막으로 로그인 한 시점부터 1분이 지나야 다시 로그아웃이 가능합니다. ]');
        }
        else if (Date.now() - player.latestHitted < 1000 * 10) {
            player.sendMessage('[ 마지막으로 공격 받은 시점부터 10초가 지나야 로그아웃 가능합니다. ]');
        }
        else if (Date.now() - player.latestAttack < 1000 * 10) {
            player.sendMessage('[ 마지막으로 공격한 시점부터 10초가 지나야 로그아웃 가능합니다. ]');
        }
        else {
            player.logout();
            player.sendMessage('[ 로그아웃 되셨습니다. ]');
        }
    }).setAliveOnly(false),

    new Command(['퀘스트'], [], ['q'], (chat, player, label, args) => {
        player.sendMessage(player.getQuestsInfo());
    }),

    new Command(['맵'], [], ['m'], (chat, player, label, args) => {
        player.sendMessage(player.getLocation().getLocationInfo());
    }),

    new Command(['인벤토리'], [], ['i'], (chat, player, label, args) => {
        player.sendMessage(player.inventory.getContentsInfo());
    }),

    new Command(['인벤토리 정리'], [], ['ia'], (chat, player, label, args) => {
        player.inventory.arrangeContents();
        player.sendMessage('[ 인벤토리가 정리되었습니다. ]');
    }),

    new Command(['칭호 목록'], [], ['tl'], (chat, player, label, args) => {
        player.sendMessage(`[ 칭호 목록입니다. ]${Utils.rich}${Utils.blank}\n\n${player.getTitleListInfo()}`)
    }),

    new Command(['칭호 사용'], [CommandArg.INTEGER], ['tu'], (chat, player, label, args) => {
        let titleIdx = parseInt(args[0]) - 1;
        if (titleIdx in player.titles) {
            player.title = player.titles[titleIdx];
            player.sendMessage(`[ 사용중인 칭호를 [ ${player.title} ] (으)로 설정했습니다.`);
        }
        else player.sendMessage('[ 해당하는 칭호는 보유하고 있지 않습니다. ]');
    }),

    new Command(['단축키', '단축키 목록'], [], ['kb'], (chat, player, label, args) => {
        player.sendMessage(`[ 단축키 목록입니다. ]${Utils.blank}\n\n` +
            commandManager.getKeyBindsInfo());
    }),

    new Command(['상점', '상점 목록'], [], ['sh', 'z'], (chat, player, label, args) => {
        let loc = player.getLocation();
        if(loc.shop) {
            player.sendMessage(loc.shop.getShopInfo());
        }
        else {
            player.sendMessage('[ 이 장소는 상점이 아닙니다. ]');
        }
    }),

    new Command(['맵 플레이어'], [], ['mp'], (chat, player, label, args) => {
        let loc = player.getLocation();
        player.sendMessage('[ 맵 플레이어 목록 ]\n' + loc.getPlayersInfo());
    }),

    new Command(['맵 장소'], [], ['ml'], (chat, player, label, args) => {
        let loc = player.getLocation();
        player.sendMessage('[ 맵 갈 수 있는 장소 목록 ]\n' + loc.getMovableInfo());
    }),

    new Command(['스킬 목록'], [], ['sl'], (chat, player, label, args) => {
        if(player.skills.length === 0)
            player.sendMessage('[ 보유한 스킬이 없습니다. ]');
        else
            player.sendMessage(player.getSkillListInfo());
    }),

    new Command(['스킬 정보'], [CommandArg.STRING], ['si'], (chat, player, label, args) => {
        let skillName = args[0];
        let skill = player.getSkill(skillName);
        if (skill) {
            player.sendMessage(skill.getSkillInfo(player));
        }
        else {
            player.sendMessage('[ 해당하는 스킬을 보유하고 있지 않습니다. ]');
        }
    }),

    new Command(['구매'], [CommandArg.POSITIVE_INTEGER, CommandArg.POSITIVE_INTEGER], ['bu'], (chat, player, label, args) => {
        let location = player.getLocation();
        if (!location.shop) {
            player.sendMessage('[ 이 장소는 상점이 아닙니다. ]');
        }
        else {
            let index = parseInt(args[0]) - 1;
            let count = parseInt(args[1]);
            let state = location.shop.buyItem(player, index, count);
            if (state.state === ShopStateType.SUCCESS) {
                player.sendMessage('[ ' + location.shop.buyList[index].name + '(을)를 ' + state.extras.boughtCount + '개 만큼 구매했습니다. ]');
            }
            else if (state.state === ShopStateType.ITEM_NOT_FOUND) {
                player.sendMessage('[ 해당하는 아이템은 존재하지 않습니다. ]');
            }
            else if (state.state === ShopStateType.OUT_OF_STOCK) {
                player.sendMessage('[ 재고가 부족합니다. ]');
            }
            else if (state.state === ShopStateType.FULL_INVENTORY_SPACE) {
                player.sendMessage('[ 인벤토리가 꽉 차있습니다. ]');
            }
            else if (state.state === ShopStateType.GOLD_NOT_ENOUGH) {
                player.sendMessage('[ 골드가 부족합니다. ]');
            }
        }
    }).setDefaultArgs(['1']),

    new Command(['판매'], [CommandArg.POSITIVE_INTEGER, CommandArg.POSITIVE_INTEGER], ['se'], (chat, player, label, args) => {
        let location = player.getLocation();
        if (!location.shop) {
            player.sendMessage('[ 이 장소는 상점이 아닙니다. ]');
        }
        else {
            let index = parseInt(args[0]) - 1;
            let count = parseInt(args[1]);
            let state = location.shop.sellItem(player, index, count);
            if (state.state === ShopStateType.SUCCESS) {
                player.sendMessage('[ ' + location.shop.sellList[index].name + '(을)를 ' + state.extras.soldCount + '개 만큼 판매했습니다. ]\n' +
                    '(얻은 골드  ' + state.extras.earnedGold + 'G)');
            } else if (state.state === ShopStateType.ITEM_NOT_FOUND) {
                player.sendMessage('[ 해당하는 아이템은 존재하지 않습니다. ]');
            }
        }
    }).setDefaultArgs(['1']),

    new Command(['버리기'], [CommandArg.POSITIVE_INTEGER, CommandArg.POSITIVE_INTEGER], ['dr', 'q'], (chat, player, label, args) => {
        let index = parseInt(args[0]) - 1;
        let count = parseInt(args[1]);
        let result = player.dropItem(index, count);

        if (player.isUsingItem) {
            player.sendMessage('[ 아이템 사용 중일 때는 아이템을 버리실 수 없습니다. ]');
        }
        else if (result) {
            player.sendMessage('[ ' + result.item.getName() + '(을)를 ' + result.count + '개 버렸습니다. ]');
        }
        else player.sendMessage('[ 슬롯이 비어있습니다. ]')
    }).setDefaultArgs(['1']),

    new Command(['줍기'], [CommandArg.POSITIVE_INTEGER, CommandArg.POSITIVE_INTEGER], ['p', 'j'], (chat, player, label, args) => {
        let index = parseInt(args[0]) - 1;
        let count = parseInt(args[1]);
        let result = player.pickUpItem(index, count);

        if (result) {
            player.sendMessage('[ ' + result.item.getName() + '(을)를 ' + result.count + '개 주웠습니다. ]');
        }
        else player.sendMessage('[ 해당하는 떨어진 아이템이 존재하지 않습니다. ]')
    }).setDefaultArgs(['1']),

    new Command(['판매 전체'], [], ['sa'], (chat, player, label, args) => {
        let location = player.getLocation();
        if (!location.shop) {
            player.sendMessage('[ 이 장소는 상점이 아닙니다. ]');
        }
        else {
            player.sendMessage('[ 팔 수 있는 모든 아이템을 팔았습니다. ]\n' +
                '(얻은 골드  ' + location.shop.sellAllItem(player) + 'G)');
        }
    }),

    new Command(['스탯 분배'], [CommandArg.STRING, CommandArg.POSITIVE_INTEGER], ['st'], (chat, player, label, args) => {
        let count = parseInt(args[1]);
        let type = StatType.getByDisplayName(args[0]);
        if(!type) {
            player.sendMessage('[ 해당하는 스탯은 존재하지 않습니다. ]');
        }
        else if (player.statPoint < count) {
            player.sendMessage('[ 스탯 포인트가 부족합니다. ]');
        }
        else {
            player.stat.addStat(type, count);
            player.statPoint -= count;
            player.sendMessage('[ ' + args[0] + ' 스탯에 포인트를 ' + count + '만큼 분배하였습니다. ]');
        }
    }).setDefaultArgs(['1']),

    new Command(['제작법'], [], ['cl'], (chat, player, label, args) => {
        player.sendMessage(`[ 잠금 해제된 제작법 목록입니다. ]${Utils.blank}\n\n` +
            player.getUnlockedRecipesInfo());
    }),

    new Command(['장착 해제'], [CommandArg.STRING], ['dm'], (chat, player, label, args) => {
        let slotName = args[0];
        let type = EquipmentType.getByDisplayName(slotName);
        if (type) {
            let item = player.slot.getItem(type);
            if(item) {
                player.inventory.addItem(item);
                player.slot.setItem(type, null);
                player.sendMessage('[ 장착을 해제했습니다. ]');
            }
            else player.sendMessage('[ 이미 비어있는 슬롯입니다. ]');
        }
        else player.sendMessage('[ 해당하는 이름의 슬롯은 없습니다. ]');
    }),

    new Command(['제작'], [CommandArg.STRING], ['cr'], (chat, player, label, args) => {
        let lastWord = args[0].split(' ').slice(-1)[0];
        let hasCount = /^[0-9]+$/.test(lastWord);
        let count = hasCount ? parseInt(lastWord) : 1;
        let recipeName = hasCount ? args[0].split(' ').slice(0, -1).join(' ') : args[0];
        let recipe = player.getUnlockedRecipes().find(r => r.name === recipeName);

        if (recipe) {
            if (recipe.canCraft(player)) {
                let createdCount = recipe.craft(player, count);
                player.sendMessage('[ ' + recipeName + ' 의 제작을 ' + (hasCount ? createdCount + '회 ' : '') + '완료했습니다! ]');
            }
            else player.sendMessage('[ 제작 조건을 충족하지 못했습니다 : ' + recipe.getRecipeInfo());
        }
        else player.sendMessage('[ 잠금 해제된 제작법 중에 해당하는 제작법은 존재하지 않습니다. ]');
    }),

    new Command(['사용'], [CommandArg.POSITIVE_INTEGER], ['u'], (chat, player, label, args) => {
        let slotIndex = parseInt(args[0]) - 1;
        let itemStack = player.inventory.getItemStack(slotIndex);
        if (!player.canUseItem) {
            player.sendMessage('[ ' + (player.cannotUseItemMessage || '아이템을 사용할 수 없는 상태입니다.') + ' ]');
        }
        else if (player.isUsingItem) {
            player.sendMessage('[ 아직 아이템을 사용 중입니다. ]');
        }
        else if (!itemStack) {
            player.sendMessage('[ 슬롯이 비어 있습니다. ]');
        }
        else if (itemStack.item.requiredLevel && player.level < itemStack.item.requiredLevel) {
            player.sendMessage('[ 필요 레벨이 충족되지 않았습니다. (' + itemStack.item.requiredLevel + '레벨) ]');
        }
        else if (!itemStack.item.canUse) {
            player.sendMessage('[ 사용할 수 없는 아이템입니다. ]');
        }
        else {
            player.sendMessage('[ ' + itemStack.item.getDisplayName(true) + '(을)를 사용했습니다. ]');
            player.inventory.useItem(slotIndex);
        }
    }),

    new Command(['대화'], [CommandArg.POSITIVE_INTEGER], ['t'], (chat, player, label, args) => {
        let location = player.getLocation();
        let npcIndex = parseInt(args[0]) - 1;
        let npc = location.npcs[npcIndex];
        if (!npc) {
            player.sendMessage('[ 해당하는 NPC가 존재하지 않습니다. ]');
        }
        else if (npc.isTalking) {
            player.sendMessage('[ 다른 사람과 이미 대화 중입니다. ]');
        }
        else {
            npc.start(player);
        }
    }),

    new Command(['대화선택'], [CommandArg.POSITIVE_INTEGER], ['cc'], (chat, player, label, args) => {
        let location = player.getLocation();
        let index = parseInt(args[0]) - 1;
        let npc = location.npcs.find(o => o.target === player);
        if (!npc) {
            player.sendMessage('[ 대화중인 NPC가 존재하지 않습니다. ]');
        }
        else if (!npc.choose(index)) {
            player.sendMessage('[ 해당하는 선택지가 없습니다. ]');
        }
    }),

    new Command(['확인'], [CommandArg.POSITIVE_INTEGER], ['f', 'ck'], (chat, player, label, args) => {
        let location = player.getLocation();
        let index = parseInt(args[0]) - 1;
        let terrain = location.terrains[index];
        if (!terrain) {
            player.sendMessage('[ 해당하는 지형이 존재하지 않습니다. ]');
        }
        else if (terrain.isAlreadyChecked) {
            player.sendMessage('[ 이미 확인된 지형입니다. ]');
        }
        else {
            terrain.check(player);
        }
    }),

    new Command(['감정'], [CommandArg.STRING], ['iid'], (chat, player, label, args) => {
        let item: Item | null = null;

        let slotIndex = parseInt(args[0]) - 1;
        let itemStack = player.inventory.getItemStack(slotIndex);
        let type = EquipmentType.getByDisplayName(args[0]);

        if (type) item = player.slot.getItem(type);
        else if (itemStack) item = itemStack.item;

        if (!item) {
            player.sendMessage('[ 해당하는 아이템은 존재하지 않습니다. ]');
        }
        else {
            player.sendMessage(item.getInfo());
        }
    }),

    new Command(['낚시'], [], ['fs'], (chat, player, label, args) => {
        player.fish()
    }),

    new Command(['당기기'], [], ['fp'], (chat, player, label, args) => {
        player.pullFish();
    }),

    new Command(['공격'], [CommandArg.POSITIVE_INTEGER], ['a'], (chat, player, label, args) => {
        let location = player.getLocation();
        let index = parseInt(args[0]) - 1;
        let object = location.objects[index];
        if (!object)
            player.sendMessage('[ 해당하는 번호의 오브젝트는 존재하지 않습니다. ]');
        else if (object.deadTime > 0 || object.life <= 0) {
            let deadMessage = object instanceof Monster ? '죽어있는 몬스터' : '파괴된 오브젝트';
            player.sendMessage('[ 이미 ' + deadMessage + '입니다. ]');
        }
        else if (object instanceof Monster
            && !Array.from(object.targets).some(p => p instanceof Player && p.getPartyOwner() === player.getPartyOwner()) && object.targets.size > 0) {
            player.sendMessage('[ 다른 파티가 이미 싸우고 있습니다. ]');
        }
        else {
            player.attack(object);
        }
    }),

    new Command(['공격'], [], ['a'], (chat, player, label, args) => {
        if (player.currentTarget && player.currentTarget.isAlive) {
            let location = player.getLocation();
            let object = player.currentTarget;
            if (object instanceof Monster &&
                !Array.from(object.targets)
                    .some(p => p instanceof Player && p.getPartyOwner() === player.getPartyOwner()) &&
                object.targets.size > 0
            ) {
                player.sendMessage('[ 다른 파티가 이미 싸우고 있습니다. ]');
            }
            else if (object instanceof Player && location.zoneType === ZoneType.PEACEFUL) {
                player.sendMessage('[ 평화지역에서는 싸울 수 없습니다. ]');
            }
            else {
                player.attack(object);
            }
        }
    }),

    new Command(['공격p'], [CommandArg.POSITIVE_INTEGER], ['ap'], (chat, player, label, args) => {
        let location = player.getLocation();
        if (location.zoneType === ZoneType.PEACEFUL) {
            player.sendMessage('[ 평화지역에서는 싸울 수 없습니다. ]');
        }
        else {
            let index = parseInt(args[0]) - 1;
            let object = location.getPlayers()[index];
            if (!object)
                player.sendMessage('[ 해당하는 번호의 플레이어는 존재하지 않습니다. ]');
            else player.attack(object); 
        }
    }),

    new Command(['파티 초대'], [CommandArg.POSITIVE_INTEGER], ['pi'], (chat, player, label, args) => {
        let location = player.getLocation();
        let index = parseInt(args[0]) - 1;
        let target = location.getPlayers()[index];
        if (player.partyOwner)
            player.sendMessage('[ 당신은 이미 다른 파티에 참가되어 있습니다. ]');
        else if (!target)
            player.sendMessage('[ 해당하는 번호의 플레이어는 존재하지 않습니다. ]');
        else if (target === player)
            player.sendMessage('[ 자신한텐 초대를 보낼 수 없습니다. ]');
        else if (target.partyOwner)
            player.sendMessage(`[ ${target.getName()}님은 이미 다른 파티에 있습니다. ]`);
        else if (target.partyMembers.length > 0)
            player.sendMessage(`[ ${target.getName()}님은 이미 다른 파티에 있습니다. ]`);
        else if (target.partyInviteRequest)
            player.sendMessage(`[ ${target.getName()}님은 이미 초대를 받으신 상태입니다. ]`);
        else {
            player.inviteParty(target, 30);
            player.sendMessage(`[ ${target.getName()}님에게 파티 초대를 보냈숩니다. ]\n` +
                Utils.prefix + '파티 수락 을 통해 수락하거나,\n' +
                Utils.prefix + '파티 거절 을 통해 거절해주세요.\n' +
                '30초 후에 만료됩니다.');
        }
    }),

    new Command(['파티 수락'], [], ['pa'], (chat, player, label, args) => {
        if (player.partyInviteRequest) {
            player.acceptPartyInvite();
            player.sendMessage('[ ' + player.getPartyOwner().getName() + '님의 파티에 참가되셨습니다. ]');
        }
        else player.sendMessage('[ 받은 파티 요청이 없습니다. ]');
    }),

    new Command(['파티 거절'], [], ['pd'], (chat, player, label, args) => {
        if (player.partyInviteRequest) {
            player.denyPartyInvite();
            player.sendMessage('[ 파티 요청을 거절하셨습니다. ]');
        }
        else player.sendMessage('[ 받은 파티 요청이 없습니다. ]');
    }),

    new Command(['파티 퇴장'], [], ['pl'], (chat, player, label, args) => {
        if(player.partyOwner) {
          player.sendMessage('[ 파티를 떠나셨습니다. ]');
          if(player.getPartyOwner().latestRoomName !== player.latestRoomName)
            player.getPartyOwner().sendMessage('[ ' + player.getName() + '님이 파티를 떠나셨습니다. ]');
          player.leaveParty();
        }
        else player.sendMessage('[ 당신은 파티 멤버가 아닙니다. ]');
    }),

    new Command(['파티 추방'], [CommandArg.POSITIVE_INTEGER], ['pk'], (chat, player, label, args) => {
        if (!player.partyOwner) {
            let index = parseInt(args[0]) - 1;
            let kicked = player.kickPartyMember(index);
            if (kicked) {
                player.sendMessage(`[ ${kicked.getName()}님을 파티에서 추방시켰습니다. ]`);
            }
            else {
                player.sendMessage('[ 해당하는 번호의 파티 멤버는 없습니다. ]');
            }
        }
        else player.sendMessage('[ 당신은 파티장이 아닙니다. ]');
    }),

    new Command(['파티 해산'], [], ['pr'], (chat, player, label, args) => {
        if(!player.partyOwner) {
            if(player.partyMembers.length <= 0) {
              player.sendMessage('[ 파티에 멤버가 없습니다. ]');
            }
            else {
              player.dissolveParty();
              player.sendMessage('[ 파티를 해산시켰습니다. ]');
            }
          }
          else player.sendMessage('[ 당신은 파티장이 아닙니다. ]');
    }),

    new Command(['파티 정보'], [], ['pt'], (chat, player, label, args) => {
        player.sendMessage(player.getPartyInfo());
    }),

    new Command(['대상지정'], [CommandArg.POSITIVE_INTEGER], ['tg'], (chat, player, label, args) => {
        let location = player.getLocation();
        let index = parseInt(args[0]) - 1;
        let object = location.objects[index];
        if (!object)
            player.sendMessage('[ 해당하는 번호의 오브젝트는 존재하지 않습니다. ]');
        else if (object instanceof Monster && 
            !Array.from(object.targets)
                .some(p => p instanceof Player && p.getPartyOwner() === player.getPartyOwner()) && 
            object.targets.size > 0
        ) {
            player.sendMessage('[ 다른 파티가 이미 싸우고 있습니다. ]');
        }
        else if (object.deadTime > 0 || object.life <= 0) {
            let deadMessage = object instanceof Monster ? '죽어있는 몬스터' : '파괴된 오브젝트';
            player.sendMessage('[ 이미 ' + deadMessage + '입니다. ]');
        }
        else {
            player.currentTarget = object;
            player.sendMessage('[ 대상을 ' + object.getName() + '(으)로 지정했습니다. ]')
        }
    }),

    new Command(['대상지정p'], [CommandArg.POSITIVE_INTEGER], ['tgp'], (chat, player, label, args) => {
        let location = player.getLocation();
        let index = parseInt(args[0]) - 1;
        let object = location.getPlayers()[index];
        if (!object)
            player.sendMessage('[ 해당하는 번호의 플레이어는 존재하지 않습니다. ]');
        else {
            player.currentTarget = object;
            player.sendMessage('[ 대상을 ' + object.getName() + '님으로 지정했습니다. ]')
        }
    }),

    new Command(['거래 요청'], [CommandArg.POSITIVE_INTEGER], ['tr'], (chat, player, label, args) => {
        let location = player.getLocation();
        let index = parseInt(args[0]) - 1;
        let target = location.getPlayers()[index];
        if (!target)
            player.sendMessage('[ 해당하는 번호의 플레이어는 존재하지 않습니다. ]');
        else if (target === player)
            player.sendMessage('[ 자신과는 거래할 수 없습니다. ]');
        else {
            TradeManager.requestTrade(player, target);
            Player.sendGroupMessage([player, target], 
                `[ ${player.getName()}님이 ${target.getName()}님에게 거래 요청을 보냈습니다. ]\n` +
                `수락하시려면 ${Utils.prefix}거래 수락, 거절하시려면 ${Utils.prefix}거래 거절 을 입력해주세요.\n` +
                TradeRequest.DEFAULT_REMAIN_TIME.toFixed(0) + '초 후에 만료됩니다.');
        }
    }),

    new Command(['거래 거절'], [], ['td'], (chat, player, label, args) => {
        let request = TradeManager.getRequestTo(player);
        if(!request)
          player.sendMessage('[ 받은 거래 요청이 없습니다. ]');
        else {
          request.deny();
          player.sendMessage('[ 거래가 거절되었습니다. ]');
        }
    }),

    new Command(['거래 수락'], [], ['ta'], (chat, player, label, args) => {
        let request = TradeManager.getRequestTo(player);
        if(!request)
          player.sendMessage('[ 받은 거래 요청이 없습니다. ]');
        else {
          let trade = request.accept();
          Player.sendGroupMessage([trade.player1.player, trade.player2.player], 
            `[ ${trade.player1.player.getName()}님과 ${trade.player2.player.getName()}님의 거래가 시작되었습니다. ]\n` +
            `자세한 설명을 보시려면 전체보기를 눌러주세요.${Utils.blank}\n\n` +
            `거래할 아이템을 추가하시려면 ${Utils.prefix}거래 아이템추가 [ 슬롯번호 ] [ 개수 ]\n` +
            `추가한 아이템을 회수하시려면 ${Utils.prefix}거래 아이템회수 [ 슬롯번호 ] [ 개수 ]\n` +
            `골드를 추가하시려면 ${Utils.prefix}거래 골드추가 [ 수량 ]\n` +
            `추가한 골드를 회수하시려면 ${Utils.prefix}거래 골드회수 [ 수량 ]\n\n` +
            `거래를 취소하시려면 ${Utils.prefix}거래 취소\n` +
            `거래 내용을 확인하시려면 ${Utils.prefix}거래 확인을, ` +
            `확인을 취소하시려면 ${Utils.prefix}거래 확인취소를 입력하되,\n` +
            `한 명이라도 확인을 한 상태면 더이상 아이템과 골드를 회수는 불가능하고 추가만 가능하며, ` +
            `두 명 모두 거래를 확인하면 최종적으로 거래가 성사되고 거래가 종료됩니다.\n` +
            `또한 한 명이 로그아웃 또는 사망하거나 서로 장소가 달라지면 거래가 자동으로 취소됩니다.`);
        }
    }),

    new Command(['거래 아이템추가'], [CommandArg.POSITIVE_INTEGER, CommandArg.POSITIVE_INTEGER], ['tia'],
        (chat, player, label, args) => {
            let trade = TradeManager.getTrade(player);
            if (!trade)
                player.sendMessage('[ 거래가 시작되지 않았습니다. ]');
            else {
                let slotIdx = parseInt(args[0]) - 1;
                let count = parseInt(args[1]);
                let tradePlayer = trade.player1.player === player ? trade.player1 : trade.player2;
                let result = tradePlayer.addItem(slotIdx, count);
                if (result)
                    Player.sendGroupMessage([trade.player1.player, trade.player2.player], trade.getTradeInfo());
                else
                    player.sendMessage('[ 빈 슬롯입니다. ]');
            }
        }
    ).setDefaultArgs(['1']),

    new Command(['거래 취소'], [], ['tce'], (chat, player, label, args) => {
        let trade = TradeManager.getTrade(player);
        if (!trade)
            player.sendMessage('[ 거래가 시작되지 않았습니다. ]');
        else {
            trade.cancel();
            Player.sendGroupMessage([trade.player1.player, trade.player2.player], '[ 거래가 취소되었습니다. ]');
        }
    }),

    new Command(['거래 확인'], [], ['tc', 'tcf'], (chat, player, label, args) => {
        let trade = TradeManager.getTrade(player);
        if(!trade)
          player.sendMessage('[ 거래가 시작되지 않았습니다. ]');
        else {
          let tradePlayer = trade.player1.player === player ? trade.player1 : trade.player2;
          if(tradePlayer.hasConfirmed) {
            player.sendMessage('[ 이미 확인된 상태입니다. ]');
          }
          else {
            tradePlayer.hasConfirmed = true;
            Player.sendGroupMessage([trade.player1.player, trade.player2.player], 
                `[ ${player.getName()}님이 거래 내용을 확인하셨습니다. ]`);
          }
        }
    }),

    new Command(['거래 확인취소'], [], ['tcc'], (chat, player, label, args) => {
        let trade = TradeManager.getTrade(player);
        if(!trade)
          player.sendMessage('[ 거래가 시작되지 않았습니다. ]');
        else {
          let tradePlayer = trade.player1.player === player ? trade.player1 : trade.player2;
          if(!tradePlayer.hasConfirmed) {
            player.sendMessage('[ 이미 확인을 하지 않은 상태입니다. ]');
          }
          else {
            tradePlayer.hasConfirmed = false;
            Player.sendGroupMessage([trade.player1.player, trade.player2.player], 
                `[ ${player.getName()}님이 거래 내용 확인을 철회하셨습니다. ]`);
          }
        }
    }),

    new Command(['거래 아이템회수'], [CommandArg.POSITIVE_INTEGER, CommandArg.POSITIVE_INTEGER], ['tis'], (chat, player, label, args) => {
        let trade = TradeManager.getTrade(player);
        if (!trade)
            player.sendMessage('[ 거래가 시작되지 않았습니다. ]');
        else if (trade.player1.hasConfirmed || trade.player2.hasConfirmed)
            player.sendMessage('[ 한 명이 이미 확인한 거래이므로 아이템 회수가 불가능합니다.');
        else {
            let slotIdx = parseInt(args[0]) - 1;
            let count = parseInt(args[1]);
            let tradePlayer = trade.player1.player === player ? trade.player1 : trade.player2;
            let result = tradePlayer.subtractItem(slotIdx, count);
            if (result)
                Player.sendGroupMessage([trade.player1.player, trade.player2.player], trade.getTradeInfo());
            else
                player.sendMessage('[ 존재하지 않는 슬롯 번호입니다. ]');
        }
    }).setDefaultArgs(['1']),

    new Command(['거래 골드추가'], [CommandArg.POSITIVE_INTEGER], ['tga'], (chat, player, label, args) => {
        let trade = TradeManager.getTrade(player);
        if (!trade)
            player.sendMessage('[ 거래가 시작되지 않았습니다. ]');
        else {
            let amount = parseInt(args[2]);
            let tradePlayer = trade.player1.player === player ? trade.player1 : trade.player2;
            let result = tradePlayer.addGold(amount);
            if (result)
                Player.sendGroupMessage([trade.player1.player, trade.player2.player], trade.getTradeInfo());
            else
                player.sendMessage('[ 골드가 부족합니다. ]');
        }
    }),

    new Command(['거래 골드회수'], [CommandArg.POSITIVE_INTEGER], ['tgs'], (chat, player, label, args) => {
        let trade = TradeManager.getTrade(player);
        if (!trade)
            player.sendMessage('[ 거래가 시작되지 않았습니다. ]');
        else if (trade.player1.hasConfirmed || trade.player2.hasConfirmed)
            player.sendMessage('[ 한 명이 이미 확인한 거래이므로 골드 회수가 불가능합니다.');
        else {
            let amount = parseInt(args[2]);
            let tradePlayer = trade.player1.player === player ? trade.player1 : trade.player2;
            let result = tradePlayer.subtractGold(amount);
            if (result)
                Player.sendGroupMessage([trade.player1.player, trade.player2.player], trade.getTradeInfo());
            else
                player.sendMessage('[ 회수할 골드가 없습니다. ]');
        }
    }),

    new Command(['이동'], [CommandArg.POSITIVE_INTEGER], ['mv', 'v', 'go'], (chat, player, label, args) => {
        let location = player.getLocation();
        let index = parseInt(args[0]) - 1;
        let locationName = location.movables[index];
        if (!player.canMove || !player.canWorldMove) {
            player.sendMessage('[ ' + (player.cannotMoveMessage || '이동할 수 없는 상태입니다.') + ' ]');
        }
        else if (!locationName) {
            player.sendMessage('[ 해당하는 장소는 존재하지 않습니다. ]');
        }
        else if (!player.moveTarget) {
            let to = World.getLocation(locationName);
            player.sendMessage(`[ ${locationName}으로 이동하는 중.. ]\n` +
                `(거리 : ${location.getDistance(to).toFixed(1)}m  ` +
                `예상 소요시간 : ${location.getMoveTime(to, 
                    player.attribute.getValue(AttributeType.MOVE_SPEED)).toFixed(1)}초)`);
            player.move(to.name);
        }
        else {
            player.sendMessage('[ 이미 이동중입니다. ]');
        }
    })
]);

Player.loadAll();

setInterval(() => {
    try {
        Time.update();
    }
    catch(e) {
        console.error(e);
    }
}, 100);

setInterval(() => {
    saveUsers();
}, 1000 * 10);

setInterval(() => {
    Player.saveAll();
}, Player.saveInterval);

function saveUsers() {
    fs.writeFile('./private/users.json', JSON.stringify(users, null, 4), () => {});
}

function sendMail(to: string, subject: string, contentHtml: string) {
    let info = mailTransport.sendMail({
        from: `"Lucadion RPG" <lucadionrpg@gmail.com>`,
        to: to,
        subject: '[Lucadion RPG] ' + subject,
        html: contentHtml
    });
    return info;
}

app.post('/emailAuth', (req, res) => {
    let data = req.body;

    let authCode = Utils.randomString(8);
    // email send;
    sendMail(data.email, '회원가입 인증 코드입니다.', emailAuthHtml.replace('{{code}}', authCode));

    emailAuthCodes[data.email] = {
        code: authCode,
        expirationDate: Date.now() + 1000 * 60 * 5
    };
});

app.get('/auth', (req, res) => {
    if(!req.session['auth-token']) return res.json({ success: false });

    let token = req.session['auth-token'];
    console.log(req.session.id + ' auth');
    
    let user = null;
    for(let uid in users) {
        if(users[uid].token === token && Date.now() < users[uid].tokenExpirationDate) {
            user = users[uid];
            break;
        }
    }
    
    if(!user) return res.json({ success: false });
    else return res.json({ success: true });
});

app.post('/login', (req, res) => {
    let data = req.body;

    let user = null;
    for(let uid in users) {
        if(users[uid].email === data.email) {
            user = users[uid];
            break;
        }
    }

    if(!user) {
        return res.json({
            success: false,
            message: '유저가 존재하지 않습니다.'
        });
    }
    if (crypto.createHash('sha512')
        .update(data.password + user.salt)
        .digest('base64') !== user.passwordHash) {
        return res.json({
            success: false,
            message: '비밀번호가 일치하지 않습니다.'
        });
    }

    user.token = Utils.randomString(30);
    user.tokenExpirationDate = Date.now() + 1000 * 60 * 60 * 12;

    req.session['auth-token'] = user.token;
    req.session.save();

    console.log(req.session);

    res.status(200).json({ success: true });
});

app.post('/register', (req, res) => {
    let data = req.body;

    if(!emailAuthCodes[data.email]) {
        return res.json({
            success: false,
            message: '인증번호가 발송되지 않았습니다.'
        });
    }
    if(emailAuthCodes[data.email].code !== data.emailAuthCode) {
        return res.json({
            success: false,
            message: '인증번호가 일치하지 않습니다.'
        });
    }
    if(emailAuthCodes[data.email].expirationDate < Date.now()) {
        return res.json({
            success: false,
            message: '인증 기간이 만료되었습니다.'
        });
    }

    for(let uid in users) {
        if(users[uid].email === data.email) {
            return res.json({
                success: false,
                message: '이미 가입된 이메일입니다.'
            });
        }
    }

    for(let player of Player.players) {
        if(player.name === data.nickname) {
            return res.json({
                success: false,
                message: '이미 사용중인 닉네임입니다.'
            });
        }
    }

    let uid;
    do { uid = crypto.randomUUID(); } while(uid in users); 
    let salt = Utils.randomString(20);

    let newUser = {
        uid,
        salt,
        passwordHash: crypto.createHash('sha512').update(data.password + salt).digest('base64'),
        email: data.email,
        token: null,
        tokenExpirationDate: 0
    };

    Player.addPlayer(new Player(uid, data.nickname));
    users[uid] = newUser;
    saveUsers();
    Player.saveAll();

    res.status(200).json({ success: true });
});

app.post('/token', (req, res) => {
    let data = req.body;
    let client = chat.sockets.get(data.id);
    if(!client) {
        return;
    }
    client.handshake.session['auth-token'] = req.session['auth-token'];
});

chat.on('connection', client => {

    
    console.log(client.handshake.session.id + 'socket conn');

    function checkToken() {
        if(!client.handshake.session['auth-token']) 
            client.emit('token-require', client.id);
    }
    checkToken();

    let getUser = () => users[Object.keys(users)
        .find(uid => users[uid].token === client.handshake.session['auth-token']) ?? ''];

    client.join('main-room');

    console.log(`[lucadion] client connected: (${client.id})`);

    client.on('disconnect', () => {
        Object.keys(clientMap).forEach(uid => {
            if (clientMap.get(uid) === client) clientMap.delete(uid);
        });
    });

    client.on('previous-chats', () => {
        client.emit('previous-chats', rooms['main-room'].chatList.slice(-50));
    });

    client.on('ping', () => {
        checkToken();
        let user = getUser();
        let player = Player.getPlayerByUid(user?.uid);
        if(player) player.latestPing = Date.now();
    });
 
    client.on('chat', (data: ChatData) => {
        let user = getUser();
        if(!user) {
            checkToken();
            return;
        }
        let player = Player.getPlayerByUid(user?.uid);
        let chatData = sendMessage(data.room,
            player?.name ?? 'unnamed',
            String(data.message), user?.profilePic);
        if(!chatData) return;
        handleMessage({ ...chatData, user, client });
    }); 
});

function createChatUid() {
    let uid;
    do {
        uid = crypto.randomUUID();
    } while (chatExistance.has(uid));
    return uid;
}

function handleMessage(chatData: HandleChatData) {
    let { room, senderName, date, message, profilePic, chatId, user, client } = chatData;
    try {
        let userId = user?.uid;
        let player = Player.getPlayerByUid(userId);
        if(!player) return;

        player.latestRoomName = room;
        player.onChat(message);

        if (message === authCode) {
            authCode = null;
            fs.writeFile('./private/devUUID.txt', userId, () => { });
            sendBotMessage(room, '[ 인증되었습니다. ]');
        }

        commandManager.onMessage(chatData, player);
    }
    catch (e) {
        console.error(e);
        client.emit('reload');
    }
}

function sendMessage(room = 'main-room', name = 'Unknown', message = '',
    profile: string | undefined, extras: ClientChatOptions = {}): SendChatData | null {
    if ((message?.trim()?.length ?? 0) === 0) return null;

    let uid = createChatUid();

    if (!(room in rooms) || !chat.adapter.rooms.has(room)) return null;
    message = message.trimEnd();

    if (message.length > 600) {
        message = message.slice(0, 500) + Utils.blank + message.slice(500);
    }

    if(message.includes(Utils.blank)) {
        let spl = message.split(Utils.blank);
        extras.fullMessage = spl.join('');
        message = spl[0];
    }

    let richMatches = message.match(Utils.richRegex);
    if(richMatches) {
        let rich = richMatches[0];
        let spl = message.split(rich);
        message = spl.slice(1).join('');
        extras.isRich = true;
        extras.title = spl[0];
        extras.richColor = Utils.parseRichColor(rich) ?? undefined;
    }

    let matchResult = extras.fullMessage?.match(Utils.richRegex);
    if(extras.fullMessage && matchResult) {
        let rich = matchResult[0];
        let spl = extras.fullMessage.split(rich);
        extras.fullMessage = spl.slice(1).join('');
        extras.isFullRich = true;
        extras.fullTitle = spl[0];
        extras.fullRichColor = Utils.parseRichColor(rich) ?? undefined;
    }

    let chatData: ClientChatData = {
        room: room,
        senderName: name,
        date: Date.now(),
        message: message,
        profilePic: profile,
        chatId: uid,
        extras
    };
    rooms[room].chatList.push(chatData);
    chatExistance.add(uid);
    chat.in(room).emit('chat', chatData);

    return chatData;
}

export function sendBotMessage(room = 'main-room', message: string, extras?: ExtraObject) {
    sendMessage(room, 'Bot', message, '/logo.png', extras);
}

