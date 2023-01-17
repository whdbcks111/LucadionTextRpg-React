import { sendBotMessage } from "../server";
import { AttributeType, EquipmentSlot, Stat, Attribute, Quest, Effect, Fish, Shield, EquipmentType, StatType, FishGrade, EffectType, MonsterType, Entity } from "./Internal";
import { CharacterClass } from "./Internal";
import { CraftRecipe } from "./Internal";
import { Item } from "./Internal";
import { Inventory } from "./Internal";
import { LivingEntity } from "./Internal";
import { Location, RegionType, ZoneType } from "./Internal";
import { PlayerRankingCriteria } from "./Internal";
import Utils from "./Utils";
import { World, Title, Time, Skill, SkillPreset } from "./Internal";
import fs from 'fs';
import { AttackOptions, ExtraObject, NullableString } from "../types";
import DateFormat from "./DateFormat";

export class Player extends LivingEntity {

    uid: string;
    isLoggedIn = true;
    latestLoggedInTime = 0;
    latestLoggedOutTime = 0;
    verifyCode: NullableString = null;
    verifyExpirationDate = 0;

    title: NullableString = null;
    characterClass: NullableString = null;
    gold = 0;
    notorious = 0;
    statPoint = 0;
    spawn: string;

    isUsingItem = false;
    latestPing = Date.now();
    latestChatTime = 0;
    latestAirAlert = 0;
    latestRoomName = 'main-room';
    tickMessage: NullableString = null;

    moveTarget: NullableString = null;
    remainMoveDistance = 0;

    partyOwner: NullableString = null;
    partyInviteRequest: NullableString = null;
    remainPartyInviteTime = 0;

    fishingState = new FishingState();
    log = new PlayerLog();
    inventory: Inventory;
    extras: ExtraObject = {};
    unlockedRecipes: string[] = [];
    titles: string[] = [];
    quests: Quest[] = [];
    skills: Skill[] = [];
    lateTasks: (() => void)[] = [];

    constructor(uid: string, nickname: string) {
        super(nickname);

        this.uid = uid;
        this.location = World.WORLD_SPAWN.name;
        this.spawn = this.location;
        this.inventory = new Inventory(this);
        this.giveDefaultItems();
    }

    breakEquipItem(type: EquipmentType) {
        let item = super.breakEquipItem(type);
        this.sendMessage('[ ' + item + ' (이)가 파괴되었습니다. ]');
        return item;
    }

    damage(damage: number, abuser: LivingEntity) {
        if(abuser instanceof Player && this.getLocation().zoneType === ZoneType.PEACEFUL) return false;
        super.damage(damage, abuser); 
    }

    onChat(message: string) {
        this.latestChatTime = Date.now();
        this.tickMessage = message;
    }

    fish() {
        let location = this.getLocation();
        let state = this.fishingState;
        let loc = this.getLocation();
        if (!state.catchingFish && state.waitTime <= 0 && loc.fishDrops) {
            if (this.slot.hand?.type !== '낚싯대') {
                this.sendMessage('[ 낚싯대를 들고 있지 않습니다! ]');
                return false;
            }

            state.catchingFish = loc.fishDrops.getRandomFish(this.attribute.getValue(AttributeType.LUCK));
            state.waitTime = Utils.randomRange(10, 30);
            state.fishingLocation = this.location;
            this.sendMessage('[ 낚싯대를 던졌습니다! 입질이 올 때까지 기다려주세요. ]');
            return true;
        }
        this.sendMessage(location.fishDrops ?
            '[ 물고기를 이미 잡고 있습니다. ]' : '[ 낚시를 할 수 있는 장소가 아닙니다. ]');
        return false;
    }

