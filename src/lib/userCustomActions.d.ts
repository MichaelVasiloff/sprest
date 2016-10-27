declare module $REST.Types {
    /**
     * User Custom Actions
     */
    interface IUserCustomActions extends IBase {
        /**
         * Properties
         */

        /** The user custom action collection. */
        results: Array<IUserCustomAction>;

        /**
         * Methods
         */

        /**
         * Adds a custom actino to the user custom action collection. 
         * @param parameters - The user custom action information.
         */
        add(parameters:Settings.UserCustomActionCreationInformation): IUserCustomAction;

        /**
         * Deletes all custom actions in the collection.
         */
        clear(): any;

        /**
         * Method to execute the request.
         * @param callback - (Optional) For asynchronous requests, the method to be executed after the request completes.
         */
        execute(callback?:(IUserCustomActions) => void): IUserCustomActions;

        /**
         * Returns the custom action with the specified identifier.
         * @param id - The ID of the user custom action to get.
         */
        getById(id): IUserCustomAction;

        /**
         * Returns the user custom action based on the name of the specified user custom action.
         * @param name - The user custom action name.
         */
        getByName(name): IUserCustomAction;

        /**
         * Returns the user custom action based on the title of the specified user custom action.
         * @param title - The user custom action title.
         */
        getByTitle(title): IUserCustomAction;

        /**
         * Queries the collection.
         * @param oData - The OData information.
         */
        query(oData:Settings.ODataSettings): IUserCustomActions;
    }
}