# Copilot Instructions for Home Inventory Application

## Application Overview
The Home Inventory application is a full-stack web application for managing household items. It allows users to create, read, update, and delete items with associated metadata including tags and images. The application consists of a React frontend and an ASP.NET Core Web API backend, with SQLite as the database.

## Technical Stack
- **Backend**: ASP.NET Core Web API (.NET 8+)
- **Frontend**: React 18+ with TypeScript, Material-UI (MUI), Vite
- **Database**: SQLite with Entity Framework Core
- **Image Processing**: SixLabors.ImageSharp for resizing and format conversion
- **Build Tools**: dotnet CLI for backend, npm/Vite for frontend
- **Architecture**: Clean Architecture with Domain, Application, Infrastructure, Repository, and WebApi layers

## Project Structure
```
backend/
├── HomeInventory.Domain/          # Domain entities and business rules
├── HomeInventory.Application/     # Application services and logic
├── HomeInventory.Repository/      # Repository interfaces
├── HomeInventory.Infrastructure/  # EF Core implementation, migrations
└── HomeInventory.WebApi/          # Controllers, Program.cs, appsettings

frontend/home-inventory-frontend/
├── src/
│   ├── components/                # Reusable UI components
│   ├── pages/                     # Page components (admin, etc.)
│   ├── services/                  # API service clients
│   └── types/                     # TypeScript type definitions
├── public/                        # Static assets
└── package.json                   # Dependencies and scripts
```

## Business Rules

### Items
- Items have the following properties:
  - Id: GUID (primary key)
  - Name: Required string (1-100 characters)
  - Description: Optional string (max 500 characters)
  - ItemTypeId: Required GUID (foreign key to ItemType)
  - ItemType: Navigation property to ItemType entity
  - UniqueCode: Required string (exactly 8 characters)
  - Tags: Optional list of strings (searchable)
  - ImagePath: Optional string (max 500 characters, relative path to stored image)

- Validation rules:
  - Name cannot be empty or whitespace, 1-100 characters
  - Description max 500 characters
  - ItemTypeId must reference an existing ItemType
  - UniqueCode must be exactly 8 characters
  - Tags are optional but should be meaningful keywords
  - ImagePath max 500 characters, set automatically upon image upload

### Item Types
- ItemTypes have:
  - Id: GUID (primary key)
  - Name: Required unique string (max 50 characters)
  - Description: Optional string

### Images
- Images are uploaded via POST /api/images endpoint
- Supported formats: JPEG, PNG, GIF, BMP, WebP
- Size options:
  - "original": Keep original dimensions
  - "custom": Resize to specified width/height (maintains aspect ratio)
- Storage: Hierarchical folder structure under wwwroot/images/
  - Format: images/{year}/{month}/{day}/{guid}.{extension}
- Maximum file size: 10MB (configurable in appsettings.json)
- Images are associated with items via ImagePath field

### API Endpoints
- GET /api/items: Retrieve paginated list of items
- GET /api/items/{id}: Retrieve single item
- POST /api/items: Create new item
- PUT /api/items/{id}: Update existing item
- DELETE /api/items/{id}: Delete item
- GET /api/itemtypes: Retrieve all item types
- POST /api/images: Upload image file

### Frontend Features
- Items list view with DataGrid showing: Image, Name, Description, UniqueCode, Tags, Actions
- Item detail view with full information and image preview
- Create/Edit item modal dialogs
- Image upload with preview and size selection
- Responsive design using Material-UI

## Development Guidelines

