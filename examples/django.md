# Django Setup Example

**Quick setup for Django projects - Copy and customize**

---

# Setup Claude Code Documentation for [Django Project Name]

## Project Context

**Project Type**: Django Application
**Tech Stack**:
- Django 4.x / 5.x
- Python 3.10+
- [Database: PostgreSQL / MySQL / SQLite]
- [API: Django REST Framework]
- [Frontend: Django Templates / React / HTMX]
- [Testing: pytest / unittest]

**Main Features**: [Description]

## Use Universal Setup

First, run the universal setup from `UNIVERSAL_SETUP.md`, then customize with Django-specific content below.

## Django-Specific Content

### ARCHITECTURE_MAP.md

```markdown
## Core Directories (Django Project)

myproject/
├── manage.py             # Django CLI
├── myproject/            # Project config
│   ├── settings.py       # Configuration
│   ├── urls.py           # Root URL config
│   ├── wsgi.py           # WSGI config
│   └── asgi.py           # ASGI config
├── apps/                 # Django apps
│   ├── users/
│   │   ├── models.py     # Database models
│   │   ├── views.py      # View logic
│   │   ├── serializers.py # DRF serializers
│   │   ├── urls.py       # App URLs
│   │   ├── admin.py      # Admin config
│   │   ├── tests.py      # Tests
│   │   └── migrations/   # Database migrations
│   └── products/
├── static/               # Static files (CSS, JS)
├── media/                # User uploads
├── templates/            # HTML templates
└── requirements.txt      # Python dependencies

## Key Patterns

### Django MVT (Model-View-Template)
- Models define database schema (ORM)
- Views handle business logic
- Templates render HTML
- URLs route requests to views

### Django REST Framework
- Serializers validate/transform data
- ViewSets for CRUD operations
- Routers auto-generate URLs
- Authentication & permissions

### Database
- Migrations track schema changes
- ORM queries replace raw SQL
- Relationships: ForeignKey, ManyToMany
- Custom managers for reusable queries
```

### COMMON_MISTAKES.md

```markdown
## Top 5 Django Mistakes

### 1. N+1 Query Problem

**Symptom**: Slow database performance, hundreds of queries

**Anti-pattern:**
```python
# views.py
def user_list(request):
    users = User.objects.all()
    # ❌ Triggers 1 query per user for posts!
    return render(request, 'users.html', {'users': users})

# Template:
# {% for user in users %}
#   {{ user.posts.count }}  <!-- N+1 queries! -->
# {% endfor %}
```

**Correct:**
```python
def user_list(request):
    users = User.objects.prefetch_related('posts').all()
    # ✅ 2 queries total (users + all posts)
    return render(request, 'users.html', {'users': users})

# Or with select_related for ForeignKey:
posts = Post.objects.select_related('author').all()
```

### 2. Not Using get_object_or_404

**Anti-pattern:**
```python
def user_detail(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        raise Http404("User not found")  # ❌ Verbose
    return render(request, 'user.html', {'user': user})
```

**Correct:**
```python
from django.shortcuts import get_object_or_404

def user_detail(request, user_id):
    user = get_object_or_404(User, id=user_id)  # ✅ Clean
    return render(request, 'user.html', {'user': user})
```

### 3. Hardcoding SECRET_KEY and Credentials

**Anti-pattern:**
```python
# settings.py
SECRET_KEY = 'django-insecure-hardcoded-key-123'  # ❌ Exposed in git!
DEBUG = True  # ❌ In production!

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'mydb',
        'USER': 'postgres',
        'PASSWORD': 'password123',  # ❌ Hardcoded!
    }
}
```

**Correct:**
```python
import os
from pathlib import Path

SECRET_KEY = os.environ.get('SECRET_KEY')
DEBUG = os.environ.get('DEBUG', 'False') == 'True'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

# Or use python-decouple:
from decouple import config
SECRET_KEY = config('SECRET_KEY')
```

### 4. Not Using Migrations Properly

**Anti-pattern:**
```python
# Editing database directly
# Running migrations without testing
# Merging conflicting migrations incorrectly
# Deleting migration files

