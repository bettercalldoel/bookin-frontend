"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(
      "Jika email terdaftar, kami akan kirim instruksi reset password.",
    );
  };

  return (
    <div className="py-20">
      <div className="flex h-full items-center justify-center px-6">
        <div className="flex h-full w-full max-w-md flex-col items-center justify-center rounded-lg border border-gray-200 bg-white shadow-md">
          <div className="flex h-full w-full flex-col justify-center gap-4 p-6">
            <div className="inline-block px-2 py-2.5 sm:px-4">
              <form className="flex flex-col gap-4 pb-4" onSubmit={handleSubmit}>
                <h1 className="mb-2 text-2xl font-bold text-gray-900">
                  Forgot Password
                </h1>
                <p className="text-sm text-gray-500">
                  Masukkan email untuk menerima instruksi reset password.
                </p>
                <div>
                  <div className="mb-2">
                    <label
                      className="text-sm font-medium text-gray-900"
                      htmlFor="email"
                    >
                      Email
                    </label>
                  </div>
                  <div className="flex w-full rounded-lg pt-1">
                    <div className="relative w-full">
                      <input
                        id="email"
                        type="email"
                        placeholder="email@example.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-cyan-500 focus:ring-cyan-500"
                        required
                      />
                    </div>
                  </div>
                </div>
                {message ? (
                  <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs text-emerald-700">
                    {message}
                  </p>
                ) : null}
                <div className="flex flex-col gap-2">
                  <button
                    type="submit"
                    className="rounded-lg border border-transparent bg-sky-600 p-0.5 text-white transition-colors hover:bg-sky-700 active:bg-sky-800"
                  >
                    <span className="flex items-center justify-center gap-1 px-2.5 py-1 text-base font-medium">
                      Kirim instruksi
                    </span>
                  </button>
                  <a
                    href="/login"
                    className="rounded-lg border border-gray-200 bg-white p-2 text-center text-sm font-semibold text-gray-700 hover:bg-gray-100"
                  >
                    Kembali ke Login
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
