# Sistema de Gestión de Exámenes para Residentes
## Posgrado de Medicina Familiar y Comunitaria - UCR

---

## 📖 Descripción

Sistema completo de gestión de exámenes para el Posgrado de Medicina Familiar y Comunitaria de la Universidad de Costa Rica. Permite la creación, asignación y evaluación de exámenes, con un robusto sistema de banco de preguntas, calificación automática, gestión de reclamos, y generación de reportes oficiales.

---

## ✨ Características Principales

### 🎯 Gestión de Exámenes
- Creación de exámenes con configuración flexible
- Asignación personalizada a residentes específicos
- Ventanas de disponibilidad configurables
- Generación automática de preguntas desde banco
- Temporizador en tiempo real
- Calificación automática

### 📚 Banco de Preguntas
- Editor Markdown con vista previa
- Soporte para imágenes (URL)
- Importación masiva:
  - JSON (formato personalizado)
  - Moodle XML
- Categorización por temas
- Búsqueda y filtrado
- Exportación a Excel/CSV

### 👥 Control de Acceso
- **Coordinadores**: Acceso completo al sistema
- **Profesores**: Gestión de exámenes y preguntas
- **Residentes**: Tomar exámenes y ver resultados

### 📊 Reclamos (Impugnaciones)
- Sistema formal de reclamos
- Ventanas de tiempo configurables
- Justificación con bibliografía
- Aprobación/rechazo por profesores
- Notificaciones de resolución

### 📄 Reportes PDF
- Reporte individual de examen
- Reporte oficial de curso
- Generación automática con logo UCR
- Descarga directa

### 📈 Dashboard & Analytics
- Estadísticas por rol
- Gráficos de rendimiento (Recharts)
- Feed de actividad reciente
- Métricas en tiempo real

### 🔍 Búsqueda Global
- Atajo de teclado: **Cmd/Ctrl + K**
- Búsqueda en tiempo real
- Resultados categorizados
- Navegación directa

### 🔔 Notificaciones
- Notificaciones in-app
- Alertas de reclamos resueltos
- Recordatorios de nuevos reclamos
- Polling automático

### 📤 Exportación de Datos
- Resultados de exámenes (Excel/CSV)
- Banco de preguntas completo
- Calificaciones de estudiantes

---

## 🛠️ Tecnologías

### Frontend
- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** + Radix UI
- **Recharts** (gráficos)
- **React Markdown** (renderizado)

### Backend
- **Next.js Server Actions**
- **Prisma ORM**
- **PostgreSQL / SQLite**
- **NextAuth** (autenticación)

### Librerías Adicionales
- `@react-pdf/renderer` - Generación PDF
- `xlsx` - Exportación Excel
- `date-fns` - Manejo de fechas
- `lucide-react` - Iconos

---

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx                    # Dashboard principal
│   │   ├── exams/                      # Gestión de exámenes
│   │   ├── questions/                  # Banco de preguntas
│   │   ├── claims/                     # Sistema de reclamos
│   │   └── layout.tsx                  # Layout con sidebar
│   ├── lib/
│   │   ├── exams.ts                    # Server actions - exámenes
│   │   ├── questions.ts                # Server actions - preguntas
│   │   ├── claims.ts                   # Server actions - reclamos
│   │   ├── exam-taking.ts              # Server actions - tomar examen
│   │   ├── export-data.ts              # Exportación Excel/CSV
│   │   ├── dashboard-stats.ts          # Estadísticas dashboard
│   │   ├── notifications.ts            # Sistema notificaciones
│   │   └── pdf-generator.ts            # Generación PDFs
│   └── api/
│       └── residents/route.ts          # API endpoints
├── components/
│   ├── ui/                             # shadcn/ui components
│   ├── app-sidebar.tsx                 # Sidebar navegación
│   ├── search-dialog.tsx               # Búsqueda global
│   ├── notifications-bell.tsx          # Campana notificaciones
│   ├── export-button.tsx               # Botón exportación
│   ├── markdown-editor.tsx             # Editor Markdown
│   ├── markdown-renderer.tsx           # Renderizador Markdown
│   └── dashboard/
│       ├── stats-card.tsx              # Tarjetas estadísticas
│       ├── performance-chart.tsx       # Gráfico rendimiento
│       └── activity-feed.tsx           # Feed actividad
├── auth.ts                             # Configuración NextAuth
└── prisma/
    └── schema.prisma                   # Esquema base de datos
```

---

## 🚀 Instalación y Configuración

### 1. Clonar e Instalar

```bash
# Clonar repositorio
git clone [url-del-repo]
cd "App examen de residentes"

# Instalar dependencias
npm install
```

### 2. Configurar Base de Datos

```bash
# Crear archivo .env
cp .env.example .env

