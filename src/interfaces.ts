import type {TFunction} from "i18next";

export interface BatchPropertiesSettings {
	separator: Separator;
	path: string;
	columnName: string;
}

export const DEFAULT_SETTINGS: BatchPropertiesSettings = {
	path: "",
	separator: ";",
	columnName: "Filepath",
};
export type Translation = TFunction<"translation", undefined>;

export type Separator = ";" | "," | "\t" | "|" | "md";
