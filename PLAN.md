PLAN.md

Viziotec Internal Management System (VIMS)

Project Overview

Build an internal web application called Viziotec Internal Management System (VIMS).

The purpose of this application is to centralize Viziotec’s daily operations into one platform, including:

* Invoice Management
* Leads & Project Management
* Financial Management
* Team Agenda Calendar
* Dashboard & Analytics
* Personal Notes

The application should feel modern, clean, fast, and enjoyable to use daily.

Think of the application as a combination of:

* Notion
* Trello
* QuickBooks
* Google Calendar
* Sticky Notes App

all inside one internal company portal.

⸻

Business Goals

Primary Goals

1. Eliminate scattered Excel files.
2. Centralize company information.
3. Improve project tracking.
4. Improve financial visibility.
5. Make old invoices easy to retrieve.
6. Improve team collaboration.
7. Give owners visibility into company performance.

⸻

Tech Stack

Frontend

* React.js
* TypeScript
* Vite
* React Router
* React Query (TanStack Query)
* Zustand (Global State)
* Tailwind CSS
* Shadcn/UI
* Framer Motion
* React Hook Form
* Zod Validation

⸻

Backend

Recommended:

* Supabase

Features:

* PostgreSQL Database
* Authentication
* Row Level Security
* Storage Buckets
* Realtime
* Edge Functions (optional)

Reason:
Supabase significantly reduces development time while providing security, file storage, and authentication.

⸻

Deployment

Frontend:

* Vercel

Backend:

* Supabase Cloud

⸻

User Roles

Owner

Permissions:

* Full system access
* Create/Edit/Delete invoices
* Manage projects
* Manage finances
* View reports
* Manage users
* Create agendas
* View all notes metadata (optional)
* System settings

⸻

Co-Owner

Permissions:

* Same permissions as Owner
* Cannot delete Owner account

⸻

Team Member

Permissions:

* Owner can choose team member permissions.

Invoices:

* View invoices
* Search invoices
* Download invoices

Projects:

* View projects
* Update project status if assigned

Finance:

* View limited finance information (optional)
* Upload receipts if assigned

Calendar:

* View company agendas
* Create personal agendas

Notes:

* Create
* Edit
* Delete own notes only

Dashboard:

* Personal dashboard

⸻

Authentication System

Pages:

Login

* Email
* Password
* Remember Me

Forgot Password

Reset Password

Invite User

Authentication Flow:

Owner creates user account
↓
User receives invitation email
↓
Set password
↓
Login
↓
Access based on role

⸻

Database Structure

USERS

Fields:

id
full_name
email
role
profile_image
position
created_at
updated_at

⸻

INVOICES

Fields:

id
invoice_number
client_name
client_email
client_phone
project_name
invoice_date
due_date
subtotal
tax_percentage
tax_amount
grand_total
status
notes
created_by
created_at
updated_at

Status:

* Draft
* Sent
* Paid
* Overdue
* Cancelled

⸻

INVOICE ITEMS

Fields:

id
invoice_id
service_name
description
quantity
unit_price
total_price

⸻

PROJECTS

Fields:

id
project_name
client_name
description
service_type
project_manager
assigned_to
status
priority
start_date
deadline
budget
notes
created_by
created_at
updated_at

Status:

* Lead
* Proposal Sent
* Negotiation
* Ongoing
* Existing
* Finished
* Cancelled

Priority:

* Low
* Medium
* High
* Urgent

Service Types:

* Website Design
* Application Development
* Branding
* Digital Marketing
* SEO
* Social Media Management
* Advertising
* Other

⸻

PROJECT ACTIVITY

Fields:

id
project_id
user_id
activity
created_at

Examples:

“Proposal sent to client”

“Payment received”

“Website revision completed”

⸻

FINANCE TRANSACTIONS

Fields:

id
type
category
title
description
amount
transaction_date
receipt_url
created_by
created_at

Type:

* Income
* Expense

Expense Categories:

* Salary
* Hosting
* Software Subscription
* Advertising
* Office Supplies
* Transportation
* Operational
* Miscellaneous

Income Categories:

* Website Project
* Branding Project
* Marketing Service
* Maintenance Fee
* Other

⸻

COMPANY CASH

This table should automatically calculate:

Current Money

Formula:

Current Money =
Total Income

Total Expense

No manual editing.

⸻

CALENDAR EVENTS

Fields:

id
title
description
event_type
start_datetime
end_datetime
created_by
assigned_to
reminder
created_at

Event Types:

* Meeting
* Project Deadline
* Internal Agenda
* Personal Reminder

⸻

NOTES

Fields:

id
user_id
title
content
color
position_x
position_y
is_archived
created_at
updated_at

Every user only sees their own notes.

⸻

FILE STORAGE

Supabase Storage Buckets:

invoices

* PDF invoices

receipts

* expense receipts
* transfer receipts

profile-images

⸻

Module 1

Dashboard

Create beautiful cards.

Widgets:

My Tasks

Shows:

* Assigned projects
* Due dates
* Upcoming deadlines

⸻

Project Statistics

Cards:

* Leads
* Ongoing Projects
* Existing Projects
* Finished Projects

⸻

Finance Summary

Cards:

* Current Cash
* Total Sales This Month
* Total Expenses This Month

Only visible to:

Owner
Co-Owner

⸻

Upcoming Agendas

Display:

Today
Tomorrow
This Week

⸻

Recent Activities

Timeline:

* New invoice created
* New project added
* Payment recorded
* Expense uploaded
* Meeting scheduled

⸻

Module 2

Invoice Management

Invoice List Page

Features:

* Search
* Filter
* Sort
* Pagination

Filters:

* Client
* Status
* Date
* Project

⸻

Create Invoice

Fields:

