// Signal Grid - Intelligence Feed Display
class SignalGrid {
    constructor() {
        this.data = null;
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.savedSignals = this.loadSavedSignals();
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.updateMetrics();
        this.renderContent();
        this.updateRefreshTime();
        this.updateSystemInfo();
        this.startQuoteRotation();
    }

    // ===== BOOKMARKING SYSTEM =====
    loadSavedSignals() {
        try {
            const saved = localStorage.getItem('signalGrid_saved');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Failed to load saved signals:', e);
            return [];
        }
    }

    saveSavedSignals() {
        try {
            localStorage.setItem('signalGrid_saved', JSON.stringify(this.savedSignals));
        } catch (e) {
            console.error('Failed to save signals:', e);
        }
    }

    isSignalSaved(url) {
        return this.savedSignals.includes(url);
    }

    toggleSaveSignal(url, title) {
        const index = this.savedSignals.indexOf(url);
        
        if (index > -1) {
            // Remove from saved
            this.savedSignals.splice(index, 1);
            this.showToast(`Removed: ${title.substring(0, 50)}...`);
        } else {
            // Add to saved
            this.savedSignals.push(url);
            this.showToast(`✨ Saved: ${title.substring(0, 50)}...`);
        }
        
        this.saveSavedSignals();
        this.updateMetrics();
        this.renderContent();
    }

