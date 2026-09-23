#!/bin/sh
# Inicialización de buckets en MinIO para desarrollo local

echo "Configurando alias de MinIO local..."
mc alias set myminio http://minio:9000 minio_admin minio_secret_password

echo "Creando bucket raw-captures..."
mc mb myminio/raw-captures --ignore-existing

echo "Creando bucket crops..."
mc mb myminio/crops --ignore-existing

echo "Configurando política de retención y privacidad..."
# Buckets totalmente privados (sin acceso anónimo)
mc anonymous set none myminio/raw-captures
mc anonymous set none myminio/crops

echo "MinIO configurado con éxito."
