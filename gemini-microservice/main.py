from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from decouple import config
from typing import List
import httpx
from io import BytesIO
from PIL import Image as PILImage
import base64

# Import the new Google GenAI SDK
from google import genai
from google.genai.types import Part, Content

# Load environment variables from .env file
load_dotenv()

# Get API key from environment
GEMINI_API_KEY = config("GEMINI_API_KEY", default=config("GEMINI_KEY", default=None))
if not GEMINI_API_KEY:
    raise RuntimeError("❌ Set GEMINI_API_KEY in your .env file")

print(f"✅ Gemini API Key loaded: {GEMINI_API_KEY[:10]}...")

# Initialize the Gemini client
client = genai.Client(api_key=GEMINI_API_KEY)

# Create FastAPI app
app = FastAPI(title="Gemini Summary Service", version="1.0.0")

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class SummaryRequest(BaseModel):
    note: str = ""
    photo_count: int = 0
    image_urls: List[str] = []
    style: str = "short"

class SummaryResponse(BaseModel):
    summary: str

# Root endpoint
@app.get("/")
def read_root():
    return {"status": "Gemini Summary Service Running"}

# Download and prepare image for Gemini
async def download_image(url: str):
    """Download image from URL and return as bytes"""
    try:
        async with httpx.AsyncClient() as http_client:
            response = await http_client.get(url, timeout=10.0)
            response.raise_for_status()
            return response.content
    except Exception as e:
        print(f"❌ Error downloading image {url}: {str(e)}")
        return None

# Generate summary endpoint
@app.post("/generate-summary", response_model=SummaryResponse)
async def generate_summary(req: SummaryRequest):
    try:
        print(f"📝 Received request - Style: {req.style}, Photos: {req.photo_count}, Image URLs: {len(req.image_urls)}, Note length: {len(req.note)}")
        
        # Define style prompts
        style_prompts = {
            "short": "Write a brief, simple 1–2 sentence summary",
            "cheerful": "Write an upbeat, happy 2–3 sentence summary with positive energy and enthusiasm",
            "nostalgic": "Write a warm, reflective 2–3 sentence summary that captures memories and sentiment",
        }
        style_prompt = style_prompts.get(req.style, style_prompts["short"])

        # Build content for Gemini
        parts = []
        
        # Add instruction text
        if req.image_urls:
            prompt_text = f"""You are writing as the person whose journal this is. {style_prompt} of YOUR day.

You took {req.photo_count} photo(s) today. Look at the images and describe what YOU see and did.

Your journal note: {req.note if req.note else "(No written note)"}

CRITICAL RULES:
- Write as "I" - you ARE this person
- Start immediately with the summary - NO preambles like "Here's a summary" or "Based on..."
- NO meta-commentary about the task
- Just write naturally as if reflecting on your own day
- Mention what's in your photos as part of your story

Example format: "What a beautiful day! I captured some amazing sunset photos at the beach. The colors were incredible..."

Now write YOUR summary:"""
        else:
            prompt_text = f"""You are writing as the person whose journal this is. {style_prompt} of YOUR day.

Your journal note: {req.note if req.note else "(No written note)"}

CRITICAL RULES:
- Write as "I" - you ARE this person
- Start immediately with the summary - NO preambles like "Here's a summary" or "Based on..."
- NO meta-commentary about the task
- Just write naturally as if reflecting on your own day

Example format: "Today was productive! I worked on some interesting research..."

Now write YOUR summary:"""
        
        parts.append(Part(text=prompt_text))
        
        # Download and add images if they exist
        if req.image_urls:
            print(f"🖼️ Downloading {len(req.image_urls)} images...")
            for idx, image_url in enumerate(req.image_urls[:5]):  # Limit to 5 images
                image_bytes = await download_image(image_url)
                if image_bytes:
                    try:
                        # Verify it's a valid image
                        img = PILImage.open(BytesIO(image_bytes))
                        img.verify()
                        
                        # Re-open for processing (verify closes the file)
                        img = PILImage.open(BytesIO(image_bytes))
                        
                        # Convert to RGB if needed
                        if img.mode != 'RGB':
                            img = img.convert('RGB')
                        
                        # Save as JPEG to bytes
                        img_byte_arr = BytesIO()
                        img.save(img_byte_arr, format='JPEG')
                        img_bytes = img_byte_arr.getvalue()
                        
                        # Add image part with inline_data
                        parts.append(Part(
                            inline_data={
                                'mime_type': 'image/jpeg',
                                'data': base64.b64encode(img_bytes).decode('utf-8')
                            }
                        ))
                        print(f"✅ Image {idx + 1} added to prompt")
                    except Exception as e:
                        print(f"❌ Invalid image {idx + 1}: {str(e)}")
        
        print(f"🤖 Calling Gemini Vision API with {len(parts)} parts...")
        
        # Create content with parts
        content = Content(parts=parts)
        
        # Call Gemini API with vision support
        response = client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=content,
        )
        
        summary = response.text.strip()
        print(f"✅ Summary generated: {summary[:100]}...")
        
        return SummaryResponse(summary=summary)
    
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating summary: {str(e)}")

# Run the server
if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Gemini Summary Service...")
    uvicorn.run(app, host="0.0.0.0", port=8001)