# Editar .env con tu DATABASE_URL
# Para desarrollo: SQLite
DATABASE_URL="file:./dev.db"

# Para producción: PostgreSQL
DATABASE_URL="postgresql://user:password@host:5432/dbname"
```

### 3. Ejecutar Migraciones

```bash
# Aplicar migraciones
npx prisma migrate dev

# Generar cliente Prisma
npx prisma generate

# (Opcional) Abrir Prisma Studio
npx prisma studio
```

### 4. Configurar Autenticación

En `.env`:
```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="genera-un-secret-seguro"
```

Generar secret:
```bash
openssl rand -base64 32
```

### 5. Iniciar Desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

---

## 👤 Usuarios Iniciales

Crear usuario coordinador en Prisma Studio o SQL:

```sql
INSERT INTO User (id, cedula, nombre, role, password_hash, active)
VALUES (
  'uuid-generado',
  '123456789',
  'Coordinador Principal',
  'COORDINADOR',
  '$2a$10$...', -- Hash bcrypt de password
  true
);
```

---

## 📚 Uso del Sistema

### Coordinadores
1. **Gestionar Usuarios**: Crear profesores y residentes
2. **Crear Exámenes**: Configurar y asignar exámenes
3. **Revisar Reclamos**: Aprobar/rechazar impugnaciones
4. **Generar Reportes**: Descargar PDFs oficiales
5. **Exportar Datos**: Excel/CSV para análisis

### Profesores
1. **Crear Preguntas**: Editor Markdown con categorías
2. **Importar Preguntas**: JSON o Moodle XML
3. **Crear Exámenes**: Asignar a residentes
4. **Revisar Resultados**: Ver intentos y calificaciones
5. **Gestionar Reclamos**: Resolver impugnaciones

### Residentes
1. **Ver Exámenes Disponibles**: Dashboard con próximos exámenes
2. **Tomar Exámenes**: Con temporizador
3. **Ver Resultados**: Calificación y retroalimentación
4. **Formular Reclamos**: Durante ventana habilitada

---

## 🔑 Características Clave

### Asignación Personalizada
- Asignar exámenes a residentes específicos
- Configuración personalizada de categorías por estudiante
- Distribución equitativa de preguntas

### Ventanas de Tiempo
- **Examen**: `start_window` - `end_window`
- **Reclamos**: `claims_start` - `claims_end`
- Validación automática de disponibilidad

### Importación de Preguntas

**Formato JSON:**
```json
[
  {
    "text": "¿Pregunta en Markdown?",
    "explanation": "Explicación detallada",
    "category": "Cardiología",
    "image_url": "https://...",
    "options": [
      { "text": "Opción A", "is_correct": true },
      { "text": "Opción B", "is_correct": false }
    ]
  }
]
```

### Búsqueda Global
- **Cmd/Ctrl + K**: Abrir búsqueda
- Busca en: exámenes, preguntas, estudiantes, categorías
- Resultados en tiempo real
- Navegación directa

---

## 📊 Base de Datos

### Modelos Principales

- `User`: Usuarios del sistema (roles)
- `Question`: Banco de preguntas
- `QuestionCategory`: Categorías de preguntas
- `Exam`: Configuración de exámenes
- `ExamProfile`: Asignación personalizada
- `ExamAttempt`: Intentos de examen
- `Answer`: Respuestas individuales
- `Claim`: Reclamos/impugnaciones
- `Notification`: Notificaciones in-app

---

## 🔒 Seguridad

- ✅ Autenticación con NextAuth
- ✅ Control de acceso basado en roles
- ✅ Validación en servidor de todos los inputs
- ✅ Sanitización de Markdown
- ✅ Protección contra SQL injection (Prisma)
- ✅ Sesiones seguras
- ✅ HTTPS en producción (Vercel)

---

## 📖 Documentación Adicional

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guía de deployment
- [Walkthrough](/.gemini/antigravity/brain/.../walkthrough.md) - Documentación completa del sistema
- [Task Roadmap](/.gemini/antigravity/brain/.../task.md) - Historial de desarrollo

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crear branch de feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

---

## 📝 Licencia

Este proyecto fue desarrollado para el Posgrado de Medicina Familiar y Comunitaria de la Universidad de Costa Rica.

---

## 👨‍💻 Desarrollo

**Desarrollado con:**
- Next.js 15
- React 19
- TypeScript
- Prisma
- Tailwind CSS

**Estado:** ✅ Producción Ready

---

## 📞 Soporte

Para preguntas o problemas:
- Revisar documentación en `/docs`
- Consultar walkthrough completo
- Verificar logs en desarrollo

---

**Universidad de Costa Rica**  
**Posgrado de Medicina Familiar y Comunitaria**  
Sistema de Gestión de Exámenes - 2026
