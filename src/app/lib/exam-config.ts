export type CategoryType = 'ROTATION' | 'COURSE';

export interface CategoryConfig {
    type: CategoryType;
    durationMonths?: number; // Only for rotations
}

export const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
    // Rotations (70% total weight, distributed by duration)
    "Medicina Interna": { type: 'ROTATION', durationMonths: 6 },
    "Geriatría": { type: 'ROTATION', durationMonths: 4 },
    "Ginecología": { type: 'ROTATION', durationMonths: 4 },
    "Pediatría": { type: 'ROTATION', durationMonths: 6 },
    "Fisiatría": { type: 'ROTATION', durationMonths: 2 },
    "Psiquiatría": { type: 'ROTATION', durationMonths: 3 },
    "Dermatología": { type: 'ROTATION', durationMonths: 2 },
    "Neonatología": { type: 'ROTATION', durationMonths: 1 },
    "Hospital de Día": { type: 'ROTATION', durationMonths: 1 },
    "Otorrinolaringología": { type: 'ROTATION', durationMonths: 1 },
    "Oftalmología": { type: 'ROTATION', durationMonths: 1 },
    "Ortopedia": { type: 'ROTATION', durationMonths: 1 },
    "Comunidad 1": { type: 'ROTATION', durationMonths: 4 },
    "Comunidad 2": { type: 'ROTATION', durationMonths: 12 },
    "Clínica VIH": { type: 'ROTATION', durationMonths: 1 },

    // Courses (30% total weight, distributed equally)
    "Cirugía Menor": { type: 'COURSE' },
    "Curso Familiar 1": { type: 'COURSE' },
    "Curso Familiar 2": { type: 'COURSE' },
    "Curso Gestión": { type: 'COURSE' },
    "Curso Salud Pública": { type: 'COURSE' },
    "Curso Emergencias": { type: 'COURSE' },
    "Curso Valoración Perioperatoria": { type: 'COURSE' },
    "Curso Ultrasonido": { type: 'COURSE' },
};

export const TOTAL_EXAM_WEIGHTS = {
    ROTATION: 0.7,
    COURSE: 0.3
};

interface DistributionResult {
    categoryId: string;
    count: number;
}

export function calculateQuestionDistribution(totalQuestions: number, categoryNames: { id: string, name: string }[]): DistributionResult[] {
    const result: DistributionResult[] = [];

    // 1. Separate into Rotations and Courses
    const rotations = categoryNames.filter(c => CATEGORY_CONFIG[c.name]?.type === 'ROTATION');
    const courses = categoryNames.filter(c => CATEGORY_CONFIG[c.name]?.type === 'COURSE');

    // 2. Calculate Targets
    // If only rotations or only courses selected, give them 100%
    let rotationWeight = TOTAL_EXAM_WEIGHTS.ROTATION;
    let courseWeight = TOTAL_EXAM_WEIGHTS.COURSE;

    if (rotations.length === 0) {
        rotationWeight = 0;
        courseWeight = 1;
    } else if (courses.length === 0) {
        rotationWeight = 1;
        courseWeight = 0;
    }

    const targetRotationQuestions = Math.round(totalQuestions * rotationWeight);
    const targetCourseQuestions = totalQuestions - targetRotationQuestions; // Remainder to ensure total matches

    // 3. Distribute Rotation Questions (Weighted by Duration)
    if (rotations.length > 0) {
        const totalDuration = rotations.reduce((sum, r) => sum + (CATEGORY_CONFIG[r.name]?.durationMonths || 1), 0);

        let assignedRot = 0;
        rotations.forEach((rot, index) => {
            const duration = CATEGORY_CONFIG[rot.name]?.durationMonths || 1;
            // Last item gets remainder to fix rounding errors
            if (index === rotations.length - 1) {
                const count = targetRotationQuestions - assignedRot;
                if (count > 0) result.push({ categoryId: rot.id, count });
            } else {
                const count = Math.round((duration / totalDuration) * targetRotationQuestions);
                if (count > 0) result.push({ categoryId: rot.id, count });
                assignedRot += count;
            }
        });
    }

    // 4. Distribute Course Questions (Equal)
    if (courses.length > 0) {
        let assignedCourse = 0;
        courses.forEach((course, index) => {
            // Last item gets remainder
            if (index === courses.length - 1) {
                const count = targetCourseQuestions - assignedCourse;
                if (count > 0) result.push({ categoryId: course.id, count });
            } else {
                const count = Math.round(targetCourseQuestions / courses.length);
                if (count > 0) result.push({ categoryId: course.id, count });
                assignedCourse += count;
            }
        });
    }

    return result;
}