    pullFish(): boolean {
        let state = this.fishingState;
        let now = Date.now();
        if(state.catchingFish && state.waitTime <= 0 && state.remainTime > 0) {
            if(now - state.latestPull < (1 / this.attribute.getValue(AttributeType.ATTACK_SPEED)) * 1000) {
                this.sendMessage('[ 당기는 시간이 끝나지 않았습니다! ]');
                return false;
            }
        }
        state.latestPull = now;
        const fish = state.catchingFish;

        if(!fish) return false;
        
        if(this.slot.hand?.durability)
            this.slot.hand.durability -= fish.neededStrength * 0.05 + 1;
        
        if(fish.neededStrength > this.stat.getStat(StatType.STRENGTH) && fish.grade !== FishGrade.GARBAGE) {
            this.sendMessage('[ 물고기의 힘이 너무 쌥니다! 물고기가 도망갔습니다... ]');
            state.catchingFish = null;
            state.remainTime = 0;
            return false;
        }

        let chance = fish.grade === FishGrade.GARBAGE ? 
            1 : Math.min((1 - fish.neededStrength / this.stat.getStat(StatType.STRENGTH)) + 0.1, 0.4);
        if(Math.random() < chance) {
            let fishItem = fish.item;
            if(!fishItem) return false;
            let rewards = [];
            let gettingExp = fish.exp * this.attribute.getValue(AttributeType.EXP_EFFCIENECY) / 100;
            
            rewards.push(`${fishItem.getName()} x1`);
            this.inventory.addItem(fishItem, 1);
            rewards.push(`${gettingExp.toFixed(0)} Exp`);
            this.exp += gettingExp;
            
            this.sendMessage(`[ [${fish.gradeName}] ${fish.name}(을)를 낚았습니다! ]\n\n` +
                `▌ 보상\n` +
                rewards.map(r => '   ▸ ' + r).join('\n')
            );
            state.catchingFish = null;
            state.remainTime = 0;
        }
        else {
            this.sendMessage('[ 물고기가 버티고 있습니다! 계속 당기세요! ]');
        }
        return true;
    }

    attack(victim: Entity, options: AttackOptions = {}): boolean {
        if (!options.isOptionedAttack) {
            let item = this.slot.hand;
            if (item?.preset?.attack) {
                options.isOptionedAttack = true;
                item.preset.attack(this, victim, options);
                return true;
            }
        }
        return super.attack(victim, options);
    }

    updateFishing() {
        let state = this.fishingState;

        if(state.fishingLocation !== null && (this.slot.hand?.type !== '낚싯대' || this.location !== state.fishingLocation)) {
            state.resetAll();
            this.sendMessage('[ 낚시가 종료되었습니다. ]');
            return;
        }

        if(state.catchingFish && state.waitTime > 0) {
            state.waitTime -= Time.deltaTime;
            if(state.waitTime <= 0) {
                state.remainTime = FishingState.REMAIN_TIME;
                this.sendMessage(`[ ${this.getName()}님, 입질이 왔습니다! 당겨주세요! ]\n` +
                    `(제한시간: ${FishingState.REMAIN_TIME}초)`);
            }
        }
        else if(state.remainTime > 0) {
            state.remainTime -= Time.deltaTime;
            if(state.remainTime <= 0) {
                state.catchingFish = null;
                this.sendMessage(`[ ${this.getName()}님, 물고기가 도망갔습니다... ]`);
            }
        }
    }

    getUnlockedRecipes() {
        let unlocked = new Set(this.unlockedRecipes);
        return CraftRecipe.list
            .filter(r => unlocked.has(r.name));
    }

    addEffect(eff: Effect) {
        if(eff.caster instanceof Player && 
            this.getLocation().zoneType === ZoneType.PEACEFUL &&
            eff.isDebuff) {
            return false;
        }  
        return super.addEffect(eff);
    }

    getPartyInfo() {
        return `[ ${this.getPartyOwner().getName()}님의 파티 ]\n\n` +
            `  [파티장] ${this.getPartyOwner().getName()}\n` +
            this.getPartyOwner().partyMembers.map((p, i) => {
                return `  [${i + 1}][멤버] ${p.getName()}`;
            }).join('\n');
    }

