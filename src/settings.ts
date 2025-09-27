import { type App, PluginSettingTab, Setting, TFile } from "obsidian";
import type BatchProperties from "./main";
import "./i18n/setting-i18n"; // extension setNames / setDescs / setPlaceholders
import i18next from "i18next";
import { FileSuggester } from "./FileSuggester";
import type { BatchPropertiesSettings, Separator } from "./interfaces";
import { Notices } from "./utils";

export class BatchPropertiesSettingTab extends PluginSettingTab {
	plugin: BatchProperties;
	settings: BatchPropertiesSettings;
	isInvalid: boolean = false;

	constructor(app: App, plugin: BatchProperties) {
		super(app, plugin);
		this.plugin = plugin;
		this.settings = plugin.settings;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setNames("separator.name")
			.setDescs("separator.desc")
			.addDropdown((dropdown) => {
				dropdown
					.addOption(";", ";")
					.addOption(",", ",")
					.addOption("\t", `${i18next.t("separator.tab")}`)
					.addOption("|", "|")
					.addOption("md", `${i18next.t("separator.md")}`)
					.setValue(this.settings.separator)
					.onChange(async (value) => {
						this.settings.separator = value as Separator;
						await this.plugin.saveSettings();
						this.display();
					});
			});

		const batchPath = new Setting(containerEl)
			.setNames("path.name")
			.setDescs("path.desc")
			.addSearch(async (cb) => {
				cb.setPlaceholders("path.placeholder");
				cb.setValue(this.settings.path);
				const ext = this.settings.separator === "md" ? "md" : "csv";
				new FileSuggester(cb.inputEl, this.app, ext, async (file) => {
					this.settings.path = file.path;
					await this.plugin.saveSettings();
					this.display();
				});
				cb.clearButtonEl.addEventListener("click", async () => {
					this.settings.path = "";
					await this.plugin.saveSettings();
				});
			})
			.addExtraButton((btn) => {
				btn
					.setIcon("save")
					.setTooltips("path.verify")
					.onClick(() => {
						const file = this.app.vault.getAbstractFileByPath(this.settings.path);
						if (!(file instanceof TFile)) {
							Notices("path.error");
							this.isInvalid = true;
							this.display();
						}
					});
			});

		if (this.isInvalid) batchPath.setClass("is-invalid");
	}
}
