// Source-of-truth facts about Piyush Jain, merged from CLAUDE.md, the
// uploaded master resume (master/Piyush_Jain_Master_Resume.pdf) and the
// uploaded LinkedIn profile export (master/Piyush_Jain_LinkedIn_Profile.pdf).
// Never alter facts here — only reorder/reword per-job via
// configs/<Company>.json (see CLAUDE.md Section 6).
//
// Resolved conflicts between the two source documents (2026-09-23):
// - Bosch "hours saved per week": resume PDF says 15, LinkedIn says 10 -> using 15 (resume PDF).
// - Mashco title/dates: resume PDF says "Marketing Manager" Feb-Jul 2019,
//   LinkedIn says "Marketing Associate" Jan-Jun 2019 -> using LinkedIn.
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

  // Default professional summary (master resume / LinkedIn). Per-job configs
  // override with `summary` to echo the JD's key requirements.
  defaultSummary:
    "Senior Marketing Automation and AI Growth Leader with 10+ years of experience building scalable CRM, automation, and performance marketing systems for global businesses. Led growth initiatives across 43 countries, helping generate 300K+ customers and over $23M in revenue, with campaigns achieving up to 47x ROAS. Strong expertise in combining CRM, AI, marketing automation, data, and paid media to improve customer acquisition, operational efficiency, and sustainable business growth.",

  // Main resume experience (2019-present). Kept to roles a senior German
  // marketing resume should show, per CLAUDE.md's 1-2 page guidance.
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
        "Introduced AI-assisted marketing workflows and automation pipelines to improve campaign optimisation, audience segmentation, and marketing operations efficiency",
        "Led the technical integration of HubSpot, Salesforce, internal CRM systems, advertising platforms, and analytics tools through APIs, webhooks, and automated data pipelines",
        "Increased customer acquisition by 250% within five months through automated funnel strategies, including lifecycle campaigns, lead magnets, voucher programs, trial campaigns, and cart-abandonment automation across Germany, the United States, the United Kingdom, France, Spain, Italy, Mexico, Canada, Poland, and Austria",
        "Led automation strategy for multi-channel performance marketing campaigns, optimising Google Ads, LinkedIn Ads, and Meta Ads campaigns using advanced segmentation and retargeting frameworks that reduced CPA by 40% within five weeks",
        "Partnered with product, engineering, and analytics teams to define marketing automation architecture and improve cross-platform data flows",
        "Known as the only \"HubSpot Technical Expert\" in the company"
      ]
    },
    {
      company: "upGrad Abroad",
      title: "Marketing Automation Coach (freelance)",
      location: "Karlsruhe, Germany",
      dates: "Nov 2023 - Feb 2025",
      bullets: [
        "Delivered group coaching sessions on career development in Germany for MBA/MS-CS students, with focus on marketing automation, AI, and industry trends",
        "Guided participants on key sectors, in-demand roles, and essential skills for recruitment success",
        "Mapped professional backgrounds to future opportunities and received strong feedback for actionable insights and interactive learning"
      ]
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
      company: "Centre for Teacher Accreditation (CENTA)",
      title: "Senior Marketing Associate",
      location: "",
      dates: "Jul 2021 - Jan 2022",
      bullets: [
        "Generated $8.7M revenue on a $95K budget in 8 months via automated multi-channel campaigns",
        "Acquired 500K+ leads at $1.4 CPL through social media automation",
        "Led A/B testing & landing page optimization, improving conversion rates by 190% in 10 months",
        "Built scalable content automation workflows, driving 45% growth across social channels"
      ]
    },
    {
      company: "",
      title: "Marketing Associate",
      location: "Bengaluru, Karnataka, India",
      dates: "Aug 2020 - Jul 2021",
      bullets: [
        "Planned and executed campaigns across nine digital channels, including web, SEO/SEM, email, social media and display advertising",
        "Analyzed the performance of all digital marketing campaigns and reported directly to the COO, ensuring optimization for success",
        "Developed marketing content such as blogs, articles, collateral, creatives, and videos that resonated with the target audience and drove engagement and conversions",
        "Led the charge on international events, developing strategies to maximize exposure and impact"
      ]
    },
    {
      company: "Robert Bosch GmbH",
      title: "Commercial Management Associate",
      location: "Abstatt, Germany",
      dates: "Aug 2019 - Jul 2020",
      bullets: [
        "Developed automation tools using APIs and VBA macros supporting more than 20,000 global associates across the United States, Germany, UAE, the United Kingdom, China, Japan, EMEA, DACH & APAC regions",
        "Conducted in-depth market analysis and visualized corporate mobility sales with top OEMs and other global customers, tracking billion-euro KPIs to inform strategic decisions",
        "Developed powerful business acquisition tools, including IFRS, Salesforce, and VBA macro tools and templates, leading to more efficient sales processes and higher success rates",
        "Directed a comprehensive database of global customer teams and projects for business acquisition, supporting 17 global sales teams across various business units",
        "Automated marketing KPI reporting, customer and projects database, saving roughly 15 hours of manual work per week",
        "Set up data flow automation using Postman API to sync data across multiple CRM systems"
      ]
    },
    {
      company: "Mashco Limited",
      title: "Marketing Associate",
      location: "Watford, United Kingdom",
      dates: "Jan 2019 - Jun 2019",
      bullets: [
        "Conceptualized top-funnel marketing content that generated 30,000 new visitors, resulting in £50,000 incremental revenue",
        "Boosted the company's SEO performance, resulting in a 25% increase in monthly organic traffic",
        "Led the CRM through emails and phone calls for sales, operations, support, and compliance issues, with an efficiency rate of 50%",
        "Expanded the company's e-commerce market, growing deals and connections by 12-25%"
      ]
    }
  ],

  // Roles before 2019 (internships, trainee positions, short early-career
  // gigs) from the LinkedIn export. Not part of the default resume — pull
  // specific entries into a job config's bulletsByJob only if a listing
  // specifically calls for early-career/entry-level detail.
  earlierCareer: [
    { company: "My Little Shop LTD", title: "Marketing Specialist", location: "London, United Kingdom", dates: "Oct 2018 - Feb 2019" },
    { company: "MYPOWER.IN", title: "Digital Marketing and Operations (Remote)", location: "India", dates: "Jul 2017 - Dec 2018" },
    { company: "Ahuja Group", title: "Market Strategist", location: "Mumbai, India", dates: "Aug 2018 - Sep 2018" },
    { company: "Centre for Teacher Accreditation (CENTA)", title: "Marketing, Outreach and Project Management Trainee", location: "Bengaluru, India", dates: "Jan 2018 - Jul 2018" },
    { company: "OYO", title: "Business Development - Crew Member", location: "India", dates: "Nov 2017 - Feb 2018" },
    { company: "Hasura", title: "Marketing", location: "India", dates: "Jan 2017 - Feb 2018" },
    { company: "United Nations Volunteers", title: "Digital Operations", location: "India", dates: "Nov 2017 - Jan 2018" },
    { company: "Entrepreneurship Cell, IIT Kanpur", title: "Campus Ambassador", location: "Kanpur, India", dates: "Jul 2016 - Jan 2018" },
    { company: "nearbuy.com", title: "Marketing Cluster Manager", location: "Gurugram, India", dates: "Jun 2016 - Oct 2017" },
    { company: "nearbuy.com", title: "Digital Marketing Specialist", location: "Gurugram, India", dates: "Jun 2016 - Sep 2016" },
    { company: "Edugators.com", title: "Graphic Designer", location: "India", dates: "Jul 2017 - Aug 2017" },
    { company: "Qwerty Thoughts", title: "Content Management Specialist", location: "India", dates: "Jun 2017 - Aug 2017" },
    { company: "Infigic Technologies", title: "Operations", location: "Ahmedabad, India", dates: "Jun 2017 - Aug 2017" },
    { company: "BiosectRx", title: "Data Visualizer", location: "United States", dates: "May 2017 - Aug 2017" },
    { company: "Qrius (formerly The Indian Economist)", title: "Market Analyst", location: "India", dates: "Jun 2017 - Jul 2017" },
    { company: "Yoddhas - Indians Fighting Against Cancer", title: "Digital Marketing", location: "Delhi, India", dates: "May 2016 - Dec 2016" },
    { company: "Ecotact Bags", title: "Web Application Developer", location: "New Delhi, India", dates: "May 2016 - Oct 2016" },
    { company: "LIC", title: "Marketing Specialist", location: "Bikaner, India", dates: "Dec 2015 - May 2016" },
    { company: "NIIT University - THE ASIAN LENS FORUM", title: "Marketing Intern", location: "Neemrana, India", dates: "Aug 2014 - Dec 2015" },
    { company: "NIIT University", title: "Stage Coordinator and Sponsorship", location: "Neemrana, India", dates: "Nov 2014 - Feb 2015" },
    { company: "NIIT University", title: "Software Developer", location: "Neemrana, India", dates: "Oct 2014 - Jan 2015" },
    { company: "Greymeter", title: "Corporate micro-internship program", location: "India", dates: "Sep 2015 - Nov 2015" },
    { company: "Ncell", title: "Telecom Specialist", location: "Biratnagar, Nepal", dates: "Jun 2015 - Jul 2015" },
    { company: "Ecotact Bags", title: "Advertising Intern", location: "New Delhi, India", dates: "Nov 2014 - Feb 2015" }
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
