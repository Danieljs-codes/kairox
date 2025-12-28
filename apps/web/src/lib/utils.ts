import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { regex } from 'arkregex';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatBankName(name: string) {
	// Format parenthetical content (e.g., "(diamond)" -> "(Diamond)")
	const abbreviationPattern = regex('^[A-Z]+$');
	const parentheticalPattern = regex('\\(([^)]*)\\)');

	return name
		.split(' ')
		.map((word) => {
			// Handle parenthetical content
			const match = parentheticalPattern.exec(word);
			if (match) {
				const content = match[1];
				const formatted =
					content.toLowerCase().charAt(0).toUpperCase() + content.slice(1).toLowerCase();
				return `(${formatted})`;
			}

			// Keep abbreviations (2-4 chars, all uppercase) in uppercase
			if (word.length <= 4 && abbreviationPattern.test(word)) {
				return word;
			}

			// Title case for regular words
			return word.toLowerCase().charAt(0).toUpperCase() + word.slice(1).toLowerCase();
		})
		.join(' ');
}

type SnakeToCamel<S extends string> = S extends `${infer T}_${infer U}`
	? `${T}${Capitalize<SnakeToCamel<U>>}`
	: S;

type SnakeToCamelObject<T> = {
	[K in keyof T as SnakeToCamel<string & K>]: T[K];
};

export function toCamelCaseObject<T extends Record<string, unknown>>(
	obj: T,
): SnakeToCamelObject<T> {
	const result: Record<string, unknown> = {};

	for (const key in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
			result[camelKey] = obj[key];
		}
	}

	return result as SnakeToCamelObject<T>;
}
