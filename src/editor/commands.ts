import { type Editor, Notice } from "obsidian";
import type {} from "@codemirror/view";
import { createHighlight } from "./extension";

export async function createHighlightCommand(
	editor: Editor,
	expandSelection = true,
) {
	let selectedText = editor.getSelection();

	if (!selectedText) {
		new Notice(`No text selected`);
		return false;
	}

	const sameLine =
		editor.getCursor("from").line === editor.getCursor("to").line;

	if (!sameLine) {
		new Notice(`Only same line highlights are supported. Sorry!`);
		return false;
	}

	const selectionContainsHighlight = selectedText.includes("==");

	if (selectionContainsHighlight) {
		return false;
	}

	if (expandSelection) {
		selectedText = expandSelectionBoundary(editor);
	}

	editor.blur();
	activeDocument.getSelection()?.empty();

	// @ts-expect-error, not typed
	const editorView = editor.cm as EditorView;
	createHighlight(editorView);
}

function expandSelectionBoundary(editor: Editor) {
	const from = editor.getCursor("from");
	const to = editor.getCursor("to");
	const lineFrom = editor.getLine(from.line);
	const lineTo = editor.getLine(to.line);
	let start = from.ch;
	let end = to.ch;

	// First expand to word boundaries
	while (
		start > 0 &&
		lineFrom[start - 1].match(/\w/) &&
		lineFrom.substring(start - 2, start) !== "=="
	) {
		start--;
	}
	while (
		end < lineTo.length &&
		lineTo[end].match(/\w/) &&
		lineTo.substring(end, end + 2) !== "=="
	) {
		end++;
	}

	// Then shrink from both ends to remove whitespace
	while (start < lineFrom.length && lineFrom[start].match(/\s/)) {
		start++;
	}
	while (end > 0 && lineTo[end - 1].match(/\s/)) {
		end--;
	}

	editor.setSelection(
		{ line: from.line, ch: start },
		{ line: to.line, ch: end },
	);
	return editor.getSelection();
}
