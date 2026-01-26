'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Personal3DPage() {
    const [hovered, setHovered] = useState(false)

    // Mouse position for tilt effect
    const x = useMotionValue(0)
    const y = useMotionValue(0)

    const mouseX = useSpring(x, { stiffness: 150, damping: 15 })
    const mouseY = useSpring(y, { stiffness: 150, damping: 15 })

    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e
        const { innerWidth, innerHeight } = window
        const xPos = (clientX / innerWidth - 0.5) * 2
        const yPos = (clientY / innerHeight - 0.5) * 2
        x.set(xPos)
        y.set(yPos)
    }

    const rotateX = useTransform(mouseY, [-1, 1], [15, -15])
    const rotateY = useTransform(mouseX, [-1, 1], [-15, 15])

    const images = [
        { src: '/images/Personal/PERSONAL1.png', z: -150, scale: 0.9, opacity: 0.8 },
        { src: '/images/Personal/PERSONAL2.png', z: -50, scale: 0.95, opacity: 0.9 },
        { src: '/images/Personal/PERSONAL3.png', z: 50, scale: 1, opacity: 1 },
        { src: '/images/Personal/PERSONAL4.png', z: 150, scale: 1.05, opacity: 1 },
    ]

    return (
        <div
            className="min-h-screen bg-slate-950 flex flex-col items-center justify-center overflow-hidden relative perspective-[2000px]"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => {
                setHovered(false)
                x.set(0)
                y.set(0)
            }}
        >
            {/* Background Gradients */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_70%)] pointer-events-none" />
            <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

            {/* Navigation / Header */}
            <nav className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
                <Link href="/">
                    <Button variant="ghost" className="text-white hover:bg-white/10 gap-2">
                        <ArrowRight size={20} />
                        חזרה לראשי
                    </Button>
                </Link>
                <div className="text-emerald-500 font-bold tracking-wider">KESEFLY PERSONAL</div>
            </nav>

            {/* 3D Stack Container */}
            <motion.div
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: 'preserve-3d',
                }}
                className="relative w-[300px] h-[600px] md:w-[400px] md:h-[800px] flex items-center justify-center mt-20"
            >
                {images.map((img, index) => (
                    <motion.div
                        key={index}
                        className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl border border-white/10"
                        style={{
                            transformStyle: 'preserve-3d',
                            zIndex: index,
                        }}
                        initial={{
                            translateZ: img.z * 0.5,
                            scale: 0.8,
                            opacity: 0
                        }}
                        animate={{
                            translateZ: hovered ? img.z * 1.5 : img.z,
                            scale: hovered ? img.scale : 0.9 + (index * 0.02),
                            opacity: 1,
                            y: hovered ? index * -20 : 0 // slight vertical spread on hover
                        }}
                        transition={{
                            duration: 0.8,
                            type: "spring",
                            stiffness: 100
                        }}
                    >
                        <div className="relative w-full h-full bg-slate-900/50 backdrop-blur-sm">
                            <Image
                                src={img.src}
                                alt={`Layer ${index + 1}`}
                                fill
                                className="object-cover"
                                priority
                            />
                            {/* Reflection/Sheen effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Bottom Content / CTA */}
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-10 z-50 text-center"
            >
                <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
                    העתיד הפיננסי שלך
                </h1>
                <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
                    שליטה מלאה בכל הרבדים הפיננסיים שלך, במקום אחד.
                </p>
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-8 py-6 text-lg shadow-lg shadow-emerald-500/20 transition-all hover:scale-105">
                    התחל עכשיו
                </Button>
            </motion.div>
        </div>
    )
}
