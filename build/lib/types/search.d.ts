import { Microsoft } from "gd-sprest-def";
import * as Types from "../../mapper/types";
import { IBase, ITargetInfo } from "../../utils/types";
/**
 * Search
 */
export interface ISearch {
    /**
     * Creates an instance of the search library.
     * @param url - The optional url to execute the search against.
     * @param targetInfo - The target information.
     */
    (url?: string, targetInfo?: ITargetInfo): Types.ISearch;
    /**
     * Method to get the app context information.
     * @param siteUrl - The absolute url of the site.
     */
    getAppContext(siteUrl: string): IBase;
    /**
     * Method to get the query from the search parameters.
     * @param parameters - The search parameters.
     */
    getQuery: (parameters: Microsoft.Office.Server.Search.REST.SearchRequest) => Array<string>;
    /**
     * Method to get the url of a site, by its id.
     * @param id - The site id.
     */
    getUrlById(id: string): IBase<Types.ISiteUrl>;
}
