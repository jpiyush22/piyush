// Source-of-truth facts about Piyush Jain, merged from CLAUDE.md and the
// uploaded master resume (master/Piyush_Jain_Master_Resume.pdf). Never alter
// facts here — only reorder/reword per-job via configs/<Company>.json
// (see CLAUDE.md Section 6).
module.exports = {
  name: "Piyush Jain",
  headline: "Senior MarTech, Marketing Automation & AI Growth Lead",
  email: "jpiyush12@gmail.com",
  phone: "015510032603",
  address: "Morgenstr. 6, 76137 Karlsruhe",
  linkedin: "linkedin.com/in/jpiyush12",
  workPermit: "EU Blue Card holder, no sponsorship needed",
  noticePeriod: "3 months",
  salaryExpectation: "110000",
  languages: "English (native), German (A2 / Grundkenntnisse)",

  // Default professional summary (master resume). Per-job configs override
  // with `summary` to echo the JD's key requirements.
  defaultSummary:
    "Senior Marketing Automation and AI Growth Leader with 10+ years of experience building scalable CRM, automation, and performance marketing systems for global businesses. Led growth initiatives across 43 countries, helping generate 300K+ customers and over $23M in revenue, with campaigns achieving up to 47x ROAS. Strong expertise in combining CRM, AI, marketing automation, data, and paid media to improve customer acquisition, operational efficiency, and sustainable business growth.",

  experience: [
    {
      company: "IONOS Group",
      title: "Senior Marketing Automation Manager",
      location: "Karlsruhe, Germany",
      dates: "Jun 2022 - present",
      bullets: [
        "Architect and lead enterprise marketing automation and CRM infrastructure across eight international brands, including IONOS, United Domains, Fasthosts, Home.pl, World4You, STRATO, InterNetX, and Arsys",
        "Designed and implemented enterprise marketing automation architecture in HubSpot across all brands, enabling scalable lifecycle marketing, centralised lead management, and global campaign orchestration",
        "Built an internal AI-powered marketing automation application and developed specialised AI agents to automate campaign operations, workflow execution, data processing, audience segmentation, optimisation, and repetitive marketing tasks",
        "Designed and deployed AI agent-driven automation pipelines that automated approximately 80% of previously manual marketing workflows, improving operational efficiency, execution speed, scalability, and consistency across brands and markets",
        "Orchestrated and optimised cart-abandonment strategies, lead magnets, and voucher programs across Germany, the United States, the United Kingdom, France, Spain, Italy, Mexico, Canada, Poland, and Austria, achieving a 250% increase in customer acquisition within five months while adhering to regulations",
        "Partnered with product, engineering, and analytics teams to define marketing automation architecture and improve cross-platform data flows",
        "Led automation strategy for multi-channel performance marketing campaigns, optimising Google Ads, LinkedIn Ads, and Meta Ads campaigns using advanced segmentation and retargeting frameworks that reduced CPA by 40% within five weeks",
        "Built HubSpot/Salesforce API and webhook integrations",
        "Known as the only \"HubSpot Technical Expert\" in the company"
      ]
    },
    {
      company: "upGrad Abroad",
      title: "Marketing Automation Coach (freelance)",
      location: "",
      dates: "Nov 2023 - Feb 2025",
      bullets: []
    },
    {
      company: "HackerEarth Technologies Private Limited",
      title: "Growth Marketing Specialist",
      location: "San Francisco, United States",
      dates: "Dec 2021 - Jun 2022",
      bullets: [
        "Scaled the USA developer community through targeted performance marketing campaigns and CRM management",
        "Achieved 37x ROAS through Meta Ads, LinkedIn Ads, and Google Ads and automated nurturing workflows",
        "Built and optimized automated marketing workflows to drive lead nurturing"
      ]
    },
    {
      company: "CENTA",
      title: "Senior Marketing Associate",
      location: "",
      dates: "Jul 2021 - Jan 2022",
      bullets: [
        "Drove $8.7M revenue on a $95K budget",
        "Generated 500K+ leads at $1.4 CPL",
        "Improved conversion by 190% in 10 months"
      ]
    },
    {
      company: "",
      title: "Marketing Associate",
      location: "Bengaluru",
      dates: "Aug 2020 - Jul 2021",
      bullets: []
    },
    {
      company: "Robert Bosch GmbH",
      title: "Commercial Management Associate",
      location: "Abstatt, Germany",
      dates: "Aug 2019 - Jul 2020",
      bullets: [
        "Developed automation tools using APIs and VBA macros supporting more than 20,000 global associates across the United States, Germany, UAE, the United Kingdom, China, Japan, EMEA, DACH & APAC regions",
        "Automated marketing KPI reporting, customer and projects database, saving roughly 15 hours of manual work per week",
        "Set up data flow automation using Postman API to sync data across multiple CRM systems"
      ]
    },
    {
      company: "Mashco Limited",
      title: "Marketing Manager",
      location: "Watford, United Kingdom",
      dates: "Feb 2019 - Jul 2019",
      bullets: [
        "Generated 30k+ website visitors and £50k revenue through digital marketing campaigns",
        "Implemented analytics frameworks using Google Analytics to optimise multi-channel performance"
      ]
    }
  ],

  education: [
    {
      degree: "MSc International Business",
      school: "University of Hertfordshire, UK",
      note: "Dean's Award 2020"
    },
    {
      degree: "B.Tech Electronics & Communication",
      school: "NIIT University, India",
      note: "Microsoft Imagine Cup 2017 winner"
    }
  ],

  // Default skill ordering; per-job configs override with skillsLines.
  skills: [
    "Marketing Strategy, Growth Strategy, Leadership & Team Management",
    "CRM & Marketing Automation: HubSpot, Salesforce, Marketo, Pipedrive, Zoho, Instantly",
    "Performance Marketing: Meta Ads, Google Ads, LinkedIn Ads, Taboola",
    "AI & Automation: Claude, Codex, AI Agents, n8n, Zapier, Make",
    "MarTech & Integrations: CRM Architecture, API Integrations, Webhooks, Data Pipelines, CRM Migrations",
    "Analytics: Adobe Analytics, GA4, Hotjar, Looker"
  ]
};
