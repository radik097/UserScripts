/**
 * Unit tests for seek.user.js
 * 
 * Run: npm test
 * Watch: npm run test:watch
 * Coverage: npm run test:coverage
 */

// Mock seek.user.js functions (in real setup, extract to separate modules or use JSDoc @module)

/**
 * Parses salary from job listing text
 * @param {string} text - Salary text
 * @returns {number|null} Parsed salary or null
 */
function parseSalary(text) {
  if (!text) return null;
  
  // Format: $120k - $150k
  const kMatch = text.match(/\$(\d+)k/);
  if (kMatch) return parseInt(kMatch[1], 10) * 1000;
  
  // Format: $95,000 per annum
  const annumMatch = text.match(/\$(\d{1,3}(?:,\d{3})*)/);
  if (annumMatch) return parseInt(annumMatch[1].replace(/,/g, ''), 10);
  
  return null;
}

/**
 * Debounces a function
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in ms
 * @returns {Function} Debounced function
 */
function debounce(fn, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('parseSalary', () => {
  describe('k format (e.g., $120k)', () => {
    test('parses single salary with k suffix', () => {
      expect(parseSalary('$120k')).toBe(120000);
      expect(parseSalary('$85k')).toBe(85000);
      expect(parseSalary('$200k')).toBe(200000);
    });

    test('parses salary range with k suffix (takes lower bound)', () => {
      expect(parseSalary('$120k - $150k')).toBe(120000);
      expect(parseSalary('$80k-$100k')).toBe(80000);
    });

    test('handles zero salary', () => {
      expect(parseSalary('$0k')).toBe(0);
    });
  });

  describe('comma format (e.g., $95,000)', () => {
    test('parses salary with commas', () => {
      expect(parseSalary('$95,000')).toBe(95000);
      expect(parseSalary('$120,000')).toBe(120000);
      expect(parseSalary('$1,234,567')).toBe(1234567);
    });

    test('parses salary with "per annum"', () => {
      expect(parseSalary('$95,000 per annum')).toBe(95000);
      expect(parseSalary('$120,000 p.a.')).toBe(120000);
    });

    test('parses salary range with commas (takes lower bound)', () => {
      expect(parseSalary('$80,000 - $100,000')).toBe(80000);
    });
  });

  describe('edge cases', () => {
    test('returns null for empty or invalid input', () => {
      expect(parseSalary('')).toBeNull();
      expect(parseSalary(null)).toBeNull();
      expect(parseSalary(undefined)).toBeNull();
    });

    test('returns null for non-salary text', () => {
      expect(parseSalary('Competitive salary package')).toBeNull();
      expect(parseSalary('Salary not specified')).toBeNull();
      expect(parseSalary('Negotiable')).toBeNull();
    });

    test('handles whitespace', () => {
      expect(parseSalary('  $120k  ')).toBe(120000);
      expect(parseSalary('$95,000   per annum')).toBe(95000);
    });
  });
});

describe('debounce', () => {
  jest.useFakeTimers();

  afterEach(() => {
    jest.clearAllTimers();
  });

  test('delays function execution', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 200);

    debouncedFn();
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(200);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('cancels previous call when invoked again within delay', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 200);

    debouncedFn();
    jest.advanceTimersByTime(100);
    debouncedFn(); // Cancel previous
    jest.advanceTimersByTime(100);
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100); // 200ms from second call
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('passes arguments correctly', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 200);

    debouncedFn('arg1', 'arg2', 123);
    jest.advanceTimersByTime(200);
    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 123);
  });

  test('handles multiple rapid calls', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 200);

    debouncedFn('call1');
    jest.advanceTimersByTime(50);
    debouncedFn('call2');
    jest.advanceTimersByTime(50);
    debouncedFn('call3');
    jest.advanceTimersByTime(200);

    // Only last call should execute
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('call3');
  });

  test('preserves context (this)', () => {
    const obj = {
      value: 42,
      getValue: function() {
        return this.value;
      },
    };

    const debouncedGetValue = debounce(function() {
      return this.getValue();
    }, 200);

    const mockFn = jest.fn();
    const wrapper = function() {
      mockFn(debouncedGetValue.call(obj));
    };

    wrapper();
    jest.advanceTimersByTime(200);

    expect(mockFn).toHaveBeenCalledWith(42);
  });
});

describe('DOM manipulation', () => {
  beforeEach(() => {
    // Setup mock DOM
    document.body.innerHTML = `
      <div data-testid="job-list">
        <div data-testid="job-card" class="job">
          <h3 class="title">Senior Software Engineer</h3>
          <span data-testid="salary">$120k - $150k</span>
          <p class="location">Sydney NSW</p>
        </div>
        <div data-testid="job-card" class="job">
          <h3 class="title">Junior Developer</h3>
          <span data-testid="salary">$60k - $70k</span>
          <p class="location">Melbourne VIC</p>
        </div>
        <div data-testid="job-card" class="job">
          <h3 class="title">Project Manager</h3>
          <span data-testid="salary">Competitive package</span>
          <p class="location">Brisbane QLD</p>
        </div>
      </div>
    `;
  });

  test('finds job cards', () => {
    const jobCards = document.querySelectorAll('[data-testid="job-card"]');
    expect(jobCards).toHaveLength(3);
  });

  test('extracts salary from job cards', () => {
    const firstJob = document.querySelector('[data-testid="job-card"]');
    const salaryEl = firstJob.querySelector('[data-testid="salary"]');
    const salaryText = salaryEl.textContent;
    const salary = parseSalary(salaryText);

    expect(salary).toBe(120000);
  });

  test('safely sets text content (no XSS)', () => {
    const job = document.querySelector('[data-testid="job-card"]');
    const title = job.querySelector('.title');

    // Attempt to inject script
    title.textContent = '<script>alert("XSS")</script>';

    // Should be escaped automatically when accessed via innerHTML
    expect(title.innerHTML).toContain('&lt;script&gt;');
    expect(title.textContent).toBe('<script>alert("XSS")</script>');
  });

  test('safely sets attributes', () => {
    const job = document.querySelector('[data-testid="job-card"]');
    const salaryEl = job.querySelector('[data-testid="salary"]');
    const salary = parseSalary(salaryEl.textContent);

    // Safe attribute setting
    job.setAttribute('data-parsed-salary', salary.toString());

    expect(job.getAttribute('data-parsed-salary')).toBe('120000');
  });

  test('filters jobs by salary threshold', () => {
    const THRESHOLD = 100000;
    const jobCards = Array.from(document.querySelectorAll('[data-testid="job-card"]'));

    const highSalaryJobs = jobCards.filter(job => {
      const salaryEl = job.querySelector('[data-testid="salary"]');
      const salary = parseSalary(salaryEl?.textContent || '');
      return salary !== null && salary >= THRESHOLD;
    });

    expect(highSalaryJobs).toHaveLength(1);
    expect(highSalaryJobs[0].querySelector('.title').textContent).toBe('Senior Software Engineer');
  });
});