    getPartyOwner() {
        return this.partyOwner ? Player.getPlayer(this.partyOwner) ?? this : this;
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

    kickPartyMember(index: number) {
        let player = this.partyMembers[index];
        if(player) player.partyOwner = null;
        return player;
    }

    dissolveParty() {
        this.partyMembers.forEach(p => p.partyOwner = null);
    }

    inviteParty(player: Player, remainTime = 20) {
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

        if (this.level >= 50 && this.hasEffect(EffectType.ABYSS) && this.characterClass === null) {
            this.life = this.maxLife;
            this.location = World.FIRST_CLASS_CHANGE.name ?? this.location;
            this.sendMessage(`[ ${this.getName()}님, 사망하셨습니다. \n` +
                '... 하지만 곧 깊은 심연에서 눈을 뜹니다. ]');
        }
        else if (this.level >= 200 && this.hasEffect(EffectType.SECOND_ABYSS) && this.getCharacterClass()?.hasEnhancedClass) {
            this.life = this.maxLife;
            this.location = World.SECOND_CLASS_CHANGE.name ?? this.location;
            this.sendMessage(`[ ${this.getName()}님, 사망하셨습니다. \n` +
                '.... 그렇기에.. 곧 깊은 심연에서 눈을 뜹니다 . ]');
        }
        else {
            if (this.latestAbuser instanceof Player && this.latestAbuser !== this 
                && Date.now() - this.latestAbused < 1000 * 10 && this.getLocation().zoneType === ZoneType.NEUTRAL) {
                this.latestAbuser.log.addLog(PlayerLog.KILLED_PLAYER_COUNT);
                this.latestAbuser.notorious += 25;
            }
            if (this.notorious >= 100) {
                let location = this.getLocation();
                let slotTypes = EquipmentType.getAll();
                let slotLen = slotTypes.length;
                let dropCount = Math.min(Math.floor(this.notorious / 150) + 2, 50)
                for (let i = 0; i < dropCount; i++) {
                    let nonEmptyLen = this.inventory.contents.filter(is => is).length;
                    if (Math.random() < slotLen / (slotLen + nonEmptyLen)) {
                        let slotKey = slotTypes[Utils.randomRangeInt(0, slotLen - 1)];
                        let item = this.slot.getItem(slotKey);
                        if(item) location.droppedItems.addItem(item, 1);
                        this.slot.setItem(slotKey, null);
                    }
                    else {
                        this.dropItem(this.inventory.contents
                            .map((is, idx) => is ? idx : -1)
                            .filter(idx => idx !== -1)[Utils.randomRangeInt(0, nonEmptyLen - 1)], 1);
                    }
                }
            }

            this.deadTime = this.reviveTime;
            this.sendMessage(`[ ${this.getName()}님, 사망하셨습니다. \n` +
                Utils.formatTime('hh시간 mm분 ss초', this.deadTime * 1000)
                    .replace('00시간 ', '')
                    .replace('00분 ', '')
                + ' 후에 부활합니다. ]');
        }
    }

    getSkill(name: string) {
        return this.skills.find(s => s.name === name);
    }

    getSkillInfo(name: string) {
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

    runSkill(skill: Skill) {
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

    getTitleListInfo () {
        return this.titles.map((titleName, i) => {
            let title = Title.getTitle(titleName);
            if(!title) return;
            return `[${i + 1}]${titleName === this.title ? '[사용중]' : ''} [ ${titleName} ]\n` +
                ' - ' + title.description;
        }).join('\n─────────────────\n');
    }

    get isTalking() {
        return this.getLocation().npcs.some(npc => npc.target === this);
    }

    loggedFreeUpdate() {
        if(this.notorious > 0) this.notorious -= 0.003 * Time.deltaTime;
        else this.notorious = 0;
    }

    earlyUpdate() {
        super.earlyUpdate();
        let now = Date.now();
        let loc = this.getLocation();

        this.inventory.update();
        
        if(this.deadTime > 0) this.teleport(this.spawn);
        if(this.currentTarget?.location !== this.location) this.currentTarget = null;
        if(now - this.latestPing > 1000 * 10 && 
            now - this.latestLoggedInTime > 1000 * 60 * 5 && this.isAlive) 
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
                this.unlockedRecipes.push(recipe.name);
            }
        });

        if(this.partyInviteRequest && (this.remainPartyInviteTime -= Time.deltaTime) <= 0) {
            let players: Player[] = [this];
            let requester = Player.getPlayer(this.partyInviteRequest);
            if(requester) players.push(requester);
            Player.sendGroupMessage(players, 
                '[ 파티 요청이 만료되었습니다. ]');
        }

        let beforeLv = this.level;
        while(this.exp >= this.maxExp) {
            this.exp -= this.maxExp;
            this.level++;
            this.statPoint += 3;
        }
        if (beforeLv < this.level) {
            this.sendMessage('───────────────\n' +
                `  ${this.getName()}님이 [ LEVEL UP ] 하셨습니다!\n` +
                `  Lv.${beforeLv}  ►  Lv.${this.level}\n` +
                '───────────────');
        }

        if(this.level >= 50 && !this.characterClass && this.isAlive && 
            !this.hasEffect(EffectType.ABYSS) && loc.regionType !== RegionType.FIRST_CLASS_CHANGE) {
            this.addEffect(new Effect(EffectType.ABYSS, 1, 30, this));
            this.sendMessage('[ 알 수 없는 거대한 심연이 당신을 아득한 심연으로 데려가기 시작합니다.....! ]');
        }

        let characterClass = this.getCharacterClass();
        if(this.level >= 200 && 
            characterClass?.hasEnhancedClass &&
            !this.hasEffect(EffectType.SECOND_ABYSS) &&
            loc.regionType !== RegionType.SECOND_CLASS_CHANGE &&
            characterClass.enhancedClass?.canChangeClass && 
            characterClass.enhancedClass.canChangeClass(this)) {
            this.addEffect(new Effect(EffectType.SECOND_ABYSS, 1, 30, this));
            this.sendMessage('[ 어딘가 익숙한 심연이 당신의 기억을 ??시킵니다....! ]');
        }
    }

