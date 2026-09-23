import boto3
from botocore.client import Config
from backend.src.config import settings
from backend.src.contexts.inventory.domain.ports import IObjectStoragePort


class MinioStorageAdapter(IObjectStoragePort):
    """Adaptador de infraestructura para almacenamiento de objetos MinIO (compatible con AWS S3).
    Gestiona evidencias originales y recortes de productos con URLs prefirmadas."""

    def __init__(self):
        self.endpoint = settings.S3_ENDPOINT
        self.access_key = settings.S3_ACCESS_KEY
        self.secret_key = settings.S3_SECRET_KEY
        self._s3_client = boto3.client(
            "s3",
            endpoint_url=self.endpoint,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            config=Config(signature_version="s3v4"),
            region_name="us-east-1",
        )

    async def generate_presigned_upload_url(self, bucket: str, key: str, expires_in: int = 900) -> str:
        return self._s3_client.generate_presigned_url(
            "put_object",
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=expires_in,
        )

    async def generate_presigned_download_url(self, bucket: str, key: str, expires_in: int = 900) -> str:
        return self._s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=expires_in,
        )

    async def upload_bytes(self, bucket: str, key: str, data: bytes, content_type: str = "image/webp") -> str:
        self._s3_client.put_object(
            Bucket=bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
        )
        return key

    async def download_bytes(self, bucket: str, key: str) -> bytes:
        response = self._s3_client.get_object(Bucket=bucket, Key=key)
        return response["Body"].read()
