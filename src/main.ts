import { items, getIndexForItemName } from "./data/items.js";
import { StatValues, Stats } from "./stats.js";
import { ItemSlot, ItemDescription } from "./item.js";
import { SimulationDescription, setupPlayer, equipmentIndicesToItem, buffIndicesToBuff } from "./simulation_utils.js";
import { WorkerInterface } from "./worker_event_interface.js";
import { buffs } from "./data/spells.js";
import { Race } from "./player.js";

const realtimeEl: HTMLInputElement = <HTMLInputElement>document.getElementById('realtime')!;
const statContainerEL = document.getElementById('stats')!;
const statEls: {[index: string]: HTMLInputElement} = {};
const myStatsEl = document.getElementById('myStats')!;
const simsContainerEl = document.getElementById('simsContainer')!;
const raceEl = <HTMLSelectElement>document.getElementById('race')!;
const buffsEl = document.getElementById('buffs')!;
const heroicStrikeRageReqEl = <HTMLInputElement>document.getElementById('heroicstrikerr')!;
const hamstringRageReqEl = <HTMLInputElement>document.getElementById('hamstringrr')!;
const fightLengthEl = <HTMLInputElement>document.getElementById('fightlength')!;

function getRace(): Race {
    return parseInt(raceEl.value);
}

for (let race of [
    Race.HUMAN,
    Race.ORC,
]) {
    const option = document.createElement('option');
    option.value = `${race}`;
    option.textContent = Race[race].toLowerCase();
    raceEl.appendChild(option);
}

raceEl.addEventListener('change', updateStats);
raceEl.addEventListener('change', () => {
    const race = getRace();

    for (let [idx, buff] of buffs.entries()) {
        if (buff.name.includes('Blessing of')) {
            buffInputEls[idx].checked = race === Race.HUMAN;
        }
    }
});

for (let el of statContainerEL.getElementsByTagName("input")) {
    statEls[el.name] = el;
    el.addEventListener("input", updateStats);
}

const itemsEl = document.getElementById('items')!;

const categoryEls: Map<ItemSlot, HTMLSelectElement> = new Map();

for (let itemSlot of [
    ItemSlot.MAINHAND,
    ItemSlot.OFFHAND,
    ItemSlot.RANGED,
    ItemSlot.HEAD,
    ItemSlot.NECK,
    ItemSlot.SHOULDER,
    ItemSlot.BACK,
    ItemSlot.CHEST,
    ItemSlot.WRIST,
    ItemSlot.HANDS,
    ItemSlot.WAIST,
    ItemSlot.LEGS,
    ItemSlot.FEET,
    ItemSlot.RING1,
    ItemSlot.RING2,
    ItemSlot.TRINKET1,
    ItemSlot.TRINKET2,
    ]) {
        categoryEls.set(itemSlot, document.createElement('select'));
}

function addItemToCategories(item: ItemDescription, idx: number) {
    for (let i = 1; i <= item.slot; i <<= 1) {
        if (item.slot & i) {
            if (categoryEls.has(i)) {
                const categoryEl = categoryEls.get(i)!;
                const option = document.createElement('option');
                option.value = `${idx}`;
                option.textContent = item.name;
                categoryEl.appendChild(option);
            }
        }
    }
}

{
    const option = document.createElement('option');
    option.textContent = 'None';
    categoryEls.get(ItemSlot.OFFHAND)!.appendChild(option);
}

for (let [idx, item] of items.entries()) {
    addItemToCategories(item, idx);
}


for (let [slot, categoryEl] of categoryEls) {
    const label = document.createElement('label');
    label.textContent = ItemSlot[slot].toLowerCase();

    itemsEl.appendChild(label);
    itemsEl.appendChild(categoryEl);

    categoryEl.addEventListener('change', updateStats);
}

// default items

function setDefault(slot: ItemSlot, itemName: string) {
    categoryEls.get(slot)!.value = '' + getIndexForItemName(itemName);
}

