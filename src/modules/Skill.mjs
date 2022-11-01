import Time from "./Time.mjs";
import Utils from "./Utils.mjs";

export default class Skill {

    static MAX_PROF = 100;

    constructor(name) {
        this.name = name;
        this.level = 1;
        this.isRunning = false;
        this.latestStart = 0;
        this.latestFinish = 0;
        this.prof = 0;
        this.weakExtras = {};
        this.extras = {};
    }

    get preset() {
        return SkillPreset.getSkillPreset(this.name);
    }

    get maxLevel() {
        return this.preset?.maxLevel ?? 1;
    }

    get isPassive() {
        return this.preset?.isPassive ?? false;
    }

    getSkillInfo(player) {
        let remainCooldown = this.remainCooldown;
        return `[ 스킬 [ ${this.name} ] 의 정보입니다. ]${Utils.blank}\n\n` +
            `타입   ${this.isPassive() ? '패시브' : '액티브'} 스킬\n` +
            `레벨   ${this.level}  /${this.getMaxLevel()}\n` +
            `숙련도   ${Utils.progressBar(8, this.prof, this.maxProf, 'percent')}\n` +
            `재사용 대기시간   ${this.getCooldown(player).toFixed(1)}초` +
            (remainCooldown > 0 ? ' (남은 시간 ' + remainCooldown.toFixed(1) + '초)': '') +
            (this.isRunning ? ' (작동 중)': '') + '\n' +
            `소모   ${this.getCost(player)}\n` +
            `발동조건   ${this.getCondition(player)}\n\n` +
            `[ 설명 ]\n` +
            this.getDescription(player);
    }

    getCooldown(player) {
        return this.preset?.getCooldown?.call(this, player) ?? 10;
    }

    getCost(player) {
        return this.preset?.getCost?.call(this, player) ?? '소모값 없음';
    }

    getCostFailMessage(player) {
        return this.preset?.getCostFailMessage?.call(this, player) ?? '대가를 지불할 수 없습니다.';
    }

    canTakeCost(player) {
        return this.preset?.canTakeCost?.call(this, player) ?? true;
    }

    getCondition(player) {
        return this.preset?.getCondition?.call(this, player) ?? '상시 발동';
    }

    checkCondition(player) {
        return this.preset?.checkCondition?.call(this, player) ?? true;
    }

    getDescription(player) {
        return this.preset?.getDescription?.call(this, player) ?? '';
    }

    takeCost(player) {
        if(!this.canTakeCost(player)) player.sendMessage(this.getCostFailMessage(player));
        this.preset?.takeCost?.call(this, player);
    }

    get isCooldownEnded() {
        return Date.now() - this.latestFinish >= this.getCooldown(player) * 1000;
    }

    get remainCooldown() {
        return Math.max(this.getCooldown(player) - (Date.now() - this.latestFinish) / 1000, 0);
    }

    runSkill(player) {
        this.preset?.onStart?.call(this, player);
        this.isRunning = true;
        this.latestStart = Date.now();
    }

    finish(player) {
        this.preset?.onFinish?.call(this, player);
        this.latestFinish = Date.now();
        this.isRunning = false;
    }

    get hasAnyUpdate() {
        let preset = this.preset;
        return (preset.onUpdate ?? preset.onEarlyUpdate ?? preset.onLateUpdate) !== null;
    }

    onUpdate(player, delta = Time.deltaTime) {
        this.preset?.onUpdate?.call(this, player, delta);
        if(!this.hasAnyUpdate()) this.finish();
    }

    onEarlyUpdate(player, delta = Time.deltaTime) {
        this.preset?.onEarlyUpdate?.call(this, player, delta);
        if(!this.hasAnyUpdate()) this.finish();
    }

    onLateUpdate(player, delta = Time.deltaTime) {
        this.preset?.onLateUpdate?.call(this, player, delta);
        if(!this.hasAnyUpdate()) this.finish();
    }

    toString() {
        return `${this.name} [${this.isPassive ? '패시브': '액티브'}]`;
    }

    static fromName(name) {
        return new Skill(SkillPreset.getSkillPreset(name));
    }
}