import {
	EditorState,
	StateField,
	type Extension,
	Text,
	StateEffect,
	type Range,
} from "@codemirror/state";
import {
	EditorView,
	Decoration,
	type DecorationSet,
	WidgetType,
	ViewPlugin,
	ViewUpdate,
} from "@codemirror/view";
import { createRoot } from "react-dom/client";
import CommentPopover from "./popover";
import { editorLivePreviewField } from "obsidian";
import { matchColor } from "@/lib/utils";

const popoverContainerEl = document.createElement("div");
popoverContainerEl.setAttribute("popover", "auto");
popoverContainerEl.setAttribute("id", "omnidian-comment-popover-container");
document.body.appendChild(popoverContainerEl);
const root = createRoot(popoverContainerEl);

const ShowPopoverEffect = StateEffect.define<{ from: number; to: number }>();

interface HighlightMatch {
	from: number;
	to: number;
	highlightText: string;
	comment?: string;
	fullMatch: string;
	hasComment: boolean;
	hasColor: boolean;
}

class HighlightWidget extends WidgetType {
	view: EditorView | null = null;
	constructor(
		private highlightText: string,
		private comment: string | undefined,
		private from: number,
		private to: number,
		private hasComment: boolean,
		private hasColor: boolean,
		private colorOptions: string[],
		private addNewFileFn: [
			string | undefined,
			(path: string, data: string) => Promise<void>
		],
		private wrapperEl?: HTMLElement
	) {
		super();
	}

	eq(other: HighlightWidget) {
		return (
			this.highlightText === other.highlightText &&
			this.comment === other.comment &&
			this.from === other.from &&
			this.to === other.to &&
			this.hasComment === other.hasComment &&
			this.hasColor === other.hasColor
		);
	}

	toDOM(view: EditorView) {
		this.view = view;
		const wrapper = document.createElement("span");
		this.wrapperEl = wrapper;
		this.wrapperEl.className = this.hasComment
			? "omnidian-highlight has-comment"
			: "omnidian-highlight";
		if (this.hasColor) this.wrapperEl.classList.add("has-color");
		this.wrapperEl.textContent = this.highlightText;

		if (this.comment) {
			this.wrapperEl.title = this.comment;
			this.setHighlightColor(this.comment);
		}

		this.wrapperEl.addEventListener("click", () => {
			popoverContainerEl.togglePopover(true);
			this.renderPopoverContent();
			this.positionPopover();
			setTimeout(() => {
				const textarea = getPopover()?.find(
					"textarea"
				) as HTMLTextAreaElement;
				if (textarea) {
					textarea.focus();
					const length = textarea.value.length;
					textarea.setSelectionRange(length, length);
				}
			});

			getPopover()?.find("textarea")?.focus();
		});

		return this.wrapperEl;
	}

	private renderPopoverContent() {
		const popover = getPopover();
		if (!popover) return;

		let initialComment = this.comment || "";
		const initialColor = matchColor(initialComment);
		initialComment = initialComment
			.replace(` @${initialColor}`, "")
			.replace(`@${initialColor}`, "");

		root.render(
			<CommentPopover
				className="omnidian-comment-popover"
				initialComment={initialComment}
				key={Math.random()} // force re-render
				colorOptions={this.colorOptions}
				highlightText={this.highlightText}
				addNewFileFn={() => {
					const [currentFile, saveFile] = this.addNewFileFn;
					let fileContent = currentFile
						? `[[${currentFile}]]\n\n`
						: "";
					fileContent += `> ${this.highlightText}\n\n${this.highlightText}`;
					const fileName = `${this.highlightText}.md`;
					saveFile(fileName, fileContent);
				}}
				onSave={({ comment, remove }) => {
					if (remove) {
						this.handleCommentRemoval();
					} else if (typeof comment !== "undefined") {
						this.handleCommentUpdate(comment);
					}
				}}
				popoverRef={popover}
			/>
		);
	}

	private positionPopover() {
		const popover = getPopover();
		if (!popover || !this.wrapperEl) return;

		const rect = this.wrapperEl.getBoundingClientRect();
		const popoverRect = popover.getBoundingClientRect();

		const wrapperWidth = rect.width;
		const popoverWidth = popoverRect.width;
		const centerOffset = (wrapperWidth - popoverWidth) / 2;

		popover.style.top = `${rect.bottom + window.scrollY + 10}px`;
		popover.style.left = `${rect.left + window.scrollX + centerOffset}px`;

		// Adjust position if it goes off-screen
		const rightEdge = rect.left + popoverRect.width;
		if (rightEdge > window.innerWidth) {
			popover.style.left = `${window.innerWidth - popoverRect.width}px`;
		}
	}

	public showPopover() {
		this.positionPopover();
		this.renderPopoverContent();
		getPopover()?.showPopover();
	}

	private handleCommentRemoval() {
		if (!this.view) return;
		const transaction = this.view.state.update({
			changes: {
				from: this.from,
				to: this.to,
				insert: this.highlightText,
			},
		});
		this.view.dispatch(transaction);
	}

	private handleCommentUpdate(newComment: string) {
		if (!this.view) return;

		let newText: string;
		if (newComment.trim() === "") {
			newText = `==${this.highlightText}==`;
		} else {
			newText = `==${this.highlightText}==<!--${newComment}-->`;
		}

		this.setHighlightColor(newComment);

		const transaction = this.view.state.update({
			changes: {
				from: this.from,
				to: this.to,
				insert: newText,
			},
		});
		this.view.dispatch(transaction);
	}

