# Batch Properties

Batch update frontmatter (YAML properties) of multiple notes from a CSV file or a Markdown table.

> This plugin adds a command that reads a data file (CSV or Markdown table) and applies each column as a frontmatter property on the target notes.

## ✨ Features
- Bulk import of properties from:
  - A CSV file (supported separators: `; , \t |`)
  - A Markdown table (`|`)
- File path resolution from:
  - Direct paths: `Folder/Note.md`
  - Wiki links: `[[Note]]`
  - Markdown links: `[Title](Note.md)`
- Optional creation of missing notes
- Overwrites existing properties with new values
- Ignore selected columns
- Result modal summarizing: created / updated / errors
- Automatic basic type parsing (booleans, numbers, ISO dates, etc.)
- Explicit error messages (missing file, bad separator, missing column)

## 📥 Installation
- [ ] Through Obsidian Community Plugins
- [x] Via BRAT: add `https://github.com/Mara-Li/obsidian-batch-properties`
- [x] From GitHub releases:
   - Download `batch-properties.zip`
   - Extract into `.obsidian/plugins/batch-properties/`
   - Reload plugins in Obsidian settings
   - Enable “Batch Properties”

## ⚙️ Settings
All options are available under: Settings > Community Plugins > Batch Properties.

| Option               | Description                                        | Default                     |
|----------------------|----------------------------------------------------|-----------------------------|
| Separator            | Determines the file type: CSV (`; , \t             | `) or Markdown table (`md`) | `;` |
| Source file          | Path to the CSV or Markdown file                   | (empty)                     |
| File column name     | Column containing the path / link to the note      | `Filepath`                  |
| Ignored columns      | Comma or newline-separated list of columns to skip | (none)                      |
| Create missing files | If enabled, creates a note when it does not exist  | off                         |
| Open result modal    | Shows a summary after execution                    | on                          |

## 📄 Supported Formats
### CSV
Requirements:
- First line = headers
- One column dedicated to the file path (configurable: “File column name”)
- At least one other column
- Chosen separator must match actual file content (otherwise “wrong separator” error)

Example (separator `;`):
```
Filepath;tags;status;count;published
Notes/Project.md;project, important;done;3;true
[[Idea A]];idea;wip;10;false
[Alias C](Notes/Note C.md);"single tag";todo;42;2024-01-01
```

### Markdown Table
- Use a standard Obsidian Markdown table
- Line 1: headers
- Line 2: separators (`| --- | --- |`)
- Parsing starts at line 3 (the first two lines are skipped)

Example:
```
| Filepath               | tags              | status | count | published |
|------------------------|-------------------|--------|-------|-----------|
| Notes/Project.md       | project, important| done   | 3     | true      |
| [[Idea A]]             | idea              | wip    | 10    | false     |
| [Alias C](Notes/Note C)| single tag        | todo   | 42    | 2024-01-01 |
```

## 🚀 Quick Start
1. Prepare your CSV file or Markdown table
2. Ensure the “Filepath” column (or your custom file column name) exists
3. In settings configure:
   - Separator or `md` for Markdown table
   - Source file path (use the file suggester)
   - (Optional) ignored columns
   - (Optional) enable creation of missing notes
4. (Optional) Click the verify (save) icon to validate the file
5. Run the command: “Batch Properties” (Command Palette)
6. Review the notification and (optionally) the result modal

## 🧪 Examples
### YAML before
```
---
tags: note
priority: low
---
Content…
```
### CSV line
```
Filepath;tags;priority;count
Folder/Note.md;["note", "project"];high;5
```
### After execution
```
---
tags: 
  - note
  - project
priority: high
count: 5
---
Content…
```

## 🧠 Parsing Rules
The plugin uses the `auto-parse` library to automatically convert:
- `true / false / yes / no / on / off` → booleans
- `123` → number
- `2024-01-01` → left as string (potentially interpretable as a date)
- Values wrapped in quotes (`"text, with, commas"`) → raw string without outer quotes

Not automatically converted to YAML lists:
- `a, b, c` stays a simple string. If you want a real YAML list, edit afterward or use a JSON-like array: `["a","b","c"]` (parsed if supported by `auto-parse`).

Ignored columns: any column listed in “Ignored columns” is skipped.
Empty values: skipped (they do not overwrite existing frontmatter keys).

## 📌 Behavior & Limitations
- Existing properties are overwritten if a new value is provided
- Missing files are created only if the corresponding option is enabled
- Rows without a file path are skipped silently
- Errors (missing file, missing column, malformed structure) appear in the modal
- For Markdown tables: first two lines (header + separators) are skipped when parsing rows
- File path resolution via links uses Obsidian’s metadata cache: ambiguous links may resolve unexpectedly

## 🛠️ Troubleshooting
| Problem              | Likely Cause                     | Fix                                      |
|----------------------|----------------------------------|------------------------------------------|
| “noPath” error       | No source file set               | Set the source file in settings          |
| “noFile” error       | Invalid path or wrong extension  | Match extension to separator (CSV vs md) |
| “malformed” error    | Bad header or separator mismatch | Check separator + headers                |
| “noFileColumn” error | File column not found            | Adjust “File column name” or header row  |
| Value not applied    | Empty cell or ignored column     | Review data / ignored list               |
| No modal displayed   | “Open result modal” disabled     | Enable the setting                       |


### 🎼 Languages

- [x] English
- [ ] French

To add a translation:
1. Fork the repository
2. Add the translation in the `src/i18n/locales` folder with the name of the language (ex: `fr.json`). 
    - You can get your locale language from Obsidian using [obsidian translation](https://github.com/obsidianmd/obsidian-translations) or using the commands (in templater for example) : `<% tp.obsidian.moment.locale() %>`
    - Copy the content of the [`en.json`](./src/i18n/locales/en.json) file in the new file
    - Translate the content
3. Edit `i18n/i18next.ts` :
    - Add `import * as <lang> from "./locales/<lang>.json";`
    - Edit the `ressource` part with adding : `<lang> : {translation: <lang>}`


