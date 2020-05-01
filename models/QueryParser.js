const FileParser = require('./FileParser');

class QueryParser {

    // Covnerts a pulic api query to a postgresql query
    static publicAPIQueryToDatabaseQuery(query, requireQuery, PROHIBITED_FIELDS, ALLOWED_OPERATORS, OPERATORS_WITH_VALUE, ARRAY_FIELDS, API_DATABASE_MAPPING_QUERY) {

        // Padding out (, ) for easier detection
        query = query.replace(/\(/gi, '( ');
        query = query.replace(/\)/gi, ' )');
        query = query.replace(/'/gi, '"');

        // Remove double spaces
        query = query.replace(/ +(?= )/g,'');

        // Convert ands and ors to uppercase
        query = query.replace(/ and /gi, ' AND ');
        query = query.replace(/ or /gi, ' OR ');

        let currentlyCaptured = "";
        let position = -1;
        let chars = query.split('');

        let conditions = [];
        let currentCondition = {}
        let currentlyLookingFor = "field";

        while (chars.length !== 0) {

            position++;

            let char = chars.splice(0, 1)[0];
            // console.log("Next char: " + char);

            if (char !== " ") {
                currentlyCaptured += char;
            }

            if (char === " ") {

                console.log("@@ Loogking for: " + currentlyLookingFor + " Token: " + currentlyCaptured);

                if (["(", ")", "AND", "OR"].indexOf(currentlyCaptured) > -1) {
                    console.log("Ignoring " + currentlyCaptured)
                    currentlyCaptured = "";
                } else if (currentlyLookingFor === "field") {
                    // Matching field

                    // Not a searchalbe field (would need additional queries)
                    if (PROHIBITED_FIELDS.indexOf(currentlyCaptured) > -1) {
                        return { success: false, data: currentlyCaptured + " is not a searchable field" };
                    }

                    // Not a valid field
                    if (!API_DATABASE_MAPPING_QUERY[currentlyCaptured]) {
                        return { success: false, data: currentlyCaptured + " is not a valid field" };
                    }

                    // Next look for operator
                    currentlyLookingFor = "operator";
                    // Rewrite api to database fields
                    currentCondition.apiField = currentlyCaptured;
                    currentCondition.field = API_DATABASE_MAPPING_QUERY[currentlyCaptured];

                // Looking for the operator
                } else if (currentlyLookingFor === "operator") {

                    if (ALLOWED_OPERATORS[currentlyCaptured]) {

                        // Save the operator
                        currentCondition.operator = currentlyCaptured;

                        let allowedFieldsForOperator = ALLOWED_OPERATORS[currentlyCaptured];

                        if (allowedFieldsForOperator.indexOf(currentCondition.apiField) === -1) {
                            return { success: false, data: currentlyCaptured + " is not a valid opearator for " + currentCondition.apiField };
                        }

                        // Need a value as well
                        if (OPERATORS_WITH_VALUE.indexOf(currentlyCaptured) > -1) {

                            currentlyLookingFor = "value";

                        } else {
                            // conditions.push(JSON.parse(JSON.stringify(currentCondition)));
                            // currentCondition = {};
                            // currentlyLookingFor = "field";
                        }

                    } else {
                        return { success: false, data: currentlyCaptured + " is not a valid operator" };
                    }

                // Looking for value
                } else if (currentlyLookingFor === "value") {

                    if (currentlyCaptured === `""`) {
                        return { success: false, data: "Empty field value" };
                    }

                    if (currentlyCaptured.length < 3) {
                        return { success: false, data: "Invalid value " + currentlyCaptured };
                    }

                    // Ensuring it's quoted
                    if (currentlyCaptured[0] !== "\"") {
                        return { success: false, data: currentlyCaptured + " value has to be quoted" };
                    }

                    if (currentlyCaptured[currentlyCaptured.length-1] !== "\"") {
                        currentlyCaptured += " "
                        console.log("not \", keep searching for endning");
                        continue;
                    }

                    currentCondition.value = currentlyCaptured.substr(1, currentlyCaptured.length-2);

                    // have to make sure number is provided
                    if (currentCondition.field.toLowerCase().indexOf("id") !== -1) {
                        // let intValue = parseInt(currentCondition.value);
                        if (isNaN(currentCondition.value)) {
                            return { success: false, data: currentCondition.apiField + " has to be a number, " + currentlyCaptured.substr(1, currentlyCaptured.length-2) + " found" };
                        }
                    }

                    // Rewriting query wtih all lowercase values
                    query = query.replace(currentCondition.value, currentCondition.value.toLowerCase());
                    currentCondition.value = currentCondition.value.toLowerCase();

                    conditions.push(JSON.parse(JSON.stringify(currentCondition)));
                    currentCondition = {};
                    currentlyLookingFor = "field";

                }

                currentlyCaptured = ""

            }

        }

        if (conditions.length === 0) {

            // if (requireQuery) {
                return { success: false, data: "No conditions detected" };
            // }

        } else {

            // Replace "value" with 'value'
            query = query.replace(/"/gi, "'");

            for (let i = 0; i < conditions.length; i++) {

                let condition = conditions[i];

                // TODO support is null if needed
                let apiCondition = condition.apiField + " " + condition.operator + " '" + condition.value + "'"
                let sqlCondition;

                if (condition.operator === "=") {
                    sqlCondition = `LOWER("${condition.field}") = '${condition.value}'`
                } else if (condition.operator === "!=") {
                    sqlCondition = `LOWER("${condition.field}") <> '${condition.value}'`
                } else if ( (condition.operator === "contains") || (condition.operator === "!contains") ) {

                    let sqlConditionOperator = (condition.operator === "!contains") ? "NOT LIKE" : "LIKE"

                    if (ARRAY_FIELDS.indexOf(condition.field) > -1) {
                        sqlCondition = `LOWER("${condition.field}"::text) ${sqlConditionOperator} '%${condition.value}%'`
                    } else {
                        sqlCondition = `LOWER("${condition.field}") ${sqlConditionOperator} '%${condition.value}%'`
                    }

                } else {
                    return { success: false, data: "Unknown operator " + condition.operator };
                }

                if ( (condition.field === "id") || (condition.field === "datasetId") || (condition.field === "userId") ) {
                    sqlCondition = sqlCondition.replace(`LOWER("${condition.field}")`, `"${condition.field}"`)
                }

                console.log("Condition " + i + ": " + apiCondition + " -> " + sqlCondition);

                let conditionPosition = query.indexOf(apiCondition);

                if (conditionPosition === -1) {
                    console.log(query);
                    return { success: false, data: "Failed to rewrite api conditions to sql conditions" };
                }

                query = query.replace(apiCondition, sqlCondition);

            }

        }

        return {
            success: true,
            data: query
        };

    }

    // Returns whether the given root query object and string is match or not
    static compile(entity, query) {

        let res = this.parseRuleSet(query.combinator, query.rules, entity);

        return res;

    }

    // Returns whether the given nested query object and string is match or not
    static parseRuleSet(combinator, rules, entity) {

        let ruleSetResults = [];
        let rootRuleSetResults = [];
        let rule;

        for (let i = 0; i < rules.length; i++) {

            rule = rules[i];

            if (rule.combinator) {
                rootRuleSetResults.push(this.parseRuleSet(rule.combinator, rule.rules, entity));
            } else {
                ruleSetResults.push(this.parseRule(rule, entity));
            }

        }

        if (rule.combinator) {

            // console.log("rootRuleSetResults: ", rootRuleSetResults);

            if (combinator === "and") {
                return this.isAllTrue(rootRuleSetResults);
            } else if (combinator === "or") {
                return this.isAnyTrue(rootRuleSetResults);
            }

        } else {

            // console.log("ruleSetResults: ", ruleSetResults);

            if (combinator === "and") {
                return this.isAllTrue(ruleSetResults);
            } else if (combinator === "or") {
                return this.isAnyTrue(ruleSetResults);
            }

        }

    }

    // Matches a single object rule against the given string
    static parseRule(rule, entity) {

        // console.log("  == parseRule() ==");

        switch (rule.operator) {

            case "contains":
                return this.doesContain(FileParser.resolveNestedObjectField(entity, rule.field), rule.value)
                break;

            case "!contains":
                return this.doesNotContain(FileParser.resolveNestedObjectField(entity, rule.field), rule.value)
                break;

            case "=":
                return this.isEqual(FileParser.resolveNestedObjectField(entity, rule.field), rule.value)
                break;

            case "!=":
                return this.isNotEqual(FileParser.resolveNestedObjectField(entity, rule.field), rule.value)
                break;

            case "<":
                return this.isLess(FileParser.resolveNestedObjectField(entity, rule.field), rule.value)
                break;

            case "<=":
                return this.isLessEqual(FileParser.resolveNestedObjectField(entity, rule.field), rule.value)
                break;

            case ">":
                return this.isMore(FileParser.resolveNestedObjectField(entity, rule.field), rule.value)
                break;

            case ">=":
                return this.isMoreEqual(FileParser.resolveNestedObjectField(entity, rule.field), rule.value)
                break;

            case "null":
                return this.isNull(FileParser.resolveNestedObjectField(entity, rule.field))
                break;

            case "!null":
                return this.isNotNull(FileParser.resolveNestedObjectField(entity, rule.field))
                break;

            default:
                console.error("Unknown operator")
                break;

        }

        return true

    }

    // Checks whether all results are a match (AND)
    static isAllTrue(arr) {
        for (let i = 0; i < arr.length; i++) {
            if (!arr[i]) {
                return false;
            }
        }
        return true;
    }

    // Checks whether any results are a match (OR)
    static isAnyTrue(arr) {
        for (let i = 0; i < arr.length; i++) {
            if (arr[i]) {
                return true;
            }
        }
        return false;
    }

    // Checks whether a value is null
    static isNull(entityValue) {
        if (typeof entityValue === "string")
            entityValue = entityValue.trim();
        return (entityValue === "" || entityValue === "null" || entityValue === null || entityValue === "undefined" || entityValue === undefined)
    }

    // Checks whether a value is not null
    static isNotNull(entityValue) {
        if (typeof entityValue === "string")
            entityValue = entityValue.trim();
        return (entityValue !== "" && entityValue !== "null" && entityValue !== null && entityValue !== "undefined" && entityValue !== undefined)
    }

    // Checks whether the given string contains another given string
    static doesContain(entityValue, desiredValue) {
        // console.log(desiredValue + " in " + entityValue + "? : " + (entityValue.toLowerCase().indexOf(desiredValue) > -1))
        if (!entityValue || !desiredValue) return false;
        return entityValue.toLowerCase().indexOf(desiredValue.toLowerCase()) > -1
    }

    // Checks whether the given string does not contain another given string
    static doesNotContain(entityValue, desiredValue) {
        // console.log(desiredValue + " in " + entityValue + "? : " + (entityValue.toLowerCase().indexOf(desiredValue) > -1))
        if (!entityValue || !desiredValue) return false;
        return entityValue.toLowerCase().indexOf(desiredValue.toLowerCase()) === -1
    }

    // Checks whether two values are the same
    static isEqual(entityValue, desiredValue) {
        // console.log(desiredValue + " = " + entityValue + "? : " + (entityValue.toLowerCase() === desiredValue.toLowerCase()))
        if (!entityValue || !desiredValue) return false;
        return entityValue.toLowerCase() === desiredValue.toLowerCase();
    }

    // Checks whether two values are not the same
    static isNotEqual(entityValue, desiredValue) {
        // console.log(desiredValue + " = " + entityValue + "? : " + (entityValue.toLowerCase() === desiredValue.toLowerCase()))
        if (!entityValue || !desiredValue) return false;
        return entityValue.toLowerCase() !== desiredValue.toLowerCase();
    }

    // Checks whether the given string is less than another given string
    static isLess(entityValue, desiredValue) {
        if (!entityValue || !desiredValue) return false;
        return parseInt(entityValue) < parseInt(desiredValue)
    }

    // Checks whether the given string is less or equal than another given string
    static isLessEqual(entityValue, desiredValue) {
        if (!entityValue || !desiredValue) return false;
        return parseInt(entityValue) <= parseInt(desiredValue)
    }

    // Checks whether the given string is more than another given string
    static isMore(entityValue, desiredValue) {
        if (!entityValue || !desiredValue) return false;
        return parseInt(entityValue) > parseInt(desiredValue)
    }

    // Checks whether the given string is more than or equal another given string
    static isMoreEqual(entityValue, desiredValue) {
        if (!entityValue || !desiredValue) return false;
        return parseInt(entityValue) >= parseInt(desiredValue)
    }

}

module.exports = QueryParser;
