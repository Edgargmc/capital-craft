#!/usr/bin/env python3
"""
🌊 Capital Craft - Universal Task Runner
Clean Architecture Script for Cross-Platform Development

Usage:
    python run.py test front      # Run frontend tests
    python run.py test back       # Run backend tests  
    python run.py test all        # Run all tests
    python run.py dev front       # Start frontend dev server
    python run.py dev back        # Start backend dev server
    python run.py validate front  # Validate frontend (type-check + lint + test)
    python run.py --help          # Show help

Compatible with Windows, macOS, and Linux
Following Clean Architecture and SOLID principles
"""

import sys
import os
import subprocess
import platform
import argparse
from pathlib import Path
from typing import List, Dict, Optional
import time
from datetime import datetime


class Colors:
    """ANSI color codes for cross-platform terminal output"""
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    END = '\033[0m'
    
    @classmethod
    def disable_on_windows(cls):
        """Disable colors on Windows if not supported"""
        if platform.system() == "Windows":
            # Enable ANSI colors on Windows 10+
            try:
                import colorama
                colorama.init()
            except ImportError:
                # Fallback: disable colors
                for attr in dir(cls):
                    if not attr.startswith('_') and attr != 'disable_on_windows':
                        setattr(cls, attr, '')


class TaskRunner:
    """
    Universal task runner following Clean Architecture principles
    
    @description Handles execution of development tasks across frontend/backend
    @layer Infrastructure
    @pattern Command Pattern
    """
    
    def __init__(self):
        self.root_dir = Path(__file__).parent
        self.frontend_dir = self.root_dir / "frontend"
        self.backend_dir = self.root_dir / "backend"
        Colors.disable_on_windows()
        
    def _print_header(self, title: str, emoji: str = "🌊"):
        """Print formatted header"""
        print(f"\n{Colors.CYAN}{Colors.BOLD}{emoji} {title}{Colors.END}")
        print(f"{Colors.CYAN}{'=' * (len(title) + 3)}{Colors.END}")
        
    def _print_success(self, message: str):
        """Print success message"""
        print(f"{Colors.GREEN}✅ {message}{Colors.END}")
        
    def _print_error(self, message: str):
        """Print error message"""
        print(f"{Colors.RED}❌ {message}{Colors.END}")
        
    def _print_info(self, message: str):
        """Print info message"""
        print(f"{Colors.BLUE}ℹ️  {message}{Colors.END}")
        
    def _print_warning(self, message: str):
        """Print warning message"""
        print(f"{Colors.YELLOW}⚠️  {message}{Colors.END}")
        
    def _run_command(self, command: List[str], cwd: Path, description: str) -> bool:
        """
        Execute command in specified directory
        
        @param command: Command to execute as list
        @param cwd: Working directory
        @param description: Human-readable description
        @returns: True if successful, False otherwise
        """
        try:
            self._print_info(f"Running: {description}")
            self._print_info(f"Directory: {cwd}")
            self._print_info(f"Command: {' '.join(command)}")
            
            # Check if directory exists
            if not cwd.exists():
                self._print_error(f"Directory not found: {cwd}")
                return False
                
            # Execute command
            result = subprocess.run(
                command,
                cwd=cwd,
                capture_output=False,  # Show output in real-time
                text=True
            )
            
            if result.returncode == 0:
                self._print_success(f"✨ {description} completed successfully!")
                return True
            else:
                self._print_error(f"❌ {description} failed with exit code {result.returncode}")
                return False
                
        except FileNotFoundError:
            self._print_error(f"Command not found: {command[0]}")
            self._print_info("Make sure all dependencies are installed")
            return False
        except Exception as e:
            self._print_error(f"Unexpected error: {str(e)}")
            return False
    
    def test_frontend(self) -> bool:
        """Run frontend tests (Next.js/React)"""
        self._print_header("Frontend Tests", "🎨")
        
        # Check if package.json exists
        package_json = self.frontend_dir / "package.json"
        if not package_json.exists():
            self._print_error("Frontend package.json not found")
            return False
            
        return self._run_command(
            ["npm", "test"],
            self.frontend_dir,
            "Frontend test suite"
        )
    
    def test_backend(self) -> bool:
        """Run backend tests (Python/FastAPI)"""
        self._print_header("Backend Tests", "🐍")
        
        # Check if run_tests.py exists
        test_script = self.backend_dir / "run_tests.py"
        if not test_script.exists():
            self._print_error("Backend test script not found")
            return False
            
        return self._run_command(
            ["python", "run_tests.py"],
            self.backend_dir,
            "Backend test suite"
        )
    
    def test_all(self) -> bool:
        """Run all tests (backend + frontend)"""
        self._print_header("Full Test Suite", "🚀")
        
        start_time = time.time()
        
        # Run backend tests first
        backend_success = self.test_backend()
        
        # Run frontend tests
        frontend_success = self.test_frontend()
        
        # Summary
        elapsed = time.time() - start_time
        self._print_header("Test Summary", "📊")
        
        if backend_success:
            self._print_success("Backend tests: PASSED")
        else:
            self._print_error("Backend tests: FAILED")
            
        if frontend_success:
            self._print_success("Frontend tests: PASSED")
        else:
            self._print_error("Frontend tests: FAILED")
            
        overall_success = backend_success and frontend_success
        
        if overall_success:
            self._print_success(f"🎉 All tests passed! ({elapsed:.1f}s)")
        else:
            self._print_error(f"❌ Some tests failed ({elapsed:.1f}s)")
            
        return overall_success
    
    def dev_frontend(self) -> bool:
        """Start frontend development server"""
        self._print_header("Frontend Dev Server", "🎨")
        
        return self._run_command(
            ["npm", "run", "dev"],
            self.frontend_dir,
            "Frontend development server"
        )
    
    def dev_backend(self) -> bool:
        """Start backend development server"""
        self._print_header("Backend Dev Server", "🐍")
        
        return self._run_command(
            ["python", "main.py"],
            self.backend_dir,
            "Backend development server"
        )
    
    def validate_frontend(self) -> bool:
        """Run frontend validation (type-check + lint + test)"""
        self._print_header("Frontend Validation", "🔍")
        
        # Check if package.json exists
        package_json = self.frontend_dir / "package.json"
        if not package_json.exists():
            self._print_error("Frontend package.json not found")
            return False
            
        return self._run_command(
            ["npm", "run", "validate"],
            self.frontend_dir,
            "Frontend validation (type-check + lint + test)"
        )
    
    def show_status(self):
        """Show project status and environment info"""
        self._print_header("Capital Craft Status", "🌊")
        
        # System info
        print(f"{Colors.BOLD}System Information:{Colors.END}")
        print(f"  OS: {platform.system()} {platform.release()}")
        print(f"  Python: {sys.version.split()[0]}")
        print(f"  Architecture: {platform.machine()}")
        
        # Project structure
        print(f"\n{Colors.BOLD}Project Structure:{Colors.END}")
        print(f"  Root: {self.root_dir}")
        print(f"  Frontend: {'✅' if self.frontend_dir.exists() else '❌'} {self.frontend_dir}")
        print(f"  Backend: {'✅' if self.backend_dir.exists() else '❌'} {self.backend_dir}")
        
        # Dependencies
        print(f"\n{Colors.BOLD}Dependencies:{Colors.END}")
        
        # Check Node.js
        try:
            result = subprocess.run(["node", "--version"], capture_output=True, text=True)
            if result.returncode == 0:
                print(f"  Node.js: ✅ {result.stdout.strip()}")
            else:
                print(f"  Node.js: ❌ Not found")
        except FileNotFoundError:
            print(f"  Node.js: ❌ Not installed")
            
        # Check npm
        try:
            result = subprocess.run(["npm", "--version"], capture_output=True, text=True)
            if result.returncode == 0:
                print(f"  npm: ✅ {result.stdout.strip()}")
            else:
                print(f"  npm: ❌ Not found")
        except FileNotFoundError:
            print(f"  npm: ❌ Not installed")


