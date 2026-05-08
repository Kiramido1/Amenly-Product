import argparse
import csv
import json
import re
from pathlib import Path
from typing import Dict, Iterable, List, Tuple


def normalize_text(text: str) -> str:
    text = text.replace("\u00a0", " ")
    text = text.replace("\r", "\n")
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def tokenize_words(text: str) -> List[str]:
    return text.split()


def detokenize_words(words: List[str]) -> str:
    return " ".join(words).strip()


def chunk_text_by_words(
    text: str, chunk_size_words: int, overlap_words: int
) -> List[Tuple[str, int, int]]:
    words = tokenize_words(text)
    if not words:
        return []

    chunks: List[Tuple[str, int, int]] = []
    start = 0
    n = len(words)
    while start < n:
        end = min(start + chunk_size_words, n)
        chunk_words = words[start:end]
        chunk_text = detokenize_words(chunk_words)
        if chunk_text:
            chunks.append((chunk_text, start, end))
        if end >= n:
            break
        start = max(0, end - overlap_words)
    return chunks


def infer_language_hint(text: str) -> str:
    # Lightweight heuristic to avoid adding extra dependency now.
    arabic_chars = len(re.findall(r"[\u0600-\u06FF]", text))
    latin_chars = len(re.findall(r"[A-Za-z]", text))
    if arabic_chars > latin_chars:
        return "ar"
    if latin_chars > 0:
        return "en"
    return "unknown"


def iter_document_units(doc: Dict) -> Iterable[Dict]:
    if "pages" in doc:
        for page in doc["pages"]:
            yield {
                "unit_type": "page",
                "unit_number": page.get("page_number"),
                "text": page.get("text", ""),
            }
    elif "sheets" in doc:
        for sheet in doc["sheets"]:
            rows = sheet.get("rows", [])
            row_lines = []
            for row in rows:
                values = row.get("values", {})
                # Keep only non-empty values to avoid noisy chunks.
                compact = {k: v for k, v in values.items() if str(v).strip()}
                if compact:
                    row_lines.append(json.dumps(compact, ensure_ascii=False))
            yield {
                "unit_type": "sheet",
                "unit_number": sheet.get("sheet_name"),
                "text": "\n".join(row_lines),
            }


def build_chunks_for_document(
    doc: Dict, chunk_size_words: int, overlap_words: int
) -> List[Dict]:
    output_doc_id = doc.get("document_id", "")
    source_doc_id = doc.get("source_document_id", output_doc_id)
    framework = doc.get("framework", "")
    country = doc.get("country", "")
    source_type = doc.get("source_type", "")
    is_official = doc.get("is_official", "")
    relative_path = doc.get("relative_path", "")

    chunks: List[Dict] = []
    for unit in iter_document_units(doc):
        unit_text = normalize_text(unit.get("text", ""))
        if not unit_text:
            continue
        unit_chunks = chunk_text_by_words(unit_text, chunk_size_words, overlap_words)
        for i, (chunk_text, word_start, word_end) in enumerate(unit_chunks, start=1):
            chunk_id = f"{output_doc_id}__{unit['unit_type']}_{unit['unit_number']}__chunk_{i:04d}"
            chunks.append(
                {
                    "chunk_id": chunk_id,
                    "document_id": output_doc_id,
                    "source_document_id": source_doc_id,
                    "framework": framework,
                    "country": country,
                    "source_type": source_type,
                    "is_official": is_official,
                    "relative_path": relative_path,
                    "unit_type": unit["unit_type"],
                    "unit_number": unit["unit_number"],
                    "chunk_index_in_unit": i,
                    "word_start": word_start,
                    "word_end": word_end,
                    "word_count": len(tokenize_words(chunk_text)),
                    "language_hint": infer_language_hint(chunk_text),
                    "text": chunk_text,
                }
            )
    return chunks


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Normalize and chunk extracted document JSON files."
    )
    parser.add_argument(
        "--input-dir",
        default="processed/text",
        help="Directory containing extracted JSON files.",
    )
    parser.add_argument(
        "--output-dir",
        default="processed/chunks",
        help="Directory where chunk JSONL files are written.",
    )
    parser.add_argument(
        "--report",
        default="processed/chunk_report.csv",
        help="Chunking report CSV path.",
    )
    parser.add_argument(
        "--chunk-size-words",
        type=int,
        default=700,
        help="Max words per chunk.",
    )
    parser.add_argument(
        "--overlap-words",
        type=int,
        default=100,
        help="Overlap words between consecutive chunks.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Optional file limit for smoke tests. 0 means all files.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    input_dir = Path(args.input_dir)
    output_dir = Path(args.output_dir)
    report_path = Path(args.report)

    if not input_dir.exists():
        raise FileNotFoundError(f"Input directory not found: {input_dir}")

    output_dir.mkdir(parents=True, exist_ok=True)
    report_path.parent.mkdir(parents=True, exist_ok=True)

    files = sorted(input_dir.glob("*.json"))
    if args.limit > 0:
        files = files[: args.limit]
    if not files:
        raise ValueError(f"No JSON files found in {input_dir}")

    report_rows = []
    total_chunks = 0
    for fp in files:
        try:
            doc = json.loads(fp.read_text(encoding="utf-8"))
            chunks = build_chunks_for_document(
                doc=doc,
                chunk_size_words=args.chunk_size_words,
                overlap_words=args.overlap_words,
            )
            out_file = output_dir / f"{doc.get('document_id', fp.stem)}.jsonl"
            with out_file.open("w", encoding="utf-8") as f:
                for c in chunks:
                    f.write(json.dumps(c, ensure_ascii=False) + "\n")

            total_chunks += len(chunks)
            report_rows.append(
                {
                    "document_id": doc.get("document_id", fp.stem),
                    "source_document_id": doc.get("source_document_id", ""),
                    "input_file": str(fp),
                    "output_file": str(out_file),
                    "chunk_count": len(chunks),
                    "status": "success",
                    "error": "",
                }
            )
            print(f"[success] {fp.name} -> {out_file.name} ({len(chunks)} chunks)")
        except Exception as exc:
            report_rows.append(
                {
                    "document_id": fp.stem,
                    "source_document_id": "",
                    "input_file": str(fp),
                    "output_file": "",
                    "chunk_count": 0,
                    "status": "failed",
                    "error": str(exc),
                }
            )
            print(f"[failed] {fp.name} -> {exc}")

    fields = [
        "document_id",
        "source_document_id",
        "input_file",
        "output_file",
        "chunk_count",
        "status",
        "error",
    ]
    with report_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(report_rows)

    success = sum(1 for x in report_rows if x["status"] == "success")
    failed = sum(1 for x in report_rows if x["status"] == "failed")
    print(
        f"\nDone. Files: {len(report_rows)}, Success: {success}, Failed: {failed}, Total chunks: {total_chunks}"
    )
    print(f"Report: {report_path}")


if __name__ == "__main__":
    main()
