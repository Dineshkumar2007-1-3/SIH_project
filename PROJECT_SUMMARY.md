# Landslide Sentinel AI - Project Summary

## Project Overview
Landslide Sentinel AI is an early-warning system for landslide risk that combines:
- A scikit-learn ML model trained on site conditions (rainfall, slope, soil moisture, vegetation cover, elevation, prior landslide history)
- A FastAPI backend serving predictions and managing alerts/reports
- A Next.js dashboard visualizing risk maps, alerts, and community reports
- Enhanced with premium UI/UX features for professional emergency management use

## Project Structure
```
landslide-sentinel-ai/
├── frontend/           # Next.js 14 (App Router) + TypeScript + Tailwind + Premium UI
├── backend/            # FastAPI + SQLAlchemy (SQLite by default) + WebSocket + Background Tasks
├── ml-model/           # scikit-learn training + inference scripts
└── assets/             # Shared static assets
```

## Key Features Implemented

### Core Functionality (Existing)
- **Dashboard**: View recent predictions and alert statistics
- **Map**: Visualize active high/critical alerts on Leaflet map
- **Alerts**: Monitor and resolve active alerts
- **Reports**: Submit and view field/community reports
- **ML Model**: scikit-learn RandomForestClassifier for landslide risk prediction
- **Backend API**: RESTful endpoints for predictions, alerts, and reports
- **Database**: SQLite with proper schema for sensor readings, predictions, alerts, reports

### Premium Enhancements (New)

#### 1. Real-time Updates
- WebSocket connection for live data updates
- Automatic refresh of dashboard, alerts, and map when new data arrives
- Connection status indicators and automatic reconnection

#### 2. Enhanced Data Visualization
- Interactive charts showing prediction trends over time (using recharts)
- Risk level distribution analytics
- Geographic hotspot identification
- Prediction accuracy metrics (when ground truth available)

#### 3. Premium UI Components
- Reusable component library (Button, Card, Input, TextArea, Badge, Skeleton, Tooltip, Modal)
- Consistent design system with proper spacing, typography, and interactive states
- Micro-interactions and smooth transitions
- Professional loading states and empty states

#### 4. Enhanced Existing Components
- **AlertCard**: Quick-action buttons, relative timestamps, visual badges
- **ReportForm**: Map-based location selection, image upload with preview, improved validation
- **RiskMap**: Marker clustering for performance, heatmap layer visualization, click-to-report, fullscreen toggle
- **Dashboard**: Real-time charts, connection status indicators, enhanced statistics

#### 5. Analytics Dashboard
- New `/analytics` route with comprehensive insights:
  - Overview statistics (total predictions, alerts, resolution rates)
  - Risk level distribution analysis
  - Geographic insights (top alert sites, spatial patterns)
  - Export functionality (CSV, PDF)
  - Comparative analysis (week-over-week trends)

#### 6. Authentication System
- Login and registration pages
- Auth context for managing user state
- Protected routes for sensitive operations
- Role-based access control (foundation for future enhancement)

#### 7. Background Task Processing
- Background task processor for:
  - Model retraining with new data
  - Report processing and verification workflows
  - Alert escalation notifications
  - Data cleanup and archiving
  - Scheduled report generation

#### 8. Performance & Accessibility
- Optimized bundle with code splitting
- Proper ARIA labels and keyboard navigation
- Responsive design for mobile and desktop
- Error boundaries and graceful degradation
- Loading skeletons and placeholder content

## Key Files Modified/Created
1. **Created**: `/frontend/.env.local`
   - Contains: `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`
   - Purpose: Enables frontend to communicate with backend API

2. **Created**: `/frontend/lib/websocket.ts` - WebSocket service
3. **Created**: `/frontend/hooks/useWebSocket.ts` - Custom WebSocket hooks
4. **Created**: `/frontend/lib/auth.ts` - Authentication helpers
5. **Created**: `/frontend/components/ui/` - Premium component library
6. **Created**: `/frontend/components/ui/Button.tsx` - Premium button component
7. **Created**: `/frontend/components/ui/Card.tsx` - Premium card component
8. **Created**: `/frontend/components/ui/Input.tsx` - Enhanced input component
9. **Created**: `/frontend/components/ui/TextArea.tsx` - Enhanced textarea component
10. **Created**: `/frontend/components/ui/Badge.tsx` - Status badge component
11. **Created**: `/frontend/components/ui/Skeleton.tsx` - Loading skeleton component
12. **Created**: `/frontend/components/ui/Tooltip.tsx` - Tooltip component
13. **Created**: `/frontend/components/ui/Modal.tsx` - Modal dialog component
14. **Enhanced**: `/frontend/components/AlertCard.tsx` - Premium alert card
15. **Enhanced**: `/frontend/components/ReportForm.tsx` - Premium report form
16. **Enhanced**: `/frontend/components/RiskMap.tsx` - Premium risk map
17. **Enhanced**: `/frontend/app/dashboard/page.tsx` - Dashboard with real-time updates
18. **Created**: `/frontend/app/analytics/page.tsx` - Analytics dashboard
19. **Enhanced**: `/frontend/components/Navbar.tsx` - Added analytics link
20. **Created**: `/frontend/components/auth/login.tsx` - Login page
21. **Created**: `/frontend/components/auth/register.tsx` - Registration page
22. **Created**: `/backend/websockets.py` - WebSocket endpoint
23. **Enhanced**: `/backend/routes/predictions.py` - WebSocket broadcasting
24. **Enhanced**: `/backend/routes/alerts.py` - WebSocket broadcasting
25. **Enhanced**: `/backend/routes/reports.py` - WebSocket broadcasting
26. **Enhanced**: `/backend/main.py` - WebSocket integration and background tasks
27. **Created**: `/background_tasks.py` - Background task processor

## Verification Completed
✓ Frontend structure: Next.js 14 with TypeScript/Tailwind and premium UI components
✓ Backend structure: FastAPI with SQLAlchemy ORM, WebSocket support, and background tasks
✓ ML Model: Trained model.pkl exists in ml-model/
✓ Database: SQLite database exists with proper schema
✓ API Endpoints: All routes properly defined (predictions, alerts, reports, websockets)
✓ Components: All UI components implemented and enhanced
✓ API Service: Frontend service correctly configured to call backend endpoints
✓ Environment: Missing .env.local file created to enable frontend-backend communication
✓ Real-time Updates: WebSocket connection established and functioning
✓ Premium UI: Component library created and integrated
✓ Analytics: New analytics dashboard with meaningful insights
✓ Authentication: Basic auth system with login/register pages
✓ Background Tasks: Task processor for asynchronous operations

## How to Run
1. **Backend**: 
   ```bash
   cd backend
   uvicorn main:app --reload --port 8000
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Visit**: http://localhost:3000

4. **Analytics Dashboard**: http://localhost:3000/analytics

## Features
- Dashboard: View recent predictions, alert statistics, and real-time charts
- Map: Visualize active high/critical alerts with clustering and heatmap options
- Alerts: Monitor and resolve active alerts with quick actions
- Reports: Submit reports with map location selection and image upload
- Analytics: Comprehensive insights with export capabilities
- Authentication: Secure login and role-based access (foundation)

## Notes
- The ML model uses synthetic data in dataset.csv - replace with real data for production
- Default map center is India's centroid - adjust in RiskMap.tsx for your region
- Background tasks are demonstrated - for production use a proper task queue like Celery
- Authentication is basic - for production implement proper JWT validation and secure storage
- WebSocket connections include basic error handling and reconnection logic