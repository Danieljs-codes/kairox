import { useDropzone, type DropzoneOptions } from 'react-dropzone';
import { useEffect } from 'react';
import IconImageUpload from '@icons/image-upload.svg';
import IconTrash from '@icons/trash.svg';
import { cn } from '@/lib/utils';
import { Button } from '@ui/button';
import { Spinner } from '@ui/spinner';
import { useRouteContext } from '@tanstack/react-router';
import { useBannerUpload } from '@/hooks/use-banner-upload';

const DROPZONE_CONFIG: DropzoneOptions = {
	maxFiles: 1,
	multiple: false,
	noClick: true,
	accept: {
		'image/*': ['.png', '.jpg', '.jpeg', '.avif', '.webp'],
	},
};

interface Banner {
	id: string;
	url: string;
}

interface UploadedBannerProps {
	banner: Banner;
}

function UploadedBanner({ banner }: UploadedBannerProps) {
	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-medium">Event Banner</h3>
			</div>
			<div className="relative overflow-hidden border rounded-lg">
				<img src={banner.url} alt="Event banner" className="w-full h-auto max-h-64 object-cover" />
			</div>
		</div>
	);
}

interface BannerPreviewProps {
	file: File;
	previewUrl: string;
	onRemove: () => void;
}

function BannerPreview({ file, previewUrl, onRemove }: BannerPreviewProps) {
	return (
		<div className="space-y-2">
			<p className="text-sm font-medium">Preview</p>
			<div className="relative overflow-hidden border">
				<img
					src={previewUrl}
					alt="Banner preview"
					className="w-full h-auto max-h-64 object-cover"
				/>
				<div className="absolute inset-0 bg-black/20" />
				<Button
					size="icon-sm"
					variant="destructive"
					className="absolute top-2 right-2"
					aria-label="Remove image"
					onClick={(e) => {
						e.preventDefault();
						onRemove();
					}}
				>
					<IconTrash />
				</Button>
			</div>
			<p className="text-xs text-muted-foreground">
				{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
			</p>
		</div>
	);
}

export function BannerUpload({ eventId }: { eventId: string }) {
	const eventData = useRouteContext({
		from: '/organizer/events/$id/create-event',
		select: (s) => s.event?.event,
	});

	const { selectedFile, setSelectedFile, isUploading, isProcessing, isLoading, upload } =
		useBannerUpload(eventId);

	const onDrop = (acceptedFiles: File[]) => {
		if (acceptedFiles[0]) {
			setSelectedFile(acceptedFiles[0]);
		}
	};

	const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
		...DROPZONE_CONFIG,
		onDrop,
	});

	const previewUrl = selectedFile ? URL.createObjectURL(selectedFile) : null;

	useEffect(() => {
		return () => {
			if (previewUrl) {
				URL.revokeObjectURL(previewUrl);
			}
		};
	}, [previewUrl]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		upload();
	};

	const banners = eventData?.banners ?? [];
	const existingBanner = banners[0];

	return (
		<div className="space-y-6">
			<form onSubmit={handleSubmit} className="space-y-4">
				<div
					{...getRootProps()}
					className={cn(
						'relative z-10 flex flex-col items-center justify-center gap-y-2 max-h-56 p-6 overflow-hidden rounded-lg border border-dashed text-center md:h-46',
						isDragActive && 'border-primary bg-primary/10',
					)}
				>
					<input {...getInputProps()} />
					<IconImageUpload className="text-muted-foreground size-6" />
					<p className="text-sm text-muted-foreground">
						Drag and drop images here or{' '}
						<span
							className="font-medium text-primary hover:underline underline-offset-1 cursor-pointer"
							onClick={open}
						>
							Choose images
						</span>{' '}
						<br />
						PNG, JPG, AVIF, WEBP up to 10MB
					</p>
				</div>

				{existingBanner && !previewUrl && <UploadedBanner banner={existingBanner} />}

				{previewUrl && selectedFile && (
					<BannerPreview
						file={selectedFile}
						previewUrl={previewUrl}
						onRemove={() => setSelectedFile(null)}
					/>
				)}

				<Button
					type="submit"
					size="lg"
					className="w-full mt-4"
					disabled={!selectedFile || isLoading}
				>
					{isLoading ? <Spinner /> : <IconImageUpload />}
					{isUploading ? 'Uploading...' : isProcessing ? 'Processing...' : 'Upload'}
				</Button>
			</form>
		</div>
	);
}
