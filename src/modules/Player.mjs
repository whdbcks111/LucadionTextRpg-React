import AttributeType from "./AttributeType.mjs";
import DateFormat from "./DateFormat.mjs";
import Effect, { EffectType } from "./Effect.mjs";
import { EquipmentSlot } from "./Entity.mjs";
import LivingEntity from "./LivingEntity.mjs";
import Time from "./Time.mjs";
import Title from "./Title.mjs";
import Utils from "./Utils.mjs";

export default class Player extends LivingEntity {

    constructor(uid, nickname, email) {
        super(nickname);

        this.uid = uid;
        this.profilePic = null;
        this.isLoggedIn = true;
        this.latestLoggedInTime = 0;
        this.latestLoggedOutTime = 0;
        this.email = email;
        this.verifyCode = null;
        this.verifyExpirationDate = 0;

        this.title = null;
        this.characterClass = null;
        this.gold = 0;
        this.notorious = 0;
        this.statPoint = 0;
        this.location = World.locations.find(loc => loc.type === 'worldSpawn').name;
        this.spawn = this.location;

        this.isUsingItem = false;
        this.latestPing = Date.now();
        this.latestChatTime = 0;
        this.latestRoomName;

        this.moveTarget = null;
        this.remainMoveDistance = 0;

        this.partyOwner = null;
        this.partyInviteRequest = null;
        this.remainPartyInviteTime = 0;

        this.fishingState = new FishingState();
        this.log = new Player.Log();
        this.inventory = new Inventory();
        this.extras = {};
        this.unlockedRecipes = [];
        this.titles = [];
        this.quests = [];
        this.skills = [];

        this.giveDefaultItems();
    }

    breakEquipItem(slotName) {
        let item = super.breakEquipItem(slotName);
        this.sendMessage('[ ' + item + ' (이)가 파괴되었습니다. ]');
    }

    damage(damage, abuser) {
        if(abuser instanceof Player && this.getLocation().zoneType === 'safe') return false;
        super.damage(damage, abuser); 
    }

    onChat(message) {
        this.latestChatTime = Date.now();
    }

    fish() {
        let state = this.fishingState;
        let loc = this.getLocation();
        if(!state.catchingFish && state.waitTime <= 0 && loc.fishDrops) {
            if(this.slot.hand?.type !== '낚싯대') {
                this.sendMessage('[ 낚싯대를 들고 있지 않습니다! ]');
                return false;
            }

            state.catchingFish = location.fishDrops.getRandomFish(this.attribute.getValue(AttributeType.LUCK));
            state.waitTime = Utils.randomRange(10, 30);
            state.fishingLocation = this.location;
            this.sendMessage('[ 낚싯대를 던졌습니다! 입질이 올 때까지 기다려주세요. ]');
            return true;
        }
        return false;
    }

    pullFish() {
        let state = this.fishingState;
        let now = Date.now();
        if(state.catchingFish && state.waitTime <= 0 && state.remainTime > 0) {
            if(now - state.latestPull < (1 / this.attribute.getValue(AttributeType.ATTACK_SPEED)) * 1000) {
                this.sendMessage('[ 당기는 시간이 끝나지 않았습니다! ]');
                return false;
            }
        }
        state.latestPull = now;
        let fish = state.catchingFish;
        
        if(this.slot.hand?.durability > 0)
            this.slot.hand.durability -= fish.neededStrength * 0.05 + 1;
        
        if(fish.neededStrength > this.stat.strength && fish.grade > 0) {
            this.sendMessage('[ 물고기의 힘이 너무 쌥니다! 물고기가 도망갔습니다... ]');
            state.catchingFish = null;
            state.remainTime = 0;
            return false;
        }

        let chance = fish.grade === 0 ? 1 : Math.min((1 - fish.neededStrength / this.stat.strength) + 0.1, 0.4);
        if(Math.random() < chance) {
            let fishItem = fish.getItem();
            let rewards = [];
            let gettingExp = fish.exp * this.attribute.getValue(AttributeType.EXP_EFFCIENECY) / 100;
            
            rewards.push(`${fishItem.getName()} x1`);
            this.inventory.addItem(fishItem, 1);
            rewards.push(`${gettingExp.toFixed(0)} Exp`);
            this.exp += gettingExp;
            
            this.sendMessage(`[ [${fish.getGradeName()}] ${fish.name}(을)를 낚았습니다! ]\n\n` +
                `▌ 보상\n` +
                rewards.map(r => '   ▸ ' + r).join('\n')
            );
            state.catchingFish = null;
            state.remainTime = 0;
        }
        else {
            this.sendMessage('[ 물고기가 버티고 있습니다! 계속 당기세요! ]');
        }
    }

