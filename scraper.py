#!/usr/bin/env python3
"""
Signal Grid Intelligence Scraper
Collects RECENT cybersecurity/AI news and video content, processes with Claude AI
"""

import os
import json
import requests
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
import time

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("✓ Loaded .env file")
except ImportError:
    print("⚠️  python-dotenv not installed, using system environment variables")

class SignalGridScraper:
    def __init__(self):
        self.claude_api_key = os.environ.get('ANTHROPIC_API_KEY')
        self.youtube_api_key = os.environ.get('YOUTUBE_API_KEY')
        
        # Debug: Print if keys are loaded (first few chars only)
        if self.claude_api_key:
            print(f"✓ Claude API key loaded: {self.claude_api_key[:15]}...")
        else:
            print("⚠️  Claude API key NOT found - check .env file")
            
        if self.youtube_api_key:
            print(f"✓ YouTube API key loaded: {self.youtube_api_key[:15]}...")
        else:
            print("⚠️  YouTube API key NOT found - check .env file")
        
        # Target creators
        self.youtube_channels = {
            # Current cybersecurity channels (keep these)
            'UC0vBXGSyV14uvJ4hECDOl0Q': 'David Bombal',
            'UCVeW9qkBjo3zosnqUbG7CFw': 'John Hammond',
            'UCCZDt7MuC3Hzs6IH4xODLBw': 'Nahamsec',
            'UC0ArlFuFYMpEewyRBzdLHiw': 'The Cyber Mentor',
            'UCa6eh7gCkpPo5XXUDfygQQA': 'IppSec',
            'UCeVMnSShP_Iviwkknt83cww': 'NetworkChuck',
            
            # ADD THESE - More cybersecurity
            'UCSup79ak1Uof9EqQrM7o5LA': 'LiveOverflow',
            'UC0ZTPkdxlAKf-V33tqXwi3Q': 'HackerSploit',
            'UCgTNupxATBfWmfehv21ym-g': 'NullByte',
            'UC286ntgASMskhPIJQebJVvA': 'zSecurity',
            'UCVeW9qkBjo3zosnqUbG7CFw': 'STÖK',
            
            # Tech/Security News (post more frequently)
            'UCXuqSBlHAE6Xw-yeJA0Tunw': 'Linus Tech Tips',
            'UCl2mFZoRqjw_ELax4Yisf6w': 'Louis Rossmann',
            'UCzL_0nIe8B4-7ShhVPfJVgw': 'Fireship',
        }
        
        self.reddit_subreddits = [
            'netsec',
            'cybersecurity', 
            'hacking',
            'programming'
        ]
        
        # Only get news from last 48 hours
        self.max_age_hours = 48
        
    def scrape_all(self) -> Dict[str, Any]:
        """Main scraping orchestrator"""
        print("🚀 Starting Signal Grid scrape...\n")
        
        results = {
            'news': [],
            'videos': [],
            'lastUpdate': datetime.now(timezone.utc).isoformat(),
            'metadata': {
                'totalScraped': 0,
                'filtered': 0,
                'sources': []
            }
        }
        
        # Scrape all sources
        print("📰 Scraping news sources...")
        news_items = []
        news_items.extend(self.scrape_hackernews())
        news_items.extend(self.scrape_reddit())
        
        # Filter for recent items only
        news_items = self._filter_recent_items(news_items)
        
        print(f"   Found {len(news_items)} recent news items\n")
        
        # Scrape videos
        print("🎥 Scraping YouTube videos...")
        videos = self.scrape_youtube()
        print(f"   Found {len(videos)} videos\n")
        
        # Process with Claude AI
        print("🤖 Processing with Claude AI...")
        processed_news = self.process_news_with_claude(news_items)
        processed_videos = self.process_videos_with_claude(videos)
        
        # Filter by rating (≥3.5)
        results['news'] = [n for n in processed_news if n['rating'] >= 3.5]
        results['videos'] = [v for v in processed_videos if v['rating'] >= 3.5]
        
        results['metadata']['totalScraped'] = len(news_items) + len(videos)
        results['metadata']['filtered'] = len(results['news']) + len(results['videos'])
        
        print(f"\n✅ Scraping complete!")
        print(f"   📊 Total items: {results['metadata']['totalScraped']}")
        print(f"   ✨ High quality (≥3.5): {results['metadata']['filtered']}")
        print(f"   📰 News: {len(results['news'])}")
        print(f"   🎥 Videos: {len(results['videos'])}")
        
        return results
    
    def _filter_recent_items(self, items: List[Dict]) -> List[Dict]:
        """Filter items to only include recent ones (last 48 hours)"""
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=self.max_age_hours)
        recent_items = []
        
        for item in items:
            try:
                item_time = datetime.fromisoformat(item['timestamp'].replace('Z', '+00:00'))
                if item_time > cutoff_time:
                    recent_items.append(item)
            except:
                # If timestamp parsing fails, include the item anyway
                recent_items.append(item)
        
        return recent_items
    
    def scrape_hackernews(self) -> List[Dict]:
        """Scrape Hacker News"""
        items = []
        try:
            # Get top stories
            response = requests.get('https://hacker-news.firebaseio.com/v0/topstories.json', timeout=15)
            story_ids = response.json()[:50]  # Top 50
            
            for story_id in story_ids[:30]:  # Limit to 30 to avoid rate limits
                try:
                    story_response = requests.get(
                        f'https://hacker-news.firebaseio.com/v0/item/{story_id}.json',
                        timeout=10
                    )
                    story = story_response.json()
                    
                    if not story or story.get('type') != 'story':
                        continue
                    
                    # Filter for relevant keywords
                    title = story.get('title', '').lower()
                    if self._is_relevant(title):
                        items.append({
                            'title': story.get('title'),
                            'url': story.get('url', f"https://news.ycombinator.com/item?id={story_id}"),
                            'source': 'Hacker News',
                            'timestamp': datetime.fromtimestamp(story.get('time', 0), tz=timezone.utc).isoformat(),
                            'text': story.get('text', '')
                        })
                    
                    time.sleep(0.1)  # Be nice to the API
                except Exception as e:
                    # Silently skip failed stories
                    continue
                    
        except Exception as e:
            print(f"   ⚠️  Error scraping Hacker News: {e}")
        
        return items
    
    def scrape_reddit(self) -> List[Dict]:
        """Scrape Reddit"""
        items = []
        try:
            headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
}
            
            for subreddit in self.reddit_subreddits:
                try:
                    response = requests.get(
                        f'https://www.reddit.com/r/{subreddit}/hot.json?limit=25',
                        headers=headers,
                        timeout=15
                    )
                    
                    # Check if response is valid
                    if response.status_code != 200:
                        continue
                        
                    data = response.json()
                    
                    # Check if data structure is valid
                    if 'data' not in data or 'children' not in data['data']:
                        continue
                    
                    for post in data['data']['children']:
                        post_data = post['data']
                        title = post_data.get('title', '').lower()
                        
                        if self._is_relevant(title):
                            items.append({
                                'title': post_data.get('title'),
                                'url': post_data.get('url'),
                                'source': f'r/{subreddit}',
                                'timestamp': datetime.fromtimestamp(post_data.get('created_utc', 0), tz=timezone.utc).isoformat(),
                                'text': post_data.get('selftext', '')[:500]
                            })
                    
                    time.sleep(1)  # Rate limiting
                except Exception as e:
                    # Silently skip failed subreddits
                    continue
                    
        except Exception as e:
            print(f"   ⚠️  Error scraping Reddit: {e}")
        
        return items
    
    def scrape_youtube(self) -> List[Dict]:
        """Scrape YouTube videos from target creators"""
        videos = []
        
        if not self.youtube_api_key:
            print("   ⚠️  No YouTube API key found, skipping...")
            return videos
        
        print(f"   📺 Checking {len(self.youtube_channels)} YouTube channels...")
        
        try:
            # Get videos from last 7 days (cybersecurity YouTubers don't post daily)
            published_after = (datetime.now(timezone.utc) - timedelta(hours=168)).isoformat()
            
            for channel_id, creator_name in self.youtube_channels.items():
                try:
                    print(f"      → Checking {creator_name}...")
                    
                    response = requests.get(
                        'https://www.googleapis.com/youtube/v3/search',
                        params={
                            'key': self.youtube_api_key,
                            'channelId': channel_id,
                            'part': 'snippet',
                            'order': 'date',
                            'maxResults': 5,
                            'publishedAfter': published_after,
                            'type': 'video'
                        },
                        timeout=30
                    )
                    
                    print(f"         API Status: {response.status_code}")
                    
                    if response.status_code != 200:
                        print(f"         ⚠️  API Error: {response.text[:200]}")
                        continue
                    
                    data = response.json()
                    items = data.get('items', [])
                    print(f"         Found {len(items)} videos in last 7 days")
                    
                    for item in items:
                        snippet = item['snippet']
                        video_id = item['id']['videoId']
                        
                        # Try to get transcript
                        transcript = self._get_video_transcript(video_id)
                        
                        videos.append({
                            'video_id': video_id,
                            'title': snippet['title'],
                            'creator': snippet['channelTitle'],
                            'url': f'https://www.youtube.com/watch?v={video_id}',
                            'timestamp': snippet['publishedAt'],
                            'description': snippet['description'],
                            'transcript': transcript
                        })
                    
                    time.sleep(1)  # Rate limiting
                    
                except Exception as e:
                    print(f"         ⚠️  Error with {creator_name}: {e}")
                    continue
                    
        except Exception as e:
            print(f"   ⚠️  Error scraping YouTube: {e}")
        
        return videos
    
    
    def _get_video_transcript(self, video_id: str) -> str:
        """Get video transcript using youtube_transcript_api"""
        try:
            from youtube_transcript_api import YouTubeTranscriptApi
            transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
            transcript = ' '.join([entry['text'] for entry in transcript_list])
            return transcript[:2000]  # Limit to 2000 chars for Claude
        except ImportError:
            return ""
        except Exception:
            return ""
    
    def process_news_with_claude(self, news_items: List[Dict]) -> List[Dict]:
        """Use Claude to analyze and score news items"""
        if not self.claude_api_key:
            print("   ⚠️  No Claude API key found, using mock processing...")
            return self._mock_process_news(news_items)
        
        processed = []
        
        # Process in batches to avoid token limits
        batch_size = 10
        for i in range(0, len(news_items), batch_size):
            batch = news_items[i:i+batch_size]
            
            prompt = self._create_news_analysis_prompt(batch)
            
            try:
                response = requests.post(
                    'https://api.anthropic.com/v1/messages',
                    headers={
                        'x-api-key': self.claude_api_key,
                        'anthropic-version': '2023-06-01',
                        'content-type': 'application/json'
                    },
                    json={
                        'model': 'claude-sonnet-4-6',
                        'max_tokens': 4000,
                        'messages': [{'role': 'user', 'content': prompt}]
                    },
                    timeout=90
                )
                
                if response.status_code != 200:
                    print(f"   ⚠️  Claude API error: {response.status_code}")
                    processed.extend(self._mock_process_news(batch))
                    continue
                
                result = response.json()
                
                # Check if content exists
                if 'content' not in result or len(result['content']) == 0:
                    print(f"   ⚠️  No content in Claude response")
                    processed.extend(self._mock_process_news(batch))
                    continue
                
                analysis = result['content'][0]['text']
                
                # Parse Claude's response (expecting JSON)
                try:
                    analyzed_items = json.loads(analysis)
                    processed.extend(analyzed_items)
                except json.JSONDecodeError:
                    # Try to extract JSON from markdown
                    analysis = analysis.replace('```json', '').replace('```', '').strip()
                    try:
                        analyzed_items = json.loads(analysis)
                        processed.extend(analyzed_items)
                    except:
                        processed.extend(self._mock_process_news(batch))
                
                time.sleep(1)  # Rate limiting
                
            except Exception as e:
                print(f"   ⚠️  Error processing batch with Claude: {e}")
                processed.extend(self._mock_process_news(batch))
        
        return processed
    
    def process_videos_with_claude(self, videos: List[Dict]) -> List[Dict]:
        """Use Claude to analyze videos and determine if worth watching"""
        if not self.claude_api_key:
            print("   ⚠️  No Claude API key found, using mock processing...")
            return self._mock_process_videos(videos)
        
        processed = []
        
        for video in videos:
            # Build context from available data
            context_parts = [
                f"Title: {video['title']}",
                f"Creator: {video['creator']}",
                f"Description: {video['description']}"
            ]
            
            if video.get('transcript'):
                context_parts.append(f"Transcript excerpt: {video['transcript']}")
            
            context = "\n".join(context_parts)
            
            prompt = f"""Analyze this cybersecurity/AI YouTube video and determine if it's worth watching.

{context}

Respond ONLY with valid JSON in this exact format:
{{
    "title": "{video['title']}",
    "creator": "{video['creator']}",
    "url": "{video['url']}",
    "timestamp": "{video['timestamp']}",
    "rating": <float 1.0-5.0>,
    "worthWatching": <true/false>,
    "summary": "Detailed 6-8 sentence analysis covering: what happened, technical details, impact, and why it matters",
    "verdict": "<one sentence: why watch or skip>"
}}

Rating criteria:
5.0 = Groundbreaking, must-watch content
4.5-4.9 = Exceptional quality
4.0-4.4 = High value
3.5-3.9 = Decent content
<3.5 = Skip"""

            try:
                response = requests.post(
                    'https://api.anthropic.com/v1/messages',
                    headers={
                        'x-api-key': self.claude_api_key,
                        'anthropic-version': '2023-06-01',
                        'content-type': 'application/json'
                    },
                    json={
                        'model': 'claude-sonnet-4-6',
                        'max_tokens': 1000,
                        'messages': [{'role': 'user', 'content': prompt}]
                    },
                    timeout=90
                )
                
                if response.status_code != 200:
                    processed.append(self._mock_process_videos([video])[0])
                    continue
                
                result = response.json()
                
                if 'content' not in result or len(result['content']) == 0:
                    processed.append(self._mock_process_videos([video])[0])
                    continue
                
                analysis = result['content'][0]['text']
                
                # Try to parse JSON from response
                try:
                    video_data = json.loads(analysis)
                except json.JSONDecodeError:
                    # Claude might have wrapped it in markdown
                    analysis = analysis.replace('```json', '').replace('```', '').strip()
                    try:
                        video_data = json.loads(analysis)
                    except:
                        video_data = self._mock_process_videos([video])[0]
                
                processed.append(video_data)
                print(f"   ✓ Processed: {video['title'][:50]}... ({video_data.get('rating', 0)}/5.0)")
                
                time.sleep(1)
                
            except Exception as e:
                print(f"   ⚠️  Error processing video: {e}")
                processed.append(self._mock_process_videos([video])[0])
        
        return processed
    
    def _create_news_analysis_prompt(self, news_items: List[Dict]) -> str:
        """Create prompt for news analysis"""
        items_list = []
        for i, item in enumerate(news_items):
            # Clean the text to avoid JSON issues
            title = item['title'].replace('"', "'").replace('\n', ' ')
            source = item['source'].replace('"', "'")
            url = item['url'].replace('"', "'")
            text = item.get('text', '')[:300].replace('"', "'").replace('\n', ' ')
            
            items_list.append(f"""Item {i+1}:
Title: {title}
Source: {source}
URL: {url}
Text: {text}""")
        
        items_text = "\n\n".join(items_list)
        
        return f"""Analyze these cybersecurity/AI/tech news items. For each, provide analysis in JSON format.

Rating guide:
5.0 = Critical breaking news (0-days, major breaches, groundbreaking AI/tech)
4.0-4.9 = High value content (new techniques, important updates)
3.5-3.9 = Worth knowing (trends, useful info)
Below 3.5 = Skip (noise, duplicate, not actionable)

Respond with ONLY a JSON array. No markdown, no explanations, just the JSON:

Items to analyze:
{items_text}

Response format (JSON array only):
[{{"title":"...","source":"...","url":"...","timestamp":"...","rating":4.5,"priority":"HIGH VALUE","summary":"Detailed 5-7 sentence analysis explaining what happened, technical details, potential impact, and why security professionals should care","signal":"Why this matters"}}]"""

    
    def _is_relevant(self, text: str) -> bool:
        """Check if content is relevant to cybersecurity/AI/tech"""
        keywords = [
            # Cybersecurity
            'security', 'hack', 'vulnerability', 'exploit', 'breach', 'malware',
            'ransomware', 'phishing', 'cyber', 'zero-day', 'cve', 'bug bounty',
            'pentest', 'red team', 'blue team', 'soc', 'threat', 'attack',
            # AI
            'ai', 'machine learning', 'llm', 'gpt', 'neural', 'model',
            'deep learning', 'artificial intelligence', 'chatgpt', 'claude',
            'openai', 'anthropic', 'gemini',
            # Tech/Innovation
            'breakthrough', 'innovation', 'technology', 'startup', 'launch',
            'release', 'update', 'tech', 'software', 'hardware', 'chip',
            'quantum', 'blockchain', 'crypto'
        ]
        return any(keyword in text for keyword in keywords)
    
    def _mock_process_news(self, news_items: List[Dict]) -> List[Dict]:
        """Mock processing when Claude API is not available"""
        import random
        return [{
            **item,
            'rating': round(random.uniform(3.5, 5.0), 1),
            'priority': random.choice(['CRITICAL', 'HIGH VALUE', 'MEDIUM']),
            'summary': f"Analysis of {item['title'][:80]}...",
            'signal': 'Automated processing - manual review recommended'
        } for item in news_items]
    
    def _mock_process_videos(self, videos: List[Dict]) -> List[Dict]:
        """Mock video processing when Claude API is not available"""
        import random
        return [{
            **video,
            'rating': round(random.uniform(3.5, 5.0), 1),
            'worthWatching': random.choice([True, False]),
            'summary': f"Video about {video['title'][:80]}...",
            'verdict': 'Automated processing - watch to verify'
        } for video in videos]

def main():
    scraper = SignalGridScraper()
    results = scraper.scrape_all()
    
    # Save to data.json
    output_path = 'data.json'
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n💾 Results saved to {output_path}")

if __name__ == '__main__':
    main()