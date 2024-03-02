import { Client, Guild, TextChannel } from "discord.js";
import { getChannel, waitForReady } from "../../lame-bot/src/client";

// promises are Confusing :plonk:
// async function getChannelPromise(channel: string | TextChannel): Promise<TextChannel> {
//     if (typeof channel === "string") {
//         return await getChannel(channel) as TextChannel;
//     } else {
//         return channel;
//     }
    
//     // return new Promise((resolve, reject) => {
//     //     if (typeof channel === "string") {
//     //         getChannel(channel).then((c) => {
//     //             resolve(c as TextChannel);
//     //         });
//     //     } else {
//     //         resolve(channel);
//     //     }
//     // });
// }

// should have a base class for this, but it doesnt matter right now
// all the current ideas rely on textchannels

export abstract class TextChannelBasedGame {
    readonly client: Client;
    // events: { [key: string]: Function };
    event: string;

    _channel: string;
    _guild: string;

    timeout: number;
    inProgress: boolean;


    constructor(channel: string, timeout: number, runAsClient: Client) {
        this.client = runAsClient;
        this._channel = channel;

        this.timeout = timeout;
        this.inProgress = false;
        

        // should startGame be called here?
        // my first thought is no, because creating it shouldnt just start it instantly
        // it will especially be a problem if we want to have other things happen before the game starts
        // like adding events (?)
        // this.startGame();
    }

    // i dont really Like doing this, i think it would be better to have them registered
    // in the constructor, but its hard to do that if you want to reference in class functions
    // ex: class.addEvent("messageCreate", class.onMessageCreate)
    // vs
    // referencing the class before/while its being defined
    // addEvent(event: string, callback: Function) {
    //     this.events[event] = callback;
    // }

    // this function should be whats called when the game is ended
    // it shouldnt(?) be modified by the subclasses
    // this will call the implementation of endGame, and remove listeners/other cleanup
    // Could just let endGame remove the listener but /shrug
    async destroy() {
        // endGame first so the subclass can grab any last minute data it may need
        // (idk?)
        await this.endGame();

        // cleanup
        // if we ever let subclasses create tables in the database they should be cleaned up here
        // which means if we Do add something like that it will be alot of work (:deep:)
        this.client.removeListener(this.event, this.update);
    }

    // update is what progresses the game state
    // all the logic should be handled here
    // and neccessary functions should be called from here
    abstract update(...args): void;
    
    abstract startGame(): void;
    abstract endGame(): void;
}