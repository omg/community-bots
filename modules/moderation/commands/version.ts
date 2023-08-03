import { replyToInteraction } from "../../../src/command-handler";

export function versionCommand(interaction, broadcastThis) {
  let version = 0; // TODO: get version from Somewhere idk
  replyToInteraction(interaction, "Version", "\n• v" + version, broadcastThis);
}

// TODO
