from flask import current_app, request
from flask_jwt_extended import get_jwt, jwt_required
from flask_restful import Resource

from ..extensions import db
from ..models import Media
from ..utils.cloudinary import upload_image


class ImageUploadResource(Resource):
    @jwt_required()
    def post(self):
        try:
            claims = get_jwt()
            user_id = claims.get("sub")
            role = claims.get("role")
            
            # Verify user has permission to upload
            if role not in ("organizer", "admin"):
                return {"message": "Forbidden"}, 403
                
            # Check if the post request has the file part
            if 'image' not in request.files:
                return {"message": "No image part in the request"}, 400
                
            file = request.files['image']
            
            # If user does not select file, browser also
            # submit an empty part without filename
            if file.filename == '':
                return {"message": "No selected file"}, 400
                
            if not file:
                return {"message": "Invalid file"}, 400
                
            # Upload to Cloudinary
            url = upload_image(file)
            
            if not url:
                return {"message": "Failed to upload image to Cloudinary"}, 500
                
            # Save to our database
            media = Media(
                user_id=user_id,
                url=url,
                content_type=file.content_type,
                file_size=file.content_length or 0
            )
            db.session.add(media)
            db.session.commit()
            
            current_app.logger.info(f"Successfully uploaded image: {url}")
            return {
                "id": str(media.id),
                "url": url,
                "content_type": media.content_type,
                "created_at": media.created_at.isoformat()
            }, 201
            
        except Exception as e:
            current_app.logger.exception("Image upload failed")
            db.session.rollback()
            return {"message": f"Failed to process image: {str(e)}"}, 500