    getTitle() {
        if(this.title == null) return null;
        return Title.getTitle(this.title) ?? null;
    }

    get worldMoveSpeed() {
        return this.attribute.getValue(AttributeType.MOVE_SPEED) / 15;
    }

    cancelMove() {
        this.moveTarget = null;
        this.remainMoveDistance = 0;
    }

    teleport(name: string) {
        if(World.getLocation(name)) {
            this.location = name;
            this.cancelMove();
        }
    }

    update() {
        super.update();

        let now = Date.now();
        let loc = this.getLocation();
        if(this.moveTarget) {
            let moveTargetLoc = World.getLocation(this.moveTarget);
            if(!moveTargetLoc || !this.isAlive) this.cancelMove();
            else if((this.remainMoveDistance -= Time.deltaTime * this.worldMoveSpeed) <= 0) {
                let from = this.location;
                this.teleport(this.moveTarget);
                this.onMove(from);
            }
        }
        
        SkillPreset.list.forEach(preset => {
            if(!preset.checkRealizeCondition) return;
            if(preset.checkRealizeCondition(this)) this.realizeSkill(preset.name, true);
        })

        this.skills.forEach(skill => {
            //스킬 작동 중 finish 호출 가능성, isRunning 반복 비교
            if(skill.isRunning) skill.onEarlyUpdate(this);
            if(skill.isRunning) skill.onUpdate(this);
            if(skill.isRunning) skill.onLateUpdate(this);

            if(skill.checkCondition(this)) {
                if(skill.isRunning && !skill.isPassive) 
                    this.sendMessage('[ 스킬이 이미 작동 중입니다. ]');
                else if(!skill.isCooldownEnded(this)) 
                    this.sendMessage(`[ 재사용 하기까지 ${new DateFormat(new Date(skill.getRemainCooldown(this) * 1000))
                        .format('mm분 ss초')} 남았습니다. ]`);
                else if(!skill.canTakeCost(this)) 
                    this.sendMessage(`[ ${skill.getCostFailMessage(this)} ]`);
                else if(!skill.isRunning)
                    this.runSkill(skill);
            }

            if(skill.level >= skill.maxLevel && skill.prof > Skill.MAX_PROF) skill.prof = Skill.MAX_PROF;
            if(skill.level > skill.maxLevel) skill.level = skill.maxLevel;

            let beforeLv = skill.level;
            while(skill.level < skill.maxLevel && skill.prof >= Skill.MAX_PROF) {
                skill.prof -= Skill.MAX_PROF;
                skill.level++;
            }
            if(beforeLv < skill.level) { 
                this.sendMessage('───────────────\n' +
                    `  ${this.getName()}님의 스킬 ${skill.level}(이)가 [ LEVEL UP ] 하셨습니다!\n` +
                    `  Lv.${beforeLv}  ►  Lv.${skill.level}\n` +
                    '───────────────');
            }
        });

        let characterClass = this.getCharacterClass();
        if(characterClass?.trigger?.onUpdate) characterClass.trigger.onUpdate(this);

        let title = this.getTitle();
        if(title?.trigger?.onUpdate) title.trigger.onUpdate(this);

        this.quests.forEach(quest => quest.update(this));

        if(loc.regionType === RegionType.WATER) {
            this.air -= Time.deltaTime * 4;
            if(now - this.latestAirAlert > 1000 * 10) {
                this.sendMessage(`[ ${this.name}님, 산소가 부족합니다! ]\n` +
                    '산소  ' + Utils.progressBar(7, this.air, this.maxAir, 'percent'));
            }
        }
        else this.air += Time.deltaTime * 20;
    }