### Backend Development
- Use Clean Architecture principles
- Domain entities should contain business logic and validation
- DTOs for API contracts (CreateItemDto, UpdateItemDto)
- Repository pattern for data access
- EF Core migrations for database schema changes
- CORS enabled for frontend origin (http://localhost:5173)
- Validation: Use [ValidateNever] on complex types in update DTOs to prevent over-validation

### Frontend Development
- TypeScript for type safety
- Material-UI components for consistent UI
- Custom hooks for API calls (useItems, useItemTypes)
- Image service for upload and retrieval
- Error handling with try/catch and user notifications
- Form validation using react-hook-form

## UI Layout and Design

### Layout Structure (18%/82% Proportions)
The application uses a modern, responsive layout with fixed proportions:

#### 🔷 Top Bar Layout (Permanent & Static)
- **Position**: Fixed at the top of the screen
- **Height**: 64px (4rem)
- **Split**: Horizontally divided into two areas
  - **Left Area (18% width)**: Application logo display
  - **Right Area (82% width)**: Contains page title, global search textbox, dark mode toggle, and user profile info
- **Behavior**: Always visible, never scrolls

#### 🔷 Sidebar Layout (Left Side — Permanent, Non-Scrollable)
- **Position**: Fixed on the left side
- **Width**: 18% of screen width (matches logo area width)
- **Height**: Full height minus top bar (calc(100vh - 4rem))
- **Behavior**: Non-scrollable container
- **Menu Items**: Each item has Icon + Label
- **Responsive Behavior**:
  - **Desktop/Full Mode** (≥1024px): Show Icon + Label
  - **Compact Mode** (<1024px): Show Icon only (labels hidden)
  - **Transition**: Smooth dynamic transition without page refresh
- **Styling**: Clean spacing, rounded corners, subtle shadows

#### 🔷 Main Content Area (Scrollable)
- **Position**: Occupies remaining 82% width under top bar's right section
- **Behavior**: Only this area scrolls vertically
- **Content**: All pages, lists, dashboards, items, locations, etc. appear here
- **Padding**: 24px (1.5rem) padding on all sides

### Design System
- **Color Scheme**: Light & dark mode variants
- **Button Styling**: Blue background (`bg-blue-500 hover:bg-blue-700`) with white text
- **Typography**: Clean, modern fonts with proper hierarchy
- **Spacing**: Consistent spacing scale using Tailwind classes
- **Shadows**: Subtle shadows for depth and modern appearance

### Responsive Breakpoints
- **Desktop**: ≥1024px (full sidebar with labels)
- **Tablet/Mobile**: <1024px (compact sidebar with icons only)
- **Mobile Menu**: Overlay sidebar for small screens

### Component Architecture
- **TopBar**: Fixed header with logo, search, theme toggle, user profile
- **Sidebar**: Responsive navigation with dynamic compact/full modes
- **Main Content**: Scrollable container for all page content
- **Layout Integration**: Components work together to maintain 18%/82% proportions

### Navigation Menu Items
- Dashboard (📊)
- All Items (📦)
- Boxes (📦)
- Locations (📍)
- Search (🔍)
- Settings (⚙️)

### Implementation Notes
- Use Tailwind CSS for responsive utilities
- Maintain consistent 18%/82% layout proportions
- Ensure smooth transitions between responsive states
- All content pages render within the scrollable main area
- Sidebar menu items automatically highlight active routes

### Building and Running
- Backend: `dotnet run` from HomeInventory.WebApi directory
- Frontend: `npm run dev` from home-inventory-frontend directory
- Database: SQLite file created automatically with migrations
- Build: `dotnet build` for backend, `npm run build` for frontend

**Command Execution Note**: When chaining commands in PowerShell, use semicolon (`;`) instead of `&&`. For example:
- Correct: `cd c:\Projects\HomeInventory\frontend\home-inventory-frontend; npm run dev`
- Avoid: `cd c:\Projects\HomeInventory\frontend\home-inventory-frontend && npm run dev`

### Front startup
- Correct: `cd c:\Projects\HomeInventory\frontend\home-inventory-frontend; npm run dev`

### Code Quality
- Follow C# naming conventions and async/await patterns
- Use meaningful variable and method names
- Add XML documentation comments to public APIs
- Handle exceptions appropriately
- Write unit tests for business logic

### Git Workflow
- **Do not automatically stage files** with `git add .` unless explicitly requested by the user
- Only commit and push changes when the user specifically asks for it
- Wait for explicit user instruction before performing git operations

### Security Considerations
- Input validation on all API endpoints
- File upload restrictions (size, type)
- CORS configuration for allowed origins only
- No authentication implemented (add as needed)

### Deployment
- Backend: Publish as self-contained executable
- Frontend: Build static files served by backend or CDN
- Database: SQLite file included in deployment
- Environment-specific appsettings.json files

## Common Patterns
- Use GUIDs for entity IDs
- Paginated responses for list endpoints
- Hierarchical image storage for organization
- Modal dialogs for create/edit operations
- Toast notifications for user feedback
- Loading states during API calls

## Troubleshooting
- CORS errors: Check allowed origins in Program.cs
- Database issues: Run migrations with `dotnet ef database update`
- Build failures: Ensure all NuGet packages are restored
- Frontend errors: Check console for TypeScript/compilation errors
- Image upload issues: Verify file size limits and supported formats