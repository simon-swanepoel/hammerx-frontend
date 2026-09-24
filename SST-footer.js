// SST-footer.js — Swan Study Tools Universal Fat Footer
class SSTFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <style>
        .sst-fat-footer-wrapper {
          width: 100vw;
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          background-color: #202124; /* Google Charcoal */
          border-top: 3px solid #b29c6d; /* Primary Top Gold Separation Line */
          position: relative;
          z-index: 100;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .sst-fat-footer-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 50px 24px 30px;
          box-sizing: border-box;
        }

        /* 6-Column Grid Layout */
        .sst-footer-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          width: 100%;
          box-sizing: border-box;
        }

        /* Individual Column Tower */
        .sst-footer-col {
          padding: 0 16px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          /* Vertical Gold Dividing Line to the right of each column */
          border-right: 1px solid #b29c6d;
        }

        /* Remove the right dividing line on the 6th column */
        .sst-footer-col:last-child {
          border-right: none;
        }

        /* Unlinkable Column Heading */
        .sst-footer-col-title {
          color: #b29c6d;
          font-size: 0.85rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          margin-bottom: 18px;
          padding-bottom: 6px;
          border-bottom: 1px solid rgba(178, 156, 109, 0.4);
          user-select: none;
          pointer-events: none; /* Explicitly non-linkable */
          line-height: 1.3;
        }

        .sst-footer-link-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* Linkable Item (Wraps cleanly to row 2 without breaking hit target) */
        .sst-footer-link {
          display: inline-block;
          color: #b29c6d;
          text-decoration: none;
          font-size: 0.8rem;
          font-weight: 600;
          line-height: 1.35;
          letter-spacing: 0.4px;
          word-wrap: break-word;
          overflow-wrap: break-word;
          white-space: normal;
          transition: all 0.2s ease-in-out;
          opacity: 0.85;
        }

        .sst-footer-link:hover {
          opacity: 1;
          color: #e2e4e9;
          transform: translateX(3px);
        }

        /* Bottom Status & Stamp Row */
        .sst-footer-bottom-bar {
          margin-top: 40px;
          padding-top: 18px;
          border-top: 1px solid rgba(178, 156, 109, 0.3);
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
          font-weight: 600;
          color: #b29c6d;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          opacity: 0.8;
        }

        /* Responsive collapse for tablets and mobile devices */
        @media (max-width: 1024px) {
          .sst-footer-grid {
            grid-template-columns: repeat(3, 1fr);
            row-gap: 30px;
          }
          .sst-footer-col:nth-child(3) {
            border-right: none;
          }
          .sst-footer-col {
            padding: 0 14px;
          }
        }

        @media (max-width: 640px) {
          .sst-footer-grid {
            grid-template-columns: 1fr;
            row-gap: 26px;
          }
          .sst-footer-col {
            border-right: none;
            border-bottom: 1px solid rgba(178, 156, 109, 0.4);
            padding: 0 0 16px 0;
          }
          .sst-footer-col:last-child {
            border-bottom: none;
          }
        }
      </style>

      <footer class="sst-fat-footer-wrapper">
        <div class="sst-fat-footer-container">
          <div class="sst-footer-grid">
            
            <!-- Column 1: Repetitive Tools -->
            <div class="sst-footer-col">
              <div class="sst-footer-col-title">Repetitive Tools</div>
              <ul class="sst-footer-link-list">
                <li><a href="HamLoad01.html" class="sst-footer-link">Formula Reflex Drill Engine</a></li>
                <li><a href="#mathhammer" class="sst-footer-link">Rapid KaTeX Typing Workspace</a></li>
                <li><a href="comparator.html" class="sst-footer-link">Noun Hammer Comparator Screen</a></li>
                <li><a href="#mindpad" class="sst-footer-link">Image Reticulation Hammer</a></li>
              </ul>
            </div>

            <!-- Column 2: Procedural Flow -->
            <div class="sst-footer-col">
              <div class="sst-footer-col-title">Procedural Flow</div>
              <ul class="sst-footer-link-list">
                <li><a href="#aviation-flows" class="sst-footer-link">Aviation Flow Verification Drills</a></li>
                <li><a href="#loto-seq" class="sst-footer-link">Industrial Lockout-Tagout Sequences</a></li>
                <li><a href="#stem-derivations" class="sst-footer-link">Multi-Step Mathematical Derivations</a></li>
                <li><a href="#interruption-test" class="sst-footer-link">Stress Interruption Recovery Flows</a></li>
              </ul>
            </div>

            <!-- Column 3: Ingestion & Milling -->
            <div class="sst-footer-col">
              <div class="sst-footer-col-title">Document Milling</div>
              <ul class="sst-footer-link-list">
                <li><a href="HAM37.html" class="sst-footer-link">Hammer-X Multi-Format Gateway</a></li>
                <li><a href="#list-sequencer" class="sst-footer-link">Text List Auto-Sequencer</a></li>
                <li><a href="#table-extractor" class="sst-footer-link">Spreadsheet Deck Converter</a></li>
                <li><a href="loader.html" class="sst-footer-link">Cloud Study Material Vault</a></li>
              </ul>
            </div>

            <!-- Column 4: Pre-Login Samples -->
            <div class="sst-footer-col">
              <div class="sst-footer-col-title">Pre-Login Samples</div>
              <ul class="sst-footer-link-list">
                <li><a href="#sample-kinematics" class="sst-footer-link">High School Physics Kinematics</a></li>
                <li><a href="#sample-circuits" class="sst-footer-link">Electrical Circuit Calculations</a></li>
                <li><a href="#sample-thermo" class="sst-footer-link">Thermodynamics Core Formulas</a></li>
                <li><a href="#sample-cessna" class="sst-footer-link">Cessna 172 Engine Loss Flow</a></li>
              </ul>
            </div>

            <!-- Column 5: Tutorials & Manuals -->
            <div class="sst-footer-col">
              <div class="sst-footer-col-title">Field Tutorials</div>
              <ul class="sst-footer-link-list">
                <li><a href="#tut-steno" class="sst-footer-link">Kinetic Input Guide & Shortcuts</a></li>
                <li><a href="#tut-recovery" class="sst-footer-link">Interruption Training Protocol</a></li>
                <li><a href="#tut-deck-craft" class="sst-footer-link">How to Prepare .TXT and .CSV Lists</a></li>
                <li><a href="#tut-export" class="sst-footer-link">Extracting Decks to Offline Devices</a></li>
              </ul>
            </div>

            <!-- Column 6: Institutional & Specs -->
            <div class="sst-footer-col">
              <div class="sst-footer-col-title">Institutional Tier</div>
              <ul class="sst-footer-link-list">
                <li><a href="#schools" class="sst-footer-link">School Packages (R1,000 Flat / Mo)</a></li>
                <li><a href="#architecture" class="sst-footer-link">Deterministic Engine Longevity</a></li>
                <li><a href="#privacy" class="sst-footer-link">Privacy & Student Protection Policy</a></li>
                <li><a href="#contact" class="sst-footer-link">Contact Engineering Administration</a></li>
              </ul>
            </div>

          </div>

          <!-- Base Info Bar -->
          <div class="sst-footer-bottom-bar">
            <span>&copy; 2026 Swan Study Tools &bull; Architectural Engine</span>
            <span>Zero Cognitive Lag</span>
          </div>
        </div>
      </footer>
    `;
  }
}

// Define the custom HTML tag
customElements.define("sst-footer", SSTFooter);