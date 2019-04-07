export interface StatValues {
    ap?: number;
    str?: number;
    agi?: number;
    hit?: number;
    crit?: number;
    haste?: number;

    statMult?: number;
}

export class Stats {
    ap!: number;
    str!: number;
    agi!: number;
    hit!: number;
    crit!: number;
    haste!: number;
    statMult!: number;

    constructor(s?: StatValues) {
        this.set(s);
    }

    set(s?: StatValues) {
        this.ap = (s && s.ap) || 0;
        this.str = (s && s.str) || 0;
        this.agi = (s && s.agi) || 0;
        this.hit = (s && s.hit) || 0;
        this.crit = (s && s.crit) || 0;
        this.haste = (s && s.haste) || 1;
        this.statMult = (s && s.statMult) || 1;
    }

    add(s: StatValues) {
        this.str += (s.str || 0);
        this.agi += (s.agi || 0);
        this.hit += (s.hit || 0);
        this.crit += (s.crit || 0);
        this.haste *= (s.haste || 1);
        this.statMult *= (s.statMult || 1);
    }

    remove(s: StatValues) {
        this.str -= (s.str || 0);
        this.agi -= (s.agi || 0);
        this.hit -= (s.hit || 0);
        this.crit -= (s.crit || 0);
        this.haste /= (s.haste || 1);
        this.statMult /= (s.statMult || 1);
    }
}
