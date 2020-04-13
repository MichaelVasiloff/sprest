import { Base, SP } from "gd-sprest-def";
import { ITargetInfoProps } from "../utils";

/**
 * #### REST API
 * _api/Social.Feed
 */
export const SocialFeed: ISocialFeed;

/**
 * Social Feed
 * @cateogry Social Feed
 */
export interface ISocialFeed {
    /**
     * Creates an instance of the social feed library.
     * @param targetInfo - (Optional) The target information.
     */
    (targetInfo?: ITargetInfoProps): SP.Social.ISocialRestThread;

    /**
     * Posts to a feed.
     * @param accountName - The account name to post to.
     * @param postInfo - The post information.
     */
    postToFeed(accountName: string, postInfo: SP.Social.SocialPostCreationData): Base.IBaseExecution<SP.Social.SocialRestThread>;

    /**
     * Post to the current user's feed.
     * @param postInfo - The post information.
     */
    postToMyFeed(postInfo: SP.Social.SocialPostCreationData): Base.IBaseExecution<SP.Social.SocialRestThread>;
}