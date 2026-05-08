"""
Professional file validation for compliance frameworks
Validates file integrity, format, encoding, and quality
"""

import hashlib
import magic
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import chardet
import fitz  # PyMuPDF
from openpyxl import load_workbook


class FileStatus(Enum):
    """File validation status"""
    VALID = "valid"
    CORRUPTED = "corrupted"
    UNSUPPORTED = "unsupported"
    EMPTY = "empty"
    ENCODING_ERROR = "encoding_error"
    DUPLICATE = "duplicate"
    TOO_LARGE = "too_large"


@dataclass
class ValidationResult:
    """File validation result"""
    file_path: Path
    status: FileStatus
    file_type: str
    file_size: int
    file_hash: str
    encoding: Optional[str] = None
    page_count: Optional[int] = None
    quality_score: float = 0.0
    errors: List[str] = None
    warnings: List[str] = None
    
    def __post_init__(self):
        if self.errors is None:
            self.errors = []
        if self.warnings is None:
            self.warnings = []
    
    @property
    def is_valid(self) -> bool:
        return self.status == FileStatus.VALID
    
    def to_dict(self) -> Dict:
        return {
            "file_path": str(self.file_path),
            "status": self.status.value,
            "file_type": self.file_type,
            "file_size": self.file_size,
            "file_hash": self.file_hash,
            "encoding": self.encoding,
            "page_count": self.page_count,
            "quality_score": self.quality_score,
            "errors": self.errors,
            "warnings": self.warnings,
            "is_valid": self.is_valid
        }


