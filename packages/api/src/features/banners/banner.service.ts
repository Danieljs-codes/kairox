import { randomUUIDv7, type S3Client } from 'bun';
import { Result } from 'typescript-result';
import sharp from 'sharp';
import { encode } from 'blurhash';
import type { Database } from '@kairox/db';
import type { Kysely } from 'kysely';
import { validatePreviousStep } from '../events/event.service';

export function generatePresignedURL(
	s3: S3Client,
	deps: {
		eventId: string;
		filename: string;
		contentType: string;
	},
) {
	const { eventId, filename, contentType } = deps;

	// Added the randomUUIDv7 to ensure filename uniqueness
	const uniqueFilename = `banners/${eventId}/${filename}-${randomUUIDv7()}`;

	const uploadUrl = s3.presign(uniqueFilename, {
		method: 'PUT',
		expiresIn: 180, // 3 minutes
		type: contentType || 'image/jpeg',
		acl: 'public-read',
	});

	return Result.ok({ uploadUrl, filename: uniqueFilename });
}

export function processBanner(
	s3: S3Client,
	db: Kysely<Database>,
	deps: {
		eventId: string;
		organizerId: string;
		originalFilename: string;
		s3Endpoint: string;
		s3Bucket: string;
	},
) {
	return Result.gen(async function* () {
		// Validate that the previous step (event details) is complete
		yield* validatePreviousStep(db, {
			eventId: deps.eventId,
			organizerId: deps.organizerId,
		});

		const imageBuffer = yield* Result.fromAsyncCatching(
			async () => {
				const file = s3.file(deps.originalFilename);
				return Buffer.from(await file.arrayBuffer());
			},
			(cause) => ({
				_type: 'S3_ERROR' as const,
				cause,
			}),
		);

		const processedImage = yield* Result.fromAsyncCatching(
			async () => {
				return sharp(imageBuffer)
					.resize(1920, 1080, {
						fit: 'inside',
						withoutEnlargement: true,
					})
					.webp({ quality: 85 })
					.toBuffer();
			},
			(cause) => ({
				_type: 'IMAGE_PROCESSING_ERROR' as const,
				cause,
			}),
		);

		// Generate blurhash (using smaller image for performance)
		// If this fails, continue with null blurhash
		const blurhashResult = await Result.fromAsyncCatching(
			async () => {
				const smallImage = await sharp(imageBuffer)
					.resize(32, 32, { fit: 'inside' })
					.ensureAlpha()
					.raw()
					.toBuffer({ resolveWithObject: true });

				return encode(
					new Uint8ClampedArray(smallImage.data),
					smallImage.info.width,
					smallImage.info.height,
					4,
					4,
				);
			},
			(cause) => ({
				_type: 'BLURHASH_GENERATION_ERROR' as const,
				cause,
			}),
		);

		const blurhash = blurhashResult.recover(() => null).value;

		// Upload the WebP version to S3
		const webpFilename = deps.originalFilename.replace(/\.[^.]+$/, '.webp');
		yield* Result.fromAsyncCatching(
			async () => {
				await s3.write(webpFilename, new Uint8Array(processedImage), {
					type: 'image/webp',
					acl: 'public-read',
				});
			},
			(cause) => ({
				_type: 'S3_ERROR' as const,
				cause,
			}),
		);

		// Delete the original file
		yield* Result.fromAsyncCatching(
			async () => {
				await s3.unlink(deps.originalFilename);
			},
			(cause) => ({
				_type: 'S3_ERROR' as const,
				cause,
			}),
		);

		// Get the public URL for the WebP file
		const publicUrl = `${deps.s3Endpoint}/${deps.s3Bucket}/${webpFilename}`;

		// Delete existing banner if any (only one banner per event)
		const existingBanner = await db
			.selectFrom('eventBanner')
			.select(['id', 'url'])
			.where('eventId', '=', deps.eventId)
			.executeTakeFirst();

		if (existingBanner) {
			// Extract the S3 key from the existing banner URL
			const existingS3Key = existingBanner.url.replace(
				`${deps.s3Endpoint}/${deps.s3Bucket}/`,
				'',
			);

			// Delete existing banner from S3 (non-blocking, continue even if it fails)
			await Result.fromAsyncCatching(
				async () => {
					await s3.unlink(existingS3Key);
				},
				() => null,
			);

			// Delete existing banner from database
			yield* Result.fromAsyncCatching(
				async () => {
					await db.deleteFrom('eventBanner').where('id', '=', existingBanner.id).execute();
				},
				(cause) => ({
					_type: 'DATABASE_ERROR' as const,
					cause,
				}),
			);
		}

		// Save to database
		const banner = yield* Result.fromAsyncCatching(
			async () => {
				return db
					.insertInto('eventBanner')
					.values({
						eventId: deps.eventId,
						url: publicUrl,
						blurhash,
						sortOrder: 0,
					})
					.returning(['id', 'url', 'blurhash', 'sortOrder'])
					.executeTakeFirstOrThrow();
			},
			(cause) => ({
				_type: 'DATABASE_ERROR' as const,
				cause,
			}),
		);

		return yield* Result.ok(banner);
	});
}
