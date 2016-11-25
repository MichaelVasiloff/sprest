module $REST {
    /*********************************************************************************************************************************/
    // User Profile
    /*********************************************************************************************************************************/
    class _UserProfile extends Base {
        /*********************************************************************************************************************************/
        // Constructor
        /*********************************************************************************************************************************/
        constructor(targetInfo?:Settings.TargetInfoSettings) {
            // Call the base constructor
            super(targetInfo);

            // Default the properties
            this.defaultToWebFl = true;
            this.responses = [];
            this.targetInfo.endpoint = "sp.userprofiles.profileloader.getprofileloader";

            // Add the methods
            this.addMethods(this, { __metadata: { type: "userprofile" } } );
        }
    }

    /*********************************************************************************************************************************/
    // Methods
    /*********************************************************************************************************************************/
    Library.userprofile = {
        /*********************************************************************************************************************************/
        // Properties
        /*********************************************************************************************************************************/

        properties: [
            "FollowedContent", "PersonalSite"
        ],

        /*********************************************************************************************************************************/
        // Methods
        /*********************************************************************************************************************************/

        createPersonalSiteEnque:{
            requestType: Types.RequestType.PostWithArgsValueOnly
        },

        shareAllSocialData:{
            requestType: Types.RequestType.PostWithArgsValueOnly
        }
    }

    /**
     * User Profile
     */
    export var UserProfile = new _UserProfile();
}
