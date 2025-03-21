# PDF Downloader Project

This project is a TypeScript application designed to download PDF files from a list of URLs and save them incrementally. It uses reactive programming with `rxjs` to handle asynchronous operations and manage resources effectively.

## Features

- **Concurrent Downloads**: Controls the number of concurrent downloads to manage resource usage.
- **Incremental Saving**: Saves progress after each download attempt to allow resuming from the last saved state.
- **Error Handling**: Includes robust error handling and retry logic for failed downloads.
- **Excel Integration**: Reads and updates Excel files to track download metadata.

## Prerequisites

- Node.js (version 14 or later)
- npm (Node Package Manager)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/kompost/week-4-pdf-downloader.git
   ```

2. Navigate to the project directory:
   ```bash
   cd week-4-pdf-downloader
   ```

3. Install the dependencies:
   ```bash
   npm install
   ```

## Usage

1. Ensure your Excel files are placed in the `data` directory with the correct filenames:
   - `GRI_2017_2020 (1).xlsx`
   - `Metadata2006_2016.xlsx`

2. Run the application:
   ```bash
   npm start
   ```

3. The application will download PDFs and save them in the `downloads` directory, updating the metadata in the Excel file.

## Configuration

- **Concurrency Limit**: Adjust the `concurrency_limit` variable in `src/index.ts` to change the number of concurrent downloads.

## Error Handling

- The application logs errors for failed downloads and attempts to retry using a secondary URL if available.

## Project Structure

- `src/`: Contains the TypeScript source files.
- `data/`: Contains the Excel files used for input and metadata tracking.
- `downloads/`: The directory where downloaded PDFs are saved.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any improvements or bug fixes.


