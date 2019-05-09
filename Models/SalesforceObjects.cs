using System;
using System.Collections.Generic;

namespace SalesforceCloudCore.Models {

    public class SalesforceObjects {
        public class Presence {
            public string Id { get; set; }
            public string UserId { get; set; }
            public string ServicePresenceStatusId { get; set; }
        }
        public class PendingServiceRouting {
            public string Id { get; set; }
            public string QueueId { get; set; }
            public string WorkItemId { get; set; }
            public string IsPushed { get; set; }
            public string ServiceChannelId { get; set; }
            public string LastDeclinedAgentSession { get; set; }
            public DateTime CreatedDate { get; set; }
            public DateTime LastModifiedDate { get; set; }
        }
        public class AgentWork {
            public string Id { get; set; }
            public int Status { get; set; }
            public string WorkItemId { get; set; }
            public DateTime CreatedDate { get; set; }
            public DateTime LastModifiedDate { get; set; }
            public string UserId { get; set; }
        }
        public class ServicePresenceStatus {
            public string Id { get; set; }
            public bool IsDeleted { get; set; }
            public string DeveloperName { get; set; }
            public string Language { get; set; }
            public string MasterLabel { get; set; }
            public DateTime CreatedDate { get; set; }
            public string CreatedById { get; set; }
            public DateTime LastModifiedDate { get; set; }
            public string LastModifiedById { get; set; }
            public DateTime SystemModstamp { get; set; }
        }
    }
}