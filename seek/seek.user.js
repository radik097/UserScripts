// ==UserScript==
// @name         Seek Applied Jobs Parser & Exporter
// @namespace    userscripts.seek
// @version      1.0.0
// @description  Parse and export your applied jobs from seek.com.au to printable HTML with QR codes
// @author       Rodion Moroz
// @match        https://www.seek.com.au/my-activity/applied-jobs*
// @grant        none
// @run-at       document-idle
// @icon         data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E📋%3C/text%3E%3C/svg%3E
// @homepage     https://github.com/yourusername/seek-userscripts
// @supportURL   https://github.com/yourusername/seek-userscripts/issues
// @license      MIT
// ==/UserScript==

/**
 * Seek Applied Jobs Parser & Exporter
 * 
 * Парсит информацию о поданных заявках с seek.com.au
 * и генерирует HTML страницу для печати с QR кодами
 * 
 * ИСПОЛЬЗОВАНИЕ:
 * 1. Откройте https://www.seek.com.au/my-activity/applied-jobs
 * 2. В правом верхнем углу появится панель управления
 * 3. Нажмите "🚀 Start Collection" для сбора данных
 * 4. Дождитесь завершения (скрипт пройдёт все страницы автоматически)
 * 5. Нажмите "📄 Export to HTML" для генерации страницы
 * 6. Распечатайте или сохраните как PDF
 * 
 * ЧТО СОБИРАЕТСЯ:
 * - Название вакансии
 * - Работодатель
 * - Локация
 * - Дата подачи заявки
 * - Прикреплённые документы (резюме, cover letter)
 * - Статистика (количество кандидатов, % с резюме)
 * - QR код для быстрого доступа к вакансии
 * 
 * НАСТРОЙКИ (см. CONFIG ниже):
 * - autoClickDelay: 500ms - задержка между кликами
 * - pageLoadDelay: 2000ms - задержка загрузки страницы
 * 
 * ПОЛНАЯ ИНСТРУКЦИЯ: См. USAGE.md в репозитории
 */

