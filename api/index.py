import sys
import os

# Tambahkan folder backend ke path Python Vercel
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from main import app