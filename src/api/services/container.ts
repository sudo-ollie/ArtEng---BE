class ServiceContainer {
  private services: Map<string, any> = new Map();

  register<T>(name: string, instance: T): void {
    this.services.set(name, instance);
  }

  get<T>(name: string): T {
    if (!this.services.has(name)) {
      throw new Error(`Service ${name} not registered`);
    }
    return this.services.get(name) as T;
  }
}

export const container = new ServiceContainer();