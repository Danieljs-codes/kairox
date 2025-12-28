import { EditorMenuBar } from '@/components/organizer/editor-menu-bar';
import { cn } from '@/lib/utils';
import Typography from '@tiptap/extension-typography';
import { CharacterCount, Placeholder } from '@tiptap/extensions';
import { EditorContent, EditorContext, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useMemo } from 'react';

export const EventDescriptionEditor = () => {
	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				heading: false,
				link: false,
			}),
			Typography,
			Placeholder.configure({
				placeholder: 'Write something',
			}),
			CharacterCount,
		],
		content: '<ul><li><p>Hello World!</p></li></ul>',
		editorProps: {
			attributes: {
				class:
					'min-h-[7.5rem] w-full min-w-0 rounded-[inherit] px-[calc(--spacing(3)-1px)] py-2 leading-normal outline-none placeholder:text-muted-foreground/72 sm:text-sm prose prose-sm prose-theme',
			},
		},
	});

	const providerValue = useMemo(() => ({ editor }), [editor]);

	return (
		<div className="flex flex-col gap-y-2">
			<EditorContext.Provider value={providerValue}>
				<EditorMenuBar editor={editor} />
				<span
					className={cn(
						'relative inline-flex w-full rounded-lg border border-input bg-background bg-clip-padding text-base shadow-xs ring-ring/24 transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] not-has-disabled:not-has-focus-visible:not-has-aria-invalid:before:shadow-[0_1px_--theme(--color-black/4%)] has-focus-visible:has-aria-invalid:border-destructive/64 has-focus-visible:has-aria-invalid:ring-destructive/16 has-aria-invalid:border-destructive/36 has-focus-visible:border-ring has-disabled:opacity-64 has-[:disabled,:focus-visible,[aria-invalid]]:shadow-none has-focus-visible:ring-[3px] sm:text-sm dark:bg-input/32 dark:not-in-data-[slot=group]:bg-clip-border dark:has-aria-invalid:ring-destructive/24 dark:not-has-disabled:not-has-focus-visible:not-has-aria-invalid:before:shadow-[0_-1px_--theme(--color-white/8%)]',
					)}
					data-slot="input-control"
				>
					<EditorContent editor={editor} className="w-full" />
				</span>
			</EditorContext.Provider>
		</div>
	);
};
