/**
 * Dependency Injection Container Tests
 * 
 * These tests verify that the DI container is properly configured
 * and can resolve dependencies correctly.
 */

import { container } from 'tsyringe';
import { configureContainer, resetContainer, resolve, getContainer } from '../container';

describe('DI Container Configuration', () => {
  beforeEach(() => {
    // Reset container before each test
    resetContainer();
  });

  afterEach(() => {
    // Clean up after each test
    resetContainer();
  });

  describe('configureContainer', () => {
    it('should initialize container without errors', () => {
      expect(() => configureContainer()).not.toThrow();
    });

    it('should be callable multiple times without errors', () => {
      expect(() => {
        configureContainer();
        configureContainer();
      }).not.toThrow();
    });
  });

  describe('getContainer', () => {
    it('should return the TSyringe container instance', () => {
      const containerInstance = getContainer();
      expect(containerInstance).toBe(container);
    });
  });

  describe('resetContainer', () => {
    it('should clear all container instances', () => {
      // Register a test class
      class TestClass {
        value = 'test';
      }
      
      container.registerSingleton(TestClass, TestClass);
      const instance1 = container.resolve(TestClass);
      
      // Reset container
      resetContainer();
      
      // Re-register and resolve - should be a new instance
      container.registerSingleton(TestClass, TestClass);
      const instance2 = container.resolve(TestClass);
      
      // Instances should be different after reset
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('resolve', () => {
    it('should resolve registered class dependencies', () => {
      class TestService {
        getValue(): string {
          return 'test-value';
        }
      }
      
      container.register(TestService, { useClass: TestService });
      
      const service = resolve(TestService);
      expect(service).toBeInstanceOf(TestService);
      expect(service.getValue()).toBe('test-value');
    });

    it('should resolve registered interface dependencies', () => {
      interface ITestService {
        getValue(): string;
      }
      
      class TestServiceImpl implements ITestService {
        getValue(): string {
          return 'test-value';
        }
      }
      
      container.registerSingleton<ITestService>('ITestService', TestServiceImpl);
      
      const service = resolve<ITestService>('ITestService');
      expect(service.getValue()).toBe('test-value');
    });

    it('should auto-resolve unregistered class dependencies', () => {
      // TSyringe auto-resolves classes even if not explicitly registered
      class UnregisteredClass {
        value = 'auto-resolved';
      }
      
      const instance = resolve(UnregisteredClass);
      expect(instance).toBeInstanceOf(UnregisteredClass);
      expect(instance.value).toBe('auto-resolved');
    });
  });

  describe('Lifecycle Management', () => {
    it('should return same instance for singleton registration', () => {
      class SingletonService {
        value = Math.random();
      }
      
      container.registerSingleton(SingletonService, SingletonService);
      
      const instance1 = resolve(SingletonService);
      const instance2 = resolve(SingletonService);
      
      expect(instance1).toBe(instance2);
      expect(instance1.value).toBe(instance2.value);
    });

    it('should return different instances for transient registration', () => {
      class TransientService {
        value = Math.random();
      }
      
      container.register(TransientService, { useClass: TransientService });
      
      const instance1 = resolve(TransientService);
      const instance2 = resolve(TransientService);
      
      expect(instance1).not.toBe(instance2);
      expect(instance1.value).not.toBe(instance2.value);
    });
  });

  describe('Dependency Injection', () => {
    it('should inject dependencies through constructor', () => {
      // Mock repository interface
      interface IRepository {
        getData(): string;
      }
      
      // Mock repository implementation
      class MockRepository implements IRepository {
        getData(): string {
          return 'mock-data';
        }
      }
      
      // Service that depends on repository
      class ServiceWithDependency {
        constructor(private repository: IRepository) {}
        
        execute(): string {
          return this.repository.getData();
        }
      }
      
      // Register dependencies
      container.registerSingleton<IRepository>('IRepository', MockRepository);
      
      // Manually create service with injected dependency
      const repository = resolve<IRepository>('IRepository');
      const service = new ServiceWithDependency(repository);
      
      expect(service.execute()).toBe('mock-data');
    });
  });

  describe('Child Container', () => {
    it('should create isolated child container', () => {
      class TestService {
        value = 'parent';
      }
      
      // Register in parent container
      container.registerSingleton(TestService, TestService);
      const parentInstance = resolve(TestService);
      
      // Create child container
      const childContainer = container.createChildContainer();
      
      // Override in child container
      class ChildTestService extends TestService {
        value = 'child';
      }
      childContainer.registerSingleton(TestService, ChildTestService);
      const childInstance = childContainer.resolve(TestService);
      
      // Parent and child should have different instances
      expect(parentInstance.value).toBe('parent');
      expect(childInstance.value).toBe('child');
    });
  });
});
