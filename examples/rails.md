# Ruby on Rails Setup Example

**Quick setup for Rails projects - Copy and customize**

---

# Setup Claude Code Documentation for [Rails Project Name]

## Project Context

**Project Type**: Ruby on Rails Application
**Tech Stack**:
- Rails 7.x / 8.x
- Ruby 3.x
- [Database: PostgreSQL / MySQL / SQLite]
- [Frontend: Hotwire / React / Vue]
- [Testing: RSpec / Minitest]
- [Background: Sidekiq / ActiveJob]

**Main Features**: [Description]

## Use Universal Setup

First, run the universal setup from `UNIVERSAL_SETUP.md`, then customize with Rails-specific content below.

## Rails-Specific Content

### ARCHITECTURE_MAP.md

```markdown
## Core Directories (Rails MVC)

myapp/
├── app/
│   ├── models/           # ActiveRecord models
│   ├── controllers/      # Controller logic
│   ├── views/            # View templates (ERB/HTML)
│   ├── helpers/          # View helpers
│   ├── jobs/             # Background jobs
│   ├── mailers/          # Email logic
│   ├── channels/         # ActionCable channels
│   └── javascript/       # JavaScript (Hotwire/Stimulus)
├── config/
│   ├── routes.rb         # URL routing
│   ├── database.yml      # Database config
│   ├── application.rb    # App config
│   └── environments/     # Environment configs
├── db/
│   ├── migrate/          # Database migrations
│   ├── schema.rb         # Current schema
│   └── seeds.rb          # Seed data
├── lib/                  # Custom libraries
├── spec/                 # RSpec tests (or test/ for Minitest)
├── public/               # Static files
└── Gemfile               # Ruby dependencies

## Key Patterns

### MVC Architecture
- Models: Business logic + database (ActiveRecord)
- Views: HTML templates (ERB, Slim, Haml)
- Controllers: Request handling + orchestration
- Routes: Map URLs to controller actions

### RESTful Resources
- Standard CRUD actions: index, show, new, create, edit, update, destroy
- Nested resources for relationships
- Custom actions with member/collection routes

### ActiveRecord Associations
- has_many / belongs_to
- has_one / has_and_belongs_to_many
- Polymorphic associations
- Callbacks and validations
```

### COMMON_MISTAKES.md

```markdown
## Top 5 Rails Mistakes

### 1. N+1 Query Problem

**Symptom**: Slow page loads, hundreds of database queries

**Anti-pattern:**
```ruby
# app/controllers/posts_controller.rb
def index
  @posts = Post.all  # ❌ Loads posts only
end

# In view:
# <% @posts.each do |post| %>
#   <%= post.author.name %>  <!-- N+1 queries! -->
#   <%= post.comments.count %> comments
# <% end %>
```

**Correct:**
```ruby
def index
  @posts = Post.includes(:author, :comments).all  # ✅ 3 queries total
  # Or use .preload for separate queries
  # Or .eager_load for LEFT OUTER JOIN
end

# Check queries in console:
Post.includes(:author).to_sql
```

### 2. Not Using Strong Parameters

**Anti-pattern:**
```ruby
def create
  @user = User.new(params[:user])  # ❌ Mass assignment vulnerability!
  @user.save
end
```

**Correct:**
```ruby
def create
  @user = User.new(user_params)  # ✅ Only permitted attributes
  if @user.save
    redirect_to @user
  else
    render :new, status: :unprocessable_entity
  end
end

private

def user_params
  params.require(:user).permit(:name, :email, :password)
end
```

### 3. Fat Controllers, Skinny Models (Should Be Opposite!)

**Anti-pattern:**
```ruby
# app/controllers/orders_controller.rb
def create
  @order = Order.new(order_params)
  @order.user = current_user

  # ❌ Business logic in controller!
  total = 0
  @order.items.each do |item|
    total += item.price * item.quantity
  end
  @order.total = total

  if @order.save
    OrderMailer.confirmation(@order).deliver_later
    InventoryService.decrement_stock(@order.items)
    # ... more logic
  end
end
```

**Correct:**
```ruby
# app/controllers/orders_controller.rb
def create
  @order = current_user.orders.build(order_params)

  if @order.save  # ✅ Model handles everything
    redirect_to @order, notice: 'Order created!'
  else
    render :new, status: :unprocessable_entity
  end
end