    updateFishing(delta = Time.deltaTime) {
        let state = this.fishingState;

        if(this.slot.hand?.type !== '낚싯대' || this.location !== state.fishingLocation) {
            state.resetAll();
            this.sendMessage('[ 낚시가 종료되었습니다. ]');
            return;
        }

        if(state.catchingFish && state.waitTime > 0) {
            state.waitTime -= delta;
            if(state.waitTime <= 0) {
                state.remainTime = FishingState.REMAIN_TIME;
                this.sendMessage(`[ ${this.getName()}님, 입질이 왔습니다! 당겨주세요! ]\n` +
                    `(제한시간: ${FishingState.REMAIN_TIME}초)`);
            }
        }
        else if(state.remainTime > 0) {
            state.remainTime -= delta;
            if(state.remainTime <= 0) {
                state.catchingFish = null;
                this.sendMessage(`[ ${this.getName()}님, 물고기가 도망갔습니다... ]`);
            }
        }
    }

    getUnlockedRecipes() {
        return CraftRecipes.recipes
            .filter(r => this.unlockedRecipes.includes(r.name));
    }

    addEffect(eff) {
        if(eff.caster instanceof Player && 
            this.getLocation().zoneType === 'safe' &&
            eff.isDebuff) {
            return false;
        }
        return super.addEffect(eff);
    }

    getPartyInfo() {
        return `[ ${this.getPartyOwner().getName()}님의 파티 ]\n\n` +
            `  [파티장] ${this.getPartyOwner().getName()}\n` +
            this.getPartyOwner().getPartyMembers().map((p, i) => {
                return `  [${i + 1}][멤버] ${p.getName()}`;
            }).join('\n');
    }

    getPartyOwner() {
        Player.getPlayer(this.partyOwner) ?? this;
    }

    get partyMembers() {
        return Player.players.filter(p => p.partyOwner === this.uid);
    }

    acceptPartyInvite() {
        this.partyOwner = this.partyInviteRequest;
        this.partyInviteRequest = null;
        this.remainPartyInviteTime = 0;
    }

    denyPartyInvite() {
        this.partyInviteRequest = null;
        this.remainPartyInviteTime = 0;
    }

    leaveParty() {
        this.partyOwner = null;
    }

    kickPartyMember(name) {
        let player = Player.getPlayerByName(name);
        if(player.partyOwner === this.uid) player.partyOwner = null;
    }

    dissolveParty() {
        this.partyMembers.forEach(p => p.partyOwner = null);
    }

    inviteParty(player, remainTime = 20) {
        if(player === this) return false;
        if(this.partyOwner) return false;
        if(player.partyOwner) return false;
        if(player.partyInviteRequest) return false;
        if(player.partyMembers.length > 0) return false;
        player.partyInviteRequest = this.uid;
        player.remainPartyInviteTime = remainTime;
        return true;
    }

    get reviveTime() {
        let defaultTime = 0;
        if(this.level < 5) defaultTime = 10;
        else if(this.level < 10) defaultTime = 30;
        else if(this.level < 20) defaultTime = 60;
        else defaultTime = 60 * 5;
      
        let notoriousAddition = Math.min(Math.pow(this.notorious, 1.5) / 10, 3600 * 12) + (this.notorious > 0 ? 60 * 5: 0);
      
        return defaultTime + notoriousAddition;
    }

