import autoParse from "auto-parse";
import type { BatchPropertiesSettings, Separator, Translation } from "./interfaces";

export class ParseCSV {
	contents: string[] = [];
	fileColumnName: string = "filepath";
	separator: Separator = ",";
	ln: Translation;
	separatorRegex = /[,;\t\|]/;
	fileType = "csv";
	ignoredColumns: string[] = [];
	constructor(contents: string, settings: BatchPropertiesSettings, ln: Translation) {
		if (contents.trim().length === 0) throw new Error(ln("error.csv.malformed"));
		this.contents = contents.split("\n");
		this.fileColumnName = settings.columnName;
		this.separator = settings.separator === "md" ? "|" : settings.separator;
		this.ln = ln;
		this.fileType = settings.separator === "md" ? "md" : "csv";
		this.ignoredColumns = settings.ignoreColumns;
	}

	private verifySeparator(header: string) {
		return header.includes(this.separator);
	}

	private countColumns(header: string): number {
		return header.split(this.separatorRegex).length;
	}

	getHeader() {
		return this.contents[0]
			.split(this.separator)
			.filter((h) => h.trim() !== "")
			.map((h) => h.trim());
	}

	getIndexColumns(header: string[]) {
		const indexFilePath = header.indexOf(this.fileColumnName);
		if (indexFilePath === -1)
			throw new Error(this.ln("error.csv.noFileColumn", { col: this.fileColumnName }));
		const columns = header.filter((h) => h !== this.fileColumnName);
		if (columns.length === 0) throw new Error(this.ln("error.csv.noOtherColumn"));
		return { indexFilePath, columns };
	}

	parse(): Record<string, Record<string, any>> {
		if (this.countColumns(this.contents[0]) <= 1)
			throw new Error(this.ln("error.csv.malformed"));
		if (!this.verifySeparator(this.contents[0]))
			throw new Error(this.ln("error.csv.separator", { sep: this.separator }));
		const header = this.getHeader();
		const { indexFilePath, columns } = this.getIndexColumns(header);

		const data: Record<string, Record<string, any>> = {};
		const toSlice = this.fileType === "md" ? 2 : 1;
		for (const line of this.contents.slice(toSlice)) {
			const values = line
				.split(this.separator)
				.map((v) => v.trim())
				.filter((v) => v !== "");
			const filePath = values[indexFilePath];
			if (filePath.length === 0) continue;
			data[filePath] = {};
			columns.forEach((col) => {
				if (this.ignoredColumns.includes(col)) return;
				data[filePath][col] = autoParse(values[header.indexOf(col)]);
			});
		}
		return data;
	}
}
