const Imap = require('imap');
const { simpleParser } = require('mailparser');
require('dotenv').config(); // Loads .env variables

const imapConfig = {
  user: process.env.EMAIL_USER,
  password: process.env.EMAIL_PASS,
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  tls: true
};

function fetchPlacementEmails(callback) {
  const imap = new Imap(imapConfig);

  imap.once('ready', () => {
    imap.openBox('INBOX', true, (err, box) => {
      if (err) throw err;

      const fetcher = imap.seq.fetch(`${box.messages.total - 10}:*`, {
        bodies: '',
        struct: true
      });

      const emails = [];

      fetcher.on('message', (msg) => {
        msg.on('body', (stream) => {
          simpleParser(stream, (err, parsed) => {
            if (err) throw err;
            const { subject, text } = parsed;

            emails.push({ subject, text });
          });
        });
      });

      fetcher.once('end', () => {
        imap.end();
        callback(emails);
      });
    });
  });

  imap.once('error', (err) => {
    console.error('IMAP error:', err);
  });

  imap.connect();
}

module.exports = { fetchPlacementEmails };
