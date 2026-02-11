// ==UserScript==
// @name            Jut.su Auto Plus Core Library
// @name:en         Jut.su Auto Plus Core Library
// @namespace       http://tampermonkey.net/
// @version         1.1.3
// @description     Ядро логики для Jut.su Auto Plus (API, обсерверы, парсинг названий, серверные функции донор/рецепиент)
// @description:en  Core logic for Jut.su Auto Plus (API, observers, title parsing, donor/recipient server functions)
// @author          Rodion
// @downloadURL     https://raw.githubusercontent.com/radik097/UserScripts/main/jutsu_plus/lib/JutsuCore.lib.js
// @updateURL       https://raw.githubusercontent.com/radik097/UserScripts/main/jutsu_plus/lib/JutsuCore.lib.js
// @match           https://jut.su/*
// @grant           GM_xmlhttpRequest
// @connect         jutsu.fun
// @connect         backup-domain.com
// @license         MIT
// ==/UserScript==

(function() {
	'use strict';
	
	// ========================================================================
	// JUT.SU AUTO PLUS CORE LIBRARY (Logic & API)
	// ========================================================================
	
	window.JutsuCore = (function() {
 
	const CONFIG = {
		baseUrl: 'https://consumet-api-yij6.onrender.com',
		retries: 2,
		timeout: 5000,
		providers: ['gogoanime', 'animekai', 'aniwatch'],
		servers: ['hd-1', 'vidstreaming', 'megacloud'],
		categories: ['sub', 'dub', 'raw']
	};

	const SERVER_CONFIG = {
		primary: 'https://jutsu.fun',
		fallback: 'https://backup-domain.com'
	};

	let currentServer = SERVER_CONFIG.primary;
 
	const logs = [];
	let debugMode = false;
 
	function setConfig(partial) {
		Object.assign(CONFIG, partial || {});
	}

	function setServerConfig(partial) {
		Object.assign(SERVER_CONFIG, partial || {});
		currentServer = SERVER_CONFIG.primary;
	}
 
	function setDebugMode(value) {
		debugMode = !!value;
	}
 
	function log(category, message, data = null) {
		const timestamp = new Date().toLocaleTimeString();
		const entry = {
			timestamp,
			category,
			message,
			data: data ? JSON.stringify(data, null, 2) : null
		};
		logs.push(entry);
		window.alisaLogs = logs;
 
		const shouldLog = debugMode || category.includes('ERROR') || category.includes('[API]');
		if (shouldLog && (category.includes('ERROR') || category.includes('[API]') || category.includes('[VIDEO]'))) {
			const style = `color: ${category.includes('ERROR') ? '#ff6b6b' : '#81a834'}; font-weight: bold;`;
			console.log(`%c[${timestamp}] ${category}%c ${message}`, style, 'color: inherit;');
			if (data && debugMode) console.log(data);
		}
	}
 
	function debug(message, details = null) {
		if (!debugMode) return;
		const timestamp = new Date().toLocaleTimeString();
		console.log(`%c[${timestamp}] [DEBUG] ${message}`, 'background: #ff9800; color: #fff; padding: 2px 6px; border-radius: 3px; font-weight: bold;');
		if (details) console.table(details);
	}
 
	function flushLogs() {
		if (!logs.length) return;
 
		const modeIndicator = debugMode ? ' DEBUG MODE' : '';
		console.group(`%cJut.su Auto+ Report — ${window.location.pathname}${modeIndicator}`, `background: ${debugMode ? '#ff9800' : '#4caf50'}; color: #fff; padding: 4px 8px; border-radius: 3px; font-weight: bold;`);
 
		logs.forEach((entry) => {
			const style = `color: ${entry.category.includes('ERROR') ? '#ff6b6b' : '#81a834'}; font-weight: bold;`;
			console.log(`%c[${entry.timestamp}] ${entry.category}%c ${entry.message}`, style, 'color: inherit; font-weight: normal;');
			if (entry.data) console.log(entry.data);
		});
 
		console.log(`%cTotal logs: ${logs.length} | Debug Mode: ${debugMode ? 'ON' : 'OFF'}`, 'color: #999; font-size: 11px;');
		console.groupEnd();
	}
 
	const observerManager = {
		observers: new Map(),
 
		create(name, callback, options = {}) {
			const defaultOptions = { childList: true, subtree: true, ...options };
			const observer = new MutationObserver(callback);
			this.observers.set(name, observer);
			log('[INIT]', `MutationObserver '${name}' created`, { options: defaultOptions });
			return observer;
		},
 
		observe(name, target = document.documentElement) {
			const observer = this.observers.get(name);
			if (!observer) {
				log('[ERROR]', `Observer '${name}' not found`);
				return null;
			}
			observer.observe(target, { childList: true, subtree: true });
			log('[INIT]', `Observer '${name}' attached to DOM`);
			return observer;
		},
 
		disconnect(name) {
			const observer = this.observers.get(name);
			if (!observer) return;
			observer.disconnect();
			this.observers.delete(name);
			log('[INIT]', `Observer '${name}' disconnected`);
		},
 
		disconnectAll() {
			this.observers.forEach((observer) => observer.disconnect());
			this.observers.clear();
			log('[INIT]', 'All observers disconnected');
		}
	};
 
	function validateAPIResponse(response) {
		if (!response || !response.responseText) {
			debug('Response validation failed: empty or missing');
			return null;
		}
 
		const text = response.responseText.trim();
		if (!text) {
			debug('Response text is empty after trim');
			return null;
		}
 
		if (response.status && (response.status >= 400 && response.status < 600)) {
			debug(`HTTP Error ${response.status}`, { responseLength: text.length });
			return null;
		}
 
		try {
			const parsed = JSON.parse(text);
			if (debugMode) {
				const resultCount = parsed.results?.length || parsed.data?.results?.length || 0;
				debug('✓ JSON parsed', { status: response.status, contentLength: text.length, resultCount: resultCount });
			}
			return parsed;
		} catch (e) {
			debug('JSON parse error', { error: e.message });
			return null;
		}
	}
 
	function gmRequestJson(url, contextLabel, retries = CONFIG.retries) {
		return new Promise((resolve) => {
			const startTime = performance.now();
			const attempt = (attemptNum) => {
				debug(`API request attempt ${attemptNum + 1}/${retries + 1}`, { url: url, context: contextLabel });
 
				GM_xmlhttpRequest({
					method: 'GET',
					url,
					timeout: CONFIG.timeout,
					headers: {
						'User-Agent': navigator.userAgent,
						'Referer': 'https://jut.su/',
						'Origin': 'https://jut.su',
						'Accept': 'application/json',
						'Accept-Language': 'en-US,en;q=0.9'
					},
					onload: (response) => {
						const duration = Math.round(performance.now() - startTime);
 
						if (debugMode) {
							console.log('%c[RAW RESPONSE]', 'background: #2196F3; color: #fff; padding: 2px 6px; border-radius: 3px; font-weight: bold;');
							console.log(`Status: ${response.status} | Duration: ${duration}ms | Length: ${response.responseText?.length || 0}`);
						}
 
						const data = validateAPIResponse(response);
						if (data) {
							debug('✅ API response parsed successfully', {
								context: contextLabel,
								status: response.status,
								duration: `${duration}ms`,
								resultCount: data.results?.length || data.data?.results?.length || 'N/A'
							});
							resolve(data);
							return;
						}
 
						if (attemptNum < retries) {
							debug(`🔄 Retrying (${attemptNum + 1}/${retries})...`, { delay: '1000ms' });
							setTimeout(() => attempt(attemptNum + 1), 1000);
						} else {
							log('[ERROR]', `API failure after ${retries + 1} attempts: ${contextLabel}`);
							debug('❌ All API retries exhausted', { context: contextLabel, totalDuration: `${duration}ms` });
							resolve(null);
						}
					},
					onerror: (error) => {
						const duration = Math.round(performance.now() - startTime);
						const errorMsg = error?.error?.message || error?.message || 'Unknown network error';
 
						if (attemptNum < retries) {
							debug(`⚠️ Request error, retrying (${attemptNum + 1}/${retries})...`, { error: errorMsg, delay: '1500ms' });
							setTimeout(() => attempt(attemptNum + 1), 1500);
						} else {
							log('[ERROR]', `Network error after retries: ${errorMsg}`, { context: contextLabel });
							debug('❌ Network error failed all retries', { error: errorMsg, totalDuration: `${duration}ms` });
							resolve(null);
						}
					},
					ontimeout: () => {
						const duration = Math.round(performance.now() - startTime);
						if (attemptNum < retries) {
							debug(`⏱️ Timeout, retrying (${attemptNum + 1}/${retries})...`, { duration: `${duration}ms` });
							setTimeout(() => attempt(attemptNum + 1), 2000);
						} else {
							log('[ERROR]', `Request timeout after ${retries + 1} attempts: ${contextLabel}`);
							debug('❌ Timeout on all retry attempts', { context: contextLabel, totalDuration: `${duration}ms` });
							resolve(null);
						}
					}
				});
			};
 
			attempt(0);
		});
	}

	function gmRequestServerJson(url, options = {}) {
		const { method = 'GET', data = null, contextLabel = 'server.request' } = options;

		return new Promise((resolve) => {
			const startTime = performance.now();

			if (debugMode) {
				debug(`🔄 Server request: ${method} ${url.replace(/^https?:\/\//, '')}`, {
					context: contextLabel,
					dataSize: data ? JSON.stringify(data).length : 0
				});
			}

			GM_xmlhttpRequest({
				method: method,
				url: url,
				timeout: CONFIG.timeout,
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				},
				data: data ? JSON.stringify(data) : null,
				onload: (response) => {
					const duration = Math.round(performance.now() - startTime);
					const parsed = validateAPIResponse(response);
					if (parsed) {
						if (debugMode) {
							debug('✅ Server response parsed', {
								context: contextLabel,
								status: response.status,
								duration: `${duration}ms`,
								responseSize: response.responseText?.length || 0
							});
						}
						resolve({ ok: true, data: parsed });
						return;
					}

					if (debugMode) {
						debug('❌ Server response invalid', {
							context: contextLabel,
							status: response.status,
							duration: `${duration}ms`,
							responseStart: response.responseText?.substring(0, 100)
						});
					}
					resolve({ ok: false, error: `Invalid response (${response.status})`, status: response.status });
				},
				onerror: (error) => {
					const duration = Math.round(performance.now() - startTime);
					const errorMsg = error?.error?.message || error?.message || 'Unknown network error';
					debug('❌ Network error', {
						context: contextLabel,
						error: errorMsg,
						duration: `${duration}ms`
					});
					resolve({ ok: false, error: errorMsg, network: true });
				},
				ontimeout: () => {
					const duration = Math.round(performance.now() - startTime);
					debug('⏱️ Request timeout', {
						context: contextLabel,
						duration: `${duration}ms`
					});
					resolve({ ok: false, error: 'Request timeout', timeout: true });
				}
			});
		});
	}

	async function requestServerWithFallback(path, options) {
		const primaryUrl = `${currentServer}${path}`;
		
		if (debugMode) {
			debug(`📡 Trying primary server: ${SERVER_CONFIG.primary}`, {
				path: path.substring(0, 50)
			});
		}
		
		let response = await gmRequestServerJson(primaryUrl, options);

		if (response.ok) {
			if (debugMode) {
				debug('✅ Primary server succeeded');
			}
			return response;
		}

		if (currentServer === SERVER_CONFIG.primary && SERVER_CONFIG.fallback) {
			currentServer = SERVER_CONFIG.fallback;
			const fallbackUrl = `${currentServer}${path}`;
			
			if (debugMode) {
				debug(`📡 Trying fallback server: ${SERVER_CONFIG.fallback}`, {
					reason: response?.error,
					path: path.substring(0, 50)
				});
			}
			
			response = await gmRequestServerJson(fallbackUrl, options);
			if (response.ok) {
				if (debugMode) {
					debug('✅ Fallback server succeeded');
				}
				return response;
			}
			
			if (debugMode) {
				debug('❌ Both primary and fallback servers failed', {
					primaryError: response?.error,
					fallbackError: response?.error
				});
			}
		}

		return response;
	}

	async function contributeAnime(payload) {
		if (debugMode) {
			debug('🎬 Contribute anime: preparing to send donor link', {
				anime: payload?.animeId,
				episode: payload?.episode,
				quality: payload?.quality,
				urlLength: payload?.url?.length || 0
			});
		}
		
		const result = await requestServerWithFallback('/contribute', {
			method: 'POST',
			data: payload,
			contextLabel: 'server.contribute'
		});
		
		if (debugMode) {
			debug('🎬 Contribute anime: response received', {
				ok: result?.ok,
				error: result?.error,
				hasData: !!result?.data
			});
		}
		
		return result;
	}

	// ========================================================================
	// GITHUB SYNC DATABASE SYSTEM
	// ========================================================================

	const GitHubQueue = {
		queue: Promise.resolve(),
		async add(task) {
			this.queue = this.queue.then(async () => {
				try {
					await task();
				} catch (err) {
					log('[ERROR]', 'GitHub Queue task failed', { error: err.message });
				}
			});
			return this.queue;
		}
	};

	function isPlusUser() {
		// Detection of jut.su+ subscription
		const hasPlusClass = !!document.querySelector('.player_plus_active');
		const hasPlusPlayer = !!document.querySelector('#my-player.vjs-plus-player');
		const hasPlusVar = typeof window.is_plus !== 'undefined' ? !!window.is_plus : false;
		
		const result = hasPlusClass || hasPlusPlayer || hasPlusVar;
		if (debugMode) debug('Subscription check', { isPlus: result, hasPlusClass, hasPlusPlayer, hasPlusVar });
		return result;
	}

	async function githubFetch(repo, path) {
		if (!repo || !path) return null;
		
		const url = `https://raw.githubusercontent.com/${repo}/main/${path}?t=${Date.now()}`;
		try {
			const res = await fetch(url);
			if (!res.ok) {
				if (res.status !== 404) log('[ERROR]', `GitHub Fetch failed: ${res.status}`);
				return null;
			}
			return await res.json();
		} catch (e) {
			log('[ERROR]', 'GitHub Fetch exception', { error: e.message });
			return null;
		}
	}

	async function githubUpdate(repo, path, token, updateFn) {
		if (!repo || !path || !token || typeof updateFn !== 'function') return;

		return GitHubQueue.add(async () => {
			const apiUrl = `https://api.github.com/repos/${repo}/contents/${path}`;
			const headers = {
				'Authorization': `token ${token}`,
				'Accept': 'application/vnd.github.v3+json'
			};

			const request = (method, data = null) => new Promise(resolve => {
				GM_xmlhttpRequest({
					method,
					url: apiUrl,
					headers: { ...headers, ...(data ? { 'Content-Type': 'application/json' } : {}) },
					data: data ? JSON.stringify(data) : null,
					onload: resolve,
					onerror: (e) => resolve({ status: 500, responseText: e.message })
				});
			});

			// 1. Get current state
			const res = await request('GET');
			let sha = null;
			let currentData = {};

			if (res.status === 200) {
				const data = JSON.parse(res.responseText);
				sha = data.sha;
				try {
					currentData = JSON.parse(decodeURIComponent(escape(atob(data.content.replace(/\s/g, '')))));
				} catch (e) { currentData = {}; }
			} else if (res.status !== 404) {
				log('[ERROR]', `GitHub API Error: ${res.status}`);
				return;
			}

			// 2. Process
			const newData = updateFn(currentData);
			if (!newData) return;

			const base64 = btoa(unescape(encodeURIComponent(JSON.stringify(newData, null, 2))));
			
			// 3. Push
			const putRes = await request('PUT', {
				message: `Sync Links DB: ${new Date().toISOString()}`,
				content: base64,
				sha
			});

			if (putRes.status < 300) {
				debug('✅ GitHub Links DB successfully synced');
			} else {
				log('[ERROR]', `GitHub Push failed: ${putRes.status}`);
			}
		});
	}

	async function getDonorLinks(payload) {
		if (debugMode) {
			debug('📥 Get donor links: requesting from server', {
				anime: payload?.animeId,
				episode: payload?.episode
			});
		}
		
		const query = new URLSearchParams({
			anime: payload?.animeId || '',
			ep: payload?.episode || ''
		}).toString();
		const path = `/links?${query}`;

		const result = await requestServerWithFallback(path, {
			method: 'GET',
			data: null,
			contextLabel: 'server.links'
		});
		
		if (debugMode) {
			debug('📥 Get donor links: response received', {
				ok: result?.ok,
				error: result?.error,
				linksCount: result?.data?.data?.links?.length || 0
			});
		}
		
		return result;
	}
 
	function getEpisodeInfo() {
		const pathMatch = window.location.pathname.match(/season-(\d+).*episode-(\d+)/);
		if (pathMatch) {
			return { season: pathMatch[1], episode: pathMatch[2] };
		}
		const epMatch = window.location.pathname.match(/episode-(\d+)/);
		return { season: null, episode: epMatch ? epMatch[1] : null };
	}
 
	function buildTitleVariants(rawTitle, episode) {
		const variants = [];
		const seen = new Set();
		const hasCyrillic = (value) => /[\u0400-\u04FF]/.test(value || '');
		const translitMap = {
			'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
			'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
			'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
			'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
			'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
		};
		const translit = (value) => (value || '')
			.toLowerCase()
			.split('')
			.map((char) => translitMap[char] ?? char)
			.join('')
			.replace(/\s+/g, ' ')
			.trim();
		const add = (value) => {
			const normalized = (value || '').replace(/\s+/g, ' ').trim();
			if (!normalized || seen.has(normalized)) return;
			seen.add(normalized);
			variants.push(normalized);
		};
 
		const slug = (window.location.pathname.split('/').filter(Boolean)[0] || '')
			.replace(/[-_]/g, ' ')
			.replace(/\d+/g, '')
			.trim();
		add(slug);
 
		add(rawTitle);
 
		let cleaned = (rawTitle || '')
			.replace(/^\s*смотреть\s+/iu, '')
			.replace(/\s+на\s+jut\.su\s*$/iu, '')
			.replace(/\s*\(jut\.su\)\s*$/iu, '')
			.replace(/\s+(на\s+)?русском\s*$/iu, '')
			.replace(/\s*-\s*anime\s*$/iu, '')
			.replace(/\s*\[.*?\]\s*/g, '')
			.replace(/\s*\(.*?\)\s*/g, '')
			.trim();
 
		cleaned = cleaned
			.replace(/\s+(\d+)\s+(серия|серии|серий|епизод|episode|episode\s*\d+)\s*$/iu, '')
			.replace(/\s+(season\s+\d+\s+)?episode\s+\d+\s*$/iu, '')
			.replace(/\s+part\s+\d+\s*$/iu, '')
			.trim();
 
		add(cleaned);
 
		if (episode) {
			const noEp = (rawTitle || '')
				.replace(new RegExp(`\\b${episode}\\b\\s*(серия|серии|серий|епизод|episode)?`, 'iu'), '')
				.replace(/^\s*смотреть\s+/iu, '')
				.trim();
			add(noEp);
		}
 
		const words = rawTitle ? rawTitle.split(/\s+/) : [];
		if (words.length > 2) {
			add(words.slice(0, Math.min(3, words.length)).join(' ').replace(/^смотреть\s+/iu, '').trim());
		}
 
		if (hasCyrillic(cleaned)) add(translit(cleaned));
		if (hasCyrillic(rawTitle)) add(translit(rawTitle));
 
		const filtered = variants.filter((value) => value && !hasCyrillic(value));
		debug('Title variants generated', { original: rawTitle, variants: filtered, count: filtered.length });
		return filtered;
	}
 
	function pickEpisode(episodes, episodeNumber) {
		if (!Array.isArray(episodes) || !episodes.length) return null;
		if (episodeNumber) {
			const byNumber = episodes.find((ep) => String(ep.number ?? ep.episode ?? ep.episodeNumber) === String(episodeNumber));
			return byNumber || episodes[0];
		}
		return episodes[0];
	}
 
	function buildUrlMapFromSources(sources) {
		const urls = {};
		(sources || []).forEach((source) => {
			const quality = source.quality || (source.isM3U8 ? 'hls' : 'default');
			if (source.url && !urls[quality]) {
				urls[quality] = source.url;
			}
		});
		if (!urls.default && sources?.[0]?.url) {
			urls.default = sources[0].url;
		}
		return urls;
	}
 
	async function fetchOriginalTitle() {
		try {
			debug('Attempting to fetch title from page');
			const titleElement = document.querySelector('h1.post_title, h1, [data-test="title"]');
			if (titleElement) {
				const title = titleElement.textContent.trim();
				debug('Title found via element selector', {
					selector: 'h1.post_title, h1, [data-test="title"]',
					title: title
				});
				return title;
			}
			const fallbackTitle = document.title.split('—')[0].trim();
			debug('Title extracted from document.title', { title: fallbackTitle });
			return fallbackTitle;
		} catch (e) {
			log('[ERROR]', 'Failed to fetch original title', { error: e.message });
			debug('Exception while fetching title', {
				error: e.message,
				stack: e.stack?.substring(0, 200)
			});
			return null;
		}
	}
 
	async function fetchConsumetResults(title, episode) {
		try {
			const results = [];
 
			for (const provider of CONFIG.providers) {
				const searchUrl = `${CONFIG.baseUrl}/anime/${provider}/${encodeURIComponent(title)}?page=1`;
				const searchData = await gmRequestJson(searchUrl, `consumet.${provider}.search`);
				const searchResults = searchData?.results || [];
				if (!searchResults.length) continue;
 
				const limitedResults = searchResults.slice(0, 3);
 
				for (const item of limitedResults) {
					try {
						const infoUrl = `${CONFIG.baseUrl}/anime/${provider}/info/${encodeURIComponent(item.id)}`;
						const infoData = await gmRequestJson(infoUrl, `consumet.${provider}.info`);
						let episodes = infoData?.episodes || [];
						if (!episodes.length) {
							const epsUrl = `${CONFIG.baseUrl}/anime/${provider}/episodes/${encodeURIComponent(item.id)}`;
							const epsData = await gmRequestJson(epsUrl, `consumet.${provider}.episodes`);
							episodes = epsData?.episodes || epsData || [];
						}
 
						const episodeItem = pickEpisode(episodes, episode);
						const episodeId = episodeItem?.id || episodeItem?.episodeId;
						if (!episodeId) {
							debug('Consumet episodeId missing', { provider, title: item.title });
							continue;
						}
 
						let sources = [];
						for (const category of CONFIG.categories) {
							for (const server of CONFIG.servers) {
								const watchUrl = `${CONFIG.baseUrl}/anime/${provider}/watch/${encodeURIComponent(episodeId)}?server=${encodeURIComponent(server)}&category=${encodeURIComponent(category)}`;
								const watchData = await gmRequestJson(watchUrl, `consumet.${provider}.watch`);
								sources = watchData?.sources || [];
								if (sources.length) break;
							}
							if (sources.length) break;
						}
 
						if (!sources.length) continue;
 
						const urls = buildUrlMapFromSources(sources);
						results.push({
							id: item.id,
							title: item.title,
							provider: provider,
							type: 'stream',
							link: urls.default,
							urls: urls,
							quality: sources[0]?.quality || 'auto'
						});
					} catch (itemError) {
						debug('Consumet item processing error', { title: item.title, error: itemError.message });
						continue;
					}
				}
 
				if (results.length) break;
			}
 
			return results;
		} catch (err) {
			debug('Consumet provider error', { error: err.message });
			return [];
		}
	}
 
	window.alisaLogs = logs;
 
	return {
		setConfig,
		setServerConfig,
		setDebugMode,
		log,
		debug,
		flushLogs,
		observerManager,
		gmRequestJson,
		contributeAnime,
		getDonorLinks,
		getEpisodeInfo,
		buildTitleVariants,
		pickEpisode,
		buildUrlMapFromSources,
		fetchOriginalTitle,
		fetchConsumetResults,
		isPlusUser,
		githubFetch,
		githubUpdate
	};
	})();
	
})();