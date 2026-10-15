"""
Layer 1: Rule-Based Pattern Engine for Child Safety Monitoring.

Uses CONTEXTUAL pattern matching (not simple keyword matching) to detect
potential risks. Analyzes combinations of signals across multiple categories.
"""

import re
from typing import Dict, List, Optional


class RuleEngine:
    """Fast contextual pattern-based risk screening engine."""

    # Entertainment / safe context words that reduce risk scores
    SAFE_CONTEXT_WORDS = {
        'movie', 'film', 'show', 'series', 'episode', 'season', 'trailer',
        'game', 'gaming', 'minecraft', 'fortnite', 'roblox', 'xbox', 'playstation',
        'book', 'novel', 'chapter', 'story', 'character', 'villain', 'hero',
        'sport', 'football', 'soccer', 'basketball', 'baseball', 'match', 'team',
        'score', 'goal', 'win', 'lost', 'played', 'competition', 'tournament',
        'song', 'music', 'album', 'band', 'concert', 'lyrics',
        'meme', 'lol', 'lmao', 'rofl', 'haha', 'jk', 'just kidding',
    }

    JOKE_EMOJIS = {'😂', '🤣', '😆', '😅', '😹', '💀', '😭', '🤪', '😜', '🙃'}
    SPORTS_WORDS = {'game', 'match', 'team', 'score', 'played', 'beat', 'won', 'lost', 'tournament', 'competition', 'goal', 'football', 'soccer', 'basketball', 'cricket'}

    HIGH_WEIGHT_SUBCATS = {
        'photo_request', 'sexual_request', 'sexual_content', 'direct_harm',
        'location_threat', 'meeting_request', 'hopelessness', 'self_injury',
        'private_migration', 'escalation_pattern', 'conditional_threat',
        'identity_request'
    }
    MEDIUM_WEIGHT_SUBCATS = {
        'secrecy', 'isolation', 'insults', 'exclusion', 'social_threat',
        'guilt_trip', 'emotional_pressure', 'obligation', 'money_request',
        'financial_request', 'predatory_bonding'
    }

    def __init__(self):
        self._compile_patterns()

    def _compile_patterns(self):
        """Pre-compile all regex patterns for performance."""
        self.patterns = {
            'GROOMING': {
                'secrecy': [
                    re.compile(r"(don[\u2019't]*|won[\u2019't]*|will\s+not|never)\s*tell\s+(your\s+)?(parents?|mom|dad|mother|father|family|anyone|anybody)", re.I),
                    re.compile(r"(our|this is a|keep (it|this))\s*secret", re.I),
                    re.compile(r"keep.*?\bsecret\b", re.I),
                    re.compile(r"secret\s+from\s+(your\s+)?(parents?|mom|dad|family|anyone)", re.I),
                    re.compile(r"hide\s+(this|our).*?(parents?|mom|dad|family|anyone)", re.I),
                    re.compile(r"(just\s+)?between\s+(you and me|us)", re.I),
                    re.compile(r"keep\s+this\s+private", re.I),
                    re.compile(r"(don[\u2019't]*|won[\u2019't]*)\s*let\s+anyone\s+(know|see|find out)", re.I),
                    re.compile(r"i\s+(won[\u2019't]|will\s+not)\s+tell\s+(anyone|anybody)", re.I),
                ],
                'private_migration': [
                    re.compile(r"(move|switch|go|take this|talk|chat)\s+(to|on|over to|in)?\s*(a\s+)?(private\s+chat|private|dms?|snapchat|snap|telegram|whatsapp|discord|instagram|insta|signal|kik|wickr)", re.I),
                    re.compile(r"(let[\u2019']?s|can we|should we)\s+(talk|chat|move)\s+(in\s+private|privately|secretly|alone)", re.I),
                    re.compile(r"private\s+chat", re.I),
                ],
                'predatory_bonding': [
                    re.compile(r"(i[\u2019']?m|i am)\s+(much\s+)?older", re.I),
                    re.compile(r"age\s+(doesn[\u2019't]*|does not)\s+matter", re.I),
                    re.compile(r"age\s+is\s+(just\s+)?a\s+number", re.I),
                    re.compile(r"(special|secret|deep|unique)\s+(connection|bond|relationship|friendship)", re.I),
                ],
                'age_probing': [
                    re.compile(r"how\s+old\s+are\s+you", re.I),
                    re.compile(r"what(\u2019s|'s| is)\s+your\s+age", re.I),
                    re.compile(r"do\s+you\s+have\s+a\s+(boyfriend|girlfriend|bf|gf)", re.I),
                    re.compile(r"are\s+you\s+(single|dating|seeing anyone)", re.I),
                    re.compile(r"what\s+grade\s+are\s+you\s+in", re.I),
                ],
                'flattery': [
                    re.compile(r"you[\u2019']?re\s+(so\s+)?(mature|special|different|beautiful|pretty|handsome|smart|grown.?up)", re.I),
                    re.compile(r"(not like|different from)\s+(other|most)\s+(kids|girls|boys|children)", re.I),
                    re.compile(r"you\s+understand\s+me\s+(better|more)\s+than", re.I),
                    re.compile(r"(mature|special|unique)\s+for\s+your\s+age", re.I),
                ],
                'gift_reward': [
                    re.compile(r"i[\u2019']?ll\s+(buy|get|send|give)\s+you", re.I),
                    re.compile(r"(want|like)\s+(a\s+)?(new\s+)?(phone|iphone|game|gift|present|money)", re.I),
                    re.compile(r"i\s+(have|got)\s+(a\s+)?(surprise|gift|present)\s+for\s+you", re.I),
                ],
                'isolation': [
                    re.compile(r"your\s+(parents?|mom|dad|family|friends?)\s+(don[\u2019't]*|do not|doesn[\u2019't]*)\s*(understand|care|love|appreciate)", re.I),
                    re.compile(r"(only\s+)?i\s+(truly|really)?\s*(care|understand|love|know)\s+(about\s+)?you", re.I),
                    re.compile(r"(they|everyone)\s+(don[\u2019't]*|doesn[\u2019't]*)\s*(deserve|appreciate)\s+you", re.I),
                    re.compile(r"you\s+can\s+(only\s+)?trust\s+me", re.I),
                ],
                'photo_request': [
                    re.compile(r"send\s+(me\s+)?(a\s+)?(pic|photo|picture|selfie|image|vid|video)", re.I),
                    re.compile(r"(show|let)\s+me\s+(see\s+)?(you|what you look like|yourself)", re.I),
                    re.compile(r"turn\s+on\s+(your\s+)?(camera|cam|webcam|video)", re.I),
                    re.compile(r"(can i|let me)\s+see\s+(you|your\s+(face|body))", re.I),
                ],
            },
            'CYBERBULLYING': {
                'insults': [
                    re.compile(r"(you[\u2019']?re|you are|u r)\s+(so\s+|such\s+a\s+|a\s+)?(ugly|stupid|fat|dumb|worthless|pathetic|disgusting|useless|retarded|trash|garbage|loser|embarrassing|freak)", re.I),
                    re.compile(r"(stupid|ugly|fat|dumb|worthless|pathetic|disgusting)\s+(idiot|moron|loser|piece of)", re.I),
                    re.compile(r"(thinks?|saying)\s+(you[\u2019']?re|you are)\s+(so\s+|such\s+a\s+|a\s+)?(loser|embarrassment|idiot|freak)", re.I),
                    re.compile(r"(nobody|no one)\s+(likes|loves|cares about|wants)\s+you", re.I),
                    re.compile(r"(kill|kys|hang)\s+your\s*self", re.I),
                ],
                'exclusion': [
                    re.compile(r"(nobody|no one)\s+(wants to|will)\s+(be your friend|talk to you|hang out with you)", re.I),
                    re.compile(r"(nobody|no one)\s+wants\s+you\s+(around|here|in\s+our)", re.I),
                    re.compile(r"everyone\s+.*(thinks|says|agrees)\s+you[\u2019']?re\s+(a\s+)?loser", re.I),
                    re.compile(r"everyone\s+(hates|laughs at|makes fun of)\s+you", re.I),
                    re.compile(r"you\s+(don[\u2019't]*|should not|shouldn[\u2019't]*)\s+(belong|come|show up|exist)", re.I),
                    re.compile(r"go\s+away.*nobody\s+wants\s+you", re.I),
                ],
                'appearance_attack': [
                    re.compile(r"(so|really|extremely|incredibly)\s+(ugly|fat|gross|hideous|disgusting)", re.I),
                    re.compile(r"(look|face)\s+(like|is)\s+(trash|garbage|shit|crap|disgusting|horrible)", re.I),
                    re.compile(r"(lose|need to lose)\s+weight", re.I),
                ],
                'social_threat': [
                    re.compile(r"(tell|show)\s+everyone\s+(about|your|what)", re.I),
                    re.compile(r"(post|share|spread|send)\s+(your|the|those)\s+(photo|pic|picture|screenshot|secret|chat)", re.I),
                    re.compile(r"(keep\s+)?(making\s+fun\s+of|laughing\s+at|mocking)\s+you", re.I),
                    re.compile(r"(in|to)\s+(the|our)\s+(class\s+group|group\s+chat|group)", re.I),
                    re.compile(r"(everyone|the whole school)\s+will\s+(see|know|find out|laugh)", re.I),
                ],
            },
            'THREAT': {
                'direct_harm': [
                    re.compile(r"i\s+(will|am going to|am gonna|'m gonna|'m going to)\s+(kill|hurt|harm|beat|hit|attack|stab|shoot|strangle|choke|bash|batter|slice|slaughter|burn|drown|assault|find|stalk|jump)\s+you", re.I),
                    re.compile(r"i[\u2019']?ll\s+(kill|hurt|harm|beat|hit|attack|stab|shoot|strangle|choke|bash|batter|slice|slaughter|burn|drown|assault|find|stalk|jump)\s+you", re.I),
                    re.compile(r"(break\s+your\s+(neck|legs|bones|face)|put\s+you\s+in\s+the\s+(hospital|ground|coma)|bury\s+you|slit\s+your\s+throat)", re.I),
                    re.compile(r"(doxx|swat|leak\s+all\s+your|ruin\s+your\s+life)", re.I),
                    re.compile(r"(wait|watch)\s+(until|till)\s+i\s+(find|see|catch|get)\s+you", re.I),
                    re.compile(r"you[\u2019']?re\s+(dead|done|finished)\b(?!.*\b(game|match|round|level))", re.I),
                ],
                'location_threat': [
                    re.compile(r"i\s+know\s+where\s+you\s+(live|go to school|are|stay)", re.I),
                    re.compile(r"i[\u2019']?m\s+(coming|going)\s+(for|to get|to find|after)\s+you", re.I),
                    re.compile(r"(coming|going)\s+to\s+your\s+(house|home|school)", re.I),
                ],
                'conditional_threat': [
                    re.compile(r"if\s+you\s+(tell|say|don[\u2019't]|refuse|ignore).*i[\u2019']?ll\s+(make\s+sure\s+)?(you\s+)?(hurt|kill|beat|get|destroy|strangle|stab|shoot|regret|pay|suffer)", re.I),
                    re.compile(r"(tell|say)\s+anyone.*and\s+(you[\u2019']?re|i[\u2019']?ll)", re.I),
                    re.compile(r"(you[\u2019']?ll|you\s+will)\s+(find\s+out\s+what\s+happens|regret\s+it|pay\s+for\s+this)", re.I),
                    re.compile(r"(make\s+sure\s+you\s+regret\s+it|make\s+you\s+regret\s+it)", re.I),
                    re.compile(r"what\s+happens\s+if\s+you\s+ignore\s+me", re.I),
                    re.compile(r"stop\s+threatening\s+me", re.I),
                ],
            },
            'SELF_HARM': {
                'hopelessness': [
                    re.compile(r"(don[\u2019't]*|do not)\s+want\s+to\s+(be alive|live|exist|be here|wake up|go on)", re.I),
                    re.compile(r"(wish|want)\s+(i was|i were|to be)\s+dead", re.I),
                    re.compile(r"(nobody|no one)\s+would\s+(care|notice|miss me)\s+if\s+i\s+(was gone|disappeared|died|left)", re.I),
                    re.compile(r"(want|going)\s+to\s+(end|finish)\s+(it|everything|my life|this)", re.I),
                    re.compile(r"(life|everything|it)\s+(is|feels?)\s+(not worth|pointless|meaningless|hopeless|unbearable)", re.I),
                    re.compile(r"feel(ing)?\s+(terrible|horrible|hopeless|worthless|awful)\s*(for\s+(weeks|days|months))?", re.I),
                    re.compile(r"(don[\u2019't]*|can[\u2019't]*)\s*(know\s+how\s+to\s+)?handle\s+these\s+feelings", re.I),
                ],
                'self_injury': [
                    re.compile(r"(want|going|need|started?|think\s+about|thinking\s+of)\s+.*(cut|hurt|harm|punish)\s+(myself|my\s+(arm|wrist|body|leg))", re.I),
                    re.compile(r"(cutting|hurting|harming)\s+myself", re.I),
                    re.compile(r"i\s+(hate|can[\u2019't]*\s+stand)\s+myself", re.I),
                ],
            },
            'PRIVACY_RISK': {
                'address_request': [
                    re.compile(r"what(\u2019s|'s| is)\s+your\s+.*(address|location|area|neighborhood|street)", re.I),
                    re.compile(r"where\s+(do you|exactly do you)\s+live", re.I),
                    re.compile(r"(tell|give|send)\s+(me\s+)?your\s+.*(address|location)", re.I),
                    re.compile(r"home\s*address", re.I),
                ],
                'school_request': [
                    re.compile(r"what\s+school\s+do\s+you\s+(go to|attend)", re.I),
                    re.compile(r"(which|what)\s+(school|class|grade)\s+(are you|do you)", re.I),
                    re.compile(r"where\s+do\s+you\s+go\s+to\s+school", re.I),
                    re.compile(r"(tell|give|send|what(\u2019s|'s| is))\s+(me\s+)?(your\s+)?.*school\s*(name|id|location)?", re.I),
                ],
                'phone_request': [
                    re.compile(r"(what(\u2019s|'s| is)\s+your|give me your|send me your|tell me your)\s+(phone|cell|mobile)\s*(number|no\.?|#)?", re.I),
                    re.compile(r"phone\s*(number|no\.?)", re.I),
                    re.compile(r"(call|text|whatsapp|snap)\s+(you|me)\b", re.I),
                ],
                'identity_request': [
                    re.compile(r"(what(\u2019s|'s| is)\s+your|tell me your)\s+(full|real|last)\s+name", re.I),
                    re.compile(r"(send|share|give|tell)\s+(me\s+)?(your\s+)?(account\s+)?(id|password|login|creds|pass|pin)", re.I),
                    re.compile(r"(account\s+password|login\s+password)", re.I),
                    re.compile(r"(phone\s*number|home\s*address|where\s+you\s+live)", re.I),
                    re.compile(r"fix\s+your\s+profile", re.I),
                    re.compile(r"(just\s+)?send\s+it.*(won[\u2019't]*|will\s+not)\s+tell", re.I),
                ],
                'financial_request': [
                    re.compile(r"(send|give|tell|share)\s+(me\s+)?(your\s+)?.*(credit\s*card|debit\s*card|card\s*number|card\s*info|card\s*details|bank\s*details|cvv|otp|pin)", re.I),
                    re.compile(r"(credit\s*card|debit\s*card|card\s*info|card\s*details|bank\s*account)", re.I),
                ],
            },
            'MANIPULATION': {
                'guilt_trip': [
                    re.compile(r"if\s+you\s+(really|truly|actually)?\s*(loved?|cared?|trusted?)\s+(about\s+)?me", re.I),
                    re.compile(r"(never|didn[\u2019't]*|don[\u2019't]*)\s*(really|truly)?\s*(cared?|loved?|trusted?)\s+(about\s+)?me", re.I),
                    re.compile(r"i\s+thought\s+you\s+were\s+my\s+(best\s+)?friend", re.I),
                    re.compile(r"you[\u2019']?d\s+(give|send|share|tell)\s+(me\s+)?(your\s+)?(password|account)", re.I),
                    re.compile(r"(prove|show)\s+(it|me|that you (care|love|trust))", re.I),
                    re.compile(r"you\s+owe\s+me", re.I),
                    re.compile(r"after\s+(all|everything)\s+(i[\u2019']?ve|i have)\s+(done|sacrificed|given)", re.I),
                ],
                'emotional_pressure': [
                    re.compile(r"(i[\u2019']?ll|i will|i am going to)\s+(hurt|kill|harm)\s+(myself|my\s*self)", re.I),
                    re.compile(r"(i[\u2019']?ll|it[\u2019']?s)\s+(be\s+)?your\s+fault", re.I),
                    re.compile(r"you[\u2019']?re\s+making\s+me\s+(do|feel|act|think)", re.I),
                    re.compile(r"(if\s+you\s+leave|don[\u2019't]*\s+leave).*i[\u2019']?ll", re.I),
                ],
                'obligation': [
                    re.compile(r"you\s+(have|need|must)\s+to\s+do\s+(this|what i say|as i say)", re.I),
                    re.compile(r"you\s+(have|need|must)\s+to\s+(finish|do|complete|write|give)\s+(my\s+)?(assignment|homework|exam|test|work)", re.I),
                    re.compile(r"finish\s+my\s+assignment\s+for\s+me", re.I),
                    re.compile(r"(do\s+it|just\s+do\s+it)\s+(for\s+me|because|or\s+else)", re.I),
                ],
            },
            'SCAM': {
                'money_request': [
                    re.compile(r"(send|give|transfer)\s+(me\s+)?(money|cash|\$|dollar|bitcoin|crypto)", re.I),
                    re.compile(r"(gift\s*card|itunes|google play|amazon|steam)\s*(card|code)?", re.I),
                    re.compile(r"(pay|venmo|cashapp|zelle|paypal)\s+me", re.I),
                ],
                'prize_claim': [
                    re.compile(r"(you|u)\s+(won|have won|been selected|been chosen)", re.I),
                    re.compile(r"(free|congratulations|congrats).*\b(iphone|phone|prize|gift|money|winner)\b", re.I),
                    re.compile(r"claim\s+your\s+(prize|reward|gift|money)", re.I),
                ],
                'suspicious_link': [
                    re.compile(r"(click|tap|open|visit|go to)\s+(this|the|my)\s*(link|url|website|site|page)", re.I),
                    re.compile(r"(bit\.ly|tinyurl|t\.co|goo\.gl|rb\.gy|shorturl)\S*", re.I),
                ],
            },
            'SEXUAL_SAFETY': {
                'sexual_request': [
                    re.compile(r"send\s+(me\s+)?(a\s+)?(nud[es]|naked|sexy)\s*(pic|photo|picture|selfie|image|vid|video)?", re.I),
                    re.compile(r"(take off|remove)\s+(your\s+)?(clothes|shirt|top|bra)", re.I),
                    re.compile(r"(show|let me see)\s+(your\s+)?(body|chest|private|breast)", re.I),
                ],
                'sexual_content': [
                    re.compile(r"(have|want to have|let[\u2019']?s have)\s+sex", re.I),
                    re.compile(r"(touch|feel|stroke|rub)\s+(your|my)\s+(body|private|breast|chest)", re.I),
                    re.compile(r"(horny|aroused|turned on|sexy)\s+(for|by|about|right now)", re.I),
                ],
                'meeting_request': [
                    re.compile(r"(meet|see)\s+(me\s+)?(in\s+)?(person|private|alone|secretly)", re.I),
                    re.compile(r"come\s+(to\s+)?(my\s+)?(house|place|room|hotel|car)", re.I),
                    re.compile(r"(let[\u2019']?s|we should|can we)\s+(meet|hang out|get together)\s+(alone|privately|in secret)", re.I),
                ],
            },
        }

    def analyze(self, message: str, conversation_context: list = None) -> dict:
        """
        Analyze a message with conversation context for risk signals.
        
        Args:
            message: Current message text
            conversation_context: List of recent message dicts [{content, sender_id, ...}]
        
        Returns:
            dict with score, categories, signals, raw_signals
        """
        if not message:
            return {'score': 0, 'categories': {}, 'signals': [], 'raw_signals': []}

        conversation_context = conversation_context or []
        
        # Detect raw signals
        raw_signals = self._detect_signals(message)
        
        # Also check conversation context for multi-message patterns
        context_signals = self._detect_context_patterns(conversation_context)
        all_signals = raw_signals + context_signals
        
        if not all_signals:
            return {'score': 0, 'categories': {}, 'signals': [], 'raw_signals': []}
        
        # Apply context modifiers (false positive protection)
        full_text = message + ' ' + ' '.join(m.get('content', '') for m in conversation_context[-5:])
        modified_signals = self._apply_context_modifiers(all_signals, full_text, message)
        
        # Calculate category scores and final score
        categories, signals_desc = self._calculate_category_scores(modified_signals)
        score = self._calculate_final_score(modified_signals, categories)
        
        return {
            'score': min(100, max(0, int(score))),
            'categories': categories,
            'signals': signals_desc,
            'raw_signals': [{
                'pattern': s['pattern'],
                'category': s['category'],
                'subcategory': s.get('subcategory', s['pattern'].split('.')[-1] if '.' in s.get('pattern', '') else ''),
                'weight': s['weight']
            } for s in modified_signals],
        }

    def _detect_signals(self, text: str) -> list:
        """Detect all matching patterns in the text."""
        signals = []
        for category, subcategories in self.patterns.items():
            for subcat, patterns in subcategories.items():
                for pattern in patterns:
                    if pattern.search(text):
                        signals.append({
                            'category': category,
                            'subcategory': subcat,
                            'pattern': f"{category}.{subcat}",
                            'weight': self._get_base_weight(category, subcat),
                            'source': 'current_message',
                        })
                        break  # One match per subcategory is enough
        return signals

    def _detect_context_patterns(self, context: list) -> list:
        """Detect multi-message patterns across conversation context."""
        signals = []
        if not context or len(context) < 2:
            return signals
        
        # Combine last several messages for context analysis
        recent_texts = [m.get('content', '') for m in context[-10:]]
        combined = ' '.join(recent_texts).lower()
        
        # Check for escalation: early grooming signals (flattery, age probing, predatory bonding)
        # leading into secrecy, platform migration, isolation, or photo requests
        grooming_early = any(
            p.search(combined)
            for sub in ['flattery', 'age_probing', 'predatory_bonding']
            for p in self.patterns.get('GROOMING', {}).get(sub, [])
        )
        grooming_late = any(
            p.search(combined)
            for sub in ['secrecy', 'private_migration', 'photo_request', 'isolation']
            for p in self.patterns.get('GROOMING', {}).get(sub, [])
        )
        secrecy_or_photo = (
            any(p.search(combined) for p in self.patterns.get('GROOMING', {}).get('secrecy', []))
            and any(p.search(combined) for p in self.patterns.get('GROOMING', {}).get('photo_request', []))
        )
        
        if (grooming_early and grooming_late) or secrecy_or_photo:
            signals.append({
                'category': 'GROOMING',
                'subcategory': 'escalation_pattern',
                'pattern': 'GROOMING.escalation_pattern',
                'weight': 0.8,
                'source': 'context',
            })
        
        # Check for sustained bullying (insults in multiple messages)
        insult_count = 0
        for text in recent_texts:
            for pattern in self.patterns.get('CYBERBULLYING', {}).get('insults', []):
                if pattern.search(text):
                    insult_count += 1
                    break
        if insult_count >= 2:
            signals.append({
                'category': 'CYBERBULLYING',
                'subcategory': 'sustained_insults',
                'pattern': 'CYBERBULLYING.sustained_insults',
                'weight': 0.7,
                'source': 'context',
            })
        
        # Check for multiple privacy requests across messages
        privacy_count = 0
        for text in recent_texts:
            for subcat in ['address_request', 'school_request', 'phone_request', 'identity_request', 'financial_request']:
                for pattern in self.patterns.get('PRIVACY_RISK', {}).get(subcat, []):
                    if pattern.search(text):
                        privacy_count += 1
                        break
        if privacy_count >= 2:
            signals.append({
                'category': 'PRIVACY_RISK',
                'subcategory': 'multiple_requests',
                'pattern': 'PRIVACY_RISK.multiple_requests',
                'weight': 0.7,
                'source': 'context',
            })
        
        return signals

    def _get_base_weight(self, category: str, subcategory: str) -> float:
        """Assign base weights to different signal types."""
        if subcategory in self.HIGH_WEIGHT_SUBCATS:
            return 0.8
        elif subcategory in self.MEDIUM_WEIGHT_SUBCATS:
            return 0.6
        else:
            return 0.4

    def _apply_context_modifiers(self, signals: list, full_text: str, current_message: str) -> list:
        """Apply false positive protection based on context."""
        lower_text = full_text.lower()
        lower_msg = current_message.lower()
        
        # Check for safe context using word boundaries
        has_entertainment_context = any(
            re.search(r'\b' + re.escape(word) + r'\b', lower_text)
            for word in self.SAFE_CONTEXT_WORDS
        )
        has_joke_emoji = any(emoji in current_message for emoji in self.JOKE_EMOJIS)
        has_sports_context = any(
            re.search(r'\b' + re.escape(word) + r'\b', lower_text)
            for word in self.SPORTS_WORDS
        )
        
        modified = []
        for signal in signals:
            s = signal.copy()
            
            # Entertainment/movie/game context (does not suppress direct physical threats to individuals)
            if has_entertainment_context and s['category'] in ('THREAT', 'SELF_HARM'):
                if s.get('subcategory') != 'direct_harm' or has_joke_emoji:
                    s['weight'] *= 0.3  # Reduce by 70%
            
            # Joke emoji context  
            if has_joke_emoji and s['category'] == 'THREAT':
                s['weight'] *= 0.5  # Reduce by 50%
            
            # Sports context
            if has_sports_context and s['category'] == 'THREAT':
                s['weight'] *= 0.4  # Reduce by 60%
            
            # Context signals from conversation history are less affected by modifiers
            if s.get('source') == 'context':
                # Restore some weight for context-derived signals
                s['weight'] = max(s['weight'], signal['weight'] * 0.6)
            
            modified.append(s)
        
        return modified

    def _calculate_category_scores(self, signals: list) -> tuple:
        """Calculate per-category scores and generate signal descriptions."""
        categories = {}
        descriptions = []
        
        cat_signals = {}
        for s in signals:
            cat = s['category']
            if cat not in cat_signals:
                cat_signals[cat] = []
            cat_signals[cat].append(s)
        
        for cat, sigs in cat_signals.items():
            # Category score is based on number and weight of signals
            total_weight = sum(s['weight'] for s in sigs)
            num_signals = len(sigs)
            has_high_danger_signal = any(s.get('subcategory') in self.HIGH_WEIGHT_SUBCATS and s.get('weight', 0) >= 0.7 for s in sigs)
            if has_high_danger_signal:
                # Acute high danger pattern preserves high confidence
                cat_score = max(s['weight'] for s in sigs)
            else:
                cat_score = min(1.0, total_weight / max(1, num_signals) * min(num_signals, 3) / 2.0)
            categories[cat] = round(cat_score, 2)
            
            for s in sigs:
                desc = f"[{cat}] {s['subcategory'].replace('_', ' ').title()} pattern detected"
                if s.get('source') == 'context':
                    desc += " (across conversation)"
                descriptions.append(desc)
        
        return categories, descriptions

    def _calculate_final_score(self, signals: list, categories: dict) -> float:
        """Calculate final combined score."""
        if not signals:
            return 0.0
        
        num_signals = len(signals)
        num_categories = len(categories)
        total_weight = sum(s['weight'] for s in signals)
        avg_weight = total_weight / num_signals
        has_high_danger = any(s.get('subcategory') in self.HIGH_WEIGHT_SUBCATS for s in signals)
        has_acute_direct = any(
            s.get('subcategory') in ('direct_harm', 'sexual_request', 'sexual_content', 'location_threat', 'self_injury') 
            and s.get('weight', 0) >= 0.7 
            for s in signals
        )
        
        # Base score from signal count and weights
        if num_signals == 1:
            if has_acute_direct:
                base = 80 + avg_weight * 15  # Acute direct harm threat: 85-95 (Critical)
            elif has_high_danger and avg_weight >= 0.7:
                base = 60 + avg_weight * 20
            elif avg_weight >= 0.5:
                base = 35 + avg_weight * 20
            else:
                base = 15 + avg_weight * 15
        elif num_signals <= 3 and num_categories == 1:
            # 2-3 signals same category: 25-50
            base = 25 + (total_weight / 3) * 30
        elif num_signals <= 3 and num_categories > 1:
            # Multiple signals across categories: 45-75
            base = 45 + (total_weight / 3) * 25
        else:
            # Strong multi-category convergence: 70-100
            base = min(100, 50 + total_weight * 12)
        
        # Category convergence bonus
        if num_categories >= 3:
            base *= 1.2
        elif num_categories >= 2:
            base *= 1.1
        
        # High-danger categories get extra weight
        danger_cats = {'SEXUAL_SAFETY', 'GROOMING', 'SELF_HARM', 'THREAT'}
        if any(cat in danger_cats for cat in categories):
            base = max(base, 35 if has_high_danger else 20)
        
        return min(100, max(0, base))
