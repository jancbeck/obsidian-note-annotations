import type { MarkdownPostProcessorContext } from "obsidian";
import CommentRenderer from "./note";
import { matchColor } from "@/lib/utils";

interface HighlightMatch {
	fullMatch: string;
	highlightText: string;
	comment: string;
	line: number;
	ch: number;
}

export default (
	element: HTMLElement,
	{ getSectionInfo, addChild }: MarkdownPostProcessorContext
) => {
	const marks = element.findAll("mark");

	if (!marks.length) return;
	const section = getSectionInfo(element);
	if (!section) return;

	const unprocessedElement = section.text;

	const highlightRegex = /==(.*?)==<!--(.*?)-->/g;
	const matches: HighlightMatch[] = [];
	let match;

	while ((match = highlightRegex.exec(unprocessedElement)) !== null) {
		const lines = unprocessedElement.slice(0, match.index).split("\n");
		const line = lines.length - 1;
		const ch = lines[lines.length - 1].length;

		matches.push({
			fullMatch: match[0],
			highlightText: match[1],
			comment: match[2],
			line,
			ch,
		});
	}

	let counter = 0;

	for (const mark of marks) {
		mark.addClass("omnidian-highlight");

		const matchIndex = matches.findIndex(
			(m) => m.highlightText === mark.innerText
		);
		if (matchIndex === -1) continue;

		const { comment, line, ch } = matches[matchIndex];
		matches.splice(matchIndex, 1); // Remove the matched item from the array

		const matchedColor = matchColor(comment);
		const cleanComment = comment
			.trim()
			.replace(`@${matchedColor ?? ""}`, "")
			.trim();

		if (!cleanComment) continue;

		mark.setAttribute("title", cleanComment);
		mark.addClass("has-comment");
		element.addClass("relative");
		mark.setAttribute("data-line", line.toString());
		mark.setAttribute("data-ch", ch.toString());

		if (matchedColor) {
			mark.style.backgroundColor = matchedColor;
		}

		// Create React root and render margin note
		addChild(
			new CommentRenderer(
				element,
				cleanComment,
				counter % 2 ? "left" : "right",
				mark,
				matchedColor
			)
		);

		counter++;
	}
};
