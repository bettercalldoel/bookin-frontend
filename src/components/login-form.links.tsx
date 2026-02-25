"use client";

import type { LoginCopy } from "@/components/login-form.copy";

type LoginFormLinksProps = {
  isTenantLogin: boolean;
  copy: LoginCopy;
};

export default function LoginFormLinks({
  isTenantLogin,
  copy,
}: LoginFormLinksProps) {
  if (isTenantLogin) {
    return (
      <>
        <p>
          {copy.noTenantAccount}{" "}
          <a
            className="font-semibold text-cyan-700 transition hover:text-cyan-800"
            href="/tenant-register"
          >
            {copy.registerTenant}
          </a>
        </p>
        <p>
          {copy.loginAsUser}{" "}
          <a
            className="font-semibold text-cyan-700 transition hover:text-cyan-800"
            href="/login"
          >
            {copy.userLogin}
          </a>
        </p>
      </>
    );
  }

  return (
    <>
      <p>
        {copy.noAccount}{" "}
        <a
          className="font-semibold text-cyan-700 transition hover:text-cyan-800"
          href="/register"
        >
          {copy.registerAccount}
        </a>
      </p>
      <p>
        {copy.wantTenant}{" "}
        <a
          className="font-semibold text-cyan-700 transition hover:text-cyan-800"
          href="/tenant-register"
        >
          {copy.registerTenant}
        </a>
      </p>
    </>
  );
}
