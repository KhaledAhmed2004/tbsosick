"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Helper to recursively transform keys to camelCase and alias _id to id
const snakeToCamel = (str) => str.replace(/(_\w)/g, m => m[1].toUpperCase());
const formatData = (obj) => {
    if (Array.isArray(obj)) {
        return obj.map(v => formatData(v));
    }
    else if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
        return Object.keys(obj).reduce((result, key) => {
            let value = obj[key];
            // Recursive call for nested objects/arrays
            value = formatData(value);
            // Alias _id to id
            let newKey = key === '_id' ? 'id' : key;
            // Convert snake_case to camelCase (e.g., user_name -> userName)
            newKey = snakeToCamel(newKey);
            result[newKey] = value;
            return result;
        }, {});
    }
    return obj;
};
const sendResponse = (res, data) => {
    // 👇 store full response data for logger middleware
    res.locals.responsePayload = data;
    const resData = {
        success: data.success,
        statusCode: data.statusCode,
        message: data.message,
        meta: data.meta,
        data: data.data ? formatData(data.data) : data.data,
    };
    res.status(data.statusCode).json(resData);
};
exports.default = sendResponse;
