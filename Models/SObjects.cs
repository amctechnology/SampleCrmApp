    namespace SalesforceCloudCore.Models {
        using System.Collections.Generic;
        using System.Globalization;
        using System;
        using Newtonsoft.Json.Converters;
        using Newtonsoft.Json;

        public partial class SObjects {
            [JsonProperty ("encoding")]
            public string Encoding { get; set; }

            [JsonProperty ("maxBatchSize")]
            public long MaxBatchSize { get; set; }

            [JsonProperty ("sobjects")]
            public Sobject[] Sobjects { get; set; }
        }

        public partial class Sobject {
            [JsonProperty ("activateable")]
            public bool Activateable { get; set; }

            [JsonProperty ("createable")]
            public bool Createable { get; set; }

            [JsonProperty ("custom")]
            public bool Custom { get; set; }

            [JsonProperty ("customSetting")]
            public bool CustomSetting { get; set; }

            [JsonProperty ("deletable")]
            public bool Deletable { get; set; }

            [JsonProperty ("deprecatedAndHidden")]
            public bool DeprecatedAndHidden { get; set; }

            [JsonProperty ("feedEnabled")]
            public bool FeedEnabled { get; set; }

            [JsonProperty ("hasSubtypes")]
            public bool HasSubtypes { get; set; }

            [JsonProperty ("isSubtype")]
            public bool IsSubtype { get; set; }

            [JsonProperty ("keyPrefix")]
            public string KeyPrefix { get; set; }

            [JsonProperty ("label")]
            public string Label { get; set; }

            [JsonProperty ("labelPlural")]
            public string LabelPlural { get; set; }

            [JsonProperty ("layoutable")]
            public bool Layoutable { get; set; }

            [JsonProperty ("mergeable")]
            public bool Mergeable { get; set; }

            [JsonProperty ("mruEnabled")]
            public bool MruEnabled { get; set; }

            [JsonProperty ("name")]
            public string Name { get; set; }

            [JsonProperty ("queryable")]
            public bool Queryable { get; set; }

            [JsonProperty ("replicateable")]
            public bool Replicateable { get; set; }

            [JsonProperty ("retrieveable")]
            public bool Retrieveable { get; set; }

            [JsonProperty ("searchable")]
            public bool Searchable { get; set; }

            [JsonProperty ("triggerable")]
            public bool Triggerable { get; set; }

            [JsonProperty ("undeletable")]
            public bool Undeletable { get; set; }

            [JsonProperty ("updateable")]
            public bool Updateable { get; set; }

            [JsonProperty ("urls")]
            public Urls Urls { get; set; }
        }

        public partial class Urls {
            [JsonProperty ("rowTemplate")]
            public string RowTemplate { get; set; }

            [JsonProperty ("defaultValues")]
            public string DefaultValues { get; set; }

            [JsonProperty ("describe")]
            public string Describe { get; set; }

            [JsonProperty ("sobject")]
            public string Sobject { get; set; }

            [JsonProperty ("compactLayouts", NullValueHandling = NullValueHandling.Ignore)]
            public string CompactLayouts { get; set; }

            [JsonProperty ("approvalLayouts", NullValueHandling = NullValueHandling.Ignore)]
            public string ApprovalLayouts { get; set; }

            [JsonProperty ("listviews", NullValueHandling = NullValueHandling.Ignore)]
            public string Listviews { get; set; }

            [JsonProperty ("quickActions", NullValueHandling = NullValueHandling.Ignore)]
            public string QuickActions { get; set; }

            [JsonProperty ("layouts", NullValueHandling = NullValueHandling.Ignore)]
            public string Layouts { get; set; }

            [JsonProperty ("eventSchema", NullValueHandling = NullValueHandling.Ignore)]
            public string EventSchema { get; set; }

            [JsonProperty ("caseArticleSuggestions", NullValueHandling = NullValueHandling.Ignore)]
            public string CaseArticleSuggestions { get; set; }

            [JsonProperty ("caseRowArticleSuggestions", NullValueHandling = NullValueHandling.Ignore)]
            public string CaseRowArticleSuggestions { get; set; }

            [JsonProperty ("eventSeriesUpdates", NullValueHandling = NullValueHandling.Ignore)]
            public string EventSeriesUpdates { get; set; }

            [JsonProperty ("push", NullValueHandling = NullValueHandling.Ignore)]
            public string Push { get; set; }

            [JsonProperty ("namedLayouts", NullValueHandling = NullValueHandling.Ignore)]
            public string NamedLayouts { get; set; }

            [JsonProperty ("passwordUtilities", NullValueHandling = NullValueHandling.Ignore)]
            public string PasswordUtilities { get; set; }
        }

        public partial class SObjects {
            public static SObjects FromJson (string json) => JsonConvert.DeserializeObject<SObjects> (json, SalesforceCloudCore.Models.Converter.Settings);
        }

    }