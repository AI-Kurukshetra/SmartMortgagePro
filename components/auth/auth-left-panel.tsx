export function AuthLeftPanel() {
  return (
    <div className="relative hidden overflow-hidden rounded-l-2xl bg-[#EEF2FF] p-10 lg:flex lg:flex-col lg:items-center lg:justify-center">
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage: "radial-gradient(#C7D2FE 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-7 text-center">
        <svg
          width="280"
          height="150"
          viewBox="0 0 280 150"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <polyline
            points="20,120 70,95 120,105 170,70 220,82 260,46"
            stroke="#3B4FE4"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {[20, 70, 120, 170, 220, 260].map((x, index) => {
            const y = [120, 95, 105, 70, 82, 46][index];
            return <circle key={x} cx={x} cy={y} r="5" fill="#3B4FE4" />;
          })}
        </svg>

        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#3B4FE4] text-2xl text-white">
          →
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl font-extrabold text-[#3B4FE4]">SmartMortgage Pro</h2>
          <p className="mx-auto max-w-[260px] text-sm text-gray-500">
            Powering loan origination with speed, transparency, and confident execution.
          </p>
        </div>
      </div>
    </div>
  );
}
