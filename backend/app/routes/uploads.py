from flask import current_app, request, jsonify
from flask_jwt_extended import get_jwt, jwt_required

from ..extensions import db
from ..models.media import Media
from ..utils.cloudinary import upload_image

def init_app(app):
    @app.route('/api/uploads/image', methods=['POST'])
    @jwt_required()
    def upload_image_route():
        try:
            claims = get_jwt()
            user_id = claims.get("sub")
            role = claims.get("role")
            
            # Verify user has permission to upload
            if role not in ("organizer", "admin"):
                return jsonify({"message": "Forbidden"}), 403
                
            # Check if the post request has the file part
            if 'image' not in request.files:
                return jsonify({"message": "No image part in the request"}), 400
                
            file = request.files['image']
            
            # If user does not select file, browser also
            # submit an empty part without filename
            if file.filename == '':
                return jsonify({"message": "No selected file"}), 400
                
            if not file:
                return jsonify({"message": "Invalid file"}), 400
                
            # Upload to Cloudinary
            url = upload_image(file)
            
            if not url:
                return jsonify({"message": "Failed to upload image to Cloudinary"}), 500
                
            # Save to our database
            media = Media(
                user_id=user_id,
                url=url,
                content_type=file.content_type,
                file_size=file.content_length or 0
            )
            db.session.add(media)
            db.session.commit()
            
            return jsonify({
                "message": "Image uploaded successfully",
                "url": url,
                "media_id": str(media.id)
            }), 201
            
        except Exception as e:
            current_app.logger.error(f"Error uploading image: {str(e)}")
            return jsonify({"message": "An error occurred while uploading the image"}), 500
    
    return app
