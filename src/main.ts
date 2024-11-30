import { Notice, Plugin } from "obsidian";

import {
	highlightExtension,
	cleanup as cleanupPopover,
} from "./editor/extension";
import { OmnidianSettingTab } from "@/settings";
import { createHighlightCommand } from "@/editor/commands";
import postprocessor from "@/preview/postprocessor";
import "../manifest.json";

export interface OmnidianSettings {
	expandSelection: boolean;
	colors: string[];
}

const DEFAULT_SETTINGS: OmnidianSettings = {
	expandSelection: true,
	colors: ["lightpink", "palegreen", "paleturquoise", "violet"],
};

export default class OmnidianPlugin extends Plugin {
	settings: OmnidianSettings = DEFAULT_SETTINGS;
	isModalOpen = false;
	isHighlightingModeOn = false;
	statusBarItemEl: HTMLElement | null = null;

	async onload() {
		await this.loadSettings();

		// Icon in the left ribbon to toggle comment mode
		this.addRibbonIcon(
			"highlighter",
			`${
				this.isHighlightingModeOn ? "Disable" : "Enable"
			} highlighting mode`,
			() => {
				this.toggleHighlightingMode();
			},
		);

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		this.addStatusBarModeIndicator();

		// Add the comment extension to CodeMirror
		this.registerEditorExtension([
			highlightExtension(this.settings.colors, [
				this.app.workspace.getActiveFile()?.basename,
				async (path: string, data: string) => {
					const newFile = await this.app.vault.create(path, data);
					this.app.workspace.openLinkText("", newFile.path);
				},
			]),
		]);

		this.addCommand({
			id: "create-highlight",
			name: "Highlight selection",
			editorCallback: (editor) =>
				createHighlightCommand(editor, this.settings.expandSelection),
		});

		this.addCommand({
			id: "toggle-highlighting-mode",
			name: "Toggle highlight mode",
			editorCallback: () => this.toggleHighlightingMode(),
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new OmnidianSettingTab(this.app, this));

		// prevent any other editor actions when in highlighting mode
		this.registerDomEvent(
			document,
			"mousedown",
			this.lockEditorInHighlightingModeEventHandler,
		);
		this.registerDomEvent(
			document,
			"touchstart",
			this.lockEditorInHighlightingModeEventHandler,
		);
		// highlight selected text when in annotate mode
		this.registerDomEvent(document, "mouseup", this.highlightEventHandler);
		this.registerDomEvent(document, "touchend", this.highlightEventHandler);

		this.registerMarkdownPostProcessor(postprocessor);
	}

	lockEditorInHighlightingModeEventHandler = (e: MouseEvent | TouchEvent) => {
		if (
			this.isHighlightingModeOn &&
			e.target instanceof HTMLElement &&
			e.target.closest(".is-live-preview") &&
			!(
				e.target.closest("#omnidian-comment-popover-container") ||
				e.target.closest("#omnidian-comment-popover")
			)
		) {
			e.preventDefault();
			this.app.workspace.activeEditor?.editor?.blur();
		}
	};

	highlightEventHandler = async (e: MouseEvent | TouchEvent) => {
		const editor = this.app.workspace.activeEditor?.editor;
		const selection = editor?.getSelection();

		if (!editor || !selection) return;

		// require modifier key when not in annotate mode
		if (!(e.metaKey || e.altKey) && !this.isHighlightingModeOn) return;

		if (
			e.target instanceof HTMLElement &&
			!e.target.closest(".is-live-preview")
		) {
			return;
		}

		const expandSelection = this.settings.expandSelection && !e.altKey;

		createHighlightCommand(editor, expandSelection);
	};

	toggleHighlightingMode() {
		this.isHighlightingModeOn = !this.isHighlightingModeOn;
		this.statusBarItemEl?.setText(
			`Highlighting mode: ${this.isHighlightingModeOn}`,
		);
		new Notice(
			`Highlighting mode ${
				this.isHighlightingModeOn ? "enabled" : "disabled"
			}`,
		);
	}

	addStatusBarModeIndicator() {
		this.statusBarItemEl = this.addStatusBarItem();
		this.statusBarItemEl.setText(
			`Highlighting mode: ${this.isHighlightingModeOn}`,
		);
		this.statusBarItemEl.addEventListener("click", () =>
			this.toggleHighlightingMode(),
		);
	}

	onunload() {
		cleanupPopover();
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
