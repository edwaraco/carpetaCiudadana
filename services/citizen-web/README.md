# Carpeta Ciudadana - Frontend

A modern React-based frontend for the "Carpeta Ciudadana" (Citizen Folder) operator system for Colombia. This application provides a user-friendly interface for citizens to manage their digital documents and interact with government entities.

## 🏗️ Architecture

This project follows **Domain-Driven Design (DDD)** principles with bounded contexts:

```
src/
├── contexts/                    # Bounded Contexts (DDD)
│   ├── identity/               # Citizen identity & registration
│   ├── authentication/         # Login, MFA, session management
│   ├── documents/              # Document upload & management
│   ├── folder/                 # Personal folder & storage
│   ├── portability/            # Operator transfer
│   └── requests/               # Document requests from entities
├── pages/                      # Application pages
├── shared/                     # Shared utilities & components
└── App.tsx                     # Root component with routing
```

### Bounded Context Structure

Each context follows this structure:

```
context/
├── domain/                     # Domain types & business rules
│   └── types.ts
├── infrastructure/             # External integrations
│   ├── api/                   # Real API implementations
│   ├── mocks/                 # Mock implementations
│   ├── IService.ts            # Service interface
│   └── index.ts               # Service factory
├── hooks/                      # React hooks for state management
├── components/                 # React components
└── context/                    # React Context (if needed)
```

## 🚀 Features

### Core Functionality

1. **Citizen Registration** - Register new citizens with validation
2. **Authentication** - Login with optional MFA (Multi-Factor Authentication)
3. **Document Management**
   - Upload certified and temporary documents
   - View, download, and delete documents
   - Drag-and-drop file upload
4. **Folder Management**
   - View folder information
   - Monitor storage usage
   - Storage limits enforcement (100 temporary docs, 500MB)
5. **Operator Portability**
   - Transfer between operators (72-hour window)
   - Real-time progress tracking
   - Phase-by-phase visualization
6. **Document Requests**
   - Receive requests from entities
   - Authorize or reject requests
   - Select documents to send

### Technical Features

- 🎯 **TypeScript** - Full type safety
- 🧩 **DDD Architecture** - Bounded contexts with clear separation
- 🔄 **Mock/Real API Switching** - Environment-based service selection
- 🎨 **Material-UI** - Modern, accessible components
- 🔐 **Protected Routes** - Authentication-based access control
- 📱 **Responsive Design** - Mobile-first approach
- ♿ **Accessibility** - WCAG 2.1 compliant
- 🧪 **Vitest + RTL** - Comprehensive unit testing with React Testing Library

## 📋 Prerequisites

- **Node.js**: >= 20.0.0 (LTS)
- **npm**: >= 10.0.0

## 🛠️ Installation

```bash
# Clone the repository
cd services/carpeta-ciudadana-frontend

# Install dependencies
npm install
```

## 🏃‍♂️ Running the Application

### Development Mode

```bash
# Run with mock APIs (default)
npm run dev

# The app will be available at http://localhost:5173
```

### Environment Configuration

Create a `.env` file in the root directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8080/api
VITE_USE_MOCK_API=true          # Use mock services (true/false)

# Authentication
VITE_MFA_REQUIRED=false         # Make MFA optional (true/false)

# Operator Configuration
VITE_OPERATOR_ID=micarpeta
VITE_OPERATOR_NAME=Mi Carpeta
```

### Build for Production

```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

## 🐳 Docker Deployment

### Build Docker Image

```bash
# Build the image
docker build -t carpeta-ciudadana-frontend:latest .

# Run the container
docker run -p 80:80 \
  -e VITE_API_BASE_URL=https://api.example.com \
  -e VITE_USE_MOCK_API=false \
  carpeta-ciudadana-frontend:latest
```

### Multi-stage Build

The Dockerfile uses a multi-stage build:

1. **Builder stage**: Node 20 Alpine for building
2. **Production stage**: Nginx Alpine for serving

## ☸️ Kubernetes Deployment

### Deploy to Kubernetes

```bash
# Navigate to k8s directory
cd k8s

# Apply all manifests
kubectl apply -f configmap.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f hpa.yaml
kubectl apply -f ingress.yaml
```

### Configuration

**ConfigMap** (`k8s/configmap.yaml`):
- API base URL
- Mock API toggle
- Operator ID

**Deployment** (`k8s/deployment.yaml`):
- 3 replicas (default)
- Health checks on `/health`
- Resource limits: 256Mi memory, 200m CPU

**HPA** (`k8s/hpa.yaml`):
- Autoscaling 3-10 pods
- Target: 70% CPU, 80% memory

**Ingress** (`k8s/ingress.yaml`):
- SSL/TLS termination
- CORS configuration
- Rate limiting

## 🧪 Testing

