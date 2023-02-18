import { ExtraObject, NpcAct, NullableString } from "../../types";
import { Player, Time, Location, Trigger } from "../Internal";
import { QuestPreset, Utils } from "../Internal";
import { ComponentBuilder } from "../server/chat/ComponentBuilder";

const presetMap = {};

export class Npc {
    
    name: string;
    acts: NpcAct[];
    choices: NpcChoice[] = [];
    delayedTasks: ([() => void, number])[] = [];
    latestDelayed = 0;
    target: Player | null = null;
    location: Location | null = null;

    constructor(name: string, acts: NpcAct[]) {
        this.name = name;
        this.acts = acts;
    }

    get isTalking() {
        return this.target !== null;
    }

    say(msg: string) {
        if(this.target) this.target.sendRawMessage(msg);
    }

    update() {
        if(this.target?.location !== this.location?.name
            || (this.delayedTasks.length === 0 && this.choices.length === 0)) {
            this.finish();
        }
        if(this.delayedTasks.length > 0) {
            let [task, ms] = this.delayedTasks[0];
            if(Date.now() - this.latestDelayed >= ms) {
                task();
                this.latestDelayed = Date.now();
                this.delayedTasks.shift();                
                if(this.delayedTasks.length === 0) this.sendChoices();
            }
        }
    }

    choose(index: number) {
        if(!(index in this.choices) || this.delayedTasks.length > 0) return false;
        this.act(this.choices[index].targetIndex);
        return true;
    }

    sendChoices() {
        if(this.choices.length === 0) return false;
        this.target?.sendMessage(ComponentBuilder.message([
            ComponentBuilder.text('[ 선택지 ]\n\n'),
            ComponentBuilder.join(
                this.choices.map((choice, index) => 
                    ComponentBuilder.message([
                        ComponentBuilder.text(` [${index + 1}] `),
                        ComponentBuilder.button([ ComponentBuilder.text(choice.title) ], `cc ${index + 1}`)
                    ])
                ), 
                ComponentBuilder.newLine()
            )
        ]));
    }

    delayTask(task: () => void, ms: number) {
        if(this.delayedTasks.length === 0) this.latestDelayed = Date.now();
        this.delayedTasks.push([task, ms]);
    }

    act(index: number) {
        if(!(index in this.acts)) return false;
        this.delayedTasks = [];
        this.choices = [];
        if(this.target !== null) this.acts[index](this);
        if(this.delayedTasks.length === 0) this.sendChoices();
    }

    start(player: Player) {
        this.target = player;
        this.act(0);
    }

    finish() {
        this.target?.sendRawMessage('[ 대화가 종료되었습니다. ]');
        this.target = null;
        this.choices = [];
        this.delayedTasks = [];
    }

    requestQuest(questName: string) {
        if(this.target && !this.target.hasQuest(questName)) {
            this.target.addQuest(new Quest(questName, this.name));
        }
    }

    canReward(player: Player) {
        return player.quests.some(q => q.requester === this.name && q.isCompleted && !q.isRewarded);
    }

    giveQuestReward(player: Player) {
        player.quests
            .filter(q => q.requester === this.name && q.isCompleted && !q.isRewarded)
            .forEach(q => q.giveReward(player));
    }

}

export class NpcChoice {

    title: string;
    targetIndex: number;

    constructor(title: string, index: number) {
        this.title = title;
        this.targetIndex = index;
    }
}

export interface QuestPresetObject {
    name: string;
    conditionMessage: string;
    giveReward: (quest: Quest, player: Player) => void;
    canComplete: (quest: Quest, player: Player) => boolean;
    trigger: Trigger;
    rewardMessage: string;
}

export class Quest {

    name: string;
    requester: NullableString;
    isCompleted = false;
    isRewarded = false;

    constructor(name: string, requester: NullableString = null) {
        this.name = name;
        this.requester = requester;
    }

    toDataObj() {
        return {
            ...this
        };
    }

    static fromDataObj(obj: ExtraObject) {
        if(!obj) return null;
        let newQuest = new Quest(obj.name, obj.requester);
        newQuest.isCompleted = obj.isCompleted;
        newQuest.isRewarded = obj.isRewarded;

        return newQuest;
    }

    giveReward(player: Player) {
        let preset = this.preset;
        player.sendRawMessage(`[ 퀘스트 [${this.name}] 의 보상이 지급됩니다. ]`);
        preset?.giveReward(this, player);
        this.isRewarded = true;
    }

    canComplete(player: Player) {
        return this.preset?.canComplete(this, player);
    }

    update(player: Player) {
        let preset = this.preset;
        if(this.canComplete(player) && !this.isCompleted) {
            this.isCompleted = true;
            player.sendRawMessage(`[ 퀘스트 [ ${this.name} ] (이)가 클리어 되었습니다! ]` +
                (this.requester ? `\n - NPC [ ${this.requester} ] 에게 가서 대화를 시도하세요.`: ''));
        }
        preset?.trigger?.onUpdate(player);
    }

    get preset() {
        return QuestPreset.getQuestPreset(this.name);
    }
}