    onDeath() {
        super.onDeath();

        if (this.level >= 50 && this.hasEffect('심연') && this.characterClass === null) {
            this.attributes.life = this.attributes.maxLife;
            this.location = World.locations.find(loc => loc.type === 'firstClassChange').name ?? this.location;
            this.sendMessage(`[ ${this.getName()}님, 사망하셨습니다. \n` +
                '... 하지만 곧 깊은 심연에서 눈을 뜹니다. ]');
        }
        else if (this.level >= 200 && this.hasEffect('2번째 심연') && this.getCharacterClass().hasEnhancedClass) {
            this.attributes.life = this.attributes.maxLife;
            this.location = World.locations.find(loc => loc.type === 'secondClassChange').name ?? this.location;
            this.sendMessage(`[ ${this.getName()}님, 사망하셨습니다. \n` +
                '.... 그렇기에.. 곧 깊은 심연에서 눈을 뜹니다 . ]');
        }
        else {
            if (this.latestAbuser instanceof Player && this.latestAbuser !== this 
                && Date.now() - this.latestAbused < 1000 * 10 && this.getLocation().zoneType === 'neutral') {
                this.latestAbuser.log.addLog(Player.Log.KILLED_PLAYER_COUNT);
                this.latestAbuser.notorious += 25;
            }
            if (this.notorious >= 100) {
                let location = this.getLocation();
                let slotKeys = EquipmentSlot.slotNames;
                let slotLen = slotKeys.length;
                let dropCount = Math.min(Math.floor(this.notorious / 150) + 2, 50)
                for (let i = 0; i < dropCount; i++) {
                    let nonEmptyLen = this.inventory.contents.filter(is => is).length;
                    if (Math.random() < slotLen / (slotLen + nonEmptyLen)) {
                        let slotKey = slotKeys[Utils.randomRangeInt(0, slotLen - 1)];
                        let item = this.slot[slotKey];
                        location.droppedItems.addItem(item, 1);
                        this.slot[slotKey] = null;
                    }
                    else {
                        this.dropItem(this.inventory.contents
                            .map((is, idx) => is ? idx : -1)
                            .filter(idx => idx !== -1)[Utils.randomRangeInt(0, nonEmptyLen - 1)], 1);
                    }
                }
            }
            this.deadTime = this.getReviveTime();
            this.sendMessage(`[ ${this.getName()}님, 사망하셨습니다. \n` +
                new DateFormat(new Date(this.deadTime)).format('h시간 mm분 ss초') + ' 후에 부활합니다. ]');
        }
    }

    getSkill(name) {
        return this.skills.find(s => s.name === name);
    }

    getSkillInfo(name) {
        this.getSkill(name)?.getSkillInfo(this) ?? null;
    }

    getSkillListInfo() {
        return `[ ${this.name}님의 스킬 목록입니다. ]${Utils.blank}\n\n` +
            this.skills.map(skill => {
                return skill + '\n' +
                    `레벨   ${skill.level}\n` +
                    '숙련도   ' + Utils.progressBar(6, skill.prof, skill.maxProf, 'percent');
            }).join('\n\n'); 
    }

    runSkill(skill) {
        if (!this.canUseSkill && !skill.isPassive) {
            this.sendMessage(`[ ${this.cannotUseSkillMessage ?? '스킬을 사용할 수 없습니다.'} ]`);
            return false;
        }
        skill.takeCost(this);
        skill.runSkill(this);
        return true;
    }

    getUnlockedRecipesInfo () {
        return this.getUnlockedRecipes().map(r => r.getRecipeInfo()).join('\n────────────\n');
    }

    getTitleListInfo = function () {
        return this.titles.map((titleName, i) => {
            let title = Titles.getTitle(titleName);
            return `[${i + 1}]${titleName === this.title ? '[사용중]' : ''} [ ${titleName} ]\n` +
                ' - ' + (title.option?.getDescription() ?? '옵션이 없는 칭호입니다.');
        }).join('\n─────────────────\n');
    }

    get isTalking() {
        return this.getLocation().npcs.some(npc => npc.conversationPartner === this);
    }

    loggedFreeUpdate(delta = Time.deltaTime) {
        if(this.notorious > 0) this.notorious -= 0.003 * Time.deltaTime;
        else this.notorious = 0;
    }

