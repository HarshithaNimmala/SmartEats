import pdfplumber
import cv2
import numpy as np

_reader = None

def get_reader():
    global _reader
    if _reader is None:
        import easyocr
        # gpu=False ensures it works on systems without CUDA, but can be set to True if available
        _reader = easyocr.Reader(['en'], gpu=False)
    return _reader

def parse_pdf(file_bytes: bytes) -> str:
    import io
    text = ""
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
    except Exception as e:
        print(f"PDF Parsing error: {e}")
    return text

def parse_image(file_bytes: bytes) -> str:
    try:
        np_arr = np.frombuffer(file_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is None:
            return ""
            
        # EasyOCR works well with raw BGR image
        # You can do OpenCV preprocessing here if needed, but EasyOCR handles it natively well
        reader = get_reader()
        results = reader.readtext(img, detail=0, paragraph=False)
        text = "\n".join(results)
        return text
    except Exception as e:
        print(f"Image Parsing error: {e}")
        return ""

def extract_raw_text(file_bytes: bytes, filename: str, content_type: str) -> str:
    lower_name = filename.lower()
    if 'pdf' in content_type or lower_name.endswith('.pdf'):
        return parse_pdf(file_bytes)
    elif 'image' in content_type or lower_name.endswith(('.png', '.jpg', '.jpeg')):
        return parse_image(file_bytes)
    else:
        # fallback try decoding as string if it's text
        try:
            return file_bytes.decode('utf-8')
        except:
            return ""
