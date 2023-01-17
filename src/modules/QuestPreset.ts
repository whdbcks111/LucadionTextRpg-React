import { QuestPresetObject } from "../types";

const cache: { [key: string]: QuestPresetObject | undefined } = {};

export class QuestPreset {
    static list: QuestPresetObject[] = [

    ];

    static getQuestPreset(name: string) {
        return cache[name] ?? (cache[name] = QuestPreset.list.find(preset => preset.name === name));
    }
}