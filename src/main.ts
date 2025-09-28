import i18next from "i18next";
import { getFrontMatterInfo, Plugin, TFile } from "obsidian";
import { resources, translationLanguage } from "./i18n";
import "uniformize";

import { type BatchPropertiesSettings, DEFAULT_SETTINGS } from "./interfaces";
import { ParseCSV } from "./parse_csv";
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

	async readBatch() {
		if (this.settings.path.length === 0) throw new Error(i18next.t("error.noPath"));
		const file = this.app.vault.getAbstractFileByPath(this.settings.path);
		const ext = this.settings.separator === "md" ? "md" : "csv";
		if (!file || !(file instanceof TFile) || !file.name.endsWith(ext))
			throw new Error(i18next.t("error.noFile"));
		let contents = await this.app.vault.read(file);
		if (ext === "md") {
			contents = contents.replace(/^\s*\n/gm, "");
			const frontmatterInfo = getFrontMatterInfo(contents);
			if (frontmatterInfo.exists) return contents.slice(frontmatterInfo.contentStart);
			return contents;
		}
		return contents;
	}

	async batch() {
		const contents = await this.readBatch();
		const data = new ParseCSV(contents, this.settings, i18next.t).parse();
		let errors = 0;
		const updated = 0;
		for (const filePath of Object.keys(data)) {
			let file = this.app.vault.getAbstractFileByPath(filePath);
			if (!file && this.settings.createMissing) {
				file = await this.app.vault.create(filePath, "");
			} else if (!file && !this.settings.createMissing) {
				console.warn(i18next.t("warn.noFile", { file: filePath }));
				errors++;
				continue;
			} else if (file && !(file instanceof TFile)) {
				if (this.settings.createMissing) {
					file = await this.app.vault.create(filePath, "");
				} else {
					console.warn(i18next.t("warn.noFile", { file: filePath }));
					errors++;
					continue;
				}
			}
			const toAddInFrontmatter = data[filePath];
		}
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
