insert into public.roles (key, label, is_staff)
values
  ('borrower', 'Borrower', false),
  ('loan_officer', 'Loan Officer', true),
  ('processor', 'Processor', true),
  ('underwriter', 'Underwriter', true),
  ('admin', 'Admin', true)
on conflict (key) do update
set
  label = excluded.label,
  is_staff = excluded.is_staff;

with selected_profiles as (
  select id, role
  from public.profiles
),
borrower_profile as (
  select id
  from selected_profiles
  where role = 'borrower'
  order by id
  limit 1
),
officer_profile as (
  select id
  from selected_profiles
  where role = 'loan_officer'
  order by id
  limit 1
),
staff_profile as (
  select id
  from selected_profiles
  where role in ('loan_officer', 'processor', 'underwriter', 'admin')
  order by id
  limit 1
)
insert into public.loan_applications (
  borrower_id,
  loan_officer_id,
  borrower_name,
  property_address,
  loan_amount,
  stage,
  priority,
  expected_close_date
)
values
  (
    (select id from borrower_profile),
    coalesce((select id from officer_profile), (select id from staff_profile)),
    'Avery Johnson',
    '1204 W Fulton St, Chicago, IL 60607',
    525000,
    'application',
    'medium',
    current_date + interval '45 days'
  ),
  (
    (select id from borrower_profile),
    coalesce((select id from officer_profile), (select id from staff_profile)),
    'Sofia Carter',
    '87 Pine Brook Rd, Austin, TX 78704',
    780000,
    'underwriting',
    'high',
    current_date + interval '21 days'
  ),
  (
    (select id from borrower_profile),
    coalesce((select id from officer_profile), (select id from staff_profile)),
    'Noah Patel',
    '14 Ridgeview Dr, Raleigh, NC 27603',
    365000,
    'processing',
    'low',
    current_date + interval '60 days'
  )
on conflict do nothing;

with ranked_loans as (
  select
    id,
    loan_amount,
    created_at,
    expected_close_date,
    row_number() over (order by created_at asc) as row_num
  from public.loan_applications
),
seed_disclosures as (
  insert into public.disclosures (
    loan_id,
    type,
    status,
    version,
    issued_date,
    due_date,
    sent_to_borrower_at,
    acknowledged_by_borrower_at,
    acknowledgement_method,
    fees_snapshot,
    loan_terms_snapshot,
    state,
    file_path
  )
  select
    loan.id,
    item.type::public.disclosure_type,
    item.status::public.disclosure_status,
    item.version,
    item.issued_date,
    item.due_date,
    item.sent_to_borrower_at,
    item.acknowledged_by_borrower_at,
    item.acknowledgement_method,
    item.fees_snapshot::jsonb,
    item.loan_terms_snapshot::jsonb,
    item.state,
    item.file_path
  from ranked_loans loan
  cross join lateral (
    values
      (
        'loan_estimate',
        'acknowledged',
        1,
        loan.created_at + interval '1 day',
        loan.created_at + interval '3 day',
        loan.created_at + interval '1 day 2 hour',
        loan.created_at + interval '1 day 6 hour',
        'esigned',
        jsonb_build_object('fees', 5, 'kind', 'initial'),
        jsonb_build_object('loan_amount', loan.loan_amount, 'term_years', 30, 'product', 'Fixed'),
        'IL',
        concat('disclosures/', loan.id, '/loan-estimate-v1.pdf')
      ),
      (
        'closing_disclosure',
        case when loan.row_num = 2 then 'generated' else 'sent' end,
        1,
        now() - interval '2 day',
        coalesce(loan.expected_close_date::timestamp - interval '3 day', now() + interval '5 day'),
        case when loan.row_num = 2 then null else now() - interval '36 hour' end,
        null,
        null,
        jsonb_build_object('fees', 5, 'kind', 'closing'),
        jsonb_build_object('loan_amount', loan.loan_amount, 'term_years', 30, 'product', 'Fixed'),
        'IL',
        concat('disclosures/', loan.id, '/closing-disclosure-v1.pdf')
      )
  ) as item(
    type,
    status,
    version,
    issued_date,
    due_date,
    sent_to_borrower_at,
    acknowledged_by_borrower_at,
    acknowledgement_method,
    fees_snapshot,
    loan_terms_snapshot,
    state,
    file_path
  )
  where not exists (
    select 1
    from public.disclosures existing
    where existing.loan_id = loan.id
      and existing.type = item.type::public.disclosure_type
      and existing.version = item.version
  )
  returning id, type
)
insert into public.disclosure_fees (
  disclosure_id,
  fee_name,
  fee_category,
  tolerance_type,
  le_amount,
  cd_amount
)
select
  disclosure.id,
  fee.fee_name,
  fee.fee_category,
  fee.tolerance_type::public.fee_tolerance,
  fee.le_amount,
  case
    when disclosure.type = 'closing_disclosure'::public.disclosure_type then fee.cd_amount
    else fee.le_amount
  end
