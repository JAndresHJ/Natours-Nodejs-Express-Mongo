import nodemailer from 'nodemailer';

interface EmailOptions {
  email: string;
  subject: string;
  message: string;
}

const sendEmail = async (options: EmailOptions) => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    // Activate n gmail "less secure app" option
  });

  // 2) Define te email options
  const mailOptions = {
    from: 'Andres Hernandez <test1@test.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    //html
  };

  // 3) Send email
  await transporter.sendMail(mailOptions);
};

export default sendEmail;
