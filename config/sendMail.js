import { createTransport } from "nodemailer";

const sendMail = async ({ email, subject, html }) => {
  const transport = createTransport({
    host: "smt.gmail.com",
    port: 465,
    auth: {
      user: "sldfjsd",
      pass: "dsjflsd",
    },
  });
  await transport.sendMail({
    from: "sfdsfd",
    to: email,
    subject,
    html,
  });
};

export default sendMail;