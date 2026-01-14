'use client'

import dynamic from 'next/dynamic'
import 'react-quill/dist/quill.snow.css'
import './rich-text-editor.css'

const ReactQuill = dynamic(() => import('react-quill'), {
    ssr: false,
    loading: () => <div className="h-32 w-full bg-slate-100 animate-pulse rounded-md" />
})

interface RichTextEditorProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
    const modules = {
        toolbar: [
            ['bold', 'underline', 'italic'],
            [{ 'color': [] }, { 'background': [] }],
            ['clean']
        ],
    }

    const formats = [
        'bold', 'underline', 'italic',
        'color', 'background'
    ]

    return (
        <div className={`rich-text-editor-wrapper ${className}`} dir="rtl">
            <ReactQuill
                theme="snow"
                value={value}
                onChange={onChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder}
                className="bg-white dark:bg-slate-900 text-right"
            />
        </div>
    )
}
