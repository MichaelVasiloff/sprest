import { Base, Microsoft, SP } from "gd-sprest-def";
import { ITargetInfoProps } from "../utils";

/**
 * #### REST API
 * _api/search
 */
export const Search: ISearch;

/**
 * Search
 * @category Search
 */
export interface ISearch {
    /**
     * Creates an instance of the search library.
     * @param url - The optional url to execute the search against.
     * @param targetInfo - The target information.
     */
    (url?: string, targetInfo?: ITargetInfoProps): Microsoft.Office.Server.Search.REST.ISearchService;

    /**
     * Method to get the app context information.
     * @param siteUrl - The absolute url of the site.
     */
    getAppContext(siteUrl: string): Base.IBaseExecution;

    /**
     * Method to get the query from the search parameters.
     * @param parameters - The search parameters.
     */
    getQuery: (parameters: Microsoft.Office.Server.Search.REST.SearchRequest /* | Microsoft.Office.Server.Search.REST.SearchSuggestion*/) => Array<string>;

    /**
     * Method to get the url of a site, by its id.
     * @param id - The site id.
     */
    getUrlById(id: string): Base.IBaseExecution<{ GetUrlById: string }>;
}