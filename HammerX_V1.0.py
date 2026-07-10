import os
import base64
import time
import requests
import json
from datetime import datetime
import fitz  # PyMuPDF
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client

# --- SECURITY VAULT ACCESS ---
API_KEY = os.environ.get("GEMINI_API_KEY") 
MODEL_NAME = "gemini-2.5-flash" 
BASE_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL_NAME}:generateContent?key={API_KEY}"

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# Initialize Supabase Client if credentials exist
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if (SUPABASE_URL and SUPABASE_KEY) else None

app = FastAPI(title="SDF HammerX Headless Core V1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HammerPackage(BaseModel):
    filename: str
    fileData: str  # Base64 string from index.html
    start_page: int
    end_page: int

@app.post("/analyse")
async def handle_web_relay(package: HammerPackage):
    # Initialize a diagnostic system log for this specific runtime execution strike
    system_log = []
    def log_diagnostic(msg):
        timestamp = datetime.now().strftime('%H:%M:%S')
        system_log.append(f"[{timestamp}] {msg}")
        print(f"[{timestamp}] {msg}")

    log_diagnostic(f"START STRIKE: Ingesting file payload '{package.filename}'")
    
    try:
        # 1. Convert Base64 string back to binary PDF layout in active memory
        file_bytes = base64.b64decode(package.fileData)
        pdf_doc = fitz.open(stream=file_bytes, filetype="pdf")
        log_diagnostic(f"PDF successfully mounted in memory. Total pages: {pdf_doc.page_count}")
        
        # Array to capture the absolute raw feed from the AI (The Feedback Log)
        feedback_log_entries = []
        
        start_idx = max(0, package.start_page - 1)
        end_idx = min(pdf_doc.page_count, package.end_page)
        log_diagnostic(f"Target execution window set from page {package.start_page} to {package.end_page}")
        
        # 2. Ingestion Processing Loop
        for i in range(start_idx, end_idx):
            log_diagnostic(f"Milling Page {i+1}...")
            page_text = pdf_doc[i].get_text("text")
            
            if not page_text.strip():
                log_diagnostic(f"Page {i+1} Warning: Blank page or image-only format detected. Skipping.")
                continue
                
            prompt = f"""
            ACT AS: Industrial Design Data Refinery.
            TASK: Extract Technical Nouns (including Concrete Nouns, Compound Engineering Nouns, and System Components) and categorize them into exactly 9 bins.

            STRICT DEFINITIONS:
            1. [WHAT]: The concrete or compound engineering NOUN or COMPONENT only.
            2. [PURPOSE]: The functional 'Reason for Existence' of the Noun.
            3. [RULE]: MANDATORY design constraints only. Must contain 'Shall', 'Must', 'Required', or 'Prohibited'.
            4. [FORMULA]: Mathematical logic or calculation only.
            5. [ID]: Official Component Serial numbers, Part IDs, Pin numbers, or specific Schematic Tagging conventions.
            6. [RELATED]: How this item connects to other systems in this manual.
            7. [OBJECTIVE]: The dictionary-grade engineering definition of the noun.
            8. [SOURCE]: The origin of the data.
            9. [WHY]: The underlying logic or safety necessity for this specific design.

            OUTPUT FORMAT (STRICT):
            [CATEGORY] NOUN | DETAIL | SUPPORTING_INFO
            Return ONLY the raw data in the pipe-separated format above. Do not include summary text.
            
            TEXT TO PROCESS:
            {page_text}
            """
            
            payload = {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"temperature": 0.0}}
            
            start_time = time.time()
            res = requests.post(BASE_URL, json=payload, timeout=120)
            latency = round(time.time() - start_time, 2)
            
            if res.status_code == 200:
                res_json = res.json()
                if 'candidates' in res_json and len(res_json['candidates']) > 0:
                    page_output = res_json['candidates'][0]['content']['parts'][0]['text']
                    # Append raw page block directly to your Feedback Log array
                    feedback_log_entries.append(f"--- PAGE {i+1} START ---\n{page_output}\n")
                    log_diagnostic(f"Page {i+1} Refined successfully. Latency: {latency}s")
                else:
                    log_diagnostic(f"Page {i+1} Error: Gemini API returned clean structure but no contents.")
            elif res.status_code == 429:
                log_diagnostic(f"Page {i+1} Warning: Rate limit threshold tapped. Engaging 5s buffer cooldown...")
                time.sleep(5)
                # Retry once
                res = requests.post(BASE_URL, json=payload, timeout=120)
                if res.status_code == 200:
                    page_output = res.json()['candidates'][0]['content']['parts'][0]['text']
                    feedback_log_entries.append(f"--- PAGE {i+1} START ---\n{page_output}\n")
                    log_diagnostic(f"Page {i+1} Refined successfully on secondary loop.")
            else:
                log_diagnostic(f"Page {i+1} Critical API failure. Status Code: {res.status_code}")
        
        log_diagnostic("All targeted pages processed. Compiling data payloads...")
        
        # 3. GENERATE THE SECURE FILE SIGNATURE
        import hashlib
        timestamp_nonce = str(time.time())
        file_hash = hashlib.sha256((package.filename + timestamp_nonce).encode()).hexdigest()[:50]
        secure_storage_name = f"{file_hash}.json"
        
        # 4. STRUCTURE THE ARCHIVE PAYLOAD WITH SYSTEM DIAGNOSTICS
        final_json_payload = {
            "metadata": {
                "source_file": package.filename,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "pages_milled": f"{package.start_page}-{package.end_page}",
                "engine_version": "HammerX_V1.0"
            },
            "system_log": system_log,  # <-- Diagnostic log stored directly inside the file
            "feedback_log": "\n".join(feedback_log_entries)  # <-- Complete raw un-parsed data pool
        }
        
        json_string_data = json.dumps(final_json_payload, indent=4)
        
        # 5. EXPORT DIRECT TO SUPABASE VAULT
        if supabase:
            supabase.storage.from_("user_data").upload(
                path=secure_storage_name,
                file=bytes(json_string_data, 'utf-8'),
                file_options={"content-type": "application/json"}
            )
            print(f"[VAULT EXPORT SUCCESS] Saved to Supabase as: {secure_storage_name}")
        else:
            print("[WARNING] Supabase credentials missing. File skipped database write.")

        return {
            "status": "success",
            "filename": package.filename,
            "signature": secure_storage_name,
            "payload": final_json_payload
        }
        
    except Exception as e:
        log_diagnostic(f"CRITICAL SYSTEM CRASH: {str(e)}")
        return {
            "status": "error", 
            "message": str(e),
            "diagnostics": system_log
        }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)