    lateUpdate() {
        super.lateUpdate();
        
        this.updateFishing();
        this.tickMessage = null;

        this.lateTasks.forEach(task => task());
        this.lateTasks = [];
    }

    registerLateTask(task: () => void) {
        this.lateTasks.push(task);
    }

    getCharacterClass() {
        return this.characterClass ? 
            CharacterClass.getCharacterClass(this.characterClass): null;
    }

    onHit(victim: Entity) {
        super.onHit(victim);

        let characterClass = this.getCharacterClass();
        if(characterClass?.trigger?.onHit) characterClass.trigger.onHit(this, victim);

        let title = this.getTitle();
        if(title?.trigger?.onHit) title.trigger.onHit(this, victim);

        this.quests.forEach(quest => {
            let preset = quest.preset;
            if(preset?.trigger?.onHit) preset.trigger.onHit(this, victim);
        });
    }

    changeClass(className: string, doSendMessage = true) {
        let characterClass = CharacterClass.getCharacterClass(className);
        if(!characterClass) return false;
        
        this.characterClass = className;
        characterClass.onChangeClass(this);
        if(doSendMessage) this.sendMessage(`[ 직업 [${className}] (으)로 전직하셨습니다! ]`);
    }

    onHitted(attacker: Entity) {
        super.onHitted(attacker);

        let loc = this.getLocation();

        let characterClass = this.getCharacterClass();
        if(characterClass?.trigger?.onHitted) characterClass.trigger.onHitted(this, attacker);

        let title = this.getTitle();
        if(title?.trigger?.onHit) title.trigger.onHitted(this, attacker);

        this.quests.forEach(quest => {
            let preset = quest.preset;
            if(preset?.trigger?.onHitted) preset.trigger.onHitted(this, attacker);
        });
    }

    realizeSkill(name: string, doSendMessage = false) {
        let preset = SkillPreset.getSkillPreset(name);
        if(!preset || this.skills.some(skill => skill.name === name)) return;

        this.skills.push(new Skill(name));
        if(doSendMessage) this.sendMessage(`[ 스킬 [ ${name} ] (을)를 깨달으셨습니다! ]`);
    }

    getGettingExp(entity: Entity) {
        return entity.maxExp * this.attribute.getValue(AttributeType.EXP_EFFCIENECY) / 100;
    }

    move(target: string) {
        if(!this.canMove || !this.canWorldMove) return false;
        let from = this.getLocation();
        let to = World.getLocation(target);
        if(!to) return false;

        this.remainMoveDistance = from.getDistance(to);
        this.moveTarget = target;
    }

    onMove(from: string) {
        this.sendMessage('[ 이동을 완료했습니다. ]');
    }

    login() {
        this.isLoggedIn = true;
        this.latestLoggedInTime = Date.now();
    }

    logout() {
        this.isLoggedIn = false;                                          
        this.latestLoggedOutTime = Date.now();
    }

    get isDev() {
        return fs.readFileSync('./private/devUUID.txt').toString() === this.uid;
    }

    pickUpItem(index = 0, count = 1) {
        let loc = this.getLocation();
        if(loc.droppedItems.hasContents(index)) {
            let itemStack = loc.droppedItems.contents[index];
            if(!itemStack) return;
            let pickUpCount = Math.min(itemStack.count, count);
            this.inventory.addItem(itemStack.item, pickUpCount);
            loc.droppedItems.setItemCount(index, itemStack.count - count);
            return itemStack.asCount(pickUpCount);
        }
        return null;
    }

