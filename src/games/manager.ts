import { Client, Guild, TextChannel } from "discord.js";
import { lameBotClient } from "../../lame-bot/src/client";


// when attempting to abstract out the very minimal amount of code that is shared between games
// we only need:
// - the main client the game will be running on
// - very basic code to send and recieve messages from a specific channel (textchannels, threads, forums, etc)
// - a setup to start the game
// - a progress function to step the game forward
// - a cleanup function to make sure data doesnt blend over between games/rounds/instances
// - a way to end the game and a win condition
// - does the game need to restart after a "win" or "end" after a win?


// NOTE: Settings should include the NAME OF THE CLIENT that is going to be running the game
// Games need to register with the game manager to be started/run
// the process goes as follows
// 1. Create a game manager
// 2. Register a game with the game manager via `gm.registerGame<XBasedGame>(settings)`
// from there the game manager will then call the `setup` function on the game
// then the `preGame` function
// then it will start the game with the `start` function

// when starting the game the manager should also start the client update loop with the event in settings

// theres Def a better way than just using .set, whatever
// i think this is a bit more annoying to manage, but having the client be in the settings and not requiring
// the client to be imported or moved around is a bit better, and it looks cleaner when registering a game
const CLIENTS: Map<string, Client> = new Map(
    [
        ["lame", lameBotClient]
    ]
);

type gameFactory<T> = new (settings: any, client: any) => T;

type GameSettings = {
    timeout?: number;
    shouldRestartOnEnd?: boolean;
    
    guild: string;
    channel: string;
    replyMessage: string;

    event: string;
}

type RealSettings = Omit<GameSettings, "guild" | "channel"> & {
    client: Client,
    
    guild: Guild,
    channel: TextChannel,
}

class GameManager {
    private games: Map<string, TextChannelBasedGame>;

    constructor() {
        this.games = new Map();
    }

    registerGame<T extends TextChannelBasedGame>(factory: gameFactory<T>, name: string, client: Client, settings: GameSettings) {
        if (!client) {
            // i dont think its a good idea to default every game to a single client so, lets just Error !
            throw new Error("A valid client must be provided to register a game");
        } else if (!name) {
            throw new Error("Game must have a name to be registered");
        }

        // fuckin Hope this works
        if (!client.isReady()) {
            client.once("ready", async () => {
                setTimeout(() => { this.registerGame(factory, name, client, settings); }, 200)
            });
            return;
        }

        let game = new factory(settings, client);
        this.games.set(name, game);


        (async function startup() {
            // @ts-ignore
            await game.__setup();
        })();

        // @ts-ignore
        // Promise(async () => { await game.__setup(); }).then(
        //     () => {},
        //     (r) => {
        //         console.error(`Failed to register ${name} because of ${r}`)
        //     }
        // );
    }

    dropGame(name: string) {
        if (!this.games.has(name)) {
            throw new Error("Game does not exist");
        }

        let game = this.games.get(name);
        // @ts-ignore
        // this is a protected function so we technically shouldnt be able to call it
        // but we are the game manager so we should be able to do whatever we want
        game.__destroy();
    }
}


export abstract class TextChannelBasedGame {
    readonly client: Client;
    readonly settings: RealSettings;

    inProgress: boolean;

    constructor(settings: GameSettings, client: Client) {
        this.client = client;

        this.settings = {
            ...settings,
            client: client,
            guild: client.guilds.cache.get(settings.guild),
            channel: client.channels.cache.get(settings.channel) as TextChannel
        }

        this.inProgress = false;
    }

    // does it matter if these are protected or not?
    // i just wanted something to show that these shouldnt typically be modified
    // but we still need to call them from the game manager, which we can just ts-ignore to do
    // but it seems like a hacky way of doing this... maybe the __ is enough?
    protected async __setup(...args) {
        const self = this;

        await this.prepare();

        this.client.on(this.settings.event, function (message) { self.update(message); });

        await this.start();
    }
    
    // this doesnt really matter much as of now but, if this is ever used
    //  figure out of its a good idea to call this.end() when the game is over
    protected async __destroy(...args) {
        const self = this;

        this.client.off(this.settings.event, self.update);
        
        await this.end();
        await this.clean();
    }

    abstract prepare(...args): any;
    abstract start(...args): any;
    abstract update(...args): any;
    abstract end(...args): any;
    abstract clean(...args): any;
}

//

export const GAME_MANAGER = new GameManager();

//