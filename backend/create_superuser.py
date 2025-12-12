import os
import sys
import django

# Django setup
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Create superuser if it doesn't exist
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser(
        username='admin',
        email='admin@musicdown.com',
        password='adminpassword'
    )
    print("✅ Superuser created successfully!")
    print("Username: admin")
    print("Password: adminpassword")
else:
    print("ℹ️  Superuser 'admin' already exists")
    print("Username: admin")
    print("Password: adminpassword")
