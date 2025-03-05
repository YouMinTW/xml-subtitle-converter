const { XMLParser } = require("fast-xml-parser");
const fs = require("fs-extra");
const path = require("path");

// Create output directories
const outputDir = path.join(__dirname, "..", "output");
fs.ensureDirSync(outputDir);

// Configure XML parser
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name, jpath, isLeafNode, isAttribute) => {
    return name === "p";
  },
});

/**
 * Convert time in TTML format (tickRate) to SRT format (HH:MM:SS,mmm)
 * @param {string} time - Time in TTML format (e.g., "140140000t")
 * @param {number} tickRate - The tick rate from the TTML file
 * @returns {string} - Time in SRT format (e.g., "00:00:14,014")
 */
function convertTimeToSRT(time, tickRate) {
  // Remove the 't' suffix if present
  const timeValue = parseInt(time.toString().replace("t", ""));

  // Convert to seconds
  const totalSeconds = timeValue / tickRate;

  // Calculate hours, minutes, seconds, and milliseconds
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.floor(
    (totalSeconds - Math.floor(totalSeconds)) * 1000
  );

  // Format the time string
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")},${milliseconds
    .toString()
    .padStart(3, "0")}`;
}

/**
 * Extract subtitle entries from XML content using regex
 * @param {string} xmlContent - The XML content as a string
 * @param {string} language - The language of the XML content ('kr' or 'ch')
 * @returns {Array} - Array of subtitle objects
 */
function extractSubtitlesWithRegex(xmlContent, language) {
  const subtitles = [];

  if (language === "kr") {
    // Korean XML format
    const subtitleRegex =
      /<p xml:id="subtitle\d+" begin="(\d+t)" end="(\d+t)" region="region\d+" style="style\d+">([\s\S]*?)<\/p>/g;
    let match;

    while ((match = subtitleRegex.exec(xmlContent)) !== null) {
      const begin = match[1];
      const end = match[2];
      const text = match[3].replace(/<br\/>/g, "\n");

      subtitles.push({
        begin,
        end,
        text,
      });
    }
  } else if (language === "ch") {
    // Chinese XML format
    const subtitleRegex =
      /<p xml:id="subtitle\d+" begin="(\d+t)" end="(\d+t)" region="region\d+">([\s\S]*?)<\/p>/g;
    let match;

    while ((match = subtitleRegex.exec(xmlContent)) !== null) {
      const begin = match[1];
      const end = match[2];
      const content = match[3];

      // Extract text from span tags
      let text = "";
      const spanRegex = /<span[^>]*>([\s\S]*?)<\/span>/g;
      let spanMatch;

      while ((spanMatch = spanRegex.exec(content)) !== null) {
        if (text) {
          text += "\n";
        }
        text += spanMatch[1];
      }

      // Replace <br/> tags with newlines
      text = text.replace(/<br\/>/g, "\n");

      subtitles.push({
        begin,
        end,
        text,
      });
    }
  }

  return subtitles;
}

/**
 * Convert XML subtitle file to SRT format
 * @param {string} xmlFilePath - Path to the XML file
 * @param {string} outputFilePath - Path to the output SRT file
 * @param {string} language - The language of the XML file ('kr' or 'ch')
 */
async function convertToSRT(xmlFilePath, outputFilePath, language) {
  try {
    // Read the XML file
    const xmlData = await fs.readFile(xmlFilePath, "utf-8");

    // Extract the tick rate
    const tickRateMatch = xmlData.match(/ttp:tickRate="(\d+)"/);
    const tickRate = tickRateMatch ? parseInt(tickRateMatch[1]) : 10000000;

    // Extract subtitles using regex
    const subtitles = extractSubtitlesWithRegex(xmlData, language);

    // Generate SRT content
    let srtContent = "";

    subtitles.forEach((subtitle, index) => {
      const startTime = convertTimeToSRT(subtitle.begin, tickRate);
      const endTime = convertTimeToSRT(subtitle.end, tickRate);

      // Format SRT entry
      srtContent += `${index + 1}\n`;
      srtContent += `${startTime} --> ${endTime}\n`;
      srtContent += `${subtitle.text}\n\n`;
    });

    // Write to output file
    await fs.writeFile(outputFilePath, srtContent);
    console.log(`Successfully converted ${xmlFilePath} to ${outputFilePath}`);

    return subtitles;
  } catch (error) {
    console.error(`Error converting ${xmlFilePath} to SRT:`, error);
    throw error;
  }
}

/**
 * Convert XML subtitle file to TXT format
 * @param {string} xmlFilePath - Path to the XML file
 * @param {string} outputFilePath - Path to the output TXT file
 * @param {string} language - The language of the XML file ('kr' or 'ch')
 */
async function convertToTXT(xmlFilePath, outputFilePath, language) {
  try {
    // Read the XML file
    const xmlData = await fs.readFile(xmlFilePath, "utf-8");

    // Extract subtitles using regex
    const subtitles = extractSubtitlesWithRegex(xmlData, language);

    // Generate TXT content
    let txtContent = "";

    subtitles.forEach((subtitle) => {
      txtContent += `${subtitle.text}\n\n`;
    });

    // Write to output file
    await fs.writeFile(outputFilePath, txtContent);
    console.log(`Successfully converted ${xmlFilePath} to ${outputFilePath}`);

    return subtitles;
  } catch (error) {
    console.error(`Error converting ${xmlFilePath} to TXT:`, error);
    throw error;
  }
}

/**
 * Create a combined SRT file from two XML files
 * @param {string} xmlFile1 - Path to the first XML file
 * @param {string} xmlFile2 - Path to the second XML file
 * @param {string} outputFilePath - Path to the output SRT file
 * @param {string} language1 - The language of the first XML file ('kr' or 'ch')
 * @param {string} language2 - The language of the second XML file ('kr' or 'ch')
 */
async function createCombinedSRT(
  xmlFile1,
  xmlFile2,
  outputFilePath,
  language1,
  language2
) {
  try {
    // Read both XML files
    const xmlData1 = await fs.readFile(xmlFile1, "utf-8");
    const xmlData2 = await fs.readFile(xmlFile2, "utf-8");

    // Extract the tick rates
    const tickRateMatch1 = xmlData1.match(/ttp:tickRate="(\d+)"/);
    const tickRateMatch2 = xmlData2.match(/ttp:tickRate="(\d+)"/);
    const tickRate1 = tickRateMatch1 ? parseInt(tickRateMatch1[1]) : 10000000;
    const tickRate2 = tickRateMatch2 ? parseInt(tickRateMatch2[1]) : 10000000;

    // Extract subtitles using regex
    const subtitles1 = extractSubtitlesWithRegex(xmlData1, language1);
    const subtitles2 = extractSubtitlesWithRegex(xmlData2, language2);

    // Create a map of begin times to subtitles for the second file
    const subtitlesMap2 = new Map();
    subtitles2.forEach((subtitle) => {
      subtitlesMap2.set(subtitle.begin, subtitle);
    });

    // Generate combined SRT content
    let srtContent = "";
    let index = 1;

    subtitles1.forEach((subtitle1) => {
      const startTime = subtitle1.begin;
      const endTime = subtitle1.end;

      // Find matching subtitle in the second file
      const subtitle2 =
        subtitlesMap2.get(startTime) ||
        subtitles2.find((s) => {
          const time1 = parseInt(startTime.replace("t", ""));
          const time2 = parseInt(s.begin.replace("t", ""));
          return Math.abs(time1 - time2) < 5000000;
        });

      // Format SRT entry
      srtContent += `${index++}\n`;
      srtContent += `${convertTimeToSRT(
        startTime,
        tickRate1
      )} --> ${convertTimeToSRT(endTime, tickRate1)}\n`;
      srtContent += `${subtitle1.text}\n`;

      if (subtitle2) {
        srtContent += `${subtitle2.text}\n`;
      }

      srtContent += "\n";
    });

    // Write to output file
    await fs.writeFile(outputFilePath, srtContent);
    console.log(`Successfully created combined SRT file: ${outputFilePath}`);
  } catch (error) {
    console.error(`Error creating combined SRT file:`, error);
    throw error;
  }
}

/**
 * Create a combined TXT file from two XML files
 * @param {string} xmlFile1 - Path to the first XML file
 * @param {string} xmlFile2 - Path to the second XML file
 * @param {string} outputFilePath - Path to the output TXT file
 * @param {string} language1 - The language of the first XML file ('kr' or 'ch')
 * @param {string} language2 - The language of the second XML file ('kr' or 'ch')
 */
async function createCombinedTXT(
  xmlFile1,
  xmlFile2,
  outputFilePath,
  language1,
  language2
) {
  try {
    // Read both XML files
    const xmlData1 = await fs.readFile(xmlFile1, "utf-8");
    const xmlData2 = await fs.readFile(xmlFile2, "utf-8");

    // Extract subtitles using regex
    const subtitles1 = extractSubtitlesWithRegex(xmlData1, language1);
    const subtitles2 = extractSubtitlesWithRegex(xmlData2, language2);

    // Create a map of begin times to subtitles for the second file
    const subtitlesMap2 = new Map();
    subtitles2.forEach((subtitle) => {
      subtitlesMap2.set(subtitle.begin, subtitle);
    });

    // Generate combined TXT content
    let txtContent = "";

    subtitles1.forEach((subtitle1) => {
      const startTime = subtitle1.begin;

      // Find matching subtitle in the second file
      const subtitle2 =
        subtitlesMap2.get(startTime) ||
        subtitles2.find((s) => {
          const time1 = parseInt(startTime.replace("t", ""));
          const time2 = parseInt(s.begin.replace("t", ""));
          return Math.abs(time1 - time2) < 5000000;
        });

      txtContent += `${subtitle1.text}\n`;

      if (subtitle2) {
        txtContent += `${subtitle2.text}\n`;
      }

      txtContent += "\n";
    });

    // Write to output file
    await fs.writeFile(outputFilePath, txtContent);
    console.log(`Successfully created combined TXT file: ${outputFilePath}`);
  } catch (error) {
    console.error(`Error creating combined TXT file:`, error);
    throw error;
  }
}

// Main function to process the files
async function main() {
  try {
    const krXmlPath = path.join(__dirname, "..", "ep1-kr.xml");
    const chXmlPath = path.join(__dirname, "..", "ep1-ch.xml");

    // Output file paths
    const krSrtPath = path.join(outputDir, "ep1-kr.srt");
    const krTxtPath = path.join(outputDir, "ep1-kr.txt");
    const chSrtPath = path.join(outputDir, "ep1-ch.srt");
    const chTxtPath = path.join(outputDir, "ep1-ch.txt");
    const combinedSrtPath = path.join(outputDir, "ep1-combined.srt");
    const combinedTxtPath = path.join(outputDir, "ep1-combined.txt");

    // Convert Korean XML to SRT and TXT
    await convertToSRT(krXmlPath, krSrtPath, "kr");
    await convertToTXT(krXmlPath, krTxtPath, "kr");

    // Convert Chinese XML to SRT and TXT
    await convertToSRT(chXmlPath, chSrtPath, "ch");
    await convertToTXT(chXmlPath, chTxtPath, "ch");

    // Create combined files
    await createCombinedSRT(krXmlPath, chXmlPath, combinedSrtPath, "kr", "ch");
    await createCombinedTXT(krXmlPath, chXmlPath, combinedTxtPath, "kr", "ch");

    console.log("All conversions completed successfully!");
  } catch (error) {
    console.error("Error in main process:", error);
  }
}

// Export functions for CLI
module.exports = {
  convertToSRT,
  convertToTXT,
  createCombinedSRT,
  createCombinedTXT,
};

// Run the main function if this file is executed directly
if (require.main === module) {
  main();
}
