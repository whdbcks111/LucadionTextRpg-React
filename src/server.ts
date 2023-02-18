import crypto from 'crypto';
import { Socket } from 'socket.io';
import fs from 'graceful-fs';
import * as Rpg from './modules/Internal';
import { AttributeType, Utils, Command, CommandArg, CommandManager, EquipmentType, 
    Item, Monster, Player, ShopStateType, StatType, Time, TradeManager, 
    TradeRequest, World, ZoneType, PlayerRankingCriteria, User, ChatRoomManager, 
    ChatRoom, DateFormat, Config, ChatManager } from './modules/Internal';
import { ChatData, EmailAuthCodeMap, HandleChatData, NullableString, LoginInfo, 
    RegisterInfo, ServerPingData, PingRoomData, RegisterMessage, LoginMessage } from './types';
import { chat } from './modules/server/chat/ChatSocket';
import { sendMail } from './modules/server/EmailManager';
import axios from 'axios';
import { ComponentBuilder, getRawText } from './modules/server/chat/ComponentBuilder';

Utils.importAll(Rpg, globalThis);

const MAIN_ROOM_ID = 'main-room';

const SAVE_INTERVAL = 1000 * 30;
const BACKUP_INTERVAL = 1000 * 60 * 60 * 12;
const BACKUP_TIMES = Math.ceil(BACKUP_INTERVAL / SAVE_INTERVAL);

const emailAuthHtml = fs.readFileSync('./private/emailAuth.html').toString();

const emailAuthCodes: EmailAuthCodeMap = {};
let authCode: NullableString = null;

