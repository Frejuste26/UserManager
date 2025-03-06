import nodemailer from 'nodemailer';
import { EMAIL_USER, EMAIL_PASS } from '../config.js';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    port: 587,
    secure: false, // true pour 465, false pour les autres ports
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS
    }
  });

  transporter.verify((error, success) => {
    if (error) {
      console.error("SMTP Connection Error:", error);
    } else {
      console.log("SMTP Ready to Send Emails");
    }
  });
  
  
  
  const sendMail = async (to, subject, text) => {
    try {
      const info = await transporter.sendMail({
        from: EMAIL_USER,
        to,
        subject,
        text,
      });
      console.log(`Email envoyé: ${info.messageId}`);
    } catch (error) {
      console.error("Erreur d'envoi d'email :", error);
    }
  };
  

export default sendMail;