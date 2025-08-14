#!/usr/bin/env python3
"""
🚀 Capital Craft Backend CLI Runner

Main entry point for running backend operations including tests, database migrations,
development server, and more.

Usage: python run.py [COMMAND] [SUBCOMMAND] [OPTIONS]
"""
import sys
import subprocess
import os
from run_tests import (
    run_tests_organized, 
    run_tests_combined, 
    run_specific_category,
    run_notification_tests_only,
    run_performance_tests_only,
    run_auth_tests_only,
    show_help as show_test_help
)


def show_main_help():
    """Show main help message"""
    print("🚀 Capital Craft Backend CLI")
    print("=" * 50)
    print("Usage: python run.py [COMMAND] [SUBCOMMAND] [OPTIONS]")
    print("\n📋 Available Commands:")
    print("  test          Run backend tests")
    print("  dev           Start development server")
    print("  db            Database operations")
    print("  migrate       Run database migrations")
    print("  seed          Seed database with sample data")
    print("  help          Show this help message")
    print("\n🧪 Test Commands:")
    print("  python run.py test all                 # Run all tests organized")
    print("  python run.py test unit                # Run unit tests only")
    print("  python run.py test integration         # Run integration tests only")
    print("  python run.py test notifications       # Run notification tests only")
    print("  python run.py test performance         # Run performance benchmarks")
    print("  python run.py test auth                # Run authentication tests only")
    print("  python run.py test --help              # Show detailed test help")
    print("\n🔧 Development Commands:")
    print("  python run.py dev                      # Start FastAPI dev server")
    print("  python run.py dev --port 8001          # Start on custom port")
    print("\n🗄️  Database Commands:")
    print("  python run.py db reset                 # Reset database")
    print("  python run.py db status                # Show database status")
    print("  python run.py migrate                  # Run Alembic migrations")
    print("  python run.py seed                     # Seed with sample data")
    print("\n💡 Examples:")
    print("  python run.py test all                 # Your preferred command")
    print("  python run.py dev                      # Start development")
    print("  python run.py db reset && python run.py seed  # Fresh database")


def run_test_command(args):
    """Handle test commands"""
    if len(args) == 0:
        # Default: run all tests
        return run_tests_organized()
    
    subcommand = args[0].lower()
    
    if subcommand == "all":
        return run_tests_organized()
    elif subcommand == "unit":
        return run_specific_category("unit")
    elif subcommand == "integration":
        return run_specific_category("integration")
    elif subcommand == "performance":
        return run_performance_tests_only()
    elif subcommand == "notifications":
        return run_notification_tests_only()
    elif subcommand == "auth":
        return run_auth_tests_only()
    elif subcommand == "combined":
        return run_tests_combined()
    elif subcommand == "--help" or subcommand == "help":
        show_test_help()
        return True
    else:
        print(f"❌ Unknown test command: {subcommand}")
        print("Available test commands: all, unit, integration, notifications, performance, auth, combined")
        print("Use 'python run.py test --help' for detailed help")
        return False


def run_dev_server(args):
    """Start development server"""
    port = "8000"
    host = "0.0.0.0"
    
    # Parse port argument
    if "--port" in args:
        port_index = args.index("--port")
        if port_index + 1 < len(args):
            port = args[port_index + 1]
    
    print(f"🚀 Starting FastAPI development server on {host}:{port}")
    print("=" * 50)
    
    try:
        subprocess.run([
            sys.executable, "-m", "uvicorn",
            "main:app",
            "--host", host,
            "--port", port,
            "--reload"
        ])
        return True
    except KeyboardInterrupt:
        print("\n👋 Development server stopped")
        return True
    except Exception as e:
        print(f"❌ Error starting development server: {e}")
        return False


def run_db_command(args):
    """Handle database commands"""
    if len(args) == 0:
        print("❌ Database command required")
        print("Available: reset, status")
        return False
    
    subcommand = args[0].lower()
    
    if subcommand == "reset":
        print("🗄️  Resetting database...")
        try:
            result = subprocess.run([
                sys.executable, "scripts/reset_database.py"
            ], cwd=os.getcwd())
            return result.returncode == 0
        except Exception as e:
            print(f"❌ Error resetting database: {e}")
            return False
    
    elif subcommand == "status":
        print("🗄️  Checking database status...")
        # TODO: Implement database status check
        print("Database status check not implemented yet")
        return True
    
    else:
        print(f"❌ Unknown database command: {subcommand}")
        print("Available: reset, status")
        return False


def run_migrate_command():
    """Run Alembic database migrations"""
    print("🔄 Running database migrations...")
    try:
        result = subprocess.run([
            sys.executable, "-m", "alembic", "upgrade", "head"
        ])
        return result.returncode == 0
    except Exception as e:
        print(f"❌ Error running migrations: {e}")
        return False


def run_seed_command():
    """Seed database with sample data"""
    print("🌱 Seeding database with sample data...")
    try:
        result = subprocess.run([
            sys.executable, "scripts/seed_database.py"
        ], cwd=os.getcwd())
        return result.returncode == 0
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        return False


def main():
    """Main CLI entry point"""
    if len(sys.argv) < 2:
        show_main_help()
        return
    
    command = sys.argv[1].lower()
    args = sys.argv[2:] if len(sys.argv) > 2 else []
    
    success = True
    
    if command == "test":
        success = run_test_command(args)
    elif command == "dev":
        success = run_dev_server(args)
    elif command == "db":
        success = run_db_command(args)
    elif command == "migrate":
        success = run_migrate_command()
    elif command == "seed":
        success = run_seed_command()
    elif command == "help" or command == "--help" or command == "-h":
        show_main_help()
    else:
        print(f"❌ Unknown command: {command}")
        print("Use 'python run.py help' for available commands")
        success = False
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()