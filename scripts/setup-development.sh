#!/bin/bash

# Homify Development Setup Script
echo "🏠 Setting up Homify development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    print_status "Checking Docker..."
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker Desktop."
        exit 1
    fi
    print_success "Docker is running"
}

# Start Supabase
start_supabase() {
    print_status "Starting Supabase..."
    if supabase start; then
        print_success "Supabase started successfully"
        
        # Extract and display connection info
        echo ""
        echo "📊 Supabase Services:"
        echo "   • Studio: http://127.0.0.1:54323"
        echo "   • API: http://127.0.0.1:54321"
        echo "   • Database: postgresql://postgres:postgres@127.0.0.1:54322/postgres"
        echo ""
    else
        print_error "Failed to start Supabase"
        exit 1
    fi
}

# Check if n8n is running
check_n8n() {
    print_status "Checking n8n..."
    if curl -s http://localhost:5678 > /dev/null; then
        print_success "n8n is already running at http://localhost:5678"
    else
        print_warning "n8n is not running. Starting n8n..."
        start_n8n
    fi
}

# Start n8n
start_n8n() {
    print_status "Starting n8n in background..."
    nohup n8n start > logs/n8n.log 2>&1 &
    N8N_PID=$!
    echo $N8N_PID > logs/n8n.pid
    
    # Wait for n8n to start
    print_status "Waiting for n8n to start..."
    for i in {1..30}; do
        if curl -s http://localhost:5678 > /dev/null; then
            print_success "n8n started successfully at http://localhost:5678"
            break
        fi
        sleep 2
        if [ $i -eq 30 ]; then
            print_error "n8n failed to start within 60 seconds"
            exit 1
        fi
    done
}

# Create logs directory
setup_logs() {
    print_status "Setting up logs directory..."
    mkdir -p logs
    print_success "Logs directory created"
}

# Test connections
test_connections() {
    print_status "Testing connections..."
    
    # Test Supabase
    if curl -s -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" http://127.0.0.1:54321/rest/v1/ > /dev/null; then
        print_success "Supabase API connection successful"
    else
        print_error "Supabase API connection failed"
    fi
    
    # Test n8n
    if curl -s http://localhost:5678 > /dev/null; then
        print_success "n8n connection successful"
    else
        print_error "n8n connection failed"
    fi
}

# Display next steps
show_next_steps() {
    echo ""
    echo "🎉 Development environment is ready!"
    echo ""
    echo "📱 Next steps:"
    echo "   1. Open Supabase Studio: http://127.0.0.1:54323"
    echo "   2. Open n8n Editor: http://localhost:5678"
    echo "   3. Import workflows from n8n-workflows/ directory"
    echo "   4. Start your React Native app: npm start"
    echo ""
    echo "🔧 Useful commands:"
    echo "   • Stop Supabase: supabase stop"
    echo "   • View n8n logs: tail -f logs/n8n.log"
    echo "   • Stop n8n: kill \$(cat logs/n8n.pid)"
    echo ""
    echo "📚 Documentation:"
    echo "   • Setup Guide: ./SUPABASE_N8N_SETUP.md"
    echo "   • Supabase Docs: https://docs.supabase.com"
    echo "   • n8n Docs: https://docs.n8n.io"
    echo ""
}

# Main execution
main() {
    echo "🚀 Starting Homify development setup..."
    echo ""
    
    setup_logs
    check_docker
    start_supabase
    check_n8n
    test_connections
    show_next_steps
    
    print_success "Setup complete! Happy coding! 🎉"
}

# Run main function
main 