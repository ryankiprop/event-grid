from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt
from ..utils.cloudinary import upload_image

class ImageUploadResource(Resource):
    @jwt_required()
    def post(self):
        claims = get_jwt()
        role = claims.get('role')
        if role not in ('organizer', 'admin'):
            return {"message": "Forbidden"}, 403
        if 'image' not in request.files:
            return {"message": "No image provided"}, 400
        file = request.files['image']
        if not file or file.filename == '':
            return {"message": "Empty file"}, 400
        url = upload_image(file)
        if not url:
            return {"message": "Upload not configured or failed"}, 400
        return {"url": url}, 201