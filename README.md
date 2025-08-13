# Capital Craft 📈

> El "Duolingo para inversiones" - Plataforma educativa de inversiones a largo plazo

## 🎯 Visión del Producto

Capital Craft combina simulación con dinero virtual, IA educativa y datos reales de mercado para enseñar estrategias de inversión de largo plazo mediante práctica hands-on.

## 🏗️ Arquitectura del Proyecto

```
capital-craft/
├── backend/          # FastAPI + Clean Architecture
│   ├── app/
│   │   ├── core/
│   │   │   ├── entities/      # Domain Layer (Stock, Portfolio, Notification)
│   │   │   ├── use_cases/     # Application Layer (Business Logic)
│   │   │   └── interfaces/    # Contracts/Abstractions
│   │   ├── infrastructure/    # External Dependencies
│   │   │   ├── providers/     # Data Providers (Alpha Vantage, Mock)
│   │   │   ├── repositories/  # Data Persistence (JSON, Mock)
│   │   │   └── content/       # Educational Content (Markdown)
│   │   └── main.py           # FastAPI Entry Point
├── frontend/         # Next.js 15 + TypeScript + Tailwind
│   ├── src/
│   │   ├── app/              # Next.js App Router
│   │   ├── components/       # UI Components
│   │   ├── entities/         # Domain Models
│   │   ├── use-cases/        # Application Logic
│   │   ├── infrastructure/   # External Services
│   │   └── lib/              # Utilities & Stores
└── docs/            # Documentación del proyecto
```

## 🚀 Quick Start

### 🌊 Task Runner (Recomendado)

Usa nuestro script Python multiplataforma para ejecutar tareas desde la raíz del proyecto:

```bash
# Tests
python run.py test front    # Ejecutar tests del frontend (Next.js)
python run.py test back     # Ejecutar tests del backend (Python/FastAPI)
python run.py test all      # Ejecutar todos los tests con resumen

# Servidores de desarrollo
python run.py dev front     # Iniciar servidor frontend (Next.js)
python run.py dev back      # Iniciar servidor backend (FastAPI)

# Utilidades
python run.py status        # Ver estado del proyecto y dependencias
python run.py --help        # Ver ayuda completa
```

**Características del Task Runner:**
- ✅ **Cross-Platform**: Compatible con Windows, macOS y Linux
- 🎨 **Colores**: Output colorido con emojis
- 🔍 **Validación**: Verifica dependencias automáticamente
- ⏱️ **Timing**: Muestra tiempo de ejecución
- 🏗️ **Clean Architecture**: Siguiendo principios SOLID

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt

# 🗄️ Configurar Base de Datos (PostgreSQL)
docker-compose up -d postgres          # Iniciar PostgreSQL container

# 🎯 Setup inicial de base de datos
python scripts/db_manager.py fresh     # Reset completo + datos de prueba

# 🔄 Gestión de base de datos
python scripts/db_manager.py migrate   # Solo ejecutar migraciones pendientes
python scripts/db_manager.py seed      # Solo cargar datos de prueba
python scripts/db_manager.py status    # Verificar estado de la DB

# 🚀 Iniciar servidor
uvicorn main:app --reload
# Server: http://localhost:8000
```

#### 📋 Comandos de Base de Datos

| Comando | Descripción | Cuándo usar |
|---------|-------------|-------------|
| `fresh` | Reset completo + migraciones + datos | Setup inicial, desarrollo diario |
| `migrate` | Solo ejecutar migraciones pendientes | Después de cambios en modelos |
| `seed` | Solo cargar datos de prueba | Cuando necesites datos limpios |
| `reset` | Solo limpiar base de datos | Para empezar desde cero |
| `status` | Verificar estado actual | Diagnóstico de problemas |

**Flujo recomendado:**
1. **Primera vez:** `fresh` (crea todo desde cero)
2. **Desarrollo:** `fresh` cuando necesites reset completo  
3. **Producción:** Solo `migrate` (¡nunca `fresh`!)

#### 🔄 Creando Nuevas Migraciones

Cuando cambies los modelos de la base de datos:

```bash
# En el backend directory
alembic revision --autogenerate -m "Descripción del cambio"
alembic upgrade head
```

**Ejemplo:**
```bash
alembic revision --autogenerate -m "Add unique constraint to portfolio user_id"
alembic upgrade head
```

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
# App: http://localhost:3000
```

## 📊 Features Implementados

### Backend ✅
- [x] **Portfolio Management** - Create, Buy, Sell, Summary con P&L real
- [x] **Stock Data Integration** - Yahoo Finance + Alpha Vantage APIs
- [x] **Risk Analysis** - Cálculo de volatilidad y métricas de riesgo
- [x] **Learning Content System** - Contenido educativo en Markdown
- [x] **Notification System** - Sistema completo de notificaciones persistentes
  - [x] Generación contextual de notificaciones educativas
  - [x] Persistencia en JSON con backup/recovery
  - [x] CRUD endpoints (mark as read, dismiss, bulk operations)
  - [x] Mock repository para desarrollo/testing
  - [x] Dependency injection con DIContainer
