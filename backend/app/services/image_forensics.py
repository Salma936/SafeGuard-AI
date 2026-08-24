"""
image_forensics.py
-------------------
Core logic for detecting edited / morphed screenshots and images.

Techniques used:
1. Error Level Analysis (ELA) - resaves the image at a known JPEG quality
   and diffs it against the original. Regions that were edited/pasted in
   later tend to compress differently than the rest of the image, showing
   up as bright patches in the ELA output.
2. Noise/edge consistency check - splices often leave a visible seam in
   local noise variance even when ELA is inconclusive (e.g. for PNG
   screenshots that were never JPEG-compressed to begin with).
3. Metadata inspection - checks for editing software signatures in EXIF
   (Photoshop, GIMP, etc.) and flags missing/stripped metadata, which is
   common when images are exported after editing to hide traces.

This is a heuristic forensic tool, not a courtroom-grade deepfake
detector. It's meant to flag "this looks suspicious, here's why" rather
than give a hard yes/no.
"""

import io
import base64
from dataclasses import dataclass, field
from typing import Optional

import numpy as np
from PIL import Image, ImageChops, ImageEnhance
from PIL.ExifTags import TAGS


ELA_QUALITY = 90          # JPEG quality used for the resave-and-diff step
ELA_SCALE = 15            # brightness multiplier so diffs are visible to the eye
SUSPICIOUS_SOFTWARE = [
    "photoshop", "gimp", "lightroom", "affinity photo",
    "pixlr", "canva", "picsart", "facetune", "snapseed",
]


@dataclass
class ForensicsResult:
    manipulation_score: int              # 0-100, higher = more suspicious
    verdict: str                         # human-readable summary
    findings: list = field(default_factory=list)   # list of {label, detail, severity}
    ela_heatmap_base64: Optional[str] = None        # PNG, base64-encoded
    noise_heatmap_base64: Optional[str] = None


def _load_image(image_bytes: bytes) -> Image.Image:
    img = Image.open(io.BytesIO(image_bytes))
    img = img.convert("RGB")
    return img


def _run_ela(img: Image.Image, block: int = 16) -> tuple[Image.Image, float]:
    """
    Resave the image at ELA_QUALITY and diff against the original.

    Uses block-level statistics rather than a whole-image mean: a pasted
    or re-touched region is usually small relative to the full image, so
    averaging error over every pixel dilutes the signal to near zero.
    Instead we compute mean error per block and compare the most
    suspicious block against the image's typical (median) block, which
    stays sensitive to localized edits.

    Returns (heatmap_image, localized_error_score).
    """
    buffer = io.BytesIO()
    img.save(buffer, "JPEG", quality=ELA_QUALITY)
    buffer.seek(0)
    resaved = Image.open(buffer)

    diff = ImageChops.difference(img, resaved)
    extrema = diff.getextrema()  # per-channel (min, max)
    max_diff = max(ch[1] for ch in extrema) or 1
    scale = 255.0 / max_diff
    heatmap = ImageEnhance.Brightness(diff).enhance(scale)

    diff_gray = np.array(diff).astype(np.float32).mean(axis=2)
    h, w = diff_gray.shape
    if h < block * 3 or w < block * 3:
        # image too small to block-analyze meaningfully; fall back to mean
        return heatmap, float(diff_gray.mean())

    block_means = [
        diff_gray[y:y + block, x:x + block].mean()
        for y in range(0, h - block, block)
        for x in range(0, w - block, block)
    ]
    arr = np.array(block_means)
    median_error = float(np.median(arr))
    top_error = float(np.percentile(arr, 97))  # worst ~3% of blocks

    # How much the most-edited-looking region stands out from the image's
    # own typical compression noise. A single global JPEG re-save (no
    # tampering) keeps this close to 0; a pasted/re-touched patch tends to
    # push it higher. A floor on median_error prevents near-flat regions
    # (common with text/hard edges, which naturally compress unevenly)
    # from blowing the ratio up disproportionately.
    floor = max(median_error, 2.0)
    localized_score = (top_error - median_error) * min(top_error / floor, 5.0)
    localized_score = min(localized_score, 200.0)  # hard cap, tune against real samples

    return heatmap, localized_score


