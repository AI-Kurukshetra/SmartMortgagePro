"use client";

import {
  AccountTreeOutlined,
  HomeWorkOutlined,
  MonetizationOnOutlined,
  SearchOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useDeferredValue, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLoanAction, deleteLoanAction, updateLoanStageAction } from "@/actions/loans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LoanRecord } from "@/lib/services/loans";
import type { LoanPriority, LoanStage } from "@/types/database.types";

type DashboardClientProps = {
  initialLoans: LoanRecord[];
  bootstrapError?: string;
};

const stageLabels: Record<LoanStage, string> = {
  application: "Application",
  processing: "Processing",
  underwriting: "Underwriting",
  approved: "Approved",
  closing: "Closing",
};

const stageChipColor: Record<LoanStage, "default" | "primary" | "warning" | "success"> = {
  application: "default",
  processing: "primary",
  underwriting: "warning",
  approved: "success",
  closing: "primary",
};

const priorityChipColor: Record<LoanPriority, "default" | "warning" | "error"> = {
  low: "default",
  medium: "warning",
  high: "error",
};

const stageOptions: LoanStage[] = [
  "application",
  "processing",
  "underwriting",
  "approved",
  "closing",
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatIsoDate(dateValue: string) {
  const [year, month, day] = dateValue.split("-");
  if (!year || !month || !day) return dateValue;
  return `${month}/${day}/${year}`;
}

export function DashboardClient({ initialLoans, bootstrapError }: DashboardClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [borrowerName, setBorrowerName] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [priority, setPriority] = useState<LoanPriority>("medium");
  const [expectedCloseDate, setExpectedCloseDate] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const deferredSearchTerm = useDeferredValue(searchTerm);

  const filteredLoans = initialLoans.filter((loan) => {
    const query = deferredSearchTerm.trim().toLowerCase();
    if (!query) return true;
    return (
      loan.borrower_name.toLowerCase().includes(query) ||
      loan.property_address.toLowerCase().includes(query) ||
      stageLabels[loan.stage].toLowerCase().includes(query)
    );
  });

  const totalPipelineValue = initialLoans.reduce((sum, loan) => sum + loan.loan_amount, 0);
  const activeApplications = initialLoans.filter((loan) => loan.stage !== "closing").length;
  const underwritingCount = initialLoans.filter((loan) => loan.stage === "underwriting").length;

  const handleCreateLoan = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    const amount = Number(loanAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      setErrorMessage("Loan amount must be a positive number.");
      return;
    }

    startTransition(() => {
      void (async () => {
        const result = await createLoanAction({
          borrowerName,
          propertyAddress,
          loanAmount: amount,
          priority,
          expectedCloseDate: expectedCloseDate || undefined,
        });

        if (!result.ok) {
          setErrorMessage(result.error);
          return;
        }

        setBorrowerName("");
        setPropertyAddress("");
        setLoanAmount("");
        setPriority("medium");
        setExpectedCloseDate("");
        router.refresh();
      })();
    });
  };

  const handleStageUpdate = (loanId: string, stage: LoanStage) => {
    setErrorMessage(null);
    startTransition(() => {
      void (async () => {
        const result = await updateLoanStageAction({ loanId, stage });
        if (!result.ok) {
          setErrorMessage(result.error);
          return;
        }
        router.refresh();
      })();
    });
  };

  const handleDeleteLoan = (loanId: string) => {
    setErrorMessage(null);
    startTransition(() => {
      void (async () => {
        const result = await deleteLoanAction({ loanId });
        if (!result.ok) {
          setErrorMessage(result.error);
          return;
        }
        router.refresh();
      })();
    });
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ color: "#0f172a", mb: 0.5 }}>
          SmartMortgage Pro Dashboard
        </Typography>
        <Typography variant="body1" sx={{ color: "#475569" }}>
          Track mortgage applications by stage and keep your pipeline moving.
        </Typography>
      </Box>

      {bootstrapError && (
        <Alert severity="warning">
          {bootstrapError}. Run <code>pnpm db:migrate</code> then <code>pnpm db:seed</code> after
          setting a valid <code>SUPABASE_DB_URL</code>.
        </Alert>
      )}
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={0} sx={{ border: "1px solid #dbeafe" }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <HomeWorkOutlined sx={{ color: "#0369a1" }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Total Loans
                </Typography>
              </Stack>
              <Typography variant="h5">{initialLoans.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={0} sx={{ border: "1px solid #dbeafe" }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <MonetizationOnOutlined sx={{ color: "#0369a1" }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Pipeline Value
                </Typography>
              </Stack>
              <Typography variant="h5">{formatCurrency(totalPipelineValue)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={0} sx={{ border: "1px solid #dbeafe" }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <AccountTreeOutlined sx={{ color: "#0369a1" }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Active / Underwriting
                </Typography>
              </Stack>
              <Typography variant="h5">
                {activeApplications} / {underwritingCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ border: "1px solid #dbeafe", p: 2.5 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Add New Application
        </Typography>
        <form onSubmit={handleCreateLoan}>
          <Stack spacing={2}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Input
                  value={borrowerName}
                  onChange={(event) => setBorrowerName(event.target.value)}
                  placeholder="Borrower full name"
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Input
                  value={propertyAddress}
                  onChange={(event) => setPropertyAddress(event.target.value)}
                  placeholder="Property address"
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Input
                  type="number"
                  min={0}
                  value={loanAmount}
                  onChange={(event) => setLoanAmount(event.target.value)}
                  placeholder="Loan amount (USD)"
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="priority-label">Priority</InputLabel>
                  <Select
                    labelId="priority-label"
                    label="Priority"
                    value={priority}
                    onChange={(event) => setPriority(event.target.value as LoanPriority)}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Input
                  type="date"
                  value={expectedCloseDate}
                  onChange={(event) => setExpectedCloseDate(event.target.value)}
                />
              </Grid>
            </Grid>
            <Stack direction="row" justifyContent="flex-end">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Create Application"}
              </Button>
            </Stack>
          </Stack>
        </form>
      </Paper>

      <Paper elevation={0} sx={{ border: "1px solid #dbeafe", p: 2.5 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Typography variant="h6">Loan Pipeline</Typography>
          <TextField
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            size="small"
            placeholder="Search by borrower, address, or stage"
            sx={{ width: { xs: "100%", md: 380 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Stack>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Borrower</TableCell>
                <TableCell>Property</TableCell>
                <TableCell align="right">Loan Amount</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Stage</TableCell>
                <TableCell>Expected Close</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLoans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No loans found. Add your first application above.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLoans.map((loan) => (
                  <TableRow key={loan.id} hover>
                    <TableCell>{loan.borrower_name}</TableCell>
                    <TableCell>{loan.property_address}</TableCell>
                    <TableCell align="right">{formatCurrency(loan.loan_amount)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={loan.priority.toUpperCase()}
                        color={priorityChipColor[loan.priority]}
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: 190 }}>
                      <FormControl fullWidth size="small">
                        <Select
                          value={loan.stage}
                          onChange={(event) =>
                            handleStageUpdate(loan.id, event.target.value as LoanStage)
                          }
                          renderValue={(value) => (
                            <Chip
                              size="small"
                              label={stageLabels[value as LoanStage]}
                              color={stageChipColor[value as LoanStage]}
                            />
                          )}
                        >
                          {stageOptions.map((stage) => (
                            <MenuItem key={stage} value={stage}>
                              {stageLabels[stage]}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      {loan.expected_close_date
                        ? formatIsoDate(loan.expected_close_date)
                        : "Not set"}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleDeleteLoan(loan.id)}
                      >
                        Archive
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Stack>
  );
}
