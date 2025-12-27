'use client'

import { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface SignaturePadProps {
    value?: string
    onChange: (signature: string) => void
    onClear: () => void
}

export function SignaturePad({ value, onChange, onClear }: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [hasSignature, setHasSignature] = useState(false)

    useEffect(() => {
        if (value && canvasRef.current) {
            const canvas = canvasRef.current
            const ctx = canvas.getContext('2d')
            if (ctx) {
                const img = new Image()
                img.onload = () => {
                    ctx.drawImage(img, 0, 0)
                    setHasSignature(true)
                }
                img.src = value
            }
        }
    }, [value])

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas) return

        const rect = canvas.getBoundingClientRect()
        const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
        const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

        const ctx = canvas.getContext('2d')
        if (ctx) {
            ctx.beginPath()
            ctx.moveTo(x, y)
            setIsDrawing(true)
        }
    }

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return

        const canvas = canvasRef.current
        if (!canvas) return

        const rect = canvas.getBoundingClientRect()
        const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
        const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

        const ctx = canvas.getContext('2d')
        if (ctx) {
            ctx.lineTo(x, y)
            ctx.strokeStyle = '#000000'
            ctx.lineWidth = 2
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            ctx.stroke()
        }
    }

    const stopDrawing = () => {
        if (isDrawing && canvasRef.current) {
            setIsDrawing(false)
            setHasSignature(true)
            // Convert canvas to base64
            const dataUrl = canvasRef.current.toDataURL('image/png')
            onChange(dataUrl)
        }
    }

    const clearSignature = () => {
        const canvas = canvasRef.current
        if (canvas) {
            const ctx = canvas.getContext('2d')
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height)
                setHasSignature(false)
                onClear()
            }
        }
    }

    return (
        <div className="space-y-2">
            <div className="relative">
                <canvas
                    ref={canvasRef}
                    width={400}
                    height={150}
                    className="border-2 border-dashed border-gray-300 rounded-lg cursor-crosshair bg-white"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
                {hasSignature && (
                    <button
                        onClick={clearSignature}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg"
                        type="button"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
            <p className="text-xs text-gray-500 text-right">
                חתום בתוך המסגרת באמצעות העכבר או המגע
            </p>
        </div>
    )
}
