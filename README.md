# ⚖️ Legal Bridge — Frontend & Presentation Showcase

> **Your Bridge to Justice** — A modern, bilingual (Bangla + English) legal marketplace and multimodal AI consultation platform built for the Bangladesh legal ecosystem.

🌐 **Live Production Frontend:** [https://bd-legal-guide.vercel.app](https://bd-legal-guide.vercel.app)  
🚀 **Live Production Backend:** [https://bd-lega-back.onrender.com](https://bd-lega-back.onrender.com)  
📁 **Sample Test Documents:** [`e:/Law_Project/test_documents/`](../test_documents/)

---

## 🔑 Quick-Start Demo Accounts

You can log in directly using the **One-Click Demo Logins** on the [Login Page](https://bd-legal-guide.vercel.app/login), or manually enter the credentials below (Password for all accounts: `Password123!`):

| Role | Email | Password | Primary Demo Features |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@legalbridge.ai` | `Password123!` | Lawyer credential approvals, user RBAC, system audit log, LLM model settings |
| **Lead Moderator** | `moderator@legalbridge.ai` | `Password123!` | Lawyer review queue, verification document inspection, platform oversight |
| **Verified Lawyer (Gold)** | `pro_lawyer@legalbridge.ai` | `Password123!` | Adv. Nusrat Jahan — 24h schedule board, client inbox, consultation video calls |
| **Free Lawyer (Basic)** | `free_lawyer@legalbridge.ai` | `Password123!` | Adv. Tanvir Hasan — Submit verification documents, manage case board bids |
| **Pending Lawyer** | `adv.pending@bdlegal.ai` | `Password123!` | Adv. Kazi Mahmudul — Profile awaiting review in Admin queue |
| **Pro Client** | `pro_user@legalbridge.ai` | `Password123!` | Karim Chowdhury — Multimodal AI document analysis, flagship Case Board, active booking |
| **Free Client** | `free_user@legalbridge.ai` | `Password123!` | Rahim Ahmed — Free AI chats, lawyer directory, consultation booking flow |

---

## 📁 Pre-Generated Test Documents

The repository includes a ready-to-use testing document suite located in `test_documents/`:

| File Name | Format | Purpose / Feature Tested |
| :--- | :--- | :--- |
| **`01_National_ID_Card.png`** | PNG Image | **Lawyer Verification:** National ID Card (NID) for Slot 1 |
| **`02_Bar_Council_Sanad.png`** | PNG Image | **Lawyer Verification:** Bangladesh Bar Council Enrollment Sanad for Slot 2 |
| **`03_High_Court_Practicing_License.png`** | PNG Image | **Lawyer Verification:** Supreme Court High Court Practicing Permit for Slot 3 |
| **`04_Commercial_Tenancy_Agreement.pdf`** | Digital PDF | **AI Legal Chat:** Commercial lease analysis under Transfer of Property Act 1882 |
| **`05_Employment_and_NDA_Agreement.pdf`** | Digital PDF | **AI Legal Chat:** Non-compete clause validity under Section 27 Contract Act 1872 |
| **`06_Land_Boundary_Dispute_Legal_Notice.pdf`** | Digital PDF | **Case Board / AI Chat:** Civil trespass & boundary dispute notice |
| **`07_Divorce_Notice_Muslim_Family_Laws.txt`** | Plain Text | **AI Legal Chat:** Talaq notice procedure under Section 7 MFLO 1961 |
| **`08_Partnership_Deed.md`** | Markdown | **AI Legal Chat:** Partnership profit ratio & dissolution under Partnership Act 1932 |

---

## 🧪 Comprehensive Feature Verification Guide

### 1. Multimodal AI Legal Chat with Document Analysis
* **Account:** `pro_user@legalbridge.ai`
* **Route:** `/client/chat`
* **Action:**
  1. Click the paperclip icon (📎) next to the chat bar.
  2. Upload `04_Commercial_Tenancy_Agreement.pdf` (or `01_National_ID_Card.png`).
  3. Ask: *"What is the monthly rent and security advance in this agreement, and what notice is required to terminate?"*
  4. The AI analyzes the document with Gemini multimodal vision, citing exact values (BDT 65,000 rent, BDT 3,00,000 advance) and statutory grounds.

### 2. Flagship Case Board (Client Posts Case ➔ Lawyer Bids)
* **Client Posting:** Log in as `pro_user@legalbridge.ai` ➔ Go to `/client/cases` ➔ Click **"+ Post New Case"** ➔ Fill in title, budget, and description.
* **Lawyer Bidding:** Log in as `pro_lawyer@legalbridge.ai` ➔ Go to `/lawyer?tab=case-board` ➔ Submit a proposal with proposed fee.
* **Awarding:** Switch back to client ➔ Review proposals ➔ Click **"Accept Proposal"**.

### 3. Lawyer Availability Setup (24-Hour Calendar Grid)
* **Account:** `pro_lawyer@legalbridge.ai`
* **Route:** `/lawyer/availability`
* **Action:**
  * 48 thirty-minute intervals per day from 00:00 to 23:30.
  * Click any cell (daytime or night emergency slot) ➔ Click **"Create Slot"** ➔ Real-time database update.
  * Delete any unbooked slot with one click.

### 4. Lawyer Credential Verification Workflow
* **Lawyer Upload:** Log in as `free_lawyer@legalbridge.ai` ➔ Go to `/lawyer?tab=profile` ➔ Upload `01_National_ID_Card.png`, `02_Bar_Council_Sanad.png`, and `03_High_Court_Practicing_License.png` ➔ Click **"Submit for Verification"**.
* **Admin Review:** Log in as `admin@legalbridge.ai` ➔ Go to `/admin/lawyers` ➔ Click **"Review Documents"** ➔ Inspect uploaded certificates in the document viewer ➔ Add review note and click **"Approve Advocate & Grant Gold Badge"**.

### 5. Consultation Booking & Manual Payment Submission
* **Account:** `free_user@legalbridge.ai`
* **Route:** `/client/lawyers`
* **Action:**
  1. Select an advocate (e.g. Adv. Nusrat Jahan) ➔ Click **"Book Consultation"**.
  2. Choose a date and time slot ➔ Provide brief case summary.
  3. Submit bKash or Nagad payment proof with a Transaction ID (e.g. `TRX98421092`).
  4. Lawyer receives the confirmation in their inbox.

### 6. Video Consultation & Live Direct Messaging
* **Account:** `pro_user@legalbridge.ai`
* **Route:** `/client` (Dashboard)
* **Action:**
  * Confirmed consultations display the **"Join Meeting"** video link.
  * Click **"Direct Message"** to access the real-time lawyer-client consultation chat thread.

---

## 🛠️ Frontend Architecture & Tech Stack

* **Framework:** React 19 + Vite (Rolldown engine)
* **Styling:** Tailwind CSS v4 + Dark Zinc Design System (`bg-zinc-950`, `border-zinc-800`)
* **State Management:** Zustand (Auth store with auto-refresh and localStorage persistence)
* **Routing:** React Router DOM v7 with role-based route guards (`RequireAuth`)
* **Icons:** Lucide React
* **Deployment:** Vercel (CI/CD connected to `main` branch)

---

## 🚀 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (.env)
VITE_API_URL=http://localhost:8000/api
VITE_DEMO_MODE=false

# 3. Start development server
npm run dev
```

Visit `http://localhost:5173` to test the application locally.