	private setHighlightColor(comment: string) {
		const matchedColor = matchColor(comment);

		if (this.wrapperEl) {
			this.wrapperEl.style.backgroundColor =
				matchedColor || "var(--text-highlight-bg)";
		}
	}
}

function findHighlightsAndComments(doc: Text): HighlightMatch[] {
	const matches: HighlightMatch[] = [];
	const docText = doc.toString();

	const annotatedRegex = /==([^=]+)==<!--([\s\S]*?)-->/gm;
	const highlightRegex = /==(?!<!--)([^=]+)==(?!<!--)/gm;

	// Find annotated highlights
	let match;
	while ((match = annotatedRegex.exec(docText)) !== null) {
		const comment = match[2];
		const matchedColor = matchColor(comment);
		const hasComment = comment.trim() !== `@${matchedColor}`;

		matches.push({
			from: match.index,
			to: match.index + match[0].length,
			highlightText: match[1],
			fullMatch: match[0],
			hasColor: matchedColor !== null,
			hasComment,
			comment,
		});
	}

	// Find standalone highlights
	while ((match = highlightRegex.exec(docText)) !== null) {
		matches.push({
			from: match.index,
			to: match.index + match[0].length,
			highlightText: match[1],
			fullMatch: match[0],
			hasComment: false,
			hasColor: false,
		});
	}

	return matches;
}

function createHighlightDecorations(
	state: EditorState,
	colorOptions: string[],
	addNewFileFn: [
		string | undefined,
		(path: string, data: string) => Promise<void>
	]
): DecorationSet {
	const decorations: Range<Decoration>[] = [];
	const matches = findHighlightsAndComments(state.doc);

	for (const match of matches) {
		const deco = Decoration.replace({
			widget: new HighlightWidget(
				match.highlightText,
				match.comment,
				match.from,
				match.to,
				match.hasComment,
				match.hasColor,
				colorOptions,
				addNewFileFn
			),
		}).range(match.from, match.to);

		decorations.push(deco);
	}

	return Decoration.set(decorations, true);
}

export function highlightExtension(
	colorOptions: string[],
	addNewFileFn: [
		string | undefined,
		(path: string, data: string) => Promise<void>
	]
): Extension {
	const highlightField = StateField.define<DecorationSet>({
		create(state) {
			// Check mode on initial creation
			if (!state.field(editorLivePreviewField)) {
				return Decoration.none;
			}
			return createHighlightDecorations(
				state,
				colorOptions,
				addNewFileFn
			);
		},
		update(decorations, transaction) {
			// Handle mode changes
			const isLivePreview = transaction.state.field(
				editorLivePreviewField
			);
			const wasLivePreview = transaction.startState.field(
				editorLivePreviewField
			);

			// If mode changed or we're in source mode
			if (!isLivePreview || isLivePreview !== wasLivePreview) {
				if (!isLivePreview) {
					return Decoration.none;
				} else {
					// Switching to live preview - recreate decorations
					return createHighlightDecorations(
						transaction.state,
						colorOptions,
						addNewFileFn
					);
				}
			}

			// Normal update in live preview mode
			if (transaction.docChanged) {
				return createHighlightDecorations(
					transaction.state,
					colorOptions,
					addNewFileFn
				);
			}
			return decorations.map(transaction.changes);
		},
		provide: (f) => EditorView.decorations.from(f),
	});

	// Add ViewPlugin to trigger popover when new highlight is created
	const highlightPlugin = ViewPlugin.fromClass(
		class {
			update(update: ViewUpdate) {
				for (const effect of update.transactions[0]?.effects || []) {
					if (!effect.is(ShowPopoverEffect)) {
						return;
					}
					const decorations = update.state.field(highlightField);
					decorations.between(
						effect.value.from,
						effect.value.to,
						(_, __, deco) => {
							if (
								deco.spec.widget instanceof HighlightWidget ===
								false
							) {
								return;
							}
							setTimeout(
								() => deco.spec.widget.showPopover(update.view),
								0
							);
						}
					);
				}
			}
		}
	);

	return [highlightField, highlightPlugin];
}

// Helper function to create a new highlight
export function createHighlight(view: EditorView) {
	const selection = view.state.selection.main;
	if (selection.empty) return false;

	const selectedText = view.state.doc.sliceString(
		selection.from,
		selection.to
	);
	const highlightText = `==${selectedText}==`;

	const transaction = view.state.update({
		changes: {
			from: selection.from,
			to: selection.to,
			insert: highlightText,
		},
		effects: [
			ShowPopoverEffect.of({
				from: selection.from,
				to: selection.from + highlightText.length,
			}),
		],
	});

	view.dispatch(transaction);
	return true;
}

export function showPopover(view: EditorView, from: number, to: number) {
	view.dispatch({
		effects: [ShowPopoverEffect.of({ from, to })],
	});
}

export function cleanup() {
	root.unmount();
	popoverContainerEl.remove();
}
export function getPopover() {
	return document.getElementById(`omnidian-comment-popover-container`);
}
export function hidePopover() {
	getPopover()?.hidePopover();
}