setDefault(ItemSlot.MAINHAND, "Empyrean Demolisher");
setDefault(ItemSlot.OFFHAND, "Anubisath Warhammer");
setDefault(ItemSlot.RING2, "Quick Strike Ring");
setDefault(ItemSlot.TRINKET2, "Hand of Justice");
setDefault(ItemSlot.HANDS, "Gauntlets of Annihilation");
setDefault(ItemSlot.FEET, "Chromatic Boots");
setDefault(ItemSlot.BACK, "Drape of Unyielding Strength");

const buffInputEls: HTMLInputElement[] = [];

for (let [idx, buff] of buffs.entries()) {
    const race = getRace();

    if (race === Race.ORC) {
        if (buff.name.includes('Blessing of')) {
            continue;
        }
    }

    const labelEl = document.createElement('label');
    labelEl.textContent = buff.name;

    const inputEl = document.createElement('input');
    inputEl.type = 'checkbox';
    inputEl.value = `${idx}`;
    inputEl.checked = true;
    inputEl.addEventListener('change', updateStats);

    buffInputEls.push(inputEl);

    buffsEl.append(labelEl, inputEl);
}

function getBuffs(): number[] {
    const res: number[] = [];

    for (let inputEl of buffInputEls) {
        if (inputEl.checked) {
            res.push(parseInt(inputEl.value));
        }
    }

    return res;
}

function getEquipmentIndices(): [number, ItemSlot][] {
    const res: [number, ItemSlot][] = [];

    for (let [slot, categoryEl] of categoryEls) {
        const item = items[parseInt(categoryEl.value)];
        if (item) {
            res.push([parseInt(categoryEl.value), slot]);
        }
    }

    return res;
}

function getStats(): StatValues {
    return {
        ap: parseInt(statEls.ap!.value),
        str: parseInt(statEls.str!.value),
        agi: parseInt(statEls.agi!.value),
        hit: parseInt(statEls.hit!.value),
        crit: parseInt(statEls.crit!.value),
        haste: parseFloat(statEls.haste!.value),
    };
}

function formatStats(stats: StatValues) {
    const statsFull = new Stats(stats);

    return `AP: ${statsFull.ap}
        Crit: ${statsFull.crit}
        Hit: ${statsFull.hit}
        Str: ${(statsFull.str)}
        Agi: ${(statsFull.agi)}
        Haste: ${(statsFull.haste)}`;
}

function updateStats() {
    const player = (() => {
        const player = setupPlayer(getRace(), getStats(), equipmentIndicesToItem(getEquipmentIndices()), buffIndicesToBuff(getBuffs()), undefined);
        player.buffManager.update(0);
        return player;
    })();

    const stats = player.buffManager.stats;
    
    myStatsEl.textContent = `
        AP: ${player.ap.toFixed(2)}
        Crit: ${player.calculateCritChance().toFixed(2)}
        Hit: ${stats.hit}
        Str: ${(stats.str * stats.statMult).toFixed(2)}
        Agi: ${(stats.agi * stats.
            statMult).toFixed(2)}
        Haste: ${(stats.haste)};`;
}
updateStats();

