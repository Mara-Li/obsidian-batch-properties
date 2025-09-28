import i18next from "i18next";
import { getFrontMatterInfo, Notice, Plugin, sanitizeHTMLToDom, TFile } from "obsidian";
import { resources, translationLanguage } from "./i18n";
import "uniformize";

import {
	type BatchPropertiesSettings,
	DEFAULT_SETTINGS,
	type Result,
	type Results,
} from "./interfaces";
import { ParseCSV } from "./parse_csv";
import { ResutModal } from "./result_modals";
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

		this.addCommand({
			id: "batch-properties",
			name: i18next.t("command.name"),
			callback: async () => {
				try {
					await this.batch();
				} catch (e) {
					console.error(e);
					new Notice(
						sanitizeHTMLToDom(`<span class="error">❌ ${(e as Error).message}</span>`),
						0
					);
				}
			},
		});
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

	async createFileIfNotExists(
		filePath: string
	): Promise<{ file: TFile; isCreated: boolean }> {
		if (!filePath.endsWith(".md"))
			throw new Error(i18next.t("error.notMarkdown", { file: filePath }));

		const file = this.app.vault.getFileByPath(filePath);
		if (!file && this.settings.createMissing) {
			return {
				file: await this.app.vault.create(filePath, ""),
				isCreated: true,
			};
		}

		if (!file) throw new Error(i18next.t("error.noFile", { file: filePath }));

		return { file, isCreated: false };
	}

	async batch() {
		const contents = await this.readBatch();
		const data = new ParseCSV(
			contents,
			this.settings,
			i18next.t,
			this.app,
			this.settings.path
		).parse();
		const results: Results = [];
		const maxLength = Object.keys(data).length;
		const noticeBar = new Notice(`📤 ${i18next.t("notice.loading")} 0/${maxLength}\``, 0);
		let processed = 0;
		for (const filePath of Object.keys(data)) {
			const result: Result = {
				file: filePath,
				type: "updated",
			};
			const toAddInFrontmatter = data[filePath];
			processed += 1;
			noticeBar.setMessage(`📤 ${i18next.t("notice.loading")} ${processed}/${maxLength}`);
			// biome-ignore lint/correctness/noUndeclaredVariables: sleep is declared globally by Obsidian
			await sleep(500); //to allow the notice to update
			try {
				const { file, isCreated } = await this.createFileIfNotExists(filePath);
				if (isCreated) result.type = "created";
				results.push(result);

				await this.addToFrontmatter(file, toAddInFrontmatter);
			} catch (e) {
				console.error(e);
				result.type = "error";
				result.error = (e as Error).message;
				results.push(result);
			}
		}
		noticeBar.setMessage(
			sanitizeHTMLToDom(
				`<span class="success">✅ ${i18next.t("notice.completed")}</span>`
			)
		);
		// biome-ignore lint/correctness/noUndeclaredVariables: sleep is declared globally by Obsidian
		await sleep(2000); //to allow the notice to be seen
		noticeBar.hide();
		new ResutModal(this.app, results).open();
	}

	async addToFrontmatter(file: TFile, toAdd: Record<string, any>) {
		await this.app.fileManager.processFrontMatter(file, (fm) => {
			for (const key of Object.keys(toAdd)) {
				fm[key] = toAdd[key];
			}
		});
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
