import express from "express";
import puppeteer from "puppeteer";

const app = express();

// Optional: simple root info page
app.get("/", (req, res) => {
  res.type("text").send("PDF Wizard: use ?PDF= or ?url=");
});

app.get("/generate", async (req, res) => {
  try {
    const { PDF: rawPdfParam, url } = req.query;

    if (!rawPdfParam && !url) {
      return res.status(400).send("Missing ?PDF= or ?url= parameter");
    }

    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true
    });
    const page = await browser.newPage();

    if (url) {
      await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
    } else {
      await page.setContent(decodeURIComponent(rawPdfParam), { waitUntil: "networkidle0" });
    }

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" }
    });

    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=document.pdf",
      "Cache-Control": "no-store"
    });

    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating PDF");
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`PDF Wizard running on port ${port}`));
