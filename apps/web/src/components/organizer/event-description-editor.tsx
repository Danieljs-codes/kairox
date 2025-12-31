import { EditorMenuBar } from '@/components/organizer/editor-menu-bar';
import { cn } from '@/lib/utils';
import { EVENT_DESCRIPTION_MAX_LENGTH } from '@kairox/schema/event';
import Typography from '@tiptap/extension-typography';
import { CharacterCount, Placeholder } from '@tiptap/extensions';
import { EditorContent, EditorContext, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useMemo } from 'react';

export const EventDescriptionEditor = ({
	onUpdate,
	content,
	placeholder,
	invalid,
}: {
	onUpdate: (html: string) => void;
	content: string;
	placeholder?: string;
	invalid?: boolean;
}) => {
	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				heading: false,
				link: false,
			}),
			Typography,
			Placeholder.configure({
				placeholder,
			}),
			CharacterCount.configure({
				limit: EVENT_DESCRIPTION_MAX_LENGTH,
			}),
		],
		editorProps: {
			attributes: {
				class:
					'min-h-[7.5rem] w-full min-w-0 rounded-[inherit] px-[calc(--spacing(3)-1px)] py-2 leading-normal outline-none placeholder:text-muted-foreground/72 prose prose-theme sm:prose-sm',
				'aria-invalid': String(invalid),
			},
		},
		// 		content: `
		//   <h2>
		//     Hi there,
		//   </h2>
		//   <p>
		//     this is a basic <em>basic</em> example of <strong>tiptap</strong>. Sure, there are all kind of basic text styles you’d probably expect from a text editor. But wait until you see the lists:
		//   </p>
		//   <ul>
		//     <li>
		//       That’s a bullet list with one …
		//     </li>
		//     <li>
		//       … or two list items.
		//     </li>
		//   </ul>
		//   <p>
		//     Isn’t that great? And all of that is editable. But wait, there’s more. Let’s try a code block:
		//   </p>
		//   <pre><code class="language-css">body {
		//   display: none;
		// }</code></pre>
		//   <p>
		//     I know, I know, this is impressive. It’s only the tip of the iceberg though. Give it a try and click a little bit around. Don’t forget to check the other examples too.
		//   </p>
		//   <blockquote>
		//     Wow, that’s amazing. Good work, boy! 👏
		//     <br />
		//     — Mom
		//   </blockquote>
		// `,
		content,
		onUpdate: ({ editor }) => {
			onUpdate(editor.getHTML());
		},
	});

	const providerValue = useMemo(() => ({ editor }), [editor]);

	return (
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
	);
};
