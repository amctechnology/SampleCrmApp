using System.Collections.Generic;
using Newtonsoft.Json;

namespace SalesforceCloudCore.Models {
    public class PushTopic {
        [JsonProperty (PropertyName = "event")]
        public Event Event { get; set; }

        [JsonProperty (PropertyName = "sobject")]
        public Dictionary<string, string> SObject { get; set; }

        [JsonProperty (PropertyName = "EventType")]
        public string EventType { get; set; }

        [JsonProperty (PropertyName = "Config")]
        public Config Config { get; set; }
    }
    public class Event {
        [JsonProperty (PropertyName = "createdDate")]
        public System.DateTime CreatedDate { get; set; }

        [JsonProperty (PropertyName = "replayId")]
        public int ReplayId { get; set; }

        [JsonProperty (PropertyName = "type")]
        public string Type { get; set; }
    }

    public class Config {
        [JsonProperty (PropertyName = "appId")]
        public string appId { get; set; }

        [JsonProperty (PropertyName = "davinciAccountId")]

        public string davinciAccountId { get; set; }

        [JsonProperty (PropertyName = "davinciProfileId")]
        public string davinciProfileId { get; set; }

        [JsonProperty (PropertyName = "davinciUsername")]
        public string davinciUsername { get; set; }

        [JsonProperty (PropertyName = "davinciPassword")]
        public string davinciPassword { get; set; }

        [JsonProperty (PropertyName = "crm")]
        public Dictionary<string, string> crm { get; set; }

        [JsonProperty (PropertyName = "routingEngine")]
        public Dictionary<string, string> routingEngine { get; set; }
    }
}