(function() {
  'use strict';
  
  // ============================================================================
  // Configuration
  // ============================================================================
  
  const CONFIG = {
    enabled: true,
    debug: true,
    qrCodeAPI: 'https://api.qrserver.com/v1/create-qr-code/', // QR code generation API
    autoClickDelay: 500, // ms delay between auto-clicks
    pageLoadDelay: 2000, // ms delay for page/modal to load
  };
  
  // ============================================================================
  // State
  // ============================================================================
  
  /** @type {Array<Object>} */
  const collectedJobs = [];
  
  /** @type {boolean} */
  let isCollecting = false;
  
  /** @type {number} */
  let currentJobIndex = 0;
  
  // ============================================================================
  // Utility Functions
  // ============================================================================
  
  /**
   * Debounces a function
   * @param {Function} fn - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  function debounce(fn, delay) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  }
  
  /**
   * Logs debug message if debug mode is enabled
   * @param {...any} args - Arguments to log
   */
  function debug(...args) {
    if (CONFIG.debug) {
      console.log('[Seek Enhanced]', ...args);
    }
  }
  
  /**
   * Logs error message
   * @param {...any} args - Arguments to log
   *Parsing Functions
  // ============================================================================
  
  /**
   * Extracts basic job info from job card
   * @param {Element} jobCard - Job card element
   * @returns {Object|null} Job data or null
   */
  function parseJobCard(jobCard) {
    try {
      const data = {};
      
      // Job Title
      const titleElement = jobCard.querySelector('h4 span[role="button"]');
      data.title = titleElement ? titleElement.textContent.replace(/^Job Title\s*/, '').trim() : 'Unknown';
      
      // Advertiser
      const advertiserSpans = jobCard.querySelectorAll('span.gvmuvf4');
      for (const span of advertiserSpans) {
        const text = span.textContent;
        if (text.includes('Advertiser')) {
          data.advertiser = text.replace(/^Advertiser\s*/, '').trim();
          break;
        }
      }
      
      // Location
      for (const span of advertiserSpans) {
        const text = span.textContent;
        if (text.includes('Location')) {
          data.location = text.replace(/^Location\s*/, '').trim();
          break;
        }
      }
      
      // Applied date
      const dateElements = jobCard.querySelectorAll('span._1a24cyy1u');
      for (const el of dateElements) {
        const text = el.textContent;
        if (/\d+\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/.test(text)) {
          data.appliedDate = text.split(' ').slice(0, 3).join(' ').trim();
          break;
        }
      }
      
      // Job URL (from View job link if available, or construct from title)
      const viewJobLink = jobCard.querySelector('a[href*="/job/"]');
      if (viewJobLink) {
        const href = viewJobLink.getAttribute('href');
        data.jobUrl = `https://www.seek.com.au${href}`;
        // Extract job ID
        const jobIdMatch = href.match(/\/job\/(\d+)/);
        data.jobId = jobIdMatch ? jobIdMatch[1] : null;
      }
      
      debug('Parsed job card:', data);
      return data;
      
    } catch (err) {
      error('Error parsing job card:', err);
      return null;
    }
  }
  // ============================================================================
  
  /**
   * Collects all job cards on current page
   * @returns {Array<Element>} Array of job card elements
   */
  function getJobCardsOnPage() {
    try {
      return Array.from(document.querySelectorAll('[data-automation^="job-item-"]'));
    } catch (err) {
      error('Error getting job cards on page:', err);
      return [];
    }
  }
  
  /**
   * Clicks on job card to expand details
   * @param {Element} jobCard - Job card element
   * @returns {Promise<Element|null>} Details panel element
   */
  async function expandJobDetails(jobCard) {
    try {
      // Find clickable title
      const titleButton = jobCard.querySelector('h4 span[role="button"]');
      if (!titleButton) {
        error('Title button not found');
        return null;
      }
      
      debug('Clicking on job title...');
      titleButton.click();
      
      // Wait for details panel to appear
      await sleep(CONFIG.pageLoadDelay);
      
      // Find the expanded details panel
      const detailsPanel = document.querySelector('[class*="_112a9ns59"][class*="_112a9nshh"][class*="_112a9ns75"]');
      if (!detailsPanel) {
        error('Details panel not found after click');
        return null;
      }
      
      debug('Details panel found');
      return detailsPanel;
      
    } catch (err) {
      error('Error expanding job details:', err);
      return null;
    }
  }
  
  /**
   * Closes the expanded job details
   */
  function closeJobDetails() {
    // Click outside or press ESC
    const backdrop = document.querySelector('[role="dialog"], [aria-modal="true"]');
    if (backdrop) {
      const closeButton = backdrop.querySelector('button[aria-label*="lose"], button[aria-label*="ack"]');
      if (closeButton) {
        closeButton.click();
      } else {
        // Try pressing ESC
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape' }));
      }
    }
  }
  
  /**
   * Generates QR code URL for job
   * @param {string} url - Job URL
   * @returns {string} QR code image URL
   */
  function generateQRCode(url) {
    const encodedUrl = encodeURIComponent(url);
    return `${CONFIG.qrCodeAPI}?size=150x150&data=${encodedUrl}`;
  }
  
  /**
   * Generates printable HTML page
   * @param {Array<Object>} jobs - Collected jobs data
   * @returns {string} HTML content
   */
  function generatePrintableHTML(jobs) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Seek Applications - ${new Date().toLocaleDateString()}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.4;
      color: #1a1a1a;
    }
    
    .header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #2557a7;
    }
    
    .header h1 {
      font-size: 18pt;
      color: #2557a7;
      margin-bottom: 5px;
    }
    
    .header p {
      font-size: 10pt;
      color: #666;
    }
    
    .job-item {
      page-break-inside: avoid;
      break-inside: avoid;
      margin-bottom: 15mm;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: #fff;
    }
    
    .job-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 10px;
    }
    
    .job-info {
      flex: 1;
      padding-right: 10px;
    }
    
    .job-title {
      font-size: 12pt;
      font-weight: bold;
      color: #2557a7;
      margin-bottom: 4px;
    }
    
    .job-company {
      font-size: 10pt;
      font-weight: 600;
      color: #333;
      margin-bottom: 4px;
    }
    
    .job-meta {
      font-size: 9pt;
      color: #666;
      margin: 2px 0;
    }
    
    .job-qr {
      flex-shrink: 0;
      text-align: center;
    }
    
    .job-qr img {
      width: 80px;
      height: 80px;
      border: 1px solid #ddd;
    }
    
    .job-qr-label {
      font-size: 8pt;
      color: #666;
      margin-top: 2px;
    }
    
    .job-details {
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1px solid #eee;
    }
    
    .detail-section {
      margin-bottom: 6px;
    }
    
    .detail-label {
      font-weight: 600;
      font-size: 9pt;
      color: #555;
      margin-bottom: 2px;
    }
    
    .detail-value {
      font-size: 9pt;
      color: #333;
      padding-left: 8px;
    }
    
    .stats-list {
      list-style: none;
      padding-left: 8px;
    }
    
    .stats-list li {
      font-size: 8pt;
      color: #666;
      margin: 2px 0;
      padding-left: 12px;
      position: relative;
    }
    
    .stats-list li:before {
      content: "•";
      position: absolute;
      left: 0;
      color: #2557a7;
    }
    
    .footer {
      margin-top: 15mm;
      padding-top: 10px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 9pt;
      color: #999;
    }
    
    @media print {
      .no-print {
        display: none;
      }
      
      body {
        background: white;
      }
      
      .job-item {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>My Seek Applications</h1>
    <p>Generated on ${new Date().toLocaleDateString('en-AU', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}</p>
    <p>Total Applications: ${jobs.length}</p>
  </div>

  ${jobs.map((job, index) => `
  <div class="job-item">
    <div class="job-header">
      <div class="job-info">
        <div class="job-title">${escapeHtml(job.title || 'Unknown Position')}</div>
        <div class="job-company">${escapeHtml(job.advertiser || 'Unknown Company')}</div>
        <div class="job-meta">📍 ${escapeHtml(job.location || 'Location not specified')}</div>
        <div class="job-meta">📅 Applied: ${escapeHtml(job.appliedDate || 'Date unknown')}</div>
        ${job.jobUrl ? `<div class="job-meta">🔗 ${escapeHtml(job.jobUrl)}</div>` : ''}
      </div>
      ${job.jobUrl ? `
      <div class="job-qr">
        <img src="${generateQRCode(job.jobUrl)}" alt="QR Code">
        <div class="job-qr-label">Scan to view</div>
      </div>
      ` : ''}
    </div>
    
    ${job.resume || job.coverLetter || (job.statistics && job.statistics.length > 0) ? `
    <div class="job-details">
      ${job.resume ? `
      <div class="detail-section">
        <div class="detail-label">📄 Resume:</div>
        <div class="detail-value">${escapeHtml(job.resume)}</div>
      </div>
      ` : ''}
      
      ${job.coverLetter && !job.coverLetter.includes('No cover letter') ? `
      <div class="detail-section">
        <div class="detail-label">📝 Cover Letter:</div>
        <div class="detail-value">${escapeHtml(job.coverLetter)}</div>
      </div>
      ` : ''}
      
      ${job.statistics && job.statistics.length > 0 ? `
      <div class="detail-section">
        <div class="detail-label">📊 Statistics:</div>
        <ul class="stats-list">
          ${job.statistics.map(stat => `<li>${escapeHtml(stat)}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
    </div>
    ` : ''}
  </div>
  `).join('')}

  <div class="footer">
    <p>Document generated by Seek Applied Jobs Parser & Exporter</p>
    <p>For personal use only • Seek.com.au © ${new Date().getFullYear()}</p>
  </div>

  <script class="no-print">
    // Auto-print dialog
    window.onload = function() {
      const autoPrint = confirm('Open print dialog automatically?');
      if (autoPrint) {
        window.print();
      }
    };
  </script>
</body>
</html>`;
    
    return html;
  }
  
  /**
   * Escapes HTML special characters
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  /**
   * Opens generated HTML in new window/tab
   */
  function exportToHTML() {
    if (collectedJobs.length === 0) {
      alert('No jobs collected yet. Please click "Start Collection" first.');
      return;
    }
    
    const html = generatePrintableHTML(collectedJobs);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Open in new window
    const newWindow = window.open(url, '_blank');
    if (!newWindow) {
      // Fallback: download as file
      const a = document.createElement('a');
      a.href = url;
      a.download = `seek-applications-${new Date().toISOString().split('T')[0]}.html`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }
  
  // ============================================================================
  // UI Creation
  // ============================================================================
  
  /**
   * Creates control panel UI
   */
  function createControlPanel() {
    const panel = document.createElement('div');
    panel.id = 'seek-parser-panel';
    panel.innerHTML = `
      <style>
        #seek-parser-panel {
          position: fixed;
          top: 80px;
          right: 20px;
          background: white;
          border: 2px solid #2557a7;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 10000;
          min-width: 250px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        }
        
        #seek-parser-panel h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #2557a7;
        }
        
        #seek-parser-panel button {
          width: 100%;
          padding: 10px;
          margin: 5px 0;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        #seek-collect-btn {
          background: #2557a7;
          color: white;
        }
        
        #seek-collect-btn:hover:not(:disabled) {
          background: #1a3f7a;
        }
        
        #seek-export-btn {
          background: #28a745;
          color: white;
        }
        
        #seek-export-btn:hover:not(:disabled) {
          background: #218838;
        }
        
        #seek-export-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        
        #seek-parser-panel button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        #seek-progress {
          margin: 10px 0;
          font-size: 12px;
          color: #666;
          min-height: 20px;
        }
        
        .seek-status {
          padding: 8px;
          background: #f0f0f0;
          border-radius: 4px;
          font-size: 12px;
          margin: 5px 0;
        }
      </style>
      
      <h3>📋 Seek Jobs Parser</h3>
      <div class="seek-status">
        Jobs collected: <strong id="seek-count">0</strong>
      </div>
      <div id="seek-progress"></div>
      <button id="seek-collect-btn">🚀 Start Collection</button>
      <button id="seek-export-btn" disabled>📄 Export to HTML</button>
    `;
    
    document.body.appendChild(panel);
    
    // Attach event listeners
    document.getElementById('seek-collect-btn').addEventListener('click', async () => {
      const btn = document.getElementById('seek-collect-btn');
      btn.disabled = true;
      btn.textContent = '⏳ Collecting...';
      
      await collectAllJobs();
      
      btn.disabled = false;
      btn.textContent = '🔄 Re-collect';
    });
    
    document.getElementById('seek-export-btn').addEventListener('click', exportToHTML);
  }
  
  /**
   * Updates progress text
   * @param {string} message - Progress message
   */
  function updateProgress(message) {
    const progressEl = document.getElementById('seek-progress');
    const countEl = document.getElementById('seek-count');
    
    if (progressEl) {
      progressEl.textContent = message;
    }
    
    if (countEl) {
      countEl.textContent = collectedJobs.length.toString();
    }
  }
  
  // ============================================================================
  // Initialization
  // ============================================================================
  
  /**
   * Initializes the userscript
   */
  function init() {
    debug('Initializing Seek Applied Jobs Parser...');
    
    if (!CONFIG.enabled) {
      debug('Userscript disabled in config');
      return;
    }
    
    // Check if we're on the applied jobs page
    if (!window.location.href.includes('/my-activity/applied-jobs')) {
      debug('Not on applied jobs page');
      return;
    }
    
    // Create control panel
    createControlPanel();
    
    debug('Control panel created');
  }
  
  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  debug('Seek Applied Jobs Parser loaded');
  
  /**
   * Collects all jobs on current page
   * @returns {Promise<void>}
   */
  async function collectJobsOnPage() {
    const jobCards = getJobCardsOnPage();
    debug(`Found ${jobCards.length} job cards on page`);
    
    for (let i = 0; i < jobCards.length; i++) {
      debug(`Processing job ${i + 1}/${jobCards.length}`);
      updateProgress(`Processing job ${i + 1}/${jobCards.length}...`);
      
      const jobData = await processSingleJob(jobCards[i]);
      if (jobData) {
        collectedJobs.push(jobData);
        debug('Job collected:', jobData.title);
      }
    }
  }
  
  /**
   * Clicks next page button
   * @returns {Promise<boolean>} True if next page exists and clicked
   */
  async function goToNextPage() {
    const nextButton = document.querySelector('a[rel="next"]');
    if (!nextButton || nextButton.getAttribute('aria-hidden') === 'true') {
      debug('No next page button found');
      return false;
    }
    
    debug('Clicking next page...');
    nextButton.click();
    await sleep(CONFIG.pageLoadDelay);
    return true;
  }
  
  /**
   * Main collection loop - processes all pages
   * @returns {Promise<void>}
   */
  async function collectAllJobs() {
    if (isCollecting) {
      debug('Collection already in progress');
      return;
    }
    
    isCollecting = true;
    collectedJobs.length = 0; // Clear previous data
    currentJobIndex = 0;
    
    try {
      let pageNumber = 1;
      let hasNextPage = true;
      
      while (hasNextPage) {
        debug(`Processing page ${pageNumber}...`);
        updateProgress(`Processing page ${pageNumber}...`);
        
        await collectJobsOnPage();
        
        hasNextPage = await goToNextPage();
        pageNumber++;
      }
      
      debug(`Collection complete! Total jobs: ${collectedJobs.length}`);
      updateProgress(`✅ Collected ${collectedJobs.length} jobs!`);
      
      // Enable export button
      const exportBtn = document.getElementById('seek-export-btn');
      if (exportBtn) {
        exportBtn.disabled = false;
        exportBtn.textContent = `📄 Export ${collectedJobs.length} Jobs to HTML`;
      }
      
    } catch (err) {
      error('Error during collection:', err);
      updateProgress(`❌ Error: ${err.message}`);
    } finally {
      isCollecting = false;
    }
  }
  
  /**
   * Sleep utility
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
})();
