# 📚 VoidCore v14.0 C++ API Reference

> **完全なC++ API仕様書** - クラス・メソッド・データ構造の詳細リファレンス

## 📋 目次

1. [メッセージシステム](#message-system)
2. [プラグインシステム](#plugin-system)
3. [Intentシステム](#intent-system)
4. [統合管理システム](#unified-managers)
5. [通信システム](#communication-system)
6. [Transportシステム](#transport-system)
7. [統計・監視システム](#stats-monitoring)
8. [ユーティリティ](#utilities)

## 🔒 名前空間

```cpp
namespace voidcore {
    // Core classes
    namespace core { /* VoidCore, VoidCoreBase */ }
    
    // Message system
    namespace message { /* VoidMessage, MessageCategory */ }
    
    // Plugin system
    namespace plugin { /* IPlugin, UnifiedPluginManager */ }
    
    // Intent system
    namespace intent { /* UnifiedIntentHandler, SystemIntents */ }
    
    // Communication
    namespace communication { /* CoreMessageBus, DirectUIChannel */ }
    
    // Transport
    namespace transport { /* Transport, WebSocketTransport */ }
    
    // Statistics
    namespace stats { /* UnifiedStatsManager */ }
    
    // Utilities
    namespace utils { /* Logger, TimeUtils */ }
}
```

## 📨 Message System {#message-system}

### MessageCategory

```cpp
namespace voidcore::message {

enum class MessageCategory : uint8_t {
    IntentRequest = 0,   // 「〜してください」(1対1要求)
    IntentResponse = 1,  // 「〜しました」(1対1応答)
    Notice = 2,          // 「〜が起きた」(1対多通知)
    Proposal = 3         // 「〜しませんか」(1対1提案)
};

// String conversion
std::string to_string(MessageCategory category);
MessageCategory message_category_from_string(const std::string& str);

} // namespace voidcore::message
```

### VoidMessage

```cpp
namespace voidcore::message {

struct VoidMessage {
    // Required fields
    std::string id;                    // Unique message ID
    std::string type;                  // Message type (e.g., "plugin.execute")
    MessageCategory category;          // Message category
    nlohmann::json payload;           // Message payload
    uint64_t timestamp;               // Timestamp (milliseconds since epoch)
    
    // Optional fields (category-specific)
    std::optional<std::string> target;         // IntentRequest: target plugin ID
    std::optional<std::string> action;         // IntentRequest/Response: action name
    std::optional<std::string> event_name;     // Notice: event name
    std::optional<std::string> target_plugin;  // Proposal: target plugin ID
    std::optional<std::string> suggestion;     // Proposal: suggestion text
    
    // Constructors
    VoidMessage();
    VoidMessage(MessageCategory category, const std::string& type);
    VoidMessage(MessageCategory category, const std::string& type, const nlohmann::json& payload);
    
    // Serialization
    nlohmann::json to_json() const;
    static VoidMessage from_json(const nlohmann::json& j);
    std::string serialize() const;
    static VoidMessage deserialize(const std::string& data);
    
    // Validation
    bool is_valid() const;
    std::vector<std::string> validate() const;
    
    // Utility methods
    bool is_intent_request() const { return category == MessageCategory::IntentRequest; }
    bool is_intent_response() const { return category == MessageCategory::IntentResponse; }
    bool is_notice() const { return category == MessageCategory::Notice; }
    bool is_proposal() const { return category == MessageCategory::Proposal; }
    
    // Static factory methods
    static VoidMessage create_intent_request(const std::string& intent, 
                                            const nlohmann::json& payload = {},
                                            const std::string& target = "");
    
    static VoidMessage create_intent_response(const std::string& action,
                                             const nlohmann::json& payload = {});
    
    static VoidMessage create_notice(const std::string& event_name,
                                    const nlohmann::json& payload = {});
    
    static VoidMessage create_proposal(const std::string& suggestion,
                                      const std::string& target_plugin,
                                      const nlohmann::json& payload = {});
};

// Operators
bool operator==(const VoidMessage& lhs, const VoidMessage& rhs);
bool operator!=(const VoidMessage& lhs, const VoidMessage& rhs);
std::ostream& operator<<(std::ostream& os, const VoidMessage& msg);

} // namespace voidcore::message
```

### MessageIDGenerator

```cpp
namespace voidcore::message {

class MessageIDGenerator {
public:
    // Generate unique message ID
    static std::string generate();
    
    // Generate with custom prefix
    static std::string generate(const std::string& prefix);
    
    // Set custom random generator
    static void set_random_generator(std::function<std::string(size_t)> generator);
    
private:
    static std::string generate_random_string(size_t length);
    static std::function<std::string(size_t)> random_generator_;
    static std::atomic<uint64_t> counter_;
};

} // namespace voidcore::message
```

## 🧩 Plugin System {#plugin-system}

### PluginStatus

```cpp
namespace voidcore::plugin {

enum class PluginStatus : uint8_t {
    Inactive = 0,    // プラグイン非アクティブ
    Active = 1,      // プラグイン稼働中
    Destroyed = 2,   // プラグイン削除済み
    Error = 3        // プラグインエラー状態
};

std::string to_string(PluginStatus status);
PluginStatus plugin_status_from_string(const std::string& str);

} // namespace voidcore::plugin
```

### IPlugin

```cpp
namespace voidcore::plugin {

class IPlugin {
public:
    struct Config {
        std::string id;                           // Unique plugin ID
        std::string type;                         // Plugin type
        std::weak_ptr<voidcore::core::VoidCore> parent;  // Parent VoidCore
        std::string displayName;                  // Display name
        nlohmann::json metadata;                 // Plugin metadata
        
        // Validation
        bool is_valid() const;
        std::vector<std::string> validate() const;
    };
    
    // Constructor & Destructor
    explicit IPlugin(const Config& config);
    virtual ~IPlugin() = default;
    
    // Core interface (must be implemented)
    virtual std::future<nlohmann::json> handleMessage(const message::VoidMessage& message) = 0;
    
    // Standard message handling
    std::future<nlohmann::json> handleIntent(const message::VoidMessage& message);
    virtual std::future<nlohmann::json> handleCustomIntent(const message::VoidMessage& message);
    
    // Lifecycle methods
    virtual std::future<nlohmann::json> handleGetInfo(const message::VoidMessage& message);
    virtual std::future<nlohmann::json> handleUpdateConfig(const message::VoidMessage& message);
    virtual std::future<nlohmann::json> handleDestroy(const message::VoidMessage& message);
    
    // Accessors
    const std::string& getId() const { return id_; }
    const std::string& getType() const { return type_; }
    const std::string& getDisplayName() const { return displayName_; }
    PluginStatus getStatus() const { return status_; }
    const nlohmann::json& getMetadata() const { return metadata_; }
    
    // Status management
    void setStatus(PluginStatus status) { status_ = status; }
    bool isActive() const { return status_ == PluginStatus::Active; }
    bool isDestroyed() const { return status_ == PluginStatus::Destroyed; }
    
    // Parent access
    std::shared_ptr<voidcore::core::VoidCore> getParent() const { return parent_.lock(); }
    
protected:
    // Logging
    void log(const std::string& message, 
             utils::LogLevel level = utils::LogLevel::Info) const;
    
    // Configuration access
    nlohmann::json getConfig() const { return config_; }
    void updateConfig(const nlohmann::json& newConfig);
    
private:
    std::string id_;
    std::string type_;
    std::weak_ptr<voidcore::core::VoidCore> parent_;
    std::string displayName_;
    nlohmann::json metadata_;
    std::atomic<PluginStatus> status_;
    nlohmann::json config_;
    mutable std::mutex config_mutex_;
};

} // namespace voidcore::plugin
```

### UnifiedPluginManager

```cpp
namespace voidcore::plugin {

class UnifiedPluginManager {
public:
    using PluginPtr = std::shared_ptr<IPlugin>;
    using PluginFactory = std::function<PluginPtr(const IPlugin::Config&)>;
    using PluginFilter = std::function<bool(const PluginPtr&)>;
    
    // Constructor & Destructor
    UnifiedPluginManager();
    ~UnifiedPluginManager();
    
    // Plugin lifecycle
    std::future<PluginPtr> createPlugin(const std::string& type, 
                                        const IPlugin::Config& config);
    std::future<bool> registerPlugin(PluginPtr plugin);
    std::future<bool> destroyPlugin(const std::string& id);
    
    // Plugin queries
    PluginPtr getPlugin(const std::string& id) const;
    std::vector<PluginPtr> getPluginsByType(const std::string& type) const;
    std::vector<PluginPtr> getChildPlugins(const std::string& parentId) const;
    std::vector<PluginPtr> getAllPlugins() const;
    std::vector<PluginPtr> findPlugins(PluginFilter filter) const;
    
    // Plugin status queries
    std::vector<PluginPtr> getActivePlugins() const;
    std::vector<PluginPtr> getInactivePlugins() const;
    size_t getPluginCount() const;
    size_t getPluginCountByType(const std::string& type) const;
    
    // Factory management
    void registerFactory(const std::string& type, PluginFactory factory);
    void unregisterFactory(const std::string& type);
    bool hasFactory(const std::string& type) const;
    std::vector<std::string> getRegisteredTypes() const;
    
    // Plugin operations
    std::future<bool> activatePlugin(const std::string& id);
    std::future<bool> deactivatePlugin(const std::string& id);
    std::future<bool> updatePluginConfig(const std::string& id, 
                                         const nlohmann::json& config);
    
    // Batch operations
    std::future<std::vector<bool>> createPlugins(
        const std::vector<std::pair<std::string, IPlugin::Config>>& plugins);
    std::future<std::vector<bool>> destroyPlugins(const std::vector<std::string>& ids);
    
    // Statistics
    struct Stats {
        size_t totalPlugins;
        size_t activePlugins;
        size_t inactivePlugins;
        size_t destroyedPlugins;
        size_t errorPlugins;
        std::unordered_map<std::string, size_t> typeDistribution;
        std::unordered_map<std::string, size_t> parentDistribution;
        uint64_t totalCreated;
        uint64_t totalDestroyed;
        std::chrono::steady_clock::time_point startTime;
    };
    
    Stats getStats() const;
    nlohmann::json getStatsJson() const;
    
    // Events
    using PluginEventHandler = std::function<void(const std::string& pluginId, 
                                                  const std::string& event)>;
    void setPluginEventHandler(PluginEventHandler handler);
    
private:
    using PluginMap = std::unordered_map<std::string, PluginPtr>;
    using TypeIndex = std::unordered_map<std::string, std::unordered_set<std::string>>;
    using FactoryMap = std::unordered_map<std::string, PluginFactory>;
    
    PluginMap plugins_;
    TypeIndex pluginsByType_;
    TypeIndex pluginsByParent_;
    FactoryMap factories_;
    
    mutable std::shared_mutex plugins_mutex_;
    mutable std::shared_mutex indices_mutex_;
    mutable std::shared_mutex factories_mutex_;
    
    // Statistics
    mutable Stats stats_;
    mutable std::mutex stats_mutex_;
    
    // Events
    PluginEventHandler eventHandler_;
    std::mutex event_mutex_;
    
    // Internal methods
    void updateIndices(const PluginPtr& plugin, bool add);
    void fireEvent(const std::string& pluginId, const std::string& event);
    void updateStats();
};

} // namespace voidcore::plugin
```

## 🎯 Intent System {#intent-system}

### Intent Constants

```cpp
namespace voidcore::intent {

// System Intents
namespace SystemIntents {
    constexpr const char* CREATE_PLUGIN = "system.createPlugin";
    constexpr const char* REPARENT_PLUGIN = "system.reparentPlugin";
    constexpr const char* DESTROY_PLUGIN = "system.destroyPlugin";
    constexpr const char* GET_STATS = "system.getStats";
    constexpr const char* BOOT_READY = "system.boot.ready";
    constexpr const char* FUSION_FUSE = "system.fusion.fuse";
    constexpr const char* SHUTDOWN = "system.shutdown";
}

// Plugin Intents
namespace PluginIntents {
    constexpr const char* GET_INFO = "plugin.getInfo";
    constexpr const char* UPDATE_CONFIG = "plugin.updateConfig";
    constexpr const char* EXECUTE = "plugin.execute";
    constexpr const char* DESTROY = "plugin.destroy";
    constexpr const char* ACTIVATE = "plugin.activate";
    constexpr const char* DEACTIVATE = "plugin.deactivate";
}

// UI Intents
namespace UIIntents {
    constexpr const char* CREATE_ELEMENT = "ui.createElement";
    constexpr const char* UPDATE_ELEMENT = "ui.updateElement";
    constexpr const char* REMOVE_ELEMENT = "ui.removeElement";
    constexpr const char* BATCH_UPDATE = "ui.batchUpdate";
}

// Communication Intents
namespace CommunicationIntents {
    constexpr const char* BROADCAST = "comm.broadcast";
    constexpr const char* SEND_TO_CORE = "comm.sendToCore";
    constexpr const char* REGISTER_CORE = "comm.registerCore";
    constexpr const char* UNREGISTER_CORE = "comm.unregisterCore";
}

} // namespace voidcore::intent
```

### UnifiedIntentHandler

```cpp
namespace voidcore::intent {

class UnifiedIntentHandler {
public:
    using IntentHandler = std::function<std::future<nlohmann::json>(const message::VoidMessage&)>;
    using Middleware = std::function<void(message::VoidMessage&)>;
    using IntentFilter = std::function<bool(const std::string&)>;
    
    // Constructor & Destructor
    UnifiedIntentHandler();
    ~UnifiedIntentHandler();
    
    // Intent registration
    void registerIntent(const std::string& intent, IntentHandler handler);
    void unregisterIntent(const std::string& intent);
    bool hasIntent(const std::string& intent) const;
    std::vector<std::string> getRegisteredIntents() const;
    
    // Intent processing
    std::future<nlohmann::json> handleIntent(const message::VoidMessage& message);
    std::future<std::vector<nlohmann::json>> handleIntents(
        const std::vector<message::VoidMessage>& messages);
    
    // Middleware management
    size_t addMiddleware(Middleware middleware);
    bool removeMiddleware(size_t middlewareId);
    void clearMiddlewares();
    size_t getMiddlewareCount() const;
    
    // Intent filtering
    void setIntentFilter(IntentFilter filter);
    void clearIntentFilter();
    
    // Batch processing
    void enableBatchProcessing(bool enable);
    void setBatchSize(size_t size);
    void setBatchTimeout(std::chrono::milliseconds timeout);
    
    // Statistics
    struct Stats {
        uint64_t totalIntents;
        uint64_t successfulIntents;
        uint64_t failedIntents;
        std::unordered_map<std::string, uint64_t> intentCounts;
        std::unordered_map<std::string, std::chrono::nanoseconds> avgIntentTimes;
        std::unordered_map<std::string, std::chrono::nanoseconds> maxIntentTimes;
        std::chrono::steady_clock::time_point startTime;
    };
    
    Stats getStats() const;
    nlohmann::json getStatsJson() const;
    void resetStats();
    
    // Events
    using IntentEventHandler = std::function<void(const std::string& intent, 
                                                  const std::string& event,
                                                  const nlohmann::json& data)>;
    void setIntentEventHandler(IntentEventHandler handler);
    
private:
    std::unordered_map<std::string, IntentHandler> handlers_;
    std::vector<std::pair<size_t, Middleware>> middlewares_;
    std::atomic<size_t> nextMiddlewareId_{0};
    
    mutable std::shared_mutex handlers_mutex_;
    mutable std::shared_mutex middlewares_mutex_;
    
    // Filtering
    IntentFilter intentFilter_;
    std::mutex filter_mutex_;
    
    // Batch processing
    std::atomic<bool> batchProcessingEnabled_{false};
    std::atomic<size_t> batchSize_{10};
    std::atomic<std::chrono::milliseconds> batchTimeout_{100};
    
    // Statistics
    mutable Stats stats_;
    mutable std::mutex stats_mutex_;
    
    // Events
    IntentEventHandler eventHandler_;
    std::mutex event_mutex_;
    
    // Internal methods
    void processMiddlewares(message::VoidMessage& message);
    void recordIntentStats(const std::string& intent, 
                          std::chrono::nanoseconds duration, 
                          bool success);
    void fireEvent(const std::string& intent, 
                   const std::string& event, 
                   const nlohmann::json& data);
};

} // namespace voidcore::intent
```

## 🚀 Unified Managers {#unified-managers}

### UnifiedStatsManager

```cpp
namespace voidcore::stats {

class UnifiedStatsManager {
public:
    struct SystemStats {
        // Plugin statistics
        uint64_t totalPlugins;
        uint64_t activePlugins;
        uint64_t inactivePlugins;
        uint64_t destroyedPlugins;
        std::unordered_map<std::string, uint64_t> pluginsByType;
        
        // Message statistics
        uint64_t totalMessages;
        uint64_t totalIntents;
        uint64_t totalNotices;
        uint64_t totalProposals;
        std::unordered_map<std::string, uint64_t> messagesByType;
        
        // Intent statistics
        uint64_t successfulIntents;
        uint64_t failedIntents;
        std::unordered_map<std::string, uint64_t> intentCounts;
        std::unordered_map<std::string, std::chrono::nanoseconds> avgIntentTimes;
        
        // Transport statistics
        uint64_t messagesSent;
        uint64_t messagesReceived;
        uint64_t bytesTransferred;
        uint64_t connectionCount;
        
        // System metrics
        std::chrono::steady_clock::time_point uptime;
        double memoryUsageMB;
        double cpuUsagePercent;
        uint64_t threadCount;
        
        // Core statistics
        uint64_t fusedCores;
        std::unordered_map<std::string, uint64_t> coreMessageCounts;
    };
    
    // Constructor & Destructor
    UnifiedStatsManager();
    ~UnifiedStatsManager();
    
    // Stats recording
    void recordPlugin(const std::string& type, const std::string& event);
    void recordMessage(const std::string& type, message::MessageCategory category);
    void recordIntent(const std::string& intent, std::chrono::nanoseconds duration, bool success);
    void recordTransport(const std::string& event, uint64_t bytes = 0);
    void recordCore(const std::string& coreId, const std::string& event);
    
    // Stats retrieval
    SystemStats getStats() const;
    nlohmann::json getStatsJson() const;
    nlohmann::json getFormattedStats() const;
    
    // Specific stats
    nlohmann::json getPluginStats() const;
    nlohmann::json getMessageStats() const;
    nlohmann::json getIntentStats() const;
    nlohmann::json getTransportStats() const;
    nlohmann::json getSystemMetrics() const;
    
    // Real-time monitoring
    void startRealTimeCollection();
    void stopRealTimeCollection();
    bool isCollecting() const { return collecting_; }
    
    // Collection intervals
    void setCollectionInterval(std::chrono::milliseconds interval);
    std::chrono::milliseconds getCollectionInterval() const;
    
    // Stats reset
    void resetStats();
    void resetPluginStats();
    void resetMessageStats();
    void resetIntentStats();
    void resetTransportStats();
    
    // Events
    using StatsEventHandler = std::function<void(const nlohmann::json& stats)>;
    void setStatsEventHandler(StatsEventHandler handler);
    void setStatsUpdateInterval(std::chrono::milliseconds interval);
    
private:
    mutable SystemStats stats_;
    mutable std::shared_mutex stats_mutex_;
    
    std::chrono::steady_clock::time_point startTime_;
    
    // Real-time collection
    std::atomic<bool> collecting_{false};
    std::thread collectionThread_;
    std::atomic<std::chrono::milliseconds> collectionInterval_{1000};
    
    // Events
    StatsEventHandler eventHandler_;
    std::atomic<std::chrono::milliseconds> eventInterval_{5000};
    std::thread eventThread_;
    std::mutex event_mutex_;
    
    // Internal methods
    void updateSystemMetrics();
    void fireStatsEvent();
    double getMemoryUsageMB() const;
    double getCpuUsagePercent() const;
    uint64_t getThreadCount() const;
};

} // namespace voidcore::stats
```

## 🌐 Communication System {#communication-system}

### CoreMessageBus

```cpp
namespace voidcore::communication {

class CoreMessageBus {
public:
    using MessageHandler = std::function<void(const message::VoidMessage&)>;
    using CoreFilter = std::function<bool(const std::string&)>;
    
    // Constructor & Destructor
    CoreMessageBus();
    ~CoreMessageBus();
    
    // Core registration
    void registerCore(const std::string& coreId, MessageHandler handler);
    void unregisterCore(const std::string& coreId);
    bool isRegistered(const std::string& coreId) const;
    std::vector<std::string> getRegisteredCores() const;
    size_t getCoreCount() const;
    
    // Message broadcasting
    void broadcast(const message::VoidMessage& message);
    void broadcastToFiltered(const message::VoidMessage& message, CoreFilter filter);
    void sendToCore(const std::string& coreId, const message::VoidMessage& message);
    
    // Batch operations
    void broadcastBatch(const std::vector<message::VoidMessage>& messages);
    void sendBatchToCore(const std::string& coreId, 
                        const std::vector<message::VoidMessage>& messages);
    
    // Message filtering
    void setGlobalMessageFilter(std::function<bool(const message::VoidMessage&)> filter);
    void clearGlobalMessageFilter();
    
    // Statistics
    struct Stats {
        uint64_t totalBroadcasts;
        uint64_t totalDirectMessages;
        uint64_t totalMessagesDelivered;
        uint64_t totalMessagesFailed;
        std::unordered_map<std::string, uint64_t> coreMessageCounts;
        std::unordered_map<std::string, uint64_t> messageTypeCounts;
        std::chrono::steady_clock::time_point startTime;
    };
    
    Stats getStats() const;
    nlohmann::json getStatsJson() const;
    void resetStats();
    
    // Events
    using BusEventHandler = std::function<void(const std::string& event, 
                                               const nlohmann::json& data)>;
    void setBusEventHandler(BusEventHandler handler);
    
private:
    std::unordered_map<std::string, MessageHandler> cores_;
    mutable std::shared_mutex cores_mutex_;
    
    // Message filtering
    std::function<bool(const message::VoidMessage&)> messageFilter_;
    std::mutex filter_mutex_;
    
    // Statistics
    mutable Stats stats_;
    mutable std::mutex stats_mutex_;
    
    // Events
    BusEventHandler eventHandler_;
    std::mutex event_mutex_;
    
    // Internal methods
    void deliverMessage(const std::string& coreId, const message::VoidMessage& message);
    void recordStats(const std::string& event, const std::string& coreId = "");
    void fireEvent(const std::string& event, const nlohmann::json& data);
};

} // namespace voidcore::communication
```

### DirectUIChannel

```cpp
namespace voidcore::communication {

class DirectUIChannel {
public:
    using UIHandler = std::function<void(const nlohmann::json&)>;
    using UIBatchHandler = std::function<void(const std::vector<nlohmann::json>&)>;
    
    // Constructor & Destructor
    DirectUIChannel();
    ~DirectUIChannel();
    
    // UI communication
    void sendToUI(const nlohmann::json& data);
    void sendBatchToUI(const std::vector<nlohmann::json>& batch);
    
    // Handler management
    void setUIHandler(UIHandler handler);
    void setUIBatchHandler(UIBatchHandler batchHandler);
    void clearHandlers();
    
    // Batching configuration
    void enableBatching(bool enable);
    bool isBatchingEnabled() const { return batchingEnabled_; }
    
    void setBatchSize(size_t size);
    size_t getBatchSize() const { return batchSize_; }
    
    void setBatchInterval(std::chrono::milliseconds interval);
    std::chrono::milliseconds getBatchInterval() const { return batchInterval_; }
    
    // High-frequency event handling
    void enableHighFrequencyMode(bool enable);
    bool isHighFrequencyModeEnabled() const { return highFrequencyMode_; }
    
    void setHighFrequencyThreshold(size_t threshold);
    size_t getHighFrequencyThreshold() const { return highFrequencyThreshold_; }
    
    // Queue management
    size_t getQueueSize() const;
    size_t getBatchBufferSize() const;
    void clearQueue();
    void clearBatchBuffer();
    
    // Statistics
    struct Stats {
        uint64_t totalMessagesSent;
        uint64_t totalBatchesSent;
        uint64_t totalMessagesDropped;
        uint64_t avgBatchSize;
        std::chrono::nanoseconds avgProcessingTime;
        size_t currentQueueSize;
        size_t currentBatchBufferSize;
        std::chrono::steady_clock::time_point startTime;
    };
    
    Stats getStats() const;
    nlohmann::json getStatsJson() const;
    void resetStats();
    
private:
    UIHandler uiHandler_;
    UIBatchHandler uiBatchHandler_;
    std::mutex handlers_mutex_;
    
    // Batching
    std::atomic<bool> batchingEnabled_{false};
    std::atomic<size_t> batchSize_{10};
    std::atomic<std::chrono::milliseconds> batchInterval_{16}; // ~60fps
    
    std::vector<nlohmann::json> batchBuffer_;
    std::mutex batch_mutex_;
    std::condition_variable batch_cv_;
    std::thread batchThread_;
    std::atomic<bool> running_{false};
    
    // High-frequency mode
    std::atomic<bool> highFrequencyMode_{false};
    std::atomic<size_t> highFrequencyThreshold_{100};
    
    // Queue for non-batched messages
    std::queue<nlohmann::json> messageQueue_;
    std::mutex queue_mutex_;
    std::condition_variable queue_cv_;
    std::thread processingThread_;
    
    // Statistics
    mutable Stats stats_;
    mutable std::mutex stats_mutex_;
    
    // Internal methods
    void processBatch();
    void processMessages();
    void updateStats(size_t batchSize, std::chrono::nanoseconds processingTime);
};

} // namespace voidcore::communication
```

## 🚛 Transport System {#transport-system}

### Transport

```cpp
namespace voidcore::transport {

class Transport {
public:
    enum class Status {
        Disconnected,
        Connecting,
        Connected,
        Disconnecting,
        Error
    };
    
    // Constructor & Destructor
    Transport() = default;
    virtual ~Transport() = default;
    
    // Connection management
    virtual std::future<bool> connect() = 0;
    virtual std::future<bool> disconnect() = 0;
    virtual bool isConnected() const = 0;
    virtual Status getStatus() const = 0;
    
    // Message transmission
    virtual std::future<bool> send(const message::VoidMessage& message) = 0;
    virtual std::future<std::vector<bool>> sendBatch(
        const std::vector<message::VoidMessage>& messages) = 0;
    
    // Message reception
    virtual void setReceiveHandler(std::function<void(const message::VoidMessage&)> handler) = 0;
    virtual void clearReceiveHandler() = 0;
    
    // Configuration
    virtual void configure(const nlohmann::json& config) = 0;
    virtual nlohmann::json getConfig() const = 0;
    
    // Statistics
    struct Stats {
        uint64_t messagesSent;
        uint64_t messagesReceived;
        uint64_t bytesSent;
        uint64_t bytesReceived;
        uint64_t connectionAttempts;
        uint64_t successfulConnections;
        uint64_t failedConnections;
        std::chrono::nanoseconds avgSendTime;
        std::chrono::nanoseconds avgReceiveTime;
        std::chrono::steady_clock::time_point startTime;
        std::chrono::steady_clock::time_point lastMessageTime;
    };
    
    virtual Stats getStats() const = 0;
    virtual nlohmann::json getStatsJson() const = 0;
    virtual void resetStats() = 0;
    
    // Events
    using TransportEventHandler = std::function<void(const std::string& event, 
                                                     const nlohmann::json& data)>;
    virtual void setEventHandler(TransportEventHandler handler) = 0;
    virtual void clearEventHandler() = 0;
    
    // Utility
    std::string statusToString(Status status) const;
    static Status statusFromString(const std::string& str);
};

} // namespace voidcore::transport
```

### WebSocketTransport

```cpp
namespace voidcore::transport {

class WebSocketTransport : public Transport {
public:
    struct Config {
        std::string host = "localhost";
        uint16_t port = 8080;
        std::string path = "/";
        bool useSSL = false;
        std::chrono::seconds connectionTimeout{30};
        std::chrono::seconds pingInterval{30};
        size_t maxMessageSize = 1024 * 1024; // 1MB
        bool enableCompression = true;
        
        nlohmann::json to_json() const;
        static Config from_json(const nlohmann::json& j);
    };
    
    // Constructor & Destructor
    explicit WebSocketTransport(const Config& config = {});
    ~WebSocketTransport() override;
    
    // Transport implementation
    std::future<bool> connect() override;
    std::future<bool> disconnect() override;
    bool isConnected() const override;
    Status getStatus() const override;
    
    std::future<bool> send(const message::VoidMessage& message) override;
    std::future<std::vector<bool>> sendBatch(
        const std::vector<message::VoidMessage>& messages) override;
    
    void setReceiveHandler(std::function<void(const message::VoidMessage&)> handler) override;
    void clearReceiveHandler() override;
    
    void configure(const nlohmann::json& config) override;
    nlohmann::json getConfig() const override;
    
    Stats getStats() const override;
    nlohmann::json getStatsJson() const override;
    void resetStats() override;
    
    void setEventHandler(TransportEventHandler handler) override;
    void clearEventHandler() override;
    
    // WebSocket specific methods
    void setServerMode(bool serverMode);
    bool isServerMode() const { return serverMode_; }
    
    void enableHeartbeat(bool enable);
    bool isHeartbeatEnabled() const { return heartbeatEnabled_; }
    
    std::vector<std::string> getConnectedClients() const;
    size_t getClientCount() const;
    
private:
    Config config_;
    std::atomic<Status> status_{Status::Disconnected};
    std::atomic<bool> serverMode_{false};
    std::atomic<bool> heartbeatEnabled_{true};
    
    // WebSocket implementation details
    class Impl;
    std::unique_ptr<Impl> impl_;
    
    // Message handling
    std::function<void(const message::VoidMessage&)> receiveHandler_;
    std::mutex handler_mutex_;
    
    // Event handling
    TransportEventHandler eventHandler_;
    std::mutex event_mutex_;
    
    // Statistics
    mutable Stats stats_;
    mutable std::mutex stats_mutex_;
    
    // Internal methods
    void fireEvent(const std::string& event, const nlohmann::json& data);
    void updateStats(const std::string& operation, size_t bytes, 
                    std::chrono::nanoseconds duration);
};

} // namespace voidcore::transport
```

## 📊 Stats & Monitoring {#stats-monitoring}

### SystemBootManager

```cpp
namespace voidcore::core {

class SystemBootManager {
public:
    enum class SystemStatus {
        Inactive,
        Booting,
        Active,
        ShuttingDown,
        Error
    };
    
    struct BootConfig {
        std::vector<std::string> bootSequence;
        std::chrono::milliseconds bootTimeout{30000};
        bool enableParentChildBooting{true};
        size_t expectedChildCoreCount{0};
        bool enableWatchdog{true};
        std::chrono::milliseconds watchdogInterval{5000};
        
        nlohmann::json to_json() const;
        static BootConfig from_json(const nlohmann::json& j);
    };
    
    // Constructor & Destructor
    explicit SystemBootManager(const BootConfig& config);
    ~SystemBootManager();
    
    // Boot management
    std::future<bool> startBoot();
    std::future<bool> shutdown();
    bool isBootComplete() const { return bootComplete_; }
    SystemStatus getSystemStatus() const { return systemStatus_; }
    
    // Child core management
    void registerChildCore(const std::string& coreId);
    void unregisterChildCore(const std::string& coreId);
    void markChildCoreReady(const std::string& coreId);
    std::vector<std::string> getChildCores() const;
    std::vector<std::string> getReadyChildCores() const;
    
    // Boot sequence management
    void setBootSequence(const std::vector<std::string>& sequence);
    std::vector<std::string> getBootSequence() const;
    std::string getCurrentBootStep() const;
    
    // Plugin management during boot
    void registerManagedPlugin(const std::string& pluginId);
    void unregisterManagedPlugin(const std::string& pluginId);
    std::vector<std::string> getManagedPlugins() const;
    
    // Statistics
    struct BootStats {
        std::chrono::steady_clock::time_point bootStartTime;
        std::chrono::steady_clock::time_point bootEndTime;
        std::chrono::milliseconds totalBootTime;
        std::unordered_map<std::string, std::chrono::milliseconds> stepTimes;
        size_t registeredChildCores;
        size_t readyChildCores;
        size_t managedPlugins;
        SystemStatus currentStatus;
        std::string currentStep;
        bool bootSuccess;
    };
    
    BootStats getBootStats() const;
    nlohmann::json getBootStatsJson() const;
    
    // Events
    using BootEventHandler = std::function<void(const std::string& event, 
                                                const nlohmann::json& data)>;
    void setBootEventHandler(BootEventHandler handler);
    void clearBootEventHandler();
    
private:
    BootConfig config_;
    std::atomic<SystemStatus> systemStatus_{SystemStatus::Inactive};
    std::atomic<bool> bootComplete_{false};
    std::atomic<bool> parentCoreReady_{false};
    
    std::unordered_set<std::string> childCores_;
    std::unordered_set<std::string> readyChildCores_;
    std::unordered_set<std::string> managedPlugins_;
    mutable std::shared_mutex child_cores_mutex_;
    mutable std::shared_mutex plugins_mutex_;
    
    std::vector<std::string> bootSequence_;
    std::atomic<size_t> currentStepIndex_{0};
    mutable std::shared_mutex sequence_mutex_;
    
    // Boot statistics
    mutable BootStats bootStats_;
    mutable std::mutex stats_mutex_;
    
    // Events
    BootEventHandler eventHandler_;
    std::mutex event_mutex_;
    
    // Watchdog
    std::atomic<bool> watchdogEnabled_{false};
    std::thread watchdogThread_;
    
    // Internal methods
    std::future<bool> executeBootSequence();
    bool waitForChildCores();
    void runWatchdog();
    void fireEvent(const std::string& event, const nlohmann::json& data);
    void updateBootStats(const std::string& step, std::chrono::milliseconds duration);
};

} // namespace voidcore::core
```

## 🛠️ Utilities {#utilities}

### Logger

```cpp
namespace voidcore::utils {

enum class LogLevel : uint8_t {
    Trace = 0,
    Debug = 1,
    Info = 2,
    Warning = 3,
    Error = 4,
    Critical = 5
};

class Logger {
public:
    using LogHandler = std::function<void(LogLevel level, 
                                         const std::string& message, 
                                         const std::chrono::system_clock::time_point& timestamp)>;
    
    // Singleton access
    static Logger& getInstance();
    
    // Logging methods
    void trace(const std::string& message);
    void debug(const std::string& message);
    void info(const std::string& message);
    void warning(const std::string& message);
    void error(const std::string& message);
    void critical(const std::string& message);
    
    template<typename... Args>
    void trace(const std::string& format, Args&&... args);
    
    template<typename... Args>
    void debug(const std::string& format, Args&&... args);
    
    template<typename... Args>
    void info(const std::string& format, Args&&... args);
    
    template<typename... Args>
    void warning(const std::string& format, Args&&... args);
    
    template<typename... Args>
    void error(const std::string& format, Args&&... args);
    
    template<typename... Args>
    void critical(const std::string& format, Args&&... args);
    
    // Configuration
    void setLogLevel(LogLevel level);
    LogLevel getLogLevel() const { return logLevel_; }
    
    void setLogHandler(LogHandler handler);
    void clearLogHandler();
    
    void enableConsoleOutput(bool enable);
    bool isConsoleOutputEnabled() const { return consoleOutput_; }
    
    void enableFileOutput(bool enable, const std::string& filename = "");
    bool isFileOutputEnabled() const { return fileOutput_; }
    
    // Utility
    static std::string levelToString(LogLevel level);
    static LogLevel levelFromString(const std::string& str);
    
private:
    Logger() = default;
    ~Logger() = default;
    Logger(const Logger&) = delete;
    Logger& operator=(const Logger&) = delete;
    
    std::atomic<LogLevel> logLevel_{LogLevel::Info};
    std::atomic<bool> consoleOutput_{true};
    std::atomic<bool> fileOutput_{false};
    
    LogHandler logHandler_;
    std::mutex handler_mutex_;
    
    std::ofstream logFile_;
    std::mutex file_mutex_;
    
    void log(LogLevel level, const std::string& message);
    std::string formatMessage(LogLevel level, 
                             const std::string& message, 
                             const std::chrono::system_clock::time_point& timestamp);
};

// Convenience macros
#define VOIDCORE_TRACE(msg) voidcore::utils::Logger::getInstance().trace(msg)
#define VOIDCORE_DEBUG(msg) voidcore::utils::Logger::getInstance().debug(msg)
#define VOIDCORE_INFO(msg) voidcore::utils::Logger::getInstance().info(msg)
#define VOIDCORE_WARNING(msg) voidcore::utils::Logger::getInstance().warning(msg)
#define VOIDCORE_ERROR(msg) voidcore::utils::Logger::getInstance().error(msg)
#define VOIDCORE_CRITICAL(msg) voidcore::utils::Logger::getInstance().critical(msg)

} // namespace voidcore::utils
```

### TimeUtils

```cpp
namespace voidcore::utils {

class TimeUtils {
public:
    // Current time
    static uint64_t getCurrentTimestamp();
    static std::chrono::system_clock::time_point getCurrentTime();
    static std::string getCurrentTimeString();
    static std::string getCurrentISOString();
    
    // Time formatting
    static std::string formatTimestamp(uint64_t timestamp);
    static std::string formatDuration(std::chrono::nanoseconds duration);
    static std::string formatTimePoint(const std::chrono::system_clock::time_point& tp);
    
    // Time conversion
    static uint64_t timePointToTimestamp(const std::chrono::system_clock::time_point& tp);
    static std::chrono::system_clock::time_point timestampToTimePoint(uint64_t timestamp);
    
    // Duration utilities
    static double nanosecondsToMilliseconds(std::chrono::nanoseconds ns);
    static double nanosecondsToSeconds(std::chrono::nanoseconds ns);
    static std::chrono::nanoseconds millisecondsToNanoseconds(double ms);
    static std::chrono::nanoseconds secondsToNanoseconds(double seconds);
    
    // Performance timing
    class Timer {
    public:
        Timer();
        void start();
        void stop();
        void reset();
        std::chrono::nanoseconds elapsed() const;
        double elapsedMilliseconds() const;
        double elapsedSeconds() const;
        bool isRunning() const { return running_; }
        
    private:
        std::chrono::high_resolution_clock::time_point startTime_;
        std::chrono::nanoseconds accumulatedTime_{0};
        bool running_{false};
    };
    
    // Scoped timer for RAII-style timing
    class ScopedTimer {
    public:
        explicit ScopedTimer(std::chrono::nanoseconds& result);
        explicit ScopedTimer(std::function<void(std::chrono::nanoseconds)> callback);
        ~ScopedTimer();
        
    private:
        std::chrono::high_resolution_clock::time_point startTime_;
        std::chrono::nanoseconds* result_;
        std::function<void(std::chrono::nanoseconds)> callback_;
    };
};

// Convenience macros
#define VOIDCORE_TIME_FUNCTION(result) \
    voidcore::utils::TimeUtils::ScopedTimer timer(result)

#define VOIDCORE_TIME_BLOCK(name, result) \
    voidcore::utils::TimeUtils::ScopedTimer timer_##name(result)

} // namespace voidcore::utils
```

## 📋 使用例

### 基本的なVoidCore使用例

```cpp
#include <voidcore/voidcore.hpp>

int main() {
    try {
        // VoidCore作成
        auto voidCore = voidcore::core::VoidCore::create();
        
        // Transport設定
        voidcore::transport::WebSocketTransport::Config transportConfig;
        transportConfig.port = 8080;
        auto transport = std::make_shared<voidcore::transport::WebSocketTransport>(transportConfig);
        voidCore->setTransport(transport);
        
        // カスタムプラグインファクトリー登録
        voidCore->getPluginManager()->registerFactory("calculator", 
            [](const voidcore::plugin::IPlugin::Config& config) {
                return std::make_shared<CalculatorPlugin>(config);
            });
        
        // システム初期化
        if (!voidCore->initialize().get()) {
            VOIDCORE_ERROR("Failed to initialize VoidCore");
            return 1;
        }
        
        // プラグイン作成
        auto plugin = voidCore->createPlugin("calculator", {
            {"displayName", "My Calculator"},
            {"initialValue", 0}
        }).get();
        
        if (plugin) {
            VOIDCORE_INFO("Plugin created: " + plugin->getId());
            
            // プラグイン実行
            auto result = voidCore->sendIntent("plugin.execute", {
                {"operation", "add"},
                {"operands", {5, 3}}
            }, plugin->getId()).get();
            
            VOIDCORE_INFO("Calculation result: " + result.dump());
        }
        
        // システム統計取得
        auto stats = voidCore->getSystemStats().get();
        VOIDCORE_INFO("System stats: " + stats.dump(2));
        
        // メインループ
        while (voidCore->isRunning()) {
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
        }
        
        // シャットダウン
        voidCore->shutdown().wait();
        
    } catch (const std::exception& e) {
        VOIDCORE_ERROR("VoidCore error: " + std::string(e.what()));
        return 1;
    }
    
    return 0;
}
```

### カスタムプラグイン実装例

```cpp
#include <voidcore/plugin/iplugin.hpp>

class CalculatorPlugin : public voidcore::plugin::IPlugin {
public:
    explicit CalculatorPlugin(const Config& config) 
        : IPlugin(config), value_(0.0) {
        
        // 設定から初期値を取得
        if (config.metadata.contains("initialValue")) {
            value_ = config.metadata["initialValue"].get<double>();
        }
    }
    
    std::future<nlohmann::json> handleMessage(const voidcore::message::VoidMessage& message) override {
        return std::async(std::launch::async, [this, message]() -> nlohmann::json {
            log("Handling message: " + message.type);
            
            if (message.is_intent_request()) {
                return handleIntent(message).get();
            }
            
            if (message.type == "calculator.calculate") {
                return performCalculation(message.payload);
            }
            
            return nlohmann::json{{"error", "Unknown message type: " + message.type}};
        });
    }
    
private:
    std::atomic<double> value_;
    mutable std::mutex calculation_mutex_;
    
    nlohmann::json performCalculation(const nlohmann::json& payload) {
        std::lock_guard<std::mutex> lock(calculation_mutex_);
        
        try {
            std::string operation = payload["operation"];
            auto operands = payload["operands"].get<std::vector<double>>();
            
            if (operation == "add") {
                for (double operand : operands) {
                    value_ += operand;
                }
            } else if (operation == "multiply") {
                for (double operand : operands) {
                    value_ *= operand;
                }
            } else if (operation == "set") {
                if (!operands.empty()) {
                    value_ = operands[0];
                }
            } else {
                return nlohmann::json{{"error", "Unknown operation: " + operation}};
            }
            
            return nlohmann::json{
                {"result", value_.load()},
                {"operation", operation},
                {"timestamp", voidcore::utils::TimeUtils::getCurrentTimestamp()}
            };
            
        } catch (const std::exception& e) {
            return nlohmann::json{{"error", "Calculation error: " + std::string(e.what())}};
        }
    }
};
```

---

## 📝 注意事項

### 1. スレッドセーフティ
- すべてのVoidCore APIは並行アクセスに安全です
- プラグイン実装では適切な同期機構を使用してください
- `std::shared_mutex`を読み書き分離に活用してください

### 2. メモリ管理
- `std::shared_ptr`/`std::weak_ptr`を適切に使用してください
- 循環参照を避けるため、親への参照は`std::weak_ptr`を使用
- RAIIパターンでリソース管理を行ってください

### 3. エラーハンドリング
- 非同期操作では例外をキャッチして適切に処理してください
- `std::future`の結果を必ず確認してください
- ログ出力でデバッグ情報を提供してください

### 4. パフォーマンス
- 重い処理は別スレッドで実行してください
- バッチ処理でスループットを向上させてください
- 適切なタイムアウトを設定してください

---

**Last Updated**: 2025-07-09  
**Author**: VoidCore Development Team  
**Target**: C++ Implementation Team  
**Version**: VoidCore v14.0 API Reference