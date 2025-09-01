export type InputType = {
  [key: string]: number | number[] | undefined;
};

export interface BindingEntryStruct {
  node: number;
  group: number | undefined;
  endpoint: number;
  cluster: number | undefined;
  fabricIndex: number | undefined;
}

export class BindingEntryDataTransformer {
  private static readonly KEY_MAPPING: {
    [inputKey: string]: keyof BindingEntryStruct;
  } = {
    "1": "node",
    "3": "endpoint",
    "4": "cluster",
    "254": "fabricIndex",
  };

  public static transform(input: any): BindingEntryStruct {
    if (!input || typeof input !== "object") {
      throw new Error("Invalid input: expected an object");
    }

    const result: Partial<BindingEntryStruct> = {};
    const keyMapping = BindingEntryDataTransformer.KEY_MAPPING;

    for (const key in input) {
      if (key in keyMapping) {
        const mappedKey = keyMapping[key];
        if (mappedKey) {
          const value = input[key];
          if (value === undefined) {
            continue;
          }
          if (mappedKey === "fabricIndex") {
            result[mappedKey] = value === undefined ? undefined : Number(value);
          } else if (mappedKey === "node" || mappedKey === "endpoint") {
            result[mappedKey] = Number(value);
          } else {
            result[mappedKey] = value as BindingEntryStruct[typeof mappedKey];
          }
        }
      }
    }

    return result as BindingEntryStruct;
  }
}
