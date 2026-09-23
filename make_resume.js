// Usage: node make_resume.js <Company>
// Reads configs/<Company>.json (titleLine, summary, skillsLines, optional
// bulletsByJob keyed by company name) and profile.js (source-of-truth facts),
// writes output/<Company>_Resume.docx.
const fs = require("fs");
const path = require("path");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType
} = require("docx");
const profile = require("./profile.js");

const company = process.argv[2];
if (!company) {
  console.error("Usage: node make_resume.js <Company>");
  process.exit(1);
}

const configPath = path.join(__dirname, "configs", `${company}.json`);
if (!fs.existsSync(configPath)) {
  console.error(`Missing ${configPath}. Create it first (see CLAUDE.md Section 6).`);
  process.exit(1);
}
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

const skillsLines = config.skillsLines || profile.skills;
const bulletsByJob = config.bulletsByJob || {};

function contactLine() {
  return [
    profile.address,
    profile.phone,
    profile.email,
    profile.linkedin
  ].join("  |  ");
}

const children = [];

children.push(
  new Paragraph({
    text: profile.name,
    heading: HeadingLevel.TITLE,
    alignment: AlignmentType.CENTER
  }),
  new Paragraph({
    text: config.titleLine || profile.headline || "",
    alignment: AlignmentType.CENTER
  }),
  new Paragraph({
    text: contactLine(),
    alignment: AlignmentType.CENTER
  }),
  new Paragraph({ text: "" })
);

const summary = config.summary || profile.defaultSummary;
if (summary) {
  children.push(
    new Paragraph({ text: "Summary", heading: HeadingLevel.HEADING_2 }),
    new Paragraph({ text: summary }),
    new Paragraph({ text: "" })
  );
}

children.push(new Paragraph({ text: "Experience", heading: HeadingLevel.HEADING_2 }));
for (const job of profile.experience) {
  const heading = [job.title, job.company].filter(Boolean).join(", ");
  const locationDates = [job.location, job.dates].filter(Boolean).join(" | ");
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: heading, bold: true }),
        new TextRun({ text: locationDates ? `   (${locationDates})` : "" })
      ]
    })
  );
  const bullets = bulletsByJob[job.company] || job.bullets;
  for (const bullet of bullets) {
    children.push(new Paragraph({ text: bullet, bullet: { level: 0 } }));
  }
  children.push(new Paragraph({ text: "" }));
}

children.push(new Paragraph({ text: "Education", heading: HeadingLevel.HEADING_2 }));
for (const edu of profile.education) {
  children.push(
    new Paragraph({
      text: `${edu.degree}, ${edu.school}${edu.note ? " (" + edu.note + ")" : ""}`
    })
  );
}
children.push(new Paragraph({ text: "" }));

children.push(new Paragraph({ text: "Skills", heading: HeadingLevel.HEADING_2 }));
for (const line of skillsLines) {
  children.push(new Paragraph({ text: line, bullet: { level: 0 } }));
}

const doc = new Document({
  sections: [{ properties: {}, children }]
});

const outDir = path.join(__dirname, "output");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, `${company}_Resume.docx`);

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outPath, buffer);
  console.log(`Wrote ${outPath}`);
});
