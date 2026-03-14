"use client";

import { Box } from "@mui/material";

const pieces = Array.from({ length: 18 }, (_, index) => index);

export function ConfettiBurst({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <Box sx={{ pointerEvents: "none", position: "absolute", inset: 0, overflow: "hidden" }}>
      {pieces.map((piece) => (
        <Box
          key={piece}
          sx={{
            position: "absolute",
            left: `${10 + piece * 5}%`,
            top: "-12px",
            width: 10,
            height: 18,
            borderRadius: 999,
            bgcolor: piece % 2 === 0 ? "#1565C0" : "#F59E0B",
            animation: `confettiDrop 1.6s ease-out ${piece * 40}ms forwards`,
            opacity: 0.9,
            transform: `rotate(${piece * 24}deg)`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes confettiDrop {
          0% {
            opacity: 0;
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          20% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate3d(0, 180px, 0) rotate(260deg);
          }
        }
      `}</style>
    </Box>
  );
}
