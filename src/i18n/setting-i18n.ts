// noinspection JSClassNamingConvention

import i18next, { type TOptions } from "i18next";
import {
	ExtraButtonComponent,
	SearchComponent,
	Setting,
	TextAreaComponent,
	TextComponent,
} from "obsidian";

// Deduces the type of valid keys from i18next (intersection with string to preserve the use of literals)
export type I18nKey = Parameters<typeof i18next.t>[0] & string;

// Augmentation module to add the setNames and setDescs methods to Setting instances
declare module "obsidian" {
	interface Setting {
		/**
		 * Shortcut for setName(i18next.t(key, options))
		 * @param key Translation key for i18next
		 * @param options Options facultatives for i18next
		 */
		setNames(key: I18nKey, options?: TOptions): this;
		/**
		 * Shortcut for setDesc(i18next.t(key, options))
		 * @param key Translation key for i18next
		 * @param options Options facultatives for i18next
		 */
		setDescs(key: I18nKey, options?: TOptions): this;
	}
	interface TextComponent {
		/**
		 * Shortcut for setPlaceholder(i18next.t(key, options))
		 * @param key Translation key for i18next
		 * @param options Options facultatives for i18next
		 * */
		setPlaceholders(key: I18nKey, options?: TOptions): this;
	}
	interface SearchComponent {
		/** Raccourci pour setPlaceholder(i18next.t(key, options)) (spécifique SearchComponent) */
		setPlaceholders(key: I18nKey, options?: TOptions): this;
	}
	interface ExtraButtonComponent {
		/**
		 * Shortcut for setTooltip(i18next.t(key, options))
		 * @param key Translation key for i18next
		 * @param options Options facultatives for i18next
		 * */
		setTooltips(key: I18nKey, options?: TOptions): this;
	}
	interface TextAreaComponent {
		setPlaceholders(key: I18nKey, options?: TOptions): this;
	}
}

// Runtime implementation of the setNames and setDescs methods
(Setting as any).prototype.setNames = function (key: I18nKey, options?: TOptions) {
	return this.setName(i18next.t(key as any, options));
};
(Setting as any).prototype.setDescs = function (key: I18nKey, options?: TOptions) {
	return this.setDesc(i18next.t(key as any, options));
};

// Runtime implementation of the setPlaceholders method
(TextComponent as any).prototype.setPlaceholders = function (
	key: I18nKey,
	options?: TOptions
) {
	return this.setPlaceholder(i18next.t(key as any, options));
};
(SearchComponent as any).prototype.setPlaceholders = function (
	key: I18nKey,
	options?: TOptions
) {
	return this.setPlaceholder(i18next.t(key as any, options));
};

// Runtime implementation of the setTooltips method
(ExtraButtonComponent as any).prototype.setTooltips = function (
	key: I18nKey,
	options?: TOptions
) {
	return this.setTooltip(i18next.t(key as any, options));
};

(TextAreaComponent as any).prototype.setPlaceholders = function (
	key: I18nKey,
	options?: TOptions
) {
	return this.setPlaceholder(i18next.t(key as any, options));
};