# ❌ This breaks your database schema!
```

**Correct:**
```bash
# 1. Make changes to models.py
# 2. Create migration
python manage.py makemigrations

# 3. Review migration file
# 4. Test locally
python manage.py migrate

# 5. Commit migration files to git

# For conflicts:
python manage.py makemigrations --merge
```

### 5. Not Using Django Forms for Validation

**Anti-pattern:**
```python
def create_user(request):
    if request.method == 'POST':
        # ❌ Manual validation - error prone!
        username = request.POST.get('username')
        if len(username) < 3:
            return JsonResponse({'error': 'Too short'})
        if User.objects.filter(username=username).exists():
            return JsonResponse({'error': 'Taken'})
        # ... more validation
```

**Correct:**
```python
from django import forms

class UserForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def clean_username(self):
        username = self.cleaned_data['username']
        if User.objects.filter(username=username).exists():
            raise forms.ValidationError('Username taken')
        return username

def create_user(request):
    if request.method == 'POST':
        form = UserForm(request.POST)
        if form.is_valid():  # ✅ All validation handled
            form.save()
            return redirect('success')
        return render(request, 'form.html', {'form': form})
```
```

### docs/learnings/

Create these Django-specific files:

**models-and-orm.md:**
```markdown
# Django Models and ORM

## Model Definition

```python
from django.db import models
from django.contrib.auth.models import User

class Post(models.Model):
    # Fields
    title = models.CharField(max_length=200)
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_published = models.BooleanField(default=False)

    # Many-to-many
    tags = models.ManyToManyField('Tag', related_name='posts')

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'posts'

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        from django.urls import reverse
        return reverse('post-detail', kwargs={'pk': self.pk})
```

## QuerySet Operations

```python
# Basic queries
Post.objects.all()
Post.objects.filter(is_published=True)
Post.objects.exclude(author__username='admin')
Post.objects.get(id=1)  # Raises DoesNotExist if not found

# Chaining
Post.objects.filter(is_published=True).exclude(title__startswith='Draft')

# Lookups
Post.objects.filter(title__icontains='django')  # Case-insensitive
Post.objects.filter(created_at__gte='2024-01-01')
Post.objects.filter(author__username='john')  # Follow relationships

# Aggregation
from django.db.models import Count, Avg
Post.objects.aggregate(total=Count('id'), avg_views=Avg('views'))

# Annotation
Post.objects.annotate(comment_count=Count('comments'))

# select_related (ForeignKey, OneToOne)
posts = Post.objects.select_related('author').all()
# 1 query with JOIN

# prefetch_related (ManyToMany, reverse ForeignKey)
posts = Post.objects.prefetch_related('tags', 'comments').all()
# Separate queries, joined in Python

# Complex queries with Q
from django.db.models import Q
Post.objects.filter(Q(title__icontains='django') | Q(content__icontains='django'))
```

## Custom Managers

```python
class PublishedManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_published=True)

class Post(models.Model):
    # ... fields ...

    objects = models.Manager()  # Default manager
    published = PublishedManager()  # Custom manager

# Usage:
Post.published.all()  # Only published posts
```
```

**views-and-urls.md:**
```markdown
# Django Views and URLs

## Function-Based Views (FBV)

```python
# views.py
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from .models import Post
from .forms import PostForm

def post_list(request):
    posts = Post.objects.filter(is_published=True)
    return render(request, 'posts/list.html', {'posts': posts})

def post_detail(request, pk):
    post = get_object_or_404(Post, pk=pk)
    return render(request, 'posts/detail.html', {'post': post})

def post_create(request):
    if request.method == 'POST':
        form = PostForm(request.POST)
        if form.is_valid():
            post = form.save(commit=False)
            post.author = request.user
            post.save()
            return redirect('post-detail', pk=post.pk)
    else:
        form = PostForm()
    return render(request, 'posts/form.html', {'form': form})
```

## Class-Based Views (CBV)

```python
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from django.urls import reverse_lazy
from django.contrib.auth.mixins import LoginRequiredMixin

class PostListView(ListView):
    model = Post
    template_name = 'posts/list.html'
    context_object_name = 'posts'
    paginate_by = 10

    def get_queryset(self):
        return Post.objects.filter(is_published=True)

