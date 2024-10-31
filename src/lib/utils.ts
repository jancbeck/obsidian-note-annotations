import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import colors from "@/colors";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function matchColor(comment: string) {
	const colorMatch = comment.match(/@(\w+)/)?.at(1);
	if (!colorMatch) return null;
	return colors.some((color) => color.name === colorMatch)
		? colorMatch
		: null;
}
