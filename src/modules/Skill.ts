import { ExtraObject } from "../types";
import { Player, SkillPreset } from "./Internal"
import { Time } from "./Internal"
import Utils from "./Utils";

export class Skill {

    static MAX_PROF = 100;

    name: string;
    level = 1;
    isRunning = false;
    latestStart = 0;
    latestFinish = 0;
    prof = 0;
    weakExtras: ExtraObject = {};
    extras: ExtraObject = {};

    constructor(name: string) {
        this.name = name;
    }

    toDataObj() {
        return {
            ...this,
            weakExtras: null
        }
    }

    static fromDataObj(obj: ExtraObject) {
        if(!obj) return null;
        let newSkill = new Skill(obj.name);
        newSkill.level = obj.level;
        newSkill.isRunning = obj.isRunning;
        newSkill.latestStart = obj.latestStart;
        newSkill.latestFinish = obj.latestFinish;
        newSkill.prof = obj.prof;
        newSkill.extras = JSON.parse(JSON.stringify(obj.extras));
        return newSkill;
    }

    get preset() {
        return SkillPreset.getSkillPreset(this.name);
    }

    get maxLevel() {
        return this.preset?.maxLevel ?? 1;
    }

    get maxProf() {
        return Skill.MAX_PROF;
    }

    get isPassive() {
        return this.preset?.isPassive ?? false;
    }

    getValues(player: Player) {
        return this.preset?.calcValues ? this.preset.calcValues(this, player) : [];
    }

    getValue(player: Player, index: number) {
        return this.getValues(player)[index] ?? 0;
    }

    getSkillInfo(player: Player) {
        let remainCooldown = this.getRemainCooldown(player);
        return `[ 스킬 [ ${this.name} ] 의 정보입니다. ]${Utils.blank}\n\n` +
            `타입   ${this.isPassive ? '패시브' : '액티브'} 스킬\n` +
            `레벨   ${this.level}  /${this.maxLevel}\n` +
            `숙련도   ${Utils.progressBar(8, this.prof, this.maxProf, 'percent')}\n` +
            `재사용 대기시간   ${this.getCooldown(player).toFixed(1)}초` +
            (remainCooldown > 0 ? ' (남은 시간 ' + remainCooldown.toFixed(1) + '초)': '') +
            (this.isRunning ? ' (작동 중)': '') + '\n' +
            `소모   ${this.getCost(player)}\n` +
            `발동조건   ${this.getCondition(player)}\n\n` +
            `[ 설명 ]\n` +
            this.getDescription(player);
    }

    getCooldown(player: Player) {
        return this.preset?.getCooldown ? 
            this.preset.getCooldown(this, player) : 0;
    }

    getCost(player: Player) {
        return this.preset?.getCostMessage ? 
            this.preset.getCostMessage(this, player) : '소모값 없음';
    }

    getCostFailMessage(player: Player) {
        return this.preset?.getCostFailMessage ? 
            this.preset.getCostFailMessage(this, player) : '대가를 지불할 수 없습니다.';
    }

    canTakeCost(player: Player) {
        return this.preset?.canTakeCost ?
            this.preset.canTakeCost(this, player) : true;
    }

    getCondition(player: Player) {
        return this.preset?.getConditionMessage ?
            this.preset.getConditionMessage(this, player) : '상시 발동';
    }

    checkCondition(player: Player) {
        return this.preset?.checkCondition ? 
            this.preset.checkCondition(this, player) : true;
    }

    getDescription(player: Player) {
        return this.preset?.getDescription ?
            this.preset.getDescription(this, player) : '';
    }

    takeCost(player: Player) {
        if(!this.canTakeCost(player)) player.sendMessage(this.getCostFailMessage(player));
        if(this.preset?.takeCost) this.preset.takeCost(this, player);
    }

    isCooldownEnded(player: Player) {
        return Date.now() - this.latestFinish >= this.getCooldown(player) * 1000;
    }

    getRemainCooldown(player: Player) {
        return Math.max(this.getCooldown(player) - (Date.now() - this.latestFinish) / 1000, 0);
    }

    runSkill(player: Player) {
        if(this.preset?.onStart) this.preset.onStart(this, player);
        this.isRunning = true;
        this.latestStart = Date.now();
    }

    finish(player: Player) {
        if(this.preset?.onFinish) this.preset.onFinish(this, player);
        this.latestFinish = Date.now();
        this.isRunning = false;
    }

    get hasAnyUpdate() {
        let preset = this.preset;
        return (preset?.onUpdate ?? 
            preset?.onEarlyUpdate ?? 
            preset?.onLateUpdate ?? null) !== null;
    }

    onUpdate(player: Player) {
        if(this.preset?.onUpdate) this.preset.onUpdate(this, player);
        if(!this.hasAnyUpdate) this.finish(player);
    }

    onEarlyUpdate(player: Player) {
        if(this.preset?.onEarlyUpdate) this.preset.onEarlyUpdate(this, player);
        if(!this.hasAnyUpdate) this.finish(player);
    }

    onLateUpdate(player: Player) {
        if(this.preset?.onLateUpdate) this.preset.onLateUpdate(this, player);
        if(!this.hasAnyUpdate) this.finish(player);
    }

    toString() {
        return `${this.name} [${this.isPassive ? '패시브': '액티브'}]`;
    }

    static fromName(name: string) {
        return new Skill(name);
    }
}