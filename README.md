# AI WCAG Accessibility Auditor

A lightweight, browser-based auditing tool that leverages the power of Google Gemini AI to evaluate web accessibility compliance against WCAG 2.2 standards (Levels A and AA).

Designed for QA Engineers and developers who need a quick, intelligent assessment of web components, this tool allows for the analysis of raw HTML source code and visual screenshots to detect accessibility barriers.

## Project Structure

```text
wcag-auditor/
├── images/                # Assets and branding
│   ├── favicon.png        # Browser tab icon
│   └── social-share.png   # Open Graph social media image
├── index.html             # Main application entry point
├── LICENSE                # Project license information
├── README.md              # Project documentation
├── script.js              # Core auditing logic and AI integration
└── style.css              # Styling and responsive layout
```

## Features

- **Intelligent Audit:** Uses Google Gemini (via `@google/genai`) to provide detailed accessibility insights.
- **Context-Aware:** Analyzes both HTML structure and visual UI elements (via screenshot upload).
- **Structured Reporting:** Outputs a clear audit score, executive summary, and actionable lists of passed and failed criteria.
- **Offline-Ready Data:** Automatically saves your progress using `localStorage`, so your API key and input content persist across page refreshes.
- **Accessible by Design:** Built with modern accessibility best practices in mind (ARIA roles, keyboard navigation, focus management).
- **Export Capability:** Integrated support for exporting audit reports as printable PDFs.

## Prerequisites

- A valid **Google Gemini API Key**.
- A modern web browser with JavaScript enabled.
- **Visual Studio Code** (recommended for local development).

## Local Development & Usage

To run this tool locally with live reloading, it is recommended to use the **Live Server** extension for VS Code:

1.  **Install:** Open VS Code, go to the Extensions view (Ctrl+Shift+X), search for "Live Server" by Ritwick Dey, and click **Install**.
2.  **Open Folder:** Open the project folder containing your `index.html` file in VS Code.
3.  **Launch:** Right-click your `index.html` file in the File Explorer and select **"Open with Live Server"**.
4.  **Audit:** Your default browser will launch the application at `http://127.0.0.1:5500`. Any changes you make to the code will automatically reflect in the browser.

## How to Use

1.  **Configure:** Input your Google Gemini API Key in the configuration panel.
2.  **Setup:**
    - Enter the target URL you are auditing (optional).
    - Paste the raw HTML source code of the component or page.
    - (Optional) Upload a screenshot for enhanced visual contrast analysis.
3.  **Run:** Click _Run WCAG Audit_.
4.  **Review:** Examine the generated report detailing the compliance score, passed checks, and specific failures with suggested fixes.
5.  **Export:** Click _Export Report (PDF)_ to save the findings.

### _**NOTE:** This tool is aligned with the official [W3C WCAG 2.2 Recommendation](https://www.w3.org/TR/2024/REC-WCAG22-20241212/)_

## Development

This project is built using vanilla JavaScript and standard web technologies.

- **HTML5/CSS3:** Structure and responsive styling with CSS variables.
- **JavaScript (ES Modules):** Clean, modular code structure.
- **Gemini SDK:** Integration with the Google Generative AI SDK for intelligent analysis.

### License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

_Developed by Eugen Rof | QA Toolset_