    earlyUpdate(delta = Time.deltaTime) {
        super.earlyUpdate(delta);
        let now = Date.now();
        let loc = this.getLocation();

        this.inventory.update(delta);
        
        if(this.deadTime > 0) this.teleport(this.spawn);
        if(this.currentTarget.location !== this.location) this.currentTarget = null;
        if(now - this.latestPing > 1000 * 10 && 
            now - this.latestLoggedInTime > 1000 * 60 * 5 && this.isAlive()) 
            this.isLoggedIn = false;

        this.attribute.multiplyValue(AttributeType.EXP_EFFCIENECY, Math.max(0.3, 1 - Math.sqrt(this.level) / 50));

        Title.list.forEach(title => {
            if(title.canObtain(this) && !this.titles.includes(title.name)) {
                this.sendMessage(`[ 칭호 [ ${title.name} ] (을)를 획득하셨습니다! ]\n` +
                    ` ${Utils.prefix}칭호 목록 으로 확인해주세요.`);
                this.titles.push(title.name);
            }
        });

        CraftRecipe.list.forEach(recipe => {
            if(recipe.canUnlock(this) && !this.unlockedRecipes.includes(recipe.name)) {
                this.sendMessage(`[ 제작법 [ ${recipe.name} ] (이)가 해금되었습니다! ]\n` +
                    ` ${Utils.prefix}제작법 으로 확인해주세요.`);
                this.titles.push(recipe.name);
            }
        });

        if(this.partyInviteRequest && (this.remainPartyInviteTime -= delta) <= 0) {
            Player.sendGroupMessage([this, Player.getPlayer(this.partyInviteRequest)], 
                '[ 파티 요청이 만료되었습니다. ]');
        }

        let beforeLv = this.level;
        while(this.exp >= this.maxExp) {
            this.exp -= this.maxExp;
            this.level++;
            this.statPoint += 3;
        }
        if(beforeLv < this.level) {
            this.sendMessage('───────────────\n' +
            `  ${this.getName()}님이 [ LEVEL UP ] 하셨습니다!\n` +
            `  Lv.${beforeLv}  ►  Lv.${this.level}\n` +
            '───────────────');
        }

        if(this.level >= 50 && !this.characterClass && this.isAlive() && 
            !this.hasEffect(EffectType.ABYSS) && loc.type !== 'firstClassChange') {
            this.addEffect(new Effect(EffectType.ABYSS, 1, 30, this));
            this.sendMessage('[ 알 수 없는 거대한 심연이 당신을 아득한 심연으로 데려가기 시작합니다.....! ]');
        }

        let characterClass = this.getCharacterClass();
        if(this.level >= 200 && characterClass.hasEnhancedClass &&
            !this.hasEffect(EffectType.SECOND_ABYSS) && loc.type !== 'secondClassChange' &&
            characterClass.enhancedClass.canChangeClass(this)) {
            this.addEffect(new Effect(EffectType.SECOND_ABYSS, 1, 30, this));
            this.sendMessage('[ 어디인가 익숙한 심연이 당신의 기억을 ??시킵니다....! ]');
        }
    }

    getTitle() {
        return Title.getTitle(this.title);
    }

    get worldMoveSpeed() {
        return this.attribute.getValue(AttributeType.MOVE_SPEED) / 15;
    }

    cancelMove() {
        this.moveTarget = null;
        this.remainMoveDistance = 0;
    }

    teleport(name) {
        if(World.getLocation(name)) {
            this.location = name;
            this.cancelMove();
        }
    }

    update(delta = Time.deltaTime) {
        super.update(delta);

        let loc = this.getLocation();
        if(this.moveTarget) {
            let moveTargetLoc = World.getLocation(this.moveTarget);
            if(!moveTargetLoc || !this.isAlive()) this.cancelMove();
            else if((this.remainMoveDistance -= delta) <= 0) {
                this.teleport(this.moveTarget);
            }
        }

        
    }

    get isAlive() {
        if(!this.isLoggedIn) return false;
        if(this.name === null) return false;

        return super.isAlive;
    }
}

export class FishingState {

    static REMAIN_TIME = 10;

    constructor() {
        this.resetAll();
    }

    resetAll() {
        this.catchingFish = null;
        this.waitTime = 0;
        this.remainTime = 0;
        this.latestPull = 0;
        this.fishingLocation = null;
    }
}