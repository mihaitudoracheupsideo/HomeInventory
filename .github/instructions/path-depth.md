
# HomeInventory – Architecture & Implementation Instructions

## Purpose

This document defines the architecture, hierarchy strategy, UI structure,
responsive behavior, search strategy, QR workflow, and development direction
for the HomeInventory application.

Tech stack:

- ASP.NET Core (.NET 9)
- React
- Vite
- TypeScript
- SQLite
- EF Core
- TailwindCSS

Application goals:

- Store and organize physical objects
- Track object locations
- Use hierarchical navigation
- Support QR scanning
- Work offline-first
- Support mobile and desktop
- Provide fast global search

---

# Core Principle

Everything is an Item.

Examples:

- House
- Room
- Garage
- Shelf
- Box
- Drawer
- Tool
- Cable
- Device

Some items can contain children.

Examples:

- House
- Room
- Cabinet
- Box

Some items are leaf/final items.

Examples:

- Hammer
- USB Cable
- HDMI Adapter

This behavior is controlled using ItemType.

---

# ItemType

Defines behavior and UI representation.

Fields:

- Id
- Name
- Icon
- CanContainItems
- IsLeaf
- Color
- SortOrder

---

# Hierarchy Strategy

The application uses a hybrid hierarchy model:

- ParentItemId
- Path
- Depth
- NodeIndex

---

# Recommended Item Model

```csharp
public class Item
{
    public Guid Id { get; set; }

    public long NodeIndex { get; set; }

    public string Name { get; set; }

    public Guid? ParentItemId { get; set; }

    public string Path { get; set; }

    public int Depth { get; set; }

    public Guid ItemTypeId { get; set; }
}
```

---

# Path Structure

Recommended optimized format:

```text
/1/2/3/4/
```

Each segment is a numeric NodeIndex.

---

# Why Not Store GUIDs in Path

GUID paths work but:

- increase index size
- increase string comparison cost
- create longer queries

Recommended:

- GUID for identity
- NodeIndex for path optimization

---

# Depth

Depth represents hierarchy level.

Used for:

- tree indentation
- level filtering
- subtree optimization
- direct child filtering

---

# ParentItemId

ParentItemId is still required.

Fast query:

```sql
SELECT *
FROM Items
WHERE ParentItemId = @parentId
```

---

# Query Strategy

## Direct Children

```sql
SELECT *
FROM Items
WHERE ParentItemId = @parentId
```

## Subtree Query

```sql
SELECT *
FROM Items
WHERE Path LIKE '/1/2/%'
```

## Immediate Children Using Path + Depth

```sql
SELECT *
FROM Items
WHERE Path LIKE '/1/2/%'
AND Depth = parentDepth + 1
```

---

# Important SQLite Rule

Good:

```sql
Path LIKE '/1/2/%'
```

Bad:

```sql
Path LIKE '%/2/%'
```

Never use leading wildcard searches.

---

# Recommended Indexes

```sql
CREATE INDEX IX_Items_ParentItemId
ON Items(ParentItemId);

CREATE INDEX IX_Items_Path
ON Items(Path);

CREATE INDEX IX_Items_Depth
ON Items(Depth);

CREATE INDEX IX_Items_NodeIndex
ON Items(NodeIndex);
```

---

# Breadcrumb Strategy

Breadcrumbs are generated from Path.

Example:

```text
House > Garage > Shelf > Box
```

---

# Explorer UI

Features:

- Expand / collapse
- Drag & drop
- Breadcrumbs
- Lazy loading
- Keyboard navigation
- Search integration

---

# Dashboard

Widgets:

- Total items
- Total locations
- Recently added
- Recently scanned
- Storage statistics

---

# Search

Global search supports:

- Name
- Tags
- Type
- Location

---

# Search Autocomplete

Flow:

1. User types
2. Debounce
3. Query local cache or API
4. Show suggestions

Recommended:

SQLite FTS5.

---

# Offline-First Strategy

Architecture:

```text
React App
    ↓
IndexedDB
    ↓
Sync Engine
    ↓
ASP.NET Core API
    ↓
SQLite
```

---

# IndexedDB

Recommended:

Dexie.js

---

# QR Workflow

Flow:

1. Scan QR
2. Identify container
3. Enter item name
4. Save

---

# AI Object Recognition

Flow:

1. Take photo
2. Detect object
3. Suggest name and category

---

# Reports

Reports page contains:

- items per room
- items per type
- storage distribution

---

# Settings

Settings sections:

- General
- Item Types
- QR
- Backup
- AI

---

# Responsive Design Strategy

Use ONE responsive layout.

Framework:

TailwindCSS

---

# Desktop Layout

```text
Sidebar | Explorer | Details
```

---

# Mobile Layout

- hamburger menu
- bottom navigation
- full screen QR scanner

---

# Tailwind Responsive Examples

```html
hidden md:flex
```

```html
md:hidden
```

---

# Recommended React Structure

```text
src/
 ├ components/
 ├ layout/
 ├ pages/
 ├ features/
 ├ api/
 ├ hooks/
 ├ types/
```

---

# Suggested Development Order

1. Core models
2. EF Core migrations
3. CRUD API
4. Explorer tree
5. Breadcrumbs
6. Search
7. QR workflow
8. Offline sync
9. Reports
10. AI features