    showToast(message) {
        // Remove existing toast if any
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    startQuoteRotation() {
        const quotes = [
            "The only truly secure system is one that is powered off, cast in a block of concrete and sealed in a lead-lined room.",
            "Security is not a product, but a process. - Bruce Schneier",
            "In God we trust, all others we monitor. - NSA",
            "Hackers are breaking the systems for profit. Meanwhile, they're breaking the Internet for fun.",
            "The quieter you become, the more you are able to hear. - Kali Linux",
            "There is no patch for human stupidity.",
            "To understand a hacker, you have to think like one.",
            "The best way to predict the future is to invent it. Then hack it.",
            "Privacy is not an option, and it shouldn't be the price we accept for just getting on the Internet.",
            "Data is the new oil. Unfortunately, we're all getting drilled."
        ];
        
        const quoteEl = document.getElementById('rotatingQuote');
        if (!quoteEl) return;
        
        let currentIndex = 0;
        
        const showQuote = () => {
            quoteEl.style.opacity = '0';
            setTimeout(() => {
                quoteEl.textContent = quotes[currentIndex];
                quoteEl.style.opacity = '0.8';
                currentIndex = (currentIndex + 1) % quotes.length;
            }, 500);
        };
        
        showQuote();
        setInterval(showQuote, 8000);
    }

    updateSystemInfo() {
        const userAgentEl = document.getElementById('userAgent');
        const screenResEl = document.getElementById('screenRes');
        const localTimeEl = document.getElementById('localTime');
        
        if (!userAgentEl || !screenResEl || !localTimeEl) {
            console.log('System info elements not found - skipping');
            return;
        }
        
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Chrome')) browser = 'Chrome';
        else if (ua.includes('Safari')) browser = 'Safari';
        else if (ua.includes('Edge')) browser = 'Edge';
        
        userAgentEl.textContent = `${browser}`;
        screenResEl.textContent = `${screen.width}x${screen.height}`;
        
        const updateTime = () => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                timeZoneName: 'short'
            });
            localTimeEl.textContent = timeStr;
        };
        
        updateTime();
        setInterval(updateTime, 60000);
    }

    async loadData() {
        try {
            const response = await fetch('data.json');
            this.data = await response.json();
        } catch (error) {
            console.error('Failed to load data:', error);
            this.data = this.getDemoData();
        }
    }

    setupEventListeners() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.renderContent();
            });
        });

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const clearSearch = document.getElementById('clearSearch');
        
        if (searchInput && clearSearch) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                clearSearch.style.display = query ? 'block' : 'none';
                this.searchQuery = query;
                this.renderContent();
            });

            clearSearch.addEventListener('click', () => {
                searchInput.value = '';
                clearSearch.style.display = 'none';
                this.searchQuery = '';
                this.renderContent();
            });

            // Keyboard shortcut: / to focus search
            document.addEventListener('keydown', (e) => {
                if (e.key === '/' && document.activeElement !== searchInput) {
                    e.preventDefault();
                    searchInput.focus();
                }
            });
        }
    }

    updateMetrics() {
        const metrics = this.calculateMetrics();
        document.getElementById('signal-count').textContent = metrics.totalSignals;
        document.getElementById('critical-count').textContent = metrics.criticalCount;
        document.getElementById('watch-count').textContent = metrics.watchCount;
        document.getElementById('source-count').textContent = `${metrics.sourceCount} (${this.savedSignals.length} saved)`;
        document.getElementById('threat-level').textContent = metrics.threatLevel;

        // Update saved filter button text
        const savedBtn = document.querySelector('.filter-btn[data-filter="saved"]');
        if (savedBtn) {
            savedBtn.textContent = `Saved (${this.savedSignals.length})`;
        }
    }

    calculateMetrics() {
        if (!this.data) return {
            totalSignals: 0,
            criticalCount: 0,
            watchCount: 0,
            sourceCount: 0,
            threatLevel: 'UNKNOWN'
        };

        const news = this.data.news || [];
        const videos = this.data.videos || [];
        
        return {
            totalSignals: news.length + videos.length,
            criticalCount: [...news, ...videos].filter(item => item.rating >= 4.5).length,
            watchCount: videos.length,
            sourceCount: this.getUniqueSources().length,
            threatLevel: this.determineThreatLevel(news)
        };
    }

    determineThreatLevel(news) {
        const criticalKeywords = ['exploit', 'breach', 'vulnerability', 'zero-day', 'ransomware'];
        const hasCritical = news.some(item => 
            criticalKeywords.some(keyword => 
                item.title.toLowerCase().includes(keyword) ||
                (item.summary && item.summary.toLowerCase().includes(keyword))
            )
        );
        return hasCritical ? 'ELEVATED' : 'TRACKING';
    }

    getUniqueSources() {
        if (!this.data) return [];
        const news = this.data.news || [];
        const videos = this.data.videos || [];
        const sources = new Set([
            ...news.map(item => item.source),
            ...videos.map(item => item.creator)
        ]);
        return Array.from(sources);
    }

    renderContent() {
        this.renderNews();
        this.renderVideos();
        this.renderSources();
    }

    renderNews() {
        const container = document.getElementById('news-container');
        if (!this.data || !this.data.news) {
            container.innerHTML = '<div class="loading">Loading signals...</div>';
            return;
        }

        let news = this.data.news;
        
        // Apply SAVED filter
        if (this.currentFilter === 'saved') {
            news = news.filter(item => this.isSignalSaved(item.url));
            if (news.length === 0) {
                container.innerHTML = '<div class="loading">No saved signals yet. Click the ✨ to save important threats!</div>';
                return;
            }
        }
        
        // Apply search filter
        if (this.searchQuery) {
            news = news.filter(item => 
                item.title.toLowerCase().includes(this.searchQuery) ||
                (item.summary && item.summary.toLowerCase().includes(this.searchQuery)) ||
                (item.signal && item.signal.toLowerCase().includes(this.searchQuery)) ||
                item.source.toLowerCase().includes(this.searchQuery)
            );
        }
        
        // Apply category filter
        if (this.currentFilter === 'news') {
            // Already showing only news
        } else if (this.currentFilter === 'videos') {
            container.innerHTML = '<div class="loading">Switch to "All" to see news</div>';
            return;
        } else if (this.currentFilter === 'community') {
            news = news.filter(item => 
                item.source.toLowerCase().includes('reddit') || 
                item.source.toLowerCase().includes('hacker')
            );
        }

        if (news.length === 0) {
            container.innerHTML = `<div class="loading">No signals found${this.searchQuery ? ` for "${this.searchQuery}"` : ''}</div>`;
            return;
        }

        // Sort by newest first
        news.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        container.innerHTML = news.map(item => this.createNewsCard(item)).join('');
    }

    renderVideos() {
        const container = document.getElementById('video-container');
        if (!this.data || !this.data.videos) {
            container.innerHTML = '<div class="loading">No video signals</div>';
            return;
        }

        let videos = this.data.videos;

        if (this.currentFilter === 'news' || this.currentFilter === 'saved') {
            container.innerHTML = '<div class="loading">Switch to "All" to see videos</div>';
            return;
        } else if (this.currentFilter === 'videos') {
            // Already showing only videos
        }

        if (videos.length === 0) {
            container.innerHTML = '<div class="loading">No video signals</div>';
            return;
        }

        // Sort videos by newest first
        videos.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        container.innerHTML = videos.map(item => this.createVideoCard(item)).join('');
    }

    createNewsCard(item) {
        const timeAgo = this.formatTimeAgo(item.timestamp);
        const ratingClass = item.rating >= 4.5 ? 'high-value' : '';
        const isNew = this.isNewItem(item.timestamp);
        const isSaved = this.isSignalSaved(item.url);
        
        return `
            <article class="news-item ${isSaved ? 'saved-item' : ''}" data-rating="${item.rating}">
                <button class="bookmark-btn ${isSaved ? 'bookmarked' : ''}" 
                        onclick='signalGrid.toggleSaveSignal("${this.escapeHtml(item.url)}", ${JSON.stringify(item.title).replace(/'/g, "&#39;")})' 
                        title="${isSaved ? 'Remove from saved' : 'Save for later'}">
                    ${isSaved ? '✨' : '☆'}
                </button>
                <div class="news-item-header">
                    <span class="news-source">${this.escapeHtml(item.source)}</span>
                    <div class="news-meta">
                        ${isNew ? '<span class="badge badge-new">NEW</span>' : ''}
                        <div class="news-rating ${ratingClass}">
                            <span class="rating-value">${item.rating}</span>
                            <span class="rating-label">/ 5 • ${item.priority || 'MEDIUM'}</span>
                        </div>
                        <span>${timeAgo}</span>
                    </div>
                </div>
                <h3 class="news-title">
                    ${this.escapeHtml(item.title)}
                </h3>
                ${item.signal ? `<div class="news-signal">${this.escapeHtml(item.signal)}</div>` : ''}
                <div class="news-actions">
                    <button class="read-more-btn" onclick='signalGrid.showNewsModal(${JSON.stringify(item).replace(/'/g, "&#39;")})'>
                        Read Preview
                    </button>
                    <a href="${this.escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="source-btn">
                        View Source →
                    </a>
                </div>
            </article>
        `;
    }

    showNewsModal(item) {
        const modal = document.getElementById('newsModal') || this.createNewsModal();
        modal.querySelector('.modal-title').textContent = item.title;
        modal.querySelector('.modal-source').textContent = item.source;
        modal.querySelector('.modal-rating').textContent = `${item.rating}/5.0 • ${item.priority || 'MEDIUM'}`;
        modal.querySelector('.modal-summary').textContent = item.summary || 'No summary available';
        modal.querySelector('.modal-signal').textContent = item.signal || 'No additional signal information';
        modal.querySelector('.modal-signal').style.display = item.signal ? 'block' : 'none';
        modal.querySelector('.modal-source-link').href = item.url;
        
        modal.style.display = 'flex';
    }

    createNewsModal() {
        const modal = document.createElement('div');
        modal.id = 'newsModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title"></h2>
                    <button class="modal-close" onclick="signalGrid.closeModal()">&times;</button>
                </div>
                <div class="modal-meta">
                    <span class="modal-source"></span>
                    <span class="modal-rating"></span>
                </div>
                <div class="modal-body">
                    <p class="modal-summary"></p>
                    <div class="modal-signal"></div>
                </div>
                <div class="modal-footer">
                    <a href="#" class="modal-source-link" target="_blank" rel="noopener noreferrer">
                        Read Full Article →
                    </a>
                    <button class="modal-close-btn" onclick="signalGrid.closeModal()">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });
        
        return modal;
    }

    closeModal() {
        const modal = document.getElementById('newsModal');
        if (modal) modal.style.display = 'none';
    }

    createVideoCard(item) {
        const timeAgo = this.formatTimeAgo(item.timestamp);
        const ratingClass = item.rating >= 4.5 ? 'high-value' : '';
        const isNew = this.isNewItem(item.timestamp);
        
        return `
            <article class="video-item" data-rating="${item.rating}">
                <span class="video-creator">${this.escapeHtml(item.creator)}</span>
                <div class="video-meta">
                    <span class="video-time">${timeAgo}</span>
                    <div class="video-rating ${ratingClass}">
                        ${isNew ? '<span class="badge badge-new">NEW</span>' : ''}
                        <span class="rating-value">${item.rating}</span>
                        <span class="rating-label">/ 5 • ${item.worthWatching ? 'WATCH' : 'SKIP'}</span>
                    </div>
                </div>
                <h4 class="video-title">
                    <a href="${this.escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">
                        ${this.escapeHtml(item.title)}
                    </a>
                </h4>
                <p class="video-summary">${this.escapeHtml(item.summary || 'No summary available')}</p>
                ${item.verdict ? `<div class="video-verdict">${this.escapeHtml(item.verdict)}</div>` : ''}
            </article>
        `;
    }

    renderSources() {
        const container = document.getElementById('sources-list');
        const sources = this.getUniqueSources();
        
        if (sources.length === 0) {
            container.innerHTML = '<span class="source-badge">No sources loaded</span>';
            return;
        }

        container.innerHTML = sources
            .map(source => `<span class="source-badge">${this.escapeHtml(source)}</span>`)
            .join('');
    }

    formatTimeAgo(timestamp) {
        if (!timestamp) return 'UNKNOWN';
        
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        
        if (diffHours < 1) return 'JUST NOW';
        if (diffHours === 1) return '1 HOUR AGO';
        if (diffHours < 24) return `${diffHours} HOURS AGO`;
        
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays === 1) return 'YESTERDAY';
        return `${diffDays} DAYS AGO`;
    }

    isNewItem(timestamp) {
        if (!timestamp) return false;
        const now = new Date();
        const itemTime = new Date(timestamp);
        const diffHours = (now - itemTime) / (1000 * 60 * 60);
        return diffHours <= 6;
    }

    updateRefreshTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            month: 'short',
            day: 'numeric',
            hour: '2-digit', 
            minute: '2-digit',
            timeZoneName: 'short'
        });
        document.getElementById('refresh-time').textContent = timeString;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getDemoData() {
        return {
            news: [],
            videos: [],
            lastUpdate: new Date().toISOString()
        };
    }

    filterByTag(tag) {
        const news = this.data.news || [];
        const filtered = news.filter(item => 
            item.title.toLowerCase().includes(tag) ||
            (item.summary && item.summary.toLowerCase().includes(tag))
        );
        
        const container = document.getElementById('news-container');
        if (filtered.length === 0) {
            container.innerHTML = '<div class="loading">No signals match this tag</div>';
            return;
        }
        
        container.innerHTML = filtered.map(item => this.createNewsCard(item)).join('');
    }
}