const commandManager = new CommandManager([

    new Command(['?', '도움말', '명령어'], [], [], (chat, player, label, args) => {
        player.sendRawMessage('[ 아직 도움말이 없습니다. ]');
    }).setAliveOnly(false),

    new Command(['개발자 인증'], [], [], (chat, player, label, args) => {
        player.sendRawMessage('[ 콘솔에 인증번호를 전송하였습니다. 그대로 복사해서 입력해주세요. ]');
        authCode = Utils.randomString(30);
        console.log(authCode);
    }).setAliveOnly(false),

    new Command(['실행'], [CommandArg.STRING], ['exec'], (chat, player, label, args) => {
        try {
            let result = String(eval(args[0]));
            ChatManager.sendBotRawMessage(chat.room, result.trim().length > 0 ? result : '(void)');
        }
        catch (e) {
            if(e instanceof Error) ChatManager.sendBotRawMessage(chat.room, String(e.stack));
        }
    }).setDevOnly(true).setAliveOnly(false),

    new Command(['스테이터스'], [], ['s'], (chat, player, label, args) => {
        player.sendMessage(player.getStatusInfo());
    }),

    new Command(['로그인'], [], ['li', 'in'], (chat, player, label, args) => {
        if (player.isLoggedIn) {
            player.sendRawMessage('[ 이미 로그인 되어 있습니다. ]');
        }
        else {
            player.login();
            player.sendRawMessage('[ 로그인 되셨습니다. ]');
        }
    }).setAliveOnly(false),

    new Command(['로그아웃'], [], ['lo', 'ou'], (chat, player, label, args) => {
        if (!player.isLoggedIn) {
            player.sendRawMessage('[ 이미 로그아웃 되어 있습니다. ]');
        }
        else if (Date.now() - player.latestLoggedInTime < 1000 * 60) {
            player.sendRawMessage('[ 마지막으로 로그인 한 시점부터 1분이 지나야 다시 로그아웃이 가능합니다. ]');
        }
        else if (Date.now() - player.latestHitted < 1000 * 10) {
            player.sendRawMessage('[ 마지막으로 공격 받은 시점부터 10초가 지나야 로그아웃 가능합니다. ]');
        }
        else if (Date.now() - player.latestAttack < 1000 * 10) {
            player.sendRawMessage('[ 마지막으로 공격한 시점부터 10초가 지나야 로그아웃 가능합니다. ]');
        }
        else {
            player.logout();
            player.sendRawMessage('[ 로그아웃 되셨습니다. ]');
        }
    }).setAliveOnly(false),

    new Command(['퀘스트'], [], ['q'], (chat, player, label, args) => {
        player.sendRawMessage(player.getQuestsInfo());
    }),

    new Command(['맵'], [], ['m'], (chat, player, label, args) => {
        player.sendMessage(player.getLocation().getLocationInfo());
    }),

    new Command(['인벤토리'], [], ['i'], (chat, player, label, args) => {
        player.sendMessage(player.inventory.getContentsInfo());
    }),

    new Command(['인벤토리 정리'], [], ['ia'], (chat, player, label, args) => {
        player.inventory.arrangeContents();
        player.sendRawMessage('[ 인벤토리가 정리되었습니다. ]');
    }),

    new Command(['칭호 목록'], [], ['tl'], (chat, player, label, args) => {
        player.sendMessage(ComponentBuilder.message([
            ComponentBuilder.text(`[ 칭호 목록입니다. ]`),
            ComponentBuilder.embed([ComponentBuilder.hidden([
                ComponentBuilder.text(`\n\n${player.getTitleListInfo()}`)
            ])])
        ]));
    }),

    new Command(['칭호 사용'], [CommandArg.INTEGER], ['tu'], (chat, player, label, args) => {
        let titleIdx = parseInt(args[0]) - 1;
        if (titleIdx in player.titles) {
            player.title = player.titles[titleIdx];
            player.sendRawMessage(`[ 사용중인 칭호를 [ ${player.title} ] (으)로 설정했습니다.`);
        }
        else player.sendRawMessage('[ 해당하는 칭호는 보유하고 있지 않습니다. ]');
    }),

    new Command(['단축키', '단축키 목록'], [], ['kb'], (chat, player, label, args) => {
        player.sendMessage(ComponentBuilder.message([
            ComponentBuilder.text(`[ 단축키 목록입니다. ]`),
            ComponentBuilder.hidden([
                commandManager.getKeyBindsInfo()
            ])
        ]));
    }).setAliveOnly(false),

    new Command(['랭킹', '순위'], [], ['rk'], (chat, player, label, args) => {
        player.sendMessage(Player.getRankingInfo());
    }).setAliveOnly(false),

    new Command(['랭킹', '순위'], [CommandArg.STRING], ['rk'], (chat, player, label, args) => {
        try {
            player.sendMessage(Player.getRankingInfo(PlayerRankingCriteria.getCriteria(args[0])));
        }
        catch (e) {
            player.sendMessage(ComponentBuilder.embed([
                ComponentBuilder.text('해당하는 랭킹 기준은 없습니다. 다음 중 하나여야 합니다.\n'),
                ComponentBuilder.text(
                    PlayerRankingCriteria.list.map(criteria => criteria.name).join(', '),
                    { backgroundColor: '#00002233', borderRadius: '4px', padding: '2px 5px' }
                )
            ], 'red'));
        }
    }).setAliveOnly(false),

    new Command(['상점', '상점 목록'], [], ['sh', 'z'], (chat, player, label, args) => {
        let loc = player.getLocation();
        if(loc.shop) {
            player.sendMessage(loc.shop.getShopInfo());
        }
        else {
            player.sendRawMessage('[ 이 장소는 상점이 아닙니다. ]');
        }
    }),

    new Command(['맵 플레이어'], [], ['mp'], (chat, player, label, args) => {
        let loc = player.getLocation();
        player.sendMessage(ComponentBuilder.message([
            ComponentBuilder.text('[ 맵 플레이어 목록 ]\n'),
            loc.getPlayersInfo()
        ]));
    }),

    new Command(['맵 장소'], [], ['ml'], (chat, player, label, args) => {
        let loc = player.getLocation();
        player.sendRawMessage('[ 맵 갈 수 있는 장소 목록 ]\n' + loc.getMovableInfo());
    }),

    new Command(['스킬 목록'], [], ['sl', 'l'], (chat, player, label, args) => {
        if(player.skills.length === 0)
            player.sendRawMessage('[ 보유한 스킬이 없습니다. ]');
        else
            player.sendMessage(player.getSkillListInfo());
    }),

    new Command(['스킬 정보'], [CommandArg.STRING], ['si', 'k'], (chat, player, label, args) => {
        let skillName = args[0];
        let skill = player.getSkill(skillName);
        if (skill) {
            player.sendMessage(skill.getSkillInfo(player));
        }
        else {
            player.sendRawMessage('[ 해당하는 스킬을 보유하고 있지 않습니다. ]');
        }
    }),

    new Command(['구매'], [CommandArg.POSITIVE_INTEGER, CommandArg.POSITIVE_INTEGER], ['bu'], (chat, player, label, args) => {
        let location = player.getLocation();
        if (!location.shop) {
            player.sendRawMessage('[ 이 장소는 상점이 아닙니다. ]');
        }
        else {
            let index = parseInt(args[0]) - 1;
            let count = parseInt(args[1]);
            let state = location.shop.buyItem(player, index, count);
            if (state.state === ShopStateType.SUCCESS) {
                player.sendRawMessage('[ ' + location.shop.buyList[index].name + '(을)를 ' + state.extras.boughtCount + '개 만큼 구매했습니다. ]');
            }
            else if (state.state === ShopStateType.ITEM_NOT_FOUND) {
                player.sendRawMessage('[ 해당하는 아이템은 존재하지 않습니다. ]');
            }
            else if (state.state === ShopStateType.OUT_OF_STOCK) {
                player.sendRawMessage('[ 재고가 부족합니다. ]');
            }
            else if (state.state === ShopStateType.FULL_INVENTORY_SPACE) {
                player.sendRawMessage('[ 인벤토리가 꽉 차있습니다. ]');
            }
            else if (state.state === ShopStateType.GOLD_NOT_ENOUGH) {
                player.sendRawMessage('[ 골드가 부족합니다. ]');
            }
        }
    }).setDefaultArgs(['1']),

    new Command(['판매'], [CommandArg.POSITIVE_INTEGER, CommandArg.POSITIVE_INTEGER], ['se'], (chat, player, label, args) => {
        let location = player.getLocation();
        if (!location.shop) {
            player.sendRawMessage('[ 이 장소는 상점이 아닙니다. ]');
        }
        else {
            let index = parseInt(args[0]) - 1;
            let count = parseInt(args[1]);
            let state = location.shop.sellItem(player, index, count);
            if (state.state === ShopStateType.SUCCESS) {
                player.sendRawMessage('[ ' + location.shop.sellList[index].name + '(을)를 ' + state.extras.soldCount + '개 만큼 판매했습니다. ]\n' +
                    '(얻은 골드  ' + state.extras.earnedGold + 'G)');
            } else if (state.state === ShopStateType.ITEM_NOT_FOUND) {
                player.sendRawMessage('[ 해당하는 아이템은 존재하지 않습니다. ]');
            }
        }
    }).setDefaultArgs(['1']),

    new Command(['버리기'], [CommandArg.POSITIVE_INTEGER, CommandArg.POSITIVE_INTEGER], ['dr', 'q'], (chat, player, label, args) => {
        let index = parseInt(args[0]) - 1;
        let count = parseInt(args[1]);
        let result = player.dropItem(index, count);

        if (player.isUsingItem) {
            player.sendRawMessage('[ 아이템 사용 중일 때는 아이템을 버리실 수 없습니다. ]');
        }
        else if (result) {
            player.sendRawMessage('[ ' + result.item.getName() + '(을)를 ' + result.count + '개 버렸습니다. ]');
        }
        else player.sendRawMessage('[ 슬롯이 비어있습니다. ]')
    }).setDefaultArgs(['1']),

    new Command(['줍기'], [CommandArg.POSITIVE_INTEGER, CommandArg.POSITIVE_INTEGER], ['p', 'j'], (chat, player, label, args) => {
        let index = parseInt(args[0]) - 1;
        let count = parseInt(args[1]);
        let result = player.pickUpItem(index, count);

        if (result) {
            player.sendRawMessage('[ ' + result.item.getName() + '(을)를 ' + result.count + '개 주웠습니다. ]');
        }
        else player.sendRawMessage('[ 해당하는 떨어진 아이템이 존재하지 않습니다. ]')
    }).setDefaultArgs(['1']),

    new Command(['판매 전체'], [], ['sa'], (chat, player, label, args) => {
        let location = player.getLocation();
        if (!location.shop) {
            player.sendRawMessage('[ 이 장소는 상점이 아닙니다. ]');
        }
        else {
            player.sendRawMessage('[ 팔 수 있는 모든 아이템을 팔았습니다. ]\n' +
                '(얻은 골드  ' + location.shop.sellAllItem(player) + 'G)');
        }
    }),

    new Command(['스탯 분배'], [CommandArg.STRING, CommandArg.POSITIVE_INTEGER], ['st', 'r'], (chat, player, label, args) => {
        let count = parseInt(args[1]);
        let type = StatType.getByDisplayName(args[0]);
        if(!type) {
            player.sendRawMessage('[ 해당하는 스탯은 존재하지 않습니다. ]');
        }
        else if (player.statPoint < count) {
            player.sendRawMessage('[ 스탯 포인트가 부족합니다. ]');
        }
        else {
            player.stat.addStat(type, count);
            player.statPoint -= count;
            player.sendRawMessage('[ ' + args[0] + ' 스탯에 포인트를 ' + count + '만큼 분배하였습니다. ]');
        }
    }).setDefaultArgs(['1']),

    new Command(['제작법'], [], ['cl'], (chat, player, label, args) => {
        player.sendMessage(ComponentBuilder.message([
            ComponentBuilder.text(`[ 잠금 해제된 제작법 목록입니다. ]`),
            ComponentBuilder.embed([ComponentBuilder.hidden([
                ComponentBuilder.text(player.getUnlockedRecipesInfo())
            ])])
        ]));
    }),

    new Command(['장착 해제'], [CommandArg.STRING], ['dm'], (chat, player, label, args) => {
        let slotName = args[0];
        let type = EquipmentType.getByDisplayName(slotName);
        if (type) {
            let item = player.slot.getItem(type);
            if(item) {
                player.inventory.addItem(item);
                player.slot.setItem(type, null);
                player.sendRawMessage('[ 장착을 해제했습니다. ]');
            }
            else player.sendRawMessage('[ 이미 비어있는 슬롯입니다. ]');
        }
        else player.sendRawMessage('[ 해당하는 이름의 슬롯은 없습니다. ]');
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
                player.sendRawMessage('[ ' + recipeName + ' 의 제작을 ' + (hasCount ? createdCount + '회 ' : '') + '완료했습니다! ]');
            }
            else player.sendRawMessage('[ 제작 조건을 충족하지 못했습니다 : ' + recipe.getRecipeInfo());
        }
        else player.sendRawMessage('[ 잠금 해제된 제작법 중에 해당하는 제작법은 존재하지 않습니다. ]');
    }),

    new Command(['사용'], [CommandArg.POSITIVE_INTEGER], ['u'], (chat, player, label, args) => {
        let slotIndex = parseInt(args[0]) - 1;
        let itemStack = player.inventory.getItemStack(slotIndex);
        if (!player.canUseItem) {
            player.sendRawMessage('[ ' + (player.cannotUseItemMessage || '아이템을 사용할 수 없는 상태입니다.') + ' ]');
        }
        else if (player.isUsingItem) {
            player.sendRawMessage('[ 아직 아이템을 사용 중입니다. ]');
        }
        else if (!itemStack) {
            player.sendRawMessage('[ 슬롯이 비어 있습니다. ]');
        }
        else if (itemStack.item.requiredLevel && player.level < itemStack.item.requiredLevel) {
            player.sendRawMessage('[ 필요 레벨이 충족되지 않았습니다. (' + itemStack.item.requiredLevel + '레벨) ]');
        }
        else if (!itemStack.item.canUse) {
            player.sendRawMessage('[ 사용할 수 없는 아이템입니다. ]');
        }
        else {
            const displayName =  itemStack.item.getDisplayName(true);
            const raw = getRawText(displayName);
            player.sendMessage(ComponentBuilder.message([
                ComponentBuilder.text('[ '),
                displayName,
                ComponentBuilder.text(Utils.getObjective(raw) + ' 사용했습니다. ]')
            ]));
            player.inventory.useItem(slotIndex);
        }
    }),

    new Command(['대화'], [CommandArg.POSITIVE_INTEGER], ['t'], (chat, player, label, args) => {
        let location = player.getLocation();
        let npcIndex = parseInt(args[0]) - 1;
        let npc = location.npcs[npcIndex];
        if (!npc) {
            player.sendRawMessage('[ 해당하는 NPC가 존재하지 않습니다. ]');
        }
        else if (npc.isTalking) {
            player.sendRawMessage('[ 다른 사람과 이미 대화 중입니다. ]');
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
            player.sendRawMessage('[ 대화중인 NPC가 존재하지 않습니다. ]');
        }
        else if (!npc.choose(index)) {
            player.sendRawMessage('[ 해당하는 선택지가 없습니다. ]');
        }
    }),

    new Command(['확인'], [CommandArg.POSITIVE_INTEGER], ['f', 'ck'], (chat, player, label, args) => {
        let location = player.getLocation();
        let index = parseInt(args[0]) - 1;
        let terrain = location.terrains[index];
        if (!terrain) {
            player.sendRawMessage('[ 해당하는 지형이 존재하지 않습니다. ]');
        }
        else if (terrain.isAlreadyChecked) {
            player.sendRawMessage('[ 이미 확인된 지형입니다. ]');
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
            player.sendRawMessage('[ 해당하는 아이템은 존재하지 않습니다. ]');
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
            player.sendRawMessage('[ 해당하는 번호의 오브젝트는 존재하지 않습니다. ]');
        else if (object.deadTime > 0 || object.life <= 0) {
            let deadMessage = object instanceof Monster ? '죽어있는 몬스터' : '파괴된 오브젝트';
            player.sendRawMessage('[ 이미 ' + deadMessage + '입니다. ]');
        }
        else {
            player.attack(object);
        }
    }),

    new Command(['공격'], [], ['a'], (chat, player, label, args) => {
        if (player.currentTarget && player.currentTarget.isAlive) {
            let object = player.currentTarget;
            player.attack(object);
        }
    }),

    new Command(['공격p'], [CommandArg.POSITIVE_INTEGER], ['ap'], (chat, player, label, args) => {
        let location = player.getLocation();
        if (location.zoneType === ZoneType.PEACEFUL) {
            player.sendRawMessage('[ 평화지역에서는 싸울 수 없습니다. ]');
        }
        else {
            let index = parseInt(args[0]) - 1;
            let object = location.getPlayers()[index];
            if (!object)
                player.sendRawMessage('[ 해당하는 번호의 플레이어는 존재하지 않습니다. ]');
            else player.attack(object); 
        }
    }),

    new Command(['파티 초대'], [CommandArg.POSITIVE_INTEGER], ['pi'], (chat, player, label, args) => {
        let location = player.getLocation();
        let index = parseInt(args[0]) - 1;
        let target = location.getPlayers()[index];
        if (player.partyOwner)
            player.sendRawMessage('[ 당신은 이미 다른 파티에 참가되어 있습니다. ]');
        else if (!target)
            player.sendRawMessage('[ 해당하는 번호의 플레이어는 존재하지 않습니다. ]');
        else if (target === player)
            player.sendRawMessage('[ 자신한텐 초대를 보낼 수 없습니다. ]');
        else if (target.partyOwner)
            player.sendRawMessage(`[ ${target.getName()}님은 이미 다른 파티에 있습니다. ]`);
        else if (target.partyMembers.length > 0)
            player.sendRawMessage(`[ ${target.getName()}님은 이미 다른 파티에 있습니다. ]`);
        else if (target.partyInviteRequest)
            player.sendRawMessage(`[ ${target.getName()}님은 이미 초대를 받으신 상태입니다. ]`);
        else {
            player.inviteParty(target, 30);
            player.sendRawMessage(`[ ${target.getName()}님에게 파티 초대를 보냈숩니다. ]\n` +
                Utils.PREFIX + '파티 수락 을 통해 수락하거나,\n' +
                Utils.PREFIX + '파티 거절 을 통해 거절해주세요.\n' +
                '30초 후에 만료됩니다.');
        }
    }),

    new Command(['파티 수락'], [], ['pa'], (chat, player, label, args) => {
        if (player.partyInviteRequest) {
            player.acceptPartyInvite();
            player.sendRawMessage('[ ' + player.getPartyOwner().getName() + '님의 파티에 참가되셨습니다. ]');
        }
        else player.sendRawMessage('[ 받은 파티 요청이 없습니다. ]');
    }),

    new Command(['파티 거절'], [], ['pd'], (chat, player, label, args) => {
        if (player.partyInviteRequest) {
            player.denyPartyInvite();
            player.sendRawMessage('[ 파티 요청을 거절하셨습니다. ]');
        }
        else player.sendRawMessage('[ 받은 파티 요청이 없습니다. ]');
    }),

    new Command(['파티 퇴장'], [], ['pl'], (chat, player, label, args) => {
        if(player.partyOwner) {
          player.sendRawMessage('[ 파티를 떠나셨습니다. ]');
          if(player.getPartyOwner().user.currentRoom !== player.user.currentRoom)
            player.getPartyOwner().sendRawMessage('[ ' + player.getName() + '님이 파티를 떠나셨습니다. ]');
          player.leaveParty();
        }
        else player.sendRawMessage('[ 당신은 파티 멤버가 아닙니다. ]');
    }),

    new Command(['파티 추방'], [CommandArg.POSITIVE_INTEGER], ['pk'], (chat, player, label, args) => {
        if (!player.partyOwner) {
            let index = parseInt(args[0]) - 1;
            let kicked = player.kickPartyMember(index);
            if (kicked) {
                player.sendRawMessage(`[ ${kicked.getName()}님을 파티에서 추방시켰습니다. ]`);
            }
            else {
                player.sendRawMessage('[ 해당하는 번호의 파티 멤버는 없습니다. ]');
            }
        }
        else player.sendRawMessage('[ 당신은 파티장이 아닙니다. ]');
    }),

    new Command(['파티 해산'], [], ['pr'], (chat, player, label, args) => {
        if(!player.partyOwner) {
            if(player.partyMembers.length <= 0) {
              player.sendRawMessage('[ 파티에 멤버가 없습니다. ]');
            }
            else {
              player.dissolveParty();
              player.sendRawMessage('[ 파티를 해산시켰습니다. ]');
            }
          }
          else player.sendRawMessage('[ 당신은 파티장이 아닙니다. ]');
    }),

    new Command(['파티 정보'], [], ['pt'], (chat, player, label, args) => {
        player.sendRawMessage(player.getPartyInfo());
    }),

    new Command(['대상지정'], [CommandArg.POSITIVE_INTEGER], ['tg'], (chat, player, label, args) => {
        let location = player.getLocation();
        let index = parseInt(args[0]) - 1;
        let object = location.objects[index];
        if (!object)
            player.sendRawMessage('[ 해당하는 번호의 오브젝트는 존재하지 않습니다. ]');
        else if (object instanceof Monster && 
            !Array.from(object.targets)
                .some(p => p instanceof Player && p.getPartyOwner() === player.getPartyOwner()) && 
            object.targets.size > 0
        ) {
            player.sendRawMessage('[ 다른 파티가 이미 싸우고 있습니다. ]');
        }
        else if (object.deadTime > 0 || object.life <= 0) {
            let deadMessage = object instanceof Monster ? '죽어있는 몬스터' : '파괴된 오브젝트';
            player.sendRawMessage('[ 이미 ' + deadMessage + '입니다. ]');
        }
        else {
            player.currentTarget = object;
            player.sendRawMessage('[ 대상을 ' + object.getName() + '(으)로 지정했습니다. ]')
        }
    }),

    new Command(['대상지정p'], [CommandArg.POSITIVE_INTEGER], ['tgp'], (chat, player, label, args) => {
        let location = player.getLocation();
        let index = parseInt(args[0]) - 1;
        let object = location.getPlayers()[index];
        if (!object)
            player.sendRawMessage('[ 해당하는 번호의 플레이어는 존재하지 않습니다. ]');
        else {
            player.currentTarget = object;
            player.sendRawMessage('[ 대상을 ' + object.getName() + '님으로 지정했습니다. ]')
        }
    }),

    new Command(['거래 요청'], [CommandArg.POSITIVE_INTEGER], ['tr'], (chat, player, label, args) => {
        let location = player.getLocation();
        let index = parseInt(args[0]) - 1;
        let target = location.getPlayers()[index];
        if (!target)
            player.sendRawMessage('[ 해당하는 번호의 플레이어는 존재하지 않습니다. ]');
        else if (target === player)
            player.sendRawMessage('[ 자신과는 거래할 수 없습니다. ]');
        else {
            TradeManager.requestTrade(player, target);
            Player.sendGroupRawMessage([player, target], 
                `[ ${player.getName()}님이 ${target.getName()}님에게 거래 요청을 보냈습니다. ]\n` +
                `수락하시려면 ${Utils.PREFIX}거래 수락, 거절하시려면 ${Utils.PREFIX}거래 거절 을 입력해주세요.\n` +
                TradeRequest.DEFAULT_REMAIN_TIME.toFixed(0) + '초 후에 만료됩니다.');
        }
    }),

    new Command(['거래 거절'], [], ['td'], (chat, player, label, args) => {
        let request = TradeManager.getRequestTo(player);
        if(!request)
          player.sendRawMessage('[ 받은 거래 요청이 없습니다. ]');
        else {
          request.deny();
          player.sendRawMessage('[ 거래가 거절되었습니다. ]');
        }
    }),

    new Command(['거래 수락'], [], ['ta'], (chat, player, label, args) => {
        let request = TradeManager.getRequestTo(player);
        if (!request)
            player.sendRawMessage('[ 받은 거래 요청이 없습니다. ]');
        else {
            let trade = request.accept();
            Player.sendGroupMessage([trade.player1.player, trade.player2.player],
                ComponentBuilder.message([
                    ComponentBuilder.text(`[ ${trade.player1.player.getName()}님과 ${trade.player2.player.getName()}님의 거래가 시작되었습니다. ]\n` +
                        `자세한 설명을 보시려면 전체보기를 눌러주세요.`),
                    ComponentBuilder.hidden([
                        ComponentBuilder.text(`\n\n거래할 아이템을 추가하시려면 ${Utils.PREFIX}거래 아이템추가 [ 슬롯번호 ] [ 개수 ]\n` +
                            `추가한 아이템을 회수하시려면 ${Utils.PREFIX}거래 아이템회수 [ 슬롯번호 ] [ 개수 ]\n` +
                            `골드를 추가하시려면 ${Utils.PREFIX}거래 골드추가 [ 수량 ]\n` +
                            `추가한 골드를 회수하시려면 ${Utils.PREFIX}거래 골드회수 [ 수량 ]\n\n` +
                            `거래를 취소하시려면 ${Utils.PREFIX}거래 취소\n` +
                            `거래 내용을 확인하시려면 ${Utils.PREFIX}거래 확인을, ` +
                            `확인을 취소하시려면 ${Utils.PREFIX}거래 확인취소를 입력하되,\n` +
                            `한 명이라도 확인을 한 상태면 더이상 아이템과 골드를 회수는 불가능하고 추가만 가능하며, ` +
                            `두 명 모두 거래를 확인하면 최종적으로 거래가 성사되고 거래가 종료됩니다.\n` +
                            `또한 한 명이 로그아웃 또는 사망하거나 서로 장소가 달라지면 거래가 자동으로 취소됩니다.`)
                    ])
                ])
            );
        }
    }),

    new Command(['거래 아이템추가'], [CommandArg.POSITIVE_INTEGER, CommandArg.POSITIVE_INTEGER], ['tia'],
        (chat, player, label, args) => {
            let trade = TradeManager.getTrade(player);
            if (!trade)
                player.sendRawMessage('[ 거래가 시작되지 않았습니다. ]');
            else {
                let slotIdx = parseInt(args[0]) - 1;
                let count = parseInt(args[1]);
                let tradePlayer = trade.player1.player === player ? trade.player1 : trade.player2;
                let result = tradePlayer.addItem(slotIdx, count);
                if (result)
                    Player.sendGroupRawMessage([trade.player1.player, trade.player2.player], trade.getTradeInfo());
                else
                    player.sendRawMessage('[ 빈 슬롯입니다. ]');
            }
        }
    ).setDefaultArgs(['1']),

    new Command(['거래 취소'], [], ['tce'], (chat, player, label, args) => {
        let trade = TradeManager.getTrade(player);
        if (!trade)
            player.sendRawMessage('[ 거래가 시작되지 않았습니다. ]');
        else {
            trade.cancel();
            Player.sendGroupRawMessage([trade.player1.player, trade.player2.player], '[ 거래가 취소되었습니다. ]');
        }
    }),

    new Command(['거래 확인'], [], ['tc', 'tcf'], (chat, player, label, args) => {
        let trade = TradeManager.getTrade(player);
        if(!trade)
          player.sendRawMessage('[ 거래가 시작되지 않았습니다. ]');
        else {
          let tradePlayer = trade.player1.player === player ? trade.player1 : trade.player2;
          if(tradePlayer.hasConfirmed) {
            player.sendRawMessage('[ 이미 확인된 상태입니다. ]');
          }
          else {
            tradePlayer.hasConfirmed = true;
            Player.sendGroupRawMessage([trade.player1.player, trade.player2.player], 
                `[ ${player.getName()}님이 거래 내용을 확인하셨습니다. ]`);
          }
        }
    }),

    new Command(['거래 확인취소'], [], ['tcc'], (chat, player, label, args) => {
        let trade = TradeManager.getTrade(player);
        if(!trade)
          player.sendRawMessage('[ 거래가 시작되지 않았습니다. ]');
        else {
          let tradePlayer = trade.player1.player === player ? trade.player1 : trade.player2;
          if(!tradePlayer.hasConfirmed) {
            player.sendRawMessage('[ 이미 확인을 하지 않은 상태입니다. ]');
          }
          else {
            tradePlayer.hasConfirmed = false;
            Player.sendGroupRawMessage([trade.player1.player, trade.player2.player], 
                `[ ${player.getName()}님이 거래 내용 확인을 철회하셨습니다. ]`);
          }
        }
    }),

    new Command(['거래 아이템회수'], [CommandArg.POSITIVE_INTEGER, CommandArg.POSITIVE_INTEGER], ['tis'], (chat, player, label, args) => {
        let trade = TradeManager.getTrade(player);
        if (!trade)
            player.sendRawMessage('[ 거래가 시작되지 않았습니다. ]');
        else if (trade.player1.hasConfirmed || trade.player2.hasConfirmed)
            player.sendRawMessage('[ 한 명이 이미 확인한 거래이므로 아이템 회수가 불가능합니다.');
        else {
            let slotIdx = parseInt(args[0]) - 1;
            let count = parseInt(args[1]);
            let tradePlayer = trade.player1.player === player ? trade.player1 : trade.player2;
            let result = tradePlayer.subtractItem(slotIdx, count);
            if (result)
                Player.sendGroupRawMessage([trade.player1.player, trade.player2.player], trade.getTradeInfo());
            else
                player.sendRawMessage('[ 존재하지 않는 슬롯 번호입니다. ]');
        }
    }).setDefaultArgs(['1']),

    new Command(['거래 골드추가'], [CommandArg.POSITIVE_INTEGER], ['tga'], (chat, player, label, args) => {
        let trade = TradeManager.getTrade(player);
        if (!trade)
            player.sendRawMessage('[ 거래가 시작되지 않았습니다. ]');
        else {
            let amount = parseInt(args[0]);
            let tradePlayer = trade.player1.player === player ? trade.player1 : trade.player2;
            let result = tradePlayer.addGold(amount);
            if (result)
                Player.sendGroupRawMessage([trade.player1.player, trade.player2.player], trade.getTradeInfo());
            else
                player.sendRawMessage('[ 골드가 부족합니다. ]');
        }
    }),

    new Command(['거래 골드회수'], [CommandArg.POSITIVE_INTEGER], ['tgs'], (chat, player, label, args) => {
        let trade = TradeManager.getTrade(player);
        if (!trade)
            player.sendRawMessage('[ 거래가 시작되지 않았습니다. ]');
        else if (trade.player1.hasConfirmed || trade.player2.hasConfirmed)
            player.sendRawMessage('[ 한 명이 이미 확인한 거래이므로 골드 회수가 불가능합니다.');
        else {
            let amount = parseInt(args[0]);
            let tradePlayer = trade.player1.player === player ? trade.player1 : trade.player2;
            let result = tradePlayer.subtractGold(amount);
            if (result)
                Player.sendGroupRawMessage([trade.player1.player, trade.player2.player], trade.getTradeInfo());
            else
                player.sendRawMessage('[ 회수할 골드가 없습니다. ]');
        }
    }),

    new Command(['이동'], [CommandArg.POSITIVE_INTEGER], ['mv', 'v', 'go'], (chat, player, label, args) => {
        let location = player.getLocation();
        let index = parseInt(args[0]) - 1;
        let locationName = location.movables[index];
        if (!player.canMove || !player.canWorldMove) {
            player.sendRawMessage('[ ' + (player.cannotMoveMessage || '이동할 수 없는 상태입니다.') + ' ]');
        }
        else if (!locationName) {
            player.sendRawMessage('[ 해당하는 장소는 존재하지 않습니다. ]');
        }
        else if (!player.moveTarget) {
            let to = World.getLocation(locationName);
            player.sendRawMessage(`[ ${locationName}으로 이동하는 중.. ]\n` +
                `(거리 : ${location.getDistance(to).toFixed(1)}m  ` +
                `예상 소요시간 : ${location.getMoveTime(to, 
                    player.attribute.getValue(AttributeType.MOVE_SPEED)).toFixed(1)}초)`);
            player.move(to.name);
        }
        else {
            player.sendRawMessage('[ 이미 이동중입니다. ]');
        }
    }),

    new Command(['동시접속', '동접'], [], ['con'], (chat, player, label, args) => {
        let roomId = player.user.currentRoom;
        let connected = Player.getConnectedPlayers();
        let roomConnected = connected.filter(p => p.user.currentRoom === roomId);
        let room = ChatRoomManager.getRoom(roomId);

        player.sendMessage(ComponentBuilder.message([
            ComponentBuilder.text(`[ 동시 접속 정보 ]`),
            ComponentBuilder.embed([
                ComponentBuilder.text(`현재 ${connected.length}명의 유저가 접속중입니다.\n`),
                ComponentBuilder.text(`[${room?.name}] 채팅방에는 ${roomConnected.length}명의 유저가 접속중입니다.\n\n`),
                ComponentBuilder.text(`[ 접속 중인 유저 목록 ]`),
                ComponentBuilder.hidden([
                    ComponentBuilder.text('\n강조 표시된 닉네임은 같은 방의 유저입니다.\n', { color: 'lightgray' }),
                    ComponentBuilder.join(connected.map(p => ComponentBuilder.text(
                        '  ' + p.getName(),
                        { color: p.user.currentRoom === roomId ? Utils.MAIN_COLOR : 'white' }
                    )), ComponentBuilder.text('\n'))
                ])
            ])
        ]));
    }).setAliveOnly(false)
]);

