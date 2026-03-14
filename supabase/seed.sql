insert into public.loan_applications (
  borrower_name,
  property_address,
  loan_amount,
  stage,
  priority,
  expected_close_date
)
values
  (
    'Avery Johnson',
    '1204 W Fulton St, Chicago, IL 60607',
    525000,
    'application',
    'medium',
    current_date + interval '45 days'
  ),
  (
    'Sofia Carter',
    '87 Pine Brook Rd, Austin, TX 78704',
    780000,
    'underwriting',
    'high',
    current_date + interval '21 days'
  ),
  (
    'Noah Patel',
    '14 Ridgeview Dr, Raleigh, NC 27603',
    365000,
    'processing',
    'low',
    current_date + interval '60 days'
  )
on conflict do nothing;
