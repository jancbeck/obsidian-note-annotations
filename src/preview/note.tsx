import { cn } from "@/lib/utils";
import { createRoot, type Root } from "react-dom/client";
import { useState, useEffect } from "react";
import { MarkdownRenderChild } from "obsidian";

export default class CommentRenderer extends MarkdownRenderChild {
	/** @public */
	containerEl: HTMLElement;

	private rootEl: HTMLElement;
	private root: Root;

	/**
	 * @param containerEl - This HTMLElement will be used to test whether this component is still alive.
	 * It should be a child of the Markdown preview sections, and when it's no longer attached
	 * (for example, when it is replaced with a new version because the user edited the Markdown source code),
	 * this component will be unloaded.
	 * @public
	 */
	constructor(
		containerEl: HTMLElement,
		private comment: string,
		private position: string,
		private mark: HTMLElement,
		private color: string | null
	) {
		super(containerEl);
		this.containerEl = containerEl;

		this.rootEl = containerEl.createEl("div");
		this.root = createRoot(this.rootEl);
	}

	onload() {
		this.root.render(
			<Comment
				mark={this.mark}
				position={this.position}
				comment={this.comment}
				color={this.color}
			/>
		);
	}

	onunload() {
		this.root.unmount();
	}
}

function Comment({
	mark,
	position,
	comment,
	color,
}: {
	mark: HTMLElement;
	position: string;
	comment: string;
	color: string | null;
}) {
	const [hover, setHover] = useState(false);

	useEffect(() => {
		const handleMouseEnter = () => setHover(true);
		const handleMouseLeave = () => setHover(false);

		mark.addEventListener("mouseenter", handleMouseEnter);
		mark.addEventListener("mouseleave", handleMouseLeave);

		return () => {
			mark.removeEventListener("mouseenter", handleMouseEnter);
			mark.removeEventListener("mouseleave", handleMouseLeave);
		};
	}, [mark]);
	return (
		<div
			onMouseEnter={() => {
				mark.classList.add("hover");
			}}
			onMouseLeave={() => {
				mark.classList.remove("hover");
			}}
			className={cn("omnidian-comment absolute top-0 cursor-help p-2", {
				"right-full mr-8": position == "left",
				"left-full ml-8": position == "right",
			})}
			style={{
				fontSize: "var(--footnote-size)",
				color: "var(--text-muted)",
				width: "calc(var(--file-line-width)/4)",
				backgroundColor: hover
					? color
						? color
						: "var(--text-highlight-bg)"
					: "transparent",
			}}
		>
			<span>{comment}</span>
		</div>
	);
}
