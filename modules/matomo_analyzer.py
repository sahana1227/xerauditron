import requests
import re
import json
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin
from datetime import datetime

class MatomoAnalyzer:
    """
    Comprehensive Matomo analytics detection and analysis module for Xerauditron
    """
    
    def __init__(self, timeout=30):
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Xerauditron-MatomoAnalyzer/1.0 (Web Analytics Auditing Tool)'
        })
        
        # Matomo detection patterns
        self.matomo_patterns = {
            'script_files': [
                r'matomo\.js',
                r'piwik\.js',
                r'piwik\.min\.js',
                r'matomo\.min\.js'
            ],
            'tracking_code': [
                r'_paq\.push',
                r'var _paq = _paq \|\| \[\]',
                r'window\._paq = window\._paq \|\| \[\]'
            ],
            'endpoints': [
                r'matomo\.php',
                r'piwik\.php',
                r'\.php\?.*idsite=',
                r'\.php\?.*rec=1'
            ]
        }
    
    def comprehensive_analysis(self, url):
        """
        Perform comprehensive Matomo analysis on a website
        """
        try:
            print(f"🔍 Starting comprehensive Matomo analysis for: {url}")
            
            # Fetch website content
            response = self.session.get(url, timeout=self.timeout)
            response.raise_for_status()
            
            html_content = response.text
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Initialize analysis result
            analysis_result = {
                'url': url,
                'timestamp': datetime.now().isoformat(),
                'basic_detection': self.detect_matomo(html_content),
                'implementation': self.analyze_implementation(html_content, soup),
                'configuration': self.analyze_configuration(html_content),
                'privacy': self.analyze_privacy_features(html_content),
                'performance': self.analyze_performance(html_content, soup),
                'compliance': self.assess_compliance(html_content),
                'recommendations': []
            }
            
            # Generate recommendations based on analysis
            analysis_result['recommendations'] = self.generate_recommendations(analysis_result)
            
            # Calculate overall compliance score
            analysis_result['compliance_score'] = self.calculate_compliance_score(analysis_result)
            
            print(f"✅ Matomo analysis completed for: {url}")
            return analysis_result
            
        except Exception as e:
            print(f"❌ Matomo analysis failed for {url}: {e}")
            return {
                'url': url,
                'timestamp': datetime.now().isoformat(),
                'error': str(e),
                'basic_detection': {'detected': False, 'confidence': 0, 'evidence': []}
            }
    
    def detect_matomo(self, html_content):
        """
        Basic Matomo detection using pattern matching
        """
        detection_result = {
            'detected': False,
            'confidence': 0,
            'evidence': [],
            'patterns_found': {}
        }
        
        total_score = 0
        evidence = []
        
        # Check for script files
        for pattern in self.matomo_patterns['script_files']:
            matches = re.findall(pattern, html_content, re.I)
            if matches:
                score = 30
                total_score += score
                evidence.append(f"Script pattern found: {pattern}")
                detection_result['patterns_found']['script_files'] = matches
        
        # Check for tracking code
        for pattern in self.matomo_patterns['tracking_code']:
            if re.search(pattern, html_content, re.I):
                score = 25
                total_score += score
                evidence.append(f"Tracking code pattern: {pattern}")
                detection_result['patterns_found']['tracking_code'] = True
        
        # Check for endpoints
        for pattern in self.matomo_patterns['endpoints']:
            matches = re.findall(pattern, html_content, re.I)
            if matches:
                score = 20
                total_score += score
                evidence.append(f"Endpoint pattern: {pattern}")
                detection_result['patterns_found']['endpoints'] = matches
        
        # Set detection status
        if total_score > 0:
            detection_result['detected'] = True
            detection_result['confidence'] = min(total_score, 100)
            detection_result['evidence'] = evidence
        
        return detection_result
    
    def analyze_implementation(self, html_content, soup):
        """
        Analyze Matomo implementation details
        """
        implementation = {
            'type': None,
            'version': None,
            'script_location': None,
            'async_loading': False,
            'script_placement': None,
            'multiple_trackers': False
        }
        
        # Find Matomo scripts
        matomo_scripts = soup.find_all('script', src=re.compile(r'(matomo|piwik)\.js', re.I))
        
        if matomo_scripts:
            script = matomo_scripts[0]
            src = script.get('src', '')
            
            # Determine implementation type
            if 'matomo.cloud' in src or 'innocraft.cloud' in src:
                implementation['type'] = 'cloud'
            elif 'googletagmanager.com' in html_content and 'matomo' in html_content.lower():
                implementation['type'] = 'tag_manager'
            else:
                implementation['type'] = 'self_hosted'
            
            # Check for async loading
            if script.get('async') is not None or script.get('defer') is not None:
                implementation['async_loading'] = True
            
            # Determine script placement
            if script.find_parent('head'):
                implementation['script_placement'] = 'head'
            elif script.find_parent('body'):
                implementation['script_placement'] = 'body'
            
            # Check for multiple trackers
            if len(matomo_scripts) > 1:
                implementation['multiple_trackers'] = True
        
        # Try to detect version
        version_patterns = [
            r'matomo\.js\?v=([0-9.]+)',
            r'piwik\.js\?v=([0-9.]+)',
            r'Matomo version ([0-9.]+)',
            r'Piwik version ([0-9.]+)'
        ]
        
        for pattern in version_patterns:
            match = re.search(pattern, html_content, re.I)
            if match:
                implementation['version'] = match.group(1)
                break
        
        return implementation
    
    def analyze_configuration(self, html_content):
        """
        Analyze Matomo configuration settings
        """
        config = {
            'site_id': None,
            'tracker_url': None,
            'custom_dimensions': [],
            'goals': [],
            'ecommerce_enabled': False,
            'download_tracking': False,
            'link_tracking': False,
            'form_tracking': False,
            'content_tracking': False
        }
        
        # Extract site ID
        site_id_pattern = r'_paq\.push\(\[\'setSiteId\',\s*[\'"](\d+)[\'"]\]\)'
        site_id_match = re.search(site_id_pattern, html_content, re.I)
        if site_id_match:
            config['site_id'] = site_id_match.group(1)
        
        # Extract tracker URL
        tracker_patterns = [
            r'_paq\.push\(\[\'setTrackerUrl\',\s*[\'"]([^\'\"]+)[\'"]\]\)',
            r'u\+[\'"]([^\'\"]*(?:matomo|piwik)\.php[^\'\"]*)[\'"]'
        ]
        
        for pattern in tracker_patterns:
            match = re.search(pattern, html_content, re.I)
            if match:
                config['tracker_url'] = match.group(1)
                break
        
        # Check for custom dimensions
        custom_dim_pattern = r'_paq\.push\(\[\'setCustomDimension\',\s*(\d+),\s*[\'"]([^\'\"]*)[\'\"]\]\)'
        custom_dims = re.findall(custom_dim_pattern, html_content, re.I)
        config['custom_dimensions'] = [{'id': dim[0], 'value': dim[1]} for dim in custom_dims]
        
        # Check for goal tracking
        if re.search(r'_paq\.push\(\[\'trackGoal\'', html_content, re.I):
            config['goals'] = ['goal_tracking_detected']
        
        # Check for ecommerce
        ecommerce_patterns = [
            r'_paq\.push\(\[\'trackEcommerceOrder\'',
            r'_paq\.push\(\[\'setEcommerceView\'',
            r'_paq\.push\(\[\'addEcommerceItem\''
        ]
        
        for pattern in ecommerce_patterns:
            if re.search(pattern, html_content, re.I):
                config['ecommerce_enabled'] = True
                break
        
        # Check for download tracking
        if re.search(r'_paq\.push\(\[\'enableLinkTracking\'\]\)', html_content, re.I):
            config['download_tracking'] = True
            config['link_tracking'] = True
        
        # Check for form tracking
        if re.search(r'_paq\.push\(\[\'enableFormAnalytics\'\]\)', html_content, re.I):
            config['form_tracking'] = True
        
        # Check for content tracking
        if re.search(r'_paq\.push\(\[\'trackAllContentImpressions\'\]\)', html_content, re.I):
            config['content_tracking'] = True
        
        return config
    
    def analyze_privacy_features(self, html_content):
        """
        Analyze privacy-related features and settings
        """
        privacy = {
            'cookieless_tracking': False,
            'do_not_track_respect': False,
            'gdpr_compliance': False,
            'cookie_consent_integration': False,
            'ip_anonymization': False,
            'opt_out_available': False,
            'consent_manager_detected': False
        }
        
        # Check for cookieless tracking
        if re.search(r'_paq\.push\(\[\'setCookielessTracking\',\s*true\]\)', html_content, re.I):
            privacy['cookieless_tracking'] = True
        
        # Check for Do Not Track respect
        if re.search(r'_paq\.push\(\[\'setDoNotTrack\',\s*true\]\)', html_content, re.I):
            privacy['do_not_track_respect'] = True
        
        # Check for IP anonymization
        ip_patterns = [
            r'_paq\.push\(\[\'anonymizeIp\'\]\)',
            r'_paq\.push\(\[\'setIpAnonymization\',\s*true\]\)'
        ]
        
        for pattern in ip_patterns:
            if re.search(pattern, html_content, re.I):
                privacy['ip_anonymization'] = True
                break
        
        # Check for consent managers
        consent_patterns = [
            r'cookiebot',
            r'onetrust',
            r'cookiepro',
            r'quantcast',
            r'klaro',
            r'cookie.*consent',
            r'consent.*manager'
        ]
        
        for pattern in consent_patterns:
            if re.search(pattern, html_content, re.I):
                privacy['consent_manager_detected'] = True
                privacy['cookie_consent_integration'] = True
                break
        
        # Check for opt-out mechanism
        opt_out_patterns = [
            r'matomo.*opt.*out',
            r'piwik.*opt.*out',
            r'analytics.*opt.*out'
        ]
        
        for pattern in opt_out_patterns:
            if re.search(pattern, html_content, re.I):
                privacy['opt_out_available'] = True
                break
        
        # Assess GDPR compliance based on features
        gdpr_features = [
            privacy['cookieless_tracking'] or privacy['cookie_consent_integration'],
            privacy['ip_anonymization'],
            privacy['opt_out_available'] or privacy['do_not_track_respect']
        ]
        
        privacy['gdpr_compliance'] = sum(gdpr_features) >= 2
        
        return privacy
    
    def analyze_performance(self, html_content, soup):
        """
        Analyze performance impact of Matomo implementation
        """
        performance = {
            'script_size': 0,
            'script_count': 0,
            'blocking_scripts': 0,
            'load_optimization': {
                'async_loading': False,
                'defer_loading': False,
                'minified': False
            }
        }
        
        # Count Matomo scripts
        matomo_scripts = soup.find_all('script', src=re.compile(r'(matomo|piwik)', re.I))
        performance['script_count'] = len(matomo_scripts)
        
        # Check for blocking scripts
        for script in matomo_scripts:
            if not (script.get('async') or script.get('defer')):
                performance['blocking_scripts'] += 1
            
            # Check for optimization
            if script.get('async'):
                performance['load_optimization']['async_loading'] = True
            if script.get('defer'):
                performance['load_optimization']['defer_loading'] = True
            
            # Check if minified
            src = script.get('src', '')
            if '.min.js' in src:
                performance['load_optimization']['minified'] = True
        
        # Estimate tracking requests
        tracking_calls = len(re.findall(r'_paq\.push', html_content))
        performance['estimated_tracking_calls'] = tracking_calls
        
        return performance
    
    def assess_compliance(self, html_content):
        """
        Assess overall compliance with privacy regulations
        """
        compliance = {
            'gdpr_ready': False,
            'ccpa_considerations': False,
            'cookie_policy_linked': False,
            'privacy_policy_linked': False,
            'data_retention_mentioned': False
        }
        
        # Check for privacy policy links
        privacy_patterns = [
            r'privacy\s*policy',
            r'data\s*protection',
            r'cookie\s*policy'
        ]
        
        for pattern in privacy_patterns:
            if re.search(pattern, html_content, re.I):
                compliance['privacy_policy_linked'] = True
                compliance['cookie_policy_linked'] = True
                break
        
        # Check for data retention mentions
        retention_patterns = [
            r'data\s*retention',
            r'delete.*data',
            r'data.*storage.*period'
        ]
        
        for pattern in retention_patterns:
            if re.search(pattern, html_content, re.I):
                compliance['data_retention_mentioned'] = True
                break
        
        return compliance
    
    def generate_recommendations(self, analysis_result):
        """
        Generate recommendations based on analysis results
        """
        recommendations = []
        
        # Basic detection recommendations
        if not analysis_result['basic_detection']['detected']:
            return [{'type': 'info', 'message': 'No Matomo installation detected'}]
        
        # Performance recommendations
        performance = analysis_result['performance']
        if performance['blocking_scripts'] > 0:
            recommendations.append({
                'type': 'warning',
                'category': 'performance',
                'message': f'Found {performance["blocking_scripts"]} blocking Matomo scripts. Consider using async or defer attributes.'
            })
        
        if not performance['load_optimization']['minified']:
            recommendations.append({
                'type': 'suggestion',
                'category': 'performance',
                'message': 'Consider using minified Matomo scripts for better performance.'
            })
        
        # Privacy recommendations
        privacy = analysis_result['privacy']
        if not privacy['gdpr_compliance']:
            recommendations.append({
                'type': 'critical',
                'category': 'privacy',
                'message': 'Matomo implementation may not be GDPR compliant. Consider enabling cookieless tracking or implementing consent management.'
            })
        
        if not privacy['ip_anonymization']:
            recommendations.append({
                'type': 'warning',
                'category': 'privacy',
                'message': 'IP anonymization is not enabled. This is required for GDPR compliance in most cases.'
            })
        
        if not privacy['opt_out_available']:
            recommendations.append({
                'type': 'suggestion',
                'category': 'privacy',
                'message': 'Consider providing an opt-out mechanism for users who do not want to be tracked.'
            })
        
        # Configuration recommendations
        config = analysis_result['configuration']
        if not config['download_tracking']:
            recommendations.append({
                'type': 'suggestion',
                'category': 'features',
                'message': 'Enable download and link tracking to get more insights into user behavior.'
            })
        
        if not config['ecommerce_enabled'] and 'shop' in analysis_result['url'].lower():
            recommendations.append({
                'type': 'suggestion',
                'category': 'features',
                'message': 'This appears to be an e-commerce site. Consider enabling Matomo ecommerce tracking.'
            })
        
        return recommendations
    
    def calculate_compliance_score(self, analysis_result):
        """
        Calculate overall compliance score (0-100)
        """
        if not analysis_result['basic_detection']['detected']:
            return 0
        
        score = 0
        max_score = 100
        
        # Privacy compliance (40 points)
        privacy = analysis_result['privacy']
        if privacy['gdpr_compliance']:
            score += 20
        if privacy['ip_anonymization']:
            score += 10
        if privacy['cookieless_tracking'] or privacy['cookie_consent_integration']:
            score += 10
        
        # Performance (30 points)
        performance = analysis_result['performance']
        if performance['blocking_scripts'] == 0:
            score += 15
        if performance['load_optimization']['async_loading'] or performance['load_optimization']['defer_loading']:
            score += 10
        if performance['load_optimization']['minified']:
            score += 5
        
        # Implementation quality (30 points)
        implementation = analysis_result['implementation']
        if implementation['type'] in ['cloud', 'self_hosted']:
            score += 10
        if implementation['async_loading']:
            score += 10
        if analysis_result['configuration']['download_tracking']:
            score += 5
        if len(analysis_result['configuration']['custom_dimensions']) > 0:
            score += 5
        
        return min(score, max_score)

    def export_report(self, analysis_result, format='json'):
        """
        Export analysis report in various formats
        """
        if format.lower() == 'json':
            return json.dumps(analysis_result, indent=2, default=str)
        
        elif format.lower() == 'summary':
            return self._generate_summary_report(analysis_result)
        
        else:
            return json.dumps(analysis_result, indent=2, default=str)
    
    def _generate_summary_report(self, analysis_result):
        """
        Generate a human-readable summary report
        """
        report = []
        report.append("=" * 60)
        report.append("XERAUDITRON - MATOMO ANALYSIS REPORT")
        report.append("=" * 60)
        report.append(f"URL: {analysis_result['url']}")
        report.append(f"Timestamp: {analysis_result['timestamp']}")
        report.append(f"Compliance Score: {analysis_result.get('compliance_score', 0)}/100")
        report.append("")
        
        # Detection summary
        detection = analysis_result['basic_detection']
        report.append("DETECTION SUMMARY:")
        report.append(f"  Matomo Detected: {'Yes' if detection['detected'] else 'No'}")
        report.append(f"  Confidence: {detection['confidence']}%")
        
        if detection['detected']:
            report.append(f"  Evidence: {', '.join(detection['evidence'][:3])}")
            report.append("")
            
            # Implementation details
            impl = analysis_result['implementation']
            report.append("IMPLEMENTATION:")
            report.append(f"  Type: {impl['type'] or 'Unknown'}")
            report.append(f"  Version: {impl['version'] or 'Unknown'}")
            report.append(f"  Async Loading: {'Yes' if impl['async_loading'] else 'No'}")
            report.append("")
            
            # Privacy summary
            privacy = analysis_result['privacy']
            report.append("PRIVACY COMPLIANCE:")
            report.append(f"  GDPR Ready: {'Yes' if privacy['gdpr_compliance'] else 'No'}")
            report.append(f"  Cookieless Tracking: {'Yes' if privacy['cookieless_tracking'] else 'No'}")
            report.append(f"  IP Anonymization: {'Yes' if privacy['ip_anonymization'] else 'No'}")
            report.append("")
            
            # Recommendations
            recommendations = analysis_result.get('recommendations', [])
            if recommendations:
                report.append("RECOMMENDATIONS:")
                for i, rec in enumerate(recommendations[:5], 1):
                    report.append(f"  {i}. [{rec['type'].upper()}] {rec['message']}")
        
        report.append("=" * 60)
        report.append("Report generated by XERAUDITRON Matomo Analyzer")
        report.append("=" * 60)
        
        return "\n".join(report)