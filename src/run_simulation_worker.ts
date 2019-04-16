import {  MainThreadInterface } from "./worker_event_interface.js";
import { Simulation } from "./simulation.js";
import { SimulationDescription, buffIndicesToBuff, equipmentIndicesToItem } from "./simulation_utils.js";
import { LogFunction } from "./player.js";
import { chooseAction } from "./warrior_ai.js";

const mainThreadInterface = MainThreadInterface.instance;

let currentSim: Simulation|undefined = undefined;

mainThreadInterface.addEventListener('simulate', (data: any) => {
    const simdesc = <SimulationDescription>data;

    let logFunction: LogFunction|undefined = undefined;

    if (simdesc.realtime) {
        logFunction = (time: number, text: string) => {
            mainThreadInterface.send('log', {
                time: time,
                text: text
            });
        };
    }

    currentSim = new Simulation(simdesc.race, simdesc.stats,
        equipmentIndicesToItem(simdesc.equipment),
        buffIndicesToBuff(simdesc.buffs),
        chooseAction, simdesc.fightLength, simdesc.realtime, logFunction);

    currentSim.start();

    setInterval(() => {
        mainThreadInterface.send('status', currentSim!.status);
    }, 1000);
});

mainThreadInterface.addEventListener('pause', () => {
    if (currentSim) {
        currentSim.pause();
    }
});
