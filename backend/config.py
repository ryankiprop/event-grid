import os
from urllib.parse import parse_qs, urlparse

from dotenv import load_dotenv

load_dotenv()


class Config:
    # Security
    SECRET_KEY = os.environ.get("SECRET_KEY") or "dev-secret-key"

    # Database configuration for Neon PostgreSQL
    @property
    def SQLALCHEMY_DATABASE_URI(self):
        database_url = os.environ.get("DATABASE_URL")
        if database_url:
            return database_url

        # Use standard PostgreSQL URL format - SQLAlchemy will auto-detect the best driver
        return "postgresql://neondb_owner:npg_oVhL5pN9BblI@ep-withered-resonance-adm7679h-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Configure PostgreSQL-specific settings for Neon
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
        "pool_size": 5,
        "max_overflow": 10,
        "connect_args": {
            "connect_timeout": 5,
            "sslmode": "require",
            "keepalives": 1,
            "keepalives_idle": 30,
            "keepalives_interval": 10,
            "keepalives_count": 5,
        },
        "future": True,  # Use SQLAlchemy 2.0 style
        "echo": False,  # Set to True for SQL debugging
        "poolclass": None,  # Let SQLAlchemy choose the best pool
    }

    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
    if not JWT_SECRET_KEY:
        raise ValueError("JWT_SECRET_KEY environment variable is required")
    JWT_ACCESS_TOKEN_EXPIRES = int(
        os.getenv("JWT_ACCESS_TOKEN_EXPIRES", 604800)
    )  # 7 days

    # Cloudinary Configuration
    CLOUDINARY_CLOUD_NAME = os.environ.get("CLOUDINARY_CLOUD_NAME")
    CLOUDINARY_API_KEY = os.environ.get("CLOUDINARY_API_KEY")
    CLOUDINARY_API_SECRET = os.environ.get("CLOUDINARY_API_SECRET")

    # Email Configuration
    SENDGRID_API_KEY = os.environ.get("SENDGRID_API_KEY")
    MAIL_DEFAULT_SENDER = os.environ.get("MAIL_DEFAULT_SENDER", "noreply@eventlync.com")

    # Frontend Configuration
    FRONTEND_URL = os.getenv("FRONTEND_URL", "https://event-grid-gilt.vercel.app/")

    # File Uploads
    UPLOAD_FOLDER = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads"
    )
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max upload size
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}

    # CORS Configuration
    cors_origins_str = os.getenv("CORS_ORIGINS")
    if not cors_origins_str:
        CORS_ORIGINS = [FRONTEND_URL]
    else:
        CORS_ORIGINS = [origin.strip() for origin in cors_origins_str.split(",")]

    # Session Configuration
    SESSION_COOKIE_SECURE = os.getenv("FLASK_ENV") == "production"
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"

    # Logging
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

    # Environment
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    DEBUG = FLASK_ENV == "development"

    # API Configuration
    API_PREFIX = "/api/v1"
    SWAGGER_UI_DOC_EXPANSION = "list"

    # Rate Limiting
    RATELIMIT_DEFAULT = "200 per day;50 per hour"
