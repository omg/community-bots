/**
 * Calculates the permissions integer from an array of PermissionsBitField.Flags
 * 
 * @param permissions An array of PermissionsBitField.Flags to calculate the total permissions for
 * @returns The permissions representation
 */
function calculatePermissions(permissions: Set<bigint>): bigint {
  let permissionsInteger = BigInt(0);
  permissions.forEach(permission => permissionsInteger += permission);
  return permissionsInteger;
}

// find which modules use the same bot and combine the permissions together by using a Set

/**
 * Merges permissions from different modules into a single Set.
 * 
 * @param modulePermissions An array of permissions for each module
 * @returns A Set containing all the permissions from each module
 */
function mergePermissions(modulePermissions: bigint[][]) {
  const permissionsSet: Set<bigint> = new Set();
  modulePermissions.forEach(permissions => {
    permissions.forEach(permission => permissionsSet.add(permission));
  });
  return permissionsSet;
}

// now we have the permissions integer, we can send the user to oauth if they haven't set it up yet
// or, if the permissions integer has changed, we can send the user to oauth to update the permissions

// we also should check if the bot has the correct permissions after it's been added to a guild
// in case some dickhead removes the permissions from the bot like a fucking idiot
// https://discordjs.guide/popular-topics/permissions.html#checking-member-permissions