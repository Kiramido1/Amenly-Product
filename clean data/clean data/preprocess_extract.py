import argparse
import csv
import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Tuple

import fitz  # PyMuPDF
import pandas as pd


def normalize_text(text: str) -> str:
    text = text.replace("\u00a0", " ")
    text = text.replace("\r", "\n")
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]{2,}", " ", text)
    return text.strip()


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def extract_pdf(path: Path) -> Tuple[List[Dict], float]:
    pages: List[Dict] = []
    with fitz.open(path) as doc:
        total_chars = 0
        for idx, page in enumerate(doc, start=1):
            raw = page.get_text("text")
            clean = normalize_text(raw)
            pages.append(
                {
                    "page_number": idx,
                    "char_count": len(clean),
                    "text": clean,
                }
            )
            total_chars += len(clean)

        page_count = len(doc)

    # Quick extraction quality score in [0, 1]
    # Heuristic: average page text length, penalize empty pages.
    if page_count == 0:
        quality = 0.0
    else:
        empty_pages = sum(1 for p in pages if p["char_count"] == 0)
        avg_chars = total_chars / page_count
        score_density = min(avg_chars / 2000.0, 1.0)
        score_empty_penalty = 1.0 - (empty_pages / page_count)
        quality = round((0.6 * score_density) + (0.4 * score_empty_penalty), 4)

    return pages, quality


def extract_xlsx(path: Path) -> Tuple[List[Dict], float]:
    sheets_payload: List[Dict] = []
    xls = pd.ExcelFile(path)
    non_empty_rows = 0
    total_rows = 0

    for sheet_name in xls.sheet_names:
        df = pd.read_excel(path, sheet_name=sheet_name, dtype=str)
        df = df.fillna("")
        records = df.to_dict(orient="records")
        rows = []
        for i, record in enumerate(records, start=1):
            cleaned_record = {k: normalize_text(str(v)) for k, v in record.items()}
            if any(v for v in cleaned_record.values()):
                non_empty_rows += 1
            rows.append(
                {
                    "row_number": i,
                    "values": cleaned_record,
                }
            )

        total_rows += len(rows)
        sheets_payload.append(
            {
                "sheet_name": sheet_name,
                "row_count": len(rows),
                "rows": rows,
            }
        )

    if total_rows == 0:
        quality = 0.0
    else:
        quality = round(non_empty_rows / total_rows, 4)

    return sheets_payload, quality


def process_file(
    workspace_root: Path, row: Dict[str, str], output_dir: Path, output_document_id: str
) -> Dict[str, str]:
    rel_path = row["relative_path"]
    file_path = workspace_root / rel_path
    ext = file_path.suffix.lower()
    document_id = row["document_id"]

    result = {
        "document_id": output_document_id,
        "source_document_id": document_id,
        "relative_path": rel_path,
        "file_type": ext.lstrip("."),
        "framework": row.get("framework", ""),
        "country": row.get("country", ""),
        "source_type": row.get("source_type", ""),
        "is_official": row.get("is_official", ""),
        "status": "success",
        "error": "",
        "quality_score": "",
        "output_file": "",
        "file_hash": "",
    }

    if not file_path.exists():
        result["status"] = "failed"
        result["error"] = "File not found"
        return result

    try:
        file_hash = sha256_file(file_path)
        result["file_hash"] = file_hash

        base_payload = {
            "document_id": output_document_id,
            "source_document_id": document_id,
            "relative_path": rel_path,
            "file_type": ext.lstrip("."),
            "framework": row.get("framework", ""),
            "country": row.get("country", ""),
            "source_type": row.get("source_type", ""),
            "is_official": row.get("is_official", ""),
            "file_hash": file_hash,
            "processed_at_utc": datetime.now(timezone.utc).isoformat(),
        }

        if ext == ".pdf":
            pages, quality = extract_pdf(file_path)
            base_payload["pages"] = pages
            base_payload["total_pages"] = len(pages)
            base_payload["extraction_quality_score"] = quality
            result["quality_score"] = str(quality)

        elif ext == ".xlsx":
            sheets, quality = extract_xlsx(file_path)
            base_payload["sheets"] = sheets
            base_payload["total_sheets"] = len(sheets)
            base_payload["extraction_quality_score"] = quality
            result["quality_score"] = str(quality)
        else:
            result["status"] = "skipped"
            result["error"] = f"Unsupported extension: {ext}"
            return result

        output_path = output_dir / f"{output_document_id}.json"
        output_path.write_text(
            json.dumps(base_payload, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        result["output_file"] = str(output_path)
        return result
    except Exception as exc:
        result["status"] = "failed"
        result["error"] = str(exc)
        return result


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Extract text from PDF/XLSX files listed in data_inventory.csv"
    )
    parser.add_argument(
        "--inventory",
        default="data_inventory.csv",
        help="Path to inventory CSV file.",
    )
    parser.add_argument(
        "--output-dir",
        default="processed/text",
        help="Directory where extracted JSON files are written.",
    )
    parser.add_argument(
        "--report",
        default="processed/extraction_report.csv",
        help="Path to extraction report CSV.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Optional row limit for smoke testing. 0 means process all.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    workspace_root = Path.cwd()
    inventory_path = workspace_root / args.inventory
    output_dir = workspace_root / args.output_dir
    report_path = workspace_root / args.report
    output_dir.mkdir(parents=True, exist_ok=True)
    report_path.parent.mkdir(parents=True, exist_ok=True)

    if not inventory_path.exists():
        raise FileNotFoundError(f"Inventory file not found: {inventory_path}")

    with inventory_path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    if args.limit > 0:
        rows = rows[: args.limit]

    if not rows:
        raise ValueError("No rows found in inventory CSV.")

    results = []
    used_output_ids = set()
    for row in rows:
        base_id = row["document_id"].strip()
        output_document_id = base_id
        if output_document_id in used_output_ids:
            suffix = sha256_file(workspace_root / row["relative_path"])[:8]
            output_document_id = f"{base_id}_{suffix}"
        used_output_ids.add(output_document_id)

        result = process_file(workspace_root, row, output_dir, output_document_id)
        results.append(result)
        print(
            f"[{result['status']}] {result['document_id']} "
            f"({result['file_type']}) -> {result['output_file'] or result['error']}"
        )

    fields = [
        "document_id",
        "source_document_id",
        "relative_path",
        "file_type",
        "framework",
        "country",
        "source_type",
        "is_official",
        "status",
        "error",
        "quality_score",
        "file_hash",
        "output_file",
    ]
    with report_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(results)

    succeeded = sum(1 for r in results if r["status"] == "success")
    failed = sum(1 for r in results if r["status"] == "failed")
    skipped = sum(1 for r in results if r["status"] == "skipped")
    print(
        "\nDone. "
        f"Processed: {len(results)}, Success: {succeeded}, Failed: {failed}, Skipped: {skipped}"
    )
    print(f"Report: {report_path}")


if __name__ == "__main__":
    main()
