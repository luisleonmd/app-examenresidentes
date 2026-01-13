import { deleteAllCategoriesAndQuestions } from '@/app/lib/delete-all-data'

export default async function DeleteAllPage() {
    const result = await deleteAllCategoriesAndQuestions()

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Limpieza de Base de Datos</h1>
            {result.success ? (
                <div className="bg-green-50 border border-green-200 rounded p-4">
                    <p className="text-green-800">✓ Eliminación exitosa</p>
                    <p className="text-sm mt-2">Preguntas eliminadas: {result.deletedQuestions}</p>
                    <p className="text-sm">Categorías eliminadas: {result.deletedCategories}</p>
                    <p className="mt-4">
                        <a href="/dashboard/questions" className="text-blue-600 underline">
                            Ir al Banco de Preguntas para reimportar
                        </a>
                    </p>
                </div>
            ) : (
                <div className="bg-red-50 border border-red-200 rounded p-4">
                    <p className="text-red-800">✗ Error: {result.error}</p>
                </div>
            )}
        </div>
    )
}
