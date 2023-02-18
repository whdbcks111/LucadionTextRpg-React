import { ExtraObject, MessageComponent } from "../../types";
import { Player, SkillPreset, TimeFormat } from "../Internal"
import { ComponentBuilder } from "../server/chat/ComponentBuilder";

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
        return this.preset?.calcValues ? this.preset.calcValues(this, player) : {};
    }

    getValue(player: Player, key: string) {
        return this.getValues(player)[key] ?? 0;
    }

    getSkillInfo(player: Player) {
        let remainCooldown = this.getRemainCooldown(player);
        return ComponentBuilder.message([
            ComponentBuilder.text(`[ 스킬 [ ${this.name} ] 의 정보입니다. ]`),
            ComponentBuilder.embed([ComponentBuilder.hidden([
                ComponentBuilder.text('타입', { width: '60px' }),
                ComponentBuilder.text(`${this.isPassive ? '패시브' : '액티브'} 스킬\n`),
                ComponentBuilder.text('레벨', { width: '60px' }),
                ComponentBuilder.text(`${this.level}  /${this.maxLevel}\n`),
                ComponentBuilder.text('숙련도', { width: '60px' }),
                ComponentBuilder.progressBar(this.prof, this.maxProf, 'percent'),
                ComponentBuilder.text('\n'),
                ComponentBuilder.text('재사용 대기시간', { width: '60px' }),
                ComponentBuilder.text(new TimeFormat(this.getCooldown(player) * 1000)
                    .useUntilDays()
                    .format('d일 h시간 m분 s초')
                    .replace(/^0일 /, '')
                    .replace(/^0시간 /, '')
                    .replace(/^0분/, '')),
                ComponentBuilder.text((remainCooldown > 0 ?
                    ' (남은 시간 ' + remainCooldown.toFixed(1) + '초)' : '')),
                ComponentBuilder.text((this.isRunning ? ' (작동 중)': '') + '\n'),
                ComponentBuilder.text('소모', { width: '60px' }),
                ComponentBuilder.text(`${this.getCost(player)}\n`),
                ComponentBuilder.text('발동조건', { width: '60px' }),
                ComponentBuilder.text(`${this.getCondition(player)}\n\n`),
                ComponentBuilder.text('[ 설명 ]', { width: '60px' }),
                ComponentBuilder.text(`${this.getDescription(player)}`, { paddingLeft: '10px' }),
            ])])
        ]);
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

    getDescription(player: Player): MessageComponent {
        return this.preset?.getDescription ?
            this.preset.getDescription(this, player) : ComponentBuilder.empty();
    }

    takeCost(player: Player) {
        if(!this.canTakeCost(player)) player.sendRawMessage(this.getCostFailMessage(player));
        if(this.preset?.takeCost) this.preset.takeCost(this, player);
    }

    isCooldownEnded(player: Player) {
        return Date.now() - this.latestFinish >= this.getCooldown(player) * 1000;
    }

    getRemainCooldown(player: Player) {
        return Math.max(this.getCooldown(player) - (Date.now() - this.latestFinish) / 1000, 0);
    }

    setRemainCoooldown(player: Player, ms: number) {
        this.latestFinish = Date.now() + Math.min(0, ms - this.getCooldown(player));
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