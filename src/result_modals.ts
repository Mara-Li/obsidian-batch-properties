import i18next from "i18next";
import { type App, Modal, sanitizeHTMLToDom } from "obsidian";
import type { Results } from "./interfaces";

export class ResutModal extends Modal {
	result: Results;
	constructor(app: App, result: Results) {
		super(app);
		this.result = result;
		this.setTitle(i18next.t("result.title"));
		this.titleEl.addClasses(["batch-properties"]);
	}

	private errorHtml(errors: Results) {
		const errorsHtml = errors
			.map((e) => `<li><u>${e.file}</u>: ${e.error}</li>`)
			.join("");
		return sanitizeHTMLToDom(`
		<h2 class="error">${i18next.t("modal.errors")}</h2><br>
		<ul>${errorsHtml}</ul>`);
	}

	updated(updated: Results) {
		const updatedHtml = updated.map((u) => `<li><u>${u.file}</u></li>`).join("");
		return sanitizeHTMLToDom(`
		<h2 class="updated">${i18next.t("modal.updated")}</h2><br>
		<ul>${updatedHtml}</ul>`);
	}
	created(created: Results) {
		const createdHtml = created.map((c) => `<li><u>${c.file}</u></li>`).join("");
		return sanitizeHTMLToDom(`
		<h2 class="created">${i18next.t("modal.created")}</h2><br>
		<ul>${createdHtml}</ul>`);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.addClass("batch-properties");
		const errors = this.result.filter((r) => r.type === "error");
		const updated = this.result.filter((r) => r.type === "updated");
		const created = this.result.filter((r) => r.type === "created");

		if (errors.length > 0) {
			contentEl.appendChild(this.errorHtml(errors));
		}
		if (updated.length > 0) {
			contentEl.appendChild(this.updated(updated));
		}
		if (created.length > 0) {
			contentEl.appendChild(this.created(created));
		}
		if (errors.length === 0 && updated.length === 0 && created.length === 0) {
			contentEl.createEl("p", { text: i18next.t("modal.noChanges") });
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
