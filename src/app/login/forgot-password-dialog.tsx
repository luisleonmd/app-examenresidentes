"use client"

import { useState } from "react"
import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { resetPassword } from "@/app/lib/actions"

export function ForgotPasswordDialog() {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)

    async function onSubmit(formData: FormData) {
        startTransition(async () => {
            const result = await resetPassword(formData)
            if (result?.error) {
                setMessage({ text: result.error, type: 'error' })
            } else if (result?.success) {
                setMessage({ text: result.success, type: 'success' })
                setTimeout(() => {
                    setOpen(false)
                    setMessage(null)
                }, 3000)
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="link" className="px-0 font-normal">
                    ¿Olvidó su contraseña?
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Recuperar Contraseña</DialogTitle>
                    <DialogDescription>
                        Ingrese su cédula y correo electrónico registrados. Se le enviará una nueva contraseña provisional.
                    </DialogDescription>
                </DialogHeader>
                <form action={onSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="cedula-reset">Cédula</Label>
                        <Input id="cedula-reset" name="cedula" required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email-reset">Correo Electrónico</Label>
                        <Input id="email-reset" name="email" type="email" required />
                    </div>
                    {message && (
                        <div className={`text-sm font-medium ${message.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                            {message.text}
                        </div>
                    )}
                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Enviando..." : "Enviar Contraseña"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
