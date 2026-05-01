const cron = require("node-cron");
const FDAlert = require("../models/FDAlert");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "your_email@gmail.com",
    pass: "your_app_password",
  },
});

cron.schedule("* * * * *", async () => {
  console.log("Checking FD alerts...");

  const today = new Date();

  const alerts = await FDAlert.find({
    maturityDate: { $lte: today },
  });

  for (let alert of alerts) {
    await transporter.sendMail({
      from: "your_email@gmail.com",
      to: alert.email,
      subject: "FD Maturity Alert",
      text: `Your FD of ₹${alert.amount} in ${alert.bank} has matured.`,
    });

    console.log("Email sent for:", alert._id);
  }
});

module.exports = {};