import IconNumberedList from '@icons/ordered-list.svg';
import IconBlockQuote from '@icons/quote-down-square.svg';
import IconTextStrikethrough from '@icons/text--strikethrough.svg';
import IconTextBold from '@icons/text-bold.svg';
import IconTextItalic from '@icons/text-italic.svg';
import IconTextUnderline from '@icons/text-underline.svg';
import IconUnorderedList from '@icons/unordered-list.svg';
import { Editor, useEditorState } from '@tiptap/react';
import { toggleVariants } from '@ui/toggle';
import { Toggle, ToggleGroup } from '@ui/toggle-group';
import { Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator } from '@ui/toolbar';
import { Tooltip, TooltipPopup, TooltipProvider, TooltipTrigger } from '@ui/tooltip';
import { RedoIcon, UndoIcon } from 'lucide-react';
export const EditorMenuBar = ({ editor }: { editor: Editor }) => {
	const { isBold, isItalic, isUnderline, isStrike, isBulletList, isOrderedList, isBlockquote } =
		useEditorState({
			editor,
			selector: ({ editor }) => ({
				isBold: editor.isActive('bold'),
				isItalic: editor.isActive('italic'),
				isUnderline: editor.isActive('underline'),
				isStrike: editor.isActive('strike'),
				isBulletList: editor.isActive('bulletList'),
				isOrderedList: editor.isActive('orderedList'),
				isBlockquote: editor.isActive('blockquote'),
			}),
		});

	const toggleBold = () => editor.chain().focus().toggleBold().run();
	const toggleItalic = () => editor.chain().focus().toggleItalic().run();
	const toggleUnderline = () => editor.chain().focus().toggleUnderline().run();
	const toggleStrike = () => editor.chain().focus().toggleStrike().run();
	const toggleBulletList = () => editor.chain().focus().toggleBulletList().run();
	const toggleOrderedList = () => editor.chain().focus().toggleOrderedList().run();
	const toggleBlockquote = () => editor.chain().focus().toggleBlockquote().run();

	const undo = () => editor.chain().focus().undo().run();
	const redo = () => editor.chain().focus().redo().run();

	return (
		<TooltipProvider>
			<Toolbar>
				<ToggleGroup
					className="border-none p-0"
					value={[
						isBold ? 'bold' : '',
						isItalic ? 'italic' : '',
						isUnderline ? 'underline' : '',
						isStrike ? 'strike' : '',
					].filter(Boolean)}
				>
					<Tooltip>
						<TooltipTrigger
							render={
								<ToolbarButton
									aria-label="Bold"
									render={<Toggle value="bold" onClick={toggleBold} />}
								>
									<IconTextBold />
								</ToolbarButton>
							}
						/>
						<TooltipPopup sideOffset={8}>Bold</TooltipPopup>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger
							render={
								<ToolbarButton
									aria-label="Italic"
									render={<Toggle value="italic" onClick={toggleItalic} />}
								>
									<IconTextItalic />
								</ToolbarButton>
							}
						/>
						<TooltipPopup sideOffset={8}>Italic</TooltipPopup>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger
							render={
								<ToolbarButton
									aria-label="Underline"
									render={<Toggle value="underline" onClick={toggleUnderline} />}
								>
									<IconTextUnderline />
								</ToolbarButton>
							}
						/>
						<TooltipPopup sideOffset={8}>Underline</TooltipPopup>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger
							render={
								<ToolbarButton
									aria-label="Strikethrough"
									render={<Toggle value="strike" onClick={toggleStrike} />}
								>
									<IconTextStrikethrough />
								</ToolbarButton>
							}
						/>
						<TooltipPopup sideOffset={8}>Strikethrough</TooltipPopup>
					</Tooltip>
				</ToggleGroup>
				<ToolbarSeparator />
				<ToggleGroup
					className="border-none p-0"
					value={[
						isBulletList ? 'bulletList' : '',
						isOrderedList ? 'orderedList' : '',
						isBlockquote ? 'blockquote' : '',
					].filter(Boolean)}
				>
					<Tooltip>
						<TooltipTrigger
							render={
								<ToolbarButton
									aria-label="Bullet list"
									render={<Toggle value="bulletList" onClick={toggleBulletList} />}
								>
									<IconUnorderedList />
								</ToolbarButton>
							}
						/>
						<TooltipPopup sideOffset={8}>Bullet list</TooltipPopup>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger
							render={
								<ToolbarButton
									aria-label="Numbered list"
									render={<Toggle value="orderedList" onClick={toggleOrderedList} />}
								>
									<IconNumberedList />
								</ToolbarButton>
							}
						/>
						<TooltipPopup sideOffset={8}>Numbered list</TooltipPopup>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger
							render={
								<ToolbarButton
									aria-label="Blockquote"
									render={<Toggle value="blockquote" onClick={toggleBlockquote} />}
								>
									<IconBlockQuote />
								</ToolbarButton>
							}
						/>
						<TooltipPopup sideOffset={8}>Blockquote</TooltipPopup>
					</Tooltip>
				</ToggleGroup>
				<ToolbarSeparator />
				<ToolbarGroup>
					<Tooltip>
						<TooltipTrigger
							render={
								<ToolbarButton
									aria-label="Undo"
									onClick={undo}
									className={toggleVariants({ variant: 'default' })}
								>
									<UndoIcon />
								</ToolbarButton>
							}
						/>
						<TooltipPopup sideOffset={8}>Undo</TooltipPopup>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger
							render={
								<ToolbarButton
									aria-label="Redo"
									onClick={redo}
									className={toggleVariants({ variant: 'default' })}
								>
									<RedoIcon />
								</ToolbarButton>
							}
						/>
						<TooltipPopup sideOffset={8}>Redo</TooltipPopup>
					</Tooltip>
				</ToolbarGroup>
			</Toolbar>
		</TooltipProvider>
	);
};
