import { Plugin, Modal } from "obsidian";
<% if (data.i18n === true) { %>
import { resources, translationLanguage } from "./i18n";
import i18next from "i18next";
<% } %>
<% if (data.modal === true) { %>
import { <%= data.interfaceName%>Modal } from "./modals";
<%}%>
<% if (data.settings === true) {%>
	import { <%= data.interfaceName%>Settings, DEFAULT_SETTINGS } from "./interfaces";
	import { <%= data.interfaceName %>SettingTab } from "./settings";
<%}%>
export default class <%= data.interfaceName %> extends Plugin {
	<% if (data.settings === true) {%>
	settings!: <%= data.interfaceName %>Settings;
	<% } %>
	async onload() {
		console.log(`[${this.manifest.name}] Loaded`)
		<% if (data.settings === true) { %>
		await this.loadSettings();
		<% } %>
		<% if (data.i18n === true) { %>
		//load i18next
				await i18next.init({
					lng: translationLanguage,
					fallbackLng: "en",
					resources,
					returnNull: false,
					returnEmptyString: false,
				});
		<% } %>

		<% if (data.modal === true) { %>
		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "open-sample-modal-simple",
			name: "Open sample modal (simple)",
			callback: () => {
				new <%= data.interfaceName%>Modal(this.app).open();
			}
		});
		<% } %>

		<% if (data.settings === true) { %>
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new <%= data.interfaceName %>SettingTab(this.app, this));
		<% } %>
		
	}

	onunload() {
		console.log(`[${this.manifest.name}] Unloaded`);
	}
	<% if (data.settings === true) { %>
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
	<% } %>
}