# app/models/order.rb
class Order < ApplicationRecord
  belongs_to :user
  has_many :items

  before_save :calculate_total
  after_create :send_confirmation
  after_create :decrement_inventory

  private

  def calculate_total
    self.total = items.sum { |item| item.price * item.quantity }
  end

  def send_confirmation
    OrderMailer.confirmation(self).deliver_later
  end

  def decrement_inventory
    InventoryService.new(items).decrement_stock
  end
end
```

### 4. Not Handling Failed Validations Properly

**Anti-pattern:**
```ruby
def create
  @user = User.new(user_params)
  @user.save  # ❌ No error handling!
  redirect_to @user  # Always redirects, even if save failed
end
```

**Correct:**
```ruby
def create
  @user = User.new(user_params)

  if @user.save  # ✅ Check if save succeeded
    redirect_to @user, notice: 'User created!'
  else
    render :new, status: :unprocessable_entity
    # Errors available in @user.errors
  end
end

# In view:
# <% if @user.errors.any? %>
#   <div class="errors">
#     <% @user.errors.full_messages.each do |msg| %>
#       <p><%= msg %></p>
#     <% end %>
#   </div>
# <% end %>
```

### 5. Exposing Secrets in Git

**Anti-pattern:**
```ruby
# config/database.yml
production:
  adapter: postgresql
  database: myapp_production
  username: postgres
  password: super_secret_password  # ❌ Committed to git!

# config/initializers/stripe.rb
Stripe.api_key = 'sk_live_actualkey123'  # ❌ Exposed!
```

**Correct:**
```ruby
# config/database.yml
production:
  adapter: postgresql
  database: <%= ENV['DATABASE_NAME'] %>
  username: <%= ENV['DATABASE_USER'] %>
  password: <%= ENV['DATABASE_PASSWORD'] %>

# config/initializers/stripe.rb
Stripe.api_key = Rails.application.credentials.stripe[:secret_key]

# Use Rails encrypted credentials:
# rails credentials:edit --environment production

# Or use dotenv gem:
# gem 'dotenv-rails', groups: [:development, :test]
# Create .env file (add to .gitignore!)
```
```

### docs/learnings/

Create these Rails-specific files:

**active-record-patterns.md:**
```markdown
# ActiveRecord Patterns

## Model Definition

```ruby
# app/models/post.rb
class Post < ApplicationRecord
  # Associations
  belongs_to :author, class_name: 'User'
  has_many :comments, dependent: :destroy
  has_many :commenters, through: :comments, source: :user
  has_and_belongs_to_many :tags

  # Validations
  validates :title, presence: true, length: { minimum: 5, maximum: 200 }
  validates :content, presence: true
  validates :slug, uniqueness: true, format: { with: /\A[a-z0-9-]+\z/ }

  # Callbacks
  before_validation :generate_slug
  after_create :notify_followers
  after_commit :clear_cache

  # Scopes
  scope :published, -> { where(published: true) }
  scope :recent, -> { order(created_at: :desc) }
  scope :by_author, ->(author_id) { where(author_id: author_id) }

  # Class methods
  def self.trending
    where('created_at > ?', 1.week.ago)
      .order(views_count: :desc)
      .limit(10)
  end

  # Instance methods
  def publish!
    update!(published: true, published_at: Time.current)
  end

  private

  def generate_slug
    self.slug ||= title.parameterize if title.present?
  end

  def notify_followers
    NotificationJob.perform_later(self)
  end
end
```

## Query Optimization

```ruby
# N+1 Prevention
posts = Post.includes(:author, :comments).all
posts = Post.preload(:tags).all  # Separate queries
posts = Post.eager_load(:author).all  # LEFT OUTER JOIN

# Select specific columns
Post.select(:id, :title, :created_at)

# Joins
Post.joins(:author).where(users: { role: 'admin' })

# Aggregations
Post.group(:author_id).count
Post.average(:views_count)
Post.sum(:likes_count)

# Find or create
user = User.find_or_create_by(email: 'john@example.com') do |u|
  u.name = 'John Doe'
end

# Update multiple records
Post.where(published: false).update_all(published: true)

# Batch processing (avoid loading all records)
Post.find_each(batch_size: 1000) do |post|
  post.regenerate_thumbnail
end

