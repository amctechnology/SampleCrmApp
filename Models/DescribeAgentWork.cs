namespace SalesforceCloudCore.Models {
    using System.Collections.Generic;
    using System.Globalization;
    using System;
    using Newtonsoft.Json.Converters;
    using Newtonsoft.Json;

    public partial class DescribeAgentWork {
        [JsonProperty ("actionOverrides")]
        public object[] ActionOverrides { get; set; }

        [JsonProperty ("activateable")]
        public bool Activateable { get; set; }

        [JsonProperty ("childRelationships")]
        public ChildRelationship[] ChildRelationships { get; set; }

        [JsonProperty ("compactLayoutable")]
        public bool CompactLayoutable { get; set; }

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

        [JsonProperty ("fields")]
        public Field[] Fields { get; set; }

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

        [JsonProperty ("listviewable")]
        public object Listviewable { get; set; }

        [JsonProperty ("lookupLayoutable")]
        public object LookupLayoutable { get; set; }

        [JsonProperty ("mergeable")]
        public bool Mergeable { get; set; }

        [JsonProperty ("mruEnabled")]
        public bool MruEnabled { get; set; }

        [JsonProperty ("name")]
        public string Name { get; set; }

        [JsonProperty ("namedLayoutInfos")]
        public object[] NamedLayoutInfos { get; set; }

        [JsonProperty ("networkScopeFieldName")]
        public object NetworkScopeFieldName { get; set; }

        [JsonProperty ("queryable")]
        public bool Queryable { get; set; }

        [JsonProperty ("recordTypeInfos")]
        public RecordTypeInfo[] RecordTypeInfos { get; set; }

        [JsonProperty ("replicateable")]
        public bool Replicateable { get; set; }

        [JsonProperty ("retrieveable")]
        public bool Retrieveable { get; set; }

        [JsonProperty ("searchLayoutable")]
        public bool SearchLayoutable { get; set; }

        [JsonProperty ("searchable")]
        public bool Searchable { get; set; }

        [JsonProperty ("supportedScopes")]
        public SupportedScope[] SupportedScopes { get; set; }

        [JsonProperty ("triggerable")]
        public bool Triggerable { get; set; }

        [JsonProperty ("undeletable")]
        public bool Undeletable { get; set; }

        [JsonProperty ("updateable")]
        public bool Updateable { get; set; }

        [JsonProperty ("urls")]
        public DescribeAgentWorkUrls Urls { get; set; }
    }

    public partial class ChildRelationship {
        [JsonProperty ("cascadeDelete")]
        public bool CascadeDelete { get; set; }

        [JsonProperty ("childSObject")]
        public string ChildSObject { get; set; }

        [JsonProperty ("deprecatedAndHidden")]
        public bool DeprecatedAndHidden { get; set; }

        [JsonProperty ("field")]
        public string Field { get; set; }

        [JsonProperty ("junctionIdListNames")]
        public object[] JunctionIdListNames { get; set; }

        [JsonProperty ("junctionReferenceTo")]
        public object[] JunctionReferenceTo { get; set; }

        [JsonProperty ("relationshipName")]
        public object RelationshipName { get; set; }

        [JsonProperty ("restrictedDelete")]
        public bool RestrictedDelete { get; set; }
    }

    public partial class Field {
        [JsonProperty ("aggregatable")]
        public bool Aggregatable { get; set; }

        [JsonProperty ("aiPredictionField")]
        public bool AiPredictionField { get; set; }

        [JsonProperty ("autoNumber")]
        public bool AutoNumber { get; set; }

        [JsonProperty ("byteLength")]
        public long ByteLength { get; set; }

        [JsonProperty ("calculated")]
        public bool Calculated { get; set; }

        [JsonProperty ("calculatedFormula")]
        public object CalculatedFormula { get; set; }

        [JsonProperty ("cascadeDelete")]
        public bool CascadeDelete { get; set; }

        [JsonProperty ("caseSensitive")]
        public bool CaseSensitive { get; set; }

        [JsonProperty ("compoundFieldName")]
        public object CompoundFieldName { get; set; }

        [JsonProperty ("controllerName")]
        public object ControllerName { get; set; }

        [JsonProperty ("createable")]
        public bool Createable { get; set; }

        [JsonProperty ("custom")]
        public bool Custom { get; set; }

        [JsonProperty ("defaultValue")]
        public bool? DefaultValue { get; set; }

        [JsonProperty ("defaultValueFormula")]
        public object DefaultValueFormula { get; set; }

        [JsonProperty ("defaultedOnCreate")]
        public bool DefaultedOnCreate { get; set; }

        [JsonProperty ("dependentPicklist")]
        public bool DependentPicklist { get; set; }

        [JsonProperty ("deprecatedAndHidden")]
        public bool DeprecatedAndHidden { get; set; }

        [JsonProperty ("digits")]
        public long Digits { get; set; }

        [JsonProperty ("displayLocationInDecimal")]
        public bool DisplayLocationInDecimal { get; set; }

        [JsonProperty ("encrypted")]
        public bool Encrypted { get; set; }

        [JsonProperty ("externalId")]
        public bool ExternalId { get; set; }

        [JsonProperty ("extraTypeInfo")]
        public object ExtraTypeInfo { get; set; }

        [JsonProperty ("filterable")]
        public bool Filterable { get; set; }

        [JsonProperty ("filteredLookupInfo")]
        public object FilteredLookupInfo { get; set; }

        [JsonProperty ("formulaTreatNullNumberAsZero")]
        public bool FormulaTreatNullNumberAsZero { get; set; }

        [JsonProperty ("groupable")]
        public bool Groupable { get; set; }

        [JsonProperty ("highScaleNumber")]
        public bool HighScaleNumber { get; set; }

        [JsonProperty ("htmlFormatted")]
        public bool HtmlFormatted { get; set; }

        [JsonProperty ("idLookup")]
        public bool IdLookup { get; set; }

        [JsonProperty ("inlineHelpText")]
        public object InlineHelpText { get; set; }

        [JsonProperty ("label")]
        public string Label { get; set; }

        [JsonProperty ("length")]
        public long Length { get; set; }

        [JsonProperty ("mask")]
        public object Mask { get; set; }

        [JsonProperty ("maskType")]
        public object MaskType { get; set; }

        [JsonProperty ("name")]
        public string Name { get; set; }

        [JsonProperty ("nameField")]
        public bool NameField { get; set; }

        [JsonProperty ("namePointing")]
        public bool NamePointing { get; set; }

        [JsonProperty ("nillable")]
        public bool Nillable { get; set; }

        [JsonProperty ("permissionable")]
        public bool Permissionable { get; set; }

        [JsonProperty ("picklistValues")]
        public PicklistValue[] PicklistValues { get; set; }

        [JsonProperty ("polymorphicForeignKey")]
        public bool PolymorphicForeignKey { get; set; }

        [JsonProperty ("precision")]
        public long Precision { get; set; }

        [JsonProperty ("queryByDistance")]
        public bool QueryByDistance { get; set; }

        [JsonProperty ("referenceTargetField")]
        public object ReferenceTargetField { get; set; }

        [JsonProperty ("referenceTo")]
        public string[] ReferenceTo { get; set; }

        [JsonProperty ("relationshipName")]
        public string RelationshipName { get; set; }

        [JsonProperty ("relationshipOrder")]
        public object RelationshipOrder { get; set; }

        [JsonProperty ("restrictedDelete")]
        public bool RestrictedDelete { get; set; }

        [JsonProperty ("restrictedPicklist")]
        public bool RestrictedPicklist { get; set; }

        [JsonProperty ("scale")]
        public long Scale { get; set; }

        [JsonProperty ("searchPrefilterable")]
        public bool SearchPrefilterable { get; set; }

        [JsonProperty ("soapType")]
        public string SoapType { get; set; }

        [JsonProperty ("sortable")]
        public bool Sortable { get; set; }

        [JsonProperty ("type")]
        public string Type { get; set; }

        [JsonProperty ("unique")]
        public bool Unique { get; set; }

        [JsonProperty ("updateable")]
        public bool Updateable { get; set; }

        [JsonProperty ("writeRequiresMasterRead")]
        public bool WriteRequiresMasterRead { get; set; }
    }

    public partial class PicklistValue {
        [JsonProperty ("active")]
        public bool Active { get; set; }

        [JsonProperty ("defaultValue")]
        public bool DefaultValue { get; set; }

        [JsonProperty ("label")]
        public string Label { get; set; }

        [JsonProperty ("validFor")]
        public object ValidFor { get; set; }

        [JsonProperty ("value")]
        public string Value { get; set; }
    }

    public partial class RecordTypeInfo {
        [JsonProperty ("active")]
        public bool Active { get; set; }

        [JsonProperty ("available")]
        public bool Available { get; set; }

        [JsonProperty ("defaultRecordTypeMapping")]
        public bool DefaultRecordTypeMapping { get; set; }

        [JsonProperty ("developerName")]
        public string DeveloperName { get; set; }

        [JsonProperty ("master")]
        public bool Master { get; set; }

        [JsonProperty ("name")]
        public string Name { get; set; }

        [JsonProperty ("recordTypeId")]
        public string RecordTypeId { get; set; }

        [JsonProperty ("urls")]
        public RecordTypeInfoUrls Urls { get; set; }
    }

    public partial class RecordTypeInfoUrls {
        [JsonProperty ("layout")]
        public string Layout { get; set; }
    }

    public partial class SupportedScope {
        [JsonProperty ("label")]
        public string Label { get; set; }

        [JsonProperty ("name")]
        public string Name { get; set; }
    }

    public partial class DescribeAgentWorkUrls {
        [JsonProperty ("rowTemplate")]
        public string RowTemplate { get; set; }

        [JsonProperty ("defaultValues")]
        public string DefaultValues { get; set; }

        [JsonProperty ("describe")]
        public string Describe { get; set; }

        [JsonProperty ("sobject")]
        public string Sobject { get; set; }
    }

    public partial class DescribeAgentWork {
        public static DescribeAgentWork FromJson (string json) => JsonConvert.DeserializeObject<DescribeAgentWork> (json, SalesforceCloudCore.Models.Converter.Settings);
    }

    public static class Serialize {
        public static string ToJson (this DescribeAgentWork self) => JsonConvert.SerializeObject (self, SalesforceCloudCore.Models.Converter.Settings);
    }

    internal static class Converter {
        public static readonly JsonSerializerSettings Settings = new JsonSerializerSettings {
            MetadataPropertyHandling = MetadataPropertyHandling.Ignore,
            DateParseHandling = DateParseHandling.None,
            Converters = {
            new IsoDateTimeConverter { DateTimeStyles = DateTimeStyles.AssumeUniversal }
            },
        };
    }
}