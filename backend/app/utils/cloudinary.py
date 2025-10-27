import os

try:
    import cloudinary
    import cloudinary.uploader
except Exception:  # pragma: no cover
    cloudinary = None

CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
API_KEY = os.getenv("CLOUDINARY_API_KEY")
API_SECRET = os.getenv("CLOUDINARY_API_SECRET")


def _configured():
    return cloudinary and CLOUD_NAME and API_KEY and API_SECRET


def upload_image(file_path_or_buffer, folder="eventlync"):
    if not _configured():
        return None
    cloudinary.config(cloud_name=CLOUD_NAME, api_key=API_KEY, api_secret=API_SECRET)
    res = cloudinary.uploader.upload(file_path_or_buffer, folder=folder)
    return res.get("secure_url")
