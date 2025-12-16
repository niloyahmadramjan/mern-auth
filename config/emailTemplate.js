export const getOtpHtml = ({ email, otp }) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Authentication App - OTP Verification</title>
<style>
  body {
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background-color: #f4f6f9;
    color: #111;
  }
  .container {
    max-width: 600px;
    margin: 40px auto;
    background: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    border: 1px solid #e0e0e0;
  }
  .header {
    background-color: #111827;
    padding: 20px;
    text-align: center;
  }
  .header .brand {
    color: #fff;
    font-size: 18px;
    font-weight: 700;
    text-decoration: none;
  }
  .body {
    padding: 32px 24px;
    text-align: center;
  }
  .body h1 {
    font-size: 22px;
    margin-bottom: 16px;
    color: #111827;
  }
  .body p {
    font-size: 15px;
    color: #555;
    margin-bottom: 24px;
  }
  .otp {
    display: inline-block;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 16px 24px;
    font-size: 32px;
    letter-spacing: 10px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 24px;
  }
  .footer {
    padding: 16px 24px;
    font-size: 12px;
    text-align: center;
    color: #9ca3af;
  }
  @media only screen and (max-width: 600px) {
    .container { width: 90% !important; }
    .otp { font-size: 28px; letter-spacing: 6px; }
  }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <a class="brand">Authentication App</a>
  </div>
  <div class="body">
    <h1>Verify your email - ${email}</h1>
    <p>Enter the verification code below to complete your sign-in.</p>
    <div class="otp">${otp}</div>
    <p>This code will expire in <strong>5 minutes</strong>.</p>
    <p>If you did not request this, you can safely ignore this email.</p>
  </div>
  <div class="footer">© ${new Date().getFullYear()} Authentication App. All rights reserved.</div>
</div>
</body>
</html>
`;
  return html;
};

export const getVerifyEmailHtml = ({ email, token }) => {
  const appName = process.env.APP_NAME || "Next Hub Pro";
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl.replace(/\/+$/, "")}/token/${encodeURIComponent(token)}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${appName} - Verify Your Account</title>
<style>
  body {
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background-color: #f4f6f9;
    color: #111;
  }
  .container {
    max-width: 600px;
    margin: 40px auto;
    background: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    border: 1px solid #e0e0e0;
  }
  .header {
    background-color: #111827;
    padding: 20px;
    text-align: center;
  }
  .header .brand {
    color: #fff;
    font-size: 18px;
    font-weight: 700;
    text-decoration: none;
  }
  .body {
    padding: 32px 24px;
    text-align: center;
  }
  .body h1 {
    font-size: 22px;
    margin-bottom: 16px;
    color: #111827;
  }
  .body p {
    font-size: 15px;
    color: #555;
    margin-bottom: 16px;
  }
  .btn {
    display: inline-block;
    background-color: #111827;
    color: #fff !important;
    text-decoration: none;
    padding: 14px 24px;
    border-radius: 8px;
    font-weight: 600;
    margin: 16px 0;
  }
  .link {
    word-break: break-all;
    color: #111827;
    text-decoration: underline;
  }
  .footer {
    padding: 16px 24px;
    font-size: 12px;
    text-align: center;
    color: #9ca3af;
  }
  @media only screen and (max-width: 600px) {
    .container { width: 90% !important; }
  }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <a class="brand">${appName}</a>
  </div>
  <div class="body">
    <h1>Verify your account - ${email}</h1>
    <p>Thanks for registering with ${appName}. Click the button below to verify your account.</p>
    <a class="btn" href="${verifyUrl}" target="_blank" rel="noopener">Verify Account</a>
    <p>If the button doesn’t work, copy and paste this link into your browser:</p>
    <p class="link"><a href="${verifyUrl}" target="_blank" rel="noopener">${verifyUrl}</a></p>
    <p>If you didn’t request this, you can safely ignore this email.</p>
  </div>
  <div class="footer">© ${new Date().getFullYear()} ${appName}. All rights reserved.</div>
</div>
</body>
</html>`;
  return html;
};
