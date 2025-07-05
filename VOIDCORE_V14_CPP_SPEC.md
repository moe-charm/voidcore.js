# VoidCore v14.0 - C++ Implementation Specification
## セリンの大改革: 純粋メッセージベースシステム

> 「すべての存在は、メッセージで生まれ、メッセージで終わる」

## 🎯 Core Philosophy

**Zero Inheritance**: 基底クラス継承完全排除
**Pure Messages**: メッセージパッシングのみで協調
**Gentleman's Agreement**: 強制ではなく任意参加の規約
**Composition over Inheritance**: ファクトリパターンで構築

## 📮 Message System

### Message Structure
```cpp
struct Message {
    std::string id;              // "msg_1234567890_abc123def"
    std::string type;            // Specific action/event name
    std::string category;        // "Notice", "IntentRequest", "IntentResponse", "Proposal"
    nlohmann::json payload;      // Arbitrary data
    uint64_t timestamp;          // Unix timestamp in ms
    
    // Category-specific fields
    std::optional<std::string> target;       // For IntentRequest
    std::optional<std::string> action;       // For IntentRequest/Response
    std::optional<std::string> event_name;   // For Notice
    std::optional<std::string> target_plugin; // For Proposal
    std::optional<std::string> suggestion;   // For Proposal
    std::optional<std::string> source;       // Plugin ID that sent this
};
```

### Message Factories
```cpp
class MessageFactory {
public:
    // "Please do X" (1-to-1, command)
    static Message intentRequest(const std::string& target, 
                                const std::string& action, 
                                const nlohmann::json& payload = {});
    
    // "I did X" (1-to-1, response)
    static Message intentResponse(const std::string& action, 
                                 const nlohmann::json& payload = {});
    
    // "X happened" (1-to-many, broadcast)
    static Message notice(const std::string& event_name, 
                         const nlohmann::json& payload = {});
    
    // "Shall we do X?" (1-to-1, suggestion)
    static Message proposal(const std::string& target_plugin, 
                           const std::string& suggestion, 
                           const nlohmann::json& payload = {});
};
```

## 🚀 VoidCore Engine

### Core Interface
```cpp
class VoidCore {
private:
    std::unique_ptr<ChannelManager> channelManager;
    bool initialized = false;
    
public:
    // Initialize the system
    std::future<void> ensureInitialized();
    
    // Subscribe to message category (not specific events)
    void subscribe(const std::string& category, 
                  std::function<void(const Message&)> handler);
    
    // Publish a message
    std::future<int> publish(const Message& message);
    
    // Transport layer swapping (Heart Transplant!)
    std::future<void> setTransport(std::unique_ptr<ITransport> transport);
    
    // Statistics
    Stats getStats() const;
};
```

### ChannelManager Implementation
```cpp
class ChannelManager {
private:
    std::unique_ptr<ITransport> transport;
    std::unordered_map<std::string, std::vector<std::function<void(const Message&)>>> typeToHandlers;
    bool initialized = false;
    
public:
    std::future<void> initialize();
    void subscribe(const std::string& category, std::function<void(const Message&)> handler);
    std::future<int> publish(const Message& message);
    
    // CRITICAL: Filter by message.category, NOT message.type!
    std::function<void(const Message&)> createTypeHandler(
        const std::string& expectedCategory,
        std::function<void(const Message&)> originalHandler
    ) {
        return [expectedCategory, originalHandler](const Message& message) {
            if (message.category == expectedCategory) {
                originalHandler(message);
            }
        };
    }
};
```

## 🤖 Pure Plugin System

### Plugin Factory Pattern
```cpp
struct PluginConfig {
    std::string pluginId;
    std::string name;
    std::string version = "1.0.0";
    std::vector<std::string> capabilities;
    bool autoHealth = true;
    bool autoProcess = true;
};

class Plugin {
private:
    PluginConfig config;
    std::unordered_map<std::string, std::function<void(const Message&)>> handlers;
    nlohmann::json state;
    uint64_t startTime;
    
public:
    // Message sending
    std::future<int> send(const Message& message);
    std::future<int> notice(const std::string& event_name, const nlohmann::json& payload = {});
    std::future<int> request(const std::string& target, const std::string& action, const nlohmann::json& payload = {});
    
    // Message handling
    void on(const std::string& messageType, const std::string& eventName, 
           std::function<void(const Message&, Plugin&)> handler);
    
    // Lifecycle (optional, not inherited!)
    std::future<void> initialize();
    std::future<void> shutdown(const std::string& reason = "Natural shutdown");
    
    // Utilities
    void log(const std::string& message, const std::string& level = "info");
    std::future<void> sleep(int ms);
};

// Factory function (composition, not inheritance!)
std::unique_ptr<Plugin> createPlugin(const PluginConfig& config, 
                                    std::function<void(Plugin&)> customLogic = nullptr);
```

## 🤝 Gentleman's Agreement System