User.loadAll();
ChatRoomManager.loadAll();
Player.loadAll();

ChatRoomManager.registerRoom(new ChatRoom(MAIN_ROOM_ID, '메인 광장').setOpenRoom());
ChatRoomManager.registerRoom(new ChatRoom('sub_1', '서브 광장 1').setOpenRoom());
ChatRoomManager.registerRoom(new ChatRoom('sub_2', '서브 광장 2').setOpenRoom());
ChatRoomManager.registerRoom(new ChatRoom('sub_3', '서브 광장 3').setOpenRoom());

setInterval(() => {
    try {
        Time.update();
    }
    catch(e) {
        console.error(e);
    }
}, 100);

let saveCount = 0;
setInterval(() => {
    if((++saveCount) % BACKUP_TIMES === 0) {
        if(!fs.existsSync(Utils.BACKUP_PATH)) fs.mkdirSync(Utils.BACKUP_PATH, { recursive: true });
        if(!fs.existsSync(Utils.TMP_PATH)) fs.mkdirSync(Utils.TMP_PATH, { recursive: true });
        let backupDir = `${Utils.BACKUP_PATH}${new DateFormat(new Date()).format('YYYY-MM-DD(hh-mm-ss)')}/`;
        console.log('[lucadion] Data backed up! : ' + backupDir);
        if(!fs.existsSync(backupDir)) fs.rename(Utils.TMP_PATH, backupDir, err => {
            if(err) console.log(err);
            saveData();
        });
    } 
    else fs.rm(Utils.TMP_PATH, { recursive: true, force: true }, err => {
        saveData();
    });
}, SAVE_INTERVAL);

