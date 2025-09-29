/** biome-ignore-all lint/correctness/noUndeclaredVariables: global variable from mocha */

import { browser, expect } from "@wdio/globals";
import { obsidianPage } from "wdio-obsidian-service";
import type { BatchPropertiesSettings } from "../../src/interfaces";
import type BatchProperties from "../../src/main";
import {
	loadCreatedFile,
	loadFixtures,
	loadTables,
	manifest,
	normalizeWhitespace,
	waitForPlugin,
	waitForProcessingComplete,
} from "./__utils__";

const { settings, tableContents } = loadTables();
const fixtures = loadFixtures();
const createdFiles = loadCreatedFile();

for (let i = 0; i < settings.length; i++) {
	const setting = settings[i];
	const tableContent = tableContents[i];

	describe(`Parse Tables E2E - ${setting.path}`, () => {
		beforeEach(async () => {
			await obsidianPage.resetVault();
			await obsidianPage.write(`tables/${tableContent.baseName}`, tableContent.content);
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
			await Promise.all(
				fixtures.map((fixture) => obsidianPage.write(fixture.name, fixture.content))
			);
			await waitForPlugin(undefined, browser);
			await browser.executeObsidianCommand(`${manifest.id}:batch-properties`);

			// Attendre que le traitement des fichiers soit complètement terminé
			await waitForProcessingComplete(fixtures, undefined, browser);
		});

		// Tester tous les fixtures au lieu d'un seul
		fixtures.forEach((fixture) => {
			it(`${fixture.name} - should be correctly parsed`, async () => {
				const fileContent = await browser.executeObsidian(
					({ app, obsidian }, fileName: string) => {
						const file = app.vault.getAbstractFileByPath(fileName);
						if (file && file instanceof obsidian.TFile) return app.vault.read(file);
						return undefined;
					},
					fixture.name
				);
				expect(fileContent).toBeDefined();
				if (fileContent) {
					const normalizedFileContent = normalizeWhitespace(fileContent);
					expect(normalizedFileContent).toHaveText(normalizeWhitespace(fixture.expected));
				}
			});
		});
		createdFiles.forEach((createdFile) => {
			it(`${createdFile.name} - should be created and correctly parsed`, async () => {
				const fileContent = await browser.executeObsidian(
					({ app, obsidian }, fileName: string) => {
						const file = app.vault.getAbstractFileByPath(fileName);
						if (file && file instanceof obsidian.TFile) return app.vault.read(file);
						return undefined;
					},
					createdFile.name
				);
				expect(fileContent).toBeDefined();
				if (fileContent) {
					const normalizedFileContent = normalizeWhitespace(fileContent);
					expect(normalizedFileContent).toHaveText(
						normalizeWhitespace(createdFile.content)
					);
				}
			});
		});
	});
}
