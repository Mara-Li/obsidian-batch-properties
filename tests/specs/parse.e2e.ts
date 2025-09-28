/** biome-ignore-all lint/correctness/noUndeclaredVariables: global variable from mocha */

import { browser, expect } from "@wdio/globals";
import * as fs from "fs";
import * as path from "path";
import { obsidianPage } from "wdio-obsidian-service";
import type { BatchPropertiesSettings } from "../../src/interfaces";
import type BatchProperties from "../../src/main";

const manifest = JSON.parse(
	fs.readFileSync(`${path.resolve(__dirname, "..", "..", "manifest.json")}`, "utf-8")
) as { id: string; name: string; version: string };

console.log(
	`Running tests for ${manifest.name} v${manifest.version} in ${process.env.VAULT_TEST}`
);

const folder = path.resolve(__dirname, "..");
const tableFolder = path.join(folder, "fixtures", "tables");

type Fixtures = {
	name: string;
	content: string;
	expected: string;
};

function loadTables() {
	const files = fs.readdirSync(tableFolder);
	const settings: BatchPropertiesSettings[] = [];

	files.forEach((file) => {
		const fileName = path.parse(file).name;
		const basename = path.basename(file);
		const defaultSettings: BatchPropertiesSettings = {
			createMissing: true,
			ignoreColumns: ["ignored"],
			openModal: false,
			columnName: "filepath",
			path: `tables/${basename}`,
			separator: ",",
		};
		switch (fileName) {
			case "comma":
				defaultSettings.separator = ",";
				settings.push(defaultSettings);
				break;
			case "semicolon":
				defaultSettings.separator = ";";
				settings.push(defaultSettings);
				break;
			case "tabulation":
				defaultSettings.separator = "\t";
				settings.push(defaultSettings);
				break;
			case "pipe":
				defaultSettings.separator = "|";
				settings.push(defaultSettings);
				break;
			case "markdown":
			case "markdown_fm":
				defaultSettings.separator = "md";
				settings.push(defaultSettings);
				break;
		}
	});
	return settings.filter((x) => x.path !== undefined);
}

function loadFixtures() {
	const fixtures = path.join(folder, "fixtures", "original");
	const expecteds = path.join(folder, "fixtures", "expected");
	const files = fs.readdirSync(fixtures);
	const fixturesContent: Fixtures[] = [];

	files.forEach((file) => {
		const filePath = path.join(fixtures, file);
		const content = fs.readFileSync(filePath, "utf-8");
		const expected = fs.readFileSync(path.join(expecteds, file), "utf-8");
		const basename = path.basename(file);
		fixturesContent.push({ name: basename, content, expected });
	});
	return fixturesContent;
}

const settings = loadTables();
const fixtures = loadFixtures();
for (const setting of settings) {
	describe(`Parse Tables E2E - ${setting.path}`, async () => {
		beforeEach(async () => {
			await obsidianPage.resetVault();
			const baseName = path.basename(setting.path);
			const table = path.join(tableFolder, baseName);
			const tableContent = fs.readFileSync(table, "utf-8");
			await obsidianPage.write(`tables/${baseName}`, tableContent);
			console.log(`Table used: ${baseName}`, setting);
			await browser.executeObsidian(
				async ({ app }, pluginId, defaultSettings: BatchPropertiesSettings) => {
					const plugin = app.plugins.getPlugin(pluginId) as BatchProperties;
					if (plugin) {
						plugin.settings = defaultSettings;
						await plugin.saveSettings();
					}
				},
				manifest.id,
				setting
			);
			for (const fixture of fixtures) {
				await obsidianPage.write(fixture.name, fixture.content);
			}
			await browser.pause(5000);
			await browser.executeObsidianCommand(`${manifest.id}:batch-properties`);
			await browser.pause(20000);
		});
		const fixture = fixtures[0];
		it(`${fixture.name} - should be correctly parsed`, async () => {
			const fileContent = await browser.executeObsidian(
				({ app, obsidian }, fileName: string) => {
					const file = app.vault.getAbstractFileByPath(fileName);
					if (file && file instanceof obsidian.TFile) return app.vault.read(file);
					throw new Error(`File ${fileName} not found`);
				},
				fixture.name
			);
			expect(fileContent).toBe(fixture.expected);
		});
	});
}
