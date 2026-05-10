"use client"

import { useEffect, useRef } from "react"

export function AnimatedEKG({ className = "" }: { className?: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        canvas.width = canvas.offsetWidth
        canvas.height = canvas.offsetHeight

        // EKG wave points (normalized 0-1)
        const wave = [
            0.5, 0.5, 0.5, 0.48, 0.5,       // baseline
            0.45, 0.2, 0.8, 0.5, 0.5,         // QRS complex
            0.5, 0.52, 0.5, 0.5,              // ST
            0.42, 0.5, 0.5,                    // T wave
        ]

        let offset = 0
        let animId: number

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            const W = canvas.width
            const H = canvas.height
            const step = W / (wave.length * 2)

            ctx.beginPath()
            ctx.strokeStyle = "#00ffaa"
            ctx.lineWidth = 1.5
            ctx.shadowColor = "#00ffaa"
            ctx.shadowBlur = 6

            for (let i = 0; i < wave.length * 2; i++) {
                const x = (i * step + offset) % W
                const waveIdx = i % wave.length
                const y = wave[waveIdx] * H

                if (i === 0) ctx.moveTo(x, y)
                else ctx.lineTo(x, y)
            }
            ctx.stroke()

            offset = (offset + 1.5) % (step * wave.length)
            animId = requestAnimationFrame(draw)
        }

        draw()

        return () => cancelAnimationFrame(animId)
    }, [])

    return (
        <canvas
            ref={canvasRef}
            className={`w-full h-16 ${className}`}
        />
    )
}
