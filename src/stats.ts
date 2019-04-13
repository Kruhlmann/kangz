export interface StatValues {
    ap?: number;
    str?: number;
    agi?: number;
    hit?: number;
    crit?: number;
    haste?: number;
    statMult?: number;
    damageMult?: number;
    armorPenetration?: number;

    swordSkill?: number;
    axeSkill?: number;
    maceSkill?: number;
    daggerSkill?: number;
}

export class Stats implements StatValues {
    ap!: number;
    str!: number;
    agi!: number;
    hit!: number;
    crit!: number;
    haste!: number;
    statMult!: number;
    damageMult!: number;
    armorPenetration!: number;

    swordSkill!: number;
    axeSkill!: number;
    maceSkill!: number;
    daggerSkill!: number;

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
        this.damageMult = (s && s.damageMult) || 1;
        this.armorPenetration = (s && s.armorPenetration) || 0;

        this.swordSkill = (s && s.swordSkill) || 0;
        this.axeSkill = (s && s.axeSkill) || 0;
        this.maceSkill = (s && s.maceSkill) || 0;
        this.daggerSkill = (s && s.daggerSkill) || 0;
    }

    add(s: StatValues) {
        this.ap += (s.ap || 0);
        this.str += (s.str || 0);
        this.agi += (s.agi || 0);
        this.hit += (s.hit || 0);
        this.crit += (s.crit || 0);
        this.haste *= (s.haste || 1);
        this.statMult *= (s.statMult || 1);
        this.damageMult *= (s.damageMult || 1);
        this.armorPenetration += (s.armorPenetration || 0);

        this.swordSkill += (s.swordSkill || 0);
        this.axeSkill += (s.axeSkill || 0);
        this.maceSkill += (s.maceSkill || 0);
        this.daggerSkill += (s.daggerSkill || 0);
    }
}
