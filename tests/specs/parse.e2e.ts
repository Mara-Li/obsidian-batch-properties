/** biome-ignore-all lint/correctness/noUndeclaredVariables: global variable from mocha */
import { browser, expect } from "@wdio/globals";
import * as fs from "fs";
import * as path from "path";
import { obsidianPage } from "wdio-obsidian-service";
import type { BatchPropertiesSettings } from "../../src/interfaces";

const manifest = JSON.parse(
	fs.readFileSync(`${path.resolve(__dirname, "..", "..", "manifest.json")}`, "utf-8")
) as { id: string; name: string; version: string };

const folder = path.resolve("..");
const expected = fs.readFileSync(path.join(folder, "expected.md"), "utf-8");
const fixtures = fs.readFileSync(path.join(folder, "original.md"), "utf-8");

function loadTables() {
	const tablesFolder = path.join(folder, "tables");
	const files = fs.readdirSync(tablesFolder);
	const settings: BatchPropertiesSettings[] = [];

	files.forEach((file) => {
		const fileName = path.parse(file).name;
		const defaultSettings: BatchPropertiesSettings = {
			createMissing: true,
			ignoreColumns: ["ignored"],
			openModal: false,
			columnName: "filepath",
			path: `tables/${fileName}`,
			separator: ",",
		};
		switch (fileName) {
			case "comma":
				settings.push(
					Object.assign({
						separator: ",",
					}),
					defaultSettings
				);
				break;
			case "semicolon":
				settings.push(
					Object.assign({
						separator: ";",
					}),
					defaultSettings
				);
				break;
			case "tabulation":
				settings.push(
					Object.assign({
						separator: "\t",
					}),
					defaultSettings
				);
				break;
			case "pipe":
				settings.push(
					Object.assign({
						separator: "|",
					}),
					defaultSettings
				);
				break;
			case "markdown":
				settings.push(
					Object.assign({
						separator: "md",
					}),
					defaultSettings
				);
				break;
			case "markdown_fm":
				settings.push(
					Object.assign({
						separator: "md",
					}),
					defaultSettings
				);
				break;
		}
	});
	return settings;
}

const settings = loadTables();
