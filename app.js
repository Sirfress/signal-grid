// Signal Grid - Intelligence Feed Display
class SignalGrid {
    constructor() {
        this.data = null;
        this.currentFilter = 'all';
        this.searchQuery = '';
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
        document.getElementById('source-count').textContent = metrics.sourceCount;
        document.getElementById('threat-level').textContent = metrics.threatLevel;
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

        if (this.currentFilter === 'news') {
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
        
        return `
            <article class="news-item" data-rating="${item.rating}">
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
            news: [
                {
                    title: "Android 17 Blocks Non-Accessibility Apps from Accessibility API to Prevent Malware Abuse",
                    source: "THE HACKER NEWS",
                    url: "#",
                    rating: 4.0,
                    priority: "HIGH VALUE",
                    summary: "Google is testing a new security feature as part of Android Advanced Protection Mode (AAPM) that prevents certain kinds of apps from using the accessibility services API.",
                    signal: "Useful trend signal, but not necessarily something that requires immediate prioritization itself.",
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
                }
            ],
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
        typingDiv.innerHTML = '<strong>AI:</strong> Thinking...';
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTyping() {
        const typing = document.getElementById('typing-indicator');
        if (typing) typing.remove();
    }

    async getAIResponse(userMessage) {
        // First, check if it's a search query
        const searchMatch = userMessage.match(/search|find|show me|what.*about/i);
        
        if (searchMatch && signalGrid && signalGrid.data) {
            // Search through signals
            const results = this.searchSignals(userMessage);
            if (results.length > 0) {
                return `I found ${results.length} signals related to your query:\n\n${results.slice(0, 3).map(r => `• ${r.title} (${r.rating}/5.0)`).join('\n')}\n\nWould you like me to explain any of these?`;
            }
        }

        // For general questions, provide helpful responses
        // In a real implementation, this would call Claude API
        // For now, we'll provide predefined helpful responses
        
        const keywords = userMessage.toLowerCase();
        
        if (keywords.includes('zero-day') || keywords.includes('0-day')) {
            return "A zero-day vulnerability is a security flaw that's unknown to the software vendor. Attackers can exploit it before a patch exists. These are highly valuable and dangerous. Check the signals for any recent zero-day discoveries!";
        }
        
        if (keywords.includes('phishing')) {
            return "Phishing is a social engineering attack where attackers impersonate trusted entities to steal credentials or data. Common signs: urgent language, suspicious links, unexpected attachments. Always verify sender authenticity!";
        }
        
        if (keywords.includes('ransomware')) {
            return "Ransomware encrypts your files and demands payment for decryption. Prevention: regular backups, updated software, email vigilance, network segmentation. Never pay the ransom - it funds more attacks!";
        }
        
        if (keywords.includes('critical') || keywords.includes('important')) {
            const critical = signalGrid.data.news.filter(n => n.rating >= 4.5);
            return `There are ${critical.length} critical signals (≥4.5 rating) right now. Check the "Must Know" section to see them!`;
        }
        
        if (keywords.includes('search') || keywords.includes('find')) {
            return "You can use the search bar at the top to find specific signals! Try searching for keywords like 'exploit', 'AI', 'breach', or 'vulnerability'.";
        }
        
        return "I can help you:\n• Search through signals\n• Explain security concepts\n• Find critical vulnerabilities\n• Answer cybersecurity questions\n\nTry asking: 'What are the most critical signals?' or 'Explain zero-day exploits'";
    }

    searchSignals(query) {
        if (!signalGrid || !signalGrid.data) return [];
        
        const keywords = query.toLowerCase().split(' ').filter(w => w.length > 3);
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