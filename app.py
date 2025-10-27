import sys
import os
import traceback
import logging
from datetime import datetime
import requests
from bs4 import BeautifulSoup

# Add the modules directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'modules'))

from flask import Flask, request, jsonify, render_template, send_file
from flask_cors import CORS
import csv
import io
import json
from urllib.parse import urljoin, urlparse
from form_validator import FormValidator
from analytics_detection import AnalyticsDetection
from cms_detection import CMSDetection
from element_analyzer_playwright import ElementAnalyzerPlaywright
from sitemap_parser import SitemapParser
from extract_links import LinkExtractor
from internal_link_logger import InternalLinkLogger
from combined_link_extractor import CombinedLinkExtractor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

class BasicAnalyzer:
    """Fallback analyzer using only basic libraries"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def extract_links(self, url):
        """Basic link extraction"""
        try:
            print(f"🔗 Extracting links from: {url}")
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            base_domain = urlparse(url).netloc
            
            internal_links = []
            external_links = []
            
            for link in soup.find_all('a', href=True):
                href = link.get('href', '').strip()
                if not href or href.startswith('#') or href.startswith('javascript:'):
                    continue
                
                absolute_url = urljoin(url, href)
                parsed_url = urlparse(absolute_url)
                
                if parsed_url.scheme not in ['http', 'https']:
                    continue
                
                link_data = {
                    'url': absolute_url,
                    'text': link.get_text(strip=True)[:100],
                    'title': link.get('title', ''),
                }
                
                if parsed_url.netloc == base_domain:
                    if absolute_url not in [l['url'] for l in internal_links]:
                        internal_links.append(link_data)
                else:
                    if absolute_url not in [l['url'] for l in external_links]:
                        external_links.append(link_data)
            
            print(f"✅ Found {len(internal_links)} internal and {len(external_links)} external links")
            return {
                'internal_links': internal_links,
                'external_links': external_links,
                'total_links': len(internal_links) + len(external_links)
            }
            
        except Exception as e:
            print(f"❌ Link extraction failed: {e}")
            return {'internal_links': [], 'external_links': [], 'total_links': 0, 'error': str(e)}
    
    def detect_cms(self, url):
        """Basic CMS detection"""
        try:
            print(f"🔧 Detecting CMS for: {url}")
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            html_content = response.text.lower()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            detected_cms = []
            
            # WordPress detection
            wp_indicators = [
                'wp-content' in html_content,
                'wp-includes' in html_content,
                soup.find('meta', {'name': 'generator', 'content': lambda x: x and 'wordpress' in x.lower()}),
                soup.find('link', {'href': lambda x: x and 'wp-content' in x})
            ]
            if any(wp_indicators):
                detected_cms.append('WordPress')
            
            # Shopify detection
            if 'shopify' in html_content or 'cdn.shopify' in html_content:
                detected_cms.append('Shopify')
            
            # Drupal detection
            if 'drupal' in html_content:
                detected_cms.append('Drupal')
            
            # Joomla detection
            if 'joomla' in html_content:
                detected_cms.append('Joomla')
            
            # Wix detection
            if 'wix.com' in html_content or 'wixstatic.com' in html_content:
                detected_cms.append('Wix')
            
            # Squarespace detection
            if 'squarespace' in html_content:
                detected_cms.append('Squarespace')
            
            result = {
                'primary_cms': detected_cms[0] if detected_cms else None,
                'detected_systems': detected_cms,
                'total_detected': len(detected_cms)
            }
            
            print(f"✅ CMS Detection complete. Found: {', '.join(detected_cms) if detected_cms else 'None'}")
            return result
            
        except Exception as e:
            print(f"❌ CMS Detection failed: {e}")
            return {'primary_cms': None, 'detected_systems': [], 'total_detected': 0, 'error': str(e)}
    
    def detect_analytics(self, url):
        """Basic analytics detection"""
        try:
            print(f"📊 Detecting analytics for: {url}")
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            html_content = response.text.lower()
            detected_tools = []
            
            # Google Analytics
            if any(pattern in html_content for pattern in ['google-analytics', 'gtag(', 'ga(']):
                detected_tools.append('Google Analytics')
            
            # Google Tag Manager
            if 'googletagmanager' in html_content:
                detected_tools.append('Google Tag Manager')
            
            # Facebook Pixel
            if 'facebook.net' in html_content or 'fbq(' in html_content:
                detected_tools.append('Facebook Pixel')
            
            # Hotjar
            if 'hotjar' in html_content:
                detected_tools.append('Hotjar')
            
            # Mixpanel
            if 'mixpanel' in html_content:
                detected_tools.append('Mixpanel')
            
            result = {
                'detected_tools': detected_tools,
                'total_detected': len(detected_tools)
            }
            
            print(f"✅ Analytics detection complete. Found: {', '.join(detected_tools) if detected_tools else 'None'}")
            return result
            
        except Exception as e:
            print(f"❌ Analytics detection failed: {e}")
            return {'detected_tools': [], 'total_detected': 0, 'error': str(e)}
    
    def analyze_elements(self, url):
        """Enhanced element analysis with detailed detection"""
        try:
            print(f"🔍 Analyzing elements for: {url}")
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Count headings with actual content
            headings = {}
            heading_content = {}
            for i in range(1, 7):
                h_elements = soup.find_all(f'h{i}')
                headings[f'h{i}'] = len(h_elements)
                heading_content[f'h{i}'] = [h.get_text(strip=True)[:50] for h in h_elements[:3]]  # First 3 headings
            
            # Analyze images with detailed info
            images = soup.find_all('img')
            images_without_alt = [img for img in images if not img.get('alt')]
            images_with_alt = [img for img in images if img.get('alt')]
            
            # Analyze forms with input details
            forms = soup.find_all('form')
            form_details = []
            for form in forms:
                inputs = form.find_all('input')
                textareas = form.find_all('textarea')
                selects = form.find_all('select')
                buttons = form.find_all(['button', 'input[type="submit"]'])
                
                form_details.append({
                    'action': form.get('action', ''),
                    'method': form.get('method', 'GET'),
                    'inputs': len(inputs),
                    'textareas': len(textareas),
                    'selects': len(selects),
                    'buttons': len(buttons)
                })
            
            # Analyze links with categories
            links = soup.find_all('a', href=True)
            internal_links = 0
            external_links = 0
            email_links = 0
            phone_links = 0
            
            base_domain = urlparse(url).netloc
            
            for link in links:
                href = link.get('href', '')
                if href.startswith('mailto:'):
                    email_links += 1
                elif href.startswith('tel:'):
                    phone_links += 1
                elif href.startswith('http'):
                    parsed = urlparse(href)
                    if parsed.netloc == base_domain:
                        internal_links += 1
                    else:
                        external_links += 1
            
            # Analyze meta tags with important ones
            meta_tags = soup.find_all('meta')
            important_meta = {}
            
            for meta in meta_tags:
                name = meta.get('name') or meta.get('property')
                content = meta.get('content')
                if name and content:
                    if name.lower() in ['description', 'keywords', 'author', 'viewport', 'robots']:
                        important_meta[name.lower()] = content[:100]
            
            # Detect interactive elements
            buttons = soup.find_all(['button', 'input[type="button"]', 'input[type="submit"]'])
            
            # Detect media elements
            videos = soup.find_all('video')
            audio = soup.find_all('audio')
            iframes = soup.find_all('iframe')
            
            # Detect social media elements
            social_links = []
            social_patterns = ['facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com', 'youtube.com', 'tiktok.com']
            for link in links:
                href = link.get('href', '').lower()
                for pattern in social_patterns:
                    if pattern in href:
                        social_links.append(pattern.replace('.com', '').title())
                        break
            
            # Calculate accessibility score
            accessibility_issues = 0
            accessibility_issues += len(images_without_alt)  # Images without alt text
            accessibility_issues += len([link for link in links if not link.get_text(strip=True) and not link.get('aria-label')])  # Links without text
            
            accessibility_score = max(0, 100 - (accessibility_issues * 5))
            
            result = {
                'headings': {
                    'structure': headings,
                    'content_sample': heading_content,
                    'total_headings': sum(headings.values()),
                    'has_h1': headings.get('h1', 0) > 0,
                    'multiple_h1': headings.get('h1', 0) > 1
                },
                'images': {
                    'total_images': len(images),
                    'with_alt_text': len(images_with_alt),
                    'missing_alt_text': len(images_without_alt),
                    'alt_text_percentage': (len(images_with_alt) / len(images) * 100) if images else 0
                },
                'forms': {
                    'total_forms': len(forms),
                    'form_details': form_details,
                    'total_inputs': sum(form['inputs'] for form in form_details),
                    'total_buttons': sum(form['buttons'] for form in form_details)
                },
                'links': {
                    'total_links': len(links),
                    'internal_links': internal_links,
                    'external_links': external_links,
                    'email_links': email_links,
                    'phone_links': phone_links,
                    'social_platforms': list(set(social_links))
                },
                'meta_tags': {
                    'total_meta_tags': len(meta_tags),
                    'important_tags': important_meta,
                    'has_description': 'description' in important_meta,
                    'has_viewport': 'viewport' in important_meta
                },
                'interactive_elements': {
                    'buttons': len(buttons),
                    'forms': len(forms),
                    'total_interactive': len(buttons) + len(forms)
                },
                'media_elements': {
                    'videos': len(videos),
                    'audio': len(audio),
                    'iframes': len(iframes),
                    'total_media': len(videos) + len(audio) + len(iframes)
                },
                'accessibility': {
                    'score': accessibility_score,
                    'issues_found': accessibility_issues,
                    'images_without_alt': len(images_without_alt),
                    'links_without_text': len([link for link in links if not link.get_text(strip=True)])
                },
                'page_structure': {
                    'total_elements': len(soup.find_all()),
                    'scripts': len(soup.find_all('script')),
                    'stylesheets': len(soup.find_all('link', rel='stylesheet')),
                    'divs': len(soup.find_all('div')),
                    'paragraphs': len(soup.find_all('p'))
                }
            }
        
            print(f"✅ Enhanced element analysis complete")
            return result
        
        except Exception as e:
            print(f"❌ Element analysis failed: {e}")
            return {'error': str(e)}

# Initialize basic analyzer
basic_analyzer = BasicAnalyzer()

@app.route("/")
def index():
    return render_template("index.html")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Website Audit Tool API is running'})

@app.route('/form-validation', methods=['POST'])
def form_validation():
    """Form validation endpoint"""
    try:
        data = request.get_json()
        
        if not data or 'url' not in data:
            return jsonify({'error': 'URL is required'}), 400
        
        url = data['url']
        max_pages = data.get('max_pages', 20)
        
        logger.info(f"🔍 Starting form validation for: {url}")
        
        # Initialize form validator
        validator = FormValidator()
        
        # Perform form validation
        result = validator.validate_forms(url, max_pages=max_pages)
        
        if 'error' in result:
            logger.error(f"❌ Form validation failed: {result['error']}")
            return jsonify(result), 500
        
        logger.info(f"✅ Form validation completed successfully")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"❌ Form validation endpoint error: {e}")
        traceback.print_exc()
        return jsonify({
            'error': f'Form validation failed: {str(e)}',
            'timestamp': datetime.now().isoformat(),
            'status': 'error'
        }), 500

@app.route('/analyze', methods=['POST'])
def analyze_website():
    """Main website analysis endpoint"""
    try:
        data = request.get_json()
        
        if not data or 'url' not in data:
            return jsonify({'error': 'URL is required'}), 400
        
        url = data['url']
        logger.info(f"🔍 Starting website analysis for: {url}")
        
        # Initialize analyzers
        link_extractor = CombinedLinkExtractor()
        element_analyzer = ElementAnalyzerPlaywright()
        cms_detector = CMSDetection()
        analytics_detector = AnalyticsDetection()
        
        # Extract links
        logger.info("📋 Extracting links...")
        link_result = link_extractor.extract_links(url)
        
        if 'error' in link_result:
            return jsonify(link_result), 500
        
        # Analyze elements
        logger.info("🔍 Analyzing page elements...")
        element_result = element_analyzer.analyze_elements(url)
        
        # Detect CMS
        logger.info("🔧 Detecting CMS...")
        cms_result = cms_detector.detect_cms(url)
        
        # Detect analytics
        logger.info("📊 Detecting analytics tools...")
        analytics_result = analytics_detector.detect_analytics(url)
        
        # Combine results
        combined_result = {
            **link_result,
            'elements': element_result.get('elements', {}),
            'cms_detected': cms_result,
            'analytics_tools': analytics_result,
            'timestamp': datetime.now().isoformat(),
            'status': 'completed'
        }
        
        logger.info("✅ Website analysis completed successfully")
        return jsonify(combined_result)
        
    except Exception as e:
        logger.error(f"❌ Website analysis error: {e}")
        traceback.print_exc()
        return jsonify({
            'error': f'Website analysis failed: {str(e)}',
            'timestamp': datetime.now().isoformat(),
            'status': 'error'
        }), 500

@app.route('/analyze-all-links', methods=['POST'])
def analyze_all_links():
    """Deep analysis endpoint for multiple pages"""
    try:
        data = request.get_json()
        
        if not data or 'url' not in data:
            return jsonify({'error': 'URL is required'}), 400
        
        url = data['url']
        max_links = data.get('max_links', 50)
        
        logger.info(f"🔍 Starting deep analysis for: {url}")
        
        # Initialize analyzer
        element_analyzer = ElementAnalyzerPlaywright()
        
        # Perform deep analysis
        result = element_analyzer.analyze_multiple_pages(url, max_links=max_links)
        
        if 'error' in result:
            logger.error(f"❌ Deep analysis failed: {result['error']}")
            return jsonify(result), 500
        
        logger.info("✅ Deep analysis completed successfully")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"❌ Deep analysis error: {e}")
        traceback.print_exc()
        return jsonify({
            'error': f'Deep analysis failed: {str(e)}',
            'timestamp': datetime.now().isoformat(),
            'status': 'error'
        }), 500

@app.route('/quick-links', methods=['POST'])
def quick_links():
    """Quick link extraction endpoint"""
    try:
        data = request.get_json()
        
        if not data or 'url' not in data:
            return jsonify({'error': 'URL is required'}), 400
        
        url = data['url']
        logger.info(f"🔍 Starting quick link extraction for: {url}")
        
        # Initialize link extractor
        link_extractor = LinkExtractor()
        
        # Extract links quickly
        result = link_extractor.extract_links_quick(url)
        
        # Add quick mode flag
        result['quick_mode'] = True
        result['timestamp'] = datetime.now().isoformat()
        result['status'] = 'completed'
        
        logger.info("✅ Quick link extraction completed successfully")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"❌ Quick link extraction error: {e}")
        traceback.print_exc()
        return jsonify({
            'error': f'Quick link extraction failed: {str(e)}',
            'timestamp': datetime.now().isoformat(),
            'status': 'error'
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    logger.info("🚀 Starting Website Audit Tool Backend...")
    logger.info("📍 Available endpoints:")
    logger.info("  - POST /form-validation - Form validation analysis")
    logger.info("  - POST /analyze - Complete website analysis")
    logger.info("  - POST /analyze-all-links - Deep multi-page analysis")
    logger.info("  - POST /quick-links - Quick link extraction")
    logger.info("  - GET /health - Health check")
    
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True,
        threaded=True
    )
