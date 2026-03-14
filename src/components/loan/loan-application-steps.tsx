"use client";

import {
  AccountBalanceRounded,
  AddRounded,
  ApartmentRounded,
  AttachMoneyRounded,
  CheckCircleRounded,
  CloseRounded,
  CottageRounded,
  HomeRounded,
  MonetizationOnRounded,
  VillaRounded,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Paper,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { addDays, format } from "date-fns";
import { useEffect } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { FormCheckboxField, FormSelectField, FormTextField } from "@/src/components/loan/rhf-fields";
import { DEFAULT_LOAN_APPLICATION, type LoanApplication } from "@/src/types/smart-mortgage";

const loanTypeCards = [
  { value: "purchase", label: "Purchase", icon: HomeRounded },
  { value: "refinance", label: "Refinance", icon: ApartmentRounded },
  { value: "heloc", label: "HELOC", icon: CottageRounded },
  { value: "cash_out_refi", label: "Cash-Out Refi", icon: VillaRounded },
] as const;

function RadioCardGroup({
  value,
  onChange,
  items,
}: {
  value: string;
  onChange: (value: string) => void;
  items: ReadonlyArray<{ value: string; label: string; icon: React.ElementType }>;
}) {
  return (
    <Grid container spacing={2}>
      {items.map((item) => {
        const Icon = item.icon;
        const selected = value === item.value;

        return (
          <Grid key={item.value} size={{ xs: 12, md: 6 }}>
            <Card
              elevation={0}
              sx={{
                border: selected ? "2px solid #1565C0" : "1px solid rgba(15,23,42,0.08)",
                bgcolor: selected ? "rgba(21,101,192,0.06)" : "white",
              }}
            >
              <CardActionArea onClick={() => onChange(item.value)} sx={{ p: 2.5 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Icon sx={{ color: selected ? "#1565C0" : "#64748B" }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {item.label}
                  </Typography>
                </Stack>
              </CardActionArea>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}

export function LoanPurposeStep() {
  const { setValue, control } = useFormContext<LoanApplication>();
  const loanType = useWatch({ control, name: "loanType" });
  const estimatedPropertyValue = useWatch({ control, name: "estimatedPropertyValue" });
  const desiredLoanAmount = useWatch({ control, name: "desiredLoanAmount" });
  const ltv = estimatedPropertyValue ? (desiredLoanAmount / estimatedPropertyValue) * 100 : 0;

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6">Step 1. Loan Purpose</Typography>
        <Typography variant="body2" sx={{ color: "#64748B", mt: 0.5 }}>
          Set the mortgage scenario and target timeline.
        </Typography>
      </Box>

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1.25 }}>
          Loan type
        </Typography>
        <RadioCardGroup
          value={loanType}
          onChange={(value) => setValue("loanType", value as LoanApplication["loanType"])}
          items={loanTypeCards}
        />
      </Box>

      <FormSelectField
        name="occupancyType"
        label="Property occupancy"
        options={[
          { label: "Primary Residence", value: "primary_residence" },
          { label: "Second Home", value: "second_home" },
          { label: "Investment Property", value: "investment_property" },
        ]}
      />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormTextField name="estimatedPropertyValue" label="Estimated property value" type="number" currency />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormTextField name="desiredLoanAmount" label="Desired loan amount" type="number" currency />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormTextField
            name="targetCloseDate"
            label="Target close date"
            type="date"
            min={format(addDays(new Date(), 30), "yyyy-MM-dd")}
          />
        </Grid>
      </Grid>

      <Alert severity="info">Estimated LTV: {Number.isFinite(ltv) ? ltv.toFixed(1) : "0.0"}%</Alert>
    </Stack>
  );
}

export function BorrowerProfileStep() {
  const { control, setValue } = useFormContext<LoanApplication>();
  const yearsAtAddress = useWatch({ control, name: "borrower.currentAddress.yearsAtAddress" });
  const coBorrowerEnabled = useWatch({ control, name: "coBorrower.enabled" });

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6">Step 2. Borrower Profile</Typography>
        <Typography variant="body2" sx={{ color: "#64748B", mt: 0.5 }}>
          Capture borrower identity, residency, and household profile.
        </Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormTextField name="borrower.fullName" label="Full legal name" />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <FormTextField name="borrower.ssnMasked" label="SSN" placeholder="123-45-6789" />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <FormTextField name="borrower.dateOfBirth" label="Date of birth" type="date" />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormSelectField
            name="borrower.maritalStatus"
            label="Marital status"
            options={[
              { label: "Single", value: "single" },
              { label: "Married", value: "married" },
              { label: "Divorced", value: "divorced" },
              { label: "Widowed", value: "widowed" },
            ]}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormTextField name="borrower.dependents" label="Dependents" type="number" />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormTextField
            name="borrower.currentAddress.yearsAtAddress"
            label="Years at current address"
            type="number"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormTextField name="borrower.currentAddress.line1" label="Current address" />
        </Grid>
        <Grid size={{ xs: 12, md: 2 }}>
          <FormTextField name="borrower.currentAddress.city" label="City" />
        </Grid>
        <Grid size={{ xs: 12, md: 2 }}>
          <FormTextField name="borrower.currentAddress.state" label="State" />
        </Grid>
        <Grid size={{ xs: 12, md: 2 }}>
          <FormTextField name="borrower.currentAddress.zip" label="ZIP" />
        </Grid>
      </Grid>

      {yearsAtAddress < 2 ? (
        <Paper elevation={0} sx={{ p: 2.5, border: "1px solid rgba(15,23,42,0.08)" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            Prior address required
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormTextField name="borrower.priorAddress.line1" label="Prior address" />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <FormTextField name="borrower.priorAddress.city" label="City" />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <FormTextField name="borrower.priorAddress.state" label="State" />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <FormTextField name="borrower.priorAddress.zip" label="ZIP" />
            </Grid>
          </Grid>
        </Paper>
      ) : null}

      <FormControlLabel
        control={<Switch checked={coBorrowerEnabled} />}
        label="Add co-borrower"
        onChange={(_, checked) => setValue("coBorrower.enabled", checked)}
      />

      {coBorrowerEnabled ? (
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<CheckCircleRounded color="primary" />}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Co-Borrower Details
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormTextField name="coBorrower.fullName" label="Co-borrower full legal name" />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormTextField name="coBorrower.ssnMasked" label="Co-borrower SSN" />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormTextField name="coBorrower.dateOfBirth" label="Co-borrower DOB" type="date" />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      ) : null}
    </Stack>
  );
}

export function EmploymentIncomeStep() {
  const { control } = useFormContext<LoanApplication>();
  const employmentType = useWatch({ control, name: "employment.employmentType" });
  const secondaryIncome = useFieldArray({ control, name: "secondaryIncomeSources" });

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6">Step 3. Employment & Income</Typography>
        <Typography variant="body2" sx={{ color: "#64748B", mt: 0.5 }}>
          Capture current employment and any additional qualifying income.
        </Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormSelectField
            name="employment.employmentType"
            label="Employment type"
            options={[
              { label: "W-2 Employee", value: "w2_employee" },
              { label: "Self-Employed", value: "self_employed" },
              { label: "Retired", value: "retired" },
              { label: "Other", value: "other" },
            ]}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormTextField name="employment.employerName" label="Employer name" />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormTextField name="employment.startDate" label="Employment start date" type="date" />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormTextField name="employment.position" label="Position / title" />
        </Grid>
        <Grid size={{ xs: 12, md: 2 }}>
          <FormTextField name="employment.baseSalary" label="Base salary" type="number" currency />
        </Grid>
        <Grid size={{ xs: 12, md: 2 }}>
          <FormTextField name="employment.overtime" label="Overtime" type="number" currency />
        </Grid>
        <Grid size={{ xs: 12, md: 2 }}>
          <FormTextField name="employment.bonuses" label="Bonuses" type="number" currency />
        </Grid>
        <Grid size={{ xs: 12, md: 2 }}>
          <FormTextField name="employment.commissions" label="Commissions" type="number" currency />
        </Grid>
      </Grid>

      {employmentType === "self_employed" ? (
        <Paper elevation={0} sx={{ p: 2.5, border: "1px solid rgba(15,23,42,0.08)" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            Self-Employment Details
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormTextField name="employment.businessName" label="Business name" />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormTextField
                name="employment.ownershipPercentage"
                label="Ownership %"
                type="number"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormTextField
                name="employment.twoYearAverageIncome"
                label="2-year average income"
                type="number"
                currency
              />
            </Grid>
          </Grid>
        </Paper>
      ) : null}

      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Secondary Income Sources
          </Typography>
          <Button
            startIcon={<AddRounded />}
            onClick={() =>
              secondaryIncome.append({
                id: `income-${Date.now()}`,
                type: "rental",
                amount: 0,
                description: "",
              })
            }
          >
            Add income
          </Button>
        </Stack>
        {secondaryIncome.fields.length ? (
          secondaryIncome.fields.map((field, index) => (
            <Paper key={field.id} elevation={0} sx={{ p: 2, border: "1px solid rgba(15,23,42,0.08)" }}>
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormSelectField
                    name={`secondaryIncomeSources.${index}.type`}
                    label="Income type"
                    options={[
                      { label: "Rental", value: "rental" },
                      { label: "Alimony", value: "alimony" },
                      { label: "Child Support", value: "child_support" },
                      { label: "Social Security", value: "social_security" },
                      { label: "Other", value: "other" },
                    ]}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormTextField
                    name={`secondaryIncomeSources.${index}.description`}
                    label="Description"
                  />
                </Grid>
                <Grid size={{ xs: 10, md: 3 }}>
                  <FormTextField
                    name={`secondaryIncomeSources.${index}.amount`}
                    label="Monthly amount"
                    type="number"
                    currency
                  />
                </Grid>
                <Grid size={{ xs: 2, md: 1 }}>
                  <IconButton aria-label="Remove income source" onClick={() => secondaryIncome.remove(index)}>
                    <CloseRounded />
                  </IconButton>
                </Grid>
              </Grid>
            </Paper>
          ))
        ) : (
          <Alert severity="info">No secondary income added.</Alert>
        )}
      </Stack>
    </Stack>
  );
}

export function AssetsDownPaymentStep() {
  const { control, setValue } = useFormContext<LoanApplication>();
  const assetsArray = useFieldArray({ control, name: "assets" });
  const downPaymentSource = useWatch({ control, name: "downPaymentSource" });

  useEffect(() => {
    setValue("needsGiftLetter", downPaymentSource === "gift");
  }, [downPaymentSource, setValue]);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6">Step 4. Assets & Down Payment</Typography>
        <Typography variant="body2" sx={{ color: "#64748B", mt: 0.5 }}>
          List liquid assets and how the down payment will be sourced.
        </Typography>
      </Box>

      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Asset Accounts
          </Typography>
          <Button
            startIcon={<AddRounded />}
            onClick={() =>
              assetsArray.append({
                id: `asset-${Date.now()}`,
                type: "checking",
                institution: "",
                balance: 0,
              })
            }
          >
            Add asset
          </Button>
        </Stack>

        {assetsArray.fields.map((field, index) => (
          <Paper key={field.id} elevation={0} sx={{ p: 2, border: "1px solid rgba(15,23,42,0.08)" }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 3 }}>
                <FormSelectField
                  name={`assets.${index}.type`}
                  label="Asset type"
                  options={[
                    { label: "Checking", value: "checking" },
                    { label: "Savings", value: "savings" },
                    { label: "Investment", value: "investment" },
                    { label: "Retirement", value: "retirement" },
                  ]}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 5 }}>
                <FormTextField name={`assets.${index}.institution`} label="Institution" />
              </Grid>
              <Grid size={{ xs: 10, md: 3 }}>
                <FormTextField
                  name={`assets.${index}.balance`}
                  label="Balance"
                  type="number"
                  currency
                />
              </Grid>
              <Grid size={{ xs: 2, md: 1 }}>
                <IconButton aria-label="Remove asset" onClick={() => assetsArray.remove(index)}>
                  <CloseRounded />
                </IconButton>
              </Grid>
            </Grid>
          </Paper>
        ))}
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormSelectField
            name="downPaymentSource"
            label="Down payment source"
            options={[
              { label: "Gift", value: "gift" },
              { label: "Savings", value: "savings" },
              { label: "Sale of property", value: "sale_of_property" },
              { label: "Equity", value: "equity" },
            ]}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormCheckboxField name="needsGiftLetter" label="Gift letter required" />
        </Grid>
      </Grid>
    </Stack>
  );
}

export function CreditLiabilitiesStep() {
  const { control, setValue } = useFormContext<LoanApplication>();
  const liabilitiesArray = useFieldArray({ control, name: "liabilities" });
  const softCreditPull = useWatch({ control, name: "consents.softCreditPull" });
  const score = useWatch({ control, name: "simulatedCreditScore" });
  const riskTier = useWatch({ control, name: "riskTier" });

  useEffect(() => {
    if (softCreditPull && score === 0) {
      const nextScore = Math.floor(Math.random() * 90 + 690);
      setValue("simulatedCreditScore", nextScore);
      setValue(
        "riskTier",
        nextScore >= 740 ? "prime" : nextScore >= 680 ? "near_prime" : "non_prime",
      );
    }
  }, [score, setValue, softCreditPull]);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6">Step 5. Credit & Liabilities</Typography>
        <Typography variant="body2" sx={{ color: "#64748B", mt: 0.5 }}>
          Capture recurring debts and borrower credit history disclosures.
        </Typography>
      </Box>

      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Monthly debt obligations
          </Typography>
          <Button
            startIcon={<AddRounded />}
            onClick={() =>
              liabilitiesArray.append({
                id: `liability-${Date.now()}`,
                type: "car",
                creditor: "",
                monthlyPayment: 0,
                balance: 0,
              })
            }
          >
            Add liability
          </Button>
        </Stack>

        {liabilitiesArray.fields.map((field, index) => (
          <Paper key={field.id} elevation={0} sx={{ p: 2, border: "1px solid rgba(15,23,42,0.08)" }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 3 }}>
                <FormSelectField
                  name={`liabilities.${index}.type`}
                  label="Debt type"
                  options={[
                    { label: "Car", value: "car" },
                    { label: "Student Loan", value: "student_loan" },
                    { label: "Credit Card", value: "credit_card" },
                    { label: "Personal Loan", value: "personal_loan" },
                    { label: "Other", value: "other" },
                  ]}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormTextField name={`liabilities.${index}.creditor`} label="Creditor" />
              </Grid>
              <Grid size={{ xs: 12, md: 2.5 }}>
                <FormTextField
                  name={`liabilities.${index}.monthlyPayment`}
                  label="Monthly payment"
                  type="number"
                  currency
                />
              </Grid>
              <Grid size={{ xs: 10, md: 2.5 }}>
                <FormTextField
                  name={`liabilities.${index}.balance`}
                  label="Balance"
                  type="number"
                  currency
                />
              </Grid>
              <Grid size={{ xs: 2, md: 0 }}>
                <IconButton aria-label="Remove liability" onClick={() => liabilitiesArray.remove(index)}>
                  <CloseRounded />
                </IconButton>
              </Grid>
            </Grid>
          </Paper>
        ))}
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormCheckboxField name="bankruptcyHistory" label="Bankruptcy history" />
          <FormTextField name="bankruptcyDetails" label="Bankruptcy details" multiline />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormCheckboxField name="foreclosureHistory" label="Foreclosure history" />
          <FormTextField name="foreclosureDetails" label="Foreclosure details" multiline />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormCheckboxField name="judgmentsHistory" label="Judgments or liens" />
          <FormTextField name="judgmentsDetails" label="Judgment details" multiline />
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ p: 2.5, border: "1px solid rgba(15,23,42,0.08)" }}>
        <FormCheckboxField
          name="consents.softCreditPull"
          label="I consent to a soft pull credit review under the FCRA disclosure."
        />
        {softCreditPull && score > 0 ? (
          <Stack direction="row" spacing={1.5} sx={{ mt: 1.5 }} alignItems="center">
            <Chip label={`Score ${score}`} color="primary" />
            <Chip label={riskTier.replace("_", " ")} color="success" />
          </Stack>
        ) : null}
      </Paper>
    </Stack>
  );
}