    dropItem(index = 0, count = 1) {
        if (this.isUsingItem) return null;
        let loc = this.getLocation();
        if (this.inventory.hasContents(index)) {
            let itemStack = this.inventory.getItemStack(index);
            if(!itemStack) return null;
            let dropCount = Math.min(itemStack.count, count);
            loc.droppedItems.addItem(itemStack.item, dropCount);
            this.inventory.setItemCount(index, itemStack.count - dropCount);
            return itemStack.asCount(dropCount);
        }
        return null;
    }

    hasQuest(name: string) {
        return this.quests.some(q => q.name === name);
    }

    addQuest(quest: Quest, doSendMessage = true) {
        if(!this.hasQuest(quest.name)) {
            this.quests.push(quest);
            if(doSendMessage) this.sendMessage(`[ 퀘스트 [${quest.name}] (을)를 받았습니다! ]`);
        }
    }

    getStatusInfo() {

        let title = this.getTitle();
        let characterClass = this.getCharacterClass();
        let noneDisplayAttrs = new Set([
            AttributeType.MAX_AIR,
            AttributeType.MAX_LIFE,
            AttributeType.MAX_WATER,
            AttributeType.MAX_FOOD,
            AttributeType.MAX_MANA,
            AttributeType.FOOD_DEPLETE,
            AttributeType.WATER_DEPLETE,
            AttributeType.INVENTORY_SPACE
        ])

        return `[ ${this.getName()}님의 스테이터스 ]${Utils.rich}` +
            '\n' +
            `레벨   ${this.level}\n` +
            `${Utils.progressBar(8, this.exp, this.maxExp, 'percent')}\n` +
            '\n' +
            `장소 ‣ ${this.location}\n` +
            (this.remainMoveDistance > 0 ?
                `이동 중 ‣ ${this.moveTarget}\n` +
                `남은 이동 거리 ‣ ${this.remainMoveDistance.toFixed(1)}m\n`
                : '') +
            `골드 ‣ ${this.gold}G\n` +
            `악명 ‣ ${this.notorious.toFixed(1)}\n` +
            `직업 ‣ ${this.characterClass ?? '☓'}\n` +
            '\n' +
            (Object.keys(this.shields).length ?
                `보호막 잔여량  ${Object.keys(this.shields)
                    .map(k => this.shields[k].amount)
                    .reduce((a, b) => a + b).toFixed(0)}\n` +
                `(최대 지속시간 ${Object.keys(this.shields)
                    .map(k => this.shields[k].duration)
                    .reduce((a, b) => Math.max(a, b)).toFixed(1)}초)\n`
                : '') +
            `생명  ${Utils.progressBar(5, this.life, this.maxLife, 'int-value')}\n` +
            `마나  ${Utils.progressBar(5, this.mana, this.maxMana, 'int-value')}\n` +
            `포만감  ${Utils.progressBar(5, this.food, this.maxFood, 'int-value')}\n` +
            `수분  ${Utils.progressBar(5, this.water, this.maxWater, 'int-value') + Utils.blank}\n` +
            '\n' +
            '► 장착 정보\n' +
            EquipmentType.getAll().map((type, idx) => {
                return `${type.displayName} ‣ ${this.slot.getItem(type) ?? '☓'}\n`;
            }).join('') +
            '\n' +
            '► 능력치\n' +
            AttributeType.getAll()
                .filter(type => !noneDisplayAttrs.has(type))
                .map(type => {
                    return `${type.displayName} ‣ ${this.attribute.getValue(type).toFixed(type.fixPosition) + type.suffix}\n`;
                }).join('') +
            `\n` +
            `► 스탯 [잔여 포인트 ${this.statPoint}개]\n` +
            `근력  ${this.stat.getStat(StatType.STRENGTH)}\n` +
            `체력  ${this.stat.getStat(StatType.VITALITY)}\n` +
            `민첩  ${this.stat.getStat(StatType.AGILITY)}\n` +
            `마법  ${this.stat.getStat(StatType.SPELL)}\n` +
            `감각  ${this.stat.getStat(StatType.SENSE)}\n` +
            '\n' +
            (characterClass ?
                `► 직업 정보 [{class}]\n` +
                `- ${characterClass.description}\n\n`: '') +
            (title ?
                `► 칭호 정보 [{title}]\n` +
                `- ${title.description}\n\n`: '') +
            this.effects.map(eff => {
                return '▌ ' + eff;
            }).join('\n');
    }

