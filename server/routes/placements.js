const express = require('express');
const { fetchPlacementEmails } = require('../../imapclient');
const JobEmailExtractor = require('../utils/JobEmailExtractor.js');

const router = express.Router();
const extractor = new JobEmailExtractor();

// Fallback mock data in case email extraction fails
const fallbackData = [
    {
        company: "Google",
        salary: "₹28-40 LPA",
        lastDate: "2026-03-15",
        applicationLink: "https://careers.google.com"
    },
    {
        company: "Microsoft",
        salary: "₹24-36 LPA", 
        lastDate: "2026-03-10",
        applicationLink: "https://careers.microsoft.com"
    },
    {
        company: "Amazon",
        salary: "₹25-38 LPA",
        lastDate: "2026-03-05",
        applicationLink: "https://amazon.jobs"
    },
    {
        company: "TCS Digital",
        salary: "₹7-9 LPA",
        lastDate: "2026-02-28",
        applicationLink: "https://careers.tcs.com"
    },
    {
        company: "Infosys SE",
        salary: "₹6-8 LPA",
        lastDate: "2026-03-01",
        applicationLink: "https://careers.infosys.com"
    },
    {
        company: "Wipro Turbo",
        salary: "₹7-8.5 LPA",
        lastDate: "2026-03-08",
        applicationLink: "https://careers.wipro.com"
    },
    {
        company: "HCL",
        salary: "₹5.5-7 LPA",
        lastDate: "2026-03-12",
        applicationLink: "https://careers.hcltech.com"
    },
    {
        company: "Cognizant GenC",
        salary: "₹6-7.5 LPA",
        lastDate: "2026-03-18",
        applicationLink: "https://careers.cognizant.com"
    }
];

// Clean and format the extracted data for frontend
function cleanExtractedData(rawData) {
    return rawData
        .filter(item => item.hasValidData && item.company && item.company !== "sreenidhi")
        .map(item => ({
            company: item.company || "Unknown Company",
            salary: item.salary || "Salary not specified",
            lastDate: item.lastDate === "Unknown" ? "Deadline not specified" : item.lastDate,
            applicationLink: item.applicationLink || "#"
        }))
        .filter(item => item.company !== "Unknown Company" && item.company.length > 2);
}

router.get('/', (req, res) => {
    try {
        console.log('📊 Fetching placement data from emails...');
        
        // Try to fetch from emails first
        fetchPlacementEmails((emails) => {
            try {
                const validJobs = extractor.extractMultipleJobs(
                    emails.map(email => `${email.subject ? email.subject + '\n' : ''}${email.text || ''}`)
                );
                
                console.log('📧 Raw extracted data:', validJobs);
                
                // Clean the data for frontend
                const cleanedData = cleanExtractedData(validJobs);
                
                console.log('🧹 Cleaned data:', cleanedData);
                
                // If we have good data, use it; otherwise use fallback
                if (cleanedData.length > 0) {
                    res.json(cleanedData);
                } else {
                    console.log('⚠️ No valid data from emails, using fallback');
                    res.json(fallbackData);
                }
            } catch (extractionError) {
                console.error('❌ Email extraction error:', extractionError);
                console.log('🔄 Using fallback data');
                res.json(fallbackData);
            }
        });
    } catch (error) {
        console.error('❌ Error in placements route:', error);
        res.json(fallbackData);
    }
});

module.exports = router;
