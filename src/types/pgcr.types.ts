export type PGCR = PGCRv1;

export type PGCR_Versionless = PGCRv1;

export interface PGCRv1 {
  versionCode: 1;
  wasFresh: boolean | null;
  wasCompleted: boolean;
  timestamp: number;
  instanceId: number;
  activityHash: number;
  players: {
    membershipType: number;
    membershipId: number;
    characterId: number;
    /**
     * "Username#HASH" when available, otherwise just "Username"
     */
    displayName: string;
    class: "titan" | "warlock" | "hunter";
    emblemHash?: number;
    iconPath?: string;
    stats: {
      kills: number;
      assists: number;
      deaths: number;
      completed: boolean;
      timePlayedSeconds: number;
      precisionKills: number;
      grenadeKills: number;
      meleeKills: number;
      superKills: number;
      abilityKills: number;
    };
  }[];
}

export function deserialize(str: string): PGCR {
  // TODO: implement deserialization
  return JSON.parse(str);
}

export function serialize(pgcr: PGCR): string {
  // TODO: implement serialization
  return JSON.stringify(pgcr);
}
