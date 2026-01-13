import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Sistema de Evaluación de Residentes",
    description: "Postgrado de Medicina Familiar y Comunitaria UCR",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es">
            <body className="antialiased">
                {children}
            </body>
        </html>
    );
}
