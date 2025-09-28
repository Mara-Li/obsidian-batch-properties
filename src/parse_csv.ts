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
		console.log("[Batch Properties] Parsing CSV with settings");
	}

	private verifySeparator(header: string) {
		return header.includes(this.separator);
	}

	private countColumns(header: string): number {
		return header
			.split(this.separatorRegex)
			.map((x) => x.trim())
			.filter((x) => x.length > 0).length;
	}

	getHeader() {
		return this.contents[0]
			.split(this.separator)
			.map((h) => h.trim())
			.filter((h) => h.length > 0);
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
			if (!filePath || filePath.length === 0) continue;
			data[filePath] = {};
			columns.forEach((col) => {
				if (this.ignoredColumns.includes(col)) return;
				const res = values[header.indexOf(col)];
				if (!res || res.length === 0) return;
				data[filePath][col] = autoParse(res);
			});
		}
		return data;
	}
}
