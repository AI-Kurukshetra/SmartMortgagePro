import Link from "next/link";

export const metadata = {
  title: "Verify Email | SmartMortgage Pro",
};

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#EEF2FF] px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-[0_24px_60px_-25px_rgba(15,23,42,0.25)]">
        <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
        <p className="mt-3 text-sm text-gray-600">
          We sent a verification link to your inbox. Confirm it to finish account setup.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm font-medium text-[#3B4FE4]">
          Back to login
        </Link>
      </div>
    </main>
  );
}
