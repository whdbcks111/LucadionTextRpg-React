import { ExtraObject } from "../../types";
import Enum from "../util/Enum";
import { Entity, Item, Utils } from "../Internal";

export class UncaughtFish {

    name: string;
    neededStrength: number;
    exp: number;

    constructor(name: string, neededStrength = 0, exp = 0) {
        this.name = name;
        this.neededStrength = neededStrength;
        this.exp = exp;
    }
}

export class FishListState {

    grade: FishGrade;
    chanceWeight: number;
    list: UncaughtFish[];

    constructor(grade = FishGrade.NORMAL, chanceWeight = 1, list: UncaughtFish[] = []) {
        this.grade = grade;
        this.chanceWeight = chanceWeight;
        this.list = list;
    }
}

export class Fish {

    grade: FishGrade;
    name: string;
    neededStrength: number;
    exp: number;

    constructor(grade: FishGrade, uncaughtFish: UncaughtFish) {
        this.grade = grade;
        this.name = uncaughtFish.name;
        this.neededStrength = uncaughtFish.neededStrength;
        this.exp = uncaughtFish.exp;
    }

    get gradeName() {
        return this.grade.displayName ?? '??';
    }

    get item() {
        return Item.fromName(this.name);
    }

    toDataObj() {
        return {
            ...this
        };
    }

    static fromDataObj(obj: ExtraObject) {
        if(!obj) return null;
        return new Fish(obj.grade, new UncaughtFish(obj.name, obj.neededStrength, obj.exp));
    }
}

export class FishGrade extends Enum {

    displayName: string;

    constructor(name: string, displayName: string) {
        super(name);
        this.displayName = displayName;
    }

    static GARBAGE = new FishGrade('garbage', '쓰레기');
    static NORMAL = new FishGrade('normal', '일반');
    static RARE = new FishGrade('rare', '희귀');
    static LEGEND = new FishGrade('legend', '전설');
    static MYTH = new FishGrade('myth', '신화');
    static ANCIENT = new FishGrade('ancient', '고대');
}

export class FishDrops {

    stateList: FishListState[];

    constructor(stateList: FishListState[]) {
        this.stateList = stateList;
    }

    getRandomFish(luckValue = 0) {
        let originalTotal = 0, total = 0;
        let select = Math.random();
        let sorted = this.stateList.sort((a, b) => b.chanceWeight - a.chanceWeight);
        let getAddition = (state: FishListState) => luckValue * originalTotal * 0.001;

        this.stateList.forEach(state => originalTotal += state.chanceWeight);
        total = originalTotal;
        sorted.forEach(state => total += getAddition(state));
        select *= total;

        for (let i = 0; i < sorted.length; i++) {
            let state = sorted[i];
            select -= state.chanceWeight + getAddition(state);
            if (select < 0) {
                return new Fish(state.grade, state.list[Utils.randomRangeInt(0, state.list.length - 1)]);
            }
        }

        return null;
    }

    static NORMAL_FRESH = new FishDrops([
        new FishListState(FishGrade.GARBAGE, 10, [
            new UncaughtFish('빈 깡통', 0, Entity.getMaxExp(3)),
            new UncaughtFish('나무 막대기', 0, Entity.getMaxExp(2))
        ]),
        new FishListState(FishGrade.NORMAL, 60, [
            new UncaughtFish('떡붕어', 5, Entity.getMaxExp(10)),
            new UncaughtFish('붕어', 5, Entity.getMaxExp(6)),
            new UncaughtFish('송사리', 5, Entity.getMaxExp(8))
        ]),
        new FishListState(FishGrade.RARE, 30, [
            new UncaughtFish('뱀장어', 30, Entity.getMaxExp(20))
        ])
    ]);

    static FROZEN_FRESH = new FishDrops([
        new FishListState(FishGrade.GARBAGE, 10, [
            new UncaughtFish('빈 깡통', 0, Entity.getMaxExp(3)),
            new UncaughtFish('나무 막대기', 0, Entity.getMaxExp(2))
        ]),
        new FishListState(FishGrade.NORMAL, 50, [
            new UncaughtFish('피라미', 0, Entity.getMaxExp(7)),
            new UncaughtFish('빙어', 0, Entity.getMaxExp(5))
        ]),
        new FishListState(FishGrade.RARE, 40, [
            new UncaughtFish('송어', 20, Entity.getMaxExp(25)),
            new UncaughtFish('산천어', 20, Entity.getMaxExp(19))
        ]),
        new FishListState(FishGrade.LEGEND, 1, [
            new UncaughtFish('프로즌피쉬', 50, Entity.getMaxExp(80))
        ])
    ]);
}