from seed_disclosures disclosure
cross join lateral (
  values
    ('Origination Fee', 'Origination Charges', 'zero', 1250.00, 1250.00),
    ('Underwriting Fee', 'Underwriting Fee', 'zero', 895.00, 925.00),
    ('Recording Fees', 'Recording Fees', 'ten_percent', 180.00, 210.00),
    ('Flood Certification', 'Required Third-Party Services (shopping list)', 'ten_percent', 45.00, 60.00),
    ('Prepaid Interest', 'Prepaids', 'unlimited', 640.00, 680.00)
) as fee(fee_name, fee_category, tolerance_type, le_amount, cd_amount)
where not exists (
  select 1
  from public.disclosure_fees existing
  where existing.disclosure_id = disclosure.id
    and existing.fee_name = fee.fee_name
);

with ranked_loans as (
  select
    id,
    borrower_id,
    loan_officer_id,
    created_at,
    row_number() over (order by created_at asc) as row_num
  from public.loan_applications
  where deleted_at is null
),
document_seed as (
  select
    loan.id as loan_id,
    coalesce(loan.borrower_id, loan.loan_officer_id) as uploaded_by,
    item.category::text as category,
    item.file_name,
    item.file_size,
    item.mime_type,
    item.storage_path,
    item.status::text as status
  from ranked_loans loan
  cross join lateral (
    values
      (
        'pay_stub',
        'paystub-march-2026.pdf',
        182400,
        'application/pdf',
        concat('https://res.cloudinary.com/demo/raw/upload/smartmortgagepro/', loan.id, '/paystub-march-2026.pdf'),
        'verified'
      ),
      (
        'bank_statement',
        'bank-statement-feb-2026.pdf',
        244200,
        'application/pdf',
        concat('https://res.cloudinary.com/demo/raw/upload/smartmortgagepro/', loan.id, '/bank-statement-feb-2026.pdf'),
        'processing'
      )
  ) as item(category, file_name, file_size, mime_type, storage_path, status)
  where loan.row_num <= 3
    and coalesce(loan.borrower_id, loan.loan_officer_id) is not null
)
insert into public.documents (
  loan_id,
  uploaded_by,
  category,
  file_name,
  file_size,
  mime_type,
  storage_path,
  status
)
select
  doc.loan_id,
  doc.uploaded_by,
  doc.category,
  doc.file_name,
  doc.file_size,
  doc.mime_type,
  doc.storage_path,
  doc.status
from document_seed doc
where not exists (
  select 1
  from public.documents existing
  where existing.loan_id = doc.loan_id
    and existing.file_name = doc.file_name
    and existing.deleted_at is null
);

