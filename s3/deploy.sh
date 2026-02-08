#!/usr/bin/env bash
set -euo pipefail

# deploy.sh -- Build and deploy Violetta to an S3 bucket for static hosting.
#
# Usage:
#   ./s3/deploy.sh <bucket-name> [--region us-east-1] [--profile default]
#
# Prerequisites:
#   - aws CLI configured with appropriate credentials
#   - Node.js and npm installed
#   - graph.json in the standard data directory

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
STATIC_DIR="${STATIC_DIR:-$HOME/Violetta-Opera-Graph-Relationship-Maps}"
DIST_DIR="$REPO_DIR/web/dist"

BUCKET=""
REGION="us-east-1"
PROFILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --region) REGION="$2"; shift 2 ;;
    --profile) PROFILE="$2"; shift 2 ;;
    *) BUCKET="$1"; shift ;;
  esac
done

if [[ -z "$BUCKET" ]]; then
  echo "Usage: $0 <bucket-name> [--region us-east-1] [--profile default]"
  exit 1
fi

AWS_OPTS=()
if [[ -n "$PROFILE" ]]; then
  AWS_OPTS+=(--profile "$PROFILE")
fi

echo "==> Building web UI..."
(cd "$REPO_DIR/web" && VITE_DATA_DIR="$STATIC_DIR/data/processed" npm run build)

echo "==> Bundling graph data into dist..."
DATA_PROCESSED="$STATIC_DIR/data/processed"
for f in graph.json projections.json; do
  if [[ -f "$DATA_PROCESSED/$f" ]]; then
    cp "$DATA_PROCESSED/$f" "$DIST_DIR/$f"
    echo "   Copied $f"
  fi
done

echo "==> Configuring S3 bucket for website hosting..."
aws s3api create-bucket \
  --bucket "$BUCKET" \
  --region "$REGION" \
  ${REGION:+$([ "$REGION" != "us-east-1" ] && echo "--create-bucket-configuration LocationConstraint=$REGION" || true)} \
  "${AWS_OPTS[@]}" 2>/dev/null || true

aws s3api put-bucket-website \
  --bucket "$BUCKET" \
  --website-configuration '{
    "IndexDocument": {"Suffix": "index.html"},
    "ErrorDocument": {"Key": "index.html"}
  }' \
  "${AWS_OPTS[@]}"

# Set public read access
aws s3api put-public-access-block \
  --bucket "$BUCKET" \
  --public-access-block-configuration '{
    "BlockPublicAcls": false,
    "IgnorePublicAcls": false,
    "BlockPublicPolicy": false,
    "RestrictPublicBuckets": false
  }' \
  "${AWS_OPTS[@]}"

aws s3api put-bucket-policy \
  --bucket "$BUCKET" \
  --policy "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [{
      \"Sid\": \"PublicReadGetObject\",
      \"Effect\": \"Allow\",
      \"Principal\": \"*\",
      \"Action\": \"s3:GetObject\",
      \"Resource\": \"arn:aws:s3:::$BUCKET/*\"
    }]
  }" \
  "${AWS_OPTS[@]}"

echo "==> Uploading to S3..."
aws s3 sync "$DIST_DIR" "s3://$BUCKET" \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "*.html" --exclude "*.json" \
  "${AWS_OPTS[@]}"

# HTML and JSON with shorter cache
aws s3 sync "$DIST_DIR" "s3://$BUCKET" \
  --cache-control "public, max-age=300" \
  --exclude "*" --include "*.html" --include "*.json" \
  "${AWS_OPTS[@]}"

WEBSITE_URL="http://$BUCKET.s3-website-$REGION.amazonaws.com"
echo ""
echo "==> Deployment complete!"
echo "    Website: $WEBSITE_URL"
echo ""
echo "    To use a custom domain, set up CloudFront or point a CNAME to:"
echo "    $BUCKET.s3-website-$REGION.amazonaws.com"