    resetStat() {
        StatType.getAll().forEach(type => {
            this.statPoint += this.stat.getStat(type);
            this.stat.setStat(type, 0);
        });
    }

    getName() {
        return (this.title ? `[${this.title}] `: '' + super.getName());
    }

    get isAlive() {
        if(!this.isLoggedIn) return false;
        if(this.name === null) return false;

        return super.isAlive;
    }

    sendMessage(msg: string) {
        if(!this.latestRoomName) return;
        sendBotMessage(this.latestRoomName, msg);
    }

    getQuestsInfo() {
        return `[ ${this.getName()}님의 퀘스트 정보 ]\n\n` +
            (this.quests.filter(q => !q.isCompleted).length ?
                this.quests.filter(q => !q.isCompleted).map(quest => {
                    let preset = quest.preset;
                    return ` ► 퀘스트[${quest.requester}] - ${quest.name}\n` +
                        `   목표  ${preset?.conditionMessage ? preset.conditionMessage : '없음'}\n` +
                        `   보상  ${preset?.rewardMessage ? preset.rewardMessage : '없음'}\n\n`;
                }).join('') : '진행 중인 퀘스트가 없습니다.\n\n'
            ) +
            '[ 완료된 퀘스트 ]\n\n' +
            this.quests.filter(q => q.isCompleted && !q.isRewarded).map(q => ' - ' + q.name).join('\n');
    }

    giveDefaultItems() {
        if (!this.slot.hand)
            this.slot.hand = Item.fromName('낡은 목검');
        else
            this.inventory.addItem(Item.fromName('낡은 목검'), 1);
        this.inventory.addItem(Item.fromName('딱딱한 빵'), 5);
        this.inventory.addItem(Item.fromName('사과'), 3);
    }

    saveData() {
        fs.writeFile(`./private/players/${this.uid}.json`, JSON.stringify(this.toDataObj(), null, 4), () => {});
    }

    toDataObj() {
        let shields: { [key: string]: Shield } = {};
        for(let key in this.shields) {
            shields[key] = this.shields[key].toDataObj();
        }

        return {
            ...this,
            latestAttackedEntity: null,
            latestAbuser: null,
            stat: this.stat.toDataObj(),
            shields,
            attribute: this.attribute.toDataObj(),
            slot: this.slot.toDataObj(),
            currentTarget: null,
            effects: this.effects.map(effect => effect.toDataObj()),
            fishingState: this.fishingState.toDataObj(),
            log: this.log.toDataObj(),
            inventory: this.inventory.toDataObj(),
            quests: this.quests.map(quest => quest.toDataObj()),
            skills: this.skills.map(skill => skill.toDataObj())
        };
    }

    static fromDataObj(obj: ExtraObject) {
        if(!obj) return null;
        let newPlayer = new Player(obj.uid, obj.name);
        
        Object.assign(newPlayer, obj);

        let newShields: { [key: string]: Shield } = {};
        for(let key in obj.shields) {
            let shield = Shield.fromDataObj(obj.shields[key]);
            if(shield) newShields[key] = shield;
        }

        newPlayer.shields = newShields;
        
        let newStat = Stat.fromDataObj(obj.stat);
        if(newStat) newPlayer.stat = newStat;

        let newAttribute = Attribute.fromDataObj(obj.attribute);
        if(newAttribute) newPlayer.attribute = newAttribute;

        let newSlot = EquipmentSlot.fromDataObj(obj.slot);
        if(newSlot) newPlayer.slot = newSlot;
        
        newPlayer.effects = obj.effects.map((effectObj: ExtraObject) => Effect.fromDataObj(effectObj));
        
        let newFishingState = FishingState.fromDataObj(obj.fishingState);
        if(newFishingState) newPlayer.fishingState = newFishingState;

        let newLog = PlayerLog.fromDataObj(obj.log);
        if(newLog) newPlayer.log = newLog;

        let newInventory = Inventory.fromDataObj(obj.inventory, newPlayer);
        if(newInventory) newPlayer.inventory = newInventory;

        newPlayer.skills = obj.skills
            .map((skillObj: ExtraObject) => Skill.fromDataObj(skillObj))
            .filter((skill: Skill | null) => skill != null);

        newPlayer.quests = obj.quests
            .map((questObj: ExtraObject) => Quest.fromDataObj(questObj))
            .filter((q: Quest | null) => q != null);;

        return newPlayer;
    }

