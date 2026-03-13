import pdfplumber, os

DOCS = r"c:\dev\pam-shopify\DOCS"

pdfs = [
    "Psychiatric_Assessment_Mastery_AI_Voice_Script_Production_Handbook (1).pdf",
    "Psychiatric Assessment Mastery Canva Prompt Bank 20 Posts.pdf",
    "Psychiatric_Assessment_Mastery_Brand_Style_Guide.pdf",
    "Psychiatric_Assessment_Mastery_30_Day_Production_Tracker(1).pdf",
]

for fname in pdfs:
    fpath = os.path.join(DOCS, fname)
    if not os.path.exists(fpath):
        print(f"=== MISSING: {fname} ===")
        continue
    print(f"\n{'='*80}")
    print(f"FILE: {fname}")
    print(f"{'='*80}")
    try:
        with pdfplumber.open(fpath) as pdf:
            print(f"Pages: {len(pdf.pages)}")
            for i, page in enumerate(pdf.pages):  # all pages
                text = page.extract_text()
                if text and text.strip():
                    print(f"\n--- Page {i+1} ---")
                    print(text[:4000])
    except Exception as e:
        print(f"ERROR: {e}")