### Health Check Protocol
```cpp
void registerHealthCheck(const std::string& pluginId, const nlohmann::json& customStatus = {}) {
    voidCore.subscribe("IntentRequest", [pluginId, customStatus](const Message& message) {
        if (message.action == "core.health.ping") {
            if (!message.payload.contains("targetPlugin") || 
                message.payload["targetPlugin"] == pluginId) {
                
                nlohmann::json response = {
                    {"pluginId", pluginId},
                    {"status", "OK"},
                    {"timestamp", getCurrentTimestamp()},
                    {"uptime", getCurrentTimestamp() - customStatus.value("startTime", getCurrentTimestamp())}
                };
                
                // Merge custom status
                for (auto& [key, value] : customStatus.items()) {
                    response[key] = value;
                }
                
                voidCore.publish(MessageFactory::intentResponse("core.health.ping", response));
            }
        }
    });
}
```

### Process Declaration System
```cpp
struct ProcessDeclaration {
    std::string pluginId;
    std::string pid;          // Process ID or "browser-tab"
    uint64_t startTime;
    std::string platform;     // "linux", "windows", "browser", etc.
    std::string name;
    std::string version;
};

void declareProcess(const std::string& pluginId, const ProcessDeclaration& info) {
    voidCore.publish(MessageFactory::notice("system.process.declared", nlohmann::json(info)));
    
    // Listen for termination requests (gentleman's agreement)
    voidCore.subscribe("IntentRequest", [pluginId](const Message& message) {
        if (message.action == "system.process.terminate" && 
            message.payload["targetPluginId"] == pluginId) {
            
            bool force = message.payload.value("force", false);
            std::string reason = message.payload.value("reason", "System request");
            
            if (force) {
                std::exit(0);  // Force termination
            } else {
                // Graceful shutdown
                voidCore.publish(MessageFactory::notice("system.process.terminating", {
                    {"pluginId", pluginId},
                    {"reason", reason},
                    {"timestamp", getCurrentTimestamp()}
                }));
                
                // Give plugin 5 seconds to clean up
                std::this_thread::sleep_for(std::chrono::seconds(5));
                std::exit(0);
            }
        }
    });
}
```

## 🔌 Transport Adapter Pattern

### Transport Interface
```cpp
class ITransport {
public:
    virtual ~ITransport() = default;
    virtual std::future<void> initialize() = 0;
    virtual std::future<int> send(const Message& message, const std::string& channel = "default") = 0;
    virtual void subscribe(std::function<void(const Message&)> handler, const std::string& channel = "default") = 0;
    virtual Stats getStats() const = 0;
    virtual std::future<void> destroy() = 0;
};
```

### Default Transport (In-Process)
```cpp
class DefaultTransport : public ITransport {
private:
    std::unordered_map<std::string, std::vector<std::function<void(const Message&)>>> handlers;
    std::atomic<int> messageCount{0};
    bool initialized = false;
    mutable std::shared_mutex handlersMutex;
    
public:
    std::future<void> initialize() override;
    std::future<int> send(const Message& message, const std::string& channel = "default") override;
    void subscribe(std::function<void(const Message&)> handler, const std::string& channel = "default") override;
    Stats getStats() const override;
    std::future<void> destroy() override;
};
```

## 📊 Usage Example

```cpp
int main() {
    // Initialize VoidCore
    VoidCore voidCore;
    voidCore.ensureInitialized().wait();
    
    // Create pure plugin (no inheritance!)
    auto trafficController = createPlugin({
        .pluginId = "traffic-controller",
        .name = "Traffic Light Controller", 
        .capabilities = {"traffic.control"},
        .autoHealth = true
    }, [](Plugin& plugin) {
        // Custom logic
        plugin.on("IntentRequest", "traffic.change", [](const Message& msg, Plugin& self) {
            std::string color = msg.payload["color"];
            self.notice("traffic.changed", {{"color", color}});
        });
    });
    
    // Start the plugin
    trafficController->initialize().wait();
    
    // Send test message
    voidCore.publish(MessageFactory::intentRequest("*", "traffic.change", {{"color", "red"}}));
    
    return 0;
}
```

## 🛠️ Required Dependencies for C++

1. **JSON**: `nlohmann/json` for payload handling
2. **Threading**: `std::future`, `std::async` for async operations  
3. **Networking** (optional): For WebSocket/TCP transports
4. **Logging** (optional): `spdlog` recommended
5. **Testing**: `Catch2` or `gtest`

## 🎯 Key Implementation Notes

1. **No Virtual Inheritance**: Use composition and function pointers
2. **Message Filtering**: Filter by `message.category`, NOT `message.type`
3. **Async Everything**: All operations should return `std::future`
4. **Transport Swapping**: Support runtime transport replacement
5. **Gentleman's Agreement**: Everything optional, nothing forced

## 🌟 セリンの哲学の実現

VoidCore v14.0は「静寂の器」として、メッセージのルーティングのみを担当し、内容には一切関与しません。プラグイン同士は純粋にメッセージのみで協調し、美しい自律システムを構築します。