'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

export function ThreeDStack() {
    const [hovered, setHovered] = useState(false)

    // Mouse position for tilt effect
    const x = useMotionValue(0)
    const y = useMotionValue(0)

    const mouseX = useSpring(x, { stiffness: 150, damping: 15 })
    const mouseY = useSpring(y, { stiffness: 150, damping: 15 })

    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e
        const rect = e.currentTarget.getBoundingClientRect()
        const xPos = ((clientX - rect.left) / rect.width - 0.5) * 2
        const yPos = ((clientY - rect.top) / rect.height - 0.5) * 2
        x.set(xPos)
        y.set(yPos)
    }

    const rotateX = useTransform(mouseY, [-1, 1], [10, -10])
    const rotateY = useTransform(mouseX, [-1, 1], [-10, 10])

    const images = [
        { src: '/images/Personal/PERSONAL1.png', z: -60, scale: 0.85, opacity: 0.8, y: 30 },
        { src: '/images/Personal/PERSONAL2.png', z: -20, scale: 0.9, opacity: 0.9, y: 15 },
        { src: '/images/Personal/PERSONAL3.png', z: 20, scale: 0.95, opacity: 1, y: 0 },
        { src: '/images/Personal/PERSONAL4.png', z: 60, scale: 1, opacity: 1, y: -15 },
    ]

    return (
        <motion.div
            className="relative w-full h-[500px] flex items-center justify-center perspective-[1200px]"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => {
                setHovered(false)
                x.set(0)
                y.set(0)
            }}
        >
            <motion.div
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: 'preserve-3d',
                }}
                className="relative w-[320px] h-[450px]"
            >
                {images.map((img, index) => (
                    <motion.div
                        key={index}
                        className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl border border-white/20"
                        style={{
                            transformStyle: 'preserve-3d',
                            zIndex: index,
                        }}
                        initial={{
                            translateZ: img.z * 0.5,
                            scale: 0.8,
                            y: 0
                        }}
                        animate={{
                            translateZ: hovered ? img.z * 1.5 : img.z,
                            scale: hovered ? img.scale : 0.85 + (index * 0.05),
                            y: hovered ? img.y : index * -10, // Stack effect when not hovered
                            opacity: 1
                        }}
                        transition={{
                            duration: 0.6,
                            ease: "easeOut"
                        }}
                    >
                        <div className="relative w-full h-full bg-slate-900/80 backdrop-blur-md">
                            <Image
                                src={img.src}
                                alt={`Layer ${index + 1}`}
                                fill
                                className="object-contain"
                            />
                            {/* Reflection/Sheen effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </motion.div>
    )
}
