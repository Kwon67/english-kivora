import os
import tempfile
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from faster_whisper import WhisperModel

app = FastAPI(title="Kivora Speech Worker")

_model: Optional[WhisperModel] = None


def get_env(name: str, default: str) -> str:
    value = os.getenv(name)
    return value.strip() if value and value.strip() else default


def get_model() -> WhisperModel:
    global _model

    if _model is None:
        _model = WhisperModel(
            get_env("WHISPER_MODEL", "base.en"),
            device=get_env("WHISPER_DEVICE", "cpu"),
            compute_type=get_env("WHISPER_COMPUTE_TYPE", "int8"),
        )

    return _model


@app.get("/health")
def health() -> dict[str, str]:
    return {"ok": "true"}


@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)) -> dict[str, object]:
    if not audio.filename:
        raise HTTPException(status_code=400, detail="Audio filename is required.")

    suffix = Path(audio.filename).suffix or ".webm"
    temp_path = ""

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_path = temp_file.name
            while chunk := await audio.read(1024 * 1024):
                temp_file.write(chunk)

        if os.path.getsize(temp_path) == 0:
            raise HTTPException(status_code=400, detail="Audio file is empty.")

        model = get_model()
        segments, info = model.transcribe(
            temp_path,
            language="en",
            task="transcribe",
            beam_size=5,
            vad_filter=True,
            condition_on_previous_text=False,
        )

        text = " ".join(segment.text.strip() for segment in list(segments)).strip()

        return {
            "text": text,
            "language": info.language or "en",
            "languageProbability": float(info.language_probability or 0),
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {exc}") from exc
    finally:
        await audio.close()
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
