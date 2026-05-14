# HomeInventory - Tag System Implementation Instructions

## Context

This application is a modular monolith built with:

- ASP.NET Core (.NET 9)
- React + Vite + TypeScript
- SQLite + EF Core
- REST and GraphQL APIs

The application goal is to manage and organize personal inventory items.

The application already contains 2 main entities:

- Item
- ItemType

An Item contains properties like:
- Id
- Name
- UniqueCode
- Description
- ParentItemId
- Path
- Depth
- etc.

We need to implement a complete reusable tagging system.

---

# Goal

Implement a scalable many-to-many tagging system that allows:

- one Item to have multiple Tags
- one Tag to belong to multiple Items

Tags will be used for:
- searching
- filtering
- categorization
- grouping
- dashboards/statistics
- future AI auto-tagging

The implementation must be generic, reusable, scalable, and optimized for future extensions.

---

# Architecture Requirements

## Database Model

Implement the following entities:

### Tag

Properties:
- Id (Guid)
- Name (string)
- NormalizedName (string)
- Type (enum)
- Color (nullable string)
- Icon (nullable string)

Navigation:
- ICollection<ItemTag>

Purpose:
- reusable global tags
- normalized search
- categorization
- future UI customization

---

### ItemTag

This is the many-to-many junction table.

Properties:
- ItemId
- TagId

Navigation:
- Item
- Tag

Composite primary key:
- ItemId + TagId

---

## Item Entity

Add navigation property:

```csharp
public ICollection<ItemTag> ItemTags { get; set; } = [];
```

---

# EF Core Configuration

Implement:
- composite primary key
- proper many-to-many relations
- indexes
- delete restrictions

Required:
- unique index on Tag.NormalizedName

Example logic:
- prevent duplicate tags
- prevent cascade delete issues

---

# Tag Normalization

Implement normalization logic.

Rules:
- trim spaces
- convert to upper invariant

Example:

```text
Playstation -> PLAYSTATION
 playstation -> PLAYSTATION
```

Create reusable helper/service:

```csharp
ITagNormalizer
TagNormalizer
```

---

# Tag Types

Implement enum:

```csharp
public enum TagType
{
    Generic = 0,
    Category = 1,
    Brand = 2,
    Location = 3,
    Feature = 4,
    Status = 5,
    Collection = 6
}
```

The system must be extensible.

---

# Backend Requirements

Implement:

## CRUD for Tags

Endpoints:
- create tag
- update tag
- delete tag
- get all tags
- search tags

---

## Item Tag Assignment

Endpoints:
- assign tag to item
- remove tag from item
- get item tags

Behavior:
- if tag exists -> reuse existing tag
- if tag does not exist -> create and assign

---

# Validation Rules

Prevent:
- duplicate tag assignment
- duplicate normalized names
- empty tags
- whitespace-only tags

---

# Search Requirements

Implement search support using:
- item name
- unique code
- tags

Search must work with:
- partial text
- normalized values

Example:
- searching "sony" should find items tagged with Sony

---

# Frontend Requirements

React + TypeScript implementation.

Implement reusable components:

## TagInput Component

Features:
- autocomplete existing tags
- create new tag
- remove assigned tags
- keyboard support
- async search

Suggested libraries:
- MUI Autocomplete
- React Select Creatable
- Mantine TagsInput

---

## Item Form Integration

Item create/edit pages must support:
- displaying current tags
- assigning tags
- removing tags

Display style example:

```text
[ Sony ] [ Electronics ] [ Gaming ]
```

---

# UX Requirements

Must support:
- fast typing
- no duplicated tags
- suggestions while typing
- tag chips/pills
- future filtering support

---

# API Design

Recommended endpoints:

```http
GET /api/tags
GET /api/tags/search?query=
POST /api/tags

POST /api/items/{id}/tags
DELETE /api/items/{id}/tags/{tagId}
GET /api/items/{id}/tags
```

---

# Repository/Service Architecture

Implement:
- repositories
- services
- DTOs
- validators
- mapping

Use clean architecture principles already used in the project.

---

# Future-Proofing Requirements

Design the implementation to support future features:

## Future Features
- AI auto-tagging
- hierarchical tags
- tag statistics
- tag usage counts
- advanced filtering
- faceted search
- SQLite FTS5 full text search
- dashboards
- analytics

Do NOT implement these now.
Only design the system to allow future expansion.

---

# Important Rules

## Do NOT:
- store tags directly as comma separated strings
- duplicate tag values
- create item-specific tags
- tightly couple tags to ItemType

## Must:
- keep tags reusable globally
- use normalized values
- use proper many-to-many relations
- optimize for searching
- create scalable architecture

---

# Deliverables

Generate:
- entities
- EF Core configurations
- migrations
- repositories
- services
- DTOs
- API endpoints
- React components
- frontend integration
- validation
- example usage

Follow existing project conventions and architecture.