# Raw SQL (when needed)
Post.where("views_count > ?", 1000)
Post.find_by_sql("SELECT * FROM posts WHERE ...")
```

## Custom Validations

```ruby
class Invoice < ApplicationRecord
  validate :due_date_cannot_be_in_past
  validate :total_matches_line_items

  private

  def due_date_cannot_be_in_past
    if due_date.present? && due_date < Date.today
      errors.add(:due_date, "can't be in the past")
    end
  end

  def total_matches_line_items
    calculated_total = line_items.sum(&:amount)
    if total != calculated_total
      errors.add(:total, "doesn't match line items")
    end
  end
end
```
```

**controllers-and-routes.md:**
```markdown
# Controllers and Routes

## RESTful Controller

```ruby
# app/controllers/posts_controller.rb
class PostsController < ApplicationController
  before_action :authenticate_user!, except: [:index, :show]
  before_action :set_post, only: [:show, :edit, :update, :destroy]
  before_action :authorize_post, only: [:edit, :update, :destroy]

  def index
    @posts = Post.published.recent.page(params[:page])
  end

  def show
    @post.increment!(:views_count)
  end

  def new
    @post = current_user.posts.build
  end

  def create
    @post = current_user.posts.build(post_params)

    if @post.save
      redirect_to @post, notice: 'Post created successfully.'
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @post.update(post_params)
      redirect_to @post, notice: 'Post updated successfully.'
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @post.destroy
    redirect_to posts_url, notice: 'Post deleted.'
  end

  private

  def set_post
    @post = Post.find(params[:id])
  end

  def authorize_post
    redirect_to root_path unless @post.author == current_user
  end

  def post_params
    params.require(:post).permit(:title, :content, :published, tag_ids: [])
  end
end
```

## Routes

```ruby
# config/routes.rb
Rails.application.routes.draw do
  root 'posts#index'

  # RESTful resources
  resources :posts do
    member do
      post :publish
      post :archive
    end

    collection do
      get :trending
    end

    resources :comments, only: [:create, :destroy]
  end

  # Nested resources
  resources :users do
    resources :posts, only: [:index]
  end

  # Namespace for admin
  namespace :admin do
    resources :posts
    resources :users
  end

  # Custom routes
  get '/about', to: 'pages#about'
  post '/search', to: 'search#create'

  # API routes
  namespace :api do
    namespace :v1 do
      resources :posts, only: [:index, :show]
    end
  end
end

# Generated routes:
# GET    /posts              posts#index
# POST   /posts              posts#create
# GET    /posts/new          posts#new
# GET    /posts/:id          posts#show
# GET    /posts/:id/edit     posts#edit
# PATCH  /posts/:id          posts#update
# DELETE /posts/:id          posts#destroy
# POST   /posts/:id/publish  posts#publish (custom)
```

## API Controller (JSON)

```ruby
# app/controllers/api/v1/posts_controller.rb
module Api
  module V1
    class PostsController < ApplicationController
      skip_before_action :verify_authenticity_token
      before_action :authenticate_with_token

      def index
        @posts = Post.published.recent.limit(20)
        render json: @posts
      end

      def show
        @post = Post.find(params[:id])
        render json: @post, serializer: PostSerializer
      end

      def create
        @post = current_user.posts.build(post_params)

        if @post.save
          render json: @post, status: :created
        else
          render json: { errors: @post.errors }, status: :unprocessable_entity
        end
      end

      private

      def authenticate_with_token
        token = request.headers['Authorization']&.split(' ')&.last
        @current_user = User.find_by(api_token: token)

        render json: { error: 'Unauthorized' }, status: :unauthorized unless @current_user
      end
    end
  end
end
```
```

**hotwire-patterns.md:**
```markdown
# Hotwire (Turbo + Stimulus)

## Turbo Frames

```erb
<!-- app/views/posts/index.html.erb -->
<h1>Posts</h1>

<%= turbo_frame_tag "new_post" do %>
  <%= link_to "New Post", new_post_path %>
<% end %>

<div id="posts">
  <%= render @posts %>
</div>

<!-- app/views/posts/new.html.erb -->
<%= turbo_frame_tag "new_post" do %>
  <h2>New Post</h2>
  <%= render "form", post: @post %>
<% end %>

<!-- Form submission replaces only the frame! -->
```

## Turbo Streams

```ruby
# app/controllers/comments_controller.rb
def create
  @comment = @post.comments.build(comment_params)
  @comment.user = current_user

  if @comment.save
    respond_to do |format|
      format.turbo_stream  # Returns Turbo Stream response
      format.html { redirect_to @post }
    end
  else
    render :new, status: :unprocessable_entity
  end
