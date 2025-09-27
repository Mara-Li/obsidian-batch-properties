import { Plugin, Modal } from "obsidian";

import { resources, translationLanguage } from "./i18n";
import i18next from "i18next";

import { BatchPropertiesSettings, DEFAULT_SETTINGS } from "./interfaces";
import { BatchPropertiesSettingTab } from "./settings";

export default class BatchProperties extends Plugin {
	settings!: BatchPropertiesSettings;

	async onload() {
		console.log(`[${this.manifest.name}] Loaded`);

		await this.loadSettings();

		//load i18next
		await i18next.init({
			lng: translationLanguage,
			fallbackLng: "en",
			resources,
			returnNull: false,
			returnEmptyString: false,
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new BatchPropertiesSettingTab(this.app, this));
	}

	onunload() {
		console.log(`[${this.manifest.name}] Unloaded`);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
