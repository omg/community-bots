class GameTemplate {
  guild: string;
  channel?: string;

  constructor(guild: string, channel?: string) {
    this.guild = guild;
    this.channel = channel;
  }
}

interface GameTemplate {
  guild: string;
  channel?: string;

  inProgress?: boolean;
}

type BindMap = {
  [ key: string ]: (...args: any[]) => any;
}

class WordBombMini extends GameTemplate {
  constructor(settings: GameTemplate) {
    super(settings.guild, settings.channel);
    this.inProgress = false;

    // this.bindEvents();
  }

  endRound() {
    console.log("ended round in " + this.guild)
  }
}

let our = new WordBombMini({
  guild: "124",
})

function registerGame(game: GameTemplate, bindMap: BindMap) {

}

registerGame(our, {
  "messageCreate": our.endRound,
})