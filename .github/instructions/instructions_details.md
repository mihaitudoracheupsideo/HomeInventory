# HomeInventory -- Implementation Instructions

## Purpose

This document summarizes the architectural and UI decisions for the
**HomeInventory** application.\
It is intended to guide development inside **VSCode** and keep
implementation consistent.

Tech stack:

-   Backend: ASP.NET Core (.NET 9)
-   Database: SQLite with EF Core migrations
-   Frontend: React + Vite + TypeScript
-   Architecture goal: Manage and track physical objects in a home using
    a hierarchical structure and QR codes.

------------------------------------------------------------------------

# Core Concept

Everything in the system is an **Item**.

Examples:

-   House
-   Room
-   Closet
-   Box
-   Shelf
-   Tool
-   Cable
-   Device

Some items **contain other items**, while others are **leaf objects**.

Examples:

Container items: - House - Room - Cabinet - Box

Leaf items: - Hammer - USB Cable - Drill

This is controlled by **ItemType**.

------------------------------------------------------------------------

# Data Model

## Item

Fields:

-   Id (Guid)
-   Name
-   ItemTypeId
-   Path
-   Depth
-   Description
-   CreatedAt
-   UpdatedAt
-   ImageUrl
-   QRCode
-   Metadata (json optional)

### Path

Path represents the hierarchical location.

Example:

/house/garage/shelf/box-tools

Or GUID-based:

/a1/b4/c2/

### Depth

Depth indicates hierarchy level.

Example:

House = 0 Garage = 1 Shelf = 2 Box = 3 Item = 4

Depth is used for fast queries and UI rendering.

------------------------------------------------------------------------

# Why Path Instead of ParentId

Traditional hierarchy:

ParentItemId

Alternative used here:

Path + Depth

Advantages:

-   Fast subtree queries
-   Easy breadcrumb generation
-   Simple hierarchy traversal
-   Works well with SQLite

Example query:

SELECT \* FROM Items WHERE Path LIKE '/house/garage/%'

Immediate children:

SELECT \* FROM Items WHERE Path LIKE '/house/garage/%' AND Depth =
parentDepth + 1

------------------------------------------------------------------------

# ItemType

Defines behavior of an item.

Fields:

-   Id
-   Name
-   Icon
-   CanContainItems (bool)
-   IsLeaf (bool)

Examples:

Room Box Shelf Tool Electronics Cable

------------------------------------------------------------------------

# Main Application Sections

## Dashboard

Displays overview:

-   Total items
-   Total locations
-   Recently added items
-   Items without location
-   Recently scanned QR items
-   Storage usage stats

Widgets:

-   Item Count
-   Locations Count
-   Recent Activity
-   Quick Add

------------------------------------------------------------------------

# Explorer

Explorer is the **main navigation system**.

Structure:

Tree view of all items.

Example:

House ├ Garage │ ├ Shelf │ │ ├ Box Tools │ │ │ ├ Hammer │ │ │ └ Drill │
│ └ Paint Supplies

Features:

-   Expand / collapse nodes
-   Drag & drop items
-   Right-click context menu
-   Breadcrumb navigation

------------------------------------------------------------------------

# Breadcrumb Generation

Breadcrumb is derived from **Path**.

Example:

Path:

/house/garage/shelf/box-tools

Breadcrumb:

House \> Garage \> Shelf \> Box Tools

Algorithm:

1.  Split path segments
2.  Fetch items for each segment
3.  Render clickable breadcrumb

------------------------------------------------------------------------

# Items Page

Items list supports:

-   Grid view
-   List view
-   Filtering
-   Sorting

Columns:

-   Image
-   Name
-   Location
-   Type
-   Created date
-   Tags

Actions:

-   Edit
-   Move
-   Delete
-   Generate QR

------------------------------------------------------------------------

# QR Scan Workflow

Goal: Add item in **3 seconds**.

Steps:

1.  Open Scan page
2.  Scan container QR
3.  Enter item name
4.  Save

Result:

Item is automatically placed in scanned location.

Flow:

Scan QR → Identify container → Create item → Save.

------------------------------------------------------------------------

# Search

Global search supports:

-   Item name
-   Type
-   Tags
-   Location

Autocomplete:

Implementation ideas:

-   Indexed local search
-   Debounced queries
-   Suggestions dropdown

Example suggestions:

Hammer\
Hammer Drill\
Hand Saw

------------------------------------------------------------------------

# Reports

Reports page shows analytics.

Examples:

Items per room Items per type Recently added items Unused items

Possible charts:

-   Bar charts
-   Pie charts
-   Storage distribution

------------------------------------------------------------------------

# Settings

Settings contain configuration and admin features.

Sections:

## General

Application name Default language Timezone Units

## Item Types

Manage types:

Add Edit Delete

Define:

-   Icon
-   Leaf/container

## QR Settings

QR code format Auto-generate QR on item creation Label templates

## Storage Structure

Define base structure:

House Rooms Garages

Optional auto-create templates.

## Backup

Export database Import backup Automatic backups

## AI Features (optional)

Image recognition Auto tag suggestions

------------------------------------------------------------------------

# Responsive UI Strategy

The application uses **one responsive layout**.

Not separate desktop/mobile apps.

Framework:

TailwindCSS.

Breakpoints:

sm md lg xl

------------------------------------------------------------------------

# Desktop Layout

Three-column layout.

Sidebar Explorer Details panel

Example:

Sidebar \| Tree \| Item Details

Sidebar contains navigation:

Dashboard Explorer Items Search QR Scan Reports Settings

------------------------------------------------------------------------

# Mobile Layout

Navigation becomes:

Hamburger menu Bottom tab navigation

Explorer becomes vertical navigation.

Item details open as full screen page.

QR scan uses full screen camera.

------------------------------------------------------------------------

# Responsive Techniques

Tailwind examples:

Desktop sidebar:

hidden md:flex

Mobile sidebar:

md:hidden

Grid changes:

grid-cols-1 md:grid-cols-3

------------------------------------------------------------------------

# Recommended React Structure

src/

components/ layout/ pages/ features/ api/ hooks/ types/

Example:

ExplorerTree ItemCard ItemDetailsPanel QRScanner SearchAutocomplete

------------------------------------------------------------------------

# Cool Future Features

Smart organization suggestions.

Example:

"Most tools are in Garage → suggest moving this item."

AI object recognition:

Take photo → detect item → auto-fill name.

Voice search:

"Where is the hammer?"

------------------------------------------------------------------------

# Development Workflow

Suggested order:

1.  Core data model
2.  Item CRUD
3.  Explorer tree
4.  Breadcrumb navigation
5.  QR scan workflow
6.  Search with autocomplete
7.  Dashboard widgets
8.  Reports
9.  Settings panel
10. AI enhancements

------------------------------------------------------------------------

# Key Principles

Everything is an Item.

Hierarchy is managed with:

Path + Depth.

UI focuses on:

Fast navigation Fast item creation Visual storage mapping.

Goal:

Know **where every object in the house is located** instantly.
