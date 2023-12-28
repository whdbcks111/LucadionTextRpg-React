import { ResourcePresetObject } from "../../../types";
import { DropItem, Player, Utils } from "../../Internal";
import { ComponentBuilder } from "../../server/chat/ComponentBuilder";

const cache: { [key: string]: ResourcePresetObject | undefined } = {};

export class ResourcePreset {
    static list: ResourcePresetObject[] = [
        {
            name: '마른 나무',
            level: 1,
            destroyableTypes: ['도끼'],
            attributes: {
                maxLife: 2000,
                defend: 100
            },
            drops: [
                new DropItem('마른 나무 껍질', 1, 3, 0.57),
                new DropItem('마른 나무 원목', 3, 10, 1)
            ]
        },
        {
            name: '바위1',
            displayName: '바위',
            level: 11,
            destroyableTypes: ['곡괭이'],
            attributes: {
                maxLife: 1000,
                defend: 1000
            },
            drops: [
                new DropItem('철 원석', 1, 3, 0.2),
                new DropItem('돌덩이', 3, 10, 1)
            ]
        },
        {
            name: '바위0',
            displayName: '바위',
            level: 4,
            destroyableTypes: ['곡괭이'],
            attributes: {
                maxLife: 1300,
                defend: 700
            },
            drops: [
                new DropItem('석탄', 1, 5, 0.5),
                new DropItem('돌덩이', 3, 10, 1)
            ]
        },
        {
            name: '바위2',
            displayName: '바위',
            level: 18,
            destroyableTypes: ['곡괭이'],
            attributes: {
                maxLife: 2000,
                defend: 1100
            },
            drops: [
                new DropItem('금 원석', 1, 3, 0.2),
                new DropItem('돌덩이', 3, 10, 1)
            ]
        },
        {
            name: '바위3',
            displayName: '바위',
            level: 22,
            destroyableTypes: ['곡괭이'],
            attributes: {
                maxLife: 1400,
                defend: 1900
            },
            drops: [
                new DropItem('티타늄 원석', 1, 2, 0.2),
                new DropItem('돌덩이', 3, 10, 1)
            ]
        },
        {
            name: '오염된 강철문',
            level: 78,
            attributes: {
                maxLife: 100000,
                defend: 3100
            },
            drops: [],
            onDestroy: (resource, p) =>{
                p.sendRawMessage('[ 어딘가 열린 것 같다. ]');
            }
        },
        {
            name: '오염된 꽃봉오리',
            level: 100,
            attributes: {
                maxLife: 300000,
                defend: 5100
            },
            drops: [],
            onDestroy: (resource, p) =>{
                p.sendRawMessage('[ 어딘가 열린 것 같다. ]');
            }
        },
        {
            name: '암흑 크리스탈',
            displayName: '암흑 크리스탈',
            level: 50,
            attributes: {
                maxLife: 13000,
                defend: 2400
            },
            drops: [],
            onDestroy: (resource, p) =>{
                    p.heal(3000);
                    p.sendMessage(ComponentBuilder.message([
                        ComponentBuilder.text(`[ 생명력이 3000만큼 회복되었다! ]\n`),
                        ComponentBuilder.text(`생명력 `),
                        ComponentBuilder.progressBar(p.life, p.maxLife, 'percent', 'white', '150px')
                    ]));
            }
        },
        {
            name: '블러드 크리스탈',
            displayName: '블러드 크리스탈',
            level: 300,
            attributes: {
                maxLife: 200000,
                defend: 64000
            },
            drops: [],
            onDestroy: (resource, p) =>{
                if (p instanceof Player) {
                    let h = p.heal(20000);
                    p.sendMessage(ComponentBuilder.message([
                        ComponentBuilder.text(`[ 생명력이 ${h.toFixed(1)}만큼 회복되었다! ]\n`),
                        ComponentBuilder.text(`생명력 `),
                        ComponentBuilder.progressBar(p.life, p.maxLife, 'percent', 'white', '150px')
                    ]));
                }
            }
        },
        {
            name: '카오스 크리스탈',
            displayName: '카오스 크리스탈',
            level: 2000,
            attributes: {
                maxLife: 300000,
                defend: 164000,
                magicResistance: 200000
            },
            drops: [],
            onDestroy: (resource, p) =>{
                if (p instanceof Player) {
                    let h = p.heal(300000);
                    p.sendMessage(ComponentBuilder.message([
                        ComponentBuilder.text(`[ 생명력이 ${h.toFixed(1)}만큼 회복되었다! ]\n`),
                        ComponentBuilder.text(`생명력 `),
                        ComponentBuilder.progressBar(p.life, p.maxLife, 'percent', 'white', '150px')
                    ]));
                }
            }
        }
    ];

    static getResourcePreset(name: string) {
        return cache[name] ?? (cache[name] = ResourcePreset.list.find(preset => preset.name === name));
    }
}