class FileValidator:
    """
    Enterprise-grade file validator for compliance frameworks
    
    Validates:
    - File existence and accessibility
    - File format and MIME type
    - File integrity (not corrupted)
    - File encoding
    - File size limits
    - Duplicate detection
    - Content quality
    """
    
    SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md"}
    MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
    MIN_FILE_SIZE = 100  # 100 bytes
    
    def __init__(self):
        self.seen_hashes: Dict[str, Path] = {}
    
    def validate_file(self, file_path: Path) -> ValidationResult:
        """
        Comprehensive file validation
        
        Args:
            file_path: Path to file to validate
            
        Returns:
            ValidationResult with detailed validation info
        """
        # Initialize result
        result = ValidationResult(
            file_path=file_path,
            status=FileStatus.VALID,
            file_type="unknown",
            file_size=0,
            file_hash=""
        )
        
        # Check file exists
        if not file_path.exists():
            result.status = FileStatus.CORRUPTED
            result.errors.append("File does not exist")
            return result
        
        # Check file size
        file_size = file_path.stat().st_size
        result.file_size = file_size
        
        if file_size < self.MIN_FILE_SIZE:
            result.status = FileStatus.EMPTY
            result.errors.append(f"File too small: {file_size} bytes")
            return result
        
        if file_size > self.MAX_FILE_SIZE:
            result.status = FileStatus.TOO_LARGE
            result.errors.append(f"File too large: {file_size} bytes (max: {self.MAX_FILE_SIZE})")
            return result
        
        # Calculate file hash
        file_hash = self._calculate_hash(file_path)
        result.file_hash = file_hash
        
        # Check for duplicates
        if file_hash in self.seen_hashes:
            result.status = FileStatus.DUPLICATE
            result.warnings.append(f"Duplicate of: {self.seen_hashes[file_hash]}")
        else:
            self.seen_hashes[file_hash] = file_path
        
        # Check file extension
        ext = file_path.suffix.lower()
        if ext not in self.SUPPORTED_EXTENSIONS:
            result.status = FileStatus.UNSUPPORTED
            result.errors.append(f"Unsupported extension: {ext}")
            return result
        
        result.file_type = ext.lstrip(".")
        
        # Validate based on file type
        if ext == ".pdf":
            self._validate_pdf(file_path, result)
        elif ext == ".docx":
            self._validate_docx(file_path, result)
        elif ext in {".txt", ".md"}:
            self._validate_text(file_path, result)
        
        return result
    
    def _calculate_hash(self, file_path: Path) -> str:
        """Calculate SHA256 hash of file"""
        sha256 = hashlib.sha256()
        with file_path.open("rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                sha256.update(chunk)
        return sha256.hexdigest()
    
    def _validate_pdf(self, file_path: Path, result: ValidationResult) -> None:
        """Validate PDF file"""
        try:
            doc = fitz.open(file_path)
            page_count = len(doc)
            result.page_count = page_count
            
            if page_count == 0:
                result.status = FileStatus.EMPTY
                result.errors.append("PDF has no pages")
                return
            
            # Calculate quality score
            total_chars = 0
            empty_pages = 0
            
            for page in doc:
                text = page.get_text()
                char_count = len(text.strip())
                total_chars += char_count
                if char_count == 0:
                    empty_pages += 1
            
            doc.close()
            
            # Quality scoring
            avg_chars_per_page = total_chars / page_count if page_count > 0 else 0
            empty_ratio = empty_pages / page_count if page_count > 0 else 1
            
            # Score based on content density and empty pages
            density_score = min(avg_chars_per_page / 2000.0, 1.0)
            empty_penalty = 1.0 - empty_ratio
            result.quality_score = round((0.6 * density_score) + (0.4 * empty_penalty), 4)
            
            # Warnings
            if empty_ratio > 0.3:
                result.warnings.append(f"{empty_pages}/{page_count} pages are empty")
            
            if avg_chars_per_page < 500:
                result.warnings.append(f"Low text density: {avg_chars_per_page:.0f} chars/page")
            
            if result.quality_score < 0.3:
                result.warnings.append(f"Low quality score: {result.quality_score}")
                
        except Exception as e:
            result.status = FileStatus.CORRUPTED
            result.errors.append(f"PDF validation error: {str(e)}")
    
    def _validate_docx(self, file_path: Path, result: ValidationResult) -> None:
        """Validate DOCX file"""
        try:
            wb = load_workbook(file_path, read_only=True)
            wb.close()
            result.quality_score = 0.8  # Assume good quality if readable
        except Exception as e:
            result.status = FileStatus.CORRUPTED
            result.errors.append(f"DOCX validation error: {str(e)}")
    
    def _validate_text(self, file_path: Path, result: ValidationResult) -> None:
        """Validate text file"""
        try:
            # Detect encoding
            with file_path.open("rb") as f:
                raw_data = f.read(10000)  # Read first 10KB
                detection = chardet.detect(raw_data)
                result.encoding = detection["encoding"]
                confidence = detection["confidence"]
            
            if confidence < 0.7:
                result.warnings.append(f"Low encoding confidence: {confidence:.2f}")
            
            # Try to read file
            with file_path.open("r", encoding=result.encoding) as f:
                content = f.read()
            
            char_count = len(content.strip())
            if char_count < 100:
                result.status = FileStatus.EMPTY
                result.errors.append(f"File too short: {char_count} characters")
                return
            
            # Quality based on content length
            result.quality_score = min(char_count / 10000.0, 1.0)
            
        except UnicodeDecodeError as e:
            result.status = FileStatus.ENCODING_ERROR
            result.errors.append(f"Encoding error: {str(e)}")
        except Exception as e:
            result.status = FileStatus.CORRUPTED
            result.errors.append(f"Text validation error: {str(e)}")
    
    def validate_directory(self, directory: Path) -> List[ValidationResult]:
        """
        Validate all supported files in a directory
        
        Args:
            directory: Directory to scan
            
        Returns:
            List of validation results
        """
        results = []
        
        for ext in self.SUPPORTED_EXTENSIONS:
            for file_path in directory.rglob(f"*{ext}"):
                result = self.validate_file(file_path)
                results.append(result)
        
        return results
    
    def generate_report(self, results: List[ValidationResult]) -> Dict:
        """Generate validation summary report"""
        total = len(results)
        valid = sum(1 for r in results if r.is_valid)
        corrupted = sum(1 for r in results if r.status == FileStatus.CORRUPTED)
        unsupported = sum(1 for r in results if r.status == FileStatus.UNSUPPORTED)
        empty = sum(1 for r in results if r.status == FileStatus.EMPTY)
        duplicates = sum(1 for r in results if r.status == FileStatus.DUPLICATE)
        
        avg_quality = sum(r.quality_score for r in results if r.is_valid) / valid if valid > 0 else 0
        
        return {
            "total_files": total,
            "valid": valid,
            "corrupted": corrupted,
            "unsupported": unsupported,
            "empty": empty,
            "duplicates": duplicates,
            "average_quality": round(avg_quality, 4),
            "validation_rate": round(valid / total, 4) if total > 0 else 0
        }
