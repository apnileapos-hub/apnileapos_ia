# ApniLeap OS — Verified Testing Credentials & Dashboard Matrix

This document provides all verified and working login credentials for each dashboard persona in the ApniLeap OS platform. All credentials have been validated against the PostgreSQL database.

---

## 🏛️ 1. Central Executive & Moderator Dashboards

| Dashboard / Persona | Email | Password | Role / Persona Key | Description & Key Actions |
| :--- | :--- | :--- | :--- | :--- |
| **Central Moderator** | `moderator@apnileap.com` | `moderator123` | `moderator` | Ingest/upload proposals, parse PDF/DOCX templates, and **allocate projects to campus spokes**. |
| **Executive Admin** | `admin@apnileap.com` | `moderator123` | `executive` | Global executive analytics across all campuses, risk tracking, and budget oversight. |
| **Executive (Alternative)** | `executive@apnileap.com` | `executive123` | `executive` | Secondary executive portfolio view. |

---

## 🏢 2. Corporate Industry Dashboards

| Dashboard / Persona | Email | Password | Role / Persona Key | Description & Key Actions |
| :--- | :--- | :--- | :--- | :--- |
| **Corporate Sponsor** *(NVIDIA)* | `sponsor@nvidia.com` | `nvidia123` | `sponsor-nvidia` | View corporate sponsored projects, track milestone deliveries, and monitor student outcomes. |
| **Project Mentor** *(Industry Guide)* | `project_mentor@nvidia.com` | `nvidia123` | `project-mentor` | Industry technical oversight, review sprint tasks, and guide college teams. |

---

## 🎓 3. Campus Coordinator Dashboards

| Campus Spoke | Email | Password | Role / Persona Key | Description & Key Actions |
| :--- | :--- | :--- | :--- | :--- |
| **KLE Technological University** | `coordinator@kle.edu` | `kle123` | `spoke-kle` (Spoke 3) | **Accept/decline proposed projects**, trigger Jira board provisioning, create teams, schedule meetings. |
| **COEP Tech University** | `coordinator@coep.edu` | `coep123` | `spoke-coep` (Spoke 101) | Manage COEP spoke projects, teams, and Jira Kanban tasks. |
| **MMCOEP** | `coordinator@mmcoep.edu` | `mmcoep123` | `spoke-mmcoep` (Spoke 102) | Manage MMCOEP spoke projects and sprint assignments. |
| **RIT** | `coordinator@rit.edu` | `rit123` | `spoke-rit` (Spoke 103) | Manage RIT spoke projects and sprint assignments. |

---

## 👨‍🏫 4. Faculty Mentor Dashboards

| Campus / Department | Email | Password | Role / Persona Key | Description & Key Actions |
| :--- | :--- | :--- | :--- | :--- |
| **KLE Faculty Mentor** *(Prof. Deshpande)* | `mentor@kle.edu` | `mentor123` | `faculty-mentor` | **Create student teams**, assign students to projects, **review & grade phase deliverable submissions**. |
| **COEP Faculty Mentor** *(Dr. Meena Deshmukh)* | `mentor@coep.edu` | `mentor123` | `faculty-mentor` | Review COEP student submissions and track phase milestones. |
| **MMCOEP Faculty Mentor** *(Dr. Kavita Joshi)* | `mentor@mmcoep.edu` | `mentor123` | `faculty-mentor` | Review MMCOEP student submissions. |
| **RIT Faculty Mentor** *(Dr. Suresh Desai)* | `mentor@rit.edu` | `mentor123` | `faculty-mentor` | Review RIT student submissions. |

---

## 💻 5. Student Developer Dashboards

| Campus Spoke | Email | Password | Role / Persona Key | Description & Key Actions |
| :--- | :--- | :--- | :--- | :--- |
| **KLE Student** *(Rahul Sharma)* | `student@kle.edu` *(or `rahul@kle.edu`)* | `student123` | `spoke-kle` | View **Sprint Kanban Board**, drag tasks (live sync with Jira), **upload phase deliverables / files**, use Team Chat. |
| **COEP Student** *(Sneha Joshi)* | `student@coep.edu` *(or `sneha@coep.edu`)* | `student123` | `spoke-coep` | Work on COEP sprint cards and submit deliverables. |
| **MMCOEP Student** *(Nikhil Rane)* | `nikhil@mmcoep.edu` | `student123` | `spoke-mmcoep` | Work on MMCOEP sprint cards and submit deliverables. |
| **RIT Student** *(Tejas Shinde)* | `student@rit.edu` *(or `tejas@rit.edu`)* | `student123` | `spoke-rit` | Work on RIT sprint cards and submit deliverables. |

---

## 📋 6. Project Manager Dashboard

| Dashboard | Email | Password | Role / Persona Key |
| :--- | :--- | :--- | :--- |
| **Project Manager** | `pm@apnileap.com` | `pm123` | `project-manager` |

---

## 💡 Quick Tips for Testing

1. **Direct Login Modal:** Go to `http://localhost:5173`, click **Login** in the navigation bar, and enter any of the above credentials.
2. **Instant Persona Switcher:** Once logged in (or on demo mode), use the **Persona Switcher** dropdown in the top-right corner to toggle between roles without logging out.
3. **Database Reset:** If you ever need to re-seed or verify these users in your database, run:
   ```bash
   cd backend
   node seed.js
   ```
