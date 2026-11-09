import { signOut } from "next-auth/react";

let signingOut = false;

// 백엔드 JWT가 만료되면 401이 오므로, 빈 화면 대신 로그인 페이지로 보냄
export async function authFetch(input: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status === 401 && !signingOut) {
    signingOut = true;
    await signOut({ callbackUrl: "/login" });
  }
  return res;
}