end
```

```erb
<!-- app/views/comments/create.turbo_stream.erb -->
<%= turbo_stream.append "comments" do %>
  <%= render @comment %>
<% end %>

<%= turbo_stream.update "comment_count" do %>
  <%= @post.comments.count %> comments
<% end %>
```

## Stimulus Controllers

```javascript
// app/javascript/controllers/dropdown_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["menu"]

  toggle() {
    this.menuTarget.classList.toggle("hidden")
  }

  hide(event) {
    if (!this.element.contains(event.target)) {
      this.menuTarget.classList.add("hidden")
    }
  }
}
```

```erb
<!-- In view -->
<div data-controller="dropdown" data-action="click@window->dropdown#hide">
  <button data-action="click->dropdown#toggle">
    Menu
  </button>

  <div data-dropdown-target="menu" class="hidden">
    <!-- Menu items -->
  </div>
</div>
```
```

**testing-patterns.md:**
```markdown
# Rails Testing Patterns (RSpec)

## Model Specs

```ruby
# spec/models/post_spec.rb
require 'rails_helper'

RSpec.describe Post, type: :model do
  describe 'associations' do
    it { should belong_to(:author).class_name('User') }
    it { should have_many(:comments).dependent(:destroy) }
  end

  describe 'validations' do
    it { should validate_presence_of(:title) }
    it { should validate_length_of(:title).is_at_least(5) }
    it { should validate_uniqueness_of(:slug) }
  end

  describe 'scopes' do
    let!(:published_post) { create(:post, published: true) }
    let!(:draft_post) { create(:post, published: false) }

    it 'returns only published posts' do
      expect(Post.published).to include(published_post)
      expect(Post.published).not_to include(draft_post)
    end
  end

  describe '#publish!' do
    let(:post) { create(:post, published: false) }

    it 'sets published to true' do
      expect { post.publish! }.to change(post, :published).to(true)
    end

    it 'sets published_at timestamp' do
      post.publish!
      expect(post.published_at).to be_present
    end
  end
end
```

## Controller Specs

```ruby
# spec/controllers/posts_controller_spec.rb
require 'rails_helper'

RSpec.describe PostsController, type: :controller do
  let(:user) { create(:user) }
  let(:post) { create(:post, author: user) }

  describe 'GET #index' do
    it 'returns success' do
      get :index
      expect(response).to have_http_status(:success)
    end

    it 'assigns @posts' do
      post  # Create post
      get :index
      expect(assigns(:posts)).to include(post)
    end
  end

  describe 'POST #create' do
    context 'when logged in' do
      before { sign_in user }

      context 'with valid params' do
        let(:valid_params) { { post: attributes_for(:post) } }

        it 'creates a new post' do
          expect {
            post :create, params: valid_params
          }.to change(Post, :count).by(1)
        end

        it 'redirects to the post' do
          post :create, params: valid_params
          expect(response).to redirect_to(Post.last)
        end
      end

      context 'with invalid params' do
        let(:invalid_params) { { post: { title: '' } } }

        it 'does not create a post' do
          expect {
            post :create, params: invalid_params
          }.not_to change(Post, :count)
        end

        it 'renders new template' do
          post :create, params: invalid_params
          expect(response).to render_template(:new)
        end
      end
    end

    context 'when not logged in' do
      it 'redirects to login' do
        post :create, params: { post: attributes_for(:post) }
        expect(response).to redirect_to(new_user_session_path)
      end
    end
  end
end
```

## Request Specs (Recommended over Controller specs)

```ruby
# spec/requests/posts_spec.rb
require 'rails_helper'

RSpec.describe 'Posts', type: :request do
  let(:user) { create(:user) }

  describe 'GET /posts' do
    it 'returns success' do
      get posts_path
      expect(response).to have_http_status(:ok)
    end
  end

  describe 'POST /posts' do
    context 'when authenticated' do
      before { sign_in user }

      it 'creates a post' do
        expect {
          post posts_path, params: { post: { title: 'Test', content: 'Content' } }
        }.to change(Post, :count).by(1)

        expect(response).to redirect_to(Post.last)
      end
    end
  end
