import { format, isValid, set } from 'date-fns';

export function generateTimeSlots(interval: 15 | 30 = 15) {
	const times: { label: string; value: string }[] = [];

	for (let hour = 0; hour < 24; hour++) {
		for (let min = 0; min < 60; min += interval) {
			// 24-hour format for value
			const h24 = hour.toString().padStart(2, '0');
			const m = min.toString().padStart(2, '0');
			const value = `${h24}:${m}`;

			// 12-hour format for label
			const period = hour < 12 ? 'AM' : 'PM';
			const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
			const label = `${h12}:${m} ${period}`;

			times.push({ label, value });
		}
	}

	return times;
}

/** Extracts time from a Date as "HH:mm" string, or empty string if no date */
export const getTimeFromDate = (date: Date | string | null | undefined): string => {
	const d = toJSDate(date);
	if (!d || !isValid(d)) return '';
	return format(d, 'HH:mm');
};

/** Merges a time string ("HH:mm") into an existing date, returns new Date */
export const mergeTimeIntoDate = (
	date: Date | string | null | undefined,
	time: string | null,
): Date | null => {
	const d = toJSDate(date);
	if (!d || !isValid(d)) return null;
	if (!time) return d;

	const [hours, minutes] = time.split(':').map(Number);
	return set(d, { hours, minutes, seconds: 0, milliseconds: 0 });
};

export const toJSDate = (value: any): Date | undefined => {
	if (!value) return undefined;
	const d = new Date(value);
	return isValid(d) ? d : undefined;
};

export type Tag = {
	id: string;
	label: string;
	value: string;
	group: string; // Region (Africa, Europe, America, ...)
};

export type TagGroup = {
	value: string;
	items: Tag[];
};

function getUtcOffset(timeZone: string, date = new Date()): string {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone,
		timeZoneName: 'longOffset',
	}).formatToParts(date);

	const offset = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';

	if (offset === 'GMT') return 'UTC+00:00';
	return offset.replace('GMT', 'UTC');
}

function formatCity(timeZone: string): string {
	return timeZone.split('/').slice(1).join(' / ').replaceAll('_', ' ');
}

export function generateGroupedTimeZoneTags(date = new Date()): TagGroup[] {
	const groups: Record<string, Tag[]> = {};

	for (const timeZone of Intl.supportedValuesOf('timeZone')) {
		// Optional: skip confusing zones
		if (timeZone.startsWith('Etc/')) continue;

		const [region] = timeZone.split('/');

		const tag: Tag = {
			group: region,
			id: timeZone,
			value: timeZone,
			label: `(${getUtcOffset(timeZone, date)}) ${formatCity(timeZone)}`,
		};

		if (!groups[region]) {
			groups[region] = [];
		}

		groups[region]!.push(tag);
	}

	// Stable, predictable group order
	const order = Object.keys(groups).sort();

	return order.map((value) => ({
		value,
		items: groups[value]!.sort((a, b) => a.label.localeCompare(b.label)),
	}));
}
