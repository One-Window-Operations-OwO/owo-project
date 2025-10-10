export async function validateHisenseCookie(cookie: string): Promise<string | null> {
  try {
    // 1. Validate the current cookie
    const validationRes = await fetch("api/validate-cookie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cookie }),
    });

    const validationData = await validationRes.json();

    if (validationData.valid) {
      // Save the name if it's valid
      localStorage.setItem("nama", validationData.name);
      return validationData.name;
    }

    // 2. If cookie is invalid, try to re-login
    const username = localStorage.getItem("hisense_username");
    const password = localStorage.getItem("hisense_password");

    if (!username || !password) {
      return null; // No credentials to re-login
    }

    const loginRes = await fetch("api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const loginData = await loginRes.json();

    if (loginData.phpsessid) {
      localStorage.setItem("hisense_cookie", loginData.phpsessid);

      // 3. Validate the new cookie to get the name
      const newValidationRes = await fetch("api/validate-cookie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cookie: loginData.phpsessid }),
      });

      const newValidationData = await newValidationRes.json();
      if (newValidationData.valid) {
        localStorage.setItem("nama", newValidationData.name);
        return newValidationData.name;
      }
    }

    return null; // Re-login failed
  } catch (error) {
    console.error("Error validating Hisense cookie:", error);
    return null;
  }
}
