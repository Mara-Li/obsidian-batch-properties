import {
	type App,
	Notice,
	PluginSettingTab,
	Setting,
	sanitizeHTMLToDom,
	TFile,
} from "obsidian";
import type BatchProperties from "./main";
import "./i18n/setting-i18n";
import i18next from "i18next";
import { FileSuggester } from "./FileSuggester";
import type { BatchPropertiesSettings, Separator } from "./interfaces";
import { ParseCSV } from "./parse_csv";
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

		containerEl.addClass("batch-properties");

		new Setting(containerEl)
			.setNames("separator.name")
			.setDescs("separator.desc")
			.addDropdown((dropdown) => {
				dropdown
					.addOption(";", `${i18next.t("separator.semicolon")}`)
					.addOption(",", `${i18next.t("separator.comma")}`)
					.addOption("\t", `${i18next.t("separator.tab")}`)
					.addOption("|", `${i18next.t("separator.pipe")}`)
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
					.onClick(async () => {
						if (this.settings.path.length === 0) {
							Notices("error.noPath", { type: "error" });
							this.isInvalid = true;
							this.display();
							return;
						}
						const file = this.app.vault.getAbstractFileByPath(this.settings.path);
						if (!(file instanceof TFile)) {
							Notices("error.notFound");
							this.isInvalid = true;
							this.display();
						}
						const contents = await this.plugin.readBatch();
						try {
							new ParseCSV(
								contents,
								this.settings,
								i18next.t,
								this.settings.path,
								this.app
							).parse();
							this.isInvalid = false;
							this.display();
						} catch (e) {
							console.error(e);
							new Notice(
								sanitizeHTMLToDom(`<span class="error">${(e as Error).message}</span>`)
							);
							this.isInvalid = true;
							this.display();
							return;
						}
						Notices("path.success", { type: "success" });
					});
			});

		if (this.isInvalid) batchPath.setClass("is-invalid");

		new Setting(containerEl)
			.setNames("columnName.name")
			.setDescs("columnName.desc")
			.addText((text) =>
				text
					.setValue(this.settings.columnName)
					.setPlaceholder(i18next.t("columnName.placeholder"))
					.onChange(async (value) => {
						this.settings.columnName = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setNames("ignoreColumns.name")
			.setDescs("ignoreColumns.desc")
			.addTextArea((text) =>
				text
					.setValue(this.settings.ignoreColumns.join(","))
					.setPlaceholders("ignoreColumns.placeholder")
					.onChange(async (value) => {
						this.settings.ignoreColumns = value.split(/[,\n]/).map((v) => v.trim());
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setNames("createMissing.name")
			.setDescs("createMissing.desc")
			.addToggle((toggle) =>
				toggle.setValue(this.settings.createMissing).onChange(async (value) => {
					this.settings.createMissing = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setNames("openModal.name")
			.setDescs("openModal.desc")
			.addToggle((toggle) =>
				toggle.setValue(this.settings.openModal).onChange(async (value) => {
					this.settings.openModal = value;
					await this.plugin.saveSettings();
				})
			);
	}
}
