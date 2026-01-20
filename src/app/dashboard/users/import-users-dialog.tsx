'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { importUsersFromFile } from '@/app/lib/user-import-actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function ImportUsersDialog() {
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isPending, setIsPending] = useState(false);
    const [cohort, setCohort] = useState('R1');
    const [result, setResult] = useState<{
        success: boolean;
        results?: { created: number; failed: number; errors: string[] };
        message?: string;
    } | null>(null);

    const handleImport = async () => {
        if (!file) return;

        setIsPending(true);
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('cohort', cohort);

        const response = await importUsersFromFile(formData);

        setResult(response);
        setIsPending(false);
    };

    return (
        <Dialog open={open} onOpenChange={(v) => {
            setOpen(v);
            if (!v) {
                setResult(null);
                setFile(null);
            }
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Upload className="size-4" />
                    Importar Lista
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Importar Estudiantes</DialogTitle>
                    <DialogDescription>
                        Suba un archivo (.xlsx, .docx, .pdf) con la lista de estudiantes.
                        Debe contener: Nombre, Cédula (será la contraseña) y Email.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Cohorte</Label>
                        <Select value={cohort} onValueChange={setCohort}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="R1">R1</SelectItem>
                                <SelectItem value="R2">R2</SelectItem>
                                <SelectItem value="R3">R3</SelectItem>
                                <SelectItem value="R4">R4</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="file">Archivo de Lista</Label>
                        <Input
                            id="file"
                            type="file"
                            accept=".xlsx, .xls, .docx, .pdf"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                    </div>

                    {result && (
                        <Alert variant={result.success && result.results?.failed === 0 ? "default" : "destructive"}>
                            {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                            <AlertTitle>{result.success ? "Proceso Completado" : "Error"}</AlertTitle>
                            <AlertDescription className="text-xs mt-2">
                                {result.results ? (
                                    <div className="flex flex-col gap-1">
                                        <span>Creados: {result.results.created}</span>
                                        <span>Fallidos: {result.results.failed}</span>
                                        {result.results.errors.length > 0 && (
                                            <ul className="list-disc list-inside mt-2 text-destructive-foreground max-h-32 overflow-y-auto">
                                                {result.results.errors.map((e, i) => (
                                                    <li key={i}>{e}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ) : (
                                    result.message
                                )}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button onClick={handleImport} disabled={!file || isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Importar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
