declare module $REST.Types {

    /**
     * User Profile
     */
    interface IUserProfile extends IBase {
        /**
         * Properties
         */

        /**
         * An object containing the user's FollowedDocumentsUrl and FollowedSitesUrl.
         */
        FollowedContent(): any;

        /**
         * The account name of the user. (SharePoint Online only)
         */
        AccountName: string;

        /**
         * The display name of the user. (SharePoint Online only)
         */
        DisplayName: string;

        /**
         * The FirstRun flag of the user. (SharePoint Online only)
         */
        O15FirstRunExperience: number;

        /**
         * The personal site of the user.
         */
        PersonalSite(): ISite;

        /**
         * The capabilities of the user's personal site.
         */
        PersonalSiteCapabilities: Types.PersonalSiteCapabilities;

        /**
         * The error thrown when the user's personal site was first created, if any. (SharePoint Online only)
         */
        PersonalSiteFirstCreationError: string;

        /**
         * The date and time when the user's personal site was first created. (SharePoint Online only)
         */
        PersonalSiteFirstCreationTime: string;

        /**
         * The status for the state of the personal site instantiation.
         * See PersonalSiteInstantiationState in the .NET client object model reference for a list of instantiation state values.
         */
        PersonalSiteInstantiationState: number;

        /**
         * The date and time when the user's personal site was last created. (SharePoint Online only)
         */
        PersonalSiteLastCreationTime: string;

        /**
         * The number of attempts made to create the user's personal site. (SharePoint Online only)
         */
        PersonalSiteNumberOfRetries: number;

        /**
         * A Boolean value that indicates whether the user's picture is imported from Exchange.
         */
        PictureImportEnabled: boolean;

        /**
         * The public URL of the personal site of the current user. (SharePoint Online only)
         */
        PublicUrl: string;

        /**
         * The URL used to create the user's personal site.
         */
        UrlToCreatePersonalSite: string;

        /**
         * Methods
         */

        /**
         * Enqueues creating a personal site for this user, which can be used to share documents, web pages, and other files.
         * For SharePoint Online development, My Site Host administrators can also use the CreatePersonalSiteEnqueueBulk method to create personal sites for one or more users.
         * @param createFl - True if this is an interactively (web) initiated request, or false if this is a non-interactively (client) initiated request.
         */
        createPersonalSiteEnque(createFl:boolean): IBase;

        /**
         * Method to execute the request.
         * @param callback - The method to be executed after the request completes.
         */
        execute(callback?:(...args) => any): IUserProfile;

        /**
         * Method to execute the request.
         * @param waitFl - Flag to execute the request, after the previous requests have completed.
         */
        execute(waitFl:boolean): IUserProfile;

        /**
         * Method to execute the request.
         * @param callback - The method to be executed after the request completes.
         * @param waitFl - Flag to execute the request, after the previous requests have completed.
         */
        execute(callback:any, waitFl:boolean): IUserProfile;

        /**
         * Sets the privacy settings for this profile.
         * @param shareFl - true to make all social data public; false to make all social data private.
         */
        shareAllSocialData(shareFl:boolean): IBase;
    }
}