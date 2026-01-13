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
    table: {
        marginTop: 10,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f0f0f0',
        padding: 8,
        fontWeight: 'bold',
        borderBottom: '1 solid #999',
    },
    tableRow: {
        flexDirection: 'row',
        padding: 8,
        borderBottom: '1 solid #ddd',
    },
    col1: { width: '40%' },
    col2: { width: '20%', textAlign: 'center' },
    col3: { width: '20%', textAlign: 'center' },
    col4: { width: '20%', textAlign: 'center' },
    statsBox: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#e0f2fe',
        borderRadius: 4,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    statsLabel: {
        fontWeight: 'bold',
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

interface CourseReportProps {
    course: {
        name: string;
    };
    exam: {
        title: string;
    };
    students: Array<{
        nombre: string;
        cedula: string;
        score: number | null;
        status: string;
        completedAt: Date | null;
    }>;
    statistics: {
        average: number;
        passed: number;
        failed: number;
        pending: number;
    };
}

export const CourseReportTemplate: React.FC<CourseReportProps> = ({
    course,
    exam,
    students,
    statistics,
}) => {
    const formatDate = (date: Date | null) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('es-CR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Reporte Oficial de Calificaciones</Text>
                    <Text style={styles.subtitle}>
                        Programa de Posgrado en Medicina Familiar y Comunitaria
                    </Text>
                    <Text style={styles.subtitle}>Universidad de Costa Rica</Text>
                </View>

                {/* Course Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Información del Curso</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Curso:</Text>
                        <Text style={styles.value}>{course.name}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Examen:</Text>
                        <Text style={styles.value}>{exam.title}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Fecha de Reporte:</Text>
                        <Text style={styles.value}>{formatDate(new Date())}</Text>
                    </View>
                </View>

                {/* Statistics */}
                <View style={styles.statsBox}>
                    <Text style={styles.sectionTitle}>Estadísticas Generales</Text>
                    <View style={styles.statsRow}>
                        <Text style={styles.statsLabel}>Promedio:</Text>
                        <Text>{statistics.average.toFixed(1)}</Text>
                    </View>
                    <View style={styles.statsRow}>
                        <Text style={styles.statsLabel}>Aprobados:</Text>
                        <Text>{statistics.passed}</Text>
                    </View>
                    <View style={styles.statsRow}>
                        <Text style={styles.statsLabel}>Reprobados:</Text>
                        <Text>{statistics.failed}</Text>
                    </View>
                    <View style={styles.statsRow}>
                        <Text style={styles.statsLabel}>Pendientes:</Text>
                        <Text>{statistics.pending}</Text>
                    </View>
                </View>

                {/* Students Table */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Calificaciones por Estudiante</Text>
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={styles.col1}>Nombre</Text>
                            <Text style={styles.col2}>Cédula</Text>
                            <Text style={styles.col3}>Calificación</Text>
                            <Text style={styles.col4}>Estado</Text>
                        </View>
                        {students.map((student, idx) => (
                            <View key={idx} style={styles.tableRow}>
                                <Text style={styles.col1}>{student.nombre}</Text>
                                <Text style={styles.col2}>{student.cedula}</Text>
                                <Text style={styles.col3}>
                                    {student.score?.toFixed(1) || 'N/A'}
                                </Text>
                                <Text style={styles.col4}>{student.status}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Footer */}
                <Text style={styles.footer}>
                    Generado el {formatDate(new Date())} - Sistema de Evaluación de Residentes
                </Text>
            </Page>
        </Document>
    );
};
