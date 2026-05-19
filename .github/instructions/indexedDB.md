\# indexedDB.md



\## Offline-First Architecture with IndexedDB + Server Synchronization



\# Purpose



This project uses an \*\*offline-first architecture\*\* where:



\* The \*\*server database\*\* is the authoritative source of truth.

\* \*\*IndexedDB\*\* acts as:



&#x20; \* local cache

&#x20; \* offline storage

&#x20; \* reactive UI data source

\* The frontend UI reads primarily from IndexedDB.

\* Synchronization between client and server happens in the background.



The architecture must support:



\* instant UI rendering

\* offline usage

\* automatic synchronization

\* minimal API traffic

\* reactive UI updates



\---



\# Core Architectural Principles



\## 1. Server Database is the Source of Truth



The backend database remains authoritative.



```text

Server Database = Source of Truth

IndexedDB = Local Cache + Offline Storage

```



IndexedDB must never replace the server database.



\---



\## 2. UI Reads From IndexedDB



The frontend should read data from IndexedDB instead of directly from APIs.



```text

UI

&#x20;↓

IndexedDB

&#x20;↓

Background Synchronization

```



Benefits:



\* instant UI rendering

\* offline support

\* reduced network dependency

\* lower API traffic



\---



\## 3. IndexedDB is a Mirror Cache



IndexedDB contains a local mirror/subset of server data required by the UI.



It stores:



\* frequently used entities

\* workspace data

\* synchronization metadata

\* pending offline operations



It should NOT store:



\* audit logs

\* analytics

\* large historical archives

\* unnecessary admin metadata

\* sensitive credentials



\---



\# Technology Stack



Frontend:



\* React

\* TypeScript

\* IndexedDB

\* Dexie.js

\* dexie-react-hooks



Backend:



\* ASP.NET Core API

\* SQLite or SQL Server



\---



\# IndexedDB Library Requirements



Use:



\* Dexie.js

\* dexie-react-hooks



Reason:



\* simplified IndexedDB API

\* TypeScript support

\* reactive live queries

\* high performance

\* cleaner architecture



\---



\# Recommended Frontend Structure



```text

src

│

├── api

│   apiClient.ts

│

├── storage

│   indexedDb.ts

│

├── repositories

│   repository.ts

│

├── services

│   syncService.ts

│

├── hooks

│   useLiveData.ts

│

├── utils

│   network.ts

│

└── components

```



\---



\# IndexedDB Structure



Recommended IndexedDB structure:



```text

ApplicationDatabase

│

├── entityStores

├── settings

└── syncQueue

```



\## entityStores



Contain cached entities synchronized from the server.



\## settings



Contain metadata such as:



```text

lastSyncTimestamp

```



\## syncQueue



Contains offline operations waiting for synchronization.



Operation examples:



```text

create

update

delete

```



\---



\# Server Entity Requirements



Every synchronized entity must contain:



```text

Id

UpdatedAt

Deleted

```



Purpose:



\* incremental synchronization

\* conflict detection

\* soft delete support



\---



\# Initial Synchronization



The first application load must perform a full synchronization.



Flow:



```text

Application Start

&#x20;     ↓

Request Full Dataset

&#x20;     ↓

Server Returns Data

&#x20;     ↓

Save Into IndexedDB

&#x20;     ↓

Store lastSync timestamp

```



Use:



```text

bulkPut()

```



for efficient IndexedDB updates.



\---



\# Incremental Synchronization



After initial sync, only request changes since the last synchronization timestamp.



Flow:



```text

Read lastSyncTimestamp

&#x20;     ↓

Request Changes From API

&#x20;     ↓

Server Returns Updated Entities

&#x20;     ↓

Apply Changes Locally

&#x20;     ↓

Update lastSyncTimestamp

```



Update logic:



```text

If Deleted = true

&#x20;   remove entity locally

Else

&#x20;   insert or update locally

```



\---



\# Offline Write Operations



