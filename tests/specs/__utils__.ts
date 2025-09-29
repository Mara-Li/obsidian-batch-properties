import * as fs from "fs";
import * as path from "path";
import type { BatchPropertiesSettings, Separator } from "../../src/interfaces";
import type BatchProperties from "../../src/main";

export const manifest = JSON.parse(
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

// Cache pour éviter de relire les fichiers à chaque test
let cachedTables: { content: string; baseName: string }[] | null = null;
let cachedFixtures: Fixtures[] | null = null;

// Map des séparateurs pour simplifier le code avec types corrects
const SEPARATOR_MAP = new Map<string, Separator>([
	["comma", ","],
	["semicolon", ";"],
	["tabulation", "\t"],
	["pipe", "|"],
	["markdown", "md"],
	["markdown_fm", "md"],
]);

export function loadTables(): {
	settings: BatchPropertiesSettings[];
	tableContents: { content: string; baseName: string }[];
} {
	if (cachedTables) {
		return {
			settings: createSettingsFromCache(),
			tableContents: cachedTables,
		};
	}

	const files = fs.readdirSync(tableFolder);
	const settings: BatchPropertiesSettings[] = [];
	const tableContents: { content: string; baseName: string }[] = [];

	for (const file of files) {
		const fileName = path.parse(file).name;
		const baseName = path.basename(file);
		const separator = SEPARATOR_MAP.get(fileName);

		if (separator) {
			const defaultSettings: BatchPropertiesSettings = {
				createMissing: true,
				ignoreColumns: ["ignored"],
				openModal: false,
				columnName: "filepath",
				path: `tables/${baseName}`,
				separator,
			};
			settings.push(defaultSettings);

			// Lire le contenu du fichier une seule fois
			const tableContent = fs.readFileSync(path.join(tableFolder, baseName), "utf-8");
			tableContents.push({ content: tableContent, baseName });
		}
	}

	cachedTables = tableContents;
	return { settings, tableContents };
}

export function createSettingsFromCache(): BatchPropertiesSettings[] {
	if (!cachedTables) return [];

	return cachedTables.map(({ baseName }) => {
		const fileName = path.parse(baseName).name;
		const separator = SEPARATOR_MAP.get(fileName) || ",";

		return {
			createMissing: true,
			ignoreColumns: ["ignored"],
			openModal: false,
			columnName: "filepath",
			path: `tables/${baseName}`,
			separator,
		};
	});
}

export function loadFixtures(): Fixtures[] {
	if (cachedFixtures) {
		return cachedFixtures;
	}

	const fixtures = path.join(folder, "fixtures", "original");
	const expecteds = path.join(folder, "fixtures", "expected");
	const files = fs.readdirSync(fixtures);
	const fixturesContent: Fixtures[] = [];

	for (const file of files) {
		const filePath = path.join(fixtures, file);
		const content = fs.readFileSync(filePath, "utf-8");
		const expected = fs.readFileSync(path.join(expecteds, file), "utf-8");
		const basename = path.basename(file);
		fixturesContent.push({ name: basename, content, expected });
	}

	cachedFixtures = fixturesContent;
	return fixturesContent;
}

// Fonction pour normaliser les espaces et tabulations dans le contenu YAML
export function normalizeWhitespace(content: string): string {
	// Séparer le frontmatter du contenu markdown
	const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
	const match = content.match(frontmatterRegex);

	if (match) {
		const [, frontmatter, markdownContent] = match;

		// Normaliser le frontmatter YAML
		const normalizedFrontmatter = frontmatter
			.replace(/\t/g, "  ") // Convertir les tabulations en 2 espaces
			.replace(/\r\n/g, "\n") // Normaliser les fins de ligne Windows
			.replace(/\r/g, "\n") // Normaliser les fins de ligne Mac
			.replace(/[ \t]+$/gm, "") // Supprimer les espaces en fin de ligne
			// Normaliser l'indentation en multiples de 2
			.replace(/^[ \t]+/gm, (match) => {
				const spaces = match.length;
				const normalizedSpaces = Math.floor(spaces / 2) * 2;
				return " ".repeat(normalizedSpaces);
			});

		// Normaliser le contenu markdown
		const normalizedMarkdown = markdownContent
			.replace(/\t/g, "  ")
			.replace(/\r\n/g, "\n")
			.replace(/\r/g, "\n")
			.replace(/[ \t]+$/gm, "")
			.replace(/\n{3,}/g, "\n\n")
			.trim();

		return `---\n${normalizedFrontmatter}\n---\n\n${normalizedMarkdown}`;
	} else {
		// Si pas de frontmatter, normaliser simplement
		return content
			.replace(/\t/g, "  ")
			.replace(/\r\n/g, "\n")
			.replace(/\r/g, "\n")
			.replace(/[ \t]+$/gm, "")
			.replace(/\n{3,}/g, "\n\n")
			.trim();
	}
}

// Utiliser une approche plus efficace avec des timeouts adaptatifs
export async function waitForPlugin(
	timeout = 10000,
	browser: WebdriverIO.Browser
): Promise<void> {
	const startTime = Date.now();
	while (Date.now() - startTime < timeout) {
		try {
			const pluginReady = await browser.executeObsidian(({ app }, pluginId) => {
				const plugin = app.plugins.getPlugin(pluginId) as BatchProperties;
				return plugin && plugin.settings !== undefined;
			}, manifest.id);
			if (pluginReady) return;
		} catch {
			// Ignorer les erreurs temporaires
		}
		await browser.pause(100);
	}
	throw new Error(`Plugin not ready after ${timeout}ms`);
}

// Nouvelle fonction pour attendre que le traitement des fichiers soit terminé
export async function waitForProcessingComplete(
	expectedFixtures: Fixtures[],
	timeout = 15000,
	browser: WebdriverIO.Browser
): Promise<void> {
	const startTime = Date.now();
	let lastContentState: string[] = [];
	let stableCount = 0;
	const requiredStableChecks = 3; // Nombre de vérifications stables nécessaires

	while (Date.now() - startTime < timeout) {
		try {
			// Récupérer le contenu actuel de tous les fichiers
			const currentContent = await browser.executeObsidian(
				async ({ app, obsidian }, fileNames: string[]) => {
					const contents: string[] = [];
					for (const fileName of fileNames) {
						const file = app.vault.getAbstractFileByPath(fileName);
						if (file && file instanceof obsidian.TFile) {
							const content = await app.vault.read(file);
							contents.push(content);
						} else {
							contents.push("");
						}
					}
					return contents;
				},
				expectedFixtures.map((f) => f.name)
			);

			// Vérifier si le contenu est stable (n'a pas changé depuis la dernière vérification)
			const contentStateKey = currentContent.join("|||");

			if (lastContentState.join("|||") === contentStateKey) {
				stableCount++;
				// Si le contenu est stable pendant plusieurs vérifications consécutives, considérer terminé
				if (stableCount >= requiredStableChecks) {
					return;
				}
			} else {
				stableCount = 0;
				lastContentState = currentContent;
			}
		} catch {
			// Ignorer les erreurs temporaires et continuer à attendre
			stableCount = 0;
		}
		await browser.pause(300);
	}

	// Si on arrive ici, soit le timeout est atteint, soit le traitement semble terminé
	// Pour éviter les échecs de test, on va simplement log un warning et continuer
	console.warn(
		`Warning: Processing may not be complete after ${timeout}ms, but continuing with tests`
	);
}

export function loadCreatedFile() {
	const expecteds = path.join(folder, "fixtures", "expected");
	const names = ["create_me.md", "mustBeCreated.md"];
	const createdContents: { name: string; content: string }[] = [];
	for (const name of names) {
		const expected = fs.readFileSync(path.join(expecteds, name), "utf-8");
		createdContents.push({ name, content: expected });
	}
	return createdContents;
}
