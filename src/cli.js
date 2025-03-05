#!/usr/bin/env node

const { program } = require("commander");
const path = require("path");
const fs = require("fs-extra");
const {
  convertToSRT,
  convertToTXT,
  createCombinedSRT,
  createCombinedTXT,
} = require("./index");

// Configure the CLI
program
  .name("xml-subtitle-converter")
  .description("Convert XML subtitle files to SRT and TXT formats")
  .version("1.0.0");

// Convert command
program
  .command("convert")
  .description("Convert a single XML file to SRT and TXT formats")
  .argument("<xmlFile>", "Path to the XML file")
  .option("-o, --output <directory>", "Output directory", "./output")
  .option(
    "-l, --language <language>",
    "Language of the XML file (kr or ch)",
    "kr"
  )
  .action(async (xmlFile, options) => {
    try {
      // Ensure the XML file exists
      if (!fs.existsSync(xmlFile)) {
        console.error(`Error: File ${xmlFile} does not exist.`);
        process.exit(1);
      }

      // Ensure the output directory exists
      fs.ensureDirSync(options.output);

      // Generate output file paths
      const baseName = path.basename(xmlFile, path.extname(xmlFile));
      const srtPath = path.join(options.output, `${baseName}.srt`);
      const txtPath = path.join(options.output, `${baseName}.txt`);

      // Convert the XML file
      await convertToSRT(xmlFile, srtPath, options.language);
      await convertToTXT(xmlFile, txtPath, options.language);

      console.log(`Successfully converted ${xmlFile} to SRT and TXT formats.`);
    } catch (error) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  });

// Combine command
program
  .command("combine")
  .description("Combine two XML files into SRT and TXT formats")
  .argument("<xmlFile1>", "Path to the first XML file")
  .argument("<xmlFile2>", "Path to the second XML file")
  .option("-o, --output <directory>", "Output directory", "./output")
  .option(
    "-l1, --language1 <language>",
    "Language of the first XML file (kr or ch)",
    "kr"
  )
  .option(
    "-l2, --language2 <language>",
    "Language of the second XML file (kr or ch)",
    "ch"
  )
  .option("-n, --name <name>", "Base name for the output files", "combined")
  .action(async (xmlFile1, xmlFile2, options) => {
    try {
      // Ensure the XML files exist
      if (!fs.existsSync(xmlFile1)) {
        console.error(`Error: File ${xmlFile1} does not exist.`);
        process.exit(1);
      }
      if (!fs.existsSync(xmlFile2)) {
        console.error(`Error: File ${xmlFile2} does not exist.`);
        process.exit(1);
      }

      // Ensure the output directory exists
      fs.ensureDirSync(options.output);

      // Generate output file paths
      const srtPath = path.join(options.output, `${options.name}.srt`);
      const txtPath = path.join(options.output, `${options.name}.txt`);

      // Combine the XML files
      await createCombinedSRT(
        xmlFile1,
        xmlFile2,
        srtPath,
        options.language1,
        options.language2
      );
      await createCombinedTXT(
        xmlFile1,
        xmlFile2,
        txtPath,
        options.language1,
        options.language2
      );

      console.log(
        `Successfully combined ${xmlFile1} and ${xmlFile2} into SRT and TXT formats.`
      );
    } catch (error) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  });

// Default command
program
  .command("default")
  .description("Process the default files (ep1-kr.xml and ep1-ch.xml)")
  .option("-o, --output <directory>", "Output directory", "./output")
  .action(async (options) => {
    try {
      // Ensure the output directory exists
      fs.ensureDirSync(options.output);

      // Default file paths
      const krXmlPath = path.join(process.cwd(), "ep1-kr.xml");
      const chXmlPath = path.join(process.cwd(), "ep1-ch.xml");

      // Ensure the default files exist
      if (!fs.existsSync(krXmlPath)) {
        console.error(`Error: File ${krXmlPath} does not exist.`);
        process.exit(1);
      }
      if (!fs.existsSync(chXmlPath)) {
        console.error(`Error: File ${chXmlPath} does not exist.`);
        process.exit(1);
      }

      // Output file paths
      const krSrtPath = path.join(options.output, "ep1-kr.srt");
      const krTxtPath = path.join(options.output, "ep1-kr.txt");
      const chSrtPath = path.join(options.output, "ep1-ch.srt");
      const chTxtPath = path.join(options.output, "ep1-ch.txt");
      const combinedSrtPath = path.join(options.output, "ep1-combined.srt");
      const combinedTxtPath = path.join(options.output, "ep1-combined.txt");

      // Convert Korean XML to SRT and TXT
      await convertToSRT(krXmlPath, krSrtPath, "kr");
      await convertToTXT(krXmlPath, krTxtPath, "kr");

      // Convert Chinese XML to SRT and TXT
      await convertToSRT(chXmlPath, chSrtPath, "ch");
      await convertToTXT(chXmlPath, chTxtPath, "ch");

      // Create combined files
      await createCombinedSRT(
        krXmlPath,
        chXmlPath,
        combinedSrtPath,
        "kr",
        "ch"
      );
      await createCombinedTXT(
        krXmlPath,
        chXmlPath,
        combinedTxtPath,
        "kr",
        "ch"
      );

      console.log("All conversions completed successfully!");
    } catch (error) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(process.argv);

// If no arguments are provided, show help
if (!process.argv.slice(2).length) {
  program.help();
}
