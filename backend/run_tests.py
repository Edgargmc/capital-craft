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


def run_notification_tests_only():
    """Run only notification-related tests"""
    print("\n🔔 Running Notification Tests Only...")
    print("=" * 50)
    
    try:
        result = subprocess.run([
            sys.executable, "-m", "pytest", 
            "tests/unit/test_notifications.py",
            "tests/unit/test_postgresql_notification_repository.py",
            "tests/test_json_notification_repository.py",
            "tests/test_mark_notification_use_case.py",
            "tests/test_notification_endpoints.py",
            "tests/integration/test_notification_integration.py",
            "tests/integration/test_cross_repository_scenarios.py",
            "tests/integration/test_feature_flag_scenarios.py",
            "-v", "--tb=short"
        ], capture_output=True, text=True)
        
        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
        
        return result.returncode == 0
        
    except Exception as e:
        print(f"❌ Error running notification tests: {e}")
        return False


def run_performance_tests_only():
    """Run only performance benchmark tests"""
    print("\n⚡ Running Performance Benchmark Tests...")
    print("=" * 50)
    
    try:
        result = subprocess.run([
            sys.executable, "-m", "pytest", 
            "tests/performance/",
            "-v", "--tb=short", "-s"  # -s to show print output from benchmarks
        ], capture_output=True, text=True)
        
        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
        
        return result.returncode == 0
        
    except Exception as e:
        print(f"❌ Error running performance tests: {e}")
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
    """Run tests in organized manner - unit first, then integration, then performance"""
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
    
    # Run performance tests (optional, may skip on CI)
    if "--skip-performance" not in sys.argv:
        results['performance_tests'] = run_performance_tests_only()
    else:
        print("⏭️  Skipping performance tests (--skip-performance flag detected)")
    
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
        print("\n📋 Complete Test Structure:")
        print("   ✅ Unit Tests: tests/unit/ (entities, use cases, repositories)")
        print("   ✅ Integration Tests: tests/integration/ (API endpoints, cross-repository, feature flags)")
        print("   ⚡ Performance Tests: tests/performance/ (JSON vs PostgreSQL benchmarks)")
        print("   🔔 Notification Tests: Complete notification system (JSON + PostgreSQL)")
        print("   🔐 Authentication Tests: JWT Manager, User Entity, PostgreSQL Repository")
        print("   🌐 API Tests: All endpoints with Clean Architecture")
        print("   🎯 Feature Flag Tests: Rollout scenarios, user routing, environment configs")
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


def show_help():
    """Show help message with all available options"""
    print("🧪 Backend Test Runner - Updated for Complete Test Suite")
    print("=" * 60)
    print("Usage: python run_tests.py [COMMAND] [OPTIONS]")
    print("\n📋 Available Commands:")
    print("  unit             Run only unit tests")
    print("  integration      Run only integration tests") 
    print("  performance      Run only performance benchmark tests")
    print("  notifications    Run only notification-related tests")
    print("  auth             Run only authentication tests")
    print("  organized        Run unit → integration → performance (default)")
    print("  combined         Run all tests together")
    print("  all              Alias for 'organized'")
    print("\n🔧 Available Options:")
    print("  --skip-performance    Skip performance tests in organized mode")
    print("  --help, -h           Show this help message")
    print("\n💡 Examples:")
    print("  python run_tests.py                    # Run all tests organized")
    print("  python run_tests.py all                # Same as above")
    print("  python run_tests.py notifications      # Test notification system only")
    print("  python run_tests.py organized --skip-performance  # Skip benchmarks")
    print("  python run_tests.py performance        # Run performance benchmarks only")
    print("\n📊 Test Categories:")
    print("  🧪 Unit Tests: 105+ tests (entities, use cases, repositories)")
    print("  🔧 Integration: 27+ tests (APIs, cross-repository, feature flags)")
    print("  ⚡ Performance: 7 benchmarks (JSON vs PostgreSQL)")
    print("  🔔 Notifications: Complete notification system testing")


if __name__ == "__main__":
    # Check for help flags first
    if "--help" in sys.argv or "-h" in sys.argv or (len(sys.argv) > 1 and sys.argv[1].lower() in ["help", "--help", "-h"]):
        show_help()
        sys.exit(0)
    
    # Check for command line arguments
    if len(sys.argv) > 1:
        arg = sys.argv[1].lower()
        
        if arg == "unit":
            success = run_specific_category("unit")
        elif arg == "integration":
            success = run_specific_category("integration")
        elif arg == "performance":
            success = run_performance_tests_only()
        elif arg == "notifications":
            success = run_notification_tests_only()
        elif arg == "auth":
            success = run_auth_tests_only()
        elif arg == "organized" or arg == "all":
            success = run_tests_organized()
        elif arg == "combined":
            success = run_tests_combined()
        else:
            print(f"❌ Unknown command: {arg}")
            print("Use 'python run_tests.py --help' for available options")
            sys.exit(1)
    else:
        # Default: run organized approach
        success = run_tests_organized()
    
    sys.exit(0 if success else 1)