function saveData() {
    User.saveAll();
    ChatRoomManager.saveAll();
    Player.saveAll();
}

chat.on('connection', (client: Socket) => {
    const getToken = (): string => client.handshake.session['auth-token'] ?? '';
    const getUser = () => User.getUserByToken(getToken());

    console.log(`[lucadion] Client connected: (${client.id})`);

    let user = getUser();
    if(!user) client.emit('login-require');
    else {
        client.join(user.currentRoom);
    }

    client.on('previous-chats', () => {
        let user = getUser();
        if(!user) {
            client.emit('login-require');
            return;
        }
        let room = ChatRoomManager.getRoom(user.currentRoom);
        client.emit('previous-chats', room ? room.chatList.map(c => {
            c = {...c};

            if(!c.profilePic) {
                let user = User.getUser(c.userId);
                c.profilePic = user?.profilePic ?? undefined;
            }

            return c;
        }): []);
    });

    client.on('ping', () => {
        const user = getUser();
        if(!user) {
            client.emit('login-require');
            return;
        }

        client.rooms.forEach(id => client.leave(id));
        client.join(user.currentRoom);

        const player = Player.getPlayerByUid(user.uid);
        if(!player) return;
        player.latestPing = Date.now();

        const room = ChatRoomManager.getRoom(user.currentRoom);
        if(!room) {
            user.currentRoom = MAIN_ROOM_ID;
            return;
        }

        const userCountMap = new Map<string, number>();
        const connected = Player.getConnectedPlayers();
        connected.forEach(p => userCountMap.set(p.user.currentRoom, (userCountMap.get(p.user.currentRoom) ?? 0) + 1));

        const data: ServerPingData = {
            currentRoom: room.id,
            currentRoomName: room.name,
            rooms: user.rooms.map<PingRoomData>(r => ({
                id: r.id, 
                name: r.name,
                userCount: userCountMap.get(r.id) ?? 0
            })),
            playerLife: player.life / player.maxLife,
            profilePic: user.profilePic,
            mapPlayerNames: player.getLocation().getPlayers().map(p => p.getName()),
            roomUserCount: userCountMap.get(room.id) ?? 0,
            totalUserCount: connected.length
        };
        if(player.currentTarget) data.targetLife = player.currentTarget.life / player.currentTarget.maxLife;

        client.emit('ping', data);
    });

    client.on('change-profile', (base64: string) => {
        let user = getUser();
        if(!user) {
            client.emit('login-require');
            return;
        }
        user.profilePic = base64;
    });

    client.on('change-room', (id: string) => {
        let user = getUser();
        if(!user) {
            client.emit('login-require');
            return;
        }
        
        if(!user.rooms.some(r => r.id === id)) return;
        user.currentRoom = id;
    });
 
    client.on('chat', (data: ChatData) => {
        let user = getUser();
        if(!user) {
            client.emit('login-require');
            return;
        }
        if(user.currentRoom !== data.room) return;
        let player = Player.getPlayerByUid(user?.uid);
        let chatData = ChatManager.sendRawMessage(data.room,
            user?.uid,
            player?.name ?? 'unnamed',
            String(data.message), 
            user?.profilePic ?? undefined);
        if(!chatData) return;

        console.log(`[lucadion] [room: ${chatData.room}] [sender: ${player?.name}] > ${data.message}`);

        handleMessage({ ...chatData, user, client });
    });

    client.on('email-auth', (email: string) => {
        if(email.length === 0) return;
        let authCode = Utils.randomString(8);
        // email send;
        sendMail(email, '회원가입 인증 코드입니다.', emailAuthHtml.replace('{{code}}', authCode));
    
        emailAuthCodes[email] = {
            code: authCode,
            expirationDate: Date.now() + 1000 * 60 * 5
        };
    });

    client.on('google-login', async (token: string) => {
        const { data } = await axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${token}`);
        if(typeof data === 'object' && data.verified_email === true) {
            const { email, name, picture } = data;
            const userEmail = email + '#google';
            let user = User.users.find(u => u.email === userEmail);
            if(!user) {
                const password = Utils.randomString(20);
                let message = '', nameSuffix = 0;
                do {
                    message = registerUser(userEmail, 
                        name + (nameSuffix > 0 ? '#' + nameSuffix : ''), 
                        password);
                    nameSuffix++;
                } while(message !== 'success');
                user = User.users.find(u => u.email === userEmail);
                if(user) user.profilePic = picture;
            }
            loginUser(userEmail, '');

            if(user?.token) {
                client.handshake.session['auth-token'] = user.token;
                client.handshake.session.save();
            }
            client.emit('google-login', true);
        }
        else client.emit('google-login', false);
    });

    client.on('login', (data: LoginInfo) => {
        const user = User.users.find(u => u.email === data.email);
        const response = data.email.includes('#') ? 'user-not-exists' : loginUser(data.email, data.password);
    
        if(user?.token) {
            client.handshake.session['auth-token'] = user.token;
            client.handshake.session.save();
        }
    
        client.emit('login', response);
    });

    client.on('register', (data: RegisterInfo) => {

        let response: RegisterMessage = 'success';

        if(!emailAuthCodes[data.email]) {
            response = 'auth-code-doesnt-sent';
            client.emit('register', response);
            return;
        }
        if(emailAuthCodes[data.email].code !== data.emailAuthCode) {
            response = 'auth-code-not-match';
            client.emit('register', response);
            return;
        }
        if(emailAuthCodes[data.email].expirationDate < Date.now()) {
            response = 'auth-code-expired';
            client.emit('register', response);
            return;
        }

        response = registerUser(data.email, data.nickname, data.password);
    
        client.emit('register', response);
    })
});

function loginUser(email: string, password: string): LoginMessage {
    const user = User.users.find(u => u.email === email) ?? null;

    if(!user) return 'user-not-exists';

    if (!email.includes('#') && crypto.createHash('sha512')
        .update(password + user.salt)
        .digest('base64') !== user.passwordHash) 
        return 'password-not-match'

    user.token = Utils.randomString(30);
    user.tokenExpirationDate = Date.now() + 1000 * 60 * 60 * 12;

    Player.getPlayerByUid(user.uid)?.login();
    return 'success';
}
 
function registerUser(email: string, nickname: string, password: string): RegisterMessage {
    if(User.users.some(u => u.email === email)) return 'email-already-registered';
    if(Player.players.some(u => u.name === nickname)) return 'nickname-already-exists';

    let uid: string = '';
    do { uid = crypto.randomUUID(); } while(User.getUser(uid)); 
    let salt = Utils.randomString(20);

    let newUser = new User(uid, email, 
        crypto.createHash('sha512').update(password + salt).digest('base64'), salt,
        null, 0, null, MAIN_ROOM_ID);
    let newPlayer = new Player(uid, nickname);

    User.registerUser(newUser);
    newUser.saveData();
    Player.addPlayer(newPlayer);
    newPlayer.saveData();

    return 'success';
}

function handleMessage(chatData: HandleChatData) {
    let { room, message, user } = chatData;
    try {
        let userId = user?.uid;
        let player = Player.getPlayerByUid(userId);
        if(!player) return;

        player.user.currentRoom = room;

        const rawMessage = getRawText(message);

        player.onChat(rawMessage);

        if (rawMessage === authCode) {
            authCode = null;
            Config.set('dev-uuid', userId);
            ChatManager.sendBotRawMessage(room, '[ 인증되었습니다. ]');
        }

        commandManager.onMessage(chatData, player);
    }
    catch (e) {
        console.error(e);
    }
}