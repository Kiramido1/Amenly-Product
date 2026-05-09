import argparse
import csv
import json
import re
from pathlib import Path
from typing import Dict, Iterable, List

from langchain_text_splitters import RecursiveCharacterTextSplitter


def normalize_text(text: str) -> str:
    text = text.replace("\u00a0", " ")
    text = text.replace("\r", "\n")
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def infer_language_hint(text: str) -> str:
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
                compact = {k: v for k, v in values.items() if str(v).strip()}
                if compact:
                    row_lines.append(json.dumps(compact, ensure_ascii=False))
            yield {
                "unit_type": "sheet",
                "unit_number": sheet.get("sheet_name"),
                "text": "\n".join(row_lines),
            }


def build_splitter(chunk_size: int, chunk_overlap: int, encoding_name: str):
    # Token-aware splitter using tiktoken through LangChain.
    return RecursiveCharacterTextSplitter.from_tiktoken_encoder(
        encoding_name=encoding_name,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
    )


def build_chunks_for_document(
    doc: Dict, splitter: RecursiveCharacterTextSplitter
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

        pieces = splitter.split_text(unit_text)
        for i, chunk_text in enumerate(pieces, start=1):
            chunk_text = chunk_text.strip()
            if not chunk_text:
                continue
            chunk_id = (
                f"{output_doc_id}__{unit['unit_type']}_{unit['unit_number']}__chunk_{i:04d}"
            )
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
                    "char_count": len(chunk_text),
                    "language_hint": infer_language_hint(chunk_text),
                    "text": chunk_text,
                }
            )
    return chunks


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Normalize and chunk extracted JSON using LangChain token-aware splitter."
    )
    parser.add_argument("--input-dir", default="processed/text")
    parser.add_argument("--output-dir", default="processed/chunks_langchain")
    parser.add_argument("--report", default="processed/chunk_report_langchain.csv")
    parser.add_argument(
        "--chunk-size",
        type=int,
        default=900,
        help="Chunk size in tokens.",
    )
    parser.add_argument(
        "--chunk-overlap",
        type=int,
        default=120,
        help="Chunk overlap in tokens.",
    )
    parser.add_argument(
        "--encoding-name",
        default="cl100k_base",
        help="tiktoken encoding name.",
    )
    parser.add_argument("--limit", type=int, default=0)
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

    splitter = build_splitter(
        chunk_size=args.chunk_size,
        chunk_overlap=args.chunk_overlap,
        encoding_name=args.encoding_name,
    )

    report_rows = []
    total_chunks = 0
    for fp in files:
        try:
            doc = json.loads(fp.read_text(encoding="utf-8"))
            chunks = build_chunks_for_document(doc, splitter)
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
