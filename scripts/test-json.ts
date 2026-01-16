
import fs from 'fs';
import path from 'path';

// Validation Logic adapted from json-import.ts
function validateQuestions(jsonData: string) {
    try {
        const questions = JSON.parse(jsonData);
        if (!Array.isArray(questions)) {
            console.error("Error: Root is not an array.");
            return;
        }

        let errors = [];
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];

            // Emulate "Existing Category" mode where category in JSON is optional
            // In our case we assume targetCategoryId IS present (since user said they selected one)
            // So we skip the (!q.category) check.

            if (!q.text) errors.push(`Q${i + 1}: Missing text`);
            if (!q.options || !Array.isArray(q.options)) {
                errors.push(`Q${i + 1}: Missing or invalid options`);
                continue; // Cannot check options further
            }
            if (q.options.length < 2) errors.push(`Q${i + 1}: Less than 2 options`);

            const hasCorrect = q.options.some((o: any) => o.is_correct);
            if (!hasCorrect) errors.push(`Q${i + 1}: No correct answer marked`);

            // Check options keys
            q.options.forEach((o: any, idx: number) => {
                if (!o.text) errors.push(`Q${i + 1}-Opt${idx}: Missing text`);
                if (o.is_correct === undefined) errors.push(`Q${i + 1}-Opt${idx}: Missing is_correct`);
            });
        }

        if (errors.length > 0) {
            console.log("Validation Failed with errors:");
            errors.forEach(e => console.log("- " + e));
        } else {
            console.log("Validation Successful! The JSON structure is correct.");
        }

    } catch (e) {
        console.error("JSON Syntax Error:", e);
    }
}

const filePath = path.join(process.cwd(), 'sample-questions.json');
console.log("Reading file:", filePath);
const content = fs.readFileSync(filePath, 'utf-8');
validateQuestions(content);
