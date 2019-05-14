namespace SalesforceCloudCore.Models {
    using System.Collections.Generic;
    using System.Globalization;
    using System;
    using Newtonsoft.Json.Converters;
    using Newtonsoft.Json;

    public partial class User {
        [JsonProperty ("attributes")]
        public Attributes Attributes { get; set; }

        [JsonProperty ("Id")]
        public string Id { get; set; }

        [JsonProperty ("Username")]
        public string Username { get; set; }

        [JsonProperty ("LastName")]
        public string LastName { get; set; }

        [JsonProperty ("FirstName")]
        public string FirstName { get; set; }

        [JsonProperty ("Name")]
        public string Name { get; set; }

        [JsonProperty ("CompanyName")]
        public string CompanyName { get; set; }

        [JsonProperty ("Division")]
        public object Division { get; set; }

        [JsonProperty ("Department")]
        public object Department { get; set; }

        [JsonProperty ("Title")]
        public string Title { get; set; }

        [JsonProperty ("Street")]
        public string Street { get; set; }

        [JsonProperty ("City")]
        public string City { get; set; }

        [JsonProperty ("State")]
        public string State { get; set; }

        [JsonProperty ("PostalCode")]
        [JsonConverter (typeof (ParseStringConverter))]
        public long PostalCode { get; set; }

        [JsonProperty ("Country")]
        public string Country { get; set; }

        [JsonProperty ("Latitude")]
        public object Latitude { get; set; }

        [JsonProperty ("Longitude")]
        public object Longitude { get; set; }

        [JsonProperty ("GeocodeAccuracy")]
        public object GeocodeAccuracy { get; set; }

        [JsonProperty ("Address")]
        public Address Address { get; set; }

        [JsonProperty ("Email")]
        public string Email { get; set; }

        [JsonProperty ("EmailPreferencesAutoBcc")]
        public bool EmailPreferencesAutoBcc { get; set; }

        [JsonProperty ("EmailPreferencesAutoBccStayInTouch")]
        public bool EmailPreferencesAutoBccStayInTouch { get; set; }

        [JsonProperty ("EmailPreferencesStayInTouchReminder")]
        public bool EmailPreferencesStayInTouchReminder { get; set; }

        [JsonProperty ("SenderEmail")]
        public object SenderEmail { get; set; }

        [JsonProperty ("SenderName")]
        public object SenderName { get; set; }

        [JsonProperty ("Signature")]
        public object Signature { get; set; }

        [JsonProperty ("StayInTouchSubject")]
        public object StayInTouchSubject { get; set; }

        [JsonProperty ("StayInTouchSignature")]
        public object StayInTouchSignature { get; set; }

        [JsonProperty ("StayInTouchNote")]
        public object StayInTouchNote { get; set; }

        [JsonProperty ("Phone")]
        public object Phone { get; set; }

        [JsonProperty ("Fax")]
        public object Fax { get; set; }

        [JsonProperty ("MobilePhone")]
        public object MobilePhone { get; set; }

        [JsonProperty ("Alias")]
        public string Alias { get; set; }

        [JsonProperty ("CommunityNickname")]
        public string CommunityNickname { get; set; }

        [JsonProperty ("BadgeText")]
        public string BadgeText { get; set; }

        [JsonProperty ("IsActive")]
        public bool IsActive { get; set; }

        [JsonProperty ("TimeZoneSidKey")]
        public string TimeZoneSidKey { get; set; }

        [JsonProperty ("UserRoleId")]
        public object UserRoleId { get; set; }

        [JsonProperty ("LocaleSidKey")]
        public string LocaleSidKey { get; set; }

        [JsonProperty ("ReceivesInfoEmails")]
        public bool ReceivesInfoEmails { get; set; }

        [JsonProperty ("ReceivesAdminInfoEmails")]
        public bool ReceivesAdminInfoEmails { get; set; }

        [JsonProperty ("EmailEncodingKey")]
        public string EmailEncodingKey { get; set; }

        [JsonProperty ("ProfileId")]
        public string ProfileId { get; set; }

        [JsonProperty ("UserType")]
        public string UserType { get; set; }

        [JsonProperty ("LanguageLocaleKey")]
        public string LanguageLocaleKey { get; set; }

        [JsonProperty ("EmployeeNumber")]
        public object EmployeeNumber { get; set; }

        [JsonProperty ("DelegatedApproverId")]
        public object DelegatedApproverId { get; set; }

        [JsonProperty ("ManagerId")]
        public object ManagerId { get; set; }

        [JsonProperty ("LastLoginDate")]
        public string LastLoginDate { get; set; }

        [JsonProperty ("LastPasswordChangeDate")]
        public string LastPasswordChangeDate { get; set; }

        [JsonProperty ("CreatedDate")]
        public string CreatedDate { get; set; }

        [JsonProperty ("CreatedById")]
        public string CreatedById { get; set; }

        [JsonProperty ("LastModifiedDate")]
        public string LastModifiedDate { get; set; }

        [JsonProperty ("LastModifiedById")]
        public string LastModifiedById { get; set; }

        [JsonProperty ("SystemModstamp")]
        public string SystemModstamp { get; set; }

        [JsonProperty ("OfflineTrialExpirationDate")]
        public object OfflineTrialExpirationDate { get; set; }

        [JsonProperty ("OfflinePdaTrialExpirationDate")]
        public object OfflinePdaTrialExpirationDate { get; set; }

        [JsonProperty ("UserPermissionsMarketingUser")]
        public bool UserPermissionsMarketingUser { get; set; }

        [JsonProperty ("UserPermissionsOfflineUser")]
        public bool UserPermissionsOfflineUser { get; set; }

        [JsonProperty ("UserPermissionsCallCenterAutoLogin")]
        public bool UserPermissionsCallCenterAutoLogin { get; set; }

        [JsonProperty ("UserPermissionsMobileUser")]
        public bool UserPermissionsMobileUser { get; set; }

        [JsonProperty ("UserPermissionsSFContentUser")]
        public bool UserPermissionsSfContentUser { get; set; }

        [JsonProperty ("UserPermissionsKnowledgeUser")]
        public bool UserPermissionsKnowledgeUser { get; set; }

        [JsonProperty ("UserPermissionsInteractionUser")]
        public bool UserPermissionsInteractionUser { get; set; }

        [JsonProperty ("UserPermissionsSupportUser")]
        public bool UserPermissionsSupportUser { get; set; }

        [JsonProperty ("UserPermissionsJigsawProspectingUser")]
        public bool UserPermissionsJigsawProspectingUser { get; set; }

        [JsonProperty ("UserPermissionsSiteforceContributorUser")]
        public bool UserPermissionsSiteforceContributorUser { get; set; }

        [JsonProperty ("UserPermissionsSiteforcePublisherUser")]
        public bool UserPermissionsSiteforcePublisherUser { get; set; }

        [JsonProperty ("UserPermissionsWorkDotComUserFeature")]
        public bool UserPermissionsWorkDotComUserFeature { get; set; }

        [JsonProperty ("ForecastEnabled")]
        public bool ForecastEnabled { get; set; }

        [JsonProperty ("UserPreferencesActivityRemindersPopup")]
        public bool UserPreferencesActivityRemindersPopup { get; set; }

        [JsonProperty ("UserPreferencesEventRemindersCheckboxDefault")]
        public bool UserPreferencesEventRemindersCheckboxDefault { get; set; }

        [JsonProperty ("UserPreferencesTaskRemindersCheckboxDefault")]
        public bool UserPreferencesTaskRemindersCheckboxDefault { get; set; }

        [JsonProperty ("UserPreferencesReminderSoundOff")]
        public bool UserPreferencesReminderSoundOff { get; set; }

        [JsonProperty ("UserPreferencesDisableAllFeedsEmail")]
        public bool UserPreferencesDisableAllFeedsEmail { get; set; }

        [JsonProperty ("UserPreferencesContentNoEmail")]
        public bool UserPreferencesContentNoEmail { get; set; }

        [JsonProperty ("UserPreferencesContentEmailAsAndWhen")]
        public bool UserPreferencesContentEmailAsAndWhen { get; set; }

        [JsonProperty ("UserPreferencesApexPagesDeveloperMode")]
        public bool UserPreferencesApexPagesDeveloperMode { get; set; }

        [JsonProperty ("UserPreferencesHideCSNGetChatterMobileTask")]
        public bool UserPreferencesHideCsnGetChatterMobileTask { get; set; }

        [JsonProperty ("UserPreferencesHideCSNDesktopTask")]
        public bool UserPreferencesHideCsnDesktopTask { get; set; }

        [JsonProperty ("UserPreferencesHideChatterOnboardingSplash")]
        public bool UserPreferencesHideChatterOnboardingSplash { get; set; }

        [JsonProperty ("UserPreferencesHideSecondChatterOnboardingSplash")]
        public bool UserPreferencesHideSecondChatterOnboardingSplash { get; set; }

        [JsonProperty ("UserPreferencesJigsawListUser")]
        public bool UserPreferencesJigsawListUser { get; set; }

        [JsonProperty ("UserPreferencesShowTitleToExternalUsers")]
        public bool UserPreferencesShowTitleToExternalUsers { get; set; }

        [JsonProperty ("UserPreferencesShowManagerToExternalUsers")]
        public bool UserPreferencesShowManagerToExternalUsers { get; set; }

        [JsonProperty ("UserPreferencesShowEmailToExternalUsers")]
        public bool UserPreferencesShowEmailToExternalUsers { get; set; }

        [JsonProperty ("UserPreferencesShowWorkPhoneToExternalUsers")]
        public bool UserPreferencesShowWorkPhoneToExternalUsers { get; set; }

        [JsonProperty ("UserPreferencesShowMobilePhoneToExternalUsers")]
        public bool UserPreferencesShowMobilePhoneToExternalUsers { get; set; }

        [JsonProperty ("UserPreferencesShowFaxToExternalUsers")]
        public bool UserPreferencesShowFaxToExternalUsers { get; set; }

        [JsonProperty ("UserPreferencesShowStreetAddressToExternalUsers")]
        public bool UserPreferencesShowStreetAddressToExternalUsers { get; set; }

        [JsonProperty ("UserPreferencesShowCityToExternalUsers")]
        public bool UserPreferencesShowCityToExternalUsers { get; set; }

        [JsonProperty ("UserPreferencesShowStateToExternalUsers")]
        public bool UserPreferencesShowStateToExternalUsers { get; set; }

        [JsonProperty ("UserPreferencesShowPostalCodeToExternalUsers")]
        public bool UserPreferencesShowPostalCodeToExternalUsers { get; set; }

        [JsonProperty ("UserPreferencesShowCountryToExternalUsers")]
        public bool UserPreferencesShowCountryToExternalUsers { get; set; }

        [JsonProperty ("UserPreferencesShowProfilePicToGuestUsers")]
        public bool UserPreferencesShowProfilePicToGuestUsers { get; set; }

        [JsonProperty ("UserPreferencesShowTitleToGuestUsers")]
        public bool UserPreferencesShowTitleToGuestUsers { get; set; }

        [JsonProperty ("UserPreferencesShowCityToGuestUsers")]
        public bool UserPreferencesShowCityToGuestUsers { get; set; }

        [JsonProperty ("UserPreferencesShowStateToGuestUsers")]
        public bool UserPreferencesShowStateToGuestUsers { get; set; }

        [JsonProperty ("UserPreferencesShowPostalCodeToGuestUsers")]
        public bool UserPreferencesShowPostalCodeToGuestUsers { get; set; }

        [JsonProperty ("UserPreferencesShowCountryToGuestUsers")]
        public bool UserPreferencesShowCountryToGuestUsers { get; set; }

        [JsonProperty ("UserPreferencesDisableFeedbackEmail")]
        public bool UserPreferencesDisableFeedbackEmail { get; set; }

        [JsonProperty ("UserPreferencesDisableWorkEmail")]
        public bool UserPreferencesDisableWorkEmail { get; set; }

        [JsonProperty ("UserPreferencesPipelineViewHideHelpPopover")]
        public bool UserPreferencesPipelineViewHideHelpPopover { get; set; }

        [JsonProperty ("UserPreferencesHideS1BrowserUI")]
        public bool UserPreferencesHideS1BrowserUi { get; set; }

        [JsonProperty ("UserPreferencesPathAssistantCollapsed")]
        public bool UserPreferencesPathAssistantCollapsed { get; set; }

        [JsonProperty ("UserPreferencesCacheDiagnostics")]
        public bool UserPreferencesCacheDiagnostics { get; set; }

        [JsonProperty ("UserPreferencesShowEmailToGuestUsers")]
        public bool UserPreferencesShowEmailToGuestUsers { get; set; }

        [JsonProperty ("UserPreferencesShowManagerToGuestUsers")]
        public bool UserPreferencesShowManagerToGuestUsers { get; set; }

        [JsonProperty ("UserPreferencesShowWorkPhoneToGuestUsers")]
        public bool UserPreferencesShowWorkPhoneToGuestUsers { get; set; }

        [JsonProperty ("UserPreferencesShowMobilePhoneToGuestUsers")]
        public bool UserPreferencesShowMobilePhoneToGuestUsers { get; set; }

        [JsonProperty ("UserPreferencesShowFaxToGuestUsers")]
        public bool UserPreferencesShowFaxToGuestUsers { get; set; }

        [JsonProperty ("UserPreferencesShowStreetAddressToGuestUsers")]
        public bool UserPreferencesShowStreetAddressToGuestUsers { get; set; }

        [JsonProperty ("UserPreferencesLightningExperiencePreferred")]
        public bool UserPreferencesLightningExperiencePreferred { get; set; }

        [JsonProperty ("UserPreferencesPreviewLightning")]
        public bool UserPreferencesPreviewLightning { get; set; }

        [JsonProperty ("UserPreferencesHideEndUserOnboardingAssistantModal")]
        public bool UserPreferencesHideEndUserOnboardingAssistantModal { get; set; }

        [JsonProperty ("UserPreferencesHideLightningMigrationModal")]
        public bool UserPreferencesHideLightningMigrationModal { get; set; }

        [JsonProperty ("UserPreferencesHideSfxWelcomeMat")]
        public bool UserPreferencesHideSfxWelcomeMat { get; set; }

        [JsonProperty ("UserPreferencesHideBiggerPhotoCallout")]
        public bool UserPreferencesHideBiggerPhotoCallout { get; set; }

        [JsonProperty ("UserPreferencesGlobalNavBarWTShown")]
        public bool UserPreferencesGlobalNavBarWtShown { get; set; }

        [JsonProperty ("UserPreferencesGlobalNavGridMenuWTShown")]
        public bool UserPreferencesGlobalNavGridMenuWtShown { get; set; }

        [JsonProperty ("UserPreferencesCreateLEXAppsWTShown")]
        public bool UserPreferencesCreateLexAppsWtShown { get; set; }

        [JsonProperty ("UserPreferencesFavoritesWTShown")]
        public bool UserPreferencesFavoritesWtShown { get; set; }

        [JsonProperty ("UserPreferencesRecordHomeSectionCollapseWTShown")]
        public bool UserPreferencesRecordHomeSectionCollapseWtShown { get; set; }

        [JsonProperty ("UserPreferencesRecordHomeReservedWTShown")]
        public bool UserPreferencesRecordHomeReservedWtShown { get; set; }

        [JsonProperty ("UserPreferencesFavoritesShowTopFavorites")]
        public bool UserPreferencesFavoritesShowTopFavorites { get; set; }

        [JsonProperty ("UserPreferencesExcludeMailAppAttachments")]
        public bool UserPreferencesExcludeMailAppAttachments { get; set; }

        [JsonProperty ("UserPreferencesSuppressTaskSFXReminders")]
        public bool UserPreferencesSuppressTaskSfxReminders { get; set; }

        [JsonProperty ("UserPreferencesSuppressEventSFXReminders")]
        public bool UserPreferencesSuppressEventSfxReminders { get; set; }

        [JsonProperty ("UserPreferencesPreviewCustomTheme")]
        public bool UserPreferencesPreviewCustomTheme { get; set; }

        [JsonProperty ("UserPreferencesHasCelebrationBadge")]
        public bool UserPreferencesHasCelebrationBadge { get; set; }

        [JsonProperty ("UserPreferencesUserDebugModePref")]
        public bool UserPreferencesUserDebugModePref { get; set; }

        [JsonProperty ("UserPreferencesNewLightningReportRunPageEnabled")]
        public bool UserPreferencesNewLightningReportRunPageEnabled { get; set; }

        [JsonProperty ("ContactId")]
        public object ContactId { get; set; }

        [JsonProperty ("AccountId")]
        public object AccountId { get; set; }

        [JsonProperty ("CallCenterId")]
        public string CallCenterId { get; set; }

        [JsonProperty ("Extension")]
        public object Extension { get; set; }

        [JsonProperty ("FederationIdentifier")]
        public object FederationIdentifier { get; set; }

        [JsonProperty ("AboutMe")]
        public object AboutMe { get; set; }

        [JsonProperty ("FullPhotoUrl")]
        public Uri FullPhotoUrl { get; set; }

        [JsonProperty ("SmallPhotoUrl")]
        public Uri SmallPhotoUrl { get; set; }

        [JsonProperty ("IsExtIndicatorVisible")]
        public bool IsExtIndicatorVisible { get; set; }

        [JsonProperty ("OutOfOfficeMessage")]
        public string OutOfOfficeMessage { get; set; }

        [JsonProperty ("MediumPhotoUrl")]
        public Uri MediumPhotoUrl { get; set; }

        [JsonProperty ("DigestFrequency")]
        public string DigestFrequency { get; set; }

        [JsonProperty ("DefaultGroupNotificationFrequency")]
        public string DefaultGroupNotificationFrequency { get; set; }

        [JsonProperty ("JigsawImportLimitOverride")]
        public long JigsawImportLimitOverride { get; set; }

        [JsonProperty ("LastViewedDate")]
        public string LastViewedDate { get; set; }

        [JsonProperty ("LastReferencedDate")]
        public string LastReferencedDate { get; set; }

        [JsonProperty ("BannerPhotoUrl")]
        public string BannerPhotoUrl { get; set; }

        [JsonProperty ("SmallBannerPhotoUrl")]
        public string SmallBannerPhotoUrl { get; set; }

        [JsonProperty ("MediumBannerPhotoUrl")]
        public string MediumBannerPhotoUrl { get; set; }

        [JsonProperty ("IsProfilePhotoActive")]
        public bool IsProfilePhotoActive { get; set; }
    }

    public partial class Address {
        [JsonProperty ("city")]
        public string City { get; set; }

        [JsonProperty ("country")]
        public string Country { get; set; }

        [JsonProperty ("geocodeAccuracy")]
        public object GeocodeAccuracy { get; set; }

        [JsonProperty ("latitude")]
        public object Latitude { get; set; }

        [JsonProperty ("longitude")]
        public object Longitude { get; set; }

        [JsonProperty ("postalCode")]
        [JsonConverter (typeof (ParseStringConverter))]
        public long PostalCode { get; set; }

        [JsonProperty ("state")]
        public string State { get; set; }

        [JsonProperty ("street")]
        public string Street { get; set; }
    }

    public partial class Attributes {
        [JsonProperty ("type")]
        public string Type { get; set; }

        [JsonProperty ("url")]
        public string Url { get; set; }
    }

    public partial class User {
        public static User FromJson (string json) => JsonConvert.DeserializeObject<User> (json, SalesforceCloudCore.Models.Converter.Settings);
    }

    internal class ParseStringConverter : JsonConverter {
        public override bool CanConvert (Type t) => t == typeof (long) || t == typeof (long?);

        public override object ReadJson (JsonReader reader, Type t, object existingValue, JsonSerializer serializer) {
            if (reader.TokenType == JsonToken.Null) return null;
            var value = serializer.Deserialize<string> (reader);
            long l;
            if (Int64.TryParse (value, out l)) {
                return l;
            }
            throw new Exception ("Cannot unmarshal type long");
        }

        public override void WriteJson (JsonWriter writer, object untypedValue, JsonSerializer serializer) {
            if (untypedValue == null) {
                serializer.Serialize (writer, null);
                return;
            }
            var value = (long) untypedValue;
            serializer.Serialize (writer, value.ToString ());
            return;
        }

        public static readonly ParseStringConverter Singleton = new ParseStringConverter ();
    }
}