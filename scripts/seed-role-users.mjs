import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing. Add it to .env and retry.");
}

if (!serviceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing. Add it to .env and retry.");
}

export const ROLE_SEED_USERS = [
  {
    role: "borrower",
    email: "borrower.seed@smartmortgagepro.test",
    password: "SeedUser123!",
    fullName: "Borrower Seed",
  },
  {
    role: "loan_officer",
    email: "loan.officer.seed@smartmortgagepro.test",
    password: "SeedUser123!",
    fullName: "Loan Officer Seed",
  },
  {
    role: "processor",
    email: "processor.seed@smartmortgagepro.test",
    password: "SeedUser123!",
    fullName: "Processor Seed",
  },
  {
    role: "underwriter",
    email: "underwriter.seed@smartmortgagepro.test",
    password: "SeedUser123!",
    fullName: "Underwriter Seed",
  },
  {
    role: "admin",
    email: "admin.seed@smartmortgagepro.test",
    password: "SeedUser123!",
    fullName: "Admin Seed",
  },
];

function createAdminClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function listAllUsers(admin) {
  const users = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw error;
    }

    const batch = data?.users ?? [];
    users.push(...batch);

    if (batch.length < perPage) {
      break;
    }

    page += 1;
  }

  return users;
}

async function ensureAuthUser(admin, seedUser, existingByEmail) {
  const existing = existingByEmail.get(seedUser.email);

  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      email: seedUser.email,
      password: seedUser.password,
      email_confirm: true,
      user_metadata: {
        full_name: seedUser.fullName,
        seeded_role: seedUser.role,
      },
    });

    if (error) {
      throw error;
    }

    return data.user;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: seedUser.email,
    password: seedUser.password,
    email_confirm: true,
    user_metadata: {
      full_name: seedUser.fullName,
      seeded_role: seedUser.role,
    },
  });

  if (error) {
    throw error;
  }

  return data.user;
}

export async function ensureRoleSeedUsers() {
  const admin = createAdminClient();
  const existingUsers = await listAllUsers(admin);
  const existingByEmail = new Map(
    existingUsers
      .map((user) => [user.email, user])
      .filter(([email]) => typeof email === "string"),
  );

  const provisionedUsers = [];

  for (const seedUser of ROLE_SEED_USERS) {
    const authUser = await ensureAuthUser(admin, seedUser, existingByEmail);

    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: authUser.id,
        full_name: seedUser.fullName,
        role: seedUser.role,
      },
      { onConflict: "id" },
    );

    if (profileError) {
      throw profileError;
    }

    provisionedUsers.push({
      role: seedUser.role,
      email: seedUser.email,
      password: seedUser.password,
      userId: authUser.id,
    });
  }

  return provisionedUsers;
}
