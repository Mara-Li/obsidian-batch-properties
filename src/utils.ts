import i18next, { type TOptions } from "i18next";
import { Notice, sanitizeHTMLToDom } from "obsidian";
import type { I18nKey } from "./i18n/setting-i18n";

export function Notices(
	key: I18nKey,
	options?: {
		tOptions?: TOptions;
		timeout?: number;
		type?: "success" | "error";
	}
) {
	const tOptions = options?.tOptions || undefined;
	const timeout = options?.timeout || undefined;
	const type = options?.type || undefined;
	const message = i18next.t(key as any, tOptions);
	if (type === "success") {
		new Notice(sanitizeHTMLToDom(`<span class="success">${message}</span>`), timeout);
		return;
	} else if (type === "error") {
		new Notice(sanitizeHTMLToDom(`<span class="error">${message}</span>`), timeout);
		return;
	}
	new Notice(message, timeout);
}