def main():
    """Main entry point with argument parsing"""
    parser = argparse.ArgumentParser(
        description="🌊 Capital Craft Universal Task Runner",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run.py test front     # Run frontend tests
  python run.py test back      # Run backend tests  
  python run.py test all       # Run all tests
  python run.py dev front      # Start frontend dev server
  python run.py dev back       # Start backend dev server
  python run.py validate front # Validate frontend (type-check + lint + test)
  python run.py status         # Show project status

Following Clean Architecture and SOLID principles 🌊
        """
    )
    
    parser.add_argument(
        "command", 
        choices=["test", "dev", "validate", "status"],
        help="Command to execute"
    )
    
    parser.add_argument(
        "target", 
        nargs="?",
        choices=["front", "back", "all"],
        help="Target (front/back/all)"
    )
    
    # Parse arguments
    if len(sys.argv) == 1:
        parser.print_help()
        return
        
    args = parser.parse_args()
    
    # Initialize runner
    runner = TaskRunner()
    
    # Print startup message
    print(f"{Colors.CYAN}{Colors.BOLD}🌊 Capital Craft Task Runner{Colors.END}")
    print(f"{Colors.CYAN}Clean Architecture • Cross-Platform • SOLID Principles{Colors.END}")
    print(f"{Colors.CYAN}Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Colors.END}")
    
    # Execute commands
    success = True
    
    if args.command == "status":
        runner.show_status()
        
    elif args.command == "test":
        if args.target == "front":
            success = runner.test_frontend()
        elif args.target == "back":
            success = runner.test_backend()
        elif args.target == "all":
            success = runner.test_all()
        else:
            print(f"{Colors.RED}❌ Please specify target: front, back, or all{Colors.END}")
            parser.print_help()
            success = False
            
    elif args.command == "dev":
        if args.target == "front":
            success = runner.dev_frontend()
        elif args.target == "back":
            success = runner.dev_backend()
        else:
            print(f"{Colors.RED}❌ Please specify target: front or back{Colors.END}")
            parser.print_help()
            success = False
            
    elif args.command == "validate":
        if args.target == "front":
            success = runner.validate_frontend()
        else:
            print(f"{Colors.RED}❌ Please specify target: front{Colors.END}")
            parser.print_help()
            success = False
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
