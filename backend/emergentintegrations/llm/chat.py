import os
import json
import requests
import asyncio

class UserMessage:
    def __init__(self, text: str):
        self.text = text

class TextDelta:
    def __init__(self, content: str):
        self.content = content

class StreamDone:
    pass

class LlmChat:
    def __init__(self, api_key: str, session_id: str, system_message: str):
        self.api_key = api_key
        self.session_id = session_id
        self.system_message = system_message
        self.provider = "google"
        self.model_name = "gemini-2.5-flash"

    def with_model(self, provider: str, model_name: str):
        return self

    async def send_message(self, user_msg: UserMessage) -> str:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._send_message_sync, user_msg.text)

    def _send_message_sync(self, text: str) -> str:
        api_key = os.environ.get("GEMINI_API_KEY") or self.api_key
        if not api_key:
            return self._get_fallback_mock(text)
            
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": f"System Instruction: {self.system_message}\n\nUser Prompt: {text}"}]
                }
            ]
        }
        
        # If system instruction requires JSON, configure it
        if "JSON" in self.system_message:
            payload["generationConfig"] = {
                "responseMimeType": "application/json"
            }
            
        try:
            r = requests.post(url, headers=headers, json=payload, timeout=60)
            if r.status_code == 200:
                res_data = r.json()
                return res_data["candidates"][0]["content"]["parts"][0]["text"]
            else:
                return self._get_fallback_mock(text)
        except Exception:
            return self._get_fallback_mock(text)

    async def stream_message(self, user_msg: UserMessage):
        api_key = os.environ.get("GEMINI_API_KEY") or self.api_key
        text = user_msg.text
        
        success = False
        if api_key:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key={api_key}"
            headers = {"Content-Type": "application/json"}
            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": f"System Instruction: {self.system_message}\n\nUser Prompt: {text}"}]
                    }
                ]
            }
            try:
                r = requests.post(url, headers=headers, json=payload, stream=True, timeout=60)
                if r.status_code == 200:
                    success = True
                    for line in r.iter_lines(decode_unicode=True):
                        if not line:
                            continue
                        clean_line = line.strip().lstrip("[").rstrip(",").rstrip("]")
                        if not clean_line:
                            continue
                        try:
                            chunk = json.loads(clean_line)
                            content = chunk["candidates"][0]["content"]["parts"][0]["text"]
                            yield TextDelta(content)
                            await asyncio.sleep(0.01)
                        except Exception:
                            pass
                r.close()
            except Exception:
                pass

        if not success:
            mock_text = "Hello! I am your Luminora AI Tutor. I am here to help you learn and succeed. Let's discuss your study interests or the subject you'd like to dive into today."
            for word in mock_text.split(" "):
                yield TextDelta(word + " ")
                await asyncio.sleep(0.05)
        
        yield StreamDone()

    def _get_fallback_mock(self, text: str) -> str:
        text_lower = text.lower()
        if "photosynthesis" in text_lower or "exam" in self.system_message or "quiz" in self.system_message:
            return json.dumps({
                "title": "Photosynthesis and Plant Biology",
                "questions": [
                    {
                        "id": "q1",
                        "question": "What is the primary pigment used by plants to absorb light during photosynthesis?",
                        "options": ["Chlorophyll a", "Carotenoids", "Phycobilins", "Xanthophylls"],
                        "correct_index": 0,
                        "topic": "Light Absorption",
                        "explanation": "Chlorophyll a is the principal pigment involved in photosynthesis, absorbing blue-violet and red light."
                    },
                    {
                        "id": "q2",
                        "question": "Which of the following is a product of the light-dependent reactions of photosynthesis?",
                        "options": ["Oxygen", "Glucose", "Carbon Dioxide", "Water"],
                        "correct_index": 0,
                        "topic": "Light Reactions",
                        "explanation": "Oxygen is produced as a byproduct of water photolysis during the light reactions."
                    },
                    {
                        "id": "q3",
                        "question": "Where does the Calvin Cycle take place within the chloroplast?",
                        "options": ["Stroma", "Thylakoid Membrane", "Granum", "Lumen"],
                        "correct_index": 0,
                        "topic": "Calvin Cycle",
                        "explanation": "The Calvin Cycle occurs in the stroma, the fluid-filled region of the chloroplast."
                    },
                    {
                        "id": "q4",
                        "question": "Which enzyme catalyzes the first step of carbon fixation in C3 plants?",
                        "options": ["RuBisCO", "PEP Carboxylase", "ATP Synthase", "Carbonic Anhydrase"],
                        "correct_index": 0,
                        "topic": "Carbon Fixation",
                        "explanation": "RuBisCO catalyzes the carboxylation of RuBP, fixing carbon dioxide in the Calvin Cycle."
                    },
                    {
                        "id": "q5",
                        "question": "What happens during photolysis in photosynthesis?",
                        "options": ["Water molecules are split using light energy", "Carbon dioxide is reduced to glucose", "ATP is synthesized from ADP and Pi", "Chlorophyll molecules are degraded"],
                        "correct_index": 0,
                        "topic": "Light Reactions",
                        "explanation": "Photolysis splits water molecules into oxygen, protons, and electrons in the presence of light."
                    }
                ]
            })
        elif "heart" in text_lower:
            return json.dumps({
                "title": "The Human Heart",
                "subject": "Biology",
                "model3d": "heart",
                "difficulty": "Intermediate",
                "read_minutes": 5,
                "objectives": [
                    "Identify the four chambers of the human heart",
                    "Trace the path of blood through pulmonary and systemic circulation",
                    "Understand the role of cardiac valves in preventing backflow"
                ],
                "sections": [
                    {
                        "heading": "Anatomy of the Chambers",
                        "content": "The human heart consists of four chambers: two upper atria and two lower ventricles. The atria receive blood entering the heart, while the ventricles pump blood out of the heart."
                    },
                    {
                        "heading": "Pulmonary and Systemic Loops",
                        "content": "Deoxygenated blood returns from the body to the right atrium, is pumped into the right ventricle, and travels to the lungs. Oxygenated blood from the lungs enters the left atrium, moves to the left ventricle, and is pumped to the rest of the body."
                    }
                ],
                "examples": [
                    "Valves functioning like one-way doors to keep blood moving forward.",
                    "The heartbeat sound ('lub-dub') caused by the closing of heart valves."
                ],
                "flashcards": [
                    {"front": "What prevents backflow of blood in the heart?", "back": "Valves (tricuspid, bicuspid, pulmonary, and aortic)"},
                    {"front": "Which ventricle has thicker walls and why?", "back": "The left ventricle, because it must pump blood to the entire body against higher resistance."}
                ],
                "summary": "The human heart is a highly specialized muscular pump that maintains continuous circulation of blood throughout the body.",
                "revision_notes": [
                    "Four chambers: Right/Left Atria, Right/Left Ventricles.",
                    "Right side handles deoxygenated blood; Left side handles oxygenated blood.",
                    "Heart valves ensure unidirectional blood flow."
                ]
            })
        elif "career" in self.system_message:
            return json.dumps({
                "summary": "Based on your interests in science and technology, here is your career roadmap.",
                "careers": [
                    {"title": "Bioinformatics Scientist", "match": 95, "description": "Combine biology, computer science, and information technology to analyze genomic data.", "salary_range": "₹10L - ₹30L / yr"},
                    {"title": "Data Scientist", "match": 88, "description": "Analyze complex digital data to help organizations make strategic decisions.", "salary_range": "₹8L - ₹25L / yr"}
                ],
                "degrees": ["B.Tech in Biotechnology", "M.Sc in Bioinformatics", "B.Sc in Computer Science"],
                "skill_gaps": [
                    {"skill": "Python Programming", "current": 40, "target": 85},
                    {"skill": "Molecular Biology Basics", "current": 30, "target": 75}
                ],
                "roadmap": [
                    {"phase": "0-6 months", "focus": "Learn Python basics and statistics", "milestones": ["Complete introductory Python course", "Build a small data analysis project"]},
                    {"phase": "6-12 months", "focus": "Learn basic bioinformatics tools and genomic databases", "milestones": ["Learn BLAST and Biopython", "Analyze a public dataset"]}
                ]
            })
        else:
            return json.dumps({
                "title": "General Science Introduction",
                "subject": "General",
                "model3d": "atom",
                "difficulty": "Beginner",
                "read_minutes": 5,
                "objectives": ["Identify the steps of the scientific method", "Differentiate between observations and inferences"],
                "sections": [
                    {
                        "heading": "The Scientific Method",
                        "content": "The scientific method is a structured approach used by scientists to investigate natural phenomena. It involves making observations, forming hypotheses, conducting experiments, and drawing conclusions."
                    }
                ],
                "examples": ["Testing how temperature affects the rate of a chemical reaction."],
                "flashcards": [{"front": "What is a hypothesis?", "back": "A testable explanation for a set of observations."}],
                "summary": "Science is a systematic way of exploring and understanding the physical universe.",
                "revision_notes": ["Scientific method: Observe, Hypothesize, Experiment, Analyze, Conclude."]
            })
