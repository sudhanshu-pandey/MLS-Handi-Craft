import { useEffect, useRef } from 'react'
import {
  Bars3BottomLeftIcon,
  Bars3BottomRightIcon,
  Bars3CenterLeftIcon,
  Bars3Icon,
  BoldIcon,
  LinkIcon,
  PhotoIcon,
  ItalicIcon,
  ListBulletIcon,
  NumberedListIcon,
  UnderlineIcon,
} from '@heroicons/react/24/outline'

type RichTextEditorProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const normalizeHtml = (html: string) => {
  const trimmed = html.trim()

  if (!trimmed || trimmed === '<br>' || trimmed === '<div><br></div>' || trimmed === '<p><br></p>') {
    return ''
  }

  return trimmed
}

export default function RichTextEditor({ value, onChange, placeholder = 'Write here...' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!editorRef.current) return
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || ''
    }
  }, [value])

  const runCommand = (command: string, commandValue?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, commandValue)
    onChange(normalizeHtml(editorRef.current?.innerHTML || ''))
  }

  const handleEditorKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!(event.ctrlKey || event.metaKey)) {
      return
    }

    const key = event.key.toLowerCase()

    if (key === 'b') {
      event.preventDefault()
      runCommand('bold')
      return
    }

    if (key === 'i') {
      event.preventDefault()
      runCommand('italic')
      return
    }

    if (key === 'u') {
      event.preventDefault()
      runCommand('underline')
    }
  }

  const toolbarButtons = [
    { label: 'Bold', icon: BoldIcon, action: () => runCommand('bold') },
    { label: 'Italic', icon: ItalicIcon, action: () => runCommand('italic') },
    { label: 'Underline', icon: UnderlineIcon, action: () => runCommand('underline') },
    { label: 'Numbered List', icon: NumberedListIcon, action: () => runCommand('insertOrderedList') },
    { label: 'Bullet List', icon: ListBulletIcon, action: () => runCommand('insertUnorderedList') },
    { label: 'Align Left', icon: Bars3BottomLeftIcon, action: () => runCommand('justifyLeft') },
    { label: 'Align Center', icon: Bars3CenterLeftIcon, action: () => runCommand('justifyCenter') },
    { label: 'Align Right', icon: Bars3BottomRightIcon, action: () => runCommand('justifyRight') },
    { label: 'Heading', icon: Bars3Icon, action: () => runCommand('formatBlock', 'h3') },
    { label: 'Quote', icon: Bars3BottomLeftIcon, action: () => runCommand('formatBlock', 'blockquote') },
    {
      label: 'Insert Link',
      icon: LinkIcon,
      action: () => {
        const url = window.prompt('Enter URL (https://...)')
        if (!url) return
        const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`
        runCommand('createLink', normalized)
      },
    },
    {
      label: 'Insert Image URL',
      icon: PhotoIcon,
      action: () => {
        const imageUrl = window.prompt('Enter image URL')
        if (!imageUrl) return
        runCommand('insertImage', imageUrl)
      },
    },
  ]

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-slate-900">
      <div className="flex flex-wrap gap-2 border-b border-gray-200 p-3 dark:border-gray-700">
        {toolbarButtons.map(button => {
          const Icon = button.icon
          return (
            <button
              key={button.label}
              type="button"
              onClick={button.action}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-slate-800 dark:hover:text-white"
              title={button.label}
            >
              <Icon className="h-4 w-4" />
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => {
            if (!editorRef.current) return
            editorRef.current.innerHTML = ''
            onChange('')
          }}
          className="ml-auto rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          Clear
        </button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onKeyDown={handleEditorKeyDown}
        onInput={event => onChange(normalizeHtml((event.target as HTMLDivElement).innerHTML))}
        data-placeholder={placeholder}
        className="min-h-[180px] w-full px-4 py-3 text-sm text-gray-900 outline-none empty:before:pointer-events-none empty:before:text-gray-400 empty:before:content-[attr(data-placeholder)] dark:text-white dark:empty:before:text-gray-500 [&_a]:text-primary-600 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-primary-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_img]:my-2 [&_img]:max-h-48 [&_img]:rounded-md [&_img]:object-contain [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-6"
      />
    </div>
  )
}