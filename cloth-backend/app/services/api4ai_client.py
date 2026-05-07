import os
import requests
from dotenv import load_dotenv

load_dotenv()

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
RAPIDAPI_HOST = os.getenv("RAPIDAPI_HOST")

API_URL = f"https://{RAPIDAPI_HOST}/results"


def generate_virtual_tryon(person_image_bytes: bytes, apparel_image_url: str):
    if not RAPIDAPI_KEY or not RAPIDAPI_HOST:
        raise Exception("RapidAPI key or host is missing in .env file")

    files = {
        "image": ("person.png", person_image_bytes, "image/png"),
    }

    data = {
        "url-apparel": apparel_image_url,
    }

    headers = {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST,
    }

    response = requests.post(
        API_URL,
        headers=headers,
        files=files,
        data=data,
        timeout=120,
    )

    if response.status_code != 200:
        raise Exception(response.text)

    return response.json()