with ranked_loans as (
  select
    id,
    borrower_id,
    loan_officer_id,
    created_at,
    row_number() over (order by created_at asc) as row_num
  from public.loan_applications
  where deleted_at is null
),
inserted_threads as (
  insert into public.message_threads (
    loan_id,
    subject,
    thread_type,
    created_by
  )
  select
    loan.id,
    'Document checklist follow-up',
    'document_request',
    coalesce(loan.loan_officer_id, loan.borrower_id)
  from ranked_loans loan
  where loan.row_num <= 3
    and coalesce(loan.loan_officer_id, loan.borrower_id) is not null
    and not exists (
      select 1
      from public.message_threads existing
      where existing.loan_id = loan.id
        and coalesce(existing.subject, '') = 'Document checklist follow-up'
        and existing.archived_at is null
    )
  returning id, loan_id
),
target_threads as (
  select id, loan_id
  from inserted_threads
  union all
  select
    thread.id,
    thread.loan_id
  from public.message_threads thread
  join ranked_loans loan
    on loan.id = thread.loan_id
  where loan.row_num <= 3
    and coalesce(thread.subject, '') = 'Document checklist follow-up'
    and thread.archived_at is null
),
message_seed as (
  select
    thread.id as thread_id,
    thread.loan_id,
    item.sender_role::text as sender_role,
    case
      when item.sender_role = 'loan_officer' then loan.loan_officer_id
      else loan.borrower_id
    end as sender_id,
    coalesce(profile.full_name, auth_user.email, initcap(replace(item.sender_role, '_', ' '))) as sender_name,
    item.body,
    item.template_type::text as template_type
  from target_threads thread
  join public.loan_applications loan
    on loan.id = thread.loan_id
  cross join lateral (
    values
      (
        'loan_officer',
        'Please upload your latest pay stub and bank statement so we can continue processing.',
        'document_request'
      ),
      (
        'borrower',
        'Thanks, I have uploaded both documents in the portal today.',
        'status_update'
      )
  ) as item(sender_role, body, template_type)
  left join public.profiles profile
    on profile.id = case
      when item.sender_role = 'loan_officer' then loan.loan_officer_id
      else loan.borrower_id
    end
  left join auth.users auth_user
    on auth_user.id = case
      when item.sender_role = 'loan_officer' then loan.loan_officer_id
      else loan.borrower_id
    end
  where case
    when item.sender_role = 'loan_officer' then loan.loan_officer_id
    else loan.borrower_id
  end is not null
)
insert into public.messages (
  thread_id,
  loan_id,
  sender_id,
  sender_name,
  sender_role,
  body,
  is_template,
  template_type,
  read_by
)
select
  seed.thread_id,
  seed.loan_id,
  seed.sender_id,
  seed.sender_name,
  seed.sender_role,
  seed.body,
  false,
  seed.template_type,
  array[seed.sender_id]::uuid[]
from message_seed seed
where not exists (
  select 1
  from public.messages existing
  where existing.thread_id = seed.thread_id
    and existing.sender_id = seed.sender_id
    and existing.body = seed.body
    and existing.deleted_at is null
);

with ranked_loans as (
  select
    id,
    created_at,
    row_number() over (order by created_at asc) as row_num
  from public.loan_applications
  where deleted_at is null
),
staff_actor as (
  select id
  from public.profiles
  where role in ('loan_officer', 'processor', 'underwriter', 'admin')
  order by
    case role
      when 'loan_officer' then 1
      when 'processor' then 2
      when 'underwriter' then 3
      else 4
    end,
    created_at asc
  limit 1
),
check_seed as (
  select
    loan.id as loan_id,
    item.regulation::text as regulation,
    item.check_name,
    item.status::text as status,
    item.description,
    item.remediation,
    now() + item.deadline_offset as deadline,
    (select id from staff_actor) as actor_id
  from ranked_loans loan
  cross join lateral (
    values
      (
        'trid',
        'TRID LE timing review',
        'pass',
        'Loan Estimate timing verified against the three-business-day requirement.',
        null,
        interval '2 days'
      ),
      (
        'respa',
        'Escrow disclosure completeness',
        'warning',
        'Initial escrow disclosure needs updated reserve figures before final package.',
        'Update escrow reserve calculations and resend the disclosure package.',
        interval '5 days'
      ),
      (
        'hmda',
        'HMDA demographic capture',
        'pending',
        'Demographic fields are pending borrower confirmation.',
        'Request borrower confirmation for optional demographic fields.',
        interval '7 days'
      )
  ) as item(regulation, check_name, status, description, remediation, deadline_offset)
  where loan.row_num <= 3
)
insert into public.compliance_checks (
  loan_id,
  regulation,
  check_name,
  status,
  description,
  remediation,
  deadline,
  resolved_at,
  resolved_by
)
select
  seed.loan_id,
  seed.regulation,
  seed.check_name,
  seed.status,
  seed.description,
  seed.remediation,
  seed.deadline,
  case when seed.status = 'pass' then now() - interval '1 day' else null end,
  case when seed.status = 'pass' then seed.actor_id else null end
from check_seed seed
where not exists (
  select 1
  from public.compliance_checks existing
  where existing.loan_id = seed.loan_id
    and existing.check_name = seed.check_name
);

