"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bold, Italic, List, Code } from "lucide-react"
import { MarkdownRenderer } from "./markdown-renderer"

interface MarkdownEditorProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    label?: string
}

export function MarkdownEditor({ value, onChange, placeholder, label }: MarkdownEditorProps) {
    const [activeTab, setActiveTab] = useState("edit")

    const insertMarkdown = (before: string, after: string = "") => {
        const textarea = document.querySelector('textarea') as HTMLTextAreaElement
        if (!textarea) return

        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const selectedText = value.substring(start, end)
        const newText = value.substring(0, start) + before + selectedText + after + value.substring(end)

        onChange(newText)

        // Restore focus and selection
        setTimeout(() => {
            textarea.focus()
            textarea.setSelectionRange(start + before.length, end + before.length)
        }, 0)
    }

    return (
        <div className="space-y-2">
            {label && <label className="text-sm font-medium">{label}</label>}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex items-center justify-between mb-2">
                    <TabsList>
                        <TabsTrigger value="edit">Editar</TabsTrigger>
                        <TabsTrigger value="preview">Vista Previa</TabsTrigger>
                    </TabsList>

                    {activeTab === "edit" && (
                        <div className="flex gap-1">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => insertMarkdown("**", "**")}
                                title="Negrita"
                            >
                                <Bold className="size-4" />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => insertMarkdown("*", "*")}
                                title="Cursiva"
                            >
                                <Italic className="size-4" />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => insertMarkdown("\n- ", "")}
                                title="Lista"
                            >
                                <List className="size-4" />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => insertMarkdown("`", "`")}
                                title="Código"
                            >
                                <Code className="size-4" />
                            </Button>
                        </div>
                    )}
                </div>

                <TabsContent value="edit" className="mt-0">
                    <Textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className="min-h-[150px] font-mono text-sm"
                    />
                </TabsContent>

                <TabsContent value="preview" className="mt-0">
                    <div className="min-h-[150px] border rounded-md p-3 bg-muted/50">
                        {value ? (
                            <MarkdownRenderer content={value} />
                        ) : (
                            <p className="text-muted-foreground text-sm">Sin contenido para previsualizar</p>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
