const cron = require("node-cron");
const mongoose = require("mongoose");
const { sendMaturityAlert } = require("./emailService");

// Reuse Alert model
const alertSchema = new mongoose.Schema(
  {
    amount: Number,
    bank: String,
    maturityDate: String, // can later change to Date
    email: String,
  },
  { timestamps: true }
);

const Alert = mongoose.models.Alert || mongoose.model("Alert", alertSchema);

function startAlertCron() {
  // ✅ Runs every day at 9:00 AM (PRODUCTION)
  cron.schedule("0 9 * * *", async () => {
    console.log("🕘 Running daily FD maturity check...");

    try {
      const alerts = await Alert.find();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const alert of alerts) {
        const maturity = new Date(alert.maturityDate);
        maturity.setHours(0, 0, 0, 0);

        const daysLeft = Math.ceil(
          (maturity - today) / (1000 * 60 * 60 * 24)
        );

        // ✅ Send email only on 30, 7, 1 days
        if ([30, 7, 1].includes(daysLeft)) {
          try {
            await sendMaturityAlert({
              email: alert.email,
              bank: alert.bank,
              amount: alert.amount,
              maturityDate: alert.maturityDate,
              daysLeft,
            });

            console.log(
              `📧 Alert sent (${daysLeft} days left) to: ${alert.email}`
            );
          } catch (emailErr) {
            console.error(
              `❌ Email failed for ${alert.email}:`,
              emailErr.message
            );
          }
        }
      }

      console.log(`✅ Alert check complete. ${alerts.length} alerts checked.`);
    } catch (err) {
      console.error("❌ Cron job error:", err.message);
    }
  });

  console.log("⏰ FD alert cron job started — runs daily at 9:00 AM");
}

// 🧪 Manual test (trigger instantly)
async function testAlertNow() {
  console.log("🧪 Testing alert emails now...");

  try {
    const alerts = await Alert.find();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const alert of alerts) {
      const maturity = new Date(alert.maturityDate);
      maturity.setHours(0, 0, 0, 0);

      const daysLeft = Math.ceil(
        (maturity - today) / (1000 * 60 * 60 * 24)
      );

      if (daysLeft > 0 && daysLeft <= 30) {
        await sendMaturityAlert({
          email: alert.email,
          bank: alert.bank,
          amount: alert.amount,
          maturityDate: alert.maturityDate,
          daysLeft,
        });
      }
    }

    console.log("✅ Test emails sent!");
  } catch (err) {
    console.error("❌ Test failed:", err.message);
  }
}

module.exports = { startAlertCron, testAlertNow };