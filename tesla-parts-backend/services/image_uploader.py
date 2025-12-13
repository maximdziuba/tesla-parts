import os
import uuid
from pathlib import Path
from fastapi import UploadFile
from typing import Optional

class ImageUploader:
    def __init__(self):
        self.base_url = os.getenv("BACKEND_URL", "http://127.0.0.1:8000")
        self.cloudinary_cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
        self.cloudinary_api_key = os.getenv("CLOUDINARY_API_KEY")
        self.cloudinary_api_secret = os.getenv("CLOUDINARY_API_SECRET")
        
        # Check if Cloudinary is configured
        self.use_cloudinary = all([
            self.cloudinary_cloud_name,
            self.cloudinary_api_key,
            self.cloudinary_api_secret
        ])
        
        if self.use_cloudinary:
            try:
                import cloudinary
                import cloudinary.uploader
                cloudinary.config(
                    cloud_name=self.cloudinary_cloud_name,
                    api_key=self.cloudinary_api_key,
                    api_secret=self.cloudinary_api_secret
                )
            except ImportError:
                self.use_cloudinary = False
    
    async def upload_image(self, file: UploadFile, folder: str = "tesla-parts") -> Optional[str]:
        """
        Upload an image file and return its URL.
        
        Args:
            file: FastAPI UploadFile object
            folder: Folder path for organization (e.g., "tesla-parts/products")
        
        Returns:
            URL string of the uploaded image, or None if upload fails
        """
        if not file.filename:
            return None
        
        try:
            if self.use_cloudinary:
                return await self._upload_to_cloudinary(file, folder)
            else:
                return await self._upload_to_local(file, folder)
        except Exception as e:
            print(f"Error uploading image: {e}")
            return None
    
    async def _upload_to_cloudinary(self, file: UploadFile, folder: str) -> str:
        """Upload image to Cloudinary."""
        import cloudinary.uploader
        
        # Read file content
        contents = await file.read()
        
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            contents,
            folder=folder,
            public_id=file.filename.rsplit('.', 1)[0] if '.' in file.filename else file.filename
        )
        
        return result.get("secure_url") or result.get("url")
    
    async def _upload_to_local(self, file: UploadFile, folder: str) -> str:
        """Upload image to local storage."""
        # Create directory structure
        upload_dir = Path("static") / "images" / folder
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        file_ext = Path(file.filename).suffix if file.filename else ".jpg"
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = upload_dir / unique_filename
        
        # Save file
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
        
        # Return URL
        # Remove leading slash from base_url if present, and ensure folder path is correct
        base_url = self.base_url.rstrip("/")
        file_location = f"static/images/{folder}/{unique_filename}"
        return f"{base_url}/{file_location}"

# Create singleton instance
image_uploader = ImageUploader()

