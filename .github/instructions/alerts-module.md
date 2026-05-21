\# Alerts Module Architecture



\## Goal



Implement a reusable Alerts module for ASP.NET Core + React applications.



The module must:

\- support recurring alerts

\- support daily/weekly/monthly schedules

\- generate alert occurrences from alert definitions

\- display active alerts in dashboard

\- allow alerts to remain active until solved

\- be reusable by multiple applications



\---



\# Architecture



The module is divided into:



1\. Alert Definitions

2\. Alert Occurrences

3\. Background Processing Engine



\---



\# Alert Definitions



Definitions are templates/rules configured from admin UI.



Examples:

\- monthly upload reminder

\- yearly insurance renewal

\- weekly maintenance reminder



Definitions DO NOT represent active alerts.



They only define:

\- frequency

\- generation rules

\- messages

\- due dates



\---



\# Alert Occurrences



Occurrences are generated from definitions.



Occurrences represent:

\- real active alerts

\- dashboard notifications

\- user actions



Users interact ONLY with occurrences.



Occurrences must support:

\- active

\- noticed

\- solved

\- overdue



Occurrences must preserve history.



\---



\# Important Rule



Do NOT generate duplicate active occurrences.



If an unresolved occurrence already exists for a definition:

\- skip generation



This prevents dashboard spam.



\---



\# Supported Frequencies



\- Daily

\- Weekly

\- Monthly

\- Yearly

\- Custom Cron (future)



\---



\# Backend Requirements



Use:

\- ASP.NET Core 9

\- EF Core

\- SQLite

\- Modular Monolith Architecture



Recommended:

\- Coravel for scheduling/background jobs



\---



\# Database Design



\## AlertDefinition



Fields:

\- Id

\- Name

\- Module

\- MessageTemplate

\- Frequency

\- DayOfWeek

\- DayOfMonth

\- TimeOfDay

\- DueAfterDays

\- RequiresAcknowledgement

\- IsEnabled

\- LastGeneratedAt



\---



\## AlertOccurrence



Fields:

\- Id

\- AlertDefinitionId

\- Title

\- Message

\- GeneratedAt

\- DueDate

\- Status

\- IsNoticed

\- NoticedAt

\- IsSolved

\- SolvedAt

\- SolvedBy



\---



\# Processing Engine



A scheduled background job runs periodically.



Pseudo flow:



For each enabled definition:

1\. Check if definition should generate

2\. Check if unresolved occurrence exists

3\. Generate occurrence

4\. Save occurrence



\---



\# Dashboard Requirements



Dashboard must show:

\- active alerts

\- overdue alerts

\- due dates

\- status colors



Alerts remain visible until solved.



\---



\# User Actions



Supported actions:

\- Mark as noticed

\- Mark as solved

\- Optional snooze



Solved alerts disappear from active dashboard.



\---



\# API Requirements



Endpoints:



GET /api/alerts/active

POST /api/alerts/{id}/noticed

POST /api/alerts/{id}/solved



Admin:

GET /api/admin/alert-definitions

POST /api/admin/alert-definitions

PUT /api/admin/alert-definitions/{id}



\---



\# Frontend Requirements



Use:

\- React

\- TypeScript

\- React Query

\- TailwindCSS



Create:

\- dashboard alert widget

\- notification bell

\- active alerts page

\- admin definition management page



\---



\# UI Behavior



Alert states:

\- Normal

\- Upcoming Due

\- Overdue

\- Solved



Suggested colors:

\- Gray

\- Orange

\- Red

\- Green



\---



\# Extensibility



The module must later support:

\- email notifications

\- push notifications

\- SignalR real-time updates

\- cron expressions

\- dynamic template variables

\- conditional alert generation



Design all services and entities to support future extensibility.

