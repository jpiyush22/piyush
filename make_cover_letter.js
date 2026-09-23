// Usage: node make_cover_letter.js <Company>
// Reads configs/<Company>.json (date, company, role, salutation, paragraphs[])
// and profile.js, writes output/<Company>_CoverLetter.docx.
const fs = require("fs");
const path = require("path");
const { Document, Packer, Paragraph, AlignmentType } = require("docx");
const profile = require("./profile.js");

const company = process.argv[2];
if (!company) {
  console.error("Usage: node make_cover_letter.js <Company>");
  process.exit(1);
}

const configPath = path.join(__dirname, "configs", `${company}.json`);
if (!fs.existsSync(configPath)) {
  console.error(`Missing ${configPath}. Create it first (see CLAUDE.md Section 6).`);
  process.exit(1);
}
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

if (!config.paragraphs || config.paragraphs.length !== 3) {
  console.error("configs/<Company>.json needs a `paragraphs` array with exactly 3 entries.");
  process.exit(1);
}

const children = [];

children.push(
  new Paragraph({ text: profile.name }),
  new Paragraph({ text: profile.address }),
  new Paragraph({ text: profile.phone }),
  new Paragraph({ text: profile.email }),
  new Paragraph({ text: "" }),
  new Paragraph({ text: config.date || "", alignment: AlignmentType.RIGHT }),
  new Paragraph({ text: "" }),
  new Paragraph({ text: config.company || company }),
  new Paragraph({ text: "" }),
  new Paragraph({ text: `Application: ${config.role || ""}` }),
  new Paragraph({ text: "" }),
  new Paragraph({ text: config.salutation || "Dear Hiring Team," }),
  new Paragraph({ text: "" })
);

for (const paragraph of config.paragraphs) {
  children.push(new Paragraph({ text: paragraph }));
  children.push(new Paragraph({ text: "" }));
}

children.push(
  new Paragraph({ text: "Kind regards," }),
  new Paragraph({ text: profile.name })
);

const doc = new Document({
  sections: [{ properties: {}, children }]
});

const outDir = path.join(__dirname, "output");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, `${company}_CoverLetter.docx`);

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outPath, buffer);
  console.log(`Wrote ${outPath}`);
});
