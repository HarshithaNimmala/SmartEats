import os
import json
from vision_engine import scan_label_nutrition
from dotenv import load_dotenv

load_dotenv()

# We'll use a sample image if available, or just test the connection
def test():
    print("Testing Gemini Vision V3 connection...")
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    print(f"API Key present: {bool(api_key)}")
    
    # Create a dummy small red image for testing connection if no real image
    import io
    from PIL import Image
    img = Image.new('RGB', (100, 100), color = 'red')
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    img_bytes = img_byte_arr.getvalue()
    
    try:
        result = scan_label_nutrition(img_bytes)
        print("Result from Gemini:")
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(f"Test failed with error: {e}")

if __name__ == "__main__":
    test()
