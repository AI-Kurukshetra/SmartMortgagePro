# Product Requirements Document (PRD)
## SmartMortgage Pro — AI-Powered Mortgage Origination & Workflow Platform

**Version:** 1.0  
**Date:** March 2026  
**Domain:** Fintech — Mortgage Technology  
**Reference Blueprint:** Maxwell Financial Labs (hellomaxwell.com)  
**Status:** Draft

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [Target Users & Personas](#4-target-users--personas)
5. [MVP Scope](#5-mvp-scope)
6. [Feature Requirements](#6-feature-requirements)
   - 6.1 [Core Features (Phase 1 — MVP)](#61-core-features-phase-1--mvp)
   - 6.2 [Important Features (Phase 2)](#62-important-features-phase-2)
   - 6.3 [Advanced / AI-Powered Features (Phase 3)](#63-advanced--ai-powered-features-phase-3)
   - 6.4 [Innovative / Future Features (Phase 4)](#64-innovative--future-features-phase-4)
7. [Data Model Overview](#7-data-model-overview)
8. [API Architecture](#8-api-architecture)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Compliance & Regulatory Requirements](#10-compliance--regulatory-requirements)
11. [Integrations](#11-integrations)
12. [Monetization Strategy](#12-monetization-strategy)
13. [Competitive Landscape](#13-competitive-landscape)
14. [Go-to-Market Strategy](#14-go-to-market-strategy)
15. [Open Questions & Risks](#15-open-questions--risks)

---

## 1. Executive Summary

SmartMortgage Pro is an AI-powered mortgage origination and workflow platform that digitizes and streamlines the complete mortgage lifecycle — from borrower application through closing. It replaces the traditionally paper-heavy, manual mortgage process with automated workflows, intelligent document management, real-time collaboration, and AI-driven underwriting.

The platform serves three primary stakeholders: **borrowers** applying for mortgages, **loan officers** managing pipelines, and **processors/underwriters** handling back-office operations. The initial target market is community banks, credit unions, and independent mortgage brokers who lack access to modern origination tooling.

---

## 2. Problem Statement

### Current Pain Points

| Stakeholder | Pain Point |
|---|---|
| Borrowers | Manual document collection, opaque status updates, slow closure timelines (avg. 45–60 days) |
| Loan Officers | Juggling spreadsheets, emails, and disparate tools; no unified pipeline view |
| Processors | Manual data re-entry, document chasing, non-standardized workflows |
| Lenders | High cost per loan originated, compliance risk from manual checks, low pull-through rates |

### Root Cause

The mortgage industry remains largely paper-driven and fragmented across incompatible systems. Existing platforms (Ellie Mae, Calyx, BytePro) are complex, expensive, and primarily designed for large lenders — leaving mid-market institutions underserved.

---

## 3. Goals & Success Metrics

### Business Goals

- Reduce average loan processing time from ~45 days to under 20 days
- Achieve 80%+ application completion rate (vs. industry avg. ~60%)
- Maintain 99.9% system uptime for regulated operations
- Reach positive NPS (>40) within 6 months of launch

### Key Metrics to Track

| Metric | Target (Year 1) |
|---|---|
| Loan processing time (days to close) | ≤ 20 days |
| Application completion rate | ≥ 80% |
| Document collection efficiency | ≥ 90% auto-categorization accuracy |
| Compliance audit pass rate | 100% |
| Cost per loan originated | 30% reduction vs. baseline |
| Pull-through rate (applications → closings) | ≥ 70% |
| System uptime | ≥ 99.9% |
| Time to value for new customers | ≤ 30 days onboarding |
| Monthly churn rate | ≤ 2% |
| NPS | ≥ 40 |

---

## 4. Target Users & Personas

### Persona 1 — The Borrower (Alex, 34)
- First-time homebuyer, tech-comfortable
- Needs: Guided application, clear document checklist, real-time status updates
- Frustrations: Uploading the same document multiple times, no visibility into "what's next"

### Persona 2 — The Loan Officer (Maria, 42)
- Manages 15–25 active loans simultaneously
- Needs: Unified pipeline dashboard, automated task reminders, quick borrower communication
- Frustrations: Manual status updates, missed deadlines, tracking loans across email + spreadsheet

### Persona 3 — The Processor/Underwriter (James, 38)
- Reviews documents and makes credit decisions
- Needs: Automated document validation, pre-filled data extraction, compliance flag alerts
- Frustrations: Re-keying data from documents, manual compliance cross-checks

### Persona 4 — The Lender Admin (Sarah, 50)
- Branch manager or operations head
- Needs: Team productivity reports, audit trails, compliance dashboards
- Frustrations: Lack of visibility into pipeline health, manual report generation

---

## 5. MVP Scope

The MVP focuses on the highest-impact, time-consuming manual steps in mortgage origination. Scope is limited to web-only (no mobile native app in Phase 1).

**MVP Includes:**

- Digital loan application portal (borrower-facing)
- Secure document upload and management
- Loan officer pipeline dashboard
- Real-time borrower status portal
- Credit report integration (tri-merge)
- Basic automated underwriting rules engine
- Task management with stage-based workflow automation
- Centralized messaging (borrower ↔ loan officer ↔ processor)
- Essential federal compliance checks (TRID, RESPA, HMDA)
- Electronic signatures for disclosures

**MVP Excludes (deferred to Phase 2+):**

- Native mobile apps
- AI/ML-based risk scoring
- Blockchain document verification
- Investor/secondary market integration
- Voice-activated application process
- Advanced analytics dashboard

---

## 6. Feature Requirements

### 6.1 Core Features (Phase 1 — MVP)

#### F-01 · Digital Loan Application Portal
**Priority:** Must-Have | **Complexity:** Medium

- Guided, multi-step web form covering borrower info, employment, income, property details, and loan preferences
- Save-and-resume capability with session persistence
- Real-time field validation with inline error messaging
- Pre-population from linked accounts (bank, payroll) where authorized
- Accessibility compliant (WCAG 2.1 AA)
- Support for joint applications (co-borrower flow)

**Acceptance Criteria:**
- Borrower can complete and submit an application in under 25 minutes
- Form completion rate ≥ 80% on first attempt
- All required URLA (Uniform Residential Loan Application) fields captured

---

#### F-02 · Document Collection & Management
**Priority:** Must-Have | **Complexity:** Medium

- Secure, encrypted document upload portal (AES-256 at rest, TLS 1.3 in transit)
- Dynamic document checklist generated based on loan type and borrower profile
- Automated document categorization (pay stubs, W-2s, bank statements, ID docs)
- Version control — track document revisions and re-uploads
- Automated expiry alerts for time-sensitive documents (e.g., bank statements > 60 days)
- Bulk download capability for loan officers and processors

**Acceptance Criteria:**
- Documents categorized correctly ≥ 90% of the time
- Upload supports PDF, JPG, PNG up to 50MB per file
- Audit log maintained for all document actions

---

#### F-03 · Automated Document Verification
**Priority:** Must-Have | **Complexity:** High

- OCR extraction of key data fields from uploaded documents
- Validation of extracted data against application-stated values (income, employer name, account numbers)
- Completeness checks — flag missing pages, unreadable scans, expired documents
- Fraud signal detection (metadata inconsistencies, altered fonts, suspicious patterns)
- Human review queue for low-confidence extractions

**Acceptance Criteria:**
- OCR accuracy ≥ 95% on standard document types
- Verification results returned within 60 seconds of upload
- All failed verifications routed to human review queue

---

#### F-04 · Loan Pipeline Management Dashboard
**Priority:** Must-Have | **Complexity:** Medium

- Kanban-style pipeline view with configurable loan stages (e.g., Application → Processing → Underwriting → Approval → Closing)
- Filtering and sorting by loan officer, loan type, stage, close date, priority
- At-a-glance loan health indicators (days in stage, outstanding tasks, blockers)
- Bulk action support (assign, move stage, flag)
- Role-based view (loan officer sees own loans; manager sees team)

**Acceptance Criteria:**
- Dashboard loads < 2 seconds for up to 500 active loans
- Stage transitions logged with timestamp and user
- Supports custom pipeline stage configuration per lender

---

#### F-05 · Credit Report Integration
**Priority:** Must-Have | **Complexity:** Medium

- Tri-merge credit report pull from Experian, Equifax, and TransUnion via integrated reseller
- Automated parsing of credit scores, trade lines, derogatory marks, inquiries
- Display within loan file — no raw PII exposed in logs
- Soft pull option for pre-qualification; hard pull gated to borrower consent
- Credit score change alerts if report is re-pulled

**Acceptance Criteria:**
- Credit report retrieved within 30 seconds of request
- Consent captured and stored before any hard pull
- Report data mapped to underwriting decisioning fields

---

#### F-06 · Income Verification System
**Priority:** Must-Have | **Complexity:** High

- Integration with payroll providers (Equifax Workforce Solutions / The Work Number, Argyle, Pinwheel)
- Bank statement analysis for self-employed borrowers (12–24 months)
- Automated calculation of qualifying income (base, overtime, bonus, commission, rental)
- Side-by-side comparison of stated vs. verified income
- Support for gig/freelance income via 1099 and bank data

**Acceptance Criteria:**
- Automated verification covers ≥ 70% of borrower employment types
- Income calculation methodology documented and auditable
- Manual override available with documented justification

---

#### F-07 · Automated Underwriting Engine
**Priority:** Must-Have | **Complexity:** High

- Rule-based decisioning against configurable lending criteria (LTV, DTI, credit score, loan-to-value)
- AUS (Automated Underwriting System) integration — Fannie Mae Desktop Underwriter (DU) and Freddie Mac Loan Product Advisor (LPA)
- Condition generation — auto-create prior-to-approval and prior-to-close conditions
- Findings summary with human-readable explanations for each decision point
- Override workflow with mandatory documentation for exceptions

**Acceptance Criteria:**
- AUS submission and response within 45 seconds
- All generated conditions traceable to specific rule or AUS finding
- Exception overrides require manager approval and are audit-logged

---

#### F-08 · Real-Time Application Status Tracking
**Priority:** Must-Have | **Complexity:** Low

- Borrower-facing status portal showing current loan stage
- Visual progress indicator (milestone tracker)
- Outstanding action items clearly surfaced (e.g., "Upload 2023 W-2")
- Push/email notifications triggered on stage changes and pending actions
- Estimated timeline display (target close date)

**Acceptance Criteria:**
- Status updates reflected in borrower portal within 5 minutes of internal change
- Notifications delivered within 2 minutes of trigger event
- Borrower can view full history of actions taken on their loan

---

#### F-09 · Communication Hub
**Priority:** Must-Have | **Complexity:** Medium

- In-platform messaging between borrowers, loan officers, processors, and underwriters
- Thread-based conversations linked to specific loan file
- Message templates for common communications (document requests, status updates, approval notices)
- Email-to-platform bridging (reply-by-email syncs to platform)
- Audit trail of all communications per loan file

**Acceptance Criteria:**
- Messages delivered in < 5 seconds within the platform
- All messages stored and retrievable for 7 years (regulatory requirement)
- Loan officer can send document request directly from document checklist

---

#### F-10 · Task Management & Workflows
**Priority:** Must-Have | **Complexity:** Medium

- Automated task assignment based on loan stage transitions
- Configurable workflow templates per loan type (purchase, refinance, HELOC)
- Task dependencies — task B unlocks only when task A is complete
- SLA tracking with escalation alerts (e.g., task overdue > 24 hours)
- Manual task creation with assignee, due date, and priority

**Acceptance Criteria:**
- Workflow engine executes stage transitions within 10 seconds
- 100% of stage transitions generate the correct task set per configured template
- Overdue task escalations delivered to manager within defined SLA window

---

#### F-11 · Compliance Management
**Priority:** Must-Have | **Complexity:** High

- Built-in checks for federal regulations: TRID (Loan Estimate/Closing Disclosure timelines), RESPA, HMDA, ECOA, FCRA
- State-specific compliance rules engine (configurable per lender license)
- Automated generation of required disclosures with correct fee tolerances
- Compliance calendar — tracks regulatory deadlines and sends alerts
- Audit log capturing all compliance-relevant actions with timestamps and user IDs

**Acceptance Criteria:**
- TRID timing violations flagged before they occur (proactive, not reactive)
- 100% of required disclosures generated correctly per loan type and state
- Audit logs immutable and exportable for regulatory examination

---

#### F-12 · Electronic Signatures
**Priority:** Must-Have | **Complexity:** Low

- ESIGN and UETA-compliant e-signature workflow
- Integration with DocuSign or HelloSign for signing ceremonies
- Multi-party signing support (borrower, co-borrower, loan officer)
- Automated routing — documents sent to correct signatories in correct order
- Completion status tracking and reminder automation

**Acceptance Criteria:**
- Signed documents legally valid under ESIGN Act
- Signing completion rate tracked per document type
- Reminder sent automatically after 24 hours of inactivity

---

#### F-13 · Loan Pricing Engine
**Priority:** Must-Have | **Complexity:** Medium

- Real-time rate calculation based on credit score, LTV, loan type, property type, and lock period
- Rate sheet management — lender uploads and manages pricing matrices
- Pricing comparison across loan products (30-year fixed, 15-year, ARM, FHA, VA)
- Lock desk integration — rate lock request and confirmation workflow
- Fee itemization compliant with TRID disclosure requirements

**Acceptance Criteria:**
- Rate returned within 3 seconds of input change
- Pricing audit trail captures every rate quoted with timestamp and inputs
- Rate lock requests confirmed within 1 business hour

---

#### F-14 · Third-Party Service Ordering
**Priority:** Must-Have | **Complexity:** Medium

- Automated ordering of appraisals (AMC integration), title searches, and flood certifications
- Vendor panel management with preferred vendor routing
- Order status tracking with ETA updates surfaced in loan file
- Invoice reconciliation and fee tracking
- Condition clearing upon service completion (e.g., appraisal received → condition cleared)

**Acceptance Criteria:**
- Order placed within platform without leaving loan file
- Status updates synced from vendor within 4 hours
- All vendor fees logged against the loan estimate

---

#### F-19 · Automated Disclosure Generation
**Priority:** Must-Have | **Complexity:** High

- Dynamic generation of Loan Estimate (LE) and Closing Disclosure (CD) per TRID requirements
- Fee tolerance tracking — flag if fees exceed allowed variance from LE to CD
- Re-disclosure workflow triggered automatically on qualifying change of circumstance
- State-specific addendum generation
- Delivery confirmation tracking (3-day acknowledgement rules)

**Acceptance Criteria:**
- LE generated within 3 business days of application (system enforces deadline)
- CD delivered no later than 3 business days before consummation
- Zero tolerance, 10% tolerance, and unlimited tolerance fee categories correctly applied

---

### 6.2 Important Features (Phase 2)

| # | Feature | Description |
|---|---|---|
| F-15 | Loan Officer CRM | Lead tracking, contact history, referral partner management, follow-up automation |
| F-16 | Mobile Application | Native iOS/Android apps for borrowers (document upload, status) and loan officers (pipeline, messaging) |
| F-17 | Analytics & Reporting Dashboard | Team productivity metrics, pipeline velocity, processing time breakdowns, pull-through funnel |
| F-18 | Multi-channel Lead Capture | Website widget, referral partner portal, Realtor integration, lead routing rules |
| F-20 | Loan Committee Management | Structured review workflow for complex/exception loans; voting, minutes, approval chain |
| F-21 | Quality Control Module | Post-closing QC checklist, HMDA data audit, file review assignment, defect tracking |
| F-22 | Integration Hub | Pre-built connectors to popular LOS (Encompass, Calyx), CRM (Salesforce), and core banking |

---

### 6.3 Advanced / AI-Powered Features (Phase 3)

| # | Feature | Description | Complexity |
|---|---|---|---|
| A-01 | AI-Powered Risk Assessment | ML models incorporating alternative data (rent payment history, utility, cash flow patterns) beyond traditional credit | High |
| A-02 | Predictive Loan Performance | Predict default probability; recommend pricing adjustments and product alternatives | High |
| A-03 | Intelligent Document Processing | Advanced NLP for complex financial documents — P&L statements, tax returns, trust documents | High |
| A-04 | Dynamic Loan Recommendation Engine | AI-driven product matching based on borrower profile, goals, and real-time market conditions | High |
| A-07 | Real-time Market Data Integration | Dynamic pricing from live market feeds, competitor rate monitoring, economic indicator integration | Medium |
| A-08 | Advanced Fraud Detection | ML pattern recognition across application data, document metadata, behavioral biometrics | High |
| A-09 | Automated Closing Coordination | AI-driven scheduling of closing with all parties; title company, settlement agent, borrower | High |
| A-11 | Regulatory Change Management | Automated rule updates when federal/state regulations change; impact analysis and notifications | Medium |
| A-12 | Investor/Secondary Market Integration | Direct loan delivery to Fannie Mae, Freddie Mac, and private investors; MISMO-compliant data packages | High |
| A-13 | Advanced Portfolio Analytics | Loan performance dashboards, concentration risk analysis, prepayment modeling | High |

---

### 6.4 Innovative / Future Features (Phase 4)

- AR/VR property tours integrated with mortgage pre-approval for remote home buying
- IoT smart home data integration for property value and maintenance history assessment
- Cryptocurrency and DeFi integration for alternative down payment sources
- AI-powered rate negotiation assistance
- Gamified financial education modules to help borrowers improve qualification
- Gig economy income verification via platform APIs (Uber, Upwork, Stripe)
- Predictive home value modeling using satellite imagery
- Automated carbon footprint assessment for green mortgage programs
- Decentralized identity verification using zero-knowledge proofs

---

## 7. Data Model Overview

### Core Entities

```
Users
├── Loan_Officers
├── Processors
└── Underwriters

Borrowers
└── Employment_History

Loans
├── Applications
├── Properties
│   └── Appraisals
├── Documents
│   └── Income_Verification
│   └── Bank_Statements
├── Credit_Reports
├── Disclosures
├── Compliance_Checks
├── Quality_Control
└── Audit_Logs

Workflows
├── Pipeline_Stages
└── Tasks

Communications
Pricing_Rules
Rate_Sheets
Third_Party_Services
```

### Key Entity Relationships

- One **Borrower** → Many **Loans** (multiple applications over time)
- One **Loan** → One **Application** → Many **Documents**, **Tasks**, **Compliance_Checks**
- One **Loan** → One **Credit_Report** per pull (versioned)
- One **Loan_Officer** → Many **Loans** (pipeline)
- One **Workflow** → Many **Pipeline_Stages** → Many **Tasks** per stage
- All state-changing actions → **Audit_Logs** (immutable)

---

## 8. API Architecture

### Endpoint Groups

| Group | Key Endpoints | Notes |
|---|---|---|
| `/auth` | Login, refresh, MFA, OAuth2 | JWT-based, OAuth2 for third-party |
| `/users` | CRUD, roles, permissions | RBAC enforced |
| `/borrowers` | Profile, history, co-borrower | PII-masked in logs |
| `/loans` | Create, update, stage transitions | Core entity |
| `/applications` | Submit, save draft, resume | URLA-compliant fields |
| `/documents` | Upload, verify, categorize, download | Signed URLs, virus scan |
| `/credit` | Pull, re-pull, parse | Consent-gated hard pull |
| `/income-verification` | Request, status, results | Payroll provider webhooks |
| `/underwriting` | Submit AUS, findings, conditions | DU/LPA integration |
| `/pricing` | Rate quote, lock request, fee calc | Real-time, cached ≤ 60s |
| `/workflows` | Templates, stage transitions, tasks | Event-driven |
| `/communications` | Messages, threads, templates | WebSocket for real-time |
| `/compliance` | Checks, calendar, disclosures | Rule engine API |
| `/reporting` | Pipeline metrics, team stats, custom | Read-only, async |
| `/integrations` | Webhooks, connector config | OAuth2 per integration |
| `/third-party-services` | Order, status, invoice | AMC, title, flood |
| `/notifications` | Preferences, delivery, history | Email, SMS, push |
| `/analytics` | KPIs, funnels, cohorts | Aggregated, no PII |
| `/admin` | Tenant config, user management, audit | Super-admin scoped |

### API Design Principles

- RESTful, JSON-first; MISMO XML support for secondary market integrations
- Versioned via URL path (`/v1/`, `/v2/`)
- Rate limiting: 1000 req/min per tenant, 100 req/min per user
- All endpoints require authentication except `/auth/login` and `/auth/refresh`
- Webhook delivery with HMAC signature verification and retry with exponential backoff

---

## 9. Non-Functional Requirements

### Performance
- API response time P95 < 500ms for read operations
- Loan pipeline dashboard load time < 2 seconds for 500 active loans
- Document upload processing (OCR + categorization) < 60 seconds
- AUS submission and response < 45 seconds
- System supports 10,000 concurrent users at MVP; 100,000 at scale

### Security
- SOC 2 Type II compliance required before GA launch
- Encryption: AES-256 at rest, TLS 1.3 in transit
- PII access logging with automated anomaly alerts
- Multi-factor authentication (MFA) required for all staff roles
- Role-Based Access Control (RBAC) with least-privilege enforcement
- Penetration testing quarterly
- Data residency: US-only for regulated mortgage data

### Reliability
- SLA: 99.9% uptime (< 8.7 hours downtime/year)
- RTO (Recovery Time Objective): < 1 hour
- RPO (Recovery Point Objective): < 15 minutes
- Multi-region active-passive failover
- Daily automated backups retained for 7 years

### Scalability
- Stateless API tier horizontally scalable
- Document storage on object store (S3-compatible), not relational DB
- Async processing via message queue (Kafka/SQS) for OCR, AUS, notifications
- Database read replicas for reporting queries

### Accessibility
- Borrower portal: WCAG 2.1 AA compliant
- Screen reader support for all borrower-facing forms
- Keyboard navigability throughout

---

## 10. Compliance & Regulatory Requirements

| Regulation | Requirement | Implementation |
|---|---|---|
| TRID (TILA-RESPA Integrated Disclosure) | Loan Estimate within 3 business days; Closing Disclosure 3 days before closing | Automated disclosure generation with deadline enforcement |
| RESPA | Anti-kickback provisions; affiliated business disclosure | Vendor panel documentation; disclosure templates |
| HMDA | Reportable loan data collection and annual LAR submission | Automated HMDA data capture; LAR export |
| ECOA | No discrimination in credit decisions; adverse action notices | Decision audit trail; automated adverse action letter generation |
| FCRA | Permissible purpose for credit pulls; dispute handling | Consent capture; dispute workflow |
| GLBA | Customer financial data privacy and safeguards | Encryption, access controls, privacy notices |
| State Laws | Varies by state — licensing, fee caps, cooling-off periods | Configurable state rule engine |
| ADA | Digital accessibility for borrower portal | WCAG 2.1 AA compliance |

All compliance rules must be version-controlled — regulatory changes trigger a dated rule update with an impact analysis report for affected loans in-flight.

---

## 11. Integrations

### Phase 1 (MVP) Integrations

| Category | Provider | Method |
|---|---|---|
| Credit Bureaus | Experian, Equifax, TransUnion (via reseller: Factual Data, CBC) | API |
| AUS | Fannie Mae Desktop Underwriter, Freddie Mac LPA | API |
| E-Signature | DocuSign | API |
| Income/Employment | The Work Number (Equifax Workforce Solutions) | API |
| Appraisal Management | Mercury Network or Solidifi | API |
| Title/Settlement | Qualia, ResWare | API |
| Flood Certification | ServiceLink, CoreLogic | API |

### Phase 2+ Integrations

| Category | Provider |
|---|---|
| LOS | ICE Encompass, Calyx Point, BytePro |
| CRM | Salesforce, HubSpot |
| Payroll Verification | Argyle, Pinwheel, Plaid Payroll |
| Bank Statements | Plaid, Finicity (Mastercard) |
| MLS / Property Data | ATTOM, CoreLogic, Zillow API |
| Secondary Market | Fannie Mae MORNET, Freddie Mac Selling System |

---

## 12. Monetization Strategy

| Model | Description | Target Segment |
|---|---|---|
| Per-loan transaction fee | Fee charged per funded loan (e.g., $50–$150/loan) | Volume lenders |
| SaaS subscription | Monthly/annual tiers based on user seats and loan volume | SMB lenders, brokers |
| Volume discounts | Tiered pricing for high-volume origination | Regional banks, credit unions |
| Premium add-ons | AI risk scoring, advanced analytics, fraud detection as premium modules | Enterprise |
| Integration marketplace | Revenue share on third-party connector fees | All segments |
| Professional services | Implementation, data migration, custom workflows | Enterprise, white-label |
| White-label licensing | Full platform re-branded for large lenders or technology partners | Banks, large IMBs |
| Data analytics as a service | Aggregate market insights (anonymized) for investors and industry | Enterprise |
| Training & certification | LO certification programs, compliance training courses | All segments |
| Referral commissions | Referral revenue from appraisal, title, and insurance partners | All segments |

**Recommended Pricing Tiers (Phase 1):**

| Tier | Monthly Price | Loan Volume | Users |
|---|---|---|---|
| Starter | $299/mo | Up to 10 loans/mo | Up to 3 LOs |
| Growth | $899/mo | Up to 50 loans/mo | Up to 10 LOs |
| Professional | $2,499/mo | Up to 150 loans/mo | Up to 30 LOs |
| Enterprise | Custom | Unlimited | Unlimited |

---

## 13. Competitive Landscape

| Competitor | Strength | Weakness | Our Differentiation |
|---|---|---|---|
| ICE Mortgage Technology (Encompass) | Market leader, deep LOS | Complex, expensive, long implementation | Faster implementation, modern UX, AI-native |
| Blend | Strong borrower UX, bank partnerships | Less configurable for independent brokers | Broker/CU focus, competitive pricing |
| SimpleNexus (nCino) | Mobile-first, real estate agent integration | Limited AI, mid-market fit | AI underwriting, superior analytics |
| Calyx Software | Affordable, familiar for brokers | Legacy tech, limited automation | Modern stack, full workflow automation |
| Maxwell Financial Labs | Strong workflow automation, great UX | Smaller integration ecosystem | Broader integrations, AI-powered features |
| BytePro | Compliance depth | Poor UX, minimal automation | AI-powered compliance, modern UI |

**Key Differentiators:**
1. AI-native from day one (not AI bolted on)
2. Implementation in < 30 days (vs. 3–6 months for enterprise LOS)
3. Transparent, predictable pricing for mid-market lenders
4. Compliance-as-a-feature, not compliance-as-a-checkbox

---

## 14. Go-to-Market Strategy

### Target Segments (Priority Order)

1. **Independent Mortgage Brokers** — 10,000+ in the US, underserved by legacy tools, price-sensitive, fast adopters
2. **Credit Unions** — Compliance-focused, member-centric, need modern digital experience
3. **Community Banks** — Local relationships, growing mortgage business, need to compete with national lenders
4. **Regional IMBs (Independent Mortgage Bankers)** — Volume-focused, need productivity and cost reduction

### Launch Approach

- **Pilot Program:** 5–10 design partner lenders recruited 6 months before GA; co-develop workflows, provide free/discounted access in exchange for feedback and case studies
- **Channel Partnerships:** Mortgage industry consultants, compliance vendors, and accounting firms serving community banks
- **Content Marketing:** ROI-focused content — "How to close loans 50% faster," regulatory compliance guides, digital transformation playbooks
- **Industry Events:** MBA Annual Convention, ACUMA (credit unions), NAMB National (brokers)
- **Referral Network:** Realtor and real estate attorney referral program with LO tracking tools

### KPIs for GTM

- 50 paying customers in Month 6
- $500K ARR by end of Year 1
- CAC payback period < 12 months
- Net Revenue Retention > 110% by Year 2

---

## 15. Open Questions & Risks

### Open Questions

1. **AUS Integration Depth:** Will we build a direct DU/LPA integration from day one, or use a middleware aggregator (Polly, Optimal Blue) in MVP?
2. **State Rule Engine Vendor vs. Build:** Build state compliance rules in-house or license a regulatory data provider (Wolters Kluwer, ComplianceSystems)?
3. **Document Storage:** Self-managed S3 vs. a managed document vault with built-in compliance features?
4. **White-Label Timing:** Should white-label be available at launch or deferred to post-PMF?
5. **Mobile Priority:** Is iOS-first, Android-first, or React Native cross-platform the right call for Phase 2 mobile?

### Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Regulatory non-compliance (TRID, RESPA) | Medium | Critical | Engage mortgage compliance counsel; third-party compliance audit pre-launch |
| Integration delays (AUS, credit bureau) | High | High | Begin API negotiations and testing 6 months before launch |
| Data breach / PII exposure | Low | Critical | SOC 2 audit, penetration testing, cyber insurance |
| Low borrower adoption (digital literacy gap) | Medium | Medium | In-app guided tours, LO co-piloting feature, phone support fallback |
| Incumbent LOS competition on pricing | High | Medium | Focus on speed-to-value and AI differentiation, not price war |
| Regulatory change mid-development | Medium | Medium | Modular compliance rule engine; dedicated regulatory monitoring |
| Key talent attrition (mortgage domain expertise) | Medium | High | Document domain knowledge in compliance engine, cross-train team |

---

*This PRD is a living document. All feature priorities and timelines are subject to revision based on design partner feedback, regulatory changes, and market conditions.*

*Next steps: Stakeholder review → Technical architecture review → Design sprint for MVP borrower portal and loan officer dashboard → Engineering estimation.*