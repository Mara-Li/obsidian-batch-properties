import { describe, expect, it } from "bun:test";
import dedent from "dedent";
import type { BatchPropertiesSettings } from "../../src/interfaces";
import { ParseCSV } from "../../src/parse_csv";
import { mockTranslation } from "./__constants__";

describe("parse from markdown correctly", () => {
	it("Should parse the file correctly", () => {
		const markdownTable = dedent(`
		|filepath|username|age|city|
		|---|---|---|---|
		|folder1/note1.md|alice|30|New York|
		|folder2/note2.md|bob|25|Los Angeles|
		|folder3/note3.md|charlie|35|Chicago|
	`);
		const settings: BatchPropertiesSettings = {
			separator: "md",
			columnName: "filepath",
			path: "file.md",
			ignoreColumns: [],
			createMissing: false,
		};
		const parser = new ParseCSV(markdownTable, settings, mockTranslation);
		const result = parser.parse();
		expect(result).toEqual({
			"folder1/note1.md": { username: "alice", age: 30, city: "New York" },
			"folder2/note2.md": { username: "bob", age: 25, city: "Los Angeles" },
			"folder3/note3.md": { username: "charlie", age: 35, city: "Chicago" },
		});
	});
	it("Should cast the list correctly", () => {
		const markdownTable = dedent(`
		|filepath|tags|
		|---|---|
		|folder1/note1.md|["tag1", "tag2", "tag3"]|
		|folder2/note2.md|["tag4", "tag5"]|
		|folder3/note3.md|["tag6"]|
	`);
		const settings: BatchPropertiesSettings = {
			separator: "md",
			columnName: "filepath",
			path: "file.md",
			ignoreColumns: [],
			createMissing: false,
		};
		const parser = new ParseCSV(markdownTable, settings, mockTranslation);
		const result = parser.parse();
		expect(result).toEqual({
			"folder1/note1.md": { tags: ["tag1", "tag2", "tag3"] },
			"folder2/note2.md": { tags: ["tag4", "tag5"] },
			"folder3/note3.md": { tags: ["tag6"] },
		});
	});
	it("Should ignore the specified columns", () => {
		const markdownTable = dedent(`
		|filepath|username|age|city|
		|---|---|---|---|
		|folder1/note1.md|alice|30|New York|
		|folder2/note2.md|bob|25|Los Angeles|
		|folder3/note3.md|charlie|35|Chicago|
	`);
		const settings: BatchPropertiesSettings = {
			separator: "md",
			columnName: "filepath",
			ignoreColumns: ["age", "city"],
			path: "file.md",
			createMissing: false,
		};
		const parser = new ParseCSV(markdownTable, settings, mockTranslation);
		const result = parser.parse();
		expect(result).toEqual({
			"folder1/note1.md": { username: "alice" },
			"folder2/note2.md": { username: "bob" },
			"folder3/note3.md": { username: "charlie" },
		});
	});
});
