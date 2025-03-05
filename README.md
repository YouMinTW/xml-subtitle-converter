# XML Subtitle Converter

This Node.js application converts XML subtitle files (TTML format) to SRT and TXT formats. It also creates combined files that include subtitles from two different languages.

## Features

- Convert XML subtitle files to SRT format
- Convert XML subtitle files to TXT format
- Create combined SRT files with subtitles from two languages
- Create combined TXT files with subtitles from two languages
- Two combination modes: 'paired' (match subtitles) and 'timeline' (sort by time)
- Command-line interface for easy usage

## Prerequisites

- Node.js (v12 or higher)
- npm (Node Package Manager)

## Installation

1. Clone this repository or download the source code
2. Navigate to the project directory
3. Install dependencies:

```bash
npm install
```

4. Make the CLI script executable (Unix/Linux/macOS):

```bash
chmod +x src/cli.js
```

## Usage

### Using the CLI

The application provides a command-line interface for easy usage:

```bash
# Show help
npm run convert -- --help

# Convert a single XML file
npm run convert -- convert path/to/file.xml -l kr

# Combine two XML files (timeline mode by default)
npm run convert -- combine path/to/file1.xml path/to/file2.xml -l1 kr -l2 ch

# Combine two XML files using paired mode
npm run convert -- combine path/to/file1.xml path/to/file2.xml -l1 kr -l2 ch -m paired

# Process the default files (ep1-kr.xml and ep1-ch.xml) with timeline mode
npm run convert -- default

# Process the default files with paired mode
npm run convert -- default -m paired
```

### Combination Modes

The application supports two different modes for combining subtitles:

#### Timeline Mode (Default)

In timeline mode, all subtitles from both languages are merged and sorted by their start time. This preserves the original timing of each subtitle and displays them in the order they appear in the video.

Example output (TXT format):

```
어렸을 때부터
제 꿈은 딱 하나였어요

我從小到大只有一個夢想

이 세상에 있는 영화를 다 보는 것

就是看遍世上每一部電影
```

#### Paired Mode

In paired mode, the application attempts to match subtitles from the second language with those from the first language based on timing. Each subtitle from the first language is followed by its matching subtitle from the second language.

Example output (TXT format):

```
어렸을 때부터
제 꿈은 딱 하나였어요
我從小到大只有一個夢想

이 세상에 있는 영화를 다 보는 것
就是看遍世上每一部電影
```

### Command Options

#### Convert Command

```bash
npm run convert -- convert <xmlFile> [options]
```

Options:

- `-o, --output <directory>`: Output directory (default: "./output")
- `-l, --language <language>`: Language of the XML file (kr or ch) (default: "kr")

#### Combine Command

```bash
npm run convert -- combine <xmlFile1> <xmlFile2> [options]
```

Options:

- `-o, --output <directory>`: Output directory (default: "./output")
- `-l1, --language1 <language>`: Language of the first XML file (kr or ch) (default: "kr")
- `-l2, --language2 <language>`: Language of the second XML file (kr or ch) (default: "ch")
- `-n, --name <n>`: Base name for the output files (default: "combined")
- `-m, --mode <mode>`: Combination mode: 'paired' (match subtitles) or 'timeline' (sort by time) (default: "timeline")

#### Default Command

```bash
npm run convert -- default [options]
```

Options:

- `-o, --output <directory>`: Output directory (default: "./output")
- `-m, --mode <mode>`: Combination mode: 'paired' (match subtitles) or 'timeline' (sort by time) (default: "timeline")

### Using the Script Directly

You can also run the application directly:

```bash
node src/index.js
```

This will process the default files (ep1-kr.xml and ep1-ch.xml) and create the following output files:

- `ep1-kr.srt`: Korean subtitles in SRT format
- `ep1-kr.txt`: Korean subtitles in TXT format
- `ep1-ch.srt`: Chinese subtitles in SRT format
- `ep1-ch.txt`: Chinese subtitles in TXT format
- `ep1-combined.srt`: Combined subtitles in SRT format (using timeline mode by default)
- `ep1-combined.txt`: Combined subtitles in TXT format (using timeline mode by default)

## File Formats

### SRT (SubRip Text)

SRT is a common subtitle format that includes timing information. Each subtitle entry consists of:

- A sequential number
- Start and end times in the format: HH:MM:SS,mmm
- The subtitle text
- A blank line to separate entries

Example:

```
1
00:00:14,014 --> 00:00:17,226
어렸을 때부터
제 꿈은 딱 하나였어요

2
00:00:40,207 --> 00:00:42,209
이 세상에 있는 영화를 다 보는 것
```

### TXT (Plain Text)

The TXT format contains only the subtitle text without timing information, with each subtitle separated by a blank line.

Example:

```
어렸을 때부터
제 꿈은 딱 하나였어요

이 세상에 있는 영화를 다 보는 것
```

## Dependencies

- [fast-xml-parser](https://www.npmjs.com/package/fast-xml-parser): For parsing XML files
- [fs-extra](https://www.npmjs.com/package/fs-extra): Enhanced file system operations
- [commander](https://www.npmjs.com/package/commander): Command-line interface

## License

MIT
