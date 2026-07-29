"use client";

import type { ReactNode } from "react";

export function StepHeading({ children }: { children: ReactNode }) {
  return (
    <h1 className="text-2xl font-bold text-edaphos-black sm:text-3xl">
      {children}
    </h1>
  );
}

export function BigChoiceButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border-4 px-6 py-6 text-left text-xl font-semibold transition-colors ${
        selected
          ? "border-edaphos-green bg-edaphos-green text-white"
          : "border-neutral-200 bg-white text-edaphos-black hover:border-edaphos-green"
      }`}
    >
      {label}
    </button>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-2xl bg-edaphos-green px-6 py-5 text-xl font-bold text-white transition-colors hover:bg-edaphos-green-dark disabled:cursor-not-allowed disabled:bg-neutral-300"
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border-2 border-neutral-300 bg-white px-6 py-4 text-lg font-semibold text-edaphos-black hover:border-edaphos-black"
    >
      {children}
    </button>
  );
}

export function TextField({
  label,
  value,
  onChange,
  autoFocus,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  inputMode?: "text" | "decimal";
}) {
  return (
    <label className="flex flex-col gap-2 text-lg font-medium text-edaphos-black">
      {label}
      <input
        autoFocus={autoFocus}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border-2 border-neutral-300 px-4 py-4 text-xl focus:border-edaphos-green focus:outline-none"
      />
    </label>
  );
}

export function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200">
        <div
          className="h-full rounded-full bg-edaphos-green transition-all"
          style={{ width: `${((step + 1) / total) * 100}%` }}
        />
      </div>
      <span className="whitespace-nowrap text-sm font-medium text-neutral-500">
        Schritt {step + 1} / {total}
      </span>
    </div>
  );
}