def _run_noise_consistency(img: Image.Image) -> tuple[Optional[Image.Image], float]:
    """
    Splits the image into blocks and measures local noise (via Laplacian
    variance approximation using numpy gradients, no OpenCV dependency).
    Spliced regions often show an abrupt jump in local noise variance
    compared to neighboring blocks.
    """
    gray = np.array(img.convert("L")).astype(np.float32)
    h, w = gray.shape
    block = 16
    if h < block * 2 or w < block * 2:
        return None, 0.0

    gy, gx = np.gradient(gray)
    grad_mag = np.sqrt(gx ** 2 + gy ** 2)

    block_variances = []
    heat = np.zeros_like(gray)
    for y in range(0, h - block, block):
        row_vars = []
        for x in range(0, w - block, block):
            patch = grad_mag[y:y + block, x:x + block]
            var = float(patch.var())
            row_vars.append(var)
            heat[y:y + block, x:x + block] = var
        block_variances.extend(row_vars)

    if not block_variances:
        return None, 0.0

    arr = np.array(block_variances)
    mean_v, std_v = arr.mean(), arr.std() or 1.0
    # Coefficient of variation as an inconsistency proxy: high spread in
    # local noise across blocks suggests non-uniform processing.
    inconsistency_score = float(std_v / (mean_v + 1e-6))

    heat_norm = (heat - heat.min()) / (heat.max() - heat.min() + 1e-6) * 255
    heat_img = Image.fromarray(heat_norm.astype(np.uint8)).convert("RGB")

    return heat_img, inconsistency_score


def _check_metadata(img: Image.Image) -> list[dict]:
    findings = []
    exif_data = img.getexif()

    if not exif_data:
        findings.append({
            "label": "No EXIF metadata found",
            "detail": (
                "The image has no embedded metadata. This is normal for "
                "raw screenshots, but is also common when images are "
                "re-exported after editing to strip traces."
            ),
            "severity": "info",
        })
        return findings

    software = None
    for tag_id, value in exif_data.items():
        tag = TAGS.get(tag_id, tag_id)
        if tag == "Software":
            software = str(value)

    if software:
        lowered = software.lower()
        if any(tool in lowered for tool in SUSPICIOUS_SOFTWARE):
            findings.append({
                "label": f"Editing software detected: {software}",
                "detail": "EXIF metadata shows this image was processed by known image-editing software.",
                "severity": "high",
            })
        else:
            findings.append({
                "label": f"Software tag: {software}",
                "detail": "Metadata present but not from a known editor.",
                "severity": "info",
            })

    return findings


def _image_to_base64(img: Image.Image) -> str:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")


def analyze_image(image_bytes: bytes) -> ForensicsResult:
    img = _load_image(image_bytes)

    ela_heatmap, ela_score = _run_ela(img)
    noise_heatmap, noise_score = _run_noise_consistency(img)
    metadata_findings = _check_metadata(img)

    findings = list(metadata_findings)

    # --- Score aggregation (heuristic weights - START HERE, then tune
    # against your own labeled set of known-edited vs. known-original
    # screenshots; see the note in the accompanying README). ---
    ela_component = min(ela_score / 15.0, 1.0) * 55           # up to 55 pts
    noise_component = min(noise_score / 3.0, 1.0) * 30        # up to 30 pts
    metadata_component = 15 if any(
        f["severity"] == "high" for f in metadata_findings
    ) else 0

    score = int(round(ela_component + noise_component + metadata_component))
    score = max(0, min(score, 100))

    if ela_score > 12:
        findings.append({
            "label": "Elevated ELA response",
            "detail": (
                "Certain regions compress differently than the rest of the "
                "image, which can indicate that content was pasted in or "
                "re-touched after the original was saved."
            ),
            "severity": "high" if ela_score > 20 else "medium",
        })

    if noise_score > 1.5:
        findings.append({
            "label": "Inconsistent local noise pattern",
            "detail": (
                "Noise texture varies more sharply between regions than "
                "expected for a single, unedited capture."
            ),
            "severity": "high" if noise_score > 2.5 else "medium",
        })

    if score >= 70:
        verdict = "Likely edited or morphed"
    elif score >= 35:
        verdict = "Some signs of possible editing — inconclusive"
    else:
        verdict = "No strong signs of manipulation detected"

    return ForensicsResult(
        manipulation_score=score,
        verdict=verdict,
        findings=findings,
        ela_heatmap_base64=_image_to_base64(ela_heatmap),
        noise_heatmap_base64=_image_to_base64(noise_heatmap) if noise_heatmap else None,
    )
