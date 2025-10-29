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


def upload_image(file, folder="eventgrid"):
    """
    Upload a file to Cloudinary.
    
    Args:
        file: A file-like object (from request.files) or a file path
        folder: The folder in Cloudinary to upload to
        
    Returns:
        str: The secure URL of the uploaded file, or None if upload failed
    """
    if not _configured():
        current_app.logger.error("Cloudinary not configured")
        return None
        
    try:
        cloudinary.config(cloud_name=CLOUD_NAME, api_key=API_KEY, api_secret=API_SECRET)
        
        # Handle both file paths and file-like objects
        if hasattr(file, 'read'):  # It's a file-like object
            result = cloudinary.uploader.upload(file, folder=folder)
        else:  # Assume it's a file path
            with open(file, 'rb') as f:
                result = cloudinary.uploader.upload(f, folder=folder)
                
        current_app.logger.info(f"Successfully uploaded image to {result.get('secure_url')}")
        return result.get('secure_url')
        
    except Exception as e:
        current_app.logger.exception("Failed to upload image to Cloudinary")
        return None