with ranked_loans as (
  select
    id,
    created_at,
    row_number() over (order by created_at asc) as row_num
  from public.loan_applications
  where deleted_at is null
),
staff_actor as (
  select id
  from public.profiles
  where role in ('loan_officer', 'processor', 'underwriter', 'admin')
  order by
    case role
      when 'loan_officer' then 1
      when 'processor' then 2
      when 'underwriter' then 3
      else 4
    end,
    created_at asc
  limit 1
),
event_seed as (
  select
    loan.id as loan_id,
    item.event_type,
    now() + item.event_offset as event_date,
    item.notes,
    item.metadata
  from ranked_loans loan
  cross join lateral (
    values
      (
        'Compliance review scheduled',
        interval '-2 days',
        'Initial compliance review scheduled with processing team.',
        jsonb_build_object('stage', 'processing', 'source', 'seed.sql')
      ),
      (
        'Disclosure package reviewed',
        interval '-1 day',
        'Disclosure package reviewed and queued for borrower confirmation.',
        jsonb_build_object('disclosure_type', 'loan_estimate', 'source', 'seed.sql')
      )
  ) as item(event_type, event_offset, notes, metadata)
  where loan.row_num <= 3
)
insert into public.compliance_events (
  loan_id,
  event_type,
  event_date,
  performed_by,
  notes,
  metadata
)
select
  seed.loan_id,
  seed.event_type,
  seed.event_date,
  (select id from staff_actor),
  seed.notes,
  seed.metadata
from event_seed seed
where not exists (
  select 1
  from public.compliance_events existing
  where existing.loan_id = seed.loan_id
    and existing.event_type = seed.event_type
);

with ranked_loans as (
  select
    id,
    created_at,
    row_number() over (order by created_at asc) as row_num
  from public.loan_applications
  where deleted_at is null
),
staff_actor as (
  select id
  from public.profiles
  where role in ('loan_officer', 'processor', 'underwriter', 'admin')
  order by
    case role
      when 'loan_officer' then 1
      when 'processor' then 2
      when 'underwriter' then 3
      else 4
    end,
    created_at asc
  limit 1
)
insert into public.compliance_audit_log (
  loan_id,
  action,
  performed_by,
  details,
  ip_address
)
select
  loan.id,
  'seed_compliance_snapshot',
  (select id from staff_actor),
  jsonb_build_object('source', 'seed.sql', 'note', 'Initial compliance baseline seeded'),
  '127.0.0.1'::inet
from ranked_loans loan
where loan.row_num <= 3
  and not exists (
    select 1
    from public.compliance_audit_log existing
    where existing.loan_id = loan.id
      and existing.action = 'seed_compliance_snapshot'
  );

