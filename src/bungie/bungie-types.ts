import { z } from "zod";

export interface BungieApiOptions extends RequestInit {
  includeApiKey?: boolean;
  statsUrl?: boolean;
  dbCache?: {
    group: string;
    key: string;
  };
  throttled?: boolean;
}

export type BungieResponse<T> =
  | {
      Success: true;
      Response: T;
      ErrorCode: 1;
      ThrottleSeconds: 0;
      ErrorStatus: string;
      Message: string;
      MessageData: {};
      DetailedErrorTrace?: string;
    }
  | {
      Success: false;
      Response?: T;
      ErrorCode: number;
      ThrottleSeconds: number;
      ErrorStatus: string;
      Message: string;
      MessageData: Record<string, string>;
      DetailedErrorTrace?: string;
    };

export const PGCR_SCHEMA = z.object({
  period: z.string().datetime(),
  startingPhaseIndex: z.optional(z.number()),
  activityWasStartedFromBeginning: z.optional(z.boolean()),
  activityDetails: z.object({
    referenceId: z.number(),
    directorActivityHash: z.number(),
    instanceId: z.string(),
    mode: z.number(),
    modes: z.array(z.number()),
    isPrivate: z.boolean(),
    membershipType: z.number(),
  }),
  entries: z.array(
    z.object({
      standing: z.number(),
      // score: z.object({}),
      player: z.object({
        destinyUserInfo: z.object({
          iconPath: z.optional(z.string()),
          crossSaveOverride: z.number(),
          applicableMembershipTypes: z.array(z.number()),
          isPublic: z.boolean(),
          membershipType: z.number(),
          membershipId: z.string(),
          displayName: z.string(),
          bungieGlobalDisplayName: z.string(),
          bungieGlobalDisplayNameCode: z.number(),
        }),
        characterClass: z.enum(["Titan", "Hunter", "Warlock"]),
        classHash: z.number(),
        raceHash: z.number(),
        genderHash: z.number(),
        characterLevel: z.number(),
        lightLevel: z.number(),
        emblemHash: z.number(),
      }),
      characterId: z.string(),
      values: z.record(
        z.string(),
        z.object({
          basic: z.object({
            value: z.number(),
            displayValue: z.string(),
          }),
        })
      ),
      extended: z.object({
        weapons: z.array(z.object({})),
        values: z.record(
          z.string(),
          z.object({
            basic: z.object({
              value: z.number(),
              displayValue: z.string(),
            }),
          })
        ),
      }),
    })
  ),
  // teams: z.array(z.object({}))
});
export type PGCR = z.TypeOf<typeof PGCR_SCHEMA>;

export interface ActivityHistory {
  activities: {
    activityDetails: {
      referenceId: number;
      directorActivityHash: number;
      instanceId: string;
      mode: number;
      modes: number[];
      isPrivate: boolean;
      membershipType: number;
    };
    values: {
      [key: string]: {
        statId: string;
        basic: {
          value: number;
          displayValue: string;
        };
      };
    };
  }[];
}

export interface UserProfile {
  profile: {
    data: {
      userInfo: {
        membershipType: number;
        membershipId: string;
        bungieGlobalDisplayName: string;
        bungieGlobalDisplayNameCode: number;
      };
    };
  };
  profileTransitoryData: {
    data?: {
      partyMembers?: {
        membershipId: string;
        emblemHash: number;
      }[];
    };
  };
  characters: {
    data: {
      [key: string]: {
        membershipId: string;
        membershipType: number;
        characterId: string;
        dateLastPlayed: string;
        emblemHash: number;
        classType: number;
      };
    };
  };
  characterEquipment: {
    data: {
      [key: string]: {
        items: {
          bucketHash: number;
          itemHash: number;
          overrideStyleItemHash?: number;
          state: number;
        }[];
      };
    };
  };
}
