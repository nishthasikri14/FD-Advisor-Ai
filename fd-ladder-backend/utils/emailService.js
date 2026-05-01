const nodemailer = require("nodemailer");
console.log("USER:", process.env.EMAIL_USER);
console.log("PASS:", process.env.EMAIL_PASS);
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
});

async function sendMaturityAlert({ email, bank, amount, maturityDate, daysLeft }) {
  const formattedAmount = "₹" + Number(amount).toLocaleString("en-IN");
  const formattedDate = new Date(maturityDate).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });

  const mailOptions = {
    from: `"FD Advisor" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `🔔 FD Alert: Your ${bank} FD matures in ${daysLeft} day${daysLeft === 1 ? "" : "s"}!`,
    html: `
      <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #f8fafc; padding: 24px; border-radius: 16px;">
        <div style="background: linear-gradient(135deg, #1D9E75, #378ADD); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: #fff; margin: 0; font-size: 22px;">🔔 FD Maturity Alert</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Your Fixed Deposit is maturing soon!</p>
        </div>

        <div style="background: #fff; border-radius: 12px; padding: 20px; margin-bottom: 16px; border: 1px solid #e5e7eb;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; color: #888; font-size: 13px; border-bottom: 1px solid #f0f0f0;">Bank</td>
              <td style="padding: 10px 0; color: #111; font-size: 13px; font-weight: 600; text-align: right; border-bottom: 1px solid #f0f0f0;">${bank}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #888; font-size: 13px; border-bottom: 1px solid #f0f0f0;">Amount</td>
              <td style="padding: 10px 0; color: #1D9E75; font-size: 16px; font-weight: 700; text-align: right; border-bottom: 1px solid #f0f0f0;">${formattedAmount}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #888; font-size: 13px; border-bottom: 1px solid #f0f0f0;">Maturity Date</td>
              <td style="padding: 10px 0; color: #111; font-size: 13px; font-weight: 600; text-align: right; border-bottom: 1px solid #f0f0f0;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #888; font-size: 13px;">Days Remaining</td>
              <td style="padding: 10px 0; text-align: right;">
                <span style="background: ${daysLeft <= 3 ? "#FBEAF0" : "#FAEEDA"}; color: ${daysLeft <= 3 ? "#D4537E" : "#BA7517"}; padding: 4px 10px; border-radius: 8px; font-size: 13px; font-weight: 600;">
                  ${daysLeft} day${daysLeft === 1 ? "" : "s"} left
                </span>
              </td>
            </tr>
          </table>
        </div>

        <div style="background: #E1F5EE; border-radius: 10px; padding: 14px 16px; margin-bottom: 16px;">
          <p style="margin: 0; color: #0F6E56; font-size: 13px; line-height: 1.6;">
            💡 <strong>Tip:</strong> Consider reinvesting in an FD ladder to maximize returns and maintain liquidity. Visit FD Advisor to build your strategy.
          </p>
        </div>

        <p style="text-align: center; color: #aaa; font-size: 11px; margin: 0;">
          This is an automated alert from FD Advisor. To stop receiving alerts, delete this alert from your dashboard.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`✅ Alert email sent to ${email} for ${bank} FD`);
}

module.exports = { sendMaturityAlert };