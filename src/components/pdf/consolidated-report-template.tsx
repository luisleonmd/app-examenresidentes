import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Styles for the letter
const letterStyles = StyleSheet.create({
    page: {
        padding: 50,
        fontSize: 12,
        fontFamily: 'Helvetica',
        lineHeight: 1.5,
    },
    header: {
        marginBottom: 30,
    },
    date: {
        textAlign: 'right',
        marginBottom: 20,
        fontWeight: 'bold',
    },
    recipientBlock: {
        marginBottom: 20,
    },
    recipientName: {
        fontWeight: 'bold',
    },
    greeting: {
        marginBottom: 15,
    },
    paragraph: {
        marginBottom: 15,
        textAlign: 'justify',
    },
    table: {
        marginTop: 20,
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#000',
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    tableRow: {
        margin: 'auto',
        flexDirection: 'row',
    },
    tableColName: {
        width: '70%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 5,
        backgroundColor: '#e0f2fe', // Light blue header
    },
    tableColGrade: {
        width: '30%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 5,
        textAlign: 'center',
    },
    tableCellName: {
        width: '70%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 5,
        backgroundColor: '#dcfce7', // Light green rows as per image
    },
    tableCellGrade: {
        width: '30%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 5,
        textAlign: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 50,
        left: 50,
        right: 50,
        fontSize: 10,
        textAlign: 'center',
        color: '#666',
    }
});

// Styles for the exam report (copied/adapted from exam-report-template)
const reportStyles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 11,
        fontFamily: 'Helvetica',
    },
    header: {
        marginBottom: 20,
        borderBottom: '2 solid #333',
        paddingBottom: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 12,
        color: '#666',
    },
    section: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    label: {
        fontWeight: 'bold',
        width: 120,
    },
    value: {
        flex: 1,
    },
    question: {
        marginBottom: 15,
        padding: 10,
        backgroundColor: '#f5f5f5',
        borderRadius: 4,
    },
    questionHeader: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    questionText: {
        marginBottom: 8,
        lineHeight: 1.4,
    },
    option: {
        marginLeft: 10,
        marginBottom: 3,
        flexDirection: 'row',
    },
    optionCorrect: {
        color: '#16a34a',
        fontWeight: 'bold',
    },
    optionIncorrect: {
        color: '#dc2626',
    },
    optionNeutral: {
        color: '#666',
    },
    scoreBox: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#e0f2fe',
        borderRadius: 4,
    },
    scoreText: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    signatureBox: {
        marginTop: 60,
        alignItems: 'center',
    },
    signatureLine: {
        width: 250,
        borderBottom: '1 solid #000',
        marginBottom: 8,
    },
    signatureText: {
        fontSize: 10,
        color: '#333',
        fontWeight: 'bold',
    },
});

interface ConsolidatedReportProps {
    exam: {
        title: string;
        course?: { name: string } | null;
    };
    reports: Array<{
        student: {
            nombre: string;
            cedula: string;
        };
        attempt: {
            start_time: Date;
            end_time: Date | null;
            score: number | null;
        };
        questions: Array<{
            text: string;
            options: Array<{ id: string; text: string; is_correct: boolean }>;
            userAnswer: string | null;
            isCorrect: boolean;
        }>;
    }>;
}

