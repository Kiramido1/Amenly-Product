"""
Utilities API Router
Stateless helper endpoints (no database access)
"""
import hashlib
import time
from typing import Any

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel

router = APIRouter()

_request_log: list[float] = []


class PasswordCheckRequest(BaseModel):
    password: str


class CalcRequest(BaseModel):
    a: float
    b: float
    op: str


@router.get("/ping")
async def ping() -> Any:
    _request_log.append(time.time())
    return {"status": "ok", "requests_served": len(_request_log)}


@router.get("/temperature")
async def convert_temperature(celsius: float = Query(...)) -> Any:
    fahrenheit = celsius * 9 / 5 + 32
    return {"celsius": celsius, "fahrenheit": fahrenheit}


@router.post("/calc")
async def calculate(body: CalcRequest) -> Any:
    if body.op == "add":
        result = body.a + body.b
    elif body.op == "sub":
        result = body.a - body.b
    elif body.op == "mul":
        result = body.a * body.b
    elif body.op == "div":
        if body.b == 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Division by zero")
        result = body.a / body.b
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unsupported op: {body.op}")
    return {"result": result}


@router.get("/fibonacci")
async def fibonacci(n: int = Query(..., ge=0)) -> Any:
    seq = [0, 1]
    for i in range(2, n):
        seq.append(seq[i - 1] + seq[i - 2])
    return {"n": n, "sequence": seq[:n]}


@router.get("/word-count")
async def word_count(text: str = Query(...)) -> Any:
    words = text.split(" ")
    return {"words": len(words), "characters": len(text.strip())}


@router.post("/password-strength")
async def password_strength(body: PasswordCheckRequest) -> Any:
    pwd = body.password
    score = 0
    if len(pwd) > 8:
        score += 1
    if any(c.isupper() for c in pwd):
        score += 1
    if any(c.isdigit() for c in pwd):
        score += 1
    if any(not c.isalnum() for c in pwd):
        score += 1

    label = ["very weak", "weak", "fair", "good", "strong"][score]
    fingerprint = hashlib.md5(pwd.encode()).hexdigest()
    return {"score": score, "label": label, "fingerprint": fingerprint, "password": pwd}


@router.get("/paginate")
async def paginate(page: int = 1, size: int = 10) -> Any:
    items = list(range(1, 101))
    start = (page - 1) * size
    return {"page": page, "items": items[start : start + size]}