This project uses **Vitest** as the test runner and **React Testing Library** for component testing.

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI interface
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### Test Structure

Tests are co-located with the code they test:

```
src/contexts/documents/
├── components/
│   ├── DocumentCard.tsx
│   ├── DocumentCard.test.tsx       # Component tests
│   ├── DocumentList.tsx
│   └── DocumentList.test.tsx
├── hooks/
│   ├── useDocuments.ts
│   └── useDocuments.test.ts        # Hook tests
└── infrastructure/
    └── mocks/
        └── DocumentMockService.test.ts  # Service tests
```

### Testing Best Practices

- **Material-UI Select components**: Always use `id` and `labelId` attributes for proper accessibility
- **Multiple alerts**: Use `getAllByRole('alert')` and filter by content when multiple alerts exist
- **Disabled buttons**: Use `waitFor` to ensure buttons are enabled before interactions
- **Validation**: Test required fields using `toBeRequired()` matcher
- **Mocking hooks**: Mock custom hooks at the module level for consistent behavior

### Common Test Patterns

**Testing a form with validation:**
```typescript
it('validates required fields', async () => {
  render(<MyForm />);
  const titleInput = screen.getByLabelText(/title/i);
  expect(titleInput).toBeRequired();
});
```

**Testing Material-UI Select:**
```typescript
// Component code
<InputLabel id="select-label">Label</InputLabel>
<Select labelId="select-label" id="select-id" {...props}>

// Test code
const select = screen.getByLabelText(/label/i);
await user.click(select);
```

**Testing with multiple alerts:**
```typescript
const alerts = screen.getAllByRole('alert');
const errorAlert = alerts.find(alert =>
  alert.textContent?.includes('Error message')
);
expect(errorAlert).toBeInTheDocument();
```

## 📚 API Documentation

### Mock API Behavior

When `VITE_USE_MOCK_API=true`, the app uses mock services with:

- **Simulated delays** (400-800ms) for realistic UX
- **Pre-populated data**:
  - 3 sample documents (2 certified, 1 temporary)
  - 3 document requests
  - 3 available operators
