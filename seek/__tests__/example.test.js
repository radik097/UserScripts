/**
 * Example unit tests for userscript functions
 * 
 * To run: npm test
 * To watch: npm run test:watch
 * To coverage: npm run test:coverage
 */

describe('parseSalary', () => {
  /**
   * Mock function for testing (replace with actual import from userscript)
   * @param {string} text - Salary text to parse
   * @returns {number|null} Parsed salary or null
   */
  function parseSalary(text) {
    if (!text) return null;
    
    // Format: $120k - $150k (take lower bound)
    const kMatch = text.match(/\$(\d+)k/);
    if (kMatch) return parseInt(kMatch[1], 10) * 1000;
    
    // Format: $95,000 per annum
    const annum = text.match(/\$(\d{1,3}(?:,\d{3})*)/);
    if (annum) return parseInt(annum[1].replace(/,/g, ''), 10);
    
    return null;
  }

  test('parses salary with "k" suffix', () => {
    expect(parseSalary('$120k - $150k')).toBe(120000);
    expect(parseSalary('$85k')).toBe(85000);
  });

  test('parses salary with commas and "per annum"', () => {
    expect(parseSalary('$95,000 per annum')).toBe(95000);
    expect(parseSalary('$120,000 - $140,000')).toBe(120000);
  });

  test('returns null for missing salary', () => {
    expect(parseSalary('Salary not specified')).toBeNull();
    expect(parseSalary('')).toBeNull();
    expect(parseSalary(null)).toBeNull();
  });

  test('handles edge cases', () => {
    expect(parseSalary('Competitive salary package')).toBeNull();
    expect(parseSalary('$0k')).toBe(0);
  });
});

describe('debounce', () => {
  /**
   * Debounce function implementation
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

  jest.useFakeTimers();

  test('delays function execution', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 200);

    debouncedFn();
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(200);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('cancels previous call when invoked again', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 200);

    debouncedFn();
    jest.advanceTimersByTime(100);
    debouncedFn(); // This should cancel the previous call
    jest.advanceTimersByTime(100);
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100); // Total 200ms from second call
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('passes arguments correctly', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 200);

    debouncedFn('arg1', 'arg2');
    jest.advanceTimersByTime(200);
    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
  });
});

describe('DOM manipulation (jsdom)', () => {
  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div data-testid="job-list">
        <div data-testid="job-card" class="job">
          <span data-testid="salary">$120k - $150k</span>
          <h3 class="title">Senior Developer</h3>
        </div>
        <div data-testid="job-card" class="job">
          <span data-testid="salary">$60k - $70k</span>
          <h3 class="title">Junior Developer</h3>
        </div>
      </div>
    `;
  });

  test('highlights high salary jobs', () => {
    const THRESHOLD = 100000;
    const jobs = document.querySelectorAll('[data-testid="job-card"]');

    jobs.forEach(job => {
      const salaryEl = job.querySelector('[data-testid="salary"]');
      const salaryText = salaryEl?.textContent || '';
      const match = salaryText.match(/\$(\d+)k/);
      const salary = match ? parseInt(match[1], 10) * 1000 : null;

      if (salary && salary >= THRESHOLD) {
        job.style.backgroundColor = '#e8f5e9';
      }
    });

    const firstJob = jobs[0];
    const secondJob = jobs[1];

    expect(firstJob.style.backgroundColor).toBe('rgb(232, 245, 233)');
    expect(secondJob.style.backgroundColor).toBe('');
  });

  test('safely updates text content', () => {
    const job = document.querySelector('[data-testid="job-card"]');
    const title = job.querySelector('.title');

    // Safe update
    title.textContent = '<script>alert("XSS")</script>';
    
    // Should be escaped automatically
    expect(title.innerHTML).toBe('&lt;script&gt;alert("XSS")&lt;/script&gt;');
    expect(title.textContent).toBe('<script>alert("XSS")</script>');
  });
});
