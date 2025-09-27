import { expect, it } from "bun:test";
import dedent from "dedent";
import type { BatchPropertiesSettings } from "../../src/interfaces";
import { ParseCSV } from "../../src/parse_csv";
import { mockTranslation } from "./__constants__";

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
	};
	const parser = new ParseCSV(markdownTable, settings, mockTranslation);
	const result = parser.parse();
	expect(result).toEqual({
		"folder1/note1.md": { username: "alice", age: "30", city: "New York" },
		"folder2/note2.md": { username: "bob", age: "25", city: "Los Angeles" },
		"folder3/note3.md": { username: "charlie", age: "35", city: "Chicago" },
	});
});