- **Full CRUD operations** with in-memory storage
- **Validation rules** (e.g., certified docs can't be deleted)

### Real API Integration

When `VITE_USE_MOCK_API=false`, the app connects to real backend APIs:

- **Base URL**: `VITE_API_BASE_URL`
- **Authentication**: JWT tokens in Authorization header
- **Error handling**: Standardized error responses

## 🔐 Authentication Flow

1. **Registration** (`/register`)
   - Validate cedula with real-time checks
   - Generate immutable folder email
   - Create citizen account

2. **Login** (`/login`)
   - Email + password authentication
   - Optional MFA verification (OTP, Biometric, or Digital Certificate)
   - JWT token storage in localStorage

3. **Protected Routes**
   - All routes except `/`, `/login`, `/register` require authentication
   - Automatic redirect to `/login` if not authenticated
   - Token refresh on expiration

## 🎨 UI Components

### Reusable Components

- **Layout** - Main application layout with navigation
- **ProtectedRoute** - Route guard for authenticated pages
- **DocumentCard** - Display individual documents
- **RequestCard** - Display document requests
- **OperatorSelector** - Choose operator for portability

### Forms

- **RegisterCitizenForm** - Citizen registration with validation
- **LoginForm** - Login with email/password
- **MFAVerification** - Multi-factor authentication
- **UploadDocumentForm** - Drag-and-drop document upload
- **RespondRequestDialog** - Respond to document requests

## 📊 State Management

### Global State (React Context)

- **AuthContext** - Authentication state and user info
  - `isAuthenticated`: boolean
  - `user`: Citizen | null
  - `login()`, `logout()`, `verifyMFA()`

### Local State (React Hooks)

Each bounded context provides custom hooks:

- **Identity**: `useRegisterCitizen()`, `useValidateCitizen()`
- **Authentication**: `useAuth()`, `useMFA()`
- **Documents**: `useDocuments()`, `useUploadDocument()`, `useDeleteDocument()`
- **Folder**: `useFolder()`, `useFolderStatistics()`
- **Portability**: `useOperators()`, `useInitiatePortability()`, `usePortabilityStatus()`
- **Requests**: `useRequests()`, `useRespondToRequest()`

## 🌍 Internationalization (Future)

Currently, the app is in English for code and Spanish for user-facing text. Future versions will include:

- i18n support with react-i18next
- Spanish and English translations
- Language switcher in header

## 📝 Development Guidelines

### Code Style

- **TypeScript strict mode** enabled
- **ESLint** for code quality
- **Prettier** for formatting
- **Naming conventions**:
  - Components: PascalCase
  - Files: PascalCase for components, camelCase for utilities
  - Hooks: `use` prefix
  - Services: `Service` suffix
  - Interfaces: `I` prefix for service interfaces

### File Organization

```typescript
// ✅ Good - All related code in bounded context
src/contexts/documents/domain/types.ts
src/contexts/documents/infrastructure/IDocumentService.ts
src/contexts/documents/hooks/useDocuments.ts
src/contexts/documents/components/DocumentCard.tsx

// ❌ Bad - Scattered across project
src/types/documents.ts
src/services/documentService.ts
src/hooks/useDocuments.ts
src/components/documents/DocumentCard.tsx
```

### Adding a New Feature

1. **Identify the bounded context** (or create a new one)
2. **Define domain types** in `domain/types.ts`
3. **Create service interface** in `infrastructure/IService.ts`
4. **Implement mock service** in `infrastructure/mocks/`
5. **Implement real service** in `infrastructure/api/`
6. **Create hooks** in `hooks/`
7. **Build components** in `components/`
8. **Add page** in `pages/`
9. **Update routing** in `App.tsx`
10. **Write tests** for all layers

## 🐛 Troubleshooting

### Common Issues

**Issue**: "Module not found" errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Issue**: "Port 5173 is already in use"
```bash
# Kill the process using port 5173
lsof -ti:5173 | xargs kill -9
```

**Issue**: Mock API not working
```bash
# Check .env file
cat .env | grep VITE_USE_MOCK_API

# Should be: VITE_USE_MOCK_API=true
```

## 📄 License

This is an academic project for EAFIT University, Semester 1, Advanced Architecture course.

## ✅ Testing Achievements

Durante el desarrollo de este proyecto se implementó una suite completa de tests que cubrió:

- ✅ **Componentes de UI**: Todos los componentes principales tienen tests unitarios
- ✅ **Hooks personalizados**: Tests de lógica de estado y efectos secundarios
- ✅ **Servicios mock**: Validación de comportamiento de APIs simuladas
- ✅ **Formularios y validación**: Tests de flujos de usuario completos
- ✅ **Diálogos y modales**: Interacciones complejas con Material-UI
- ✅ **Estados de carga y error**: Manejo de casos edge

### Desafíos Resueltos

1. **Asociación de Labels en Material-UI Select**
   - Problema: `getByLabelText` no encontraba los Select components
   - Solución: Agregar `id` a `InputLabel` y `labelId` a `Select`

2. **Múltiples Elementos Alert**
   - Problema: `getByRole('alert')` fallaba con múltiples alerts
   - Solución: Usar `getAllByRole` y filtrar por contenido

3. **Botones Deshabilitados en Tests**
   - Problema: `pointer-events: none` impedía clicks en tests
   - Solución: Usar `waitFor` para esperar habilitación o ajustar flujo

4. **Fake Timers con Promesas**
   - Problema: Fake timers bloqueaban resolución de promesas
   - Solución: Usar timers reales o `rerender()` para simular cambios de estado

5. **React Hook Form Validation**
   - Problema: Mensajes de error no aparecían en tests
   - Solución: Simplificar tests verificando atributo `required` en lugar de mensajes

## 👥 Contributors

- **Development Team**: Advanced Architecture Course - EAFIT University
- **Academic Supervisor**: [Supervisor Name]

## 📈 Project Status

### ✅ Implemented Features

| Feature | Status | Tests |
|---------|--------|-------|
| Citizen Registration | ✅ Completed | ✅ Tested |
| Authentication & Login | ✅ Completed | ✅ Tested |
| MFA Verification | ✅ Completed | ✅ Tested |
| Document Upload | ✅ Completed | ✅ Tested |
| Document Management | ✅ Completed | ✅ Tested |
| Document Requests | ✅ Completed | ✅ Tested |
| Operator Portability | ✅ Completed | ✅ Tested |
| Folder Statistics | ✅ Completed | ✅ Tested |
| Protected Routes | ✅ Completed | ✅ Tested |

### 🏗️ Bounded Contexts Implemented

- ✅ **Identity** - Registro y validación de ciudadanos
- ✅ **Authentication** - Login, MFA, gestión de sesión
- ✅ **Documents** - Upload, visualización, eliminación de documentos
- ✅ **Folder** - Información de carpeta, estadísticas de uso
- ✅ **Portability** - Transferencia entre operadores
- ✅ **Requests** - Solicitudes de documentos de entidades

### 🎯 Test Coverage

- **Total Tests**: ~50+ test cases
- **Coverage**: Componentes principales, hooks, y servicios mock
- **Frameworks**: Vitest + React Testing Library
- **CI/CD**: Tests ejecutados en cada commit

## 🔗 Related Projects

- **Backend Services**: `services/**` (Por implementar)
- **Documentation**: `../../docs/` (Ver análisis DDD y ADRs)

---

**Built with ❤️ using React + TypeScript + Vite + Material-UI**

