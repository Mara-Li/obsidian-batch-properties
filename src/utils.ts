import i18next, { type TOptions } from "i18next";
import { Notice } from "obsidian";
import type { I18nKey } from "./i18n/setting-i18n";

export function Notices(key: I18nKey, options?: TOptions, timeout?: number) {
	const message = i18next.t(key as any, options);
	new Notice(message, timeout);
}
