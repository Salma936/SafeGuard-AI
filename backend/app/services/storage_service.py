import os
import hashlib
import uuid
from datetime import datetime
from backend.app.config import settings

try:
    from google.cloud import storage
    GCS_AVAILABLE = True
except ImportError:
    GCS_AVAILABLE = False

class StorageService:
    def __init__(self):
        self.bucket_name = settings.GOOGLE_CLOUD_STORAGE_BUCKET
        self.local_dir = settings.LOCAL_UPLOAD_DIR
        os.makedirs(self.local_dir, exist_ok=True)
        
        self.gcs_client = None
        if GCS_AVAILABLE and os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
            try:
                self.gcs_client = storage.Client()
            except Exception as e:
                print(f"[StorageService] Warning: Failed to initialize GCS client: {e}")

    def calculate_sha256(self, content_bytes: bytes) -> str:
        """Calculate SHA-256 cryptographic hash of evidence data."""
        return hashlib.sha256(content_bytes).hexdigest()

    def store_evidence(self, incident_id: str, evidence_id: str, filename: str, content_bytes: bytes) -> dict:
        """
        Store private evidence file to GCS bucket or local disk.
        Returns evidence preservation metadata.
        """
        sha256_hash = self.calculate_sha256(content_bytes)
        relative_path = f"incidents/{incident_id}/{evidence_id}/{filename}"
        
        storage_type = "LOCAL"
        location_uri = ""

        # Attempt Google Cloud Storage upload if client is initialized
        if self.gcs_client:
            try:
                bucket = self.gcs_client.bucket(self.bucket_name)
                blob = bucket.blob(relative_path)
                blob.upload_from_string(content_bytes)
                location_uri = f"gs://{self.bucket_name}/{relative_path}"
                storage_type = "GCS"
            except Exception as err:
                print(f"[StorageService] GCS upload failed, falling back to local disk: {err}")

        if storage_type == "LOCAL":
            local_path = os.path.join(self.local_dir, incident_id, evidence_id, filename)
            os.makedirs(os.path.dirname(local_path), exist_ok=True)
            with open(local_path, "wb") as f:
                f.write(content_bytes)
            location_uri = f"file://{local_path}"

        return {
            "evidence_id": evidence_id,
            "incident_id": incident_id,
            "filename": filename,
            "content_location": location_uri,
            "sha256_hash": sha256_hash,
            "storage_type": storage_type,
            "file_size": len(content_bytes),
            "created_at": datetime.utcnow().isoformat() + "Z",
            "preservation_statement": "Evidence preservation record created with SHA-256 integrity digest."
        }

storage_service = StorageService()
