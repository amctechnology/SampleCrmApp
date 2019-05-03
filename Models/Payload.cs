using System.Collections.Generic;

namespace Salesforce.Models {
    public class Payload {
        public string crm { get; set; }
        public AgentWork agentWork { get; set; }
        public PendingWork pendingWork { get; set; }
        public Presence presence { get; set; }
        public RoutingConfig config { get; set; }
    }
    public class AgentWork {
        public string id { get; set; }
        public string createdOn { get; set; }
        public string modifiedOn { get; set; }
        public string operation { get; set; }
        public AgentWorkStatus status { get; set; }
        public WorkItem workItem { get; set; }
        public string userName { get; set; }
        public string userId { get; set; }
    }
    public class AgentWorkStatus {
        public bool accept { get; set; } = false;
        public bool reject { get; set; } = false;
        public bool wrapUp { get; set; } = false;
        public bool complete { get; set; } = false;
        public bool close { get; set; } = false;
        public bool transferToUser { get; set; } = false;
        public bool transferToQueue { get; set; } = false;
    }
    public class PendingWork {
        public string id { get; set; }
        public string createdOn { get; set; }
        public string modifiedOn { get; set; }
        public string operation { get; set; }
        public WorkItem workItem { get; set; }
    }
    public class RoutingConfig {
        public string appId { get; set; }
        public string davinciAccountId { get; set; }
        public string davinciProfileId { get; set; }
        public string davinciUsername { get; set; }
        public string davinciPassword { get; set; }
        public Dictionary<string, string> crm { get; set; }
        public Dictionary<string, string> routingEngine { get; set; }
    }
    public class WorkItem {
        public string id { get; set; }
        public string type { get; set; }
    }
    public class Presence {
        public string status { get; set; }
        public string userName { get; set; }
        public string userId { get; set; }
    }
}