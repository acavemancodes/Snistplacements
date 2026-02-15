

class JobEmailExtractor {
    constructor() {
        // Improved patterns with better company name detection
        this.patterns = {
            company: [
                // High priority - explicit company mentions with better validation
                { regex: /(?:company|organization|firm|corporation):\s*([A-Z][a-zA-Z0-9\s&.,'-]{2,30})(?:\s+(?:is|are|has|invites|seeks|looking|hiring|recruiting))?/gi, score: 100 },
                { regex: /(?:from|by|at|with)\s+([A-Z][a-zA-Z0-9\s&.,'-]{2,30}?)(?:\s+(?:is|are|has|invites|seeks|looking|hiring|recruiting))/gi, score: 95 },
                { regex: /([A-Z][a-zA-Z0-9\s&.,'-]{2,30}?)\s+(?:is|are)\s+(?:hiring|recruiting|looking|seeking)/gi, score: 90 },
                { regex: /join\s+(?:our\s+team\s+at\s+|us\s+at\s+)?([A-Z][a-zA-Z0-9\s&.,'-]{2,30}?)(?:\s+as|\s+for|\s+in|\s+!)/gi, score: 88 },
                // Better company suffix detection
                { regex: /([A-Z][a-zA-Z0-9\s&.,'-]{2,30}?)\s+(?:technologies|tech|systems|solutions|services|consulting|software|pvt|ltd|inc|corp|limited|company)/gi, score: 85 },
                // Medium priority - contextual mentions
                { regex: /(?:career|job|position|opportunity)\s+(?:at|with)\s+([A-Z][a-zA-Z0-9\s&.,'-]{2,30})/gi, score: 80 },
                { regex: /([A-Z][a-zA-Z0-9\s&.,'-]{2,30}?)\s+(?:career|job|position|opportunity|opening)/gi, score: 75 },
                // Email domain extraction with better filtering
                { regex: /from:\s*.*?@([a-zA-Z0-9.-]+)\.(?:com|org|net|edu|gov)/gi, score: 60 },
                { regex: /@([a-zA-Z0-9.-]+)\.(?:com|org|net|edu|gov)/gi, score: 50 }
            ],
            
            salary: [
                // Improved salary patterns for Indian context
                { regex: /(?:salary|pay|compensation|package|ctc|offering)[:;\s]*(?:is|of|up\s+to|starts?\s+at|ranges?\s+from)?\s*[$₹£€¥]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:[-–—]\s*[$₹£€¥]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?))?(?:\s*(?:k|thousand|lakh|lakhs|crore|crores|million|per\s+annum|annually|yearly|monthly|hourly|lpa))?/gi, score: 95 },
                { regex: /(\d{1,2}(?:\.\d{1,2})?)\s*[-–—]?\s*(\d{1,2}(?:\.\d{1,2})?)\s*(?:lpa|lakhs?\s+per\s+annum)/gi, score: 90 },
                { regex: /[$₹£€¥]\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:k|thousand|lakh|lakhs|crore|crores|million)?\s*[-–—]\s*[$₹£€¥]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:k|thousand|lakh|lakhs|crore|crores|million)?/gi, score: 85 },
                { regex: /ctc[:;\s]*(?:of|is|up\s+to)?\s*[$₹£€¥]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:k|thousand|lakh|lakhs|crore|crores|million|lpa)?/gi, score: 80 },
                // Additional patterns for salary ranges
                { regex: /(?:package|salary)\s+(?:of|is|ranges?\s+from)?\s*(\d{1,2}(?:\.\d{1,2})?)\s*[-–—]\s*(\d{1,2}(?:\.\d{1,2})?)\s*lpa/gi, score: 85 }
            ],
            
            lastDate: [
                // Improved date patterns
                { regex: /(?:last\s+date|deadline|due\s+date|apply\s+by|submit\s+by|closing\s+date|final\s+date|expires?\s+on|valid\s+till|applications?\s+close)[:;\s]*(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/gi, score: 100 },
                { regex: /(?:last\s+date|deadline|due\s+date|apply\s+by|submit\s+by|closing\s+date|final\s+date|expires?\s+on|valid\s+till|applications?\s+close)[:;\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/gi, score: 95 },
                { regex: /(?:before|by|until|till)[:;\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/gi, score: 85 },
                { regex: /(?:last\s+date|deadline|apply\s+by)[:;\s]*(\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{2,4})/gi, score: 90 },
                // Additional date patterns
                { regex: /(?:apply|submit|send)\s+(?:by|before|until)\s+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/gi, score: 80 }
            ],
            
            applicationLink: [
                // Improved link patterns
                { regex: /(?:apply\s+(?:here|now|at)?[:;\s]*|application\s+link[:;\s]*|click\s+here[:;\s]*|visit[:;\s]*|link[:;\s]*)(https?:\/\/[^\s<>"']+)/gi, score: 95 },
                { regex: /https?:\/\/(?:www\.)?(?:careers|jobs|apply|hiring|recruitment|talent|hr)[^\s<>"']+/gi, score: 90 },
                { regex: /https?:\/\/(?:www\.)?(?:linkedin\.com\/jobs|indeed\.com|glassdoor\.com|naukri\.com|monster\.com)[^\s<>"']*/gi, score: 85 },
                { regex: /https?:\/\/[^\s<>"']*\/(?:careers|jobs|apply|hiring|join-us|work-with-us)[^\s<>"']*/gi, score: 80 },
                // Additional link patterns
                { regex: /(?:application|apply|register)\s+(?:at|here):\s*(https?:\/\/[^\s<>"']+)/gi, score: 85 }
            ],
            
            position: [
                // Improved position patterns
                { regex: /(?:position|role|job\s+title|designation)[:;\s]*([A-Z][a-zA-Z0-9\s\-_\/&.,]{3,50}?)(?:\s+at|\s+with|\s+in|\s+\(|\s*$)/gi, score: 95 },
                { regex: /(?:hiring|recruiting|seeking|looking)\s+(?:for\s+)?(?:a\s+|an\s+)?([A-Z][a-zA-Z0-9\s\-_\/&.,]{3,50}?)(?:\s+at|\s+with|\s+in|\s+\(|\s*$)/gi, score: 90 },
                { regex: /we\s+are\s+hiring\s+(?:for\s+)?(?:a\s+|an\s+)?([A-Z][a-zA-Z0-9\s\-_\/&.,]{3,50}?)(?:\s+at|\s+with|\s+in|\s+\(|\s*$)/gi, score: 85 },
                { regex: /join\s+us\s+as\s+(?:a\s+|an\s+)?([A-Z][a-zA-Z0-9\s\-_\/&.,]{3,50}?)(?:\s+at|\s+with|\s+in|\s+\(|\s*$)/gi, score: 80 },
                // Additional position patterns
                { regex: /(?:open\s+position|vacancy|opportunity)\s+(?:for\s+)?([A-Z][a-zA-Z0-9\s\-_\/&.,]{3,50}?)/gi, score: 75 }
            ]
        };

        // Enhanced validation sets with more specific terms
        this.invalidCompanyTerms = new Set([
            'job', 'career', 'position', 'role', 'work', 'hiring', 'apply', 'application', 
            'email', 'mail', 'www', 'http', 'https', 'team', 'department', 'alert', 
            'security', 'notification', 'message', 'system', 'automatic', 'noreply',
            'kindly', 'prepare', 'accordingly', 'please', 'note', 'important', 'urgent',
            'deadline', 'submit', 'send', 'reply', 'forward', 'cc', 'bcc', 'subject',
            'regards', 'best', 'thanks', 'thank', 'you', 'your', 'sincerely'
        ]);
        
        this.jobTitleBonus = /\b(developer|engineer|manager|analyst|specialist|consultant|executive|coordinator|assistant|intern|trainee|associate|lead|senior|junior|software|data|frontend|backend|fullstack|devops|qa|test|design|ui|ux|product|project|business|marketing|sales|hr|finance|admin|support)\b/i;
        this.companyBonus = /\b(technologies|tech|systems|solutions|services|consulting|software|inc|ltd|corp|pvt|limited|company|co|enterprises|ventures|group|industries)\b/i;
    }

    // Enhanced extraction with better validation
    extractData(text, type, processor) {
        const results = [];
        const patterns = this.patterns[type];
        
        patterns.forEach(({ regex, score }) => {
            // Reset regex lastIndex to avoid issues with global flag
            regex.lastIndex = 0;
            let match;
            while ((match = regex.exec(text)) !== null) {
                const processed = processor(match, score);
                if (processed && this.isValidExtraction(processed, type)) {
                    results.push(processed);
                }
            }
        });

        return this.deduplicateAndSort(results, type);
    }

    // Enhanced company name extraction with domain parsing
    extractCompanyName(text) {
        return this.extractData(text, 'company', (match, baseScore) => {
            let company = (match[1] || match[0]).trim();
            
            // Handle email domain extraction
            if (company.includes('.')) {
                company = company.split('.')[0];
                // Convert domain to proper company name
                company = company.replace(/[-_]/g, ' ')
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
            }
            
            // Clean company name
            company = company
                .replace(/^(the|a|an)\s+/i, '')
                .replace(/\s+(inc|ltd|llc|corp|corporation|company|co|pvt|private|limited)\.?$/i, '')
                .replace(/[^\w\s&'.-]/g, '')
                .trim();

            // Enhanced validation
            if (!company || company.length < 2 || company.length > 50 || 
                /^\d+$/.test(company) || 
                this.invalidCompanyTerms.has(company.toLowerCase()) ||
                /^(unknown|n\/a|na|null|undefined)$/i.test(company)) {
                return null;
            }
            
            // Additional filtering for common email phrases and false positives
            const lowerCompany = company.toLowerCase();
            const emailPhrases = [
                'kindly', 'prepare', 'accordingly', 'please', 'note', 'important', 'urgent',
                'deadline', 'submit', 'send', 'reply', 'forward', 'cc', 'bcc', 'subject',
                'regards', 'best', 'thanks', 'thank', 'you', 'your', 'sincerely', 'dies',
                'team', 'department', 'alert', 'notification', 'message', 'system'
            ];
            
            for (const phrase of emailPhrases) {
                if (lowerCompany.includes(phrase)) {
                    return null;
                }
            }
            
            // Filter out program names and generic terms
            const programTerms = [
                'program', 'training', 'internship', 'workshop', 'course', 'session',
                'after', 'registering', 'registration', 'enrollment', 'application',
                'form', 'survey', 'feedback', 'evaluation', 'assessment', 'top',
                'companies', 'company', 'group', 'team', 'department'
            ];
            
            for (const term of programTerms) {
                if (lowerCompany.includes(term)) {
                    return null;
                }
            }

            // Calculate confidence with enhanced scoring
            let confidence = baseScore;
            if (this.companyBonus.test(company)) confidence += 15;
            if (/\b(team|department|group|division|alert|security)\b/i.test(company)) confidence -= 20;
            if (company.length < 4) confidence -= 10;
            if (/^[A-Z]+$/.test(company) && company.length > 8) confidence -= 15; // All caps long names

            return { name: company, confidence: Math.max(0, Math.min(100, confidence)) };
        });
    }

    // Enhanced salary extraction
    extractSalary(text) {
        return this.extractData(text, 'salary', (match, baseScore) => {
            const amount1 = this.parseAmount(match[1]);
            const amount2 = this.parseAmount(match[2]);
            
            if (!amount1 || amount1 < 1000) return null; // Minimum salary threshold

            const matchText = match[0];
            const currency = this.detectCurrency(matchText);
            const period = this.detectPeriod(matchText);
            
            let result = { currency, period };
            let confidence = baseScore;

            if (amount2 && amount2 > amount1) {
                result = { ...result, min: amount1, max: amount2, formatted: `${currency}${amount1.toLocaleString()} - ${currency}${amount2.toLocaleString()} ${period}` };
                confidence += 10;
            } else {
                result = { ...result, amount: amount1, formatted: `${currency}${amount1.toLocaleString()} ${period}` };
            }

            // Enhanced reasonable amount validation
            const checkAmount = amount1;
            if (currency === '₹' && checkAmount >= 50000 && checkAmount <= 50000000) confidence += 15;
            else if (currency === '$' && checkAmount >= 30000 && checkAmount <= 500000) confidence += 15;
            else confidence -= 10;

            return { ...result, confidence: Math.max(0, Math.min(100, confidence)) };
        });
    }

    // Enhanced date extraction with better parsing
    extractLastDate(text) {
        return this.extractData(text, 'lastDate', (match, baseScore) => {
            const dateStr = match[1] || match[0];
            const parsed = this.parseDate(dateStr);
            
            if (!parsed) return null;

            const isValid = this.isValidFutureDate(parsed);
            const daysDiff = Math.ceil((parsed - new Date()) / (1000 * 60 * 60 * 24));
            
            let confidence = baseScore;
            if (isValid && daysDiff > 0 && daysDiff < 365) confidence += 20;
            else if (!isValid) confidence -= 30;
            if (daysDiff < 0) confidence -= 40; // Past dates

            return {
                date: parsed,
                formatted: this.formatDate(parsed),
                isValid,
                daysDiff,
                confidence: Math.max(0, Math.min(100, confidence))
            };
        });
    }

    // Enhanced application link extraction
    extractApplicationLinks(text) {
        return this.extractData(text, 'applicationLink', (match, baseScore) => {
            const url = match[1] || match[0];
            
            if (!this.isValidUrl(url)) return null;

            let confidence = baseScore;
            const lowerUrl = url.toLowerCase();
            
            // Enhanced scoring
            if (/apply|application|career|hiring|recruitment/.test(lowerUrl)) confidence += 25;
            if (/(linkedin|indeed|glassdoor|naukri|monster)\.com/.test(lowerUrl)) confidence += 20;
            if (/forms\.google\.com|typeform\.com/.test(lowerUrl)) confidence += 15;
            if (url.length > 100) confidence -= 5; // Very long URLs might be suspicious

            return {
                url,
                type: this.classifyLink(url),
                confidence: Math.min(100, confidence)
            };
        });
    }

    // Enhanced position extraction
    extractPosition(text) {
        return this.extractData(text, 'position', (match, baseScore) => {
            let position = match[1].trim()
                .replace(/^(a|an|the)\s+/i, '')
                .replace(/[^\w\s\-_\/&.,()]/g, '')
                .trim();

            // Enhanced validation
            if (!position || position.length < 3 || position.length > 60 ||
                /^(job|career|position|role|work|apply|application|unknown|n\/a)$/i.test(position)) {
                return null;
            }

            let confidence = baseScore;
            if (this.jobTitleBonus.test(position)) confidence += 20;
            if (position.split(' ').length > 5) confidence -= 10; // Too many words
            if (/\d+/.test(position) && !/\b(junior|senior|level|grade)\b/i.test(position)) confidence -= 15;

            return { title: position, confidence: Math.min(100, confidence) };
        });
    }

    // Enhanced validation method with better filtering
    isValidExtraction(result, type) {
        switch (type) {
            case 'company':
                if (!result.name || result.confidence < 40) return false;
                
                // Additional company name validation
                const companyName = result.name.toLowerCase();
                
                // Check for invalid terms
                for (const invalidTerm of this.invalidCompanyTerms) {
                    if (companyName.includes(invalidTerm.toLowerCase())) {
                        return false;
                    }
                }
                
                // Check for common email/notification patterns
                if (companyName.includes('@') || companyName.includes('http') || 
                    companyName.includes('www') || companyName.includes('mail')) {
                    return false;
                }
                
                // Check for generic terms
                if (companyName.length < 3 || companyName.length > 30) return false;
                if (/^(the|a|an|this|that|these|those)$/i.test(companyName)) return false;
                
                // Check for common email phrases
                if (/^(kindly|please|note|important|urgent|deadline|submit|send|reply|forward|cc|bcc|subject|regards|best|thanks|thank|you|your|sincerely)$/i.test(companyName)) {
                    return false;
                }
                
                return true;
                
            case 'salary':
                return result.formatted && result.confidence >= 50;
            case 'lastDate':
                return result.formatted && result.confidence >= 30;
            case 'applicationLink':
                return result.url && result.confidence >= 40;
            case 'position':
                return result.title && result.confidence >= 50;
            default:
                return true;
        }
    }

    // Utility methods (optimized)
    parseAmount(str) {
        if (!str) return null;
        const num = parseFloat(str.replace(/,/g, ''));
        return isNaN(num) ? null : num;
    }

    detectCurrency(text) {
        if (text.includes('₹') || /\blakh|crore|inr|lpa\b/i.test(text)) return '₹';
        if (text.includes('$') || /\busd\b/i.test(text)) return '$';
        if (text.includes('£') || /\bgbp\b/i.test(text)) return '£';
        if (text.includes('€') || /\beur\b/i.test(text)) return '€';
        return '₹'; // Default for Indian market
    }

    detectPeriod(text) {
        const lower = text.toLowerCase();
        if (/\bhourly|per\s+hour|\/hr\b/.test(lower)) return 'per hour';
        if (/\bmonthly|per\s+month\b/.test(lower)) return 'per month';
        if (/\blpa|per\s+annum|annually|yearly\b/.test(lower)) return 'per annum';
        return 'per annum';
    }

    // Enhanced date parsing
    parseDate(dateStr) {
        const str = dateStr.toLowerCase().trim();
        
        // Handle relative dates
        if (str === 'today') return new Date();
        if (str === 'tomorrow') {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            return tomorrow;
        }

        // Try various date formats
        const formats = [
            // ISO format (YYYY-MM-DD) - highest priority
            { regex: /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/, order: [0, 1, 2] },
            // DD/MM/YYYY or MM/DD/YYYY
            { regex: /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})$/, order: [2, 1, 0] },
            // DD-MMM-YYYY
            { regex: /^(\d{1,2})[-\s](jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[-\s](\d{2,4})$/i, order: [2, 'month', 0] }
        ];

        for (const { regex, order } of formats) {
            const match = str.match(regex);
            if (match) {
                let year, month, day;
                
                if (order.includes('month')) {
                    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
                    day = parseInt(match[1]);
                    month = months.indexOf(match[2].toLowerCase());
                    year = parseInt(match[3]);
                } else {
                    year = parseInt(match[order[0] + 1]);
                    month = parseInt(match[order[1] + 1]) - 1;
                    day = parseInt(match[order[2] + 1]);
                }
                
                if (year < 100) year += 2000;
                
                const date = new Date(year, month, day);
                if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
                    return date;
                }
            }
        }

        return null;
    }

    formatDate(date) {
        return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    }

    isValidFutureDate(date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
    }

    isValidUrl(url) {
        try {
            new URL(url);
            return url.length > 10 && url.length < 1000;
        } catch {
            return false;
        }
    }

    classifyLink(url) {
        const lower = url.toLowerCase();
        if (/careers|jobs|apply|hiring|recruitment/.test(lower)) return 'career_page';
        if (/linkedin\.com\/jobs/.test(lower)) return 'linkedin_job';
        if (/(indeed|glassdoor|naukri|monster)\.com/.test(lower)) return 'job_board';
        if (/(forms\.google\.com|typeform\.com)/.test(lower)) return 'application_form';
        return 'general';
    }

    // Enhanced deduplication
    deduplicateAndSort(results, type) {
        if (!results.length) return [];
        
        const seen = new Map();
        const keyMap = {
            company: 'name',
            salary: 'formatted',
            lastDate: 'formatted',
            applicationLink: 'url',
            position: 'title'
        };
        
        const key = keyMap[type];
        if (!key) return results.sort((a, b) => b.confidence - a.confidence);

        results.forEach(item => {
            const val = item[key]?.toLowerCase()?.trim();
            if (val && (!seen.has(val) || item.confidence > seen.get(val).confidence)) {
                seen.set(val, item);
            }
        });

        return Array.from(seen.values()).sort((a, b) => b.confidence - a.confidence);
    }

    preprocessText(text) {
        return text
            .replace(/\r\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .replace(/\s{2,}/g, ' ')
            .replace(/[^\x00-\x7F]/g, match => match) // Keep Unicode
            .trim();
    }

    // Main extraction - only return jobs with valid company names
    extractJobData(emailText) {
        const cleanText = this.preprocessText(emailText);
        
        const companies = this.extractCompanyName(cleanText);
        
        // Only proceed if we found at least one valid company
        if (!companies.length || companies[0].confidence < 40) {
            return null; // Don't extract job data without company name
        }
        
        return {
            companies,
            salaries: this.extractSalary(cleanText),
            lastDates: this.extractLastDate(cleanText),
            applicationLinks: this.extractApplicationLinks(cleanText),
            positions: this.extractPosition(cleanText)
        };
    }

    // Enhanced best matches with formatting
    getBestMatches(jobData) {
        if (!jobData) return null;
        
        const company = jobData.companies[0]?.name || null;
        const salary = jobData.salaries[0]?.formatted || null;
        const lastDate = jobData.lastDates[0]?.formatted || null;
        const applicationLink = jobData.applicationLinks[0]?.url || null;
        const position = jobData.positions[0]?.title || null;
        
        // Format display string
        let displayText = company;
        if (salary) displayText += ` (${salary})`;
        
        return {
            company,
            salary,
            lastDate: lastDate || 'Unknown',
            applicationLink,
            position,
            displayText,
            hasValidData: !!(company && (salary || lastDate || applicationLink || position)),
            confidence: {
                company: jobData.companies[0]?.confidence || 0,
                salary: jobData.salaries[0]?.confidence || 0,
                lastDate: jobData.lastDates[0]?.confidence || 0,
                applicationLink: jobData.applicationLinks[0]?.confidence || 0,
                position: jobData.positions[0]?.confidence || 0
            }
        };
    }

    // Batch processing method for multiple emails
    extractMultipleJobs(emails) {
        return emails
            .map(email => this.extractJobData(email))
            .filter(job => job !== null) // Remove jobs without company names
            .map(job => this.getBestMatches(job))
            .filter(job => job?.hasValidData); // Only keep jobs with meaningful data
    }
}
module.exports = JobEmailExtractor;