export function PropertyDetailsStep() {
  const { control } = useFormContext<LoanApplication>();
  const underContract = useWatch({ control, name: "property.underContract" });
  const hoa = useWatch({ control, name: "property.hoa" });

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6">Step 6. Property Details</Typography>
        <Typography variant="body2" sx={{ color: "#64748B", mt: 0.5 }}>
          Capture collateral details, taxes, insurance, and contract information.
        </Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <FormTextField name="property.propertyAddress" label="Property address" />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormSelectField
            name="property.propertyType"
            label="Property type"
            options={[
              { label: "Single-Family Residence", value: "sfr" },
              { label: "Condo", value: "condo" },
              { label: "Multi-family 2-4 Unit", value: "multi_family" },
              { label: "Townhome", value: "townhome" },
            ]}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 2 }}>
          <FormTextField name="property.yearBuilt" label="Year built" type="number" />
        </Grid>
        <Grid size={{ xs: 12, md: 2 }}>
          <FormTextField name="property.squareFootage" label="Square footage" type="number" />
        </Grid>
        <Grid size={{ xs: 12, md: 2 }}>
          <FormCheckboxField name="property.hoa" label="HOA applies" />
        </Grid>
        <Grid size={{ xs: 12, md: 2 }}>
          {hoa ? <FormTextField name="property.hoaFee" label="Monthly HOA fee" type="number" currency /> : null}
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormTextField name="property.estimatedTaxes" label="Monthly taxes" type="number" currency />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormTextField
            name="property.estimatedInsurance"
            label="Monthly insurance"
            type="number"
            currency
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormCheckboxField name="property.underContract" label="Property is under contract" />
        </Grid>
      </Grid>

      {underContract ? (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormTextField name="property.contractDate" label="Contract date" type="date" />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormTextField name="property.purchasePrice" label="Purchase price" type="number" currency />
          </Grid>
        </Grid>
      ) : null}
    </Stack>
  );
}