When the application is offline:



```text

User Action

&#x20;    ↓

Update IndexedDB

&#x20;    ↓

Add operation to syncQueue

```



The UI must continue functioning normally offline.



\---



\# Sync Queue Processing



When internet connectivity returns:



```text

syncQueue

&#x20;   ↓

Send operations to API

&#x20;   ↓

If successful → remove from queue

```



Operations should be processed sequentially.



\---



\# Online / Offline Detection



Use native browser APIs:



```typescript

navigator.onLine

```



Events:



```typescript

window.addEventListener("online")

window.addEventListener("offline")

```



When connection returns:



```text

1\. Process syncQueue

2\. Run incremental synchronization

```



\---



\# Repository Pattern



The UI must never communicate directly with APIs.



Use a repository layer.



Flow:



```text

Component

&#x20;  ↓

Repository

&#x20;  ↓

IndexedDB

&#x20;  ↓

API (background synchronization)

```



The repository layer is responsible for:



\* cache access

\* API communication

\* synchronization decisions

\* offline queueing



\---



\# Reactive UI with Live Queries



The UI should use reactive IndexedDB queries.



Use:



```text

useLiveQuery()

```



from:



```text

dexie-react-hooks

```



Flow:



```text

IndexedDB change

&#x20;     ↓

Live Query Trigger

&#x20;     ↓

Automatic React re-render

```



Benefits:



\* no manual refetching

\* minimal React state management

\* automatic UI synchronization



\---



\# UI Data Loading Strategy



Preferred startup flow:



```text

Application Start

&#x20;     ↓

Load UI from IndexedDB

&#x20;     ↓

Perform Incremental Sync

&#x20;     ↓

Update IndexedDB

&#x20;     ↓

Automatic UI refresh

```



The UI should become usable immediately without waiting for network requests.



\---



\# API Design Requirements



Synchronization endpoints should support:



```text

GET /sync?since=<timestamp>

```



Server responses should contain:



\* updated entities

\* deleted entities

\* synchronization timestamp



\---



\# Soft Delete Strategy



Use soft delete on the server:



```text

Deleted = true

```



Reason:



\* incremental synchronization support

\* client-side removal detection



\---



\# Conflict Handling



Recommended strategy:



```text

Last Write Wins

```



based on:



```text

UpdatedAt

```



More advanced conflict resolution can be added later if needed.



\---



\# IndexedDB Usage Rules



\## Use IndexedDB For



\* local cache

\* offline storage

\* reactive UI data

\* synchronization metadata

\* temporary offline operations



\## Do NOT Use IndexedDB For



\* authentication tokens

\* passwords

\* secrets

\* critical server-only data



Authentication tokens should use:



```text

localStorage

```



or secure cookies.



\---



\# Debugging IndexedDB



Use browser developer tools.



Typical path:



```text

F12

Application / Storage

IndexedDB

```



Inspect:



\* entity stores

\* syncQueue

\* settings



\---



\# Performance Recommendations



\## Use bulk operations



Prefer:



```text

bulkPut()

bulkAdd()

bulkDelete()

```



instead of many individual operations.



\---



\## Avoid unnecessary API calls



The UI should rely primarily on IndexedDB.



\---



\## Keep synchronization incremental



Never reload the entire dataset unless necessary.



\---



\# Architectural Goals



The implementation should achieve:



\* offline-first behavior

\* instant UI rendering

\* minimal API traffic

\* automatic synchronization

\* scalable client architecture

\* mobile-friendly performance

\* reactive UI updates



\---



\# Important Implementation Rules



1\. The server database remains authoritative.

2\. IndexedDB is a cache + offline layer.

3\. The UI reads from IndexedDB.

4\. Synchronization happens in the background.

5\. The repository layer controls data access.

6\. Offline operations are queued locally.

7\. Live queries drive UI updates.

8\. Synchronization should be incremental whenever possible.



\---



\# End of Instructions



