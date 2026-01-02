import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter, useMatch, useParams } from '@tanstack/react-router';
import { orpc } from '@/lib/orpc';
import { toastManager } from '@ui/toast';
import { isDefinedError } from '@orpc/client';

export function useBannerUpload(eventId: string) {
	const router = useRouter();
	const { fullPath } = useMatch({ from: '/organizer/events/$id/create-event' });
	const params = useParams({ from: '/organizer/events/$id/create-event' });
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);

	const { mutate: processBannerMutation, isPending: isProcessing } = useMutation(
		orpc.banner.processBanner.mutationOptions({
			onSuccess: async (_, __, ___, { client }) => {
				await router.invalidate({
					filter: (match) => match.fullPath === fullPath,
					sync: true,
				});

				await client.invalidateQueries({
					queryKey: orpc.event.getEventDraft.key({ input: { id: eventId } }),
				});

				toastManager.add({
					type: 'success',
					title: 'Upload Successful',
					description: 'Your banner image has been uploaded and processed successfully.',
				});

				setSelectedFile(null);
				setUploadedFilename(null);

				await router.navigate({
					to: '/organizer/events/$id/create-event',
					params: { id: params.id },
					search: { step: 'tickets' },
				});
			},
			onError: (error) => {
				if (!isDefinedError(error)) {
					toastManager.add({
						type: 'error',
						title: 'Processing Failed',
						description: 'Failed to process the uploaded image. Please try again.',
					});
					return;
				}

				switch (error.code) {
					case 'PREVIOUS_STEP_INCOMPLETE': {
						toastManager.add({
							type: 'error',
							title: 'Event Details Incomplete',
							description: error.data.message,
						});
						break;
					}
					case 'EVENT_NOT_FOUND': {
						toastManager.add({
							type: 'error',
							title: 'Event Not Found',
							description: error.data.message,
						});
						break;
					}
					case 'DATABASE_ERROR': {
						toastManager.add({
							type: 'error',
							title: 'Something Went Wrong',
							description: "We're looking into this issue. Please try again later.",
						});
						break;
					}
				}
			},
		}),
	);

	const { mutate: uploadBannerImage, isPending: isUploading } = useMutation(
		orpc.banner.generatePresignedUrl.mutationOptions({
			onSuccess: async (data) => {
				if (!selectedFile) return;

				try {
					const uploadResponse = await fetch(data.uploadUrl, {
						method: 'PUT',
						body: selectedFile,
						headers: {
							'Content-Type': selectedFile.type,
						},
					});

					if (!uploadResponse.ok) {
						throw new Error('Upload to S3 failed');
					}

					setUploadedFilename(data.filename);

					processBannerMutation({
						eventId,
						originalFilename: data.filename,
					});
				} catch (error) {
					toastManager.add({
						type: 'error',
						title: 'Upload Failed',
						description:
							error instanceof Error ? error.message : 'Failed to upload image to storage.',
					});
				}
			},
			onError: (error) => {
				const id = toastManager.add({
					type: 'error',
					title: 'Upload Failed',
					description:
						error instanceof Error ? error.message : 'An unknown error occurred during upload.',
					actionProps: {
						children: 'Retry',
						onClick: () => {
							toastManager.close(id);
							if (selectedFile) {
								uploadBannerImage({
									eventId,
									filename: selectedFile.name,
									contentType: selectedFile.type,
								});
							}
						},
					},
				});
			},
		}),
	);

	const upload = () => {
		if (!selectedFile) return;

		uploadBannerImage({
			eventId,
			filename: selectedFile.name,
			contentType: selectedFile.type,
		});
	};

	return {
		selectedFile,
		setSelectedFile,
		uploadedFilename,
		isUploading,
		isProcessing,
		isLoading: isUploading || isProcessing,
		upload,
	};
}