insert into public.platform_features (
  feature_code,
  feature_name,
  summary,
  category,
  audience,
  tier,
  complexity,
  status,
  owner_team,
  route_href,
  sort_order
)
values
  ('F-LOAN-01', 'Digital Loan Application Portal', 'Guided borrower web and mobile application flow with staged completion, resume support, and submission tracking.', 'core', 'borrower', 'must_have', 'medium', 'live', 'Borrower Experience', '/my-loans', 10),
  ('F-DOC-01', 'Document Collection & Management', 'Secure upload, storage, checklist tracking, and borrower or staff document review for each loan.', 'core', 'both', 'must_have', 'medium', 'live', 'Borrower Experience', '/my-loans', 20),
  ('F-DOC-02', 'Automated Document Verification', 'OCR and AI-driven classification to validate completeness, freshness, and core extracted values from uploaded files.', 'automation', 'staff', 'must_have', 'high', 'seeded', 'Document Intelligence', '/pipeline', 30),
  ('F-INCOME-01', 'Income Verification System', 'Payroll and bank verification pipeline for income, employment continuity, and asset reserve checks.', 'automation', 'staff', 'must_have', 'high', 'seeded', 'Verification Ops', '/pipeline', 40),
  ('F-UW-01', 'Automated Underwriting Engine', 'Rule-based underwriting evaluation against lender overlays, AUS conditions, and loan policy thresholds.', 'automation', 'staff', 'must_have', 'high', 'seeded', 'Underwriting', '/pipeline', 50),
  ('F-COMP-01', 'Compliance Management', 'Federal and state compliance monitoring with deadlines, rule checks, audit log, and remediation tracking.', 'automation', 'staff', 'must_have', 'high', 'live', 'Compliance', '/pipeline', 60),
  ('F-ESIGN-01', 'Electronic Signatures', 'Secure borrower e-sign workflow for intent to proceed, disclosures, and package acknowledgements.', 'core', 'borrower', 'must_have', 'low', 'seeded', 'Closing Operations', '/my-loans', 70),
  ('F-PRICE-01', 'Loan Pricing Engine', 'Loan pricing, fees, margins, and market-driven pricing recommendations based on borrower scenario.', 'automation', 'staff', 'must_have', 'medium', 'seeded', 'Capital Markets', '/pipeline', 80),
  ('F-SERVICE-01', 'Third-party Service Ordering', 'Automated appraisal, title, flood, and verification ordering with vendor status tracking.', 'automation', 'staff', 'must_have', 'medium', 'seeded', 'Processing', '/pipeline', 90),
  ('F-DISC-01', 'Automated Disclosure Generation', 'Dynamic Loan Estimate and Closing Disclosure generation with version control and delivery tracking.', 'automation', 'both', 'must_have', 'high', 'live', 'Disclosures', '/pipeline', 100),
  ('F-AI-RISK-01', 'AI-Powered Risk Assessment', 'Alternative data and machine learning signals that extend beyond traditional credit and DTI scoring.', 'ai', 'staff', 'innovative', 'high', 'seeded', 'Risk Analytics', '/pipeline', 110),
  ('F-AI-PERF-01', 'Predictive Analytics for Loan Performance', 'Default probability, pricing sensitivity, and expected performance models for secondary market decisions.', 'ai', 'staff', 'innovative', 'high', 'seeded', 'Risk Analytics', '/pipeline', 120),
  ('F-AI-DOC-01', 'Intelligent Document Processing', 'Advanced NLP extraction from complex income, asset, tax, and business documents.', 'ai', 'staff', 'important', 'high', 'seeded', 'Document Intelligence', '/pipeline', 130),
  ('F-AI-RECCO-01', 'Dynamic Loan Recommendation Engine', 'AI-driven loan product suggestions based on borrower profile, goals, and eligibility fit.', 'ai', 'borrower', 'important', 'high', 'seeded', 'Borrower Experience', '/my-loans', 140),
  ('F-BLOCK-01', 'Blockchain-based Document Verification', 'Immutable verification ledger for high-sensitivity document authenticity and tamper evidence.', 'ai', 'staff', 'innovative', 'high', 'planned', 'Security', '/pipeline', 150),
  ('F-VOICE-01', 'Voice-Activated Application Process', 'Voice AI intake experience to guide borrowers through the loan application conversationally.', 'ai', 'borrower', 'innovative', 'high', 'planned', 'Borrower Experience', '/my-loans', 160),
  ('F-MARKET-01', 'Real-time Market Data Integration', 'Competitor rates, treasury movement, and economic indicator feeds for pricing and lock decisions.', 'ai', 'staff', 'important', 'medium', 'seeded', 'Capital Markets', '/pipeline', 170),
  ('F-AI-FRAUD-01', 'Advanced Fraud Detection', 'ML and rules engine for identity, occupancy, income, and document anomaly detection.', 'ai', 'staff', 'important', 'high', 'seeded', 'Fraud Ops', '/pipeline', 180),
  ('F-AI-CLOSE-01', 'Automated Closing Coordination', 'AI-assisted closing scheduling, task coordination, and participant reminder orchestration.', 'ai', 'both', 'important', 'high', 'seeded', 'Closing Operations', '/pipeline', 190),
  ('F-AI-PERSONAL-01', 'Personalized Borrower Experience', 'Dynamic borrower UI and workflow sequencing based on profile, behavior, and preferences.', 'ai', 'borrower', 'nice_to_have', 'high', 'seeded', 'Borrower Experience', '/my-loans', 200),
  ('F-REG-CHANGE-01', 'Regulatory Change Management', 'Operational tracking for regulation updates, policy change notices, and rule-effective dates.', 'ai', 'staff', 'important', 'medium', 'seeded', 'Compliance', '/pipeline', 210),
  ('F-INVESTOR-01', 'Investor / Secondary Market Integration', 'Loan package delivery and sale-readiness tracking for investors and correspondents.', 'automation', 'staff', 'important', 'high', 'seeded', 'Capital Markets', '/pipeline', 220),
  ('F-AI-PORTFOLIO-01', 'Advanced Portfolio Analytics', 'Portfolio-level trend analysis for risk concentration, pull-through, fallout, and servicing exposure.', 'ai', 'staff', 'important', 'high', 'seeded', 'Executive Analytics', '/pipeline', 230)
on conflict (feature_code) do update
set
  feature_name = excluded.feature_name,
  summary = excluded.summary,
  category = excluded.category,
  audience = excluded.audience,
  tier = excluded.tier,
  complexity = excluded.complexity,
  status = excluded.status,
  owner_team = excluded.owner_team,
  route_href = excluded.route_href,
  sort_order = excluded.sort_order;
