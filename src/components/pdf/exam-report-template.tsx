import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
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
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        fontSize: 9,
        color: '#999',
        borderTop: '1 solid #ddd',
        paddingTop: 10,
    },
});

interface ExamReportProps {
    student: {
        nombre: string;
        cedula: string;
    };
    exam: {
        title: string;
        course?: { name: string } | null;
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
}

export const ExamReportTemplate: React.FC<ExamReportProps> = ({
    student,
    exam,
    attempt,
    questions,
}) => {
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
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Reporte de Examen</Text>
                    <Text style={styles.subtitle}>
                        Programa de Posgrado en Medicina Familiar y Comunitaria
                    </Text>
                    <Text style={styles.subtitle}>Universidad de Costa Rica</Text>
                </View>

                {/* Student Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Información del Estudiante</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Nombre:</Text>
                        <Text style={styles.value}>{student.nombre}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Cédula:</Text>
                        <Text style={styles.value}>{student.cedula}</Text>
                    </View>
                </View>

                {/* Exam Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Información del Examen</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Examen:</Text>
                        <Text style={styles.value}>{exam.title}</Text>
                    </View>
                    {exam.course && (
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Curso:</Text>
                            <Text style={styles.value}>{exam.course.name}</Text>
                        </View>
                    )}
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Fecha:</Text>
                        <Text style={styles.value}>{formatDate(attempt.start_time)}</Text>
                    </View>
                </View>

                {/* Score */}
                <View style={styles.scoreBox}>
                    <Text style={styles.scoreText}>
                        Calificación: {attempt.score?.toFixed(1) || 'N/A'} / 100
                    </Text>
                </View>

                {/* Questions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Desglose de Preguntas</Text>
                    {questions.map((q, idx) => (
                        <View key={idx} style={styles.question} wrap={false}>
                            <Text style={styles.questionHeader}>
                                Pregunta {idx + 1} {q.isCorrect ? '✓' : '✗'}
                            </Text>
                            <Text style={styles.questionText}>{q.text}</Text>
                            {q.options.map((opt) => {
                                const isUserAnswer = opt.id === q.userAnswer;
                                const optionStyle = opt.is_correct
                                    ? styles.optionCorrect
                                    : isUserAnswer
                                        ? styles.optionIncorrect
                                        : styles.optionNeutral;

                                return (
                                    <View key={opt.id} style={styles.option}>
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

                {/* Footer */}
                <Text style={styles.footer}>
                    Generado el {formatDate(new Date())} - Sistema de Evaluación de Residentes
                </Text>
            </Page>
        </Document>
    );
};
