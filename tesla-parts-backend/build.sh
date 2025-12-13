#!/bin/bash
# Render build script

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Creating static directory if not exists..."
mkdir -p static/images

echo "Seeding categories..."
python seed_categories.py

echo "Seeding pages..."
python seed_pages.py

echo "Build completed successfully!"
