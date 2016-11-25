declare module $REST.Types {

    /**
     * Person Properties
     */
    interface IPersonProperties extends IBase {
        /**
         * Properties
         */

        /**
         * The user's account name.
         */
        AccountName: string;

        /**
         * The account names of the user's direct reports.
         */
        DirectReports: Results.String

        /**
         * The user's display name.
         */
        DisplayName: string;

        /**
         * The user's email address.
         */
        Email: string;

        /**
         * The account names of the user's manager hierarchy.
         */
        ExtendedManagers: Results.String;

        /**
         * The account names of the user's extended reports.
         */
        ExtendedReports: Results.String;

        /**
         * A Boolean value that indicates whether the user is being followed by the current user.
         */
        IsFollowed: boolean;

        /**
         * The user's latest microblog post.
         */
        LatestPost: string;

        /**
         * The account names of the user's peers.
         */
        Peers(): Results.String;

        /**
         * The absolute URL of the user's personal site.
         */
        PersonalUrl: string;

        /**
         * The URL of the user's profile picture.
         */
        PictureUrl: string;

        /**
         * The user's title.
         */
        Title: string;

        /**
         * The user profile properties for the user.
         */
        UserProfileProperties(): Results.KeyValuePair;

        /**
         * The URL of the user's profile page.
         */
        UserUrl: string;
    }
}