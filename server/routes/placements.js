const express = require('express');
const { fetchPlacementEmails } = require('../../imapclient');

const router = express.Router();

router.get('/api/placements', (req, res) => {
  fetchPlacementEmails((emails) => {
    const parsedData = emails.map(email => {
      const { subject, text } = email;

      const name = extractCompanyName(text, subject);
      const ctc = extractCTC(text);
      const lastDate = extractLastDate(text);
      const applied = false;

      return { name, ctc, lastDate, applied };
    });

    res.json(parsedData);
  });
});

function extractCompanyName(text, subject) {
  // Try subject first if it's a company name
  if (subject && /^[A-Za-z\s]+$/.test(subject.trim())) return subject.trim();

  // Search for common intro lines: "Infosys is conducting...", "Accordion is hiring..."
  const match = text.match(/(?:Dear Students,)?\s*([A-Za-z\s&]+?) (?:is conducting|is hiring|specializes|invites|presents|campus drive)/i);
  if (match) return match[1].trim();

  return 'Unknown Company';
}

function extractCTC(text) {
  // Match CTC-like values: "INR 9.5 LPA", "6.5 LPA", "7-10LPA"
  const match = text.match(/(?:INR\s*)?([\d.]+(?:\s*-\s*[\d.]+)?\s*LPA)/i);
  return match ? `₹${match[1].replace(/\s+/g, '')}` : 'N/A';
}

function extractLastDate(text) {
  // Try to match formats like "before 5th June", "on 6th June", "by 7 June"
  const dateMatch = text.match(/(?:before|on|by)?\s*(\d{1,2})(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)/i);
  if (!dateMatch) return 'Unknown';

  const day = dateMatch[1].padStart(2, '0');
  const month = convertMonthToNumber(dateMatch[2]);
  const year = new Date().getFullYear(); // Assuming it's this year

  return `${year}-${month}-${day}`;
}

function convertMonthToNumber(monthName) {
  const months = {
    january: '01', february: '02', march: '03', april: '04',
    may: '05', june: '06', july: '07', august: '08',
    september: '09', october: '10', november: '11', december: '12'
  };
  return months[monthName.toLowerCase()] || '01';
}

module.exports = router;
// This route handles fetching placement emails and parsing them into a structured format
// It extracts company names, CTC, and last date from the email content
// The extracted data is then returned as a JSON response
// The functions `extractCompanyName`, `extractCTC`, and `extractLastDate`
// are used to parse the relevant information from the email text
// The `convertMonthToNumber` function converts month names to their respective numeric values
// The route is set up to respond to GET requests at the path '/api/placements'
// The `fetchPlacementEmails` function is called to retrieve the latest emails
// The parsed data is structured as an array of objects with properties: name, ctc, lastDate, and applied
// The `applied` field is set to false by default, indicating that the user has not applied yet
// The response is sent back to the client in JSON
// The route is exported for use in the main application file
// This code is part of a Node.js application that integrates with an IMAP email client
// to fetch and parse placement-related emails for a college or university
// The emails are expected to contain information about job placements, including company names, CTC, and application deadlines
// The application is designed to help students keep track of placement opportunities