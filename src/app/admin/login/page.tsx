"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/lib/actions/auth";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-4">
      <div className="text-center">
        <h1 className="text-xl font-black text-edaphos-green">EDAPHOS</h1>
        <p className="text-sm text-neutral-500">Admin-Anmeldung</p>
      </div>
      <form action={formAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          E-Mail
          <input
            name="email"
            type="email"
            required
            className="rounded-lg border-2 border-neutral-300 px-3 py-2 focus:border-edaphos-green focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Passwort
          <input
            name="password"
            type="password"
            required
            className="rounded-lg border-2 border-neutral-300 px-3 py-2 focus:border-edaphos-green focus:outline-none"
          />
        </label>
        {state.error && (
          <p className="text-sm font-medium text-red-600">{state.error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-edaphos-green px-4 py-2 font-semibold text-white hover:bg-edaphos-green-dark disabled:bg-neutral-300"
        >
          {pending ? "Anmelden…" : "Anmelden"}
        </button>
      </form>
    </div>
  );
}