    static saveAll() {
        Player.players.forEach(player => {
            player.saveData();
        });
    }

    static loadPlayer(uid: string) {
        let data = fs.readFileSync(`./private/players/${uid}.json`).toString();
        let newPlayer = Player.fromDataObj(JSON.parse(data));
        if(newPlayer) Player.addPlayer(newPlayer);
    }

    static loadAll() {
        let files = fs.readdirSync('./private/players/');
        for(let file of files) {
            Player.loadPlayer(file.split('.')[0]);
        }
    }

    static sendGroupMessage(players: Player[], message: string) {
        let roomSet = new Set();
        players.forEach(p => {
            if(!(p instanceof Player)) return;
            if(roomSet.has(p.latestRoomName)) return;
            
            p.sendMessage(message);
            roomSet.add(p.latestRoomName);
        })
    }

    static addPlayer(newPlayer: Player) {
        if(!(newPlayer instanceof Player)) return;
        if(Player.players.some(p => (p.name && p.name === newPlayer.name) || p.uid === newPlayer.uid)) return false;

        Player.players.push(newPlayer);
        return true;
    }

    static getPlayer(name: string) {
        return Player.players.find(p => p.name === name) ?? null;
    }

    static getPlayerByUid(uid: string) {
        return Player.players.find(p => p.uid === uid) ?? null;
    }

    static getRankingInfo(criteria = PlayerRankingCriteria.getCriteria('레벨')) {
        let sorted = Player.players
            .filter(p => p.name !== null)
            .sort((a, b) => criteria.getScore(b) - criteria.getScore(a));
        return `[ 플레이어 랭킹 순위 (${criteria.name}) ]\n\n` +
            sorted.map((player, index) => {
                return ` │ [${index + 1}위] ${player.getName()}\n` +
                    ` │ ${criteria.getMessage(player) + (index === 2 ? Utils.blank : '')}`;
            }).join('\n\n');
    }

    static saveInterval = 1000 * 60;
    static backupInterval = 1000 * 60 * 60;
    static players: Player[] = [];
}

export class PlayerLog {

    extras: ExtraObject;

    constructor() {
        this.extras = {};
    }

    addLog(key: string, count = 1) {
        this.setLog(key, this.getLog(key) + count);
    }

    setLog(key: string, count: number) {
        this.extras[key] = count;
    }

    getLog(key: string, defaultCount = 0) {
        return this.extras[key] ?? defaultCount;
    }

    toDataObj() {
        return this.extras;
    }

    static fromDataObj(obj: ExtraObject) {
        if(!obj) return null;
        let log = new PlayerLog();
        log.extras = obj;

        return log;
    }

    static CRITICAL_COUNT = 'critical_count';
    static KILLED_MONSTER_COUNT = 'killed_monster_count';
    static KILLED_PLAYER_COUNT = 'killed_player_count';
    static DESTROY_OBJECT_COUNT = 'destroy_object_count';
    static DESTROY_NAMED_OBJECT_COUNT = (name: string) => 'destroy_named_object_count(' + name + ')';
    static KILLED_TYPED_MONSTER_COUNT = (type: MonsterType) => 'killed_typed_monster_count(' + type + ')';
    static KILLED_NAMED_MONSTER_COUNT = (name: string) => 'killed_named_monster_count(' + name + ')';
    static TYPED_ATTACK_COUNT = (type: string) => 'typed_attack_count(' + type + ')';
    static ATTACK_COUNT = 'attack_count';
}

export class FishingState {

    static REMAIN_TIME = 10;

    catchingFish: Fish | null = null;
    waitTime = 0;
    remainTime = 0;
    latestPull = 0;
    fishingLocation: NullableString = null;

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

    toDataObj() {
        return {
            ...this,
            catchingFish: this.catchingFish?.toDataObj()
        }
    }

    static fromDataObj(obj: ExtraObject) {
        if(!obj) return null;
        let newState = new FishingState();
        newState.waitTime = obj.waitTime;
        newState.remainTime = obj.remainTime;
        newState.latestPull = obj.latestPull;
        newState.fishingLocation = obj.fishingLocation;
        newState.catchingFish = Fish.fromDataObj(obj.catchingFish);

        return newState;
    }
}