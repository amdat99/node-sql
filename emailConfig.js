const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.mail.yahoo.com",
  port: 465,
  service: "yahoo",
  secure: false,
  auth: {
    user: "test334344334gggg@yahoo.com",
    pass: "fdelyattrxeracsv",
  },
  tls: {
    rejectUnauthorized: false,
  },
});

module.exports = { transporter };
