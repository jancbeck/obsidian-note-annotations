import { App, PluginSettingTab, Setting } from "obsidian";
import type OmnidianPlugin from "./main";

export class OmnidianSettingTab extends PluginSettingTab {
	plugin: OmnidianPlugin;

	constructor(app: App, plugin: OmnidianPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Expand selection")
			.setDesc(
				"Expand the text selection boundary highlight complete words. This avoids selections that can break markdown rendering. Hold Alt key while selecting to override this setting.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.expandSelection)
					.onChange(async (value) => {
						this.plugin.settings.expandSelection = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Highlighting color options")
			.setDesc(
				activeDocument
					.createRange()
					.createContextualFragment(
						"Add comma separated list of <a href='https://147colors.com'>color names</a>. Requires app reload.",
					),
			)
			.setClass("[&_textarea]:w-full")
			.addTextArea((toggle) =>
				toggle
					.setValue(this.plugin.settings.colors.join(", "))
					.onChange(async (value) => {
						this.plugin.settings.colors = value
							.split(",")
							.map((c) => c.trim());
						await this.plugin.saveSettings();
					}),
			);
	}
}
