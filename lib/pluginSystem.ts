// Basic plugin system for extensibility
export interface Plugin {
  id: string;
  name: string;
  version: string;
  description?: string;
  activate: (context: PluginContext) => void;
  deactivate?: () => void;
}

export interface PluginContext {
  registerCommand: (command: any) => void;
  // Add more APIs as needed
}

class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private activePlugins: Set<string> = new Set();

  registerPlugin(plugin: Plugin) {
    if (this.plugins.has(plugin.id)) {
      console.warn(`Plugin ${plugin.id} already registered`);
      return;
    }
    this.plugins.set(plugin.id, plugin);
  }

  async loadPlugins() {
    // Load plugins from extensions folder
    const extensions = ['git-skill', 'react-snippets', 'test-runner'];
    for (const ext of extensions) {
      try {
        const module = await import(`../extensions/${ext}/index.ts`);
        if (module.default && typeof module.default.activate === 'function') {
          this.registerPlugin(module.default);
        }
      } catch (error) {
        console.error(`Failed to load plugin ${ext}:`, error);
      }
    }
  }

  activatePlugin(id: string) {
    const plugin = this.plugins.get(id);
    if (!plugin) {
      console.error(`Plugin ${id} not found`);
      return;
    }
    if (this.activePlugins.has(id)) {
      console.warn(`Plugin ${id} already active`);
      return;
    }

    const context: PluginContext = {
      registerCommand: (command) => {
        // Integrate with command registry
        console.log(`Registering command from plugin ${id}:`, command);
      }
    };

    try {
      plugin.activate(context);
      this.activePlugins.add(id);
      console.log(`Plugin ${id} activated`);
    } catch (error) {
      console.error(`Failed to activate plugin ${id}:`, error);
    }
  }

  deactivatePlugin(id: string) {
    const plugin = this.plugins.get(id);
    if (!plugin || !this.activePlugins.has(id)) return;

    if (plugin.deactivate) {
      plugin.deactivate();
    }
    this.activePlugins.delete(id);
    console.log(`Plugin ${id} deactivated`);
  }

  getPlugins() {
    return Array.from(this.plugins.values());
  }

  getActivePlugins() {
    return Array.from(this.activePlugins).map(id => this.plugins.get(id)!);
  }
}

export const pluginManager = new PluginManager();