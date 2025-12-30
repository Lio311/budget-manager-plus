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
        let clientX, clientY

        if ('touches' in e) {
            clientX = e.touches[0].clientX
            clientY = e.touches[0].clientY
        } else {
            clientX = e.clientX
            clientY = e.clientY
        }

        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height

        const x = (clientX - rect.left) * scaleX
        const y = (clientY - rect.top) * scaleY

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
        let clientX, clientY

        if ('touches' in e) {
            clientX = e.touches[0].clientX
            clientY = e.touches[0].clientY
        } else {
            clientX = e.clientX
            clientY = e.clientY
        }

        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height

        const x = (clientX - rect.left) * scaleX
        const y = (clientY - rect.top) * scaleY

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

    // ... (rest of component)

    return (
        <div className="space-y-2 select-none">
            <div className="relative w-full">
                <canvas
                    ref={canvasRef}
                    width={400}
                    height={150}
                    className="w-full h-auto border-2 border-dashed border-gray-300 rounded-lg cursor-crosshair bg-white touch-none"
                    style={{ touchAction: 'none' }}
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
