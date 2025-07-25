"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mod = void 0;
const InstanceManager_1 = require("./Refs/InstanceManager");
const LogTextColor_1 = require("C:/snapshot/project/obj/models/spt/logging/LogTextColor");
const HashUtil_1 = require("C:/snapshot/project/obj/utils/HashUtil");
class AdjustableContainerFilters {
    mod = require("../package.json");
    modLabel = `[${this.mod.name}@${this.mod.version}]`;
    instance = new InstanceManager_1.InstanceManager();
    modConfig = require("../config/config.json");
    logger;
    hashUtil = HashUtil_1.HashUtil;
    items;
    preSptLoad(container) {
        this.instance.preSptLoad(container, "Adjustable Container Filters");
    }
    postDBLoad(container) {
        const databaseServer = container.resolve("DatabaseServer");
        const tables = databaseServer.getTables();
        this.items = tables.templates.items;
        const logger = container.resolve("WinstonLogger");
        this.logger = logger;
        // Cycles through all listed containers in modConfig,
        // varifies that they are items in the database,
        // then varifies that the containers filters are not empty
        if (this.modConfig.removeAllFilters)
            logger.log("Removing all filters, make sure this loads after all item mods.", LogTextColor_1.LogTextColor.YELLOW);
        this.modConfig.Containers.forEach(containerId => {
            const container = this.items[containerId];
            if (container == null) {
                logger.log(containerId + " no such item in database.", LogTextColor_1.LogTextColor.RED);
                return;
            }
            if (this.modConfig.removeAllFilters) {
                container._props.Grids[0]._props.filters = [];
                return;
            }
            if (this.modConfig[container._id].removeFilters) {
                logger.log("Removing " + this.modConfig[container._id].name + "'s filters, make sure this loads after all item mods.", LogTextColor_1.LogTextColor.YELLOW);
                container._props.Grids[0]._props.filters = [];
                return;
            }
            if (this.modConfig[container._id].Filter[0] != null) {
                //logger.log(this.modConfig[container._id].Filter[0] + " count.", LogTextColor.GRAY);
                this.removeItemsFromExcludedFilter(container);
                this.addItemsToAcceptedFilter(container);
            }
            if (this.modConfig[container._id].ExcludedFilter[0] != null) {
                //logger.log(this.modConfig[container._id].Filter[0] + " count.", LogTextColor.GRAY);
                this.removeItemsFromAcceptedFilter(container);
                this.addItemsToExcludedFilter(container);
            }
            if (this.modConfig[container._id].Filter[0] == null &&
                this.modConfig[container._id].ExcludedFilter[0] == null) {
                logger.log(container._name + " no changes in file.", LogTextColor_1.LogTextColor.GRAY);
                return;
            }
            //this.removeItemsFromExcludedFilter(container);
            // this.removeItemsFromAcceptedFilter(container);
            // this.addItemsToExcludedFilter(container);
            //this.addItemsToAcceptedFilter(container);
            logger.log(container._name + " filters have been updated.", LogTextColor_1.LogTextColor.YELLOW);
        });
        logger.log(`${this.modLabel} Load Successful...`, LogTextColor_1.LogTextColor.GREEN);
    }
    // Removes items from cases excluded filter if they are listed in the mods excluded array
    removeItemsFromExcludedFilter(container) {
        const itemProps = container._props;
        const itemId = container._id;
        this.modConfig[itemId]?.Filter.forEach(element => {
            if (this.items[element] == null) {
                this.logger.log(element + " no such item in database.", LogTextColor_1.LogTextColor.RED);
                return;
            }
            if (this.modConfig.enableLogging)
                this.logger.log(element.toString(), LogTextColor_1.LogTextColor.YELLOW);
            try {
                const filters = itemProps.Grids[0]._props.filters;
                if (filters[0]?.ExcludedFilter) {
                    // Finds item location in array by string
                    const numb = filters[0]?.ExcludedFilter.indexOf(element);
                    if (this.modConfig.enableLogging)
                        this.logger.log(numb.toString(), LogTextColor_1.LogTextColor.GREEN);
                    if (numb >= 0) {
                        // splice is used to delete item at array location
                        const testItem = filters[0]?.ExcludedFilter.splice(numb, 1);
                        if (this.modConfig.enableLogging)
                            this.logger.log(testItem + " deleted", LogTextColor_1.LogTextColor.WHITE);
                    }
                    else {
                        if (this.modConfig.enableLogging)
                            this.logger.log(element + " not in items filter.", LogTextColor_1.LogTextColor.WHITE);
                    }
                    if (this.modConfig.enableLogging)
                        this.logger.log("Modified  " + this.modConfig[itemId]?.name + "'s excluded filter", LogTextColor_1.LogTextColor.GRAY);
                }
            }
            catch {
                if (this.modConfig.enableLogging)
                    this.logger.log("Failed to remove items", LogTextColor_1.LogTextColor.RED);
            }
        });
    }
    // Removes items from cases accepted filter if they are listed in the mods excluded array
    removeItemsFromAcceptedFilter(container) {
        const itemProps = container._props;
        const itemId = container._id;
        this.modConfig[itemId]?.ExcludedFilter.forEach(element => {
            if (this.items[element] == null) {
                this.logger.log(element + " no such item in database.", LogTextColor_1.LogTextColor.RED);
                return;
            }
            if (this.modConfig.enableLogging)
                this.logger.log(element.toString(), LogTextColor_1.LogTextColor.YELLOW);
            try {
                const filters = itemProps.Grids[0]._props.filters;
                if (filters[0]?.Filter) {
                    // Finds item location in array by string
                    const numb = filters[0]?.Filter.indexOf(element);
                    if (numb >= 0) {
                        // splice is used to delete item at array location
                        const testItem = filters[0]?.Filter.splice(numb, 1);
                        if (this.modConfig.enableLogging)
                            this.logger.log(testItem + " deleted", LogTextColor_1.LogTextColor.WHITE);
                    }
                    else {
                        if (this.modConfig.enableLogging)
                            this.logger.log(element + " not in items filter.", LogTextColor_1.LogTextColor.WHITE);
                    }
                    if (this.modConfig.enableLogging)
                        this.logger.log("Modified  " + this.modConfig[itemId]?.name + "'s allowed filter", LogTextColor_1.LogTextColor.GRAY);
                }
            }
            catch {
                if (this.modConfig.enableLogging)
                    this.logger.log("Failed to remove items", LogTextColor_1.LogTextColor.RED);
            }
        });
    }
    // Adds items to a cases excluded filter if they are listed in the mods excluded array
    addItemsToExcludedFilter(container) {
        const itemProps = container._props;
        const itemId = container._id;
        this.modConfig[itemId]?.ExcludedFilter.forEach(element => {
            if (this.items[element] == null) {
                this.logger.log(element + " no such item in database.", LogTextColor_1.LogTextColor.RED);
                return;
            }
            if (this.modConfig.enableLogging)
                this.logger.log(element.toString(), LogTextColor_1.LogTextColor.YELLOW);
            try {
                const filters = itemProps.Grids[0]._props.filters;
                if (filters[0]?.ExcludedFilter) {
                    if (this.modConfig[itemId]?.ExcludedFilter.length >= 1) {
                        filters[0]?.ExcludedFilter.push(element);
                        if (this.modConfig.enableLogging)
                            this.logger.log(element + " added", LogTextColor_1.LogTextColor.WHITE);
                    }
                    else {
                        if (this.modConfig.enableLogging)
                            this.logger.log("No items in mods excluded filter.", LogTextColor_1.LogTextColor.WHITE);
                    }
                    if (this.modConfig.enableLogging)
                        this.logger.log("Modified  " + this.modConfig[itemId]?.name + "'s excluded filter", LogTextColor_1.LogTextColor.GRAY);
                }
            }
            catch {
                if (this.modConfig.enableLogging)
                    this.logger.log("Failed to remove items", LogTextColor_1.LogTextColor.RED);
            }
        });
    }
    // Adds items to a cases accepted filter if they are listed in the mods accepted array
    addItemsToAcceptedFilter(container) {
        const itemProps = container._props;
        const itemId = container._id;
        this.modConfig[itemId]?.Filter.forEach(element => {
            if (this.items[element] == null) {
                this.logger.log(element + " no such item in database.", LogTextColor_1.LogTextColor.RED);
                return;
            }
            if (this.modConfig.enableLogging)
                this.logger.log(element.toString(), LogTextColor_1.LogTextColor.YELLOW);
            try {
                const filters = itemProps.Grids[0]._props.filters;
                if (filters[0]?.Filter) {
                    if (this.modConfig[itemId]?.Filter.length >= 1) {
                        filters[0]?.Filter.push(element);
                        if (this.modConfig.enableLogging)
                            this.logger.log(element + " added", LogTextColor_1.LogTextColor.WHITE);
                    }
                    else {
                        if (this.modConfig.enableLogging)
                            this.logger.log("No items in mods filter.", LogTextColor_1.LogTextColor.WHITE);
                    }
                    if (this.modConfig.enableLogging)
                        this.logger.log("Modified  " + this.modConfig[itemId]?.name + "'s allowed filter", LogTextColor_1.LogTextColor.GRAY);
                }
            }
            catch {
                if (this.modConfig.enableLogging)
                    this.logger.log("Failed to remove items", LogTextColor_1.LogTextColor.RED);
            }
        });
    }
}
exports.mod = new AdjustableContainerFilters();
//# sourceMappingURL=mod.js.map