import z from 'zod';
import { match } from 'ts-pattern';
import { organizerProcedure } from '../..';
import { generatePresignedURL, processBanner } from './banner.service';
import { ORPCError } from '@orpc/server';

export const bannerRouter = {
	generatePresignedUrl: organizerProcedure
		.input(
			z.object({
				eventId: z.uuidv7(),
				filename: z.string(),
				contentType: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			const result = generatePresignedURL(context.s3, {
				eventId: input.eventId,
				filename: input.filename,
				contentType: input.contentType,
			});

			return { ...result.value };
		}),

	processBanner: organizerProcedure
		.input(
			z.object({
				eventId: z.uuidv7(),
				originalFilename: z.string(),
			}),
		)
		.errors({
			PREVIOUS_STEP_INCOMPLETE: {
				data: z.object({
					message: z.string(),
				}),
			},
			EVENT_NOT_FOUND: {
				data: z.object({
					message: z.string(),
				}),
			},
			DATABASE_ERROR: {},
		})
		.handler(async ({ input, context, errors }) => {
			const result = await processBanner(context.s3, context.db, {
				eventId: input.eventId,
				organizerId: context.organizer.id,
				originalFilename: input.originalFilename,
				s3Endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
				s3Bucket: process.env.S3_BUCKET || 'kairox',
			});

			if (!result.ok) {
				match(result.error)
					.with({ _type: 'PREVIOUS_STEP_INCOMPLETE_ERROR' }, () => {
						throw errors.PREVIOUS_STEP_INCOMPLETE({
							data: {
								message: 'Complete event details (title, date, venue) before uploading images',
							},
						});
					})
					.with({ _type: 'EVENT_NOT_FOUND_ERROR' }, () => {
						throw errors.EVENT_NOT_FOUND({
							data: {
								message: "This event doesn't exist or you don't have access to it",
							},
						});
					})
					.with({ _type: 'DATABASE_ERROR' }, () => {
						throw errors.DATABASE_ERROR();
					})
					.with({ _type: 'IMAGE_PROCESSING_ERROR' }, () => {
						throw new ORPCError('INTERNAL_SERVER_ERROR');
					})
					.with({ _type: 'S3_ERROR' }, () => {
						throw new ORPCError('INTERNAL_SERVER_ERROR');
					})
					.exhaustive();
			}

			return result.value;
		}),
};
