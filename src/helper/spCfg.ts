import {
    ISPCfgFieldInfo, ISPCfgContentTypeInfo, ISPCfgListInfo, ISPCfgViewInfo,
    ISPConfig, ISPConfigProps
} from "../../@types/helper";
import { SP } from "gd-sprest-def";
import { ContextInfo, Site, Web } from "../lib";
import { SPTypes } from "..";
import {
    Executor, FieldSchemaXML, SPCfgType
} from ".";
export * from "./spCfgTypes";

/**
 * SharePoint Configuration
 */
export const SPConfig = (cfg: ISPConfigProps, webUrl?: string): ISPConfig => {
    // The selected configuration type to install
    let _cfgType: number;

    // The request digest
    let _requestDigest: string = null;

    // The target name to install/uninstall
    let _targetName: string;

    /**
     * Methods
     */

    // Method to create the content types
    let createContentTypes = (contentTypes: SP.IContentTypeCollection, cfgContentTypes: Array<ISPCfgContentTypeInfo>): PromiseLike<void> => {
        // Return a promise
        return new Promise((resolve, reject) => {
            // Ensure fields exist
            if (cfgContentTypes == null || cfgContentTypes.length == 0) {
                // Resolve the promise
                resolve();
                return;
            }

            // Method to get the parent content type
            let getParentCT = (ctName: string, url: string): PromiseLike<SP.ContentType> => {
                // Return a promise
                return new Promise((resolve, reject) => {
                    // Get the web containing the parent content type
                    Web(url)
                        // Get the content types
                        .ContentTypes()
                        // Filter for the parent name
                        .query({
                            Filter: "Name eq '" + ctName + "'"
                        })
                        // Execute the request
                        .execute(cts => {
                            // See if the parent exists
                            if (cts.results[0]) {
                                // Resolve the promise
                                resolve(cts.results[0] as any);
                            }
                            // Else, ensure this isn't the root web
                            else if (url != ContextInfo.siteServerRelativeUrl) {
                                // Check the root web for the parent content type
                                getParentCT(ctName, ContextInfo.siteServerRelativeUrl).then(resolve, reject);
                            } else {
                                // Reject the promise
                                reject();
                            }
                        }, reject);
                });
            };

            // Parse the configuration
            Executor<ISPCfgContentTypeInfo>(cfgContentTypes, cfg => {
                // Return a promise
                return new Promise((resolve, reject) => {
                    // See if this content type already exists
                    let ct = isInCollection("Name", cfg.Name, contentTypes.results);
                    if (ct) {
                        // Log
                        console.log("[gd-sprest][Content Type] The content type '" + cfg.Name + "' already exists.");

                        // Update the configuration
                        cfg.ContentType = ct;

                        // Resolve the promise and return
                        resolve(cfg);
                        return;
                    }

                    // Log
                    console.log("[gd-sprest][Content Type] Creating the '" + cfg.Name + "' content type.");

                    // See if the parent name exists
                    if (cfg.ParentName) {
                        getParentCT(cfg.ParentName, cfg.ParentWebUrl || webUrl).then(
                            // Success
                            ct => {
                                // Add the available content type
                                contentTypes.addAvailableContentType(ct.Id.StringValue).execute(ct => {
                                    // See if it was successful
                                    if (ct.Name) {
                                        // Update the name
                                        (() => {
                                            return new Promise((resolve, reject) => {
                                                // Ensure the name doesn't need to be updated
                                                if (ct.Name != cfg.Name) {
                                                    ct.update({ Name: cfg.Name }).execute(() => {
                                                        // Resolve the promise
                                                        resolve();
                                                    });
                                                } else {
                                                    // Resolve the promise
                                                    resolve();
                                                }
                                            });
                                        })().then(() => {
                                            // Log
                                            console.log("[gd-sprest][Content Type] The content type '" + cfg.Name + "' was created successfully.");

                                            // Update the configuration
                                            cfg.ContentType = ct;

                                            // Trigger the event
                                            cfg.onCreated ? cfg.onCreated(ct) : null;

                                            // Resolve the promise
                                            resolve(cfg);
                                        });
                                    } else {
                                        // Log
                                        console.log("[gd-sprest][Content Type] The content type '" + cfg.Name + "' failed to be created.");
                                        console.error("[gd-sprest][Field] Error: " + ct.response);

                                        // Reject the promise
                                        reject(ct.response);
                                    }
                                }, true);
                            },

                            // Error
                            () => {
                                // Log
                                console.log("[gd-sprest][Content Type] The parent content type '" + cfg.ParentName + "' was not found.");

                                // Reject the promise
                                reject(ct.response);
                            }
                        );
                    } else {
                        // Create the content type
                        contentTypes.add({
                            Description: cfg.Description,
                            Group: cfg.Group,
                            Id: cfg.Id || "0x0100" + ContextInfo.generateGUID().replace("{", "").replace("-", "").replace("}", ""),
                            Name: cfg.Name
                        }).execute((ct) => {
                            // See if it was successful
                            if (ct.Name) {
                                // Log
                                console.log("[gd-sprest][Content Type] The content type '" + cfg.Name + "' was created successfully.");

                                // Update the configuration
                                cfg.ContentType = ct;

                                // Trigger the event
                                cfg.onCreated ? cfg.onCreated(ct) : null;

                                // Resolve the promise
                                resolve(cfg);
                            } else {
                                // Log
                                console.log("[gd-sprest][Content Type] The content type '" + cfg.Name + "' failed to be created.");
                                console.error("[gd-sprest][Field] Error: " + ct.response);

                                // Reject the promise
                                reject();
                            }
                        }, reject, true);
                    }
                });
            }).then(() => {
                // Parse the configuration
                for (let i = 0; i < cfgContentTypes.length; i++) {
                    let cfgContentType = cfgContentTypes[i];
                    let cfgUpdate: ISPCfgContentTypeInfo = {} as any;
                    let updateFl = false;

                    // Ensure the content type exists
                    if (cfgContentType.ContentType == null) { continue; }

                    /**
                     * See if we need to update the properties
                     */

                    // Description
                    if (cfgContentType.ContentType.Description != cfgContentType.Description) {
                        // Update the configuration
                        cfgUpdate.Description = cfgContentType.Description;

                        // Set the flag
                        updateFl = true;
                    }

                    // Group
                    if (cfgContentType.ContentType.Group != cfgContentType.Group) {
                        // Update the configuration
                        cfgUpdate.Group = cfgContentType.Group;

                        // Set the flag
                        updateFl = true;
                    }

                    // JSLink
                    if (cfgContentType.ContentType.JSLink != cfgContentType.JSLink) {
                        // Update the configuration
                        cfgUpdate.JSLink = cfgContentType.JSLink;

                        // Set the flag
                        updateFl = true;
                    }

                    // Name
                    if (cfgContentType.ContentType.Name != cfgContentType.Name) {
                        // Update the configuration
                        cfgUpdate.Name = cfgContentType.Name;

                        // Set the flag
                        updateFl = true;
                    }

                    // See if an update is needed
                    if (updateFl) {
                        // Log
                        console.log("[gd-sprest][Content Type][" + cfgContentType.ContentType.Name + "] Updating the content type.");

                        // Update the content type
                        cfgContentType.ContentType.update({ JSLink: cfgContentType.JSLink }).execute(() => {
                            // Log
                            console.log("[gd-sprest][Content Type][" + cfgContentType.ContentType.Name + "] Update request completed.");

                            // Trigger the event
                            cfgContentType.onUpdated ? cfgContentType.onUpdated(cfgContentType.ContentType) : null;
                        });
                    } else {
                        // Trigger the event
                        cfgContentType.onUpdated ? cfgContentType.onUpdated(cfgContentType.ContentType) : null;
                    }
                }

                // Resolve the promise
                resolve();
            }, reject);
        });
    }

    // Method to create the fields`
    let createFields = (fields: SP.IFieldCollection, cfgFields: Array<ISPCfgFieldInfo>): PromiseLike<void> => {
        // Return a promise
        return new Promise((resolve, reject) => {
            // Ensure fields exist
            if (cfgFields == null || cfgFields.length == 0) {
                // Resolve the promise
                resolve();
                return;
            }

            // Parse the configuration
            Executor<ISPCfgFieldInfo>(cfgFields, cfg => {
                return new Promise((resolve, reject) => {
                    // See if this field already exists
                    let field = isInCollection("InternalName", cfg.name, fields.results);
                    if (field) {
                        // Log
                        console.log("[gd-sprest][Field] The field '" + cfg.name + "' already exists.");

                        // Trigger the event
                        cfg.onUpdated ? cfg.onUpdated(field) : null;

                        // Resolve the promise
                        resolve();
                    } else {
                        // Log
                        console.log("[gd-sprest][Field] Creating the '" + cfg.name + "' field.");

                        // Compute the schema xml
                        FieldSchemaXML(cfg).then(response => {
                            let schemas: Array<string> = typeof (response) === "string" ? [response] : response as any;

                            // Parse the fields to add
                            for (let i = 0; i < schemas.length; i++) {
                                // Add the field
                                fields.createFieldAsXml(schemas[i]).execute((field: SP.Field) => {
                                    // See if it was successful
                                    if (field.InternalName) {
                                        // Log
                                        console.log("[gd-sprest][Field] The field '" + field.InternalName + "' was created successfully.");

                                        // Trigger the event
                                        cfg.onCreated ? cfg.onCreated(field) : null;

                                        // Resolve the promise
                                        resolve();
                                    } else {
                                        // Log
                                        console.log("[gd-sprest][Field] The field '" + cfg.name + "' failed to be created.");
                                        console.error("[gd-sprest][Field] Error: " + field.response);

                                        // Reject the promise
                                        reject();
                                    }
                                });
                            }
                        });
                    }
                });
            }).then(resolve);
        })
    }

    // Method to create the lists
    let createLists = (lists: SP.IListCollection, cfgLists: Array<ISPCfgListInfo>): PromiseLike<void> => {
        // Return a promise
        return new Promise((resolve, reject) => {
            // Execute code against each list configuration
            Executor<ISPCfgListInfo>(cfgLists, cfgList => {
                // Return a promise
                return new Promise((resolve) => {
                    // See if the target name exists and matches this list
                    if (_cfgType && _targetName) {
                        // Ensure it's for this list
                        if (cfgList.ListInformation.Title.toLowerCase() != _targetName) {
                            // Do nothing
                            resolve();
                            return;
                        }
                    }

                    // See if this list already exists
                    let list = isInCollection("Title", cfgList.ListInformation.Title, lists.results);
                    if (list) {
                        // Log
                        console.log("[gd-sprest][List] The list '" + cfgList.ListInformation.Title + "' already exists.");

                        // Resolve the promise and do nothing
                        resolve();
                        return;
                    }

                    // Log
                    console.log("[gd-sprest][List] Creating the '" + cfgList.ListInformation.Title + "' list.");

                    // Update the list name and remove spaces
                    let listInfo = cfgList.ListInformation;
                    let listName = listInfo.Title;
                    listInfo.Title = listName.replace(/ /g, "");

                    // Add the list
                    lists.add(listInfo)
                        // Execute the request
                        .execute((list) => {
                            // Restore the list name in the configuration
                            listInfo.Title = listName;

                            // See if the request was successful
                            if (list.Id) {
                                // See if we need to update the list
                                if (list.Title != listName) {
                                    // Update the list
                                    list.update({ Title: listName }).execute(() => {
                                        // Log
                                        console.log("[gd-sprest][List] The list '" + list.Title + "' was created successfully.");

                                        // Resolve the promise
                                        resolve();
                                    });
                                } else {
                                    // Log
                                    console.log("[gd-sprest][List] The list '" + list.Title + "' was created successfully.");

                                    // Resolve the promise
                                    resolve();
                                }

                                // Trigger the event
                                cfgList.onCreated ? cfgList.onCreated(list) : null;
                            } else {
                                // Log
                                console.log("[gd-sprest][List] The list '" + listInfo.Title + "' failed to be created.");
                                console.log("[gd-sprest][List] Error: '" + list.response);

                                // Resolve the promise
                                resolve();
                            }
                        }, reject);
                });
            }).then(() => {
                // Update the lists
                updateLists(cfgLists).then(() => {
                    // Resolve the promise
                    resolve();
                });
            })
        });
    }

    // Method to create the user custom actions
    let createUserCustomActions = (customActions: SP.IUserCustomActionCollection, cfgCustomActions: Array<SP.UserCustomActionProps>): PromiseLike<void> => {
        // Return a promise
        return new Promise((resolve, reject) => {
            // See if the configuration type exists
            if (_cfgType) {
                // Ensure it's for this type
                if (_cfgType != SPCfgType.SiteUserCustomActions || _cfgType != SPCfgType.WebUserCustomActions) {
                    // Resolve the promise
                    resolve();
                    return;
                }
            }

            // Ensure the lists exist
            if (cfgCustomActions == null || cfgCustomActions.length == 0) {
                // Resolve the promise and return it
                resolve();
                return;
            }

            // Parse the configuration
            Executor<SP.UserCustomActionProps>(cfgCustomActions, cfg => {
                // See if the target name exists
                if (_cfgType && _targetName) {
                    // Ensure it's for this custom action
                    if (cfg.Name.toLowerCase() != _targetName ||
                        cfg.Title.toLowerCase() != _targetName) {
                        // Skip this custom action
                        return;
                    }
                }

                // See if this custom action already exists
                if (isInCollection("Name", cfg.Name, customActions.results)) {
                    // Log
                    console.log("[gd-sprest][Custom Action] The custom action '" + cfg.Name + "' already exists.");
                } else {
                    // See if rights exist
                    if (cfg.Rights) {
                        // Update the value
                        cfg.Rights = updateBasePermissions(cfg.Rights) as any;
                    }

                    // Add the custom action
                    customActions.add(cfg).execute((ca) => {
                        // Ensure it exists
                        if (ca.existsFl) {
                            // Log
                            console.log("[gd-sprest][Custom Action] The custom action '" + ca.Name + "' was created successfully.");
                        } else {
                            // Log
                            console.log("[gd-sprest][Custom Action] The custom action '" + ca.Name + "' failed to be created.");
                            console.log("[gd-sprest][Custom Action] Error: " + ca.response);
                        }
                    }, reject, true);
                }
            }).then(resolve);
        });
    }

    // Method to create the list views
    let createViews = (views: SP.IViewCollection, cfgViews: Array<ISPCfgViewInfo>): PromiseLike<void> => {
        // Return a promise
        return new Promise((resolve, reject) => {
            // Ensure the list views exist
            if (cfgViews == null || cfgViews.length == 0) {
                // Resolve the promise and return it
                resolve();
                return;
            }

            // Parse the configuration
            Executor<ISPCfgViewInfo>(cfgViews, cfg => {
                // See if this view exists
                let view: SP.View = isInCollection("Title", cfg.ViewName, views.results);
                if (view) {
                    // Log
                    console.log("[gd-sprest][View] The view '" + cfg.ViewName + "' already exists.");
                } else {
                    // Add the view
                    views.add({
                        Title: cfg.ViewName,
                        ViewQuery: cfg.ViewQuery
                    }).execute((view) => {
                        // Ensure it exists
                        if (view.existsFl) {
                            // Log
                            console.log("[gd-sprest][View] The view '" + cfg.ViewName + "' was created successfully.");

                            // Trigger the event
                            cfg.onCreated ? cfg.onCreated(view) : null;
                        } else {
                            // Log
                            console.log("[gd-sprest][View] The view '" + cfg.ViewName + "' failed to be created.");
                            console.log("[gd-sprest][View] Error: " + view.response);
                        }
                    }, reject, true);
                }
            }).then(() => {
                // Update the views
                updateViews(views, cfgViews).then(() => {
                    // Resolve the promise
                    resolve();
                });
            });
        });
    }

    // Method to create the web parts
    let createWebParts = (): PromiseLike<void> => {
        // Return a promise
        return new Promise((resolve, reject) => {
            let cfgWebParts = cfg.WebPartCfg;

            // Log
            console.log("[gd-sprest][WebPart] Creating the web parts.");

            // Get the root web
            Web(ContextInfo.siteServerRelativeUrl)
                // Get the web part catalog
                .getCatalog(SPTypes.ListTemplateType.WebPartCatalog)
                // Get the root folder
                .RootFolder()
                // Expand the files and items
                .query({
                    Expand: ["Files"]
                })
                // Execute the request
                .execute(folder => {
                    let ctr = 0;

                    // Parse the configuration
                    for (let i = 0; i < cfgWebParts.length; i++) {
                        let cfgWebPart = cfgWebParts[i];

                        // See if the target name exists
                        if (_cfgType && _targetName) {
                            // Ensure it's for this list
                            if (cfgWebPart.FileName.toLowerCase() != _targetName) {
                                // Skip this list
                                continue;
                            }
                        }

                        // The post execute method
                        let postExecute = () => {
                            // Increment the counter
                            if (++ctr >= cfgWebParts.length) {
                                // Resolve the promise
                                resolve();
                            }
                        }

                        // See if this webpart exists
                        let file: SP.File = isInCollection("Name", cfgWebPart.FileName, folder.Files.results);
                        if (file.Name) {
                            // Log
                            console.log("[gd-sprest][WebPart] The webpart '" + cfgWebPart.FileName + "' already exists.");

                            // Trigger the event
                            cfgWebPart.onUpdated ? cfgWebPart.onUpdated(file) : null;

                            // Execute the post event
                            postExecute();
                        } else {
                            // Trim the xml
                            let xml = cfgWebPart.XML.trim();

                            // Convert the string to an array buffer
                            let buffer = new ArrayBuffer(xml.length * 2);
                            let bufferView = new Uint16Array(buffer);
                            for (let j = 0; j < xml.length; j++) {
                                bufferView[j] = xml.charCodeAt(j);
                            }

                            // Create the webpart, but execute the requests one at a time
                            folder.Files.add(cfgWebPart.FileName, true, buffer).execute((file) => {
                                // See if group exists
                                if (cfgWebPart.Group) {
                                    // Set the target to the root web
                                    Web(ContextInfo.siteServerRelativeUrl)
                                        // Get the web part catalog
                                        .getCatalog(SPTypes.ListTemplateType.WebPartCatalog)
                                        // Get the Items
                                        .Items()
                                        // Query for this webpart
                                        .query({
                                            Filter: "FileLeafRef eq '" + cfgWebPart.FileName + "'"
                                        })
                                        // Execute the request
                                        .execute((items) => {
                                            // Update the item
                                            items.results[0].update({
                                                Group: cfgWebPart.Group
                                            }).execute(postExecute);
                                        });
                                }

                                // Log
                                console.log("[gd-sprest][WebPart] The '" + file.Name + "' webpart file was uploaded successfully.");

                                // Trigger the event
                                cfgWebPart.onCreated ? cfgWebPart.onCreated(file) : null;
                            });
                        }
                    }
                }, reject);
        });
    }

    // Method to see if an object exists in a collection
    let isInCollection = (key: string, value: string, collection: Array<any>) => {
        let valueLower = value.toLowerCase();

        // Parse the collection
        for (let i = 0; i < collection.length; i++) {
            let keyValue = collection[i][key];
            keyValue = keyValue ? keyValue.toLowerCase() : "";

            // See if the item exists
            if (valueLower == keyValue) {
                // Return true
                return collection[i];
            }
        }

        // Not in the collection
        return false;
    }

    // Method to remove the content type
    let removeContentTypes = (contentTypes: SP.IContentTypeCollection, cfgContentTypes: Array<ISPCfgContentTypeInfo>): PromiseLike<void> => {
        // Return a promise
        return new Promise((resolve, reject) => {
            // Ensure the content types exist
            if (cfgContentTypes == null || cfgContentTypes.length == 0) {
                // Resolve the promise and return it
                resolve();
                return;
            }

            // Parse the configuration
            Executor<ISPCfgContentTypeInfo>(cfgContentTypes, cfg => {
                // Get the field
                let ct: SP.ContentType = isInCollection("Name", cfg.Name, contentTypes.results);
                if (ct) {
                    // Remove the field
                    ct.delete().execute(() => {
                        // Log
                        console.log("[gd-sprest][Field] The content type '" + ct.Name + "' was removed.");
                    }, reject, true);
                }
            }).then(resolve);
        });
    }

    // Method to remove the fields
    let removeFields = (fields: SP.IFieldCollection, cfgFields: Array<ISPCfgFieldInfo>): PromiseLike<void> => {
        // Return a promise
        return new Promise((resolve, reject) => {
            // Ensure the fields exist
            if (cfgFields == null || cfgFields.length == 0) {
                // Resolve the promise and return it
                resolve();
                return;
            }

            // Parse the configuration
            Executor<ISPCfgFieldInfo>(cfgFields, cfg => {
                // Get the field
                let field: SP.Field = isInCollection("InternalName", cfg.name, fields.results);
                if (field) {
                    // Remove the field
                    field.delete().execute(() => {
                        // Log
                        console.log("[gd-sprest][Field] The field '" + field.InternalName + "' was removed.");
                    }, reject, true);
                }
            }).then(resolve);
        });
    }

    // Method to remove the lists
    let removeLists = (lists: SP.IListCollection, cfgLists: Array<ISPCfgListInfo>): PromiseLike<void> => {
        // Return a promise
        return new Promise((resolve, reject) => {
            // See if the configuration type exists
            if (_cfgType) {
                // Ensure it's for this type
                if (_cfgType != SPCfgType.Lists) {
                    // Resolve the promise
                    resolve();
                    return;
                }
            }

            // Ensure the lists exist
            if (cfgLists == null || cfgLists.length == 0) {
                // Resolve the promise and return it
                resolve();
                return;
            }

            // Parse the configuration
            Executor<ISPCfgListInfo>(cfgLists, cfg => {
                // See if the target name exists
                if (_cfgType && _targetName) {
                    // Ensure it's for this list
                    if (cfg.ListInformation.Title.toLowerCase() != _targetName) {
                        // Skip this list
                        return;
                    }
                }

                // Get the list
                let list: SP.List = isInCollection("Title", cfg.ListInformation.Title, lists.results);
                if (list) {
                    // Remove the list
                    list.delete().execute(() => {
                        // Log
                        console.log("[gd-sprest][List] The list '" + list.Title + "' was removed.");
                    }, reject, true);
                }
            }).then(resolve);
        });
    }
    // Method to remove the user custom actions
    let removeUserCustomActions = (customActions: SP.IUserCustomActionCollection, cfgCustomActions: Array<SP.UserCustomActionProps>): PromiseLike<void> => {
        // Return a promise
        return new Promise((resolve, reject) => {
            // See if the configuration type exists
            if (_cfgType) {
                // Ensure it's for this type
                if (_cfgType != SPCfgType.SiteUserCustomActions || _cfgType != SPCfgType.WebUserCustomActions) {
                    // Resolve the promise
                    resolve();
                    return;
                }
            }

            // Ensure the custom actions exist
            if (cfgCustomActions == null || cfgCustomActions.length == 0) {
                // Resolve the promise and return it
                resolve();
                return;
            }

            // Parse the configuration
            Executor<SP.UserCustomActionProps>(cfgCustomActions, cfg => {
                // See if the target name exists
                if (_cfgType && _targetName) {
                    // Ensure it's for this custom action
                    if (cfg.Name.toLowerCase() != _targetName ||
                        cfg.Title.toLowerCase() != _targetName) {
                        // Skip this custom action
                        return;
                    }
                }

                // Get the custom action
                let ca: SP.UserCustomAction = isInCollection("Name", cfg.Name, customActions.results);
                if (ca) {
                    // Remove the custom action
                    ca.delete().execute(() => {
                        // Log
                        console.log("[gd-sprest][Custom Action] The custom action '" + ca.Name + "' was removed.");
                    }, reject, true);
                }
            }).then(resolve);
        });
    }

    // Method to remove the web parts
    let removeWebParts = (): PromiseLike<void> => {
        let cfgWebParts = cfg.WebPartCfg;

        // Return a promise
        return new Promise((resolve, reject) => {
            // See if the configuration type exists
            if (_cfgType) {
                // Ensure it's for this type
                if (_cfgType != SPCfgType.WebParts) {
                    // Resolve the promise
                    resolve();
                    return;
                }
            }

            // Ensure the configuration exists
            if (cfgWebParts == null || cfgWebParts.length == 0) {
                // Resolve the promise and return it
                resolve();
                return;
            }

            // Log
            console.log("[gd-sprest][WebPart] Removing the web parts.");

            // Get the root web
            Web(ContextInfo.siteServerRelativeUrl)
                // Get the webpart gallery
                .getCatalog(SPTypes.ListTemplateType.WebPartCatalog)
                // Get the root folder
                .RootFolder()
                // Expand the files
                .Files()
                // Execute the request
                .execute(files => {
                    // Parse the configuration
                    for (let i = 0; i < cfgWebParts.length; i++) {
                        let cfgWebPart = cfgWebParts[i];

                        // See if the target name exists
                        if (_cfgType && _targetName) {
                            // Ensure it's for this webpart
                            if (cfgWebPart.FileName.toLowerCase() != _targetName) {
                                // Skip this webpart
                                continue;
                            }
                        }

                        // Get the file
                        let file: SP.File = isInCollection("Name", cfgWebPart.FileName, files.results)
                        if (file) {
                            // Remove the file
                            file.delete().execute(() => {
                                // Log
                                console.log("[gd-sprest][WebPart] The webpart '" + file.Name + "' file was removed.");
                            }, true);
                        }
                    }

                    // Resolve the promise
                    resolve();
                }, reject);
        });
    }

    // Method to get the web information
    let setRequestDigest = (): PromiseLike<void> => {
        // Return a promise
        return new Promise((resolve, reject) => {
            if (webUrl) {
                // Get the web context information
                ContextInfo.getWeb(webUrl).execute(webInfo => {
                    _requestDigest = webInfo.GetContextWebInformation.FormDigestValue;

                    // Resolve the promise
                    resolve();
                }, reject);
            } else {
                // Resolve the promise
                resolve();
            }
        });
    }

    // Method to update the base permissions
    let updateBasePermissions = (values: SP.BasePermissions) => {
        let high = values.High;
        let low = values.Low;

        // See if this is an array
        for (let i = 0; i < values["length"]; i++) {
            let value = values[i];

            // See if this is the full mask
            if (value == 65) {
                // Set the values
                low = 65535;
                high = 32767;

                // Break from the loop
                break;
            }
            // Else, see if it's empty
            else if (value == 0) {
                // Clear the values
                low = 0;
                high = 0;
            }
            // Else, update the base permission
            else {
                let bit = value - 1;
                let bitValue = 1;

                // Validate the bit
                if (bit < 0) { continue; }

                // See if it's a low permission
                if (bit < 32) {
                    // Compute the value
                    bitValue = bitValue << bit;

                    // Set the low value
                    low |= bitValue;
                }
                // Else, it's a high permission
                else {
                    // Compute the value
                    bitValue = bitValue << (bit - 32);

                    // Set the high value
                    high |= bitValue;
                }
            }
        }

        // Return the base permission
        return {
            Low: low.toString(),
            High: high.toString()
        };
    }

    // Method to update the lists
    let updateLists = (cfgLists: Array<ISPCfgListInfo>): PromiseLike<void> => {
        // Return a promise
        return new Promise((resolve, reject) => {
            let request = (idx: number, resolve) => {
                // Get the list configuration
                let cfgList = cfgLists[idx];

                // See if the target name exists
                if (_targetName) {
                    // Ensure it's for this list
                    if (cfgList.ListInformation.Title.toLowerCase() != _targetName) {
                        // Update the next list
                        request(idx + 1, resolve);
                        return;
                    }
                }

                // Ensure the configuration exists
                if (cfgList) {
                    // Get the web
                    Web(webUrl, { requestDigest: _requestDigest })
                        // Get the list
                        .Lists(cfgList.ListInformation.Title)
                        // Expand the content types, fields and views
                        .query({
                            Expand: ["ContentTypes", "Fields", "UserCustomActions", "Views"]
                        })
                        // Execute the request
                        .execute(list => {
                            // Update the title field
                            updateListTitleField(list, cfgList).then(() => {
                                // Create the fields
                                createFields(list.Fields, cfgList.CustomFields).then(() => {
                                    // Create the content types
                                    createContentTypes(list.ContentTypes, cfgList.ContentTypes).then(() => {
                                        // Update the views
                                        createViews(list.Views, cfgList.ViewInformation).then(() => {
                                            // Update the views
                                            createUserCustomActions(list.UserCustomActions, cfgList.UserCustomActions).then(() => {
                                                // Trigger the event
                                                cfgList.onUpdated ? cfgList.onUpdated(list as any) : null;

                                                // Update the next list
                                                request(idx + 1, resolve);
                                            }, reject);
                                        }, reject);
                                    }, reject);
                                }, reject);
                            }, reject);
                        }, reject);
                } else {
                    // Resolve the promise
                    resolve();
                }
            }

            // Execute the request
            request(0, resolve);
        });
    }

    // Method to update the list title field
    let updateListTitleField = (list: SP.IListQuery, cfgList: ISPCfgListInfo): PromiseLike<void> => {
        // Return a promise
        return new Promise((resolve, reject) => {
            // See if the title field is being updated
            if (cfgList.TitleFieldDisplayName) {
                // Update the field name
                list.Fields.getByTitle("Title").update({ Title: cfgList.TitleFieldDisplayName }).execute(() => {
                    // Log
                    console.log("[gd-sprest][List] The 'Title' field's display name was updated to '" + cfgList.TitleFieldDisplayName + "'.");

                    // Resolve the promise
                    resolve();
                }, reject);
            } else {
                // Resolve the promise
                resolve();
            }
        });
    }

    // Method to update the views
    let updateViews = (views: SP.IViewCollection, cfgViews: Array<ISPCfgViewInfo>): PromiseLike<void> => {
        // Return a promise
        return new Promise((resolve, reject) => {
            // Parse the configuration
            Executor<ISPCfgViewInfo>(cfgViews, cfg => {
                // Get the view
                let view = views.getByTitle(cfg.ViewName);

                // See if the view fields are defined
                if (cfg.ViewFields && cfg.ViewFields.length > 0) {
                    // Log
                    console.log("[gd-sprest][View] Updating the view fields for the '" + cfg.ViewName + "' view.");

                    // Clear the view fields
                    view.ViewFields().removeAllViewFields().execute(true);

                    // Parse the view fields
                    for (let i = 0; i < cfg.ViewFields.length; i++) {
                        // Add the view field
                        view.ViewFields().addViewField(cfg.ViewFields[i]).execute(true);
                    }
                }

                // See if we are updating the view properties
                if (cfg.JSLink || cfg.ViewQuery) {
                    let props = {};

                    // Log
                    console.log("[gd-sprest][View] Updating the view properties for the '" + cfg.ViewName + "' view.");

                    // Set the properties
                    cfg.JSLink ? props["JSLink"] = cfg.JSLink : null;
                    cfg.ViewQuery ? props["ViewQuery"] = cfg.ViewQuery : null;

                    // Update the view
                    view.update(props).execute(true);
                }

                // Wait for the requests to complete
                view.done((...args) => {
                    // Log
                    console.log("[gd-sprest][View] The updates for the '" + cfg.ViewName + "' view has completed.");

                    // Trigger the event
                    cfg.onUpdated ? cfg.onUpdated(view as any) : null;

                    // Resolve the promise
                    resolve();
                });
            }).then(resolve);
        });
    }

    // Method to uninstall the site components
    let uninstallSite = (): PromiseLike<SP.ISiteQuery> => {
        // Return a promise
        return new Promise((resolve, reject) => {
            // Log
            console.log("[gd-sprest][uninstall] Loading the site information...");

            // Ensure site actions exist
            if (cfg.CustomActionCfg == null || cfg.CustomActionCfg.Site == null) {
                // Resolve the promise
                resolve();
                return;
            }

            // Get the site
            Site(webUrl, { requestDigest: _requestDigest })
                // Expand the user custom actions
                .query({
                    Expand: ["UserCustomActions"]
                })
                // Execute the request
                .execute(site => {
                    // Remove the user custom actions
                    removeUserCustomActions(site.UserCustomActions, cfg.CustomActionCfg ? cfg.CustomActionCfg.Site : []).then(() => {
                        // Resolve the promise
                        resolve(site);
                    });
                }, reject);
        });
    }

    // Method to uninstall the web components
    let uninstallWeb = (): PromiseLike<void> => {
        // Return a promise
        return new Promise((resolve, reject) => {
            let Expand: Array<string> = [];

            // Log
            console.log("[gd-sprest][uninstall] Loading the web information...");

            // Set the query
            if (cfg.ContentTypes) { Expand.push("ContentTypes"); }
            if (cfg.CustomActionCfg) { Expand.push("UserCustomActions"); }
            if (cfg.Fields) { Expand.push("Fields"); }
            if (cfg.ListCfg) { Expand.push("Lists"); }

            // Query the web
            Web(webUrl, { requestDigest: _requestDigest }).query({ Expand })
                // Execute the request
                .execute(web => {
                    // Remove the fields
                    removeFields(web.Fields, cfg.Fields).then(() => {
                        // Remove the content types
                        removeContentTypes(web.ContentTypes, cfg.ContentTypes).then(() => {
                            // Remove the lists
                            removeLists(web.Lists, cfg.ListCfg).then(() => {
                                // Remove the web custom actions
                                removeUserCustomActions(web.UserCustomActions, cfg.CustomActionCfg ? cfg.CustomActionCfg.Web : null).then(() => {
                                    // Resolve the promise
                                    resolve();
                                }, reject);
                            }, reject)
                        }, reject)
                    }, reject);
                }, reject);
        });
    }

    /**
     * Public Interface
     */
    return {
        // The configuration
        _configuration: cfg,

        // Method to install the configuration
        install: (): PromiseLike<void> => {
            // Return a promise
            return new Promise((resolve, reject) => {
                // Set the request digest
                setRequestDigest().then(() => {
                    let ctr = 0;
                    let ctrExecutions = 0;

                    // Log
                    console.log("[gd-sprest] Installing the web assets...");

                    // Get the web
                    let web = Web(webUrl, { requestDigest: _requestDigest });

                    // The post execution method
                    let postExecute = () => {
                        // See if we have completed the executions
                        if (++ctr >= ctrExecutions) {
                            // Resolve the promise
                            resolve();
                        }
                    }

                    // See if we are creating fields
                    if (cfg.Fields && cfg.Fields.length > 0) {
                        // Increment the counter
                        ctrExecutions++;

                        // Log
                        console.log("[gd-sprest][Fields] Starting the requests.");

                        // Get the fields
                        web.Fields().execute(fields => {
                            // Create the fields
                            createFields(fields, cfg.Fields).then(() => {
                                // Log
                                console.log("[gd-sprest][Fields] Completed the requests.");

                                // Execute the post execute method
                                postExecute();
                            }, reject);
                        }, reject);
                    }

                    // See if we are creating the content types
                    if (cfg.ContentTypes && cfg.ContentTypes.length > 0) {
                        // Increment the counter
                        ctrExecutions++;

                        // Log
                        console.log("[gd-sprest][Content Types] Starting the requests.");

                        // Get the content types
                        web.ContentTypes().execute(contentTypes => {
                            // Create the content types
                            createContentTypes(contentTypes, cfg.ContentTypes).then(() => {
                                // Log
                                console.log("[gd-sprest][Content Types] Completed the requests.");

                                // Execute the post execute method
                                postExecute();
                            });
                        }, reject, true);
                    }

                    // See if we are creating the lists
                    if (cfg.ListCfg && cfg.ListCfg.length) {
                        // Increment the counter
                        ctrExecutions++;

                        // Log
                        console.log("[gd-sprest][Lists] Starting the requests.");

                        // Get the lists
                        web.Lists().execute(lists => {
                            // Create the lists
                            createLists(lists, cfg.ListCfg).then(() => {
                                // Log
                                console.log("[gd-sprest][Lists] Completed the requests.");

                                // Execute the post execute method
                                postExecute();
                            });
                        }, reject, true);
                    }

                    // See if we are creating the webparts
                    if (cfg.WebPartCfg && cfg.WebPartCfg.length > 0) {
                        // Increment the counter
                        ctrExecutions++;

                        // Log
                        console.log("[gd-sprest][WebParts] Starting the requests.");

                        // Create the webparts
                        createWebParts().then(() => {
                            // Log
                            console.log("[gd-sprest][WebParts] Completed the requests.");

                            // Execute the post execute method
                            postExecute();
                        });
                    }

                    // See if we are creating custom actions
                    if (cfg.CustomActionCfg) {
                        // See if we are targeting the site collection
                        if (cfg.CustomActionCfg.Site) {
                            // Increment the counter
                            ctrExecutions++;

                            // Log
                            console.log("[gd-sprest][Site Custom Actions] Starting the requests.");

                            // Get the site
                            Site(webUrl, { requestDigest: _requestDigest })
                                // Get the user custom actions
                                .UserCustomActions().execute(customActions => {
                                    // Create the user custom actions
                                    createUserCustomActions(customActions, cfg.CustomActionCfg.Site).then(() => {
                                        // Log
                                        console.log("[gd-sprest][Site Custom Actions] Completed the requests.");

                                        // Execute the post execute method
                                        postExecute();
                                    });
                                });
                        }

                        // See if we are targeting the web
                        if (cfg.CustomActionCfg.Web) {
                            // Increment the counter
                            ctrExecutions++;

                            // Log
                            console.log("[gd-sprest][Web Custom Actions] Starting the requests.");

                            // Get the user custom actions
                            web.UserCustomActions().execute(customActions => {
                                // Create the user custom actions
                                createUserCustomActions(customActions, cfg.CustomActionCfg.Web).then(() => {
                                    // Log
                                    console.log("[gd-sprest][Web Custom Actions] Completed the requests.");

                                    // Execute the post execute method
                                    postExecute();
                                });
                            }, reject);
                        }
                    }
                });
            });
        },

        // Method to uninstall the configuration
        uninstall: (): PromiseLike<void> => {
            // Return a promise
            return new Promise((resolve, reject) => {
                // Set the request digest
                setRequestDigest().then(() => {
                    // Uninstall the web components
                    uninstallWeb().then(() => {
                        // Uninstall the site components
                        uninstallSite().then(() => {
                            // Remove the webparts
                            removeWebParts().then(() => {
                                // Log
                                console.log("[gd-sprest] The configuration script completed, but some requests may still be running.");

                                // Resolve the promise
                                resolve();
                            }, reject);
                        }, reject);
                    }, reject);
                });
            });
        }
    };
}