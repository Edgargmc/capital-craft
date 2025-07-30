# Capital Craft 📈

> El "Duolingo para inversiones" - Plataforma educativa de inversiones a largo plazo

## 🎯 Visión del Producto

Capital Craft combina simulación con dinero virtual, IA educativa y datos reales de mercado para enseñar estrategias de inversión de largo plazo mediante práctica hands-on.

## 🏗️ Arquitectura del Proyecto

```
capital-craft/
├── backend/          # FastAPI + Clean Architecture
├── frontend/         # Next.js + TypeScript + Tailwind
└── docs/            # Documentación del proyecto
```

## 🚀 Quick Start

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

## 📊 Features Implementados

### Backend ✅
- [x] Entity Stock con datos reales (Yahoo Finance)
- [x] Portfolio Management (Create, Buy, Sell, Summary)
- [x] P&L Analysis en tiempo real
- [x] Clean Architecture + SOLID principles
- [x] Tests unitarios completos

### Frontend 🚧
- [ ] Dashboard de portfolio
- [ ] Simulador de compra/venta
- [ ] Visualización de P&L
- [ ] UI/UX educativa

## 🛠️ Stack Tecnológico

**Backend:**
- FastAPI + Python
- Yahoo Finance API (yfinance)
- Clean Architecture
- pytest

**Frontend:**
- Next.js 14 + TypeScript
- Tailwind CSS
- Recharts para gráficos

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest tests/ -v

# Frontend tests (TODO)
cd frontend
npm test
```

## 📈 Roadmap

1. ✅ **Portfolio Simulator** - Core business logic
2. 🚧 **Frontend Básico** - Dashboard y simulador
3. 🔄 **Base de Datos** - Persistencia real
4. 🤖 **Tutor IA** - Educación personalizada
5. 🎮 **Gamificación** - Badges y leaderboards

## 🌟 Demo

**API Endpoints disponibles:**
- `GET /` - Welcome message
- `GET /stock/{symbol}` - Datos de acción individual
- `GET /portfolio/{user_id}` - Portfolio del usuario
- `POST /portfolio/{user_id}/buy` - Comprar acciones
- `POST /portfolio/{user_id}/sell` - Vender acciones
- `GET /portfolio/{user_id}/summary` - Summary con P&L

**Ejemplo de uso:**
```bash
# Crear portfolio y comprar AAPL
curl -X POST http://localhost:8000/portfolio/demo/buy \
  -H "Content-Type: application/json" \
  -d '{"symbol": "AAPL", "shares": 10}'

# Ver performance
curl http://localhost:8000/portfolio/demo/summary
```

## 📝 Contribuir

1. Baby steps + Clean Architecture
2. Tests primero
3. Documentar decisiones importantes
4. Demos funcionales cada 2 semanas

---

**Capital Craft** - Transformando la educación financiera mediante simulación práctica 🚀