export const ConsolidatedReportTemplate: React.FC<ConsolidatedReportProps> = ({ exam, reports }) => {
    const today = new Date().toLocaleDateString('es-CR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const year = new Date().getFullYear();

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleString('es-CR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Document>
            {/* Cover Letter Page */}
            <Page size="A4" style={letterStyles.page}>
                <View style={letterStyles.header}>
                    <Text>Universidad de Costa Rica</Text>
                    <Text>Sistema de Posgrados Médicos</Text>
                </View>

                <Text style={letterStyles.date}>{today.charAt(0).toUpperCase() + today.slice(1)}</Text>

                <View style={letterStyles.recipientBlock}>
                    <Text style={letterStyles.recipientName}>Dra. Flavia Solórzano Morera</Text>
                    <Text>Coordinadora Posgrado Medicina Familiar</Text>
                    <Text>Médico Especialista</Text>
                </View>

                <View style={letterStyles.recipientBlock}>
                    <Text style={letterStyles.recipientName}>Sra. Joselyn Pamela Peña Quirós</Text>
                    <Text>Secretaria de Posgrado</Text>
                    <Text>Medicina Familiar y Comunitaria</Text>
                </View>

                <Text style={letterStyles.greeting}>Estimadas Señoras:</Text>

                <Text style={letterStyles.paragraph}>
                    Por medio de la presente me permito saludarla y a la vez entregarle las notas
                    correspondientes al examen final del Primer Semestre del {year} de los residentes de
                    Medicina Familiar y Comunitaria.
                </Text>

                <Text style={letterStyles.paragraph}>
                    En la tabla que le adjunto a continuación, podrá observar la nota del examen con
                    reclamos.
                </Text>

                {/* Grades Table */}
                <View style={letterStyles.table}>
                    <View style={letterStyles.tableRow}>
                        <Text style={[letterStyles.tableColName, { fontWeight: 'bold' }]}>Nombre y Apellidos</Text>
                        <Text style={[letterStyles.tableColGrade, { fontWeight: 'bold' }]}>Nota final con reclamos</Text>
                    </View>
                    {reports.map((report, idx) => (
                        <View style={letterStyles.tableRow} key={idx}>
                            <Text style={letterStyles.tableCellName}>{report.student.nombre}</Text>
                            <Text style={letterStyles.tableCellGrade}>
                                {report.attempt.score ? report.attempt.score.toFixed(1) : '-'}
                            </Text>
                        </View>
                    ))}
                </View>

                <Text style={letterStyles.footer}>Documento generado automáticamente por el Sistema de Evaluación</Text>
            </Page>

            {/* Individual Reports */}
            {reports.map((report, idx) => (
                <Page key={idx} size="A4" style={reportStyles.page}>
                    {/* Header */}
                    <View style={reportStyles.header}>
                        <Text style={reportStyles.title}>Reporte Individual de Examen</Text>
                        <Text style={reportStyles.subtitle}>
                            Programa de Posgrado en Medicina Familiar y Comunitaria
                        </Text>
                        <Text style={reportStyles.subtitle}>Anexo #{idx + 1}</Text>
                    </View>

                    {/* Student Info */}
                    <View style={reportStyles.section}>
                        <Text style={reportStyles.sectionTitle}>Información del Estudiante</Text>
                        <View style={reportStyles.infoRow}>
                            <Text style={reportStyles.label}>Nombre:</Text>
                            <Text style={reportStyles.value}>{report.student.nombre}</Text>
                        </View>
                        <View style={reportStyles.infoRow}>
                            <Text style={reportStyles.label}>Cédula:</Text>
                            <Text style={reportStyles.value}>{report.student.cedula}</Text>
                        </View>
                    </View>

                    {/* Exam Info */}
                    <View style={reportStyles.section}>
                        <Text style={reportStyles.sectionTitle}>Información del Examen</Text>
                        <View style={reportStyles.infoRow}>
                            <Text style={reportStyles.label}>Examen:</Text>
                            <Text style={reportStyles.value}>{exam.title}</Text>
                        </View>
                        {exam.course && (
                            <View style={reportStyles.infoRow}>
                                <Text style={reportStyles.label}>Rotación/Curso:</Text>
                                <Text style={reportStyles.value}>{exam.course.name}</Text>
                            </View>
                        )}
                        <View style={reportStyles.infoRow}>
                            <Text style={reportStyles.label}>Fecha:</Text>
                            <Text style={reportStyles.value}>{formatDate(report.attempt.start_time)}</Text>
                        </View>
                    </View>

                    {/* Score */}
                    <View style={reportStyles.scoreBox}>
                        <Text style={reportStyles.scoreText}>
                            Calificación: {report.attempt.score?.toFixed(1) || 'N/A'} / 100
                        </Text>
                    </View>

                    {/* Questions */}
                    <View style={reportStyles.section}>
                        <Text style={reportStyles.sectionTitle}>Desglose de Preguntas</Text>
                        {report.questions.map((q, qIdx) => (
                            <View key={qIdx} style={reportStyles.question} wrap={false}>
                                <Text style={reportStyles.questionHeader}>
                                    Pregunta {qIdx + 1} {q.isCorrect ? '✓' : '✗'}
                                </Text>
                                <Text style={reportStyles.questionText}>{q.text}</Text>
                                {q.options.map((opt) => {
                                    const isUserAnswer = opt.id === q.userAnswer;
                                    const optionStyle = opt.is_correct
                                        ? reportStyles.optionCorrect
                                        : isUserAnswer
                                            ? reportStyles.optionIncorrect
                                            : reportStyles.optionNeutral;

                                    return (
                                        <View key={opt.id} style={reportStyles.option}>
                                            <Text style={optionStyle}>
                                                {opt.id}. {opt.text}
                                                {opt.is_correct && ' (Correcta)'}
                                                {isUserAnswer && !opt.is_correct && ' (Su respuesta)'}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                        ))}
                    </View>

                    {/* Signature Section */}
                    <View style={reportStyles.signatureBox} wrap={false}>
                        <View style={reportStyles.signatureLine} />
                        <Text style={reportStyles.signatureText}>Firma Digital del Profesor / Coordinador</Text>
                    </View>
                </Page>
            ))}
        </Document>
    );
};
