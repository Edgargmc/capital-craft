"""
📁 FILE: run_tests.py

Script to run all backend tests - Updated for organized structure
"""
import subprocess
import sys
import os


def install_pytest_if_needed():
    """Install pytest and required testing dependencies if not available"""
    try:
        import pytest
        print("✅ pytest is available")
    except ImportError:
        print("📦 Installing pytest...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pytest", "pytest-asyncio"])
        print("✅ pytest installed")
    
    # Check for additional testing dependencies
    try:
        import httpx
        import pytest_postgresql
        print("✅ Testing dependencies available")
    except ImportError:
        print("📦 Installing additional testing dependencies...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "httpx", "pytest-postgresql"])
        print("✅ Testing dependencies installed")


def run_unit_tests():
    """Run all unit tests"""
    print("🧪 Running Unit Tests...")
    print("=" * 50)
    
    try:
        result = subprocess.run([
            sys.executable, "-m", "pytest", 
            "tests/unit/",
            "-v", "--tb=short"
        ], capture_output=True, text=True)
        
        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
        
        return result.returncode == 0
        
    except Exception as e:
        print(f"❌ Error running unit tests: {e}")
        return False


def run_integration_tests():
    """Run all integration tests"""
    print("\n🔧 Running Integration Tests...")
    print("=" * 50)
    
    try:
        result = subprocess.run([
            sys.executable, "-m", "pytest", 
            "tests/integration/",
            "-v", "--tb=short", "--forked"
        ], capture_output=True, text=True)
        
        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
        
        return result.returncode == 0
        
    except Exception as e:
        print(f"❌ Error running integration tests: {e}")
        return False


def run_all_tests_combined():
    """Run all tests together with forked isolation"""
    print("\n🚀 Running ALL Tests Together with --forked...")
    print("=" * 50)
    
    try:
        result = subprocess.run([
            sys.executable, "-m", "pytest", 
            "tests/",
            "-v", "--tb=short", "--forked"
        ], capture_output=True, text=True)
        
        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
        
        return result.returncode == 0
        
    except Exception as e:
        print(f"❌ Error running all tests: {e}")
        return False


def run_specific_category(category):
    """Run specific test category"""
    print(f"\n🎯 Running {category.upper()} Tests Only...")
    print("=" * 50)
    
    try:
        result = subprocess.run([
            sys.executable, "-m", "pytest", 
            f"tests/{category}/",
            "-v", "--tb=short"
        ], capture_output=True, text=True)
        
        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
        
        return result.returncode == 0
        
    except Exception as e:
        print(f"❌ Error running {category} tests: {e}")
        return False


def run_auth_tests_only():
    """Run only authentication-related tests"""
    print("\n🔐 Running Authentication Tests Only...")
    print("=" * 50)
    
    try:
        result = subprocess.run([
            sys.executable, "-m", "pytest", 
            "tests/unit/test_jwt_manager.py",
            "tests/unit/test_user_entity.py", 
            "tests/integration/test_user_repository.py",
            "tests/integration/test_auth_api.py",
            "tests/integration/test_auth_flow_e2e.py",
            "-v", "--tb=short"
        ], capture_output=True, text=True)
        
        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
        
        return result.returncode == 0
        
    except Exception as e:
        print(f"❌ Error running authentication tests: {e}")
        return False


def run_tests_organized():
    """Run tests in organized manner - unit first, then integration"""
    print("🚀 Running Backend Tests - Organized Approach")
    print("=" * 60)
    
    # Install pytest if needed
    install_pytest_if_needed()
    
    # Track results
    results = {}
    
    # Run unit tests first
    results['unit_tests'] = run_unit_tests()
    
    # Run integration tests
    results['integration_tests'] = run_integration_tests()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 60)
    
    all_passed = True
    for test_name, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"   {test_name}: {status}")
        if not passed:
            all_passed = False
    
    print("\n" + "=" * 60)
    if all_passed:
        print("🎉 ALL TESTS PASSED! Backend is healthy! 🚀")
        print("\n📋 Test Structure:")
        print("   ✅ Unit Tests: tests/unit/ (entities, use cases, JWT, User)")
        print("   ✅ Integration Tests: tests/integration/ (API endpoints, database, E2E auth)")
        print("   🔐 Authentication Tests: JWT Manager, User Entity, PostgreSQL Repository")
        print("   🌐 API Tests: Auth endpoints, OAuth flows, error handling")
        print("   🔄 E2E Tests: Complete authentication flows, concurrent operations")
    else:
        print("⚠️  Some tests failed. Check output above for details.")
    
    return all_passed


def run_tests_combined():
    """Run all tests together - simple approach"""
    print("🚀 Running ALL Backend Tests - Combined Approach")
    print("=" * 60)
    
    # Install pytest if needed
    install_pytest_if_needed()
    
    # Run all tests
    success = run_all_tests_combined()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 ALL TESTS PASSED! Backend is healthy! 🚀")
    else:
        print("⚠️  Some tests failed. Check output above for details.")
    
    return success


if __name__ == "__main__":
    # Check for command line arguments
    if len(sys.argv) > 1:
        arg = sys.argv[1].lower()
        
        if arg == "unit":
            success = run_specific_category("unit")
        elif arg == "integration":
            success = run_specific_category("integration")
        elif arg == "auth":
            success = run_auth_tests_only()
        elif arg == "organized":
            success = run_tests_organized()
        elif arg == "combined":
            success = run_tests_combined()
        else:
            print("Usage: python run_tests.py [unit|integration|auth|organized|combined]")
            print("  unit: Run only unit tests")
            print("  integration: Run only integration tests")
            print("  auth: Run only authentication tests")
            print("  organized: Run unit tests first, then integration")
            print("  combined: Run all tests together")
            sys.exit(1)
    else:
        # Default: run organized approach
        success = run_tests_organized()
    
    sys.exit(0 if success else 1)