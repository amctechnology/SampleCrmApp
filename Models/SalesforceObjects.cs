using System.Collections.Generic;

namespace Salesforce.Models {

    public class SalesforceObjects {
        public class Presence {
            string Id { get; set; }
            string UserId { get; set; }
            string ServicePresenceStatusId { get; set; }
        }
        public class PendingServiceRouting {
            string Id { get; set; }
            string QueueId { get; set; }
            string WorkItemId { get; set; }
            string IsPushed { get; set; }
            string ServiceChannelId { get; set; }
            string LastDeclinedAgentSession { get; set; }
        }
        public class AgentWork {
            string Id { get; set; }
            string Status { get; set; }
            string WorkItemId { get; set; }
        }

    }
}