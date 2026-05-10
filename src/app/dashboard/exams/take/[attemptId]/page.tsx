"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getExamData, submitExamAnswer, finishExam } from "@/app/lib/exam-taking"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react"
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

    const timeIsLow = timeLeft < 300

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
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-slate-50">
            <div className="rounded-full p-6 bg-white border border-blue-100 shadow-sm">
                <Loader2 className="size-10 animate-spin text-blue-500" />
            </div>
            <p className="text-slate-500 text-sm">Cargando examen...</p>
        </div>
    )

    if (!examData) return <div>Error cargando examen</div>

    const currentQ = examData.questions[currentQuestionIndex]

    if (!currentQ) return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center bg-slate-50">
            <AlertCircle className="size-12 text-red-400" />
            <p className="text-slate-700">No se encontraron preguntas en este examen.</p>
            <Button variant="outline" onClick={() => router.push('/dashboard/exams')}>
                Volver a Exámenes
            </Button>
        </div>
    )

    const isLast = currentQuestionIndex === examData.questions.length - 1
    const selectedOption = answers[currentQ.question_id] || currentQ.selected_option_id || ""
    const optionLetters = ['A', 'B', 'C', 'D', 'E']
    const answeredCount = examData.questions.filter((q: any) => !!(answers[q.question_id] || q.selected_option_id)).length

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shadow-sm">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-blue-600 font-bold uppercase tracking-widest">UCR | SEP</span>
                    </div>
                    <h2 className="text-slate-800 font-semibold text-sm truncate max-w-xs">{examData.examTitle}</h2>
                </div>

                {/* Timer */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
                    style={{
                        background: timeIsLow ? '#fef2f2' : '#eff6ff',
                        border: `1px solid ${timeIsLow ? '#fecaca' : '#bfdbfe'}`,
                    }}>
                    <Clock className={`size-4 ${timeIsLow ? 'text-red-500' : 'text-blue-500'}`} />
                    <span className={`font-mono text-xl font-bold tabular-nums ${timeIsLow ? 'text-red-600' : 'text-blue-700'}`}>
                        {formatTime(timeLeft)}
                    </span>
                </div>

                <div className="text-right">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Respondidas</p>
                    <p className="text-slate-700 font-bold text-sm">{answeredCount} / {examData.questions.length}</p>
                </div>
            </div>

            {/* Main 3-column layout */}
            <div className="flex flex-1 overflow-hidden">

                {/* Left: Question navigation */}
                <div className="w-16 md:w-20 border-r border-slate-200 flex flex-col items-center py-4 gap-2 overflow-y-auto bg-white">
                    {examData.questions.map((q: any, idx: number) => {
                        const isAnswered = !!(answers[q.question_id] || q.selected_option_id)
                        const isCurrent = idx === currentQuestionIndex
                        return (
                            <button
                                key={q.question_id}
                                onClick={() => setCurrentQuestionIndex(idx)}
                                title={`Pregunta ${idx + 1}`}
                                className="w-10 h-10 rounded-lg text-xs font-bold transition-all duration-150"
                                style={{
                                    background: isCurrent
                                        ? '#2563eb'
                                        : isAnswered
                                            ? '#dcfce7'
                                            : '#f1f5f9',
                                    border: isCurrent
                                        ? '2px solid #2563eb'
                                        : isAnswered
                                            ? '1px solid #86efac'
                                            : '1px solid #e2e8f0',
                                    color: isCurrent ? '#ffffff' : isAnswered ? '#16a34a' : '#64748b',
                                }}
                            >
                                {idx + 1}
                            </button>
                        )
                    })}
                </div>

                {/* Center: Question content */}
                <div className="flex-1 flex flex-col overflow-y-auto p-4 md:p-8">
                    {/* Category badge */}
                    <div className="mb-4">
                        <span className="inline-flex items-center text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                            {currentQ.categoryName}
                        </span>
                    </div>

                    {/* Question card */}
                    <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-slate-100">
                        <p className="text-xs text-slate-400 uppercase tracking-widest mb-3">
                            Pregunta {currentQuestionIndex + 1} de {examData.questions.length}
                        </p>
                        {currentQ.image_url && (
                            <div className="mb-4 rounded-xl overflow-hidden border border-slate-200">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={currentQ.image_url} alt="Imagen" className="w-full h-auto max-h-64 object-contain" />
                            </div>
                        )}
                        <p className="text-slate-800 text-base leading-relaxed font-medium">{currentQ.question_text}</p>
                    </div>

                    {/* Options */}
                    <div className="space-y-3 mb-8">
                        {currentQ.options.map((opt: any, i: number) => {
                            const isSelected = selectedOption === opt.id
                            return (
                                <button
                                    key={opt.id}
                                    onClick={() => handleOptionSelect(opt.id)}
                                    className="w-full text-left p-4 rounded-xl flex items-center gap-4 transition-all duration-150 group"
                                    style={{
                                        background: isSelected ? '#eff6ff' : '#ffffff',
                                        border: isSelected ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                                        boxShadow: isSelected ? '0 0 0 3px rgba(37,99,235,0.1)' : '0 1px 3px rgba(0,0,0,0.04)',
                                    }}
                                >
                                    <span
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all"
                                        style={{
                                            background: isSelected ? '#2563eb' : '#f1f5f9',
                                            color: isSelected ? '#ffffff' : '#64748b',
                                        }}
                                    >
                                        {optionLetters[i] || opt.id}
                                    </span>
                                    <span className={`text-sm flex-1 leading-snug ${isSelected ? 'text-blue-900 font-semibold' : 'text-slate-700'}`}>
                                        {opt.text}
                                    </span>
                                </button>
                            )
                        })}
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between mt-auto">
                        <button
                            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentQuestionIndex === 0}
                            className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            ← Anterior
                        </button>

                        {isLast ? (
                            <button
                                onClick={handleFinish}
                                disabled={isSubmitting}
                                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center gap-2 disabled:opacity-60"
                            >
                                {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
                                Finalizar Examen
                            </button>
                        ) : (
                            <button
                                onClick={() => setCurrentQuestionIndex(prev => Math.min(examData.questions.length - 1, prev + 1))}
                                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                            >
                                Siguiente →
                            </button>
                        )}
                    </div>
                </div>

                {/* Right: EKG monitor (decorativo) */}
                <div className="hidden lg:flex w-44 border-l border-slate-200 flex-col items-center py-6 px-3 gap-5 bg-white">
                    <div className="w-full">
                        <p className="text-xs text-slate-400 uppercase tracking-widest mb-2 text-center font-medium">ECG</p>
                        <div className="rounded-xl overflow-hidden bg-slate-800">
                            <AnimatedEKG className="opacity-90" />
                        </div>
                    </div>
                    <div className="w-full">
                        <p className="text-xs text-slate-400 uppercase tracking-widest mb-2 text-center font-medium">VITALS</p>
                        <div className="rounded-xl overflow-hidden bg-slate-800">
                            <AnimatedEKG className="opacity-70" />
                        </div>
                    </div>
                    <div className="mt-auto text-center">
                        <p className="text-xs text-slate-400 font-semibold">UCR | SEP</p>
                    </div>
                </div>

            </div>
        </div>
    )
}