end
```

## Factory Bot

```ruby
# spec/factories/posts.rb
FactoryBot.define do
  factory :post do
    title { Faker::Lorem.sentence }
    content { Faker::Lorem.paragraphs(number: 3).join("\n") }
    published { false }
    association :author, factory: :user

    trait :published do
      published { true }
      published_at { Time.current }
    end

    trait :with_comments do
      after(:create) do |post|
        create_list(:comment, 3, post: post)
      end
    end
  end
end

# Usage:
create(:post)  # Creates post with defaults
create(:post, :published)  # Published post
create(:post, :with_comments)  # Post with 3 comments
build(:post)  # Build without saving
```
```

### QUICK_REFERENCE.md

```markdown
## Rails Quick Commands

# Server
rails server              # Start dev server (port 3000)
rails s -p 4000          # Custom port

# Console
rails console            # Rails console
rails c --sandbox        # Rollback all changes on exit
rails dbconsole          # Database console

# Database
rails db:create          # Create database
rails db:migrate         # Run migrations
rails db:rollback        # Rollback last migration
rails db:seed            # Load seed data
rails db:reset           # Drop, create, migrate, seed

# Migrations
rails generate migration AddFieldToModel field:type
rails db:migrate:status  # Show migration status

# Generators
rails generate model Post title:string content:text
rails generate controller Posts index show
rails generate scaffold Post title:string content:text
rails generate migration AddPublishedToPosts published:boolean

# Testing
rspec                    # Run all specs
rspec spec/models        # Run model specs
rails test               # Run Minitest tests

# Assets
rails assets:precompile  # Compile assets for production
rails assets:clean       # Clean old assets

# Routes
rails routes             # Show all routes
rails routes | grep posts  # Filter routes

# Other
rails credentials:edit   # Edit encrypted credentials
rails about              # Show Rails version info
rails stats              # Code statistics

## Common Patterns

### Create Model with Migration
```bash
rails generate model Post title:string content:text author:references
rails db:migrate
```

### Create Controller
```bash
rails generate controller Posts index show new create edit update destroy
```

### RESTful Routes
```ruby
# config/routes.rb
resources :posts
```

### Association Setup
```ruby
# In Post model
belongs_to :author, class_name: 'User'

# In User model
has_many :posts, foreign_key: 'author_id'
```

### Background Job
```ruby
# Generate job
rails generate job ProcessPost

# Enqueue job
ProcessPostJob.perform_later(post)
```

### Environment Variables
```bash
# Use dotenv-rails gem
# .env file (add to .gitignore)
DATABASE_URL=postgres://localhost/myapp
SECRET_KEY_BASE=abc123

# Or Rails credentials:
rails credentials:edit
```
```

## Expected Structure After Setup

```
my-rails-app/
├── CLAUDE.md
├── .claudeignore
├── .claude/
│   ├── COMMON_MISTAKES.md (Rails-specific)
│   ├── QUICK_START.md
│   ├── ARCHITECTURE_MAP.md (Rails structure)
│   ├── LEARNINGS_INDEX.md
│   ├── DOCUMENTATION_MAINTENANCE.md
│   ├── completions/
│   ├── sessions/
│   └── templates/
├── docs/
│   ├── INDEX.md
│   ├── QUICK_REFERENCE.md (Rails commands)
│   ├── learnings/
│   │   ├── active-record-patterns.md
│   │   ├── controllers-and-routes.md
│   │   ├── hotwire-patterns.md
│   │   ├── testing-patterns.md
│   │   └── performance.md
│   └── archive/
├── app/
│   ├── models/
│   ├── controllers/
│   ├── views/
│   └── jobs/
├── config/
│   ├── routes.rb
│   └── database.yml
├── db/
│   └── migrate/
├── spec/  (or test/)
└── Gemfile
```

## Quick Start After Setup

```bash
# 1. Load essential docs (~800 tokens)
CLAUDE.md
.claude/COMMON_MISTAKES.md
.claude/QUICK_START.md
.claude/ARCHITECTURE_MAP.md

# 2. For model work, load:
docs/learnings/active-record-patterns.md (~700 tokens)

# 3. For controller/routes, load:
docs/learnings/controllers-and-routes.md (~600 tokens)

# 4. For Hotwire, load:
docs/learnings/hotwire-patterns.md (~400 tokens)

Total: ~1,300-1,700 tokens (vs 9,000+ before)
```

---

**Last Updated**: 2025-11-11
