import { DependencyContainer } from "tsyringe";

import { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";
import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { InstanceManager } from "./Refs/InstanceManager";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { LogTextColor } from "@spt/models/spt/logging/LogTextColor";
import { ITemplateItem } from "@spt/models/eft/common/tables/ITemplateItem";

class AdjustableContainerFilters implements IPreSptLoadMod, IPostDBLoadMod 
{

    private mod = require("../package.json");
    private modLabel = `[${this.mod.name}@${this.mod.version}]`;
    private instance: InstanceManager = new InstanceManager();
    private modConfig = require("../config/config.json");
    private logger;
    private items;

    public preSptLoad(container: DependencyContainer): void 
    {
        this.instance.preSptLoad(container, "Adjustable Container Filters");
    }

    postDBLoad(container: DependencyContainer): void 
    {
        const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        const tables: IDatabaseTables = databaseServer.getTables();
        this.items = tables.templates.items;

        const logger = container.resolve<ILogger>("WinstonLogger");
        this.logger = logger;

        // Cycles through all listed containers in modConfig,
        // varifies that they are items in the database,
        // then varifies that the containers filters are not empty
        if (this.modConfig.removeAllFilters) logger.log("[ACF] Removing all filters, make sure this loads after all item mods.", LogTextColor.YELLOW);
        this.modConfig.Containers.forEach(containerId => 
        {
            const container = this.items[containerId];
            if (container == null)
            {
                logger.log("[ACF]" + containerId + " no such item in database.", LogTextColor.RED);
                return;
            }
            if (this.modConfig.removeAllFilters)
            {
                container._props.Grids.forEach(grid => 
                {
                    grid._props.filters = [];
                });
                //container._props.Grids[0]._props.filters = [];
                return;
            } 
            if (this.modConfig[container._id].removeFilters)
            {
                logger.log("[ACF] Removing " + this.modConfig[container._id].name + "'s filters, make sure this loads after all item mods.", LogTextColor.YELLOW);
                container._props.Grids.forEach(grid => 
                {
                    grid._props.filters = [];
                });
                //container._props.Grids[0]._props.filters = [];
                return;
            }
            if (this.modConfig[container._id].Filter[0] != null)
            {
                this.removeItemsFromExcludedFilter(container);
                this.addItemsToAcceptedFilter(container);
            }
            if (this.modConfig[container._id].ExcludedFilter[0] != null)
            {
                this.removeItemsFromAcceptedFilter(container);
                this.addItemsToExcludedFilter(container);
            }
            if (this.modConfig[container._id].Filter[0] == null && 
                this.modConfig[container._id].ExcludedFilter[0] == null)
            {
                logger.log("[ACF]" + this.modConfig[container._id].name + " no changes in file.", LogTextColor.GRAY);
                return;
            }
            //this.removeItemsFromExcludedFilter(container);
            // this.removeItemsFromAcceptedFilter(container);
            // this.addItemsToExcludedFilter(container);
            //this.addItemsToAcceptedFilter(container);
            logger.log("[ACF]" + this.modConfig[container._id].name + " filters have been updated.", LogTextColor.YELLOW);

        });
        logger.log("[ACF]" + this.modLabel + " Load Successful...", LogTextColor.GREEN);
    }
    // Removes items from cases excluded filter if they are listed in the mods excluded array
    private removeItemsFromExcludedFilter(container: ITemplateItem)
    {
        const itemProps = container._props;
        const itemId = container._id;

        this.modConfig[itemId]?.Filter.forEach(element => 
        {
            if (this.items[element] == null)
            {
                this.logger.log("[ACF]" + element + " no such item in database.", LogTextColor.RED);
                return;
            }
            if (this.modConfig.enableLogging) this.logger.log("[ACF]" + element.toString(), LogTextColor.YELLOW);
            try
            {
                itemProps.Grids.forEach(grid => 
                {
                    const filters = grid._props.filters;
                    if (filters[0]?.ExcludedFilter)
                    {
                    // Finds item location in array by string
                        const numb = filters[0]?.ExcludedFilter.indexOf(element);
                        if (this.modConfig.enableLogging) this.logger.log("[ACF]" + numb.toString(), LogTextColor.GREEN);
                    
                        if (numb >= 0)
                        {
                        // splice is used to delete item at array location
                            const testItem = filters[0]?.ExcludedFilter.splice(numb, 1);
                            if (this.modConfig.enableLogging) this.logger.log("[ACF]" + testItem + " deleted", LogTextColor.WHITE);
                        }
                        else
                        {
                            if (this.modConfig.enableLogging) this.logger.log("[ACF]" + element + " not in items filter.", LogTextColor.WHITE);
                        }
                        if (this.modConfig.enableLogging) this.logger.log("[ACF] Modified  " + this.modConfig[itemId]?.name + "'s excluded filter", LogTextColor.GRAY);
                    }
                });
                // const filters = itemProps.Grids[0]._props.filters;
                // if (filters[0]?.ExcludedFilter)
                // {
                //     // Finds item location in array by string
                //     const numb = filters[0]?.ExcludedFilter.indexOf(element);
                //     if (this.modConfig.enableLogging) this.logger.log("[ACF]" + numb.toString(), LogTextColor.GREEN);
                    
                //     if (numb >= 0)
                //     {
                //         // splice is used to delete item at array location
                //         const testItem = filters[0]?.ExcludedFilter.splice(numb, 1);
                //         if (this.modConfig.enableLogging) this.logger.log("[ACF]" + testItem + " deleted", LogTextColor.WHITE);
                //     }
                //     else
                //     {
                //         if (this.modConfig.enableLogging) this.logger.log("[ACF]" + element + " not in items filter.", LogTextColor.WHITE);
                //     }
                //     if (this.modConfig.enableLogging) this.logger.log("[ACF] Modified  " + this.modConfig[itemId]?.name + "'s excluded filter", LogTextColor.GRAY);
                // }
            }
            catch
            {
                if (this.modConfig.enableLogging) this.logger.log("[ACF] Failed to remove items", LogTextColor.RED);
            }
        })
    }
    // Removes items from cases accepted filter if they are listed in the mods excluded array
    private removeItemsFromAcceptedFilter(container: ITemplateItem)
    {
        const itemProps = container._props;
        const itemId = container._id;

        this.modConfig[itemId]?.ExcludedFilter.forEach(element => 
        {
            if (this.items[element] == null)
            {
                this.logger.log("[ACF]" + element + " no such item in database.", LogTextColor.RED);
                return;
            }
            if (this.modConfig.enableLogging) this.logger.log("[ACF]" + element.toString(), LogTextColor.YELLOW);
            try
            {
                itemProps.Grids.forEach(grid => 
                {
                    const filters = grid._props.filters;
                    if (filters[0]?.Filter)
                    {
                    // Finds item location in array by string
                        const numb = filters[0]?.Filter.indexOf(element);
                        if (numb >= 0)
                        {
                        // splice is used to delete item at array location
                            const testItem = filters[0]?.Filter.splice(numb, 1);
                            if (this.modConfig.enableLogging) this.logger.log("[ACF]" + testItem + " deleted", LogTextColor.WHITE);
                        }
                        else
                        {
                            if (this.modConfig.enableLogging) this.logger.log("[ACF]" + element + " not in items filter.", LogTextColor.WHITE);
                        }
                        if (this.modConfig.enableLogging) this.logger.log("[ACF] Modified  " + this.modConfig[itemId]?.name + "'s allowed filter", LogTextColor.GRAY);
                    }
                });
                // const filters = itemProps.Grids[0]._props.filters;
                // if (filters[0]?.Filter)
                // {
                //     // Finds item location in array by string
                //     const numb = filters[0]?.Filter.indexOf(element);
                //     if (numb >= 0)
                //     {
                //         // splice is used to delete item at array location
                //         const testItem = filters[0]?.Filter.splice(numb, 1);
                //         if (this.modConfig.enableLogging) this.logger.log("[ACF]" + testItem + " deleted", LogTextColor.WHITE);
                //     }
                //     else
                //     {
                //         if (this.modConfig.enableLogging) this.logger.log("[ACF]" + element + " not in items filter.", LogTextColor.WHITE);
                //     }
                //     if (this.modConfig.enableLogging) this.logger.log("[ACF] Modified  " + this.modConfig[itemId]?.name + "'s allowed filter", LogTextColor.GRAY);
                // }
            }   
            catch
            {
                if (this.modConfig.enableLogging) this.logger.log("[ACF] Failed to remove items", LogTextColor.RED);
            }
        })
    }
    // Adds items to a cases excluded filter if they are listed in the mods excluded array
    private addItemsToExcludedFilter(container: ITemplateItem)
    {
        const itemProps = container._props;
        const itemId = container._id;

        this.modConfig[itemId]?.ExcludedFilter.forEach(element =>
        {
            if (this.items[element] == null)
            {
                this.logger.log("[ACF]" + element + " no such item in database.", LogTextColor.RED);
                return;
            }
            if (this.modConfig.enableLogging) this.logger.log("[ACF]" + element.toString(), LogTextColor.YELLOW);
            try
            {
                itemProps.Grids.forEach(grid => 
                {
                    const filters = grid._props.filters;
                    if (filters[0]?.ExcludedFilter)
                    {
                        if (this.modConfig[itemId]?.ExcludedFilter.length >= 1)
                        {
                            filters[0]?.ExcludedFilter.push(element);
                            if (this.modConfig.enableLogging) this.logger.log("[ACF]" + element + " added", LogTextColor.WHITE);
                        }
                        else
                        {
                            if (this.modConfig.enableLogging) this.logger.log("[ACF] No items in mods excluded filter.", LogTextColor.WHITE);
                        }
                        if (this.modConfig.enableLogging) this.logger.log("[ACF] Modified  " + this.modConfig[itemId]?.name + "'s excluded filter", LogTextColor.GRAY);
                    }
                });
                // const filters = itemProps.Grids[0]._props.filters;
                // if (filters[0]?.ExcludedFilter)
                // {
                //     if (this.modConfig[itemId]?.ExcludedFilter.length >= 1)
                //     {
                //         filters[0]?.ExcludedFilter.push(element);
                //         if (this.modConfig.enableLogging) this.logger.log("[ACF]" + element + " added", LogTextColor.WHITE);
                //     }
                //     else
                //     {
                //         if (this.modConfig.enableLogging) this.logger.log("[ACF] No items in mods excluded filter.", LogTextColor.WHITE);
                //     }
                //     if (this.modConfig.enableLogging) this.logger.log("[ACF] Modified  " + this.modConfig[itemId]?.name + "'s excluded filter", LogTextColor.GRAY);
                // }
            }
            catch
            {
                if (this.modConfig.enableLogging) this.logger.log("[ACF] Failed to remove items", LogTextColor.RED);
            }

        })
    }
    // Adds items to a cases accepted filter if they are listed in the mods accepted array
    private addItemsToAcceptedFilter(container: ITemplateItem)
    {
        const itemProps = container._props;
        const itemId = container._id;

        this.modConfig[itemId]?.Filter.forEach(element =>
        {
            if (this.items[element] == null)
            {
                this.logger.log("[ACF]" + element + " no such item in database.", LogTextColor.RED);
                return;
            }
            if (this.modConfig.enableLogging) this.logger.log("[ACF]" + element.toString(), LogTextColor.YELLOW);
            try
            {
                itemProps.Grids.forEach(grid => 
                {
                    const filters = grid._props.filters;
                    if (filters[0]?.Filter)
                    {
                        if (this.modConfig[itemId]?.Filter.length >= 1)
                        {
                            filters[0]?.Filter.push(element);
                            if (this.modConfig.enableLogging) this.logger.log("[ACF]" + element + " added", LogTextColor.WHITE);
                        }
                        else
                        {
                            if (this.modConfig.enableLogging) this.logger.log("[ACF] No items in mods filter.", LogTextColor.WHITE);
                        }
                    
                        if (this.modConfig.enableLogging) this.logger.log("[ACF] Modified  " + this.modConfig[itemId]?.name + "'s allowed filter", LogTextColor.GRAY);
                    }
                });
                // const filters = itemProps.Grids[0]._props.filters;
                // if (filters[0]?.Filter)
                // {
                //     if (this.modConfig[itemId]?.Filter.length >= 1)
                //     {
                //         filters[0]?.Filter.push(element);
                //         if (this.modConfig.enableLogging) this.logger.log("[ACF]" + element + " added", LogTextColor.WHITE);
                //     }
                //     else
                //     {
                //         if (this.modConfig.enableLogging) this.logger.log("[ACF] No items in mods filter.", LogTextColor.WHITE);
                //     }
                    
                //     if (this.modConfig.enableLogging) this.logger.log("[ACF] Modified  " + this.modConfig[itemId]?.name + "'s allowed filter", LogTextColor.GRAY);
                // }
            }
            catch
            {
                if (this.modConfig.enableLogging) this.logger.log("[ACF] Failed to remove items", LogTextColor.RED);
            }
        })
    }
}

export const mod = new AdjustableContainerFilters();
