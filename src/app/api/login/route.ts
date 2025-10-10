import { NextResponse } from "next/server";

async function loginHisense(username: string, password: string) {
  const response = await fetch(`${process.env.HISENSE_BASE_URL}login_p.php`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: `username=${username}&password=${password}`,
    redirect: "manual",
  });

  const cookie = response.headers.get("set-cookie");
  if (!cookie) {
    throw new Error("Login failed: No cookie received.");
  }

  const phpsessid = cookie.split(";")[0].split("=")[1];
  return { phpsessid };
}

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    const result = await loginHisense(username, password);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
