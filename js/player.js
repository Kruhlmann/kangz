import { Unit } from "./unit.js";
import { urand, clamp } from "./math.js";
export var MeleeHitOutcome;
(function (MeleeHitOutcome) {
    MeleeHitOutcome[MeleeHitOutcome["MELEE_HIT_EVADE"] = 0] = "MELEE_HIT_EVADE";
    MeleeHitOutcome[MeleeHitOutcome["MELEE_HIT_MISS"] = 1] = "MELEE_HIT_MISS";
    MeleeHitOutcome[MeleeHitOutcome["MELEE_HIT_DODGE"] = 2] = "MELEE_HIT_DODGE";
    MeleeHitOutcome[MeleeHitOutcome["MELEE_HIT_BLOCK"] = 3] = "MELEE_HIT_BLOCK";
    MeleeHitOutcome[MeleeHitOutcome["MELEE_HIT_PARRY"] = 4] = "MELEE_HIT_PARRY";
    MeleeHitOutcome[MeleeHitOutcome["MELEE_HIT_GLANCING"] = 5] = "MELEE_HIT_GLANCING";
    MeleeHitOutcome[MeleeHitOutcome["MELEE_HIT_CRIT"] = 6] = "MELEE_HIT_CRIT";
    MeleeHitOutcome[MeleeHitOutcome["MELEE_HIT_CRUSHING"] = 7] = "MELEE_HIT_CRUSHING";
    MeleeHitOutcome[MeleeHitOutcome["MELEE_HIT_NORMAL"] = 8] = "MELEE_HIT_NORMAL";
    MeleeHitOutcome[MeleeHitOutcome["MELEE_HIT_BLOCK_CRIT"] = 9] = "MELEE_HIT_BLOCK_CRIT";
})(MeleeHitOutcome || (MeleeHitOutcome = {}));
export const hitOutcomeString = {
    [MeleeHitOutcome.MELEE_HIT_EVADE]: 'evade',
    [MeleeHitOutcome.MELEE_HIT_MISS]: 'misses',
    [MeleeHitOutcome.MELEE_HIT_DODGE]: 'is dodged',
    [MeleeHitOutcome.MELEE_HIT_BLOCK]: 'is blocked',
    [MeleeHitOutcome.MELEE_HIT_PARRY]: 'is parried',
    [MeleeHitOutcome.MELEE_HIT_GLANCING]: 'glances',
    [MeleeHitOutcome.MELEE_HIT_CRIT]: 'crits',
    [MeleeHitOutcome.MELEE_HIT_CRUSHING]: 'crushes',
    [MeleeHitOutcome.MELEE_HIT_NORMAL]: 'hits',
    [MeleeHitOutcome.MELEE_HIT_BLOCK_CRIT]: 'is block crit',
};
const skillDiffToReduction = [1, 0.9926, 0.9840, 0.9742, 0.9629, 0.9500, 0.9351, 0.9180, 0.8984, 0.8759, 0.8500, 0.8203, 0.7860, 0.7469, 0.7018];
export class Player extends Unit {
    constructor(armor, baseAttackPower, mh, oh) {
        super(armor);
        this.baseAttackPower = baseAttackPower;
        this.mh = mh;
        this.oh = oh;
    }
    calculateWeaponSkillValue(is_mh) {
        const weapon = is_mh ? this.mh : this.oh;
        const weaponType = weapon.type;
        return 305;
    }
    calculateCritChance(victim) {
        let crit = 5;
        const items = 10;
        const buffs = 5;
        crit += items;
        crit += buffs;
        crit -= (victim.defenseSkill - 300) * 0.04;
        return crit;
    }
    calculateMissChance(victim, is_mh) {
        let res = 5;
        if (this.oh) {
            res += 19;
        }
        const skillDiff = this.calculateWeaponSkillValue(is_mh) - victim.defenseSkill;
        if (skillDiff < -10) {
            res -= (skillDiff + 10) * 0.4 - 2;
        }
        else {
            res -= skillDiff * 0.1;
        }
        return clamp(res, 0, 60);
    }
    calculateGlancingReduction(victim, is_mh) {
        const skillDiff = victim.defenseSkill - this.calculateWeaponSkillValue(is_mh);
        if (skillDiff >= 15) {
            return 0.65;
        }
        else if (skillDiff < 0) {
            return 1;
        }
        else {
            return skillDiffToReduction[skillDiff];
        }
    }
    calculateAttackPower() {
        return this.baseAttackPower;
    }
    calculateMinMaxDamage(is_mh) {
        const weapon = is_mh ? this.mh : this.oh;
        const ap_bonus = this.calculateAttackPower() / 14 * weapon.speed;
        return [
            Math.trunc(weapon.min + ap_bonus),
            Math.trunc(weapon.max + ap_bonus)
        ];
    }
    calculateRawDamage(is_mh) {
        return urand(...this.calculateMinMaxDamage(is_mh));
    }
    rollMeleeHitOutcome(victim, is_mh) {
        const roll = urand(0, 10000);
        let sum = 0;
        let tmp = 0;
        const miss_chance = Math.trunc(this.calculateMissChance(victim, is_mh) * 100);
        const dodge_chance = Math.trunc(victim.dodgeChance * 100);
        const crit_chance = Math.trunc(this.calculateCritChance(victim) * 100);
        const skilBonus = 4 * (this.calculateWeaponSkillValue(is_mh) - 300);
        tmp = miss_chance;
        if (tmp > 0 && roll < (sum += tmp)) {
            return MeleeHitOutcome.MELEE_HIT_MISS;
        }
        tmp = dodge_chance - skilBonus;
        if (tmp > 0 && roll < (sum += tmp)) {
            return MeleeHitOutcome.MELEE_HIT_DODGE;
        }
        tmp = (10 + (victim.defenseSkill - 300) * 2) * 100;
        tmp = clamp(tmp, 0, 4000);
        if (roll < (sum += tmp)) {
            return MeleeHitOutcome.MELEE_HIT_GLANCING;
        }
        tmp = crit_chance;
        if (tmp > 0 && roll < (sum += crit_chance)) {
            return MeleeHitOutcome.MELEE_HIT_CRIT;
        }
        return MeleeHitOutcome.MELEE_HIT_NORMAL;
    }
    calculateMeleeDamage(victim, is_mh) {
        const rawDamage = this.calculateRawDamage(is_mh);
        const armorReduced = victim.calculateArmorReducedDamage(rawDamage);
        const hitOutcome = this.rollMeleeHitOutcome(victim, is_mh);
        let damage = armorReduced;
        let proc = false;
        switch (hitOutcome) {
            case MeleeHitOutcome.MELEE_HIT_MISS:
            case MeleeHitOutcome.MELEE_HIT_DODGE:
                {
                    damage = 0;
                    break;
                }
            case MeleeHitOutcome.MELEE_HIT_GLANCING:
                {
                    const reducePercent = this.calculateGlancingReduction(victim, is_mh);
                    damage = Math.trunc(reducePercent * damage);
                    break;
                }
            case MeleeHitOutcome.MELEE_HIT_NORMAL:
                {
                    proc = true;
                    break;
                }
            case MeleeHitOutcome.MELEE_HIT_CRIT:
                {
                    proc = true;
                    damage *= 2;
                    break;
                }
        }
        if (!is_mh) {
            damage *= 0.625;
        }
        return [Math.trunc(damage), hitOutcome];
    }
    updateProcs(is_mh, hitOutcome) {
    }
    updateMeleeAttackingState(time) {
        let damageDone = 0;
        let hitOutcome;
        let is_mh = false;
        if (this.target) {
            if (time >= this.mh.nextSwingTime) {
                is_mh = true;
                [damageDone, hitOutcome] = this.calculateMeleeDamage(this.target, is_mh);
                this.mh.nextSwingTime = time + this.mh.speed * 1000;
                if (this.oh.nextSwingTime < time + 200) {
                    console.log('delaying OH swing', time + 200 - this.oh.nextSwingTime);
                    this.oh.nextSwingTime = time + 200;
                }
            }
            else if (time >= this.oh.nextSwingTime) {
                [damageDone, hitOutcome] = this.calculateMeleeDamage(this.target, is_mh);
                this.oh.nextSwingTime = time + this.oh.speed * 1000;
                if (this.mh.nextSwingTime < time + 200) {
                    console.log('delaying MH swing', time + 200 - this.mh.nextSwingTime);
                    this.mh.nextSwingTime = time + 200;
                }
            }
        }
        return [damageDone, hitOutcome, is_mh];
    }
}
//# sourceMappingURL=player.js.map