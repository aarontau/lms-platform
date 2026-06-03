"""
Use PyMuPDF to render PDF pages as images, then Windows.Media.Ocr
via a PowerShell subprocess for each page.  Only reads page 1 (the
cover / application letter) of each PDF to find the full name.
"""
import fitz, os, subprocess, tempfile, json

BASE = r'C:\Users\aaron.tau\Desktop\UL-Mankweng Circuit WSP\UL-Junior Project Implementation Plan\UL MW TT Activities\Teacher Recruitment'

PDF_PATHS = []
for folder in [
    BASE,
    BASE + r'\_extracted_cvs\cv,sars number and application letters of ul eduactors',
    BASE + r'\_extracted_ul_educators\UL EDUCATORS',
]:
    for fname in os.listdir(folder):
        if fname.lower().endswith('.pdf'):
            PDF_PATHS.append((fname, os.path.join(folder, fname)))

# PowerShell OCR helper — uses Windows.Media.Ocr (no external deps)
PS_OCR = r"""
param([string]$imgPath)
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Storage.StorageFile,Windows.Storage,ContentType=WindowsRuntime]
$null = [Windows.Media.Ocr.OcrEngine,Windows.Foundation,ContentType=WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder,Windows.Foundation,ContentType=WindowsRuntime]

function Await($WinRtTask, $ResultType) {
    $asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() |
        Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and
            $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
    $asTaskGeneric = $asTask.MakeGenericMethod($ResultType)
    $netTask = $asTaskGeneric.Invoke($null, @($WinRtTask))
    $netTask.Wait() | Out-Null
    $netTask.Result
}

$file = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($imgPath)) ([Windows.Storage.StorageFile])
$stream = Await ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
$decoder = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
$bitmap = Await ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
$result = Await ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
$result.Text
"""

def ocr_image(img_path):
    result = subprocess.run(
        ['powershell', '-NoProfile', '-Command', PS_OCR, '-imgPath', img_path],
        capture_output=True, text=True, timeout=30
    )
    return result.stdout.strip()

results = {}
for fname, fpath in sorted(PDF_PATHS):
    print(f'Processing: {fname}', flush=True)
    try:
        doc = fitz.open(fpath)
        page = doc[0]
        mat = fitz.Matrix(2.0, 2.0)  # 2x zoom for better OCR
        pix = page.get_pixmap(matrix=mat)
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
            tmp_path = tmp.name
        pix.save(tmp_path)
        doc.close()
        text = ocr_image(tmp_path)
        os.unlink(tmp_path)
        results[fname] = text if text else '[OCR RETURNED EMPTY]'
    except Exception as e:
        results[fname] = f'[ERROR: {e}]'

print('\n' + '='*60)
for fname, text in sorted(results.items()):
    print(f'\n=== {fname} ===')
    print(text[:2000])
