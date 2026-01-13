import { GraduationCap, Activity } from "lucide-react"

export function ProgramBanner() {
    return (
        <div className="relative w-full rounded-xl overflow-hidden bg-gradient-to-r from-[#00205B] to-[#003B73] text-white shadow-lg">
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <Activity className="w-64 h-64 transform rotate-12" />
            </div>

            <div className="relative flex flex-col md:flex-row items-center p-8 md:p-12 gap-6 md:gap-12">
                <div className="flex flex-col gap-2 shrink-0 items-center md:items-start border-r-0 md:border-r border-white/20 pr-0 md:pr-8">
                    <div className="flex items-center gap-2">
                        <GraduationCap className="h-8 w-8 text-blue-200" />
                        <span className="font-bold tracking-widest text-sm">UCR | SEP</span>
                    </div>
                    <div className="text-xs text-blue-200 uppercase tracking-wider">Sistema de Estudios de Posgrado</div>
                </div>

                <div className="flex-1 text-center md:text-left">
                    <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-tight mb-2">
                        POSTGRADO DE MEDICINA <br className="hidden md:block" />
                        FAMILIAR Y COMUNITARIA
                    </h1>
                    <p className="text-blue-100 text-sm md:text-base max-w-2xl">
                        Entorno virtual para la evaluación académica y seguimiento de residentes.
                    </p>
                </div>
            </div>
        </div>
    )
}
