import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import tailwind from "eslint-plugin-tailwindcss";

/** @type {import('eslint').Linter.Config[]} */
export default [
	eslint.configs.recommended,
	...tseslint.configs.strict,
	...tseslint.configs.stylistic,
	...tailwind.configs["flat/recommended"],
	reactPlugin.configs.flat.recommended,
	reactPlugin.configs.flat["jsx-runtime"],
	{
		settings: {
			react: {
				version: "detect",
			},
		},
	},
];
