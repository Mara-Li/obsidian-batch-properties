import type { TFunction } from "i18next";

export interface BatchPropertiesSettings {
	separator: Separator;
	path: string;
	columnName: string;
	ignoreColumns: string[];
	createMissing: boolean;
}

export const DEFAULT_SETTINGS: BatchPropertiesSettings = {
	path: "",
	separator: ";",
	columnName: "Filepath",
	ignoreColumns: [],
	createMissing: false,
};
export type Translation = TFunction<"translation", undefined>;

export type Separator = ";" | "," | "\t" | "|" | "md";
