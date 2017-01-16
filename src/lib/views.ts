import {RequestType} from ".";

/*********************************************************************************************************************************/
// Methods
/*********************************************************************************************************************************/
const Library = {
    // Adds a view to the view collection.
    add: {
        metadataType: "SP.View",
        name: "",
        requestType: RequestType.PostWithArgs
    },

    // Gets the list view with the specified ID.
    getById: {
        argNames: ["id"],
        requestType: RequestType.GetWithArgsValueOnly,
        returnType: "view"
    },

    // Gets the list view with the specified title.
    getByTitle: {
        argNames: ["title"],
        requestType: RequestType.GetWithArgsValueOnly,
        returnType: "view"
    },

    // Queries the collection
    query: {
        argNames: ["oData"],
        requestType: RequestType.OData
    }
};
export default Library;