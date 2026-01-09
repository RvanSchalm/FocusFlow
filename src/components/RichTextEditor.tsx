import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { Markdown } from 'tiptap-markdown';
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Link as LinkIcon, Code, Heading1, Heading2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import clsx from 'clsx';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const MenuButton = ({
    isActive,
    onClick,
    children,
    title
}: {
    isActive?: boolean;
    onClick: () => void;
    children: React.ReactNode;
    title?: string;
}) => (
    <button
        onClick={onClick}
        className={clsx(
            "p-1.5 rounded hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-zinc-200",
            isActive && "bg-zinc-700 text-indigo-400"
        )}
        title={title}
        type="button" // Prevent form submission
    >
        {children}
    </button>
);

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    // Force re-render on editor transactions to update toolbar state
    const [, forceUpdate] = useState({});

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-indigo-400 hover:underline cursor-pointer',
                },
            }),
            Markdown.configure({
                html: false,
                transformPastedText: true,
                transformCopiedText: true,
            })
        ],
        content: value,
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none min-h-[150px] text-sm text-zinc-300 placeholder:text-zinc-600',
            },
        },
        onUpdate: ({ editor }) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onChange((editor.storage as any).markdown.getMarkdown());
        },
        onTransaction: () => {
            forceUpdate({});
        },
    });

    // Update content if value changes externally (and isn't the same to avoid cursor jumps)
    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (editor && value !== (editor.storage as any).markdown.getMarkdown()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    if (!editor) {
        return null;
    }

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);

        // cancelled
        if (url === null) {
            return;
        }

        // empty
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        // update
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    return (
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b border-zinc-800 bg-zinc-800/50 backdrop-blur-sm rounded-t-[inherit]">
                <MenuButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    title="Bold"
                >
                    <Bold className="w-4 h-4" />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    title="Italic"
                >
                    <Italic className="w-4 h-4" />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    isActive={editor.isActive('underline')}
                    title="Underline"
                >
                    <UnderlineIcon className="w-4 h-4" />
                </MenuButton>

                <div className="w-px h-4 bg-zinc-700 mx-1" />

                <MenuButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                    title="Bullet List"
                >
                    <List className="w-4 h-4" />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive('orderedList')}
                    title="Ordered List"
                >
                    <ListOrdered className="w-4 h-4" />
                </MenuButton>

                <div className="w-px h-4 bg-zinc-700 mx-1" />

                <MenuButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    isActive={editor.isActive('heading', { level: 1 })}
                    title="Heading 1"
                >
                    <Heading1 className="w-4 h-4" />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive('heading', { level: 2 })}
                    title="Heading 2"
                >
                    <Heading2 className="w-4 h-4" />
                </MenuButton>

                <div className="w-px h-4 bg-zinc-700 mx-1" />

                <MenuButton
                    onClick={setLink}
                    isActive={editor.isActive('link')}
                    title="Link"
                >
                    <LinkIcon className="w-4 h-4" />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    isActive={editor.isActive('code')}
                    title="Code"
                >
                    <Code className="w-4 h-4" />
                </MenuButton>
            </div>

            {/* Editor Area */}
            <div className="p-4 cursor-text flex-1 relative" onClick={() => editor.chain().focus().run()}>
                <EditorContent editor={editor} />
                {!editor.getText() && placeholder && (
                    <div className="absolute top-4 left-4 text-zinc-600 pointer-events-none text-sm">
                        {placeholder}
                    </div>
                )}
            </div>
        </div>
    );
}