Client Information
Invoice Items
Tax
Discount
Due Date
Notes

Automatic calculations.

⸻

Invoice Number Format

Example:

VZT-INV-2026-0001

Automatically generated.

⸻

Invoice Preview

Professional PDF layout.

Include:

Viziotec Logo
Company Information
Client Information
Invoice Items
Tax
Grand Total
Payment Information
Notes

⸻

Export

* Download PDF
* Print Invoice

⸻

Permissions

Owner:
CRUD

Co-Owner:
CRUD

Team:
View only

⸻

Module 3

Leads & Project Management

Think of this like mini CRM + Trello.

Views:

Kanban View

Columns:

Lead
Proposal
Negotiation
Ongoing
Existing
Finished

Drag and drop cards.

⸻

Table View

Columns:

Project Name
Client
Assigned To
Priority
Deadline
Status

⸻

Project Detail Page

Sections:

Overview
Activity Timeline
Files
Financial Information
Notes

⸻

Project Progress

0%
25%
50%
75%
100%

Display progress bar.

⸻

Notifications

Notify users when:

* Project assigned
* Deadline approaching
* Status updated

⸻

Module 4

Finance Management

Dashboard Cards:

Current Cash
Monthly Revenue
Monthly Expenses
Net Profit

⸻

Income Page

Create income records.

Upload:

* Transfer receipt
* Invoice copy

⸻

Expense Page

Create expense records.

Upload:

* Receipt image
* Payment proof

Supported:

jpg
png
pdf

⸻

Reports

Monthly
Quarterly
Yearly

Charts:

Revenue Trend
Expense Trend
Profit Trend

⸻

Module 5

Calendar

Views:

Month
Week
Day

Features:

Create Event
Edit Event
Delete Event

⸻

Event Reminder

Reminder options:

15 minutes
30 minutes
1 hour
1 day

⸻

Dashboard Integration

Project deadlines automatically appear.

Upcoming meetings automatically appear.

⸻

Module 6

Sticky Notes

Create attractive sticky notes.

Features:

Create note
Edit note
Delete note
Archive note
Drag notes around screen

Visual style:

Yellow
Blue
Pink
Green
Purple

Features:

Auto-save
Rich text
Markdown support
Pin note
Search note

Every note is private.

No other users can access.

⸻

Module 7

Project Management

Dedicated operational view for tracking active project execution — separate from the CRM pipeline in Module 3.

Focus:

* What is currently being worked on
* What is almost done
* What has been completed
* Who is responsible

⸻

Project Status Views

Filter tabs:

Ongoing

* Projects actively in progress

Almost Finished

* Projects at 75%–99% completion

Finished

* Completed and delivered projects

⸻

Project Classification

Projects are grouped and filterable by type:

* Website Design
* Application Development
* Social Media
* Branding
* Digital Marketing
* Other

⸻

Project Manager

Each project has one designated Project Manager (any user in the system).

Displayed prominently on project cards and detail pages.

⸻

Project Card

Each card displays:

* Project Name
* Client Name
* Project Type
* Project Manager
* Assigned Team Members
* Progress Bar (0% / 25% / 50% / 75% / 100%)
* Deadline
* Status badge

⸻

Editing Rules

Who can update project progress/status:

* Owner — always
* Co-Owner — always
* Team Member — only if assigned to that project

Everyone can view all projects.

⸻

Views

Card/Grid View

* Visual cards grouped by status or type

Table View

* Sortable list with all key fields

⸻

Notifications System

Notification Center:

* Invoice due
* Project deadline
* Agenda reminder
* Assigned project
* New project update

Display:

Bell icon
Unread count

⸻

Search System

Global search bar.

Search:

Invoices
Projects
Clients
Calendar Events

⸻

Activity Logs

Track all important actions.

Examples:

User A created invoice
User B uploaded receipt
Project status changed

Fields:

id
user_id
action
module
metadata
created_at

⸻

Security Requirements

Implement:

Row Level Security (RLS)

Rules:

Invoices:
Owner/Co-owner CRUD
Team Read

Projects:
Role-based access

Finance:
Owner and Co-owner only

Notes:
Owner can only access own notes
Users only access own notes

Storage:
Secure file access
Signed URLs
Authentication required

⸻

Performance Requirements

Dashboard load:
< 2 seconds

Search:
< 500ms

Pagination:
Server-side

Image Upload:
Compression before upload

⸻

UI Design Requirements

Theme:

Modern SaaS dashboard.

Reference inspiration:

* Notion
* Linear
* Stripe Dashboard
* ClickUp

Characteristics:

Rounded corners
Soft shadows
Smooth animations
Minimal design
Dark Mode
Light Mode

⸻

Future Version 2 Features

Client Portal
Recurring Invoices
Email Invoice Sending
Profit Per Project
Team Chat
Time Tracking
Leave Management
Payroll Management
Google Calendar Sync
Gmail Integration
WhatsApp Notifications
AI Assistant
Project Analytics
Automated Monthly Financial Reports

⸻

Development Phases

Phase 1
Authentication
Role System
Dashboard Layout

Phase 2
Invoice Management

Phase 3
Project CRM

Phase 4
Finance Module

Phase 5
Calendar

Phase 6
Sticky Notes

Phase 7
Project Management Module

Phase 8
Notifications
Activity Logs
Search

Phase 9
Testing
Optimization
Deployment

⸻

Success Criteria

The application should allow Viziotec to:

✓ Create and store invoices
✓ Search historical invoices quickly
✓ Track leads and projects
✓ Monitor company finances
✓ Upload proof of transactions
✓ Manage team agendas
✓ See project deadlines immediately
✓ Have personal sticky notes
✓ Understand company health from one dashboard
✓ Scale with company growth without rebuilding the system