// Initialize the app when DOM is ready
let signalGrid;

document.addEventListener('DOMContentLoaded', () => {
    signalGrid = new SignalGrid();
});



// AI Assistant functionality
class AIAssistant {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.knowledgeBase = this.buildKnowledgeBase();
        this.init();
    }

    init() {
        const toggle = document.getElementById('aiToggle');
        const close = document.getElementById('aiClose');
        const send = document.getElementById('aiSend');
        const input = document.getElementById('aiInput');

        if (!toggle || !close || !send || !input) {
            console.log('AI Assistant elements not found');
            return;
        }

        toggle.addEventListener('click', () => this.togglePanel());
        close.addEventListener('click', () => this.closePanel());
        send.addEventListener('click', () => this.sendMessage());
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    buildKnowledgeBase() {
        return {
            'zero-day': {
                keywords: ['zero-day', '0-day', 'zero day', '0day'],
                response: "A zero-day vulnerability is a security flaw that's unknown to the software vendor. Attackers can exploit it before a patch exists, making it extremely dangerous. These vulnerabilities are highly valuable on black markets. Check the signals for any recent zero-day discoveries - they require immediate attention!"
            },
            'phishing': {
                keywords: ['phishing', 'phish', 'spear phishing', 'email attack'],
                response: "Phishing is a social engineering attack where attackers impersonate trusted entities to steal credentials, install malware, or trick victims into transferring money. Common signs: urgent language, suspicious sender addresses, unexpected attachments, mismatched URLs. Always verify sender authenticity before clicking links or downloading files. Modern phishing uses AI to craft convincing messages at scale."
            },
            'ransomware': {
                keywords: ['ransomware', 'ransom', 'crypto locker', 'file encryption'],
                response: "Ransomware encrypts your files and demands payment (usually in cryptocurrency) for decryption. Prevention strategies: maintain offline backups, keep software updated, use email filtering, implement network segmentation, deploy EDR solutions. If infected: isolate the system immediately, don't pay (it funds more attacks), report to authorities, restore from backups. Recent trends show ransomware groups now exfiltrate data before encryption for double extortion."
            },
            'malware': {
                keywords: ['malware', 'trojan', 'virus', 'worm', 'rootkit', 'backdoor'],
                response: "Malware is malicious software designed to damage, exploit, or gain unauthorized access to systems. Types include: viruses (self-replicating), trojans (disguised as legitimate software), worms (spread across networks), rootkits (hide deep in OS), backdoors (remote access), spyware (data theft). Detection requires behavior analysis, signature-based scanning, and monitoring for anomalous network traffic. Modern malware often uses polymorphic code to evade detection."
            },
            'supply chain': {
                keywords: ['supply chain', 'supply-chain', 'third party', 'vendor risk'],
                response: "Supply chain attacks compromise software or hardware before it reaches end users by targeting vendors, developers, or distribution channels. Famous examples: SolarWinds (2020), 3CX (2023), DAEMON Tools (recent). These attacks are devastating because they exploit trust relationships and can affect thousands of organizations simultaneously. Mitigation: verify software signatures, monitor vendor security posture, implement zero-trust architecture, use software bill of materials (SBOM) for visibility."
            },
            'exploit': {
                keywords: ['exploit', 'exploitation', 'weaponized', 'poc', 'proof of concept'],
                response: "An exploit is code that takes advantage of a vulnerability to compromise a system. Exploits can be: remote (over network) or local (requires system access), pre-auth (no credentials needed) or post-auth. When security researchers publish Proof of Concept (PoC) exploits, attackers weaponize them within hours. Critical exploits often target: authentication bypass, remote code execution (RCE), privilege escalation. Prioritize patching when active exploits exist in the wild."
            },
            'patch': {
                keywords: ['patch', 'update', 'security update', 'hotfix', 'emergency patch'],
                response: "Security patches fix vulnerabilities in software. Best practices: test patches in non-production first, prioritize based on exploitability and exposure, automate patching where possible, maintain patch management SLAs. 'Patch Tuesday' is Microsoft's monthly update cycle. Emergency patches for actively exploited zero-days should be deployed immediately. Virtual patching (via WAF/IPS) can provide temporary protection while testing patches."
            },
            'breach': {
                keywords: ['breach', 'data breach', 'compromise', 'leaked', 'exposed'],
                response: "A data breach is unauthorized access to sensitive information. Common causes: weak credentials, unpatched vulnerabilities, social engineering, misconfigured storage. Breach response: contain the incident, assess scope, notify affected parties, preserve evidence, conduct forensics, improve defenses. Legal requirements like GDPR mandate breach notification within 72 hours. Breached credentials often appear on dark web markets and paste sites."
            },
            'vulnerability': {
                keywords: ['vulnerability', 'cve', 'vuln', 'security flaw', 'weakness'],
                response: "A vulnerability is a weakness in software, hardware, or processes that can be exploited. Measured by CVSS score (0-10, with 10 being critical). CVE (Common Vulnerabilities and Exposures) is the standard naming system. Vulnerability management cycle: discovery → assessment → prioritization → remediation → verification. Not all vulnerabilities are equally dangerous - consider exploitability, asset criticality, and exposure when prioritizing fixes."
            },
            'threat intelligence': {
                keywords: ['threat intel', 'ioc', 'indicators', 'ttp', 'tactics'],
                response: "Threat intelligence is evidence-based knowledge about adversaries, their tactics, techniques, and procedures (TTPs). Types: strategic (high-level trends), operational (campaign details), tactical (IOCs like IPs/hashes). Effective threat intel answers: who (threat actor), what (their goals), when (timing), where (targets), why (motivation), how (attack methods). Use threat intel to prioritize defenses, tune detection rules, and inform incident response. Signal Grid provides curated threat intelligence from multiple sources."
            },
            'password': {
                keywords: ['password', 'credential', 'authentication', 'login', '2fa', 'mfa'],
                response: "Password security fundamentals: use unique passwords for each account, minimum 12 characters with complexity, avoid common patterns, enable MFA/2FA everywhere possible, use a password manager (Bitwarden, 1Password), rotate credentials after breaches. Multi-factor authentication (MFA) adds layers: something you know (password) + something you have (phone/token) + something you are (biometric). Passkeys (FIDO2/WebAuthn) are the future - phishing-resistant and passwordless."
            },
            'firewall': {
                keywords: ['firewall', 'waf', 'web application firewall', 'network security'],
                response: "Firewalls control network traffic based on security rules. Types: traditional firewalls (stateful packet inspection), next-gen firewalls (NGFW: deep packet inspection, IPS, app awareness), web application firewalls (WAF: HTTP/S protection). Best practices: default deny, segment networks, log all blocked traffic, update rules regularly. Cloud firewalls and zero-trust network access (ZTNA) are replacing traditional perimeter-based approaches."
            },
            'apt': {
                keywords: ['apt', 'advanced persistent threat', 'nation state', 'targeted attack'],
                response: "Advanced Persistent Threats (APTs) are sophisticated, long-term cyber operations typically conducted by nation-states or well-funded groups. Characteristics: stealthy, persistent (maintain access for months/years), multi-stage attacks, custom malware, targeted. APTs use: spear phishing, zero-days, living-off-the-land techniques, supply chain attacks. Defense requires: threat hunting, behavioral detection, network segmentation, privileged access management, incident response planning."
            },
            'encryption': {
                keywords: ['encryption', 'decrypt', 'aes', 'tls', 'ssl', 'cryptography'],
                response: "Encryption converts data into unreadable format without the decryption key. Types: symmetric (AES: same key for encryption/decryption, fast) and asymmetric (RSA: public/private key pairs, slower). Use cases: data at rest (disk encryption), data in transit (TLS/HTTPS), end-to-end encryption (Signal, WhatsApp). AES-256 is military-grade and effectively unbreakable. TLS 1.3 is the current standard for secure web communications. Quantum computing may threaten current encryption in the future."
            },
            'ddos': {
                keywords: ['ddos', 'dos', 'denial of service', 'amplification', 'botnet'],
                response: "DDoS (Distributed Denial of Service) attacks overwhelm systems with traffic from multiple sources, making services unavailable. Common types: volumetric (bandwidth saturation), protocol (state table exhaustion), application layer (HTTP floods). Amplification attacks abuse public services (DNS, NTP) to magnify traffic. Mitigation: rate limiting, traffic filtering, CDN/DDoS protection services (Cloudflare, Akamai), over-provisioning capacity, blackhole routing. Large DDoS attacks can exceed 1 Tbps."
            }
        };
    }

    togglePanel() {
        const panel = document.getElementById('aiPanel');
        const toggle = document.getElementById('aiToggle');
        
        if (this.isOpen) {
            panel.style.display = 'none';
            toggle.style.display = 'flex';
            this.isOpen = false;
        } else {
            panel.style.display = 'flex';
            toggle.style.display = 'none';
            this.isOpen = true;
            document.getElementById('aiInput').focus();
        }
    }

    closePanel() {
        const panel = document.getElementById('aiPanel');
        const toggle = document.getElementById('aiToggle');
        
        panel.style.display = 'none';
        toggle.style.display = 'flex';
        this.isOpen = false;
    }

    async sendMessage() {
        const input = document.getElementById('aiInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Add user message to UI
        this.addMessage(message, 'user');
        input.value = '';
        
        // Show typing indicator
        this.showTyping();
        
        // Get AI response
        try {
            const response = await this.getAIResponse(message);
            this.hideTyping();
            this.addMessage(response, 'assistant');
        } catch (error) {
            this.hideTyping();
            this.addMessage('Sorry, I encountered an error. Please try again.', 'assistant');
        }
    }

    addMessage(text, role) {
        const messagesContainer = document.getElementById('aiMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message ai-message-${role}`;
        
        const label = role === 'user' ? 'You' : 'AI';
        messageDiv.innerHTML = `<strong>${label}:</strong> ${this.escapeHtml(text)}`;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showTyping() {
        const messagesContainer = document.getElementById('aiMessages');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.className = 'ai-message ai-message-assistant ai-typing';
        typingDiv.innerHTML = '<strong>AI:</strong> Analyzing...';
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTyping() {
        const typing = document.getElementById('typing-indicator');
        if (typing) typing.remove();
    }

    async getAIResponse(userMessage) {
        const messageLower = userMessage.toLowerCase();
        
        // 1. Check for search/find queries
        if (messageLower.match(/search|find|show me|look for|what.*about/i)) {
            const results = this.searchSignals(userMessage);
            if (results.length > 0) {
                return `I found ${results.length} signals related to your query:\n\n${results.slice(0, 3).map(r => `• ${r.title.substring(0, 80)}... (${r.rating}/5.0)`).join('\n\n')}\n\nWould you like me to explain any of these?`;
            }
        }
        
        // 2. Check for critical/must-know queries
        if (messageLower.match(/critical|important|must.*know|priority|urgent|top/i)) {
            const critical = signalGrid.data.news.filter(n => n.rating >= 4.5).slice(0, 5);
            if (critical.length > 0) {
                return `🚨 There are ${critical.length} critical signals (≥4.5 rating) right now:\n\n${critical.map((n, i) => `${i+1}. ${n.title.substring(0, 70)}... (${n.rating}/5.0)`).join('\n\n')}\n\nCheck the "Must Know" section for full details!`;
            }
            return "Currently no critical-rated signals. All threats are at manageable priority levels.";
        }
        
        // 3. Check knowledge base for security concepts
        for (const [topic, data] of Object.entries(this.knowledgeBase)) {
            if (data.keywords.some(keyword => messageLower.includes(keyword))) {
                return data.response;
            }
        }
        
        // 4. Check for help/capabilities queries
        if (messageLower.match(/help|what can you|how do|capabilities/i)) {
            return "I can help you with:\n\n🔍 Search signals: 'Find signals about zero-day exploits'\n📊 Get critical alerts: 'Show me the most important threats'\n📚 Explain concepts: 'What is ransomware?' or 'Explain supply chain attacks'\n🎯 Security topics I cover: zero-days, phishing, ransomware, malware, supply chains, exploits, patches, breaches, vulnerabilities, threat intelligence, APTs, encryption, DDoS, and more!\n\nTry asking me anything about cybersecurity!";
        }
        
        // 5. Saved signals query
        if (messageLower.match(/saved|bookmarked|starred/i)) {
            const savedCount = signalGrid.savedSignals.length;
            if (savedCount === 0) {
                return "You haven't saved any signals yet. Click the ✨ icon on any signal to save it for later!";
            }
            return `You have ${savedCount} saved signal${savedCount === 1 ? '' : 's'}. Switch to the 'SAVED' filter to view them all!`;
        }
        
        // 6. Source-specific queries
        if (messageLower.match(/sources?|where.*from|feeds?/i)) {
            const sources = signalGrid.getUniqueSources();
            return `Signal Grid monitors ${sources.length} active sources:\n\n${sources.slice(0, 8).join(', ')}\n\nWe aggregate threat intelligence from Hacker News, Reddit cybersecurity communities, and top security YouTube channels, then Claude AI analyzes and rates each signal.`;
        }
        
        // 7. Fallback - suggest search
        return `I'm not sure about that specific query. Try:\n\n• Asking about security concepts (zero-days, phishing, ransomware, etc.)\n• Searching signals: "Find signals about [topic]"\n• Getting critical alerts: "Show me urgent threats"\n• Using the search bar at the top to find specific signals\n\nWhat would you like to know?`;
    }

    searchSignals(query) {
        if (!signalGrid || !signalGrid.data) return [];
        
        const keywords = query.toLowerCase()
            .replace(/search|find|show me|look for|what.*about|signals?|news/gi, '')
            .trim()
            .split(/\s+/)
            .filter(w => w.length > 3);
        
        if (keywords.length === 0) return [];
        
        const allSignals = [...signalGrid.data.news, ...signalGrid.data.videos];
        
        return allSignals.filter(signal => {
            const searchText = `${signal.title} ${signal.summary || ''} ${signal.signal || ''}`.toLowerCase();
            return keywords.some(keyword => searchText.includes(keyword));
        }).sort((a, b) => b.rating - a.rating);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize AI Assistant when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const aiAssistant = new AIAssistant();
});
