import { AttributeType, EquipmentSlot, Stat, Attribute, Quest, Effect, Fish, Shield, EquipmentType, StatType, FishGrade, EffectType, MonsterType, Entity, User, ChatRoomManager, ChatRoom, Trigger, Config, ChatManager, Monster, Resource, Projectile } from "../../../Internal";
import { CharacterClass } from "../../../Internal";
import { CraftRecipe } from "../../../Internal";
import { Item } from "../../../Internal";
import { Inventory } from "../../../Internal";
import { LivingEntity } from "../../../Internal";
import { RegionType, ZoneType } from "../../../Internal";
import { PlayerRankingCriteria, Utils } from "../../../Internal";
import { World, Title, Time, Skill, SkillPreset, TimeFormat } from "../../../Internal";
import fs from 'graceful-fs';
import { AttackOptions, ExtraObject, MessageComponent, NullableString } from "../../../../types";
import { ComponentBuilder } from "../../../server/chat/ComponentBuilder";
import { saveJson } from "../../../util/JsonDataBase";

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
    karma = 0;
    statPoint = 0;
    spawn: string;

    ping = 0;
    latestPing = Date.now();
    latestChatTime = 0;
    latestAirAlert = 0;
    tickMessage: NullableString = null;
    tickMessageId: NullableString = null;
    oneTimeTriggers: Trigger[] = [];

    actionBars: [string, MessageComponent, number][] = [];

    moveInfoId: NullableString = null;
    moveTarget: NullableString = null;
    remainMoveDistance = 0;
    moveDistance = 0;
    moveInfoTimer = 0;

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

    constructor(uid: string, nickname: string) {
        super(nickname);

        this.uid = uid;
        this.location = World.WORLD_SPAWN.name;
        this.spawn = this.location;
        this.inventory = new Inventory(this);
        this.giveDefaultItems();
    }

    showActionBar(comp: MessageComponent, time = 0.5, key = '_') {
        const idx = this.actionBars.findIndex(a => a[0] === key);
        const v: [string, MessageComponent, number] = [key, comp, time];
        if(idx !== -1) {
            this.actionBars[idx] = v;
        }
        else this.actionBars.push(v);
    }
    
    get isUsingItem() {
        return this.inventory.delayedTasks.length > 0;
    }

    setLevel(level: number) {
        const expRatio = this.exp / this.maxExp;
        if(level > this.level) {
            this.statPoint += (level - this.level) * 3;
            this.level = level;
        }
        else if(level < this.level) {
            const point = (this.level - level) * 3;
            let remainPoint = point;
            this.level = level;
            if(this.statPoint > remainPoint) this.statPoint -= remainPoint;
            else {
                remainPoint -= this.statPoint;
                this.statPoint = 0;

                const types = StatType.getAll();
                let totalStat = 0;
                for(let type of types)
                    totalStat += this.stat.getStat(type);

                for(let type of types) {
                    const amount = Math.round(point * (this.stat.getStat(type) / Math.max(1, totalStat)));
                    this.stat.addStat(type, -amount);
                    remainPoint -= amount;
                }

                if(remainPoint <= 0) this.stat.addStat(StatType.VITALITY, -remainPoint);
                else {
                    let i = 0, save = true;
                    while(remainPoint > 0) {
                        if(i % types.length === 0) {
                            if(!save) break;
                            save = false;
                        }
                        let type = types[i++ % types.length];
                        if(this.stat.getStat(type) > 0) {
                            this.stat.addStat(type, -1);
                            save = true;
                            remainPoint--;
                        }
                    }
                }
            }
            this.exp = this.maxExp * expRatio;
        }
    }

    changeName(name: string) {
        if(Player.cannotUseNickname(name)) return;
        this.name = name;
        const room = ChatRoomManager.getRoom(this.uid);
        if(room) room.name = name;
    }

    registerTrigger(trigger: Trigger) {
        this.oneTimeTriggers.push(trigger);
    }

    breakEquipItem(type: EquipmentType) {
        let item = super.breakEquipItem(type);
        this.sendRawMessage('[ ' + item + ' (이)가 파괴되었습니다. ]');
        return item;
    }

    damage(damage: number, abuser: LivingEntity | null = null) {
        if(abuser instanceof Player && this.getLocation().zoneType === ZoneType.PEACEFUL) return false;
        super.damage(damage, abuser); 
    }

    onChat(message: string, id: string) {
        this.latestChatTime = Date.now();
        this.tickMessage = message;
        this.tickMessageId = id;
    }

    fish() {
        let location = this.getLocation();
        let state = this.fishingState;
        let loc = this.getLocation();
        if (!state.catchingFish && state.waitTime <= 0 && loc.fishDrops) {
            if (this.slot.hand?.type !== '낚싯대') {
                this.sendRawMessage('[ 낚싯대를 들고 있지 않습니다! ]');
                return false;
            }

            state.catchingFish = loc.fishDrops.getRandomFish(this.attribute.getValue(AttributeType.LUCK));
            state.waitTime = Utils.randomRange(10, 30);
            state.fishingLocation = this.location;
            this.sendRawMessage('[ 낚싯대를 던졌습니다! 입질이 올 때까지 기다려주세요. ]');
            return true;
        }
        this.sendRawMessage(location.fishDrops ?
            '[ 물고기를 이미 잡고 있습니다. ]' : '[ 낚시를 할 수 있는 장소가 아닙니다. ]');
        return false;
    }

    pullFish(): boolean {
        let state = this.fishingState;
        let now = Date.now();
        if(state.waitTime > 0) {
            this.sendRawMessage('[ 아직 입질이 오지 않았습니다... 낚시가 종료되었습니다. ]');
            state.resetAll();
            return false;
        }
        if(state.catchingFish && state.waitTime <= 0 && state.remainTime > 0) {
            if(now - state.latestPull < (1 / this.attribute.getValue(AttributeType.ATTACK_SPEED)) * 1000) {
                this.sendRawMessage('[ 당기는 시간이 끝나지 않았습니다! ]');
                return false;
            }
        }
        state.latestPull = now;
        const fish = state.catchingFish;

        if(!fish) return false;
        
        if(this.slot.hand?.durability)
            this.slot.hand.durability -= fish.neededStrength * 0.05 + 1;
        
        if(fish.neededStrength > this.stat.getStat(StatType.STRENGTH) && fish.grade !== FishGrade.GARBAGE) {
            this.sendRawMessage('[ 물고기의 힘이 너무 쌥니다! 물고기가 도망갔습니다... ]');
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
            
            this.sendRawMessage(`[ [${fish.gradeName}] ${fish.name}(을)를 낚았습니다! ]\n\n` +
                `▌ 보상\n` +
                rewards.map(r => '   ▸ ' + r).join('\n')
            );
            state.catchingFish = null;
            state.remainTime = 0;
        }
        else {
            this.sendRawMessage('[ 물고기가 버티고 있습니다! 계속 당기세요! ]');
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
            this.sendRawMessage('[ 낚시가 종료되었습니다. ]');
            return;
        }

        if(state.catchingFish && state.waitTime > 0) {
            state.waitTime -= Time.deltaTime;
            if(state.waitTime <= 0) {
                state.remainTime = FishingState.REMAIN_TIME;
                this.sendRawMessage(`[ ${this.getName()}님, 입질이 왔습니다! 당겨주세요! ]\n` +
                    `(제한시간: ${FishingState.REMAIN_TIME}초)`);
            }
        }
        else if(state.remainTime > 0) {
            state.remainTime -= Time.deltaTime;
            if(state.remainTime <= 0) {
                state.catchingFish = null;
                this.sendRawMessage(`[ ${this.getName()}님, 물고기가 도망갔습니다... ]`);
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
        return this.partyOwner ? Player.getPlayerByUid(this.partyOwner) ?? this : this;
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
      
        let notoriousAddition = Math.min(Math.pow(this.karma, 1.5) / 10, 3600 * 12) + (this.karma > 0 ? 60 * 5: 0);
      
        return defaultTime + notoriousAddition;
    }

    onDeath() {
        if (this.latestAbuser instanceof Player && this.latestAbuser !== this 
            && Date.now() - this.latestAbused < 1000 * 10 && this.getLocation().zoneType === ZoneType.NEUTRAL) {
            this.latestAbuser.log.addLog(PlayerLog.KILLED_PLAYER_COUNT);
            this.latestAbuser.karma += 25;
        }
        if (this.karma >= 100) {
            let location = this.getLocation();
            let slotTypes = EquipmentType.getAll();
            let slotLen = slotTypes.length;
            let dropCount = Math.min(Math.floor(this.karma / 150) + 2, 50)
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

        const applyDeathPenalty = this.level > 50;

        this.deadTime = this.reviveTime;
        this.sendRawMessage(`[ ${this.getName()}님, 사망하셨습니다.\n` + 
            (applyDeathPenalty ? `사망 패널티가 부과됩니다. (경험치 하락)\n` : '') +
            new TimeFormat(this.deadTime * 1000)
                .useUntilDays()
                .format('d일 h시간 m분 s초')
                .replace(/^0일 /, '')
                .replace(/^0시간 /, '')
                .replace(/^0분 /, '')
            + ' 후에 부활합니다. ]');

            
        if(applyDeathPenalty) {
            let beforeLv = this.level;
            this.exp -= this.maxExp * 0.22;

            if(this.latestAbuser instanceof Monster) {
                let monster = this.latestAbuser as Monster;
                if(monster.level > this.level) {
                    this.exp -= this.maxExp * (0.2 + 2 * (monster.level / this.level - 1));
                }
            }

            let stack = 0;
            while(this.exp < 0 && stack < this.level - 50) {
                this.exp += this.maxExp;
                stack++;
            }
            this.setLevel(this.level - stack);

            if(beforeLv > this.level) {
                this.sendMessage(ComponentBuilder.message([
                    ComponentBuilder.blockText(`${this.getName()}님의 레벨이 하락했습니다.\n` +
                        `Lv.${beforeLv}  ►  Lv.${this.level}\n`, {
                            padding: '10px 15px',
                            borderBlock: '2px solid #7744aa',
                            textAlign: 'center'
                        })
                ]));
            }
        }
    }

    getSkill(name: string) {
        return this.skills.find(s => s.name === name);
    }

    getSkillInfo(name: string) {
        this.getSkill(name)?.getSkillInfo(this) ?? null;
    }

    getSkillListInfo() {
        return ComponentBuilder.message([
            ComponentBuilder.text(`[ ${this.name}님의 스킬 목록입니다. ]`),
            ComponentBuilder.hidden([ComponentBuilder.embed([
                ComponentBuilder.join(this.skills.map(skill => {
                    return ComponentBuilder.message([
                        ComponentBuilder.text(skill + '\n' +
                            `레벨   ${skill.level}\n` +
                            '숙련도   '),
                        ComponentBuilder.progressBar(skill.prof, skill.maxProf, 'percent', 'white', '100px')
                    ]);
                }), ComponentBuilder.text('\n\n'))
            ])])
        ]);
    }

    runSkill(skill: Skill) {
        if (!this.canUseSkill && !skill.isPassive) {
            this.sendRawMessage(`[ ${this.cannotUseSkillMessage ?? '스킬을 사용할 수 없습니다.'} ]`);
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

    static get isHotTime() {
        let date = new Date();
        let koreaNow = date.getTime() + date.getTimezoneOffset() * 60 * 1000 + 9 * 60 * 60 * 1000;
        let hour = new Date(koreaNow).getHours();
        return 21 <= hour || hour <= 3;
    }

    loggedFreeUpdate() {
        if(this.karma > 0) this.karma -= 0.003 * Time.deltaTime;
        else this.karma = 0;
    }

    earlyUpdate() {
        super.earlyUpdate();
        let now = Date.now();
        let loc = this.getLocation();
        
        if(this.deadTime > 0) this.teleport(this.spawn);
        if(this.currentTarget?.location !== this.location) this.currentTarget = null;
        if(now - this.latestPing > 1000 * 10 && 
            now - this.latestLoggedInTime > 1000 * 60 * 5 && this.isAlive) 
            this.isLoggedIn = false;

        let expMultiplier = 1;
        if(this.level >= 2500) expMultiplier = 0.4;
        else if(this.level >= 1500) expMultiplier = 0.6;
        else if(this.level >= 1000) expMultiplier = 0.25;
        else if(this.level >= 700) expMultiplier = 0.29;
        else if(this.level >= 300) expMultiplier = 0.3;
        else if(this.level >= 295) expMultiplier = 0.1;
        else if(this.level >= 250) expMultiplier = 0.35;
        else if(this.level >= 200) expMultiplier = 0.39;
        else if(this.level >= 190) expMultiplier = 0.2;
        else if(this.level >= 150) expMultiplier = 0.4;
        else if(this.level >= 90) expMultiplier = 0.45;
        else if(this.level >= 50) expMultiplier = 0.5;

        if(Player.isHotTime) expMultiplier *= 2;

        this.attribute.multiplyValue(AttributeType.EXP_EFFCIENECY, expMultiplier);

        Title.list.forEach(title => {
            if(title.canObtain(this) && !this.titles.includes(title.name)) {
                this.sendRawMessage(`[ 칭호 [ ${title.name} ] (을)를 획득하셨습니다! ]\n` +
                    ` ${Utils.PREFIX}칭호 목록 으로 확인해주세요.`);
                this.titles.push(title.name);
            }
        });

        CraftRecipe.list.forEach(recipe => {
            if(recipe.canUnlock(this)) {
                this.sendRawMessage(`[ 제작법 [ ${recipe.name} ] (이)가 해금되었습니다! ]\n` +
                    ` ${Utils.PREFIX}제작법 으로 확인해주세요.`);
                this.unlockedRecipes.push(recipe.name);
            }
        });

        if(this.partyInviteRequest && (this.remainPartyInviteTime -= Time.deltaTime) <= 0) {
            let players: Player[] = [this];
            let requester = Player.getPlayer(this.partyInviteRequest);
            if(requester) players.push(requester);
            Player.sendGroupRawMessage(players, 
                '[ 파티 요청이 만료되었습니다. ]');
            this.partyInviteRequest = null;
        }

        let beforeLv = this.level;
        while(this.exp >= this.maxExp) {
            this.exp -= this.maxExp;
            this.setLevel(this.level + 1);
        }
        if (beforeLv < this.level) {
            this.sendMessage(ComponentBuilder.message([
                ComponentBuilder.blockText(`${this.getName()}님이 [ LEVEL UP ] 하셨습니다!\n` +
                    `Lv.${beforeLv}  ►  Lv.${this.level}\n`, {
                        padding: '10px 15px',
                        borderBlock: '2px solid #FFEE77',
                        textAlign: 'center'
                    })
            ]));
        }

        if(this.level >= 20 && !this.characterClass && this.isAlive && 
            !this.hasEffect(EffectType.ABYSS) && loc.regionType !== RegionType.FIRST_CLASS_CHANGE) {
            this.addEffect(new Effect(EffectType.ABYSS, 1, 30, this));
            this.sendRawMessage('[ 알 수 없는 거대한 심연이 당신을 아득한 심연으로 데려가기 시작합니다.....! ]');
        }

        let characterClass = this.getCharacterClass();
        if(this.level >= 200 && 
            characterClass?.hasEnhancedClass &&
            !this.hasEffect(EffectType.SECOND_ABYSS) &&
            loc.regionType !== RegionType.SECOND_CLASS_CHANGE &&
            characterClass.enhancedClass?.canChangeClass && 
            characterClass.enhancedClass.canChangeClass(this)) {
            this.deadTime = 0;
            this.addEffect(new Effect(EffectType.SECOND_ABYSS, 1, 30, this));
            this.sendRawMessage('[ 어딘가 익숙한 심연이 당신의 기억을 ??시킵니다....! ]');
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
        if(World.isValidLocationName(name)) {
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
            else {
                const comp = ComponentBuilder.texts([
                    `[ ${this.location}   >   ${this.moveTarget} ]\n`,
                    ComponentBuilder.progressBar(this.moveDistance - this.remainMoveDistance, 
                        this.moveDistance, 'int-value', 'white', '150px')
                ]);
                this.showActionBar(comp, 0.5, 'moving');
            }
        }

        if(this.isAlive && now - this.latestChatTime > 1000 * 60 * 10) {
            this.logout();
        }

        const removeActionBarKeys: Set<string> = new Set();
        this.actionBars.forEach(a => {
            if((a[2] -= Time.deltaTime) <= 0) removeActionBarKeys.add(a[0]);
        });
        this.actionBars = this.actionBars.filter(a => !removeActionBarKeys.has(a[0]));
        
        SkillPreset.list.forEach(preset => {
            if(!preset.checkRealizeCondition) return;
            if(preset.checkRealizeCondition(this)) this.realizeSkill(preset.name, true);
        })

        this.skills.forEach(skill => {
            //스킬 작동 중 finish 호출 가능성, isRunning 반복 비교
            if(skill.isRunning) skill.onEarlyUpdate(this);
            if(skill.isRunning) skill.onUpdate(this);
            if(skill.isRunning) skill.onLateUpdate(this);

            if (skill.checkCondition(this)) {
                if (skill.isRunning && !skill.isPassive)
                    this.sendRawMessage('[ 스킬이 이미 작동 중입니다. ]');
                else if (!skill.isCooldownEnded(this))
                    this.sendRawMessage(`[ 재사용 하기까지 ${new TimeFormat(skill.getRemainCooldown(this) * 1000)
                        .useUntilDays()
                        .format('d일 h시간 m분 s초')
                        .replace(/^0일 /, '')
                        .replace(/^0시간 /, '')
                        .replace(/^0분 /, '')
                    } 남았습니다. ]`);
                else if (!skill.canTakeCost(this))
                    this.sendRawMessage(`[ ${skill.getCostFailMessage(this)} ]`);
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
                this.sendRawMessage('───────────────\n' +
                    `  ${this.getName()}님의 스킬 [ ${skill.name} ]${Utils.getSubjective(skill.name)} [ LEVEL UP ] 하셨습니다!\n` +
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
                this.sendMessage(ComponentBuilder.message([
                    ComponentBuilder.text(`[ ${this.name}님, 산소가 부족합니다! ]\n`),
                    ComponentBuilder.text('산소  '),
                    ComponentBuilder.progressBar(this.air, this.maxAir, 'percent', 'white', '100px')
                ]));
            }
        }
        else this.air += Time.deltaTime * 20;
    }

    lateUpdate() {
        super.lateUpdate();

        if (this.food <= this.maxFood * 0.2)
            this.attribute.multiplyValue(AttributeType.MOVE_SPEED, 0.6);
        if (this.food <= this.maxFood * 0.05) {
            this.life -= Time.deltaTime * this.maxLife * 0.01;
            this.attribute.multiplyValue(AttributeType.LIFE_REGEN, 0);
        }
        if (this.water <= this.maxWater * 0.2)
            this.attribute.multiplyValue(AttributeType.ATTACK_SPEED, 0.6);
        if (this.water <= this.maxWater * 0.05) {
            this.life -= Time.deltaTime * this.maxLife * 0.02;
            this.attribute.multiplyValue(AttributeType.LIFE_REGEN, 0);
        }

        this.inventory.update();
        
        this.updateFishing();
        this.tickMessage = null;
        this.tickMessageId = null;

        this.oneTimeTriggers = [];
    }

    hasSkill(name: string, cond: (skill: Skill) => boolean) {
        let skill = this.getSkill(name);
        if(!skill) return false;
        return cond(skill);
    }

    getCharacterClass() {
        return this.characterClass ? 
            CharacterClass.getCharacterClass(this.characterClass) ?? null: null;
    }

    onHit(victim: Entity) {
        super.onHit(victim);

        let characterClass = this.getCharacterClass();
        if(characterClass?.trigger) characterClass.trigger.onHit(this, victim);

        let title = this.getTitle();
        if(title?.trigger) title.trigger.onHit(this, victim);

        this.quests.forEach(quest => {
            let preset = quest.preset;
            if(preset?.trigger) preset.trigger.onHit(this, victim);
        });

        this.oneTimeTriggers.forEach(trigger => trigger.onHit(this, victim));
    }

    onProjectileHit(projectile: Projectile, victim: Entity) {
        super.onProjectileHit(projectile, victim);

        let characterClass = this.getCharacterClass();
        if(characterClass?.trigger) characterClass.trigger.onProjectileHit(this, projectile, victim);

        let title = this.getTitle();
        if(title?.trigger) title.trigger.onProjectileHit(this, projectile, victim);

        this.quests.forEach(quest => {
            let preset = quest.preset;
            if(preset?.trigger) preset.trigger.onProjectileHit(this, projectile, victim);
        });

        this.oneTimeTriggers.forEach(trigger => trigger.onProjectileHit(this, projectile, victim));
    }

    changeClass(className: string, doSendMessage = true) {
        let characterClass = CharacterClass.getCharacterClass(className);
        if(!characterClass) return false;
        
        this.characterClass = className;
        characterClass.onChangeClass(this);
        if(doSendMessage) this.sendRawMessage(`[ 직업 [${className}] (으)로 전직하셨습니다! ]`);
    }

    onHitted(attacker: Entity) {
        super.onHitted(attacker);

        let loc = this.getLocation();

        let characterClass = this.getCharacterClass();
        if(characterClass?.trigger) characterClass.trigger.onHitted(this, attacker);

        let title = this.getTitle();
        if(title?.trigger) title.trigger.onHitted(this, attacker);

        this.quests.forEach(quest => {
            let preset = quest.preset;
            if(preset?.trigger) preset.trigger.onHitted(this, attacker);
        });

        this.oneTimeTriggers.forEach(trigger => trigger.onHitted(this, attacker));
    }

    realizeSkill(name: string, doSendMessage = false) {
        let preset = SkillPreset.getSkillPreset(name);
        if(!preset || this.skills.some(skill => skill.name === name)) return;

        this.skills.push(new Skill(name));
        if(doSendMessage) this.sendRawMessage(`[ 스킬 [ ${name} ] (을)를 깨달으셨습니다! ]`);
    }

    removeSkill(name: string) {
        let preset = SkillPreset.getSkillPreset(name);
        if(!preset || this.skills.every(skill => skill.name !== name)) return;

        this.skills = this.skills.filter(s => s.name !== name);
        this.sendRawMessage(`[ 스킬 [ ${name} ] (을)를 박탈당했습니다! ]`);
    }

    getGettingExp(entity: Entity) {
        return entity.maxExp * this.attribute.getValue(AttributeType.EXP_EFFCIENECY) / 100;
    }

    move(target: string) {
        if(!this.canMove || !this.canWorldMove) return false;
        let from = this.getLocation();
        let to = World.getLocation(target);
        if(!to) return false;

        this.moveDistance = this.remainMoveDistance = from.getDistance(to);
        this.moveTarget = target;
    }

    onMove(from: string) {
        const text = '[ 이동을 완료했습니다. ]';
        this.sendRawMessage(text);
        if(this.moveInfoId) {
            this.user.room?.removeChat(this.moveInfoId);
            this.moveInfoId = null;
        }
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
        return Config.get('dev-uuid') === this.uid;
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
            if(doSendMessage) this.sendRawMessage(`[ 퀘스트 [${quest.name}] (을)를 받았습니다! ]`);
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
        ]);

        let defendAttrs = new Set([ AttributeType.DEFEND, AttributeType.MAGIC_RESISTANCE ]);

        return ComponentBuilder.message([
            ComponentBuilder.text(`[ ${this.getName()}님의 스테이터스 ]`),
            ComponentBuilder.embed([
                ComponentBuilder.text('\n' +
                    `레벨   ${this.level}\n`),
                ComponentBuilder.progressBar(this.exp, this.maxExp, 'percent', 'white', '150px'),
                ComponentBuilder.text('\n\n' +
                    `장소 ‣ ${this.location}\n` +
                    (this.remainMoveDistance > 0 ?
                        `이동 중 ‣ ${this.moveTarget}\n` +
                        `남은 이동 거리 ‣ ${this.remainMoveDistance.toFixed(1)}m\n`
                        : '') +
                    `골드 ‣ ${this.gold}G\n` +
                    `카르마 ‣ ${this.karma.toFixed(1)}\n` +
                    `직업 ‣ ${this.characterClass ?? '☓'}\n` +
                    '\n' +
                    (Object.keys(this.shields).length ?
                        `보호막 잔여량  ${Object.keys(this.shields)
                            .map(k => this.shields[k].amount)
                            .reduce((a, b) => a + b).toFixed(0)}\n` +
                        `(최대 지속시간 ${Object.keys(this.shields)
                            .map(k => this.shields[k].duration)
                            .reduce((a, b) => Math.max(a, b)).toFixed(1)}초)\n`
                        : '')),
                ComponentBuilder.blockText(`생명`, { width: '3.5em' }),
                ComponentBuilder.progressBar(this.life, this.maxLife, 'int-value'),
                ComponentBuilder.newLine(),
                ComponentBuilder.blockText(`마나`, { width: '3.5em' }),
                ComponentBuilder.progressBar(this.mana, this.maxMana, 'int-value'),
                ComponentBuilder.newLine(),
                ComponentBuilder.blockText(`포만감`, { width: '3.5em' }),
                ComponentBuilder.progressBar(this.food, this.maxFood, 'int-value'),
                ComponentBuilder.newLine(),
                ComponentBuilder.blockText(`수분`, { width: '3.5em' }),
                ComponentBuilder.progressBar(this.water, this.maxWater, 'int-value'),
                ComponentBuilder.hidden([
                    ComponentBuilder.text('\n\n' +
                        '► 장착 정보\n'),
                    ComponentBuilder.join(EquipmentType.getAll().map((type, idx) => {
                        const item = this.slot.getItem(type);
                        return ComponentBuilder.message([
                            ComponentBuilder.text(`${type.displayName} ‣ `),
                            item ? item.getDisplayName() : ComponentBuilder.text('☓'),
                        ]);
                    }), ComponentBuilder.text('\n')),
                    ComponentBuilder.text('\n\n' +
                        '► 능력치\n'),
                    ComponentBuilder.join(
                        AttributeType.getAll()
                            .filter(type => !noneDisplayAttrs.has(type))
                            .map(type => {
                                return ComponentBuilder.message([
                                    ComponentBuilder.blockText('', { width: '7em' }, [
                                        ComponentBuilder.text(type.displayName)
                                    ]),
                                    ComponentBuilder.text(
                                        this.attribute.getValue(type).toFixed(type.fixPosition) + type.suffix,
                                        { color: 'lightgray' })
                                ].concat(
                                    defendAttrs.has(type) ? [
                                        ComponentBuilder.text(` (+${(Attribute.getDefendRatio(
                                            this.attribute.getValue(type)
                                        ) * 100).toFixed(1)}%경감)`, { color: 'lightgray' })
                                    ] : []
                                ));
                            }),
                        ComponentBuilder.newLine()
                    ),
                    ComponentBuilder.text(`\n\n` +
                        `► 스탯 [잔여 포인트 ${this.statPoint}개]\n` +
                        `근력  ${this.stat.getStat(StatType.STRENGTH)}\n` +
                        `체력  ${this.stat.getStat(StatType.VITALITY)}\n` +
                        `민첩  ${this.stat.getStat(StatType.AGILITY)}\n` +
                        `마법  ${this.stat.getStat(StatType.SPELL)}\n` +
                        `감각  ${this.stat.getStat(StatType.SENSE)}\n` +
                        '\n' +
                        (characterClass ?
                            `► 직업 정보 [${characterClass.name}]\n` +
                            `- ${characterClass.description}\n\n` : '') +
                        (title ?
                            `► 칭호 정보 [${title.name}]\n` +
                            `- ${title.description}\n\n` : '') +
                        this.effects.map(eff => {
                            return '▌ ' + eff;
                        }).join('\n'))
                ])
            ]),
        ]);
    }

    resetStat() {
        StatType.getAll().forEach(type => {
            this.statPoint += this.stat.getStat(type);
            this.stat.setStat(type, 0);
        });
    }

    hadClass(className: string) {
        let characterClass = CharacterClass.getCharacterClass(className) ?? null;
        if(!characterClass) return false;
        while(characterClass) {
            if(characterClass.name === this.characterClass) return true;
            characterClass = characterClass.enhancedClass;
        }
        return false;
    }

    getName() {
        return (this.title ? `[${this.title}] `: '') + super.getName();
    }

    get isAlive() {
        if(!this.isLoggedIn) return false;
        if(this.name === null) return false;

        return super.isAlive;
    }

    sendRawMessage(msg: string) {
        return ChatManager.sendBotRawMessage(this.user.currentRoom, msg);
    }

    sendMessage(msg: MessageComponent) {
        return ChatManager.sendBotMessage(this.user.currentRoom, msg);
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

    get user() {
        let user = User.getUser(this.uid);
        if(!user) throw new Error('User Not Found');
        return user;
    }

    async saveData() {
        await saveJson(`${Utils.SAVE_PATH + Utils.PLAYERS_PATH}${this.uid}.json`, 
            this.toDataObj());
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
 
        const nonProperty = new Set(['_effects', 'effects']);

        for(let property in newPlayer) {
            if(property in obj && !nonProperty.has(property)) 
                (newPlayer as any)[property] = obj[property];
        }

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

    static async saveAll() {
        for(const p of Player.players) {
            await p.saveData();
        }
    }

    static loadPlayer(uid: string) {
        let data = fs.readFileSync(`${Utils.SAVE_PATH + Utils.PLAYERS_PATH}${uid}.json`).toString();
        let newPlayer = Player.fromDataObj(JSON.parse(data));
        if(newPlayer) Player.addPlayer(newPlayer);
    }

    static loadAll() {
        let files = fs.readdirSync(Utils.SAVE_PATH + Utils.PLAYERS_PATH);
        for(let file of files) {
            Player.loadPlayer(file.split('.')[0]);
        }
    }

    static cannotUseNickname(nickname: string) {
        return !(/^[가-힣ㄱ-ㅎa-zA-Z _0-9]+$/.test(nickname)) || 
            nickname.trim().length === 0 || 
            nickname.length > 15 ||
            Player.players.some(u => u.name === nickname);
    }

    static sendGroupRawMessage(players: Player[], message: string) {
        return Player.sendGroupMessage(players, ComponentBuilder.text(message));
    }

    static sendGroupMessage(players: Player[], message: MessageComponent) {
        let roomSet = new Set();
        players.forEach(p => {
            if(!(p instanceof Player)) return;
            if(roomSet.has(p.user.currentRoom)) return;
            
            p.sendMessage(message);
            roomSet.add(p.user.currentRoom);
        })
    }

    static addPlayer(newPlayer: Player) {
        if(!(newPlayer instanceof Player)) return false;
        if(Player.players.some(p => (p.name && p.name === newPlayer.name) || p.uid === newPlayer.uid)) return false;

        ChatRoomManager.registerRoom(new ChatRoom(newPlayer.uid, newPlayer.name, [newPlayer.user]));
        Player.players.push(newPlayer);
        return true;
    }

    static getConnectedPlayers() {
        let now = Date.now();
        return Player.players.filter(p => now - p.latestPing < 5000);
    }

    static getPlayer(name: string) {
        return Player.players.find(p => p.name === name) ?? null;
    }

    static getPlayerByUid(uid: string): Player | null {
        return Player.players.find(p => p.uid === uid) ?? null;
    }

    static getRankingInfo(criteria = PlayerRankingCriteria.getCriteria('레벨')) {
        const sorted = Player.players
            .filter(p => p.name !== null)
            .sort((a, b) => criteria.getScore(b) - criteria.getScore(a));

        const visible = ComponentBuilder.message([]);
        const hidden = ComponentBuilder.hidden([]);

        sorted.forEach((player, index) => {
            const text = ComponentBuilder.message([
                ComponentBuilder.text(` [${index + 1}위] `, { width: '30px' }),
                ComponentBuilder.text(`${player.getName()}\n` +
                    ` ${criteria.getMessage(player)}\n`)
            ]);

            if(index < 2) visible.children.push(text);
            else hidden.children.push(text);

            return;
        })

        return ComponentBuilder.message([
            ComponentBuilder.text(`[ 플레이어 랭킹 순위 (${criteria.name}) ]\n\n`),
            ComponentBuilder.embed([
                visible, hidden
            ])
        ]);
    }
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