export function ReviewSubmitStep({ onEditStep }: { onEditStep: (step: number) => void }) {
  const { getValues } = useFormContext<LoanApplication>();
  const values = getValues();

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6">Step 7. Review & Submit</Typography>
        <Typography variant="body2" sx={{ color: "#64748B", mt: 0.5 }}>
          Review the full application, finalize required disclosures, and submit.
        </Typography>
      </Box>

      {[
        { title: "Loan Purpose", summary: `${values.loanType} • ${values.occupancyType}`, step: 0 },
        { title: "Borrower Profile", summary: values.borrower.fullName, step: 1 },
        { title: "Employment & Income", summary: values.employment.employerName, step: 2 },
        { title: "Assets & Down Payment", summary: values.downPaymentSource.replaceAll("_", " "), step: 3 },
        { title: "Credit & Liabilities", summary: `Score ${values.simulatedCreditScore || "pending"}`, step: 4 },
        { title: "Property", summary: values.property.propertyAddress, step: 5 },
      ].map((item) => (
        <Accordion key={item.title} defaultExpanded>
          <AccordionSummary expandIcon={<CheckCircleRounded color="primary" />}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              spacing={1}
              sx={{ width: "100%" }}
            >
              <Typography sx={{ fontWeight: 700 }}>{item.title}</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" sx={{ color: "#64748B" }}>
                  {item.summary || "Needs review"}
                </Typography>
                <Typography
                  variant="button"
                  component="span"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditStep(item.step);
                  }}
                  sx={{
                    cursor: "pointer",
                    color: "primary.main",
                    fontWeight: 700,
                    fontSize: "0.8125rem",
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  Edit
                </Typography>
              </Stack>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" sx={{ color: "#64748B" }}>
              Review complete for {item.title}. You can jump back to refine any values.
            </Typography>
          </AccordionDetails>
        </Accordion>
      ))}

      <Paper elevation={0} sx={{ p: 2.5, border: "1px solid rgba(15,23,42,0.08)" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
          Consents
        </Typography>
        <Stack>
          <FormCheckboxField name="consents.creditPull" label="I authorize a full credit pull." />
          <FormCheckboxField name="consents.ecoa" label="I acknowledge the ECOA notice." />
          <FormCheckboxField name="consents.privacyNotice" label="I received the Privacy Notice." />
          <FormCheckboxField name="consents.esignDisclosure" label="I consent to ESIGN delivery." />
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: 2.5, border: "1px solid rgba(15,23,42,0.08)" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
          Government Monitoring Information (Optional)
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormTextField name="governmentMonitoring.ethnicity" label="Ethnicity" />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormTextField name="governmentMonitoring.race" label="Race" />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormTextField name="governmentMonitoring.sex" label="Sex" />
          </Grid>
        </Grid>
      </Paper>
    </Stack>
  );
}

export function LoanSummaryPanel() {
  const { getValues } = useFormContext<LoanApplication>();
  const values = getValues() ?? DEFAULT_LOAN_APPLICATION;

  const ltv = values.estimatedPropertyValue
    ? (values.desiredLoanAmount / values.estimatedPropertyValue) * 100
    : 0;
  const totalIncome =
    values.employment.baseSalary +
    values.employment.overtime +
    values.employment.bonuses +
    values.employment.commissions +
    (values.employment.employmentType === "self_employed"
      ? values.employment.twoYearAverageIncome
      : 0) +
    values.secondaryIncomeSources.reduce((sum, item) => sum + item.amount * 12, 0);
  const monthlyIncome = totalIncome / 12;
  const monthlyDebts = values.liabilities.reduce((sum, item) => sum + item.monthlyPayment, 0);
  const dti = monthlyIncome > 0 ? (monthlyDebts / monthlyIncome) * 100 : 0;
  const uploadedSummary = [
    { icon: MonetizationOnRounded, label: "Qualifying Income", value: `$${Math.round(totalIncome).toLocaleString()}` },
    { icon: AccountBalanceRounded, label: "Target LTV", value: `${ltv.toFixed(1)}%` },
    { icon: AttachMoneyRounded, label: "Estimated DTI", value: `${dti.toFixed(1)}%` },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        border: "1px solid rgba(15,23,42,0.08)",
        position: { md: "sticky" },
        top: 24,
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        Live Summary
      </Typography>
      <Typography variant="body2" sx={{ color: "#64748B", mt: 0.75 }}>
        Updates as you complete the application.
      </Typography>

      <Stack spacing={1.5} sx={{ mt: 2.5 }}>
        {uploadedSummary.map((item) => {
          const Icon = item.icon;
          return (
            <Stack key={item.label} direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 3,
                  bgcolor: "rgba(21,101,192,0.08)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Icon sx={{ color: "#1565C0" }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "#64748B" }}>
                  {item.label}
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {item.value}
                </Typography>
              </Box>
            </Stack>
          );
        })}
      </Stack>

      <Divider sx={{ my: 2 }} />
      <Typography variant="caption" sx={{ color: "#64748B" }}>
        Borrower
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 700 }}>
        {values.borrower.fullName || "Not started"}
      </Typography>
      <Typography variant="caption" sx={{ color: "#64748B" }}>
        Property
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 700 }}>
        {values.property.propertyAddress || "Awaiting property details"}
      </Typography>
    </Paper>
  );
}

export function ResumeDraftBanner({
  visible,
  lastSavedAt,
}: {
  visible: boolean;
  lastSavedAt: string | null;
}) {
  if (!visible) return null;

  return (
    <Alert severity="info">
      Resume Application detected. {lastSavedAt ? `Last saved ${format(new Date(lastSavedAt), "PPpp")}.` : ""}
    </Alert>
  );
}