- [x] **Clean Architecture** - Separación clara de capas + SOLID principles
- [x] **Testing** - Tests unitarios completos con >90% coverage

### Frontend ✅
- [x] **Portfolio Dashboard** - Visualización completa de portfolio
- [x] **Stock Trading Simulator** - Compra/venta con dinero virtual
- [x] **P&L Visualization** - Gráficos y métricas en tiempo real
- [x] **Risk Analysis UI** - Indicadores de riesgo y recomendaciones
- [x] **Notification System** - Sistema completo de notificaciones
  - [x] NotificationBell con contador de no leídas
  - [x] NotificationDropdown con lista interactiva
  - [x] Mark as read, dismiss, mark all as read
  - [x] Optimistic updates para mejor UX
  - [x] Integración con backend persistence
- [x] **Clean Architecture** - Domain, Application, Infrastructure, UI layers
- [x] **State Management** - Zustand stores con patrón repository
- [x] **UI/UX** - Componentes responsivos con Tailwind CSS

## 🔔 Sistema de Notificaciones

### Características
- **📚 Educativas**: Triggered por acciones del usuario (primera compra, alta volatilidad, etc.)
- **🎯 Contextuales**: Basadas en el estado actual del portfolio
- **💾 Persistentes**: Almacenamiento en JSON con backup automático
- **⚡ Real-time**: Polling cada 30s + optimistic updates
- **🔄 Resilientes**: Fallback automático a mock data si hay errores

### Endpoints API
```bash
GET    /users/{user_id}/notifications     # Obtener notificaciones
PATCH  /notifications/{id}                # Marcar como leída
DELETE /notifications/{id}                # Descartar notificación
POST   /notifications/mark-all-read       # Marcar todas como leídas
GET    /notifications/{id}                # Obtener notificación específica
```

### Configuración
```bash
# Backend
USE_MOCK_REPOSITORY=true              # Usar mock data (desarrollo)
NOTIFICATION_DATA_PATH=data/notifications.json  # Path del archivo JSON

# Frontend
NEXT_PUBLIC_API_BASE=http://localhost:8000      # URL del backend
```

## �️ Stack Tecnológico

### Backend
- **FastAPI** - Framework web moderno y rápido
- **Python 3.11+** - Lenguaje principal
- **Pydantic** - Validación de datos y serialización
- **Yahoo Finance API** - Datos reales de mercado
- **Alpha Vantage API** - Datos financieros adicionales
- **pytest** - Testing framework

### Frontend
- **Next.js 15** - React framework con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - State management ligero
- **Lucide React** - Iconos modernos
- **Jest + Testing Library** - Testing framework

### Arquitectura
- **Clean Architecture** - Separación clara de responsabilidades
- **SOLID Principles** - Código mantenible y extensible
- **Repository Pattern** - Abstracción de acceso a datos
- **Use Case Pattern** - Lógica de negocio encapsulada
- **Dependency Injection** - Inversión de dependencias

## 🧪 Testing

### Backend
```bash
cd backend
pytest                    # Ejecutar todos los tests
pytest --cov             # Con coverage report
pytest -v                # Verbose output
```

### Frontend
```bash
cd frontend
npm test                  # Ejecutar tests
npm run test:coverage     # Con coverage report
npm run test:watch        # Watch mode
```

## 🚀 Deployment

### Backend
```bash
# Producción con datos reales
export USE_MOCK_REPOSITORY=false
export ALPHA_VANTAGE_API_KEY=your_api_key
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
# Build para producción
npm run build
npm start
```

## 📈 Roadmap

### Próximas Features
- [ ] **WebSocket Integration** - Notificaciones en tiempo real
- [ ] **Push Notifications** - Notificaciones del browser
- [ ] **User Authentication** - Sistema de usuarios
- [ ] **Portfolio Sharing** - Compartir portfolios públicamente
- [ ] **Advanced Analytics** - Métricas avanzadas de performance
- [ ] **Mobile App** - React Native companion app

### Mejoras Técnicas
- [ ] **Database Integration** - PostgreSQL para persistencia
- [ ] **Caching Layer** - Redis para optimización
- [ ] **API Rate Limiting** - Throttling de requests
- [ ] **Monitoring** - Logs y métricas de performance
- [ ] **CI/CD Pipeline** - Automated testing y deployment

## 🤝 Contribución

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🙏 Agradecimientos

- **Yahoo Finance** - Por proporcionar datos de mercado gratuitos
- **Alpha Vantage** - Por APIs financieras robustas
- **Windsurf** - Por el excelente entorno de desarrollo AI-powered

---

**Capital Craft** - Democratizando la educación financiera a través de la gamificación y la práctica hands-on 🚀