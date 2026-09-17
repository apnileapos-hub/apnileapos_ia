# ApniLeap OS (Beta)

ApniLeap OS is an end-to-end platform designed to orchestrate complex B2B academic-corporate projects and clinical deployments across multiple university campuses. It brings together corporate sponsors, executive admins, faculty mentors, and student developers under one cohesive, automated hub.

## ?? Key Features

* **Multi-Persona Dashboards:** Tailored views for Central Executive Admins, Company Sponsors, Campus Coordinators, Faculty Mentors, and Student Developers.
* **Smart Project Intake & Proposal Generation:** Automatically parse uploaded .pdf and .docx proposal documents to auto-fill project requirements, durations, and scopes, streamlining the intake process.
* **Campus & Team Allocation:** Multi-tenant project tracking. Assign projects to specific campuses and dynamically track progress.
* **Integrated Kanban & Jira Synchronization:** Dedicated workspaces with Epic and Sub-task generation. Track progress, assign tickets, and monitor milestones across disparate teams.
* **Live Communications & Reporting:** Built-in team chats, virtual meeting scheduler, and automated final progress reporting.
* **AI Rovo Assistant:** A robust, conversational AI to help coordinators summarize issues and suggest action items.

## ??? Architecture

ApniLeap OS is built with a modern stack optimized for rapid iteration and deployment:

* **Frontend:** React + Vite, styled with modern CSS features and interactive charting libraries (Recharts).
* **Backend:** Node.js + Express.js.
* **Database & ORM:** PostgreSQL managed via Prisma.
* **Integrations:** Document parsing via pdf-parse & mammoth.

## ?? Getting Started

### Prerequisites
* Node.js (v16 or higher)
* PostgreSQL database

### 1. Database Setup
Create a PostgreSQL database and add its connection string to your backend .env file.

\\\ash
cd backend
npm install
# Configure your .env file with DATABASE_URL
npx prisma generate
npx prisma db push
\\\

### 2. Backend Installation
Start the backend server on port 5001.

\\\ash
cd backend
npm run dev
\\\
*(The backend will auto-seed essential mock data on initial start).*

### 3. Frontend Installation
Start the Vite development server.

\\\ash
cd frontend
npm install
npm run dev
\\\

## ?? Personas & Default Access

The platform simulates multiple roles. For local testing, you can use the built-in Persona Switcher in the top-right corner or log in via the predefined mock accounts.

* **Central Moderator (Executive):** executive@apnileap.com
* **Student Developer:** student1@kle.edu.in
* **Faculty Mentor:** mentor@kle.edu.in
* **Company Sponsor:** project_mentor@nvidia.com

---
*Built to empower academic-corporate partnerships.*
