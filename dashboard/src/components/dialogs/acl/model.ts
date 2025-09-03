
export type AccessControlTargetStruct = {
  cluster: number | undefined;
  endpoint: number | undefined;
  deviceType: number | undefined;
};

export type AccessControlEntryRawInput = {
  "1": number;
  "2": number;
  "3": number[];
  "4": AccessControlTargetStruct[] | undefined;
  "254": number;
};

export type AccessControlEntryStruct = {
  privilege: number;
  authMode: number;
  subjects: number[];
  targets: AccessControlTargetStruct[] | undefined;
  fabricIndex: number;
};

export class AccessControlTargetTransformer {
  private static readonly KEY_MAPPING: {
    [inputKey: string]: keyof AccessControlTargetStruct;
  } = {
    "0": "cluster",
    "1": "endpoint",
    "2": "deviceType",
  };

  public static transform(input: any): AccessControlTargetStruct {
    if (!input || typeof input !== "object") {
      throw new Error("Invalid input: expected an object");
    }

    const result: Partial<AccessControlTargetStruct> = {};
    const keyMapping = AccessControlTargetTransformer.KEY_MAPPING;

    for (const key in input) {
      if (key in keyMapping) {
        const mappedKey = keyMapping[key];
        if (mappedKey) {
          const value = input[key];
          if (value === undefined) continue;
          result[mappedKey] = value;
        }
      }
    }
    return result as AccessControlTargetStruct;
  }
}

export class AccessControlEntryDataTransformer {
  private static readonly KEY_MAPPING: {
    [inputKey: string]: keyof AccessControlEntryStruct;
  } = {
    "1": "privilege",
    "2": "authMode",
    "3": "subjects",
    "4": "targets",
    "254": "fabricIndex",
  };

  public static transform(input: any): AccessControlEntryStruct {
    if (!input || typeof input !== "object") {
      throw new Error("Invalid input: expected an object");
    }

    const result: Partial<AccessControlEntryStruct> = {};
    const keyMapping = AccessControlEntryDataTransformer.KEY_MAPPING;

    for (const key in input) {
      if (key in keyMapping) {
        const mappedKey = keyMapping[key];
        if (mappedKey) {
          const value = input[key];
          if (value === undefined) continue;
          if (mappedKey === "subjects") {
            result[mappedKey] = Array.isArray(value) ? value : undefined;
          } else if (mappedKey === "targets") {
            if (Array.isArray(value)) {
              const _targets = Object.values(value).map((val) =>
                AccessControlTargetTransformer.transform(val),
              );
              result[mappedKey] = _targets;
            } else {
              result[mappedKey] = undefined;
            }
          } else {
            result[mappedKey] = value;
          }
        }
      }
    }

    return result as AccessControlEntryStruct;
  }
}
