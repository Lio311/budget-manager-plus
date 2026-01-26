'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

export function ThreeDStack() {
    const [hovered, setHovered] = useState(false)

    // Mouse position for tilt effect
    const x = useMotionValue(0)
    const y = useMotionValue(0)

    const mouseX = useSpring(x, { stiffness: 150, damping: 15 })
    const mouseY = useSpring(y, { stiffness: 150, damping: 15 })

    const [permissionGranted, setPermissionGranted] = useState(false)

    useEffect(() => {
        const invokePermission = async () => {
            try {
                if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
                    // Attempt automatic permission (will likely fail on iOS 13+ without gesture)
                    const permissionState = await (DeviceOrientationEvent as any).requestPermission()
                    if (permissionState === 'granted') {
                        setPermissionGranted(true)
                    }
                } else {
                    // Non-iOS or older devices
                    setPermissionGranted(true)
                }
            } catch (error) {
                // If auto-request fails (expected on iOS 13+), attach listener to first user interaction
                const handleInteraction = async () => {
                    try {
                        const permissionState = await (DeviceOrientationEvent as any).requestPermission()
                        if (permissionState === 'granted') {
                            setPermissionGranted(true)
                        }
                    } catch (e) {
                        console.error('Permission failed:', e)
                    } finally {
                        window.removeEventListener('click', handleInteraction, true)
                        window.removeEventListener('pointerdown', handleInteraction, true)
                    }
                }

                // Use capture phase to ensure we catch it first
                window.addEventListener('click', handleInteraction, { once: true, capture: true })
                window.addEventListener('pointerdown', handleInteraction, { once: true, capture: true })
            }
        }

        invokePermission()
    }, [])

    useEffect(() => {
        if (!permissionGranted) return

        const handleOrientation = (e: DeviceOrientationEvent) => {
            // Check for rotation data
            if (e.gamma === null || e.beta === null) return

            // Gamma: Left/Right tilt (-90 to 90) -> mapped to -1 to 1
            const xPos = Math.max(-1, Math.min(1, e.gamma / 45))

            // Beta: Front/Back tilt (-180 to 180) -> mapped to -1 to 1
            // We center it around 45 degrees for holding position
            const yPos = Math.max(-1, Math.min(1, (e.beta - 45) / 45))

            x.set(xPos)
            y.set(yPos)
        }

        window.addEventListener('deviceorientation', handleOrientation)
        return () => window.removeEventListener('deviceorientation', handleOrientation)
    }, [x, y, permissionGranted])

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
                className="relative w-full max-w-[1400px] aspect-video"
            >
                {images.map((img, index) => (
                    <motion.div
                        key={index}
                        className="absolute inset-0"
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
                        <div className="relative w-full h-full">
                            <Image
                                src={img.src}
                                alt={`Layer ${index + 1}`}
                                fill
                                className="object-cover"
                            />
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </motion.div>
    )
}
