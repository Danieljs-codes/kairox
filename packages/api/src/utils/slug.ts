import type { Database } from '@kairox/db';
import type { Kysely } from 'kysely';
import { Result } from 'typescript-result';

function slugify(title: string): string {
	return title
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '')
		.replace(/[\s_-]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

async function slugExists(db: Kysely<Database>, slug: string, excludeId?: string) {
	const query = db.selectFrom('event').select('id').where('slug', '=', slug);

	if (excludeId) {
		query.where('id', '!=', excludeId);
	}

	const result = await query.executeTakeFirst();
	return !!result;
}

export function generateUniqueSlug(
	db: Kysely<Database>,
	title: string,
	excludeId?: string,
	maxAttempts = 10,
) {
	const database = (cause?: unknown) => ({
		_type: 'DATABASE_ERROR' as const,
		cause,
	});

	return Result.gen(async function* () {
		let baseSlug = slugify(title);

		if (baseSlug.length < 3) {
			baseSlug = baseSlug.padEnd(3, 'x');
		}

		if (!(await slugExists(db, baseSlug, excludeId))) {
			return yield* Result.ok(baseSlug);
		}

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			const randomSuffix = crypto.randomUUID().slice(0, 8);
			const candidateSlug = `${baseSlug}-${randomSuffix}`;

			if (!(await slugExists(db, candidateSlug, excludeId))) {
				return yield* Result.ok(candidateSlug);
			}
		}

		return yield* Result.error(database('Failed to generate unique slug after maximum attempts'));
	});
}
