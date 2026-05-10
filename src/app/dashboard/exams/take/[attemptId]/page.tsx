"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getExamData, submitExamAnswer, finishExam } from "@/app/lib/exam-taking"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { AnimatedEKG } from "@/components/animated-ekg"

export default function ExamRunnerPage() {
    const params = useParams()
    const router = useRouter()
    const attemptId = params.attemptId as string

    const [loading, setLoading] = useState(true)
    const [examData, setExamData] = useState<any>(null)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [timeLeft, setTimeLeft] = useState<number>(0)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        getExamData(attemptId).then(data => {
            if (data.status === 'SUBMITTED') {
                router.push('/dashboard/exams')
                return
            }
            setExamData(data)
            const end = new Date(data.endTime).getTime()
            const now = new Date().getTime()
            setTimeLeft(Math.floor((end - now) / 1000))
            setLoading(false)
        }).catch(err => {
            alert(err.message)
            router.push('/dashboard')
        })
    }, [attemptId, router])

    useEffect(() => {
        if (!timeLeft || timeLeft <= 0) return
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) { clearInterval(timer); handleFinish(); return 0 }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(timer)
    }, [timeLeft])

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        const s = seconds % 60
        if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    const timeIsLow = timeLeft < 300 // Less than 5 minutes

    async function handleOptionSelect(optionId: string) {
        if (!examData) return
        const currentQ = examData.questions[currentQuestionIndex]
        setAnswers(prev => ({ ...prev, [currentQ.question_id]: optionId }))
        await submitExamAnswer(currentQ.id, optionId)
    }

    async function handleFinish() {
        if (isSubmitting) return
        setIsSubmitting(true)
        const result = await finishExam(attemptId)
        if (result.success) {
            router.push(`/dashboard/exams/take/${attemptId}/result`)
        } else {
            alert("Error al finalizar")
            setIsSubmitting(false)
        }
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4"
            style={{ background: 'radial-gradient(ellipse at center, #011a33 0%, #010a17 100%)' }}>
            <div className="neon-border-blue rounded-full p-6">
                <Loader2 className="size-10 animate-spin text-cyan-400" />
            </div>
            <p className="text-cyan-300 tracking-widest uppercase text-sm animate-pulse">Cargando examen...</p>
        </div>
    )

    if (!examData) return <div>Error cargando examen</div>

    const currentQ = examData.questions[currentQuestionIndex]

    if (!currentQ) return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center">
            <AlertCircle className="size-12 text-red-400" />
            <p className="text-white">No se encontraron preguntas en este examen.</p>
            <Button variant="outline" onClick={() => router.push('/dashboard/exams')}>
                Volver a Exámenes
            </Button>
        </div>
    )

    const isLast = currentQuestionIndex === examData.questions.length - 1
    const selectedOption = answers[currentQ.question_id] || currentQ.selected_option_id || ""
    const optionLetters = ['A', 'B', 'C', 'D', 'E']

    return (
        <div className="min-h-screen flex flex-col"
            style={{ background: 'radial-gradient(ellipse at top, #011a33 0%, #010a17 100%)' }}>
            {/* Top bar with timer */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-cyan-900/40"
                style={{ background: 'rgba(1, 26, 51, 0.8)', backdropFilter: 'blur(8px)' }}>
                <div>
                    <span className="text-xs text-cyan-400/60 uppercase tracking-widest">UCR | SEP</span>
                    <h2 className="text-white font-semibold text-sm truncate max-w-xs">{examData.examTitle}</h2>
                </div>
                {/* Digital timer */}
                <div className="text-center">
                    <div
                        className="font-mono text-3xl font-black tracking-widest px-4 py-1 rounded-lg"
                        style={{
                            color: timeIsLow ? '#ff4444' : '#00c3ff',
                            textShadow: timeIsLow ? '0 0 12px rgba(255,68,68,0.8)' : '0 0 12px rgba(0,195,255,0.8)',
                            border: `1px solid ${timeIsLow ? 'rgba(255,68,68,0.4)' : 'rgba(0,195,255,0.3)'}`,
                            background: timeIsLow ? 'rgba(255,68,68,0.05)' : 'rgba(0,195,255,0.05)',
                        }}
                    >
                        {formatTime(timeLeft)}
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-cyan-400/60 uppercase tracking-widest">Pregunta</p>
                    <p className="text-white font-bold">{currentQuestionIndex + 1} / {examData.questions.length}</p>
                </div>
            </div>

            {/* Main 3-column layout */}
            <div className="flex flex-1 overflow-hidden">

                {/* Left: Question navigation */}
                <div className="w-16 md:w-20 border-r border-cyan-900/30 flex flex-col items-center py-4 gap-2 overflow-y-auto"
                    style={{ background: 'rgba(1, 10, 23, 0.6)' }}>
                    {examData.questions.map((q: any, idx: number) => {
                        const isAnswered = !!(answers[q.question_id] || q.selected_option_id)
                        const isCurrent = idx === currentQuestionIndex
                        return (
                            <button
                                key={q.question_id}
                                onClick={() => setCurrentQuestionIndex(idx)}
                                className="w-10 h-10 rounded text-xs font-bold transition-all duration-200 relative"
                                style={{
                                    background: isCurrent
                                        ? 'rgba(0, 195, 255, 0.2)'
                                        : isAnswered
                                            ? 'rgba(0, 255, 170, 0.1)'
                                            : 'rgba(255,255,255,0.03)',
                                    border: isCurrent
                                        ? '1.5px solid #00c3ff'
                                        : isAnswered
                                            ? '1px solid rgba(0, 255, 170, 0.5)'
                                            : '1px solid rgba(255,255,255,0.1)',
                                    color: isCurrent ? '#00c3ff' : isAnswered ? '#00ffaa' : '#ffffff80',
                                    boxShadow: isCurrent ? '0 0 8px rgba(0,195,255,0.4)' : 'none',
                                }}
                            >
                                {idx + 1}
                            </button>
                        )
                    })}
                </div>

                {/* Center: Question content */}
                <div className="flex-1 flex flex-col overflow-y-auto p-4 md:p-6">
                    {/* Category badge */}
                    <div className="mb-4">
                        <span className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
                            style={{
                                border: '1px solid rgba(0, 255, 170, 0.3)',
                                color: '#00ffaa',
                                background: 'rgba(0, 255, 170, 0.08)'
                            }}>
                            {currentQ.categoryName}
                        </span>
                    </div>

                    {/* Question text */}
                    <div className="glass-panel rounded-xl p-5 mb-6">
                        <p className="text-xs text-cyan-400/60 uppercase tracking-widest mb-2">
                            Pregunta {currentQuestionIndex + 1} de {examData.questions.length}
                        </p>
                        {currentQ.image_url && (
                            <div className="mb-4 rounded-lg overflow-hidden border border-cyan-500/20">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={currentQ.image_url} alt="Imagen" className="w-full h-auto max-h-60 object-contain" />
                            </div>
                        )}
                        <p className="text-white text-sm md:text-base leading-relaxed">{currentQ.question_text}</p>
                    </div>

                    {/* Options */}
                    <div className="space-y-3 mb-6">
                        {currentQ.options.map((opt: any, i: number) => {
                            const isSelected = selectedOption === opt.id
                            return (
                                <button
                                    key={opt.id}
                                    onClick={() => handleOptionSelect(opt.id)}
                                    className="w-full text-left p-4 rounded-xl flex items-center gap-4 transition-all duration-200"
                                    style={{
                                        background: isSelected
                                            ? 'rgba(0, 255, 170, 0.1)'
                                            : 'rgba(255, 255, 255, 0.03)',
                                        border: isSelected
                                            ? '1.5px solid #00ffaa'
                                            : '1px solid rgba(255, 255, 255, 0.1)',
                                        boxShadow: isSelected
                                            ? '0 0 12px rgba(0, 255, 170, 0.2)'
                                            : 'none',
                                    }}
                                >
                                    <span
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                                        style={{
                                            background: isSelected ? '#00ffaa' : 'rgba(0, 195, 255, 0.1)',
                                            color: isSelected ? '#010a17' : '#00c3ff',
                                            border: isSelected ? 'none' : '1px solid rgba(0, 195, 255, 0.3)',
                                        }}
                                    >
                                        {optionLetters[i] || opt.id}
                                    </span>
                                    <span className={`text-sm flex-1 leading-snug ${isSelected ? 'text-white font-medium' : 'text-white/80'}`}>
                                        {opt.text}
                                    </span>
                                </button>
                            )
                        })}
                    </div>

                    {/* Navigation buttons */}
                    <div className="flex justify-between mt-auto">
                        <button
                            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentQuestionIndex === 0}
                            className="px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all"
                            style={{
                                border: '1.5px solid rgba(0, 195, 255, 0.4)',
                                color: currentQuestionIndex === 0 ? 'rgba(0,195,255,0.3)' : '#00c3ff',
                                background: 'transparent',
                                cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
                            }}
                        >
                            ← Anterior
                        </button>

                        {isLast ? (
                            <button
                                onClick={handleFinish}
                                disabled={isSubmitting}
                                className="px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                                style={{
                                    border: '1.5px solid rgba(255, 68, 68, 0.6)',
                                    color: '#ff6666',
                                    background: 'rgba(255,68,68,0.08)',
                                    boxShadow: '0 0 12px rgba(255,68,68,0.2)',
                                }}
                            >
                                {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
                                Finalizar Examen
                            </button>
                        ) : (
                            <button
                                onClick={() => setCurrentQuestionIndex(prev => Math.min(examData.questions.length - 1, prev + 1))}
                                className="px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all"
                                style={{
                                    border: '1.5px solid #00ffaa',
                                    color: '#00ffaa',
                                    background: 'rgba(0, 255, 170, 0.08)',
                                    boxShadow: '0 0 12px rgba(0,255,170,0.2)',
                                }}
                            >
                                Siguiente →
                            </button>
                        )}
                    </div>
                </div>

                {/* Right: Decorative EKG monitors */}
                <div className="hidden lg:flex w-48 border-l border-cyan-900/30 flex-col items-center py-6 px-3 gap-6"
                    style={{ background: 'rgba(1, 10, 23, 0.6)' }}>
                    <div className="w-full">
                        <p className="text-xs text-cyan-400/40 uppercase tracking-widest mb-2 text-center">ECG</p>
                        <div className="rounded-lg overflow-hidden"
                            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,255,170,0.2)' }}>
                            <AnimatedEKG className="opacity-90" />
                        </div>
                    </div>
                    <div className="w-full">
                        <p className="text-xs text-cyan-400/40 uppercase tracking-widest mb-2 text-center">VITALS</p>
                        <div className="rounded-lg overflow-hidden"
                            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,195,255,0.2)' }}>
                            <AnimatedEKG className="opacity-70" />
                        </div>
                    </div>
                    <div className="mt-auto text-center">
                        <p className="text-xs text-cyan-400/30 uppercase tracking-widest">UCR | SEP</p>
                    </div>
                </div>

            </div>
        </div>
    )
}