class PostDetailView(DetailView):
    model = Post
    template_name = 'posts/detail.html'

class PostCreateView(LoginRequiredMixin, CreateView):
    model = Post
    form_class = PostForm
    template_name = 'posts/form.html'
    success_url = reverse_lazy('post-list')

    def form_valid(self, form):
        form.instance.author = self.request.user
        return super().form_valid(form)
```

## URL Configuration

```python
# urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.post_list, name='post-list'),
    path('<int:pk>/', views.post_detail, name='post-detail'),
    path('create/', views.post_create, name='post-create'),

    # Or with CBVs:
    path('', views.PostListView.as_view(), name='post-list'),
    path('<int:pk>/', views.PostDetailView.as_view(), name='post-detail'),
]

# In main urls.py:
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('posts/', include('posts.urls')),
]
```
```

**django-rest-framework.md:**
```markdown
# Django REST Framework

## Serializers

```python
# serializers.py
from rest_framework import serializers
from .models import Post

class PostSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)
    comment_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Post
        fields = ['id', 'title', 'content', 'author', 'author_name',
                  'created_at', 'is_published', 'comment_count']
        read_only_fields = ['id', 'created_at']

    def validate_title(self, value):
        if len(value) < 5:
            raise serializers.ValidationError("Title too short")
        return value

# Nested serializers
class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['id', 'text', 'author', 'created_at']

class PostDetailSerializer(serializers.ModelSerializer):
    comments = CommentSerializer(many=True, read_only=True)

    class Meta:
        model = Post
        fields = ['id', 'title', 'content', 'comments']
```

## ViewSets and Routers

```python
# views.py
from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['author', 'is_published']
    search_fields = ['title', 'content']

    def get_queryset(self):
        # Only show published posts to non-staff
        if self.request.user.is_staff:
            return Post.objects.all()
        return Post.objects.filter(is_published=True)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        post = self.get_object()
        post.is_published = True
        post.save()
        return Response({'status': 'published'})

# urls.py
from rest_framework.routers import DefaultRouter
from .views import PostViewSet

router = DefaultRouter()
router.register(r'posts', PostViewSet)

urlpatterns = router.urls
```

## Authentication

```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20
}

# Custom permissions
from rest_framework import permissions

class IsAuthorOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.author == request.user
```
```

**testing-patterns.md:**
```markdown
# Django Testing Patterns

## Model Tests

```python
from django.test import TestCase
from django.contrib.auth.models import User
from .models import Post

class PostModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )

    def test_create_post(self):
        post = Post.objects.create(
            title='Test Post',
            content='Test content',
            author=self.user
        )
        self.assertEqual(post.title, 'Test Post')
        self.assertEqual(str(post), 'Test Post')

    def test_post_absolute_url(self):
        post = Post.objects.create(
            title='Test',
            author=self.user
        )
        self.assertEqual(post.get_absolute_url(), f'/posts/{post.pk}/')
```

## View Tests

```python
from django.test import TestCase, Client
from django.urls import reverse

class PostViewTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.post = Post.objects.create(
            title='Test Post',
            content='Test content',
            author=self.user,
            is_published=True
        )

    def test_post_list_view(self):
        response = self.client.get(reverse('post-list'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Test Post')
        self.assertTemplateUsed(response, 'posts/list.html')

    def test_post_create_requires_login(self):
        response = self.client.get(reverse('post-create'))
        self.assertEqual(response.status_code, 302)  # Redirect to login

        # Login and try again
        self.client.login(username='testuser', password='testpass123')
        response = self.client.get(reverse('post-create'))
        self.assertEqual(response.status_code, 200)
```

## API Tests (DRF)

```python
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

class PostAPITest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )

    def test_get_posts(self):
        Post.objects.create(
            title='Test Post',
            content='Content',
            author=self.user,
            is_published=True
        )

        response = self.client.get('/api/posts/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_post_authenticated(self):
        self.client.force_authenticate(user=self.user)

        data = {
            'title': 'New Post',
            'content': 'New content'
        }
        response = self.client.post('/api/posts/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Post.objects.count(), 1)
```

## pytest (Alternative)

```python
# pytest.ini
[pytest]
DJANGO_SETTINGS_MODULE = myproject.settings
python_files = tests.py test_*.py *_tests.py

# conftest.py
import pytest
from django.contrib.auth.models import User

@pytest.fixture
def user(db):
    return User.objects.create_user(
        username='testuser',
        password='testpass123'
    )

@pytest.fixture
def authenticated_client(client, user):
    client.force_login(user)
    return client

# test_views.py
import pytest
from django.urls import reverse

@pytest.mark.django_db
def test_post_list(client):
    response = client.get(reverse('post-list'))
    assert response.status_code == 200

@pytest.mark.django_db
def test_create_post(authenticated_client, user):
    data = {'title': 'Test', 'content': 'Content'}
    response = authenticated_client.post(reverse('post-create'), data)
    assert response.status_code == 302
```
```

### QUICK_REFERENCE.md

```markdown
## Django Quick Commands

# Development
python manage.py runserver         # Start dev server
python manage.py runserver 0.0.0.0:8000  # Accessible externally

# Database
python manage.py makemigrations    # Create migrations
python manage.py migrate           # Apply migrations
python manage.py showmigrations    # Show migration status
python manage.py sqlmigrate app 0001  # Show SQL for migration

# Shell
python manage.py shell             # Django shell with ORM
python manage.py dbshell           # Database shell

# Testing
python manage.py test              # Run tests
python manage.py test app.tests.TestClass  # Specific test
pytest                             # If using pytest

# Admin
python manage.py createsuperuser   # Create admin user
python manage.py changepassword    # Change password

# Static files
python manage.py collectstatic     # Collect static files

# Other
python manage.py check             # Check for issues
python manage.py makemessages      # Create translation files
python manage.py compilemessages   # Compile translations

## Common Patterns

### Create Django app
```bash
python manage.py startapp myapp
```

### Basic Model
```python
from django.db import models

class MyModel(models.Model):
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
```

### Basic View
```python
def my_view(request):
    data = MyModel.objects.all()
    return render(request, 'template.html', {'data': data})
```

### URL Pattern
```python
from django.urls import path
from . import views

urlpatterns = [
    path('', views.my_view, name='my-view'),
]
```

### Environment Variables
```python
# .env file
SECRET_KEY=your-secret-key
DEBUG=True
DATABASE_URL=postgres://user:pass@localhost/db

# settings.py (using python-decouple)
from decouple import config
SECRET_KEY = config('SECRET_KEY')
```
```

## Expected Structure After Setup

```
my-django-project/
├── CLAUDE.md
├── .claudeignore
├── .claude/
│   ├── COMMON_MISTAKES.md (Django-specific)
│   ├── QUICK_START.md
│   ├── ARCHITECTURE_MAP.md (Django structure)
│   ├── LEARNINGS_INDEX.md
│   ├── DOCUMENTATION_MAINTENANCE.md
│   ├── completions/
│   ├── sessions/
│   └── templates/
├── docs/
│   ├── INDEX.md
│   ├── QUICK_REFERENCE.md (Django commands)
│   ├── learnings/
│   │   ├── models-and-orm.md
│   │   ├── views-and-urls.md
│   │   ├── django-rest-framework.md
│   │   ├── testing-patterns.md
│   │   └── performance.md
│   └── archive/
├── manage.py
├── myproject/
│   ├── settings.py
│   └── urls.py
├── apps/
└── requirements.txt
```

## Quick Start After Setup

```bash
# 1. Load essential docs (~800 tokens)
CLAUDE.md
.claude/COMMON_MISTAKES.md
.claude/QUICK_START.md
.claude/ARCHITECTURE_MAP.md

# 2. For model work, load:
docs/learnings/models-and-orm.md (~600 tokens)

# 3. For views/URLs, load:
docs/learnings/views-and-urls.md (~500 tokens)

# 4. For API work, load:
docs/learnings/django-rest-framework.md (~700 tokens)

Total: ~1,300-1,800 tokens (vs 9,000+ before)
```

---

**Last Updated**: 2025-11-11