function startSim() {
    const realtime = realtimeEl.checked;

    const simEl = document.createElement('div');
    simEl.classList.add('sim');

    const pauseBtn = document.createElement('button');
    pauseBtn.textContent = 'Pause';
    simEl.append(pauseBtn);

    pauseBtn.addEventListener('click', () => {
        worker.send('pause', undefined);
        const paused = pauseBtn.textContent === 'Pause';
        pauseBtn.textContent = paused ? 'Resume' : 'Pause';
        simEl.classList.toggle('paused', paused);
    });

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    simEl.append(closeBtn);

    closeBtn.addEventListener('click', () => {
        worker.terminate();
        simEl.remove();
    });

    const simStatsEl = document.createElement('div');
    simStatsEl.classList.add('simStats');
    simEl.append(simStatsEl);

    const dpsEl = document.createElement('div');
    dpsEl.classList.add('dps');
    simStatsEl.append(dpsEl);

    const timeEl = document.createElement('div');
    timeEl.classList.add('time');
    simStatsEl.append(timeEl);

    const normalDPSEl = document.createElement('div');
    normalDPSEl.classList.add('normalDPS');
    simStatsEl.append(normalDPSEl);

    const rlpmEl = document.createElement('div');
    rlpmEl.classList.add('rlpm');
    simStatsEl.append(rlpmEl);

    const execDPSEl = document.createElement('div');
    execDPSEl.classList.add('execDPS');
    simStatsEl.append(execDPSEl);

    const chosenRaceEL = document.createElement('div');
    chosenRaceEL.classList.add('simDetail', 'chosenRace');
    chosenRaceEL.textContent = 'Race: ' + Race[getRace()].toLowerCase();
    simEl.append(chosenRaceEL);

    const chosenStatsEL = document.createElement('div');
    chosenStatsEL.classList.add('simDetail', 'chosenStats');
    chosenStatsEL.textContent = 'Stats: ' + formatStats(getStats());
    simEl.append(chosenStatsEL);

    const itemsEl = document.createElement('div');
    itemsEl.classList.add('simDetail', 'equipedItems');
    itemsEl.textContent = 'Items: ' + equipmentIndicesToItem(getEquipmentIndices()).map(([item, slot]) => item.name).join(', ');
    simEl.append(itemsEl);

    const buffsEl = document.createElement('div');
    buffsEl.classList.add('simDetail', 'chosenBuffs');
    buffsEl.textContent = 'Buffs: ' + buffIndicesToBuff(getBuffs()).map((buff) => buff.name).join(', ');
    simEl.append(buffsEl);  

    const logEl = document.createElement('div');
    logEl.classList.add('log');

    if (realtime) {
        simEl.append(logEl);   
    }

    simsContainerEl.append(simEl);

    const worker = new WorkerInterface('./js/worker-bundle.js');

    worker.addEventListener('status', (status: any) => {
        const dps = status.totalDamage / status.duration * 1000;
        const normalDPS = status.normalDamage / status.normalDuration * 1000;
        const execDPS = status.execDamage / status.execDuration * 1000;

        dpsEl.textContent = `${dps.toFixed(1)}`;
        normalDPSEl.textContent = `${normalDPS.toFixed(1)}`;
        execDPSEl.textContent = `${execDPS.toFixed(1)}`;

        const seconds = status.duration / 1000;
        const days = seconds / 60 / 60 / 24;

        if (days >= 0.1) {
            timeEl.textContent = `${(days).toFixed(3)} days`;
        } else {
            timeEl.textContent = `${(seconds).toFixed(3)} seconds`;
        }

        const rlpm = status.powerLost / status.duration * 1000 * 60;
        rlpmEl.textContent = `${rlpm.toFixed(1)}`;
    });

    if (realtime) {
        worker.addEventListener('log', (data) => {
            const {time, text} = data;
            const newEl = document.createElement("div");
            newEl.textContent = `${(time / 1000).toFixed(3)} ${text}.`;
    
            const atScrollBottom = logEl.scrollHeight - logEl.scrollTop === logEl.clientHeight;
            logEl.appendChild(newEl);
    
            if (atScrollBottom) {
                logEl.scrollTop = logEl.scrollHeight;
            }
        });
    }

    const simdisc: SimulationDescription = {
        race: getRace(),
        stats: getStats(),
        equipment: getEquipmentIndices(),
        buffs: getBuffs(),
        fightLength: parseInt(fightLengthEl.value),
        realtime: realtime,
        heroicStrikeRageReq: parseInt(heroicStrikeRageReqEl.value),
        hamstringRageReq: parseInt(hamstringRageReqEl.value),
    };

    worker.send('simulate', simdisc);
}

document.getElementById('startBtn')!.addEventListener('click', () => {
    startSim();
});
