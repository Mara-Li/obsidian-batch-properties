import autoParse from "auto-parse";
import type { App } from "obsidian";
import type { BatchPropertiesSettings, Separator, Translation } from "./interfaces";

export class ParseCSV {
	contents: string[] = [];
	sourcePath: string;
	fileColumnName: string = "filepath";
	separator: Separator = ",";
	ln: Translation;
	separatorRegex = /[,;\t\|]/;
	fileType = "csv";
	ignoredColumns: string[] = [];
	app?: App;
	constructor(
		contents: string,
		settings: BatchPropertiesSettings,
		ln: Translation,
		sourcePath: string,
		app?: App
	) {
		if (contents.trim().length === 0) throw new Error(ln("error.csv.malformed"));
		this.contents = contents.split("\n");
		this.fileColumnName = settings.columnName;
		this.separator = settings.separator === "md" ? "|" : settings.separator;
		this.ln = ln;
		this.fileType = settings.separator === "md" ? "md" : "csv";
		this.ignoredColumns = settings.ignoreColumns;
		this.app = app;
		this.sourcePath = sourcePath;
	}

	private splitTable(line: string) {
		const openers = new Set(["(", "[", "{"]);
		const closers: Record<string, string> = { ")": "(", "]": "[", "}": "{" };

		const stack: string[] = []; // pile for delimiters
		let inQuotes = false; // Are we inside a quoted string?
		let quoteChar: '"' | "'" | null = null; // Type of quote we're in, if any
		let token = "";
		const out: string[] = [];

		function flush() {
			const piece = token.trim();
			if (piece.length > 0) out.push(piece);
			token = "";
		}

		for (let i = 0; i < line.length; i++) {
			const ch = line[i];
			const prev = i > 0 ? line[i - 1] : "";

			// String management (with backslash \)
			if (inQuotes) {
				token += ch;
				if (ch === quoteChar && prev !== "\\") {
					inQuotes = false;
					quoteChar = null;
				}
				continue;
			}

			// If you encounter a quotation mark when you are not in a string
			if ((ch === '"' || ch === "'") && prev !== "\\") {
				inQuotes = true;
				quoteChar = ch as '"' | "'";
				token += ch;
				continue;
			}

			// Handling delimiter pairs when not in a string
			if (openers.has(ch)) {
				stack.push(ch);
				token += ch;
				continue;
			}
			if (ch in closers) {
				//we only pop if it matches
				if (stack.length && stack[stack.length - 1] === closers[ch]) {
					stack.pop();
				}
				token += ch;
				continue;
			}

			// Split only if:
			//  - we are not in a string
			//  - the delimiter stack is empty
			//  - we are exactly on the separator (may be multi-character)
			if (!stack.length && line.startsWith(this.separator, i)) {
				flush();
				i += this.separator.length - 1; // skip the entire separator
				continue;
			}

			token += ch;
		}

		// last part
		flush();
		return out;
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
			.map((h) => h.trim().replace(/(^"|"$)/g, ""))
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

	private getLinkPath(filePath: string, needExtension = false) {
		const ext = needExtension ? ".md" : "";
		if (!this.app) return filePath.trim() + ext;
		return (
			this.app.metadataCache.getFirstLinkpathDest(filePath.trim(), this.sourcePath)
				?.path ?? filePath.trim() + ext
		);
	}

	private removeFormatFilePath(filePath: string) {
		const wikiLinksRegex = /\[{2}(.*?)((\\)?\|.*?)?\]{2}/;
		const markdownLinksRegex = /\[.*?\]\((.*)\)/;
		const wikiMatch = filePath.match(wikiLinksRegex);
		if (wikiMatch) return this.getLinkPath(wikiMatch[1].trim(), true);
		const mdMatch = filePath.match(markdownLinksRegex);
		if (mdMatch) return this.getLinkPath(mdMatch[1].trim());
		return filePath;
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
			const values = this.splitTable(line)
				.map((v) => v.trim())
				.filter((v) => v !== "");
			const filePath = values[indexFilePath];
			if (!filePath || filePath.length === 0) continue;
			const parsedFilePath = this.removeFormatFilePath(filePath.trim());
			data[parsedFilePath] = {};
			columns.forEach((col) => {
				if (this.ignoredColumns.includes(col)) return;
				const res = values[header.indexOf(col)];
				if (!res || res.length === 0) return;
				data[parsedFilePath][col] = autoParse(res, { booleanSynonyms: true });
			});
		